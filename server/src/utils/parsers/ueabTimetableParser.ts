import { ParsedExam } from '../pdfParser';

export type UeabParseResult = {
  exams: ParsedExam[];
  unparsed: string[];
};

type TailFields = {
  title: string;
  option?: string;
  instructor?: string;
  building?: string;
  venue?: string;
  rawVenueText?: string;
  rowSpec?: string;
  students?: number;
};

const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export const KNOWN_BUILDING_CODES = [
  'HUM',
  'AUD',
  'AMP',
  'SCI',
  'SC',
  'FCSC',
  'HOS',
  'SOI',
  'Homec',
  'Library',
];

const HEADER_TEXT = '2025/2026.2 FINAL EXAM TIMETABLE READ CAREFULLY';
const OPTION_PATTERN = /(Inter Session \d|Blended Online|Group [A-Z]|Main)/;
const HEAD = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*,\s*(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}:\d{2}\s?[AP]M)\s+(\d{1,2}:\d{2}\s?[AP]M)\s+([A-Z]{3,4}\d{3}[A-Z]?)\s+(.+)$/i;

export function parseUeabTimetable(text: string): UeabParseResult {
  const lines = prepareRows(text);
  const exams: ParsedExam[] = [];
  const unparsed: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const exam = parseUeabLine(line);
    if (!exam) {
      if (line && !isNoiseLine(line)) unparsed.push(line);
      continue;
    }

    const key = [exam.date.toISOString().slice(0, 10), exam.start, exam.code, exam.option || ''].join('|');
    if (!seen.has(key)) {
      seen.add(key);
      exams.push(exam);
    }
  }

  exams.sort((a, b) => {
    const dateDiff = a.date.getTime() - b.date.getTime();
    return dateDiff !== 0 ? dateDiff : a.start.localeCompare(b.start);
  });

  return { exams, unparsed };
}

export function normalizeUeabLine(value: string): string {
  return value
    .replace(/[\u00a0\u200b\u200c\u200d\ufeff]/g, ' ')
    .replace(/â€¦/g, '...')
    .replace(/…/g, '...')
    .replace(/(\w{3})\s*,\s*/g, '$1, ')
    .replace(/(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})/g, '$1-$2-$3')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseUeabLine(rawLine: string): ParsedExam | null {
  const line = stripGluedHeader(normalizeUeabLine(rawLine));
  if (!line || isNoiseLine(line)) return null;

  const match = line.match(HEAD);
  if (!match) return null;

  const [, dayAbbrev, day, month, year, startDisplay, endDisplay, code, tail] = match;
  const date = makeUtcDate(Number(year), Number(month), Number(day));
  const start = normalizeTime(startDisplay);
  const end = normalizeTime(endDisplay);
  const fields = parseTail(tail);

  if (!date || !start || !end || !code || !fields.title) return null;

  return {
    date,
    dayName: DAY_NAMES[capitalizeDay(dayAbbrev)] || dayAbbrev,
    start,
    end,
    code: code.toUpperCase(),
    title: fields.title,
    option: fields.option,
    instructor: fields.instructor,
    building: fields.building,
    venue: fields.venue || fields.rawVenueText,
    rows: undefined,
    students: fields.students,
  };
}

function prepareRows(text: string): string[] {
  const rows: string[] = [];
  let pending = '';

  for (const raw of text.split(/\r?\n/)) {
    const line = stripGluedHeader(normalizeUeabLine(raw));
    if (!line || isNoiseLine(line)) continue;

    if (startsDataRow(line)) {
      if (pending) rows.push(pending);
      pending = line;
    } else if (pending) {
      pending = normalizeUeabLine(pending + ' ' + line);
    } else {
      rows.push(line);
    }
  }

  if (pending) rows.push(pending);
  return rows;
}

function startsDataRow(line: string): boolean {
  return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*,\s*\d{1,2}-\d{1,2}-\d{4}\b/i.test(line);
}

function isNoiseLine(line: string): boolean {
  return line.includes('FINAL EXAM TIMETABLE READ CAREFULLY')
    || /^Date\s+Start Time/i.test(line)
    || /^(No\. of|student|s|Row)$/i.test(line);
}

function stripGluedHeader(line: string): string {
  const headerIndex = line.indexOf(HEADER_TEXT);
  return headerIndex === -1 ? line : normalizeUeabLine(line.slice(0, headerIndex));
}

function parseTail(value: string): TailFields {
  let text = normalizeUeabLine(value);
  let students: number | undefined;
  let rowSpec: string | undefined;

  const studentMatch = text.match(/\s(\d{1,4})$/);
  if (studentMatch) {
    students = Number(studentMatch[1]);
    text = text.slice(0, studentMatch.index).trim();
  }

  const rowSpecMatch = text.match(/\s([\d,\.\s…]+)$/);
  if (rowSpecMatch && /\d/.test(rowSpecMatch[1])) {
    rowSpec = normalizeUeabLine(rowSpecMatch[1]);
    text = text.slice(0, rowSpecMatch.index).trim();
  }

  const optionMatch = findOption(text);
  if (!optionMatch) return { title: text, students, rowSpec };

  const title = text.slice(0, optionMatch.index).trim();
  const option = optionMatch.option;
  const rest = text.slice(optionMatch.index + option.length).trim();
  const buildingMatch = findBuilding(rest);

  if (!buildingMatch) return { title, option, instructor: rest || undefined, students, rowSpec };

  const instructor = rest.slice(0, buildingMatch.index).trim() || undefined;
  const rawVenueText = rest.slice(buildingMatch.index).trim();
  const venueParts = parseVenue(rawVenueText, buildingMatch.code);

  return { title, option, instructor, building: venueParts.building, venue: venueParts.venue, rawVenueText, rowSpec, students };
}

function findOption(text: string): { option: string; index: number } | null {
  const matches = Array.from(text.matchAll(new RegExp(OPTION_PATTERN, 'g')));
  for (const match of matches) {
    if (match.index === undefined) continue;
    const after = text.slice(match.index + match[0].length).trim();
    if (/^(Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Prof\.?)\s+/i.test(after) || /^[A-Z][A-Z'.,-]+(?:\s+[A-Z][A-Z'.,-]+)*/.test(after)) {
      return { option: match[0], index: match.index };
    }
  }

  const fallback = text.match(OPTION_PATTERN);
  return fallback && fallback.index !== undefined ? { option: fallback[0], index: fallback.index } : null;
}

function findBuilding(text: string): { code: string; index: number } | null {
  const known = KNOWN_BUILDING_CODES
    .map(code => ({ code, index: text.search(new RegExp('\\b' + escapeRegex(code) + '\\b')) }))
    .filter(item => item.index >= 0)
    .sort((a, b) => a.index - b.index)[0];

  if (known) return known;

  const generic = text.match(/\b([A-Z]{2,5})\b(?=\s+[A-Za-z])/);
  return generic && generic.index !== undefined ? { code: generic[1], index: generic.index } : null;
}

function parseVenue(rawVenueText: string, code: string): { building?: string; venue?: string } {
  let value = normalizeUeabLine(rawVenueText);
  if (value.startsWith(code)) value = value.slice(code.length).trim();

  value = dedupeRepeatedVenue(value);
  const split = value.match(/^(.+?[a-z])([A-Z]{2,}\d+[A-Z0-9]*)$/);
  if (split) return { building: normalizeUeabLine(split[1]), venue: split[2] };

  return { building: code, venue: value || undefined };
}

function dedupeRepeatedVenue(value: string): string {
  const compact = value.replace(/\s+/g, '');
  if (compact.length % 2 === 0) {
    const first = compact.slice(0, compact.length / 2);
    const second = compact.slice(compact.length / 2);
    if (first.toLowerCase() === second.toLowerCase()) return value.slice(0, Math.ceil(value.length / 2)).trim();
  }

  const words = value.split(/\s+/).filter(Boolean);
  if (words.length % 2 === 0) {
    const midpoint = words.length / 2;
    const first = words.slice(0, midpoint).join(' ').toLowerCase();
    const second = words.slice(midpoint).join(' ').toLowerCase();
    if (first === second) return words.slice(0, midpoint).join(' ');
  }

  return value;
}

function makeUtcDate(year: number, month: number, day: number): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function normalizeTime(value: string): string | null {
  const match = value.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s?([AP]M)$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3];

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return hour.toString().padStart(2, '0') + ':' + minute.toString().padStart(2, '0');
}

function capitalizeDay(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1, 3).toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
