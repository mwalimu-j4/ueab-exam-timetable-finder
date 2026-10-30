import assert from 'node:assert/strict';
import { parseUeabLine, parseUeabTimetable } from './ueabTimetableParser';

const fixtures = [
  {
    line: 'Mon, 16-11-2026 09:00 AM 12:00 PM RELP284 STEWARDSHIP AND SELF-RELIANCE Mr. OWUOR JAMES OUMA Inter Session Auditorium 119',
    code: 'RELP284',
    date: '2026-11-16',
    title: 'STEWARDSHIP AND SELF-RELIANCE',
    option: 'Inter Session',
    instructor: 'Mr. OWUOR JAMES OUMA',
    venue: 'Auditorium',
    students: 119,
  },
  {
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM COSC161 FUNDAMENTALS OF PROGRAMMING Main Mr. OMARI DICKSON MOGAKA HUM Humanities LabHumanities Lab 63',
    code: 'COSC161',
    date: '2026-04-07',
    title: 'FUNDAMENTALS OF PROGRAMMING',
    students: 63,
  },
  {
    line: 'Fri, 10 -04 -2026 08:00 AM 11:00 AM COSC485 COMPUTER GRAPHICS Main Mr. MBATA KEVIN MAYAKA Library Computer LabMain Lab 100',
    code: 'COSC485',
    date: '2026-04-10',
    title: 'COMPUTER GRAPHICS',
    students: 100,
  },
  {
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM PHYS335 PHYSICAL OPTICS (LAB EXAMS) Main Mr. ROTICH JUSTUS KIMURGOR SC Science BuildingSC343 50',
    code: 'PHYS335',
    date: '2026-04-07',
    title: 'PHYSICAL OPTICS (LAB EXAMS)',
    students: 50,
  },
  {
    line: 'Mon, 13-04-2026 07:00 AM 10:00 AM DEST065B GENDER IN COMMUNITY DEVELOPMENT Main Mr. KOLUM SHADRACK KIPKEMBOI AMP AmphitheaterAmphitheater 10',
    code: 'DEST065B',
    date: '2026-04-13',
    title: 'GENDER IN COMMUNITY DEVELOPMENT',
    students: 10,
  },
  {
    line: 'Wed, 15-04-2026 02:00 PM 05:00 PM CLSC235 INTRODUCTION TO PHARMACOLOGY AND PHARMACOGNOSYMain Mr. KITTUR ABRAHAM KIPTOO AUD Auditorium 34,36,38 60',
    code: 'CLSC235',
    date: '2026-04-15',
    title: 'INTRODUCTION TO PHARMACOLOGY AND PHARMACOGNOSY',
    students: 60,
  },
  {
    line: 'Tue , 07-04-2026 09:00 AM 12:00 PM RELB274 PROPHETS OF ISRAEL I Inter Session 2 Mr. MOGUSU N AUD Auditorium 21,23,25......31 108',
    code: 'RELB274',
    date: '2026-04-07',
    title: 'PROPHETS OF ISRAEL I',
    students: 108,
  },
  {
    line: 'Tue , 07-04-2026 02:00 PM 05:00 PM PHYS155 GENERAL PHYSICS (LAB EXAMS) Main Mr. ROTICH JUSTUS KIMURGOR SC Science BuildingSC343',
    code: 'PHYS155',
    date: '2026-04-07',
    title: 'GENERAL PHYSICS (LAB EXAMS)',
    students: undefined,
  },
  {
    line: 'Mon, 13-04-2026 07:00 AM 10:00 AM HIST111 CONCEPTS OF WORLD CIVILIZATION Blended Online Mr. KILONZO BONIFACE MUNYAO AMP AmphitheaterAmphitheater 22',
    code: 'HIST111',
    date: '2026-04-13',
    title: 'CONCEPTS OF WORLD CIVILIZATION',
    students: 22,
  },
  {
    line: 'Tue , 07-04-2026 02:00 PM 05:00 PM NRSG101 PROFESSIONALISM IN NURSING Main Mr. KORIR ISAAC KIPCHUMBA AUD Auditorium 6,8 552025/2026.2 FINAL EXAM TIMETABLE READ CAREFULLY',
    code: 'NRSG101',
    date: '2026-04-07',
    title: 'PROFESSIONALISM IN NURSING',
    students: 55,
  },
];

for (const fixture of fixtures) {
  const exam = parseUeabLine(fixture.line);
  assert.ok(exam, fixture.line);
  assert.equal(exam.code, fixture.code);
  assert.equal(exam.title, fixture.title);
  if (fixture.option) assert.equal(exam.option, fixture.option);
  if (fixture.instructor) assert.equal(exam.instructor, fixture.instructor);
  if (fixture.venue) assert.equal(exam.venue, fixture.venue);
  assert.equal(exam.students, fixture.students);
  assert.equal(exam.date.toISOString().slice(0, 10), fixture.date);
  assert.match(exam.start, /^\d{2}:\d{2}$/);
  assert.match(exam.end, /^\d{2}:\d{2}$/);
}

const wrapped = parseUeabTimetable(fixtures[0].line + '\ncontinued-noise-that-should-join');
assert.equal(wrapped.exams.length, 1);

const gluedVenue = parseUeabLine('Wed, 18-11-2026 09:00 AM 12:00 PM COSC070 INFORMATION COMMUNICATION TECHNOLOGY Inter Session 1 Mr. ADEGU ENOCK Auditorium 3 30');
assert.ok(gluedVenue);
assert.equal(gluedVenue.instructor, 'Mr. ADEGU ENOCK');
assert.equal(gluedVenue.venue, 'Auditorium 3');

const all = parseUeabTimetable(fixtures.map(fixture => fixture.line).join('\n'));
assert.equal(all.exams.length, fixtures.length);
assert.equal(all.unparsed.length, 0);

console.log('UEAB timetable parser fixtures passed');
