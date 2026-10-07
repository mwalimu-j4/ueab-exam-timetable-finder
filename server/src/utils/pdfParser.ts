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

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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

    // Detect and remove repeated headers
    const headerPatterns = new Map<string, number>();
    lines.forEach(line => {
      const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{2})[\s\-]*(\d{2})[\s\-]*(\d{4})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+([A-Z]{2,4}\s?\d{3,4}[A-Z]?)/);
      if (match) {
        const key = `${match[1]}-${match[2]}-${match[3]}-${match[4]}-${match[5]}-${match[6]}-${match[7]}`;
        headerPatterns.set(key, (headerPatterns.get(key) || 0) + 1);
      }
    });

    const repeatedHeaders = new Set(
      Array.from(headerPatterns.entries())
        .filter(([_, count]) => count >= 3)
        .map(([key]) => key)
    );

    // Parse each line
    for (const line of lines) {
      const match = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{2})[\s\-]*(\d{2})[\s\-]*(\d{4})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})\s+([A-Z]{2,4}\s?\d{3,4}[A-Z]?)\s+(.*)$/);

      if (match) {
        const [_, dayName, day, month, year, start, end, code, remainder] = match;
        const headerKey = `${dayName}-${day}-${month}-${year}-${start}-${end}-${code}`;

        if (repeatedHeaders.has(headerKey)) {
          continue; // Skip repeated header
        }

        try {
          const date = new Date(`${year}-${month}-${day}`);
          if (isNaN(date.getTime())) {
            unparsedLines.push(line);
            continue;
          }

          // Parse remainder
          let remainingText = remainder.trim();
          let option: string | undefined;
          let instructor: string | undefined;
          let building: string | undefined;
          let venue: string | undefined;
          let rows: number | undefined;
          let students: number | undefined;

          // Extract option
          for (const opt of OPTIONS) {
            if (remainingText.includes(opt)) {
              option = opt;
              remainingText = remainingText.replace(opt, '|OPTION|');
              break;
            }
          }

          // Extract instructor
          const instructorMatch = remainingText.match(/(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
          if (instructorMatch) {
            instructor = instructorMatch[0].trim();
            remainingText = remainingText.replace(instructorMatch[0], '|INSTRUCTOR|');
          }

          // Extract numbers (rows and students)
          const numbers = remainingText.match(/\b(\d+)\b/g);
          if (numbers && numbers.length >= 2) {
            rows = parseInt(numbers[numbers.length - 2], 10);
            students = parseInt(numbers[numbers.length - 1], 10);
            remainingText = remainingText.replace(/\b\d+\b/g, '|NUMBER|');
          }

          // Split remainder into parts
          const parts = remainingText.split('|').map(p => p.trim()).filter(p => p && p !== 'OPTION' && p !== 'INSTRUCTOR' && p !== 'NUMBER');

          // Title is typically the first substantial part
          const title = parts[0] || 'Unknown';
          
          // Building and venue are usually the last parts if present
          if (parts.length > 1) {
            building = parts[parts.length - 2] || undefined;
            venue = parts[parts.length - 1] || undefined;
          }

          exams.push({
            date,
            dayName,
            start,
            end,
            code: code.trim(),
            title: title.trim(),
            option,
            instructor,
            building,
            venue,
            rows,
            students,
          });
        } catch (error) {
          unparsedLines.push(line);
        }
      } else if (line.length > 10) {
        // Only track substantial lines that couldn't be parsed
        const hasDatePattern = /\d{2}[\s\-]*\d{2}[\s\-]*\d{4}/.test(line);
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
