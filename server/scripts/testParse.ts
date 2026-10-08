import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { extractTimetableText, parseTimetablePDF } from '../src/utils/pdfParser';
import { parseUeabTimetable, normalizeUeabLine } from '../src/utils/parsers/ueabTimetableParser';

function formatBytes(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: npx tsx scripts/testParse.ts "<path-to-pdf>"');
    process.exit(1);
  }

  console.log('[testParse] Starting PDF parse test');
  console.log('[testParse] PDF path:', pdfPath);

  const buffer = fs.readFileSync(pdfPath);
  console.log('[testParse] File size:', formatBytes(buffer.length));

  const memBefore = process.memoryUsage();
  console.log('[testParse] Memory before extraction - RSS:', formatBytes(memBefore.rss), 'Heap:', formatBytes(memBefore.heapUsed));

  // ===== EXTRACTION =====
  const extractStart = performance.now();
  const text = await extractTimetableText(buffer);
  const extractEnd = performance.now();
  const extractTime = extractEnd - extractStart;

  const memAfterExtract = process.memoryUsage();
  console.log('[testParse] Extraction time:', extractTime.toFixed(0), 'ms');
  console.log('[testParse] Memory after extraction - RSS:', formatBytes(memAfterExtract.rss), 'Heap:', formatBytes(memAfterExtract.heapUsed));

  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  console.log('[testParse] Total lines:', lines.length);
  console.log('[testParse] First 15 lines (JSON stringified):');
  lines.slice(0, 15).forEach((line, i) => {
    console.log(`  [${i}]`, JSON.stringify(line));
  });

  // ===== OLD PARSER =====
  console.log('\n[testParse] Testing OLD parser (parseTimetablePDF)...');
  const oldStart = performance.now();
  const oldResult = await parseTimetablePDF(buffer);
  const oldEnd = performance.now();
  const oldTime = oldEnd - oldStart;

  const memAfterOld = process.memoryUsage();
  console.log('[testParse] Old parser time:', oldTime.toFixed(0), 'ms');
  console.log('[testParse] Old parser exams:', oldResult.exams.length);
  console.log('[testParse] Old parser unparsed:', oldResult.unparsedLines.length);
  console.log('[testParse] Memory after old parser - RSS:', formatBytes(memAfterOld.rss), 'Heap:', formatBytes(memAfterOld.heapUsed));
  console.log('[testParse] First 15 unparsed (old):');
  oldResult.unparsedLines.slice(0, 15).forEach((line, i) => {
    console.log(`  [${i}]`, JSON.stringify(line));
  });

  // ===== NEW PARSER (fallback) =====
  console.log('\n[testParse] Testing NEW parser (parseUeabTimetable)...');
  const newStart = performance.now();
  
  // Measure per-line parse time to find slow lines
  const lineTimings: Array<{ line: string; time: number; index: number }> = [];
  const normalizedLines = lines.map((line, index) => {
    const lineStart = performance.now();
    const normalized = normalizeUeabLine(line);
    const lineEnd = performance.now();
    const lineTime = lineEnd - lineStart;
    lineTimings.push({ line: normalized, time: lineTime, index });
    return normalized;
  });
  
  const newResult = parseUeabTimetable(text);
  const newEnd = performance.now();
  const newTime = newEnd - newStart;

  const memAfterNew = process.memoryUsage();
  console.log('[testParse] New parser time:', newTime.toFixed(0), 'ms');
  console.log('[testParse] New parser exams:', newResult.exams.length);
  console.log('[testParse] New parser unparsed:', newResult.unparsed.length);
  console.log('[testParse] Memory after new parser - RSS:', formatBytes(memAfterNew.rss), 'Heap:', formatBytes(memAfterNew.heapUsed));
  console.log('[testParse] First 15 unparsed (new):');
  newResult.unparsed.slice(0, 15).forEach((line, i) => {
    console.log(`  [${i}]`, JSON.stringify(line));
  });

  // Find slowest lines
  const slowest = lineTimings.sort((a, b) => b.time - a.time).slice(0, 5);
  console.log('\n[testParse] 5 slowest lines:');
  slowest.forEach((item, i) => {
    console.log(`  [${i}] ${item.time.toFixed(3)}ms at line ${item.index}:`, JSON.stringify(item.line));
    if (item.time > 50) {
      console.error(`  *** FAILURE: Line took ${item.time.toFixed(3)}ms (> 50ms threshold)`);
    }
  });

  // Check for catastrophic lines
  const catastrophic = lineTimings.filter(t => t.time > 50);
  if (catastrophic.length > 0) {
    console.error(`\n[testParse] HARD FAILURE: ${catastrophic.length} lines exceeded 50ms threshold`);
    process.exit(1);
  }

  console.log('\n[testParse] Sample parsed exams (first 3):');
  newResult.exams.slice(0, 3).forEach((exam, i) => {
    console.log(`  [${i}]`, {
      date: exam.date.toISOString().slice(0, 10),
      day: exam.dayName,
      time: `${exam.start}-${exam.end}`,
      code: exam.code,
      title: exam.title.slice(0, 40),
      option: exam.option,
      students: exam.students,
    });
  });

  console.log('\n[testParse] Test completed successfully');
}

main().catch(err => {
  console.error('[testParse] Fatal error:', err);
  process.exit(1);
});
