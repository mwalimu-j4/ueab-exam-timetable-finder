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
import { parseTimetablePDF } from '../utils/pdfParser';

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
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    if (req.file.size > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size must not exceed 15MB' });
    }

    const { exams, unparsedLines } = await parseTimetablePDF(req.file.buffer);

    if (exams.length === 0) {
      return res.status(400).json({ error: 'No valid exam entries found in PDF' });
    }

    const name = req.body.name || `Upload ${new Date().toISOString()}`;

    await prisma.$transaction(async (tx) => {
      const version = await tx.timetableVersion.create({
        data: {
          name,
          pdfUrl: undefined,
          rowCount: exams.length,
          isActive: false,
        },
      });

      await tx.exam.createMany({
        data: exams.map(exam => ({
          versionId: version.id,
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

      const sampleRows = exams.slice(0, 20);

      res.json({
        versionId: version.id,
        rowCount: exams.length,
        sampleRows,
        unparsedLines,
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
  }
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
