import assert from 'node:assert/strict';
import { parseUeabLine, parseUeabTimetable } from './ueabTimetableParser';

const fixtures = [
  {
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM COSC161 FUNDAMENTALS OF PROGRAMMING Main Mr. OMARI DICKSON MOGAKA HUM Humanities LabHumanities Lab 63',
    code: 'COSC161',
    title: 'FUNDAMENTALS OF PROGRAMMING',
    students: 63,
  },
  {
    line: 'Fri, 10 -04 -2026 08:00 AM 11:00 AM COSC485 COMPUTER GRAPHICS Main Mr. MBATA KEVIN MAYAKA Library Computer LabMain Lab 100',
    code: 'COSC485',
    title: 'COMPUTER GRAPHICS',
    students: 100,
  },
  {
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM PHYS335 PHYSICAL OPTICS (LAB EXAMS) Main Mr. ROTICH JUSTUS KIMURGOR SC Science BuildingSC343 50',
    code: 'PHYS335',
    title: 'PHYSICAL OPTICS (LAB EXAMS)',
    students: 50,
  },
  {
    line: 'Mon, 13-04-2026 07:00 AM 10:00 AM DEST065B GENDER IN COMMUNITY DEVELOPMENT Main Mr. KOLUM SHADRACK KIPKEMBOI AMP AmphitheaterAmphitheater 10',
    code: 'DEST065B',
    title: 'GENDER IN COMMUNITY DEVELOPMENT',
    students: 10,
  },
  {
    line: 'Wed, 15-04-2026 02:00 PM 05:00 PM CLSC235 INTRODUCTION TO PHARMACOLOGY AND PHARMACOGNOSYMain Mr. KITTUR ABRAHAM KIPTOO AUD Auditorium 34,36,38 60',
    code: 'CLSC235',
    title: 'INTRODUCTION TO PHARMACOLOGY AND PHARMACOGNOSY',
    students: 60,
  },
  {
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM RELB274 PROPHETS OF ISRAEL I Inter Session 2 Mr. MOGUSU N AUD Auditorium 21,23,25......31 108',
    code: 'RELB274',
    title: 'PROPHETS OF ISRAEL I',
    students: 108,
  },
  {
    line: 'Tue , 07-04-2026 02:00 PM 05:00 PM PHYS155 GENERAL PHYSICS (LAB EXAMS) Main Mr. ROTICH JUSTUS KIMURGOR SC Science BuildingSC343',
    code: 'PHYS155',
    title: 'GENERAL PHYSICS (LAB EXAMS)',
    students: undefined,
  },
  {
    line: 'Mon, 13-04-2026 07:00 AM 10:00 AM HIST111 CONCEPTS OF WORLD CIVILIZATION Blended Online Mr. KILONZO BONIFACE MUNYAO AMP AmphitheaterAmphitheater 22',
    code: 'HIST111',
    title: 'CONCEPTS OF WORLD CIVILIZATION',
    students: 22,
  },
  {
    line: 'Tue , 07-04-2026 02:00 PM 05:00 PM NRSG101 PROFESSIONALISM IN NURSING Main Mr. KORIR ISAAC KIPCHUMBA AUD Auditorium 6,8 552025/2026.2 FINAL EXAM TIMETABLE READ CAREFULLY',
    code: 'NRSG101',
    title: 'PROFESSIONALISM IN NURSING',
    students: 55,
  },
];

for (const fixture of fixtures) {
  const exam = parseUeabLine(fixture.line);
  assert.ok(exam, fixture.line);
  assert.equal(exam.code, fixture.code);
  assert.equal(exam.title, fixture.title);
  assert.equal(exam.students, fixture.students);
  assert.equal(exam.date.toISOString().slice(0, 10), fixture.line.includes('10 -04') ? '2026-04-10' : fixture.line.includes('13-04') ? '2026-04-13' : fixture.line.includes('15-04') ? '2026-04-15' : '2026-04-07');
  assert.match(exam.start, /^\d{2}:\d{2}$/);
  assert.match(exam.end, /^\d{2}:\d{2}$/);
}

const wrapped = parseUeabTimetable(fixtures[0].line + '\ncontinued-noise-that-should-join');
assert.equal(wrapped.exams.length, 1);

const all = parseUeabTimetable(fixtures.map(fixture => fixture.line).join('\n'));
assert.equal(all.exams.length, fixtures.length);
assert.equal(all.unparsed.length, 0);

console.log('UEAB timetable parser fixtures passed');
