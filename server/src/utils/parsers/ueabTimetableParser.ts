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

export const KNOWN_BUILDING_CODES = new Set([
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
]);

const BUILDING_CODES_ARRAY = Array.from(KNOWN_BUILDING_CODES);

const HEADER_TEXT = '2025/2026.2 FINAL EXAM TIMETABLE READ CAREFULLY';
const OPTIONS = ['Inter Session 1', 'Inter Session 2', 'Blended Online', 'Group A', 'Group B', 'Group C', 'Group D', 'Main'];
const TITLE_PREFIXES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];

export function parseUeabTimetable(text: string): UeabParseResult {
  const lines = prepareRows(text);
  const exams: ParsedExam[] = [];
  const unparsed: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Safety: skip lines over 400 characters
    if (line.length > 400) {
      unparsed.push(line.slice(0, 100) + '... [line too long]');
      continue;
    }

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

  // TOKEN WALKING - linear parse, no backtracking regexes
  const tokens = line.split(/\s+/);
  if (tokens.length < 8) return null;

  // Check first token is a weekday
  const dayToken = tokens[0].replace(/,$/, '');
  if (!DAY_NAMES[capitalizeDay(dayToken)]) return null;

  // Parse date (tokens[1]): DD-MM-YYYY with flexible spacing
  const dateMatch = tokens[1].match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!dateMatch) return null;
  const [, day, month, year] = dateMatch;
  const date = makeUtcDate(Number(year), Number(month), Number(day));
  if (!date) return null;

  // Parse times (tokens[2] and tokens[3]): HH:MM AM/PM
  const startTime = normalizeTime(tokens[2] + (tokens[3] && /^[AP]M$/i.test(tokens[3]) ? ' ' + tokens[3] : ''));
  let timeEndIndex = 3;
  if (tokens[3] && /^[AP]M$/i.test(tokens[3])) timeEndIndex = 4;
  
  const endTime = normalizeTime(tokens[timeEndIndex] + (tokens[timeEndIndex + 1] && /^[AP]M$/i.test(tokens[timeEndIndex + 1]) ? ' ' + tokens[timeEndIndex + 1] : ''));
  if (!startTime) return null;
  
  let codeIndex = timeEndIndex;
  if (tokens[timeEndIndex + 1] && /^[AP]M$/i.test(tokens[timeEndIndex + 1])) codeIndex = timeEndIndex + 2;
  else codeIndex = timeEndIndex + 1;

  if (!endTime) return null;

  // Parse course code (next token): 3-4 letters + 3 digits + optional letter
  if (codeIndex >= tokens.length) return null;
  const code = tokens[codeIndex];
  if (!/^[A-Z]{3,4}\d{3}[A-Z]?$/i.test(code)) return null;

  // Everything after code is the "tail"
  const tail = tokens.slice(codeIndex + 1).join(' ');
  const fields = parseTailTokens(tokens.slice(codeIndex + 1));

  if (!fields.title) return null;

  return {
    date,
    dayName: DAY_NAMES[capitalizeDay(dayToken)] || dayToken,
    start: startTime,
    end: endTime,
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
  let iterationCount = 0;
  const MAX_ITERATIONS = 100000; // Safety limit

  for (const raw of text.split(/\r?\n/)) {
    iterationCount++;
    if (iterationCount > MAX_ITERATIONS) {
      console.error('[parseUeab] MAX_ITERATIONS exceeded in prepareRows');
      break;
    }

    const line = stripGluedHeader(normalizeUeabLine(raw));
    if (!line || isNoiseLine(line)) continue;

    if (startsDataRow(line)) {
      if (pending) rows.push(pending);
      pending = line;
    } else if (pending) {
      // Join wrapped lines - index ALWAYS advances
      pending = normalizeUeabLine(pending + ' ' + line);
      if (pending.length > 600) {
        // Safety: if joined line gets too long, flush it
        rows.push(pending);
        pending = '';
      }
    } else {
      rows.push(line);
    }
  }

  if (pending) rows.push(pending);
  return rows;
}

function startsDataRow(line: string): boolean {
  // Simple bounded regex check
  return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*,\s*\d{1,2}-\d{1,2}-\d{4}\b/i.test(line);
}

function isNoiseLine(line: string): boolean {
  return line.includes('FINAL EXAM TIMETABLE READ CAREFULLY')
    || /^Date\s+Start/i.test(line)
    || /^(No\.|student|Row)$/i.test(line);
}

function stripGluedHeader(line: string): string {
  const headerIndex = line.indexOf(HEADER_TEXT);
  return headerIndex === -1 ? line : normalizeUeabLine(line.slice(0, headerIndex));
}

// TOKEN WALKING PARSER for tail fields - replaces regex-heavy parseTail
function parseTailTokens(tokens: string[]): TailFields {
  if (tokens.length === 0) return { title: 'Unknown' };

  // Pop trailing tokens from END: student count and row spec
  let students: number | undefined;
  let rowSpec: string | undefined;
  let workingTokens = [...tokens];

  // Check last token for student count (pure digits, 1-4 digits)
  if (workingTokens.length > 0 && /^\d{1,4}$/.test(workingTokens[workingTokens.length - 1])) {
    students = Number(workingTokens.pop()!);
  }

  // Check new last token for row spec (contains digits, dots, commas)
  if (workingTokens.length > 0 && /[\d.,…]+/.test(workingTokens[workingTokens.length - 1])) {
    const maybeRow = workingTokens[workingTokens.length - 1];
    if (/\d/.test(maybeRow) && !/^[A-Z]{2,}/.test(maybeRow)) {
      rowSpec = workingTokens.pop()!;
    }
  }

  // Find option by scanning tokens and checking suffix/prefix
  let optionIndex = -1;
  let option: string | undefined;
  
  for (let i = 0; i < workingTokens.length; i++) {
    const token = workingTokens[i];
    const next = workingTokens[i + 1] || '';
    const prev = i > 0 ? workingTokens[i - 1] : '';
    
    // Check for multi-word options
    if (token === 'Inter' && (next === 'Session' || next.startsWith('Session'))) {
      const sessionNum = workingTokens[i + 2];
      if (sessionNum === '1' || sessionNum === '2') {
        option = 'Inter Session ' + sessionNum;
        optionIndex = i;
        workingTokens.splice(i, 3);
        break;
      }
    } else if (token === 'Blended' && next === 'Online') {
      option = 'Blended Online';
      optionIndex = i;
      workingTokens.splice(i, 2);
      break;
    } else if (token === 'Group' && /^[A-D]$/.test(next)) {
      option = 'Group ' + next;
      optionIndex = i;
      workingTokens.splice(i, 2);
      break;
    } else if (token === 'Main' || prev.endsWith('Main')) {
      // Handle glued "TITLEMain" cases
      if (prev.endsWith('Main')) {
        workingTokens[i - 1] = prev.slice(0, -4);
        option = 'Main';
        optionIndex = i - 1;
      } else {
        option = 'Main';
        optionIndex = i;
        workingTokens.splice(i, 1);
      }
      break;
    }
  }

  // Find instructor (starts with title prefix)
  let instructorStartIndex = -1;
  let instructorEndIndex = -1;
  
  for (let i = 0; i < workingTokens.length; i++) {
    const token = workingTokens[i];
    if (TITLE_PREFIXES.some(prefix => token.startsWith(prefix))) {
      instructorStartIndex = i;
      // Instructor is uppercase name tokens until we hit building code
      for (let j = i; j < workingTokens.length; j++) {
        if (KNOWN_BUILDING_CODES.has(workingTokens[j])) {
          instructorEndIndex = j - 1;
          break;
        }
        // Stop at lowercase or special venue indicators
        if (j > i && /^[a-z]/.test(workingTokens[j]) && !/^[A-Z]{2,}/.test(workingTokens[j])) {
          instructorEndIndex = j - 1;
          break;
        }
      }
      if (instructorEndIndex === -1) instructorEndIndex = workingTokens.length - 1;
      break;
    }
  }

  let instructor: string | undefined;
  if (instructorStartIndex !== -1) {
    instructor = workingTokens.slice(instructorStartIndex, instructorEndIndex + 1).join(' ');
  }

  // Find building code
  let buildingIndex = -1;
  let buildingCode: string | undefined;
  
  for (let i = instructorEndIndex + 1; i < workingTokens.length; i++) {
    if (KNOWN_BUILDING_CODES.has(workingTokens[i])) {
      buildingCode = workingTokens[i];
      buildingIndex = i;
      break;
    }
  }

  // Parse venue
  let building: string | undefined;
  let venue: string | undefined;
  let rawVenueText: string | undefined;

  if (buildingIndex !== -1) {
    rawVenueText = workingTokens.slice(buildingIndex).join(' ');
    const parsed = parseVenue(rawVenueText, buildingCode!);
    building = parsed.building;
    venue = parsed.venue;
  }

  // Title is everything before instructor (or before building if no instructor)
  let titleEndIndex = instructorStartIndex !== -1 ? instructorStartIndex - 1 : buildingIndex !== -1 ? buildingIndex - 1 : workingTokens.length - 1;
  const title = workingTokens.slice(0, titleEndIndex + 1).join(' ').trim() || 'Unknown';

  return {
    title,
    option,
    instructor,
    building,
    venue,
    rawVenueText,
    rowSpec,
    students,
  };
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
