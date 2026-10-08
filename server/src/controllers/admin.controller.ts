import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { comparePassword, generateToken } from '../services/auth.service';
import {
  createTimetableVersion,
  bulkCreateExams,
  publishTimetableVersion,
  getAllVersions,
  deleteVersion,
} from '../services/timetable.service';
import { extractTimetableText, ParsedExam } from '../utils/pdfParser';
import { normalizeUeabLine, parseUeabTimetable } from '../utils/parsers/ueabTimetableParser';
import { deleteTimetablePdf, uploadTimetablePdf } from '../services/cloudinary.service';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, admin.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: admin.id, email: admin.email });

    res.json({ token, email: admin.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function uploadTimetable(req: Request, res: Response) {
  const memStart = process.memoryUsage();
  const startTime = Date.now();
  let stage = 'validation';

  try {
    console.log('[upload] timetable handler started', {
      hasFile: Boolean(req.file),
      fileName: req.file?.originalname,
      mimeType: req.file?.mimetype,
      bytes: req.file?.size,
      name: req.body?.name,
      memoryMB: {
        rss: (memStart.rss / 1024 / 1024).toFixed(2),
        heap: (memStart.heapUsed / 1024 / 1024).toFixed(2),
      },
    });

    if (!req.file) {
      console.error('[upload] rejected: no file found on request');
      return res.status(400).json({ error: 'No file uploaded. Send the PDF in the "file" form field.' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    if (req.file.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must not exceed 15MB' });
    }

    // EXTRACT PDF TEXT ONCE
    stage = 'extraction';
    console.log('[upload] PDF extraction started', { bytes: req.file.size });
    const extractStart = Date.now();
    
    let rawText: string;
    try {
      rawText = await extractTimetableText(req.file.buffer);
    } catch (extractError) {
      console.error('[upload] PDF extraction failed', extractError);
      return res.status(500).json({ 
        error: 'Failed to extract text from PDF', 
        stage: 'extraction',
        details: extractError instanceof Error ? extractError.message : String(extractError)
      });
    }

    const extractTime = Date.now() - extractStart;
    const memAfterExtract = process.memoryUsage();
    console.log('[upload] PDF extraction completed', {
      extractTimeMs: extractTime,
      textLength: rawText.length,
      memoryMB: {
        rss: (memAfterExtract.rss / 1024 / 1024).toFixed(2),
        heap: (memAfterExtract.heapUsed / 1024 / 1024).toFixed(2),
      },
    });

    // PARSE WITH OLD PARSER FIRST (it gets the pre-extracted text)
    stage = 'parsing-old';
    const parseOldStart = Date.now();
    let { exams, unparsedLines } = parseTimetablePDFFromText(rawText);
    const parseOldTime = Date.now() - parseOldStart;
    console.log('[upload] Old parser completed', { 
      exams: exams.length, 
      unparsed: unparsedLines.length,
      parseTimeMs: parseOldTime 
    });

    // PARSE WITH NEW PARSER IF NEEDED
    stage = 'parsing-new';
    if (exams.length === 0) {
      const rawLines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
      console.log('[upload] no exams from old parser, trying new parser', {
        totalLineCount: rawLines.length,
        firstUnparsedLines: unparsedLines.slice(0, 15).map(line => JSON.stringify(line)),
      });
    }

    const parseNewStart = Date.now();
    const fallbackResult = parseUeabTimetable(rawText);
    const parseNewTime = Date.now() - parseNewStart;
    
    const memAfterParse = process.memoryUsage();
    console.log('[upload] New parser completed', { 
      exams: fallbackResult.exams.length, 
      unparsed: fallbackResult.unparsed.length,
      parseTimeMs: parseNewTime,
      memoryMB: {
        rss: (memAfterParse.rss / 1024 / 1024).toFixed(2),
        heap: (memAfterParse.heapUsed / 1024 / 1024).toFixed(2),
      },
    });

    if (fallbackResult.exams.length > exams.length) {
      console.log('[upload] using new parser result', {
        oldExams: exams.length,
        newExams: fallbackResult.exams.length,
      });
      exams = fallbackResult.exams;
      unparsedLines = fallbackResult.unparsed;
    }

    // Clear references to allow GC
    rawText = '';

    if (exams.length === 0) {
      const debugUpload = process.env.NODE_ENV !== 'production' || process.env.ADMIN_DEBUG === 'true';
      return res.status(400).json({
        error: 'No valid exam entries found in PDF. The PDF text was extracted, but no timetable rows matched the supported UEAB formats.',
        stage: 'parsing',
        ...(debugUpload ? { sampleUnparsedLines: unparsedLines.slice(0, 5) } : {}),
      });
    }

    stage = 'cloudinary';
    const name = req.body.name || `Upload ${new Date().toISOString()}`;
    const cloudinaryUpload = await uploadTimetablePdf(req.file.buffer, name);
    const sampleRows = exams.slice(0, 20);

    // Clear buffer reference
    req.file.buffer = Buffer.from([]);

    stage = 'database';
    const memBeforeDB = process.memoryUsage();
    console.log('[upload] Starting DB insert', {
      examCount: exams.length,
      memoryMB: {
        rss: (memBeforeDB.rss / 1024 / 1024).toFixed(2),
        heap: (memBeforeDB.heapUsed / 1024 / 1024).toFixed(2),
      },
    });

    try {
      const version = await prisma.$transaction(async (tx) => {
        const createdVersion = await tx.timetableVersion.create({
          data: {
            name,
            pdfUrl: cloudinaryUpload.secure_url,
            rowCount: exams.length,
            isActive: false,
          },
        });

        // BATCH INSERT IN CHUNKS OF 200
        const BATCH_SIZE = 200;
        for (let i = 0; i < exams.length; i += BATCH_SIZE) {
          const batch = exams.slice(i, i + BATCH_SIZE);
          await tx.exam.createMany({
            data: batch.map(exam => ({
              versionId: createdVersion.id,
              date: exam.date,
              dayName: exam.dayName,
              start: exam.start,
              end: exam.end,
              code: exam.code,
              title: exam.title,
              option: exam.option,
              instructor: exam.instructor,
              building: exam.building,
              venue: exam.venue,
              rows: exam.rows,
              students: exam.students,
            })),
          });
          console.log(`[upload] Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted (${i + batch.length}/${exams.length})`);
        }

        return createdVersion;
      }, {
        timeout: 120000, // 2 minutes for DB transaction
      });

      const memAfterDB = process.memoryUsage();
      const totalTime = Date.now() - startTime;
      console.log('[upload] timetable upload completed', {
        versionId: version.id,
        rowCount: exams.length,
        pdfUrl: version.pdfUrl,
        totalTimeMs: totalTime,
        memoryMB: {
          rss: (memAfterDB.rss / 1024 / 1024).toFixed(2),
          heap: (memAfterDB.heapUsed / 1024 / 1024).toFixed(2),
        },
      });

      res.json({
        versionId: version.id,
        rowCount: exams.length,
        sampleRows,
        unparsedLines: unparsedLines.slice(0, 100), // Limit unparsed lines in response
        pdfUrl: version.pdfUrl,
      });
    } catch (error) {
      try {
        await deleteTimetablePdf(cloudinaryUpload.public_id);
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed after database error:', cleanupError);
      }
      throw error;
    }
  } catch (error) {
    console.error('[upload] timetable upload failed', { 
      stage, 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error 
    });
    const message = error instanceof Error ? error.message : 'Upload failed';
    const status = message.includes('Cloudinary') ? 502 : 500;
    res.status(status).json({ 
      error: message, 
      stage,
      ...(process.env.NODE_ENV !== 'production' && error instanceof Error ? { details: error.message } : {})
    });
  }
}

// Helper function to parse from already-extracted text (avoids double extraction)
function parseTimetablePDFFromText(text: string): { exams: ParsedExam[]; unparsedLines: string[] } {
  const exams: ParsedExam[] = [];
  const unparsedLines: string[] = [];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const seenExams = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.replace(/[\u00a0\t]+/g, ' ').replace(/[‐‑‒–—]/g, '-').replace(/\s+/g, ' ').trim();
    const parsedExam = parseTimetableLine(line);

    if (parsedExam) {
      const key = [
        parsedExam.date.toISOString().slice(0, 10),
        parsedExam.start,
        parsedExam.end,
        parsedExam.code.replace(/[^a-z0-9]/gi, '').toLowerCase(),
        parsedExam.title.toLowerCase(),
      ].join('|');

      if (!seenExams.has(key)) {
        seenExams.add(key);
        exams.push(parsedExam);
      }
    } else if (line.length > 10 && /\d{1,2}\s*[-\/ ]\s*\d{1,2}\s*[-\/ ]\s*\d{4}/.test(line)) {
      unparsedLines.push(line);
    }
  }

  return { exams, unparsedLines };
}

function parseTimetableLine(line: string): ParsedExam | null {
  if (/final exam timetable|with venues|university of eastern africa|^date\b|^day\b/i.test(line)) {
    return null;
  }

  // Use bounded regexes only
  const daySource = '(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)';
  const dateSource = '(\\d{1,2})[-\\/](\\d{1,2})[-\\/](\\d{4})';
  const timeSource = '(\\d{1,2}:\\d{2}\\s?(?:AM|PM))';
  const codeSource = '([A-Z]{2,6}\\d{3,4}[A-Z]?)';
  
  const pattern = new RegExp('^' + daySource + '\\s*,?\\s+' + dateSource + '\\s+' + timeSource + '\\s+' + timeSource + '\\s+' + codeSource + '\\s+(.+)$', 'i');
  const match = line.match(pattern);
  
  if (!match) return null;

  const dayName = match[1];
  const day = Number(match[2]);
  const month = Number(match[3]);
  const year = Number(match[4]);
  const start = normalizeTimeSimple(match[5]);
  const end = normalizeTimeSimple(match[6]);
  const code = match[7].replace(/\s+/g, '').toUpperCase();
  const remainder = match[8];

  if (!start || !end) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;

  return {
    date,
    dayName: normalizeDayNameSimple(dayName),
    start,
    end,
    code,
    title: remainder.slice(0, 100), // Simplified for old parser
    option: undefined,
    instructor: undefined,
    building: undefined,
    venue: undefined,
    rows: undefined,
    students: undefined,
  };
}

function normalizeDayNameSimple(value: string): string {
  const lower = value.toLowerCase();
  if (lower.startsWith('mon')) return 'Monday';
  if (lower.startsWith('tue')) return 'Tuesday';
  if (lower.startsWith('wed')) return 'Wednesday';
  if (lower.startsWith('thu')) return 'Thursday';
  if (lower.startsWith('fri')) return 'Friday';
  if (lower.startsWith('sat')) return 'Saturday';
  return 'Sunday';
}

function normalizeTimeSimple(value: string): string | null {
  const match = value.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
}

export async function publishTimetable(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const version = await publishTimetableVersion(id);
    res.json({ message: 'Timetable published successfully', version });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Publish failed' });
  }
}

export async function listTimetables(req: Request, res: Response) {
  try {
    const versions = await getAllVersions();
    res.json(versions);
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to fetch timetables' });
  }
}

export async function deleteTimetable(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteVersion(id);
    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    const status = error instanceof Error && error.message.includes('active') ? 400 : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : 'Delete failed' });
  }
}
