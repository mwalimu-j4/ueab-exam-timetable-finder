import * as pdfjsLib from 'pdfjs-dist';

type TextItem = {
  str: string;
  hasEOL?: boolean;
};

export interface ParsedExam {
  date: Date;
  dayName: string;
  start: string;
  end: string;
  code: string;
  title: string;
  option?: string;
  instructor?: string;
  building?: string;
  venue?: string;
  rows?: number;
  students?: number;
}

export interface ParseResult {
  exams: ParsedExam[];
  unparsedLines: string[];
}

const OPTIONS = ['Main', 'Group A', 'Group B', 'Group C', 'Group D', 'Inter Session 1', 'Inter Session 2', 'Blended Online'];

export async function parseTimetablePDF(buffer: Buffer): Promise<ParseResult> {
  const exams: ParsedExam[] = [];
  const unparsedLines: string[] = [];

  try {
    const data = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({
      data,
      disableFontFace: true,
      useSystemFonts: false,
      useWorkerFetch: false,
      isEvalSupported: false,
      // Some timetable PDFs contain malformed TrueType hinting instructions.
      // PDF.js can recover from these while extracting text, so don't turn
      // recoverable font warnings into noisy upload logs.
      verbosity: 0,
    }).promise;

    let allText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => {
          if (!('str' in item)) {
            return '';
          }

          const textItem = item as TextItem;
          return `${textItem.str}${textItem.hasEOL ? '\n' : ' '}`;
        })
        .join('')
        .replace(/[ \t]+\n/g, '\n');
      allText += pageText + '\n';
    }

    const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const seenExams = new Set<string>();

    // Parse each extracted line. PDF text extraction varies between browsers and
    // generators, so accept common UEAB timetable row shapes and dedupe rows.
    for (const rawLine of lines) {
      const line = normalizeLine(rawLine);
      const parsedExam = parseTimetableLine(line);

      if (parsedExam) {
        const key = [
          parsedExam.date.toISOString().slice(0, 10),
          parsedExam.start,
          parsedExam.end,
          normalizeCourseCode(parsedExam.code),
          parsedExam.title.toLowerCase(),
        ].join('|');

        if (!seenExams.has(key)) {
          seenExams.add(key);
          exams.push(parsedExam);
        }
      } else if (line.length > 10) {
        const hasDatePattern = /\d{1,2}\s*[-\/ ]\s*\d{1,2}\s*[-\/ ]\s*\d{4}/.test(line);
        if (hasDatePattern) {
          unparsedLines.push(line);
        }
      }
    }
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { exams, unparsedLines };
}

function normalizeLine(value: string): string {
  return value
    .replace(/[\u00a0\t]+/g, ' ')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCourseCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function parseTimetableLine(line: string): ParsedExam | null {
  if (/final exam timetable|with venues|university of eastern africa|^date\b|^day\b/i.test(line)) {
    return null;
  }

  const daySource = '(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)';
  const dateSource = '(\\d{1,2})\\s*[-\\/ ]\\s*(\\d{1,2})\\s*[-\\/ ]\\s*(\\d{4})';
  const timeSource = '(\\d{1,2}:\\d{2}\\s*(?:AM|PM)?)';
  const codeSource = '([A-Z]{2,6}\\s*-?\\s*\\d{3,4}\\s*[A-Z]?)';
  const patterns = [
    new RegExp('^' + daySource + '\\s+' + dateSource + '\\s+' + timeSource + '\\s*(?:-|to)?\\s+' + timeSource + '\\s+' + codeSource + '\\s+(.+)$', 'i'),
    new RegExp('^' + dateSource + '\\s+' + daySource + '\\s+' + timeSource + '\\s*(?:-|to)?\\s+' + timeSource + '\\s+' + codeSource + '\\s+(.+)$', 'i'),
    new RegExp('^' + daySource + '\\s+' + dateSource + '\\s+' + codeSource + '\\s+' + timeSource + '\\s*(?:-|to)?\\s+' + timeSource + '\\s+(.+)$', 'i')
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (!match) continue;

    const parsed = buildExamFromMatch(match);
    if (parsed) return parsed;
  }

  return null;
}

function buildExamFromMatch(match: RegExpMatchArray): ParsedExam | null {
  const first = match[1];
  const startsWithDay = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)$/i.test(first);
  const codeFirstPattern = match.length === 9 && /^[A-Z]{2,6}\s*-?\s*\d{3,4}\s*[A-Z]?$/i.test(match[5]);

  let dayName: string;
  let day: number;
  let month: number;
  let year: number;
  let start: string | null;
  let end: string | null;
  let code: string;
  let remainder: string;

  if (startsWithDay && codeFirstPattern) {
    dayName = normalizeDayName(match[1]);
    day = Number(match[2]);
    month = Number(match[3]);
    year = Number(match[4]);
    code = match[5];
    start = normalizeTime(match[6]);
    end = normalizeTime(match[7]);
    remainder = match[8];
  } else if (startsWithDay) {
    dayName = normalizeDayName(match[1]);
    day = Number(match[2]);
    month = Number(match[3]);
    year = Number(match[4]);
    start = normalizeTime(match[5]);
    end = normalizeTime(match[6]);
    code = match[7];
    remainder = match[8];
  } else {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
    dayName = normalizeDayName(match[4]);
    start = normalizeTime(match[5]);
    end = normalizeTime(match[6]);
    code = match[7];
    remainder = match[8];
  }

  if (!start || !end) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== day || date.getUTCMonth() !== month - 1) {
    return null;
  }

  const details = parseExamDetails(remainder);

  return {
    date,
    dayName,
    start,
    end,
    code: code.replace(/\s+/g, ' ').replace(/\s*-\s*/g, '').trim().toUpperCase(),
    title: details.title,
    option: details.option,
    instructor: details.instructor,
    building: details.building,
    venue: details.venue,
    rows: details.rows,
    students: details.students
  };
}

function parseExamDetails(value: string): { title: string; option?: string; instructor?: string; building?: string; venue?: string; rows?: number; students?: number } {
  let text = normalizeLine(value);
  let rows: number | undefined;
  let students: number | undefined;

  const numbers = text.match(/\b(\d{1,4})\s+(\d{1,4})\s*$/);
  if (numbers) {
    rows = Number(numbers[1]);
    students = Number(numbers[2]);
    text = text.slice(0, numbers.index).trim();
  }

  let option: string | undefined;
  for (const opt of OPTIONS) {
    if (text.toLowerCase().includes(opt.toLowerCase())) {
      option = opt;
      text = text.replace(new RegExp(opt, 'i'), ' ').trim();
      break;
    }
  }

  let instructor: string | undefined;
  const instructorMatch = text.match(/\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][A-Za-z'.-]*(?:\s+[A-Z][A-Za-z'.-]*){0,3}\b/);
  if (instructorMatch) {
    instructor = instructorMatch[0].trim();
    text = (text.slice(0, instructorMatch.index).trim() + ' ' + text.slice((instructorMatch.index || 0) + instructorMatch[0].length).trim()).trim();
  }

  return { title: text || 'Unknown', option, instructor, rows, students };
}

function normalizeDayName(value: string): string {
  const lower = value.toLowerCase();
  if (lower.startsWith('mon')) return 'Monday';
  if (lower.startsWith('tue')) return 'Tuesday';
  if (lower.startsWith('wed')) return 'Wednesday';
  if (lower.startsWith('thu')) return 'Thursday';
  if (lower.startsWith('fri')) return 'Friday';
  if (lower.startsWith('sat')) return 'Saturday';
  return 'Sunday';
}

function normalizeTime(value: string): string | null {
  const match = value.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];

  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
}
