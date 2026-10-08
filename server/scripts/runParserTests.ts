// Simple test runner for parser validation
import { parseUeabLine, parseUeabTimetable } from '../src/utils/parsers/ueabTimetableParser';

const testCases = [
  {
    name: 'Basic exam with Main option',
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM COSC161 FUNDAMENTALS OF PROGRAMMING Main Mr. OMARI DICKSON MOGAKA HUM Humanities LabHumanities Lab 63',
    expected: {
      code: 'COSC161',
      date: '2026-04-07',
      option: 'Main',
      students: 63,
    },
  },
  {
    name: 'Flexible date spacing',
    line: 'Fri, 10 -04 -2026 08:00 AM 11:00 AM COSC485 COMPUTER GRAPHICS Main Mr. MBATA KEVIN MAYAKA Library Computer LabMain Lab 100',
    expected: {
      code: 'COSC485',
      date: '2026-04-10',
      option: 'Main',
      students: 100,
    },
  },
  {
    name: 'Lab exam with parentheses',
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM PHYS335 PHYSICAL OPTICS (LAB EXAMS) Main Mr. ROTICH JUSTUS KIMURGOR SC Science BuildingSC343 50',
    expected: {
      code: 'PHYS335',
      date: '2026-04-07',
      option: 'Main',
      students: 50,
    },
  },
  {
    name: 'Glued option (no space before Main)',
    line: 'Wed, 15-04-2026 02:00 PM 05:00 PM CLSC235 INTRODUCTION TO PHARMACOLOGY AND PHARMACOGNOSYMain Mr. KITTUR ABRAHAM KIPTOO AUD Auditorium 34,36,38 60',
    expected: {
      code: 'CLSC235',
      date: '2026-04-15',
      option: 'Main',
      students: 60,
    },
  },
  {
    name: 'Inter Session 2 option',
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM RELB274 PROPHETS OF ISRAEL I Inter Session 2 Mr. MOGUSU N AUD Auditorium 21,23,25......31 108',
    expected: {
      code: 'RELB274',
      date: '2026-04-07',
      option: 'Inter Session 2',
      students: 108,
    },
  },
  {
    name: 'Course code with letter suffix',
    line: 'Mon, 13-04-2026 07:00 AM 10:00 AM DEST065B GENDER IN COMMUNITY DEVELOPMENT Main Mr. KOLUM SHADRACK KIPKEMBOI AMP AmphitheaterAmphitheater 10',
    expected: {
      code: 'DEST065B',
      date: '2026-04-13',
      option: 'Main',
      students: 10,
    },
  },
  {
    name: 'Missing student count',
    line: 'Tue , 07-04-2026 02:00 PM 05:00 PM PHYS155 GENERAL PHYSICS (LAB EXAMS) Main Mr. ROTICH JUSTUS KIMURGOR SC Science BuildingSC343',
    expected: {
      code: 'PHYS155',
      date: '2026-04-07',
      option: 'Main',
      students: undefined,
    },
  },
  {
    name: 'Blended Online option',
    line: 'Mon, 13-04-2026 07:00 AM 10:00 AM HIST111 CONCEPTS OF WORLD CIVILIZATION Blended Online Mr. KILONZO BONIFACE MUNYAO AMP AmphitheaterAmphitheater 22',
    expected: {
      code: 'HIST111',
      date: '2026-04-13',
      option: 'Blended Online',
      students: 22,
    },
  },
  {
    name: 'Glued header at end',
    line: 'Wed, 08-04-2026 09:00 AM 12:00 PM TEST123 TEST EXAM Main Mr. TEST INSTRUCTOR AUD Auditorium 6,8 552025/2026.2 FINAL EXAM TIMETABLE READ CAREFULLY',
    expected: {
      code: 'TEST123',
      date: '2026-04-08',
      option: 'Main',
      students: 55,
    },
  },
];

let passed = 0;
let failed = 0;

console.log('Running parser tests...\n');

testCases.forEach(({ name, line, expected }) => {
  const result = parseUeabLine(line);
  
  if (!result) {
    console.error(`❌ ${name}: returned null`);
    failed++;
    return;
  }

  const checks = [
    { field: 'code', actual: result.code, expected: expected.code },
    { field: 'date', actual: result.date.toISOString().slice(0, 10), expected: expected.date },
    { field: 'option', actual: result.option, expected: expected.option },
    { field: 'students', actual: result.students, expected: expected.students },
  ];

  const errors = checks.filter(c => c.actual !== c.expected);

  if (errors.length === 0) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.error(`❌ ${name}:`);
    errors.forEach(e => {
      console.error(`   ${e.field}: expected ${e.expected}, got ${e.actual}`);
    });
    failed++;
  }
});

// Test noise lines
console.log('\nTesting noise line rejection...');
const noiseLines = [
  '2025/2026.2 FINAL EXAM TIMETABLE READ CAREFULLY',
  'Date Start Time End Time Course Code',
  'No.',
  'student',
  'Row',
];

noiseLines.forEach(line => {
  const result = parseUeabLine(line);
  if (result === null) {
    console.log(`✅ Correctly rejected: "${line}"`);
    passed++;
  } else {
    console.error(`❌ Should have rejected: "${line}"`);
    failed++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${passed}`);
console.log(`Tests failed: ${failed}`);
console.log(`${'='.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
