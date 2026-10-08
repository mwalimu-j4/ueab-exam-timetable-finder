import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const GENERIC_STUDENT_ERROR = 'Unable to sign in with those details. Check your ID and PIN, or contact support on WhatsApp 0700598317.';
const SESSION_DAYS = 90;

export function normalizeStudentId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function hashSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createStudentSession(studentId: string, userAgentType?: string) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.studentSession.create({
    data: {
      studentRefId: studentId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      userAgentType,
    },
  });
  return token;
}

export function setStudentCookie(res: { cookie: (name: string, value: string, options: Record<string, unknown>) => void }, token: string) {
  res.cookie('ueab_student_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function mergeSavedExams(studentRefId: string, merge: Array<{ code: string; option: string }> = []) {
  const active = await prisma.timetableVersion.findFirst({ where: { isActive: true }, include: { exams: true } });
  if (!active) return;
  const keys = new Set(active.exams.map(exam => `${exam.code.toUpperCase()}|${exam.option || 'Main'}`));
  await prisma.savedExam.createMany({
    data: merge
      .map(item => ({ code: item.code.trim(), option: item.option.trim() || 'Main', studentRefId }))
      .filter(item => keys.has(`${item.code.toUpperCase()}|${item.option}`)),
    skipDuplicates: true,
  });
}

function snapshot(exam: { date: Date; start: string; end: string; building: string | null; venue: string | null }) {
  return { date: exam.date.toISOString(), start: exam.start, end: exam.end, building: exam.building, venue: exam.venue };
}

export async function getStudentTimetable(studentRefId: string) {
  const active = await prisma.timetableVersion.findFirst({ where: { isActive: true }, include: { exams: true } });
  const saved = await prisma.savedExam.findMany({ where: { studentRefId }, orderBy: [{ addedAt: 'asc' }] });
  if (!active) return { items: [], summary: { total: saved.length, done: saved.filter(item => item.isDone).length, remaining: saved.filter(item => !item.isDone).length, nextExam: null, activeVersion: null } };
  const byKey = new Map(active.exams.map(exam => [`${exam.code.toUpperCase()}|${exam.option || 'Main'}`, exam]));
  const codeOptions = new Map<string, string[]>();
  active.exams.forEach(exam => {
    const options = codeOptions.get(exam.code.toUpperCase()) || [];
    options.push(exam.option || 'Main');
    codeOptions.set(exam.code.toUpperCase(), options);
  });
  const items = [];
  for (const item of saved) {
    const exam = byKey.get(`${item.code.toUpperCase()}|${item.option}`);
    const nextSnapshot = exam ? snapshot(exam) : null;
    const previous = item.lastKnownSnapshot as { date?: string; start?: string; end?: string; building?: string | null; venue?: string | null } | null;
    const changed = exam && previous && JSON.stringify(previous) !== JSON.stringify(nextSnapshot);
    const flag = exam ? (changed ? 'CHANGED' : item.changeFlag === 'REMOVED' ? null : item.changeFlag) : 'REMOVED';
    if (flag !== item.changeFlag || (exam && item.lastKnownExamId !== exam.id)) {
      await prisma.savedExam.update({ where: { id: item.id }, data: { changeFlag: flag, lastKnownExamId: exam?.id, lastKnownSnapshot: nextSnapshot || undefined } });
    }
    items.push({
      id: item.id, code: item.code, option: item.option, isDone: item.isDone, doneAt: item.doneAt,
      changeFlag: flag, suggestedOptions: !exam ? codeOptions.get(item.code.toUpperCase()) || [] : [],
      before: changed ? previous : null, exam: exam ? { id: exam.id, date: exam.date, dayName: exam.dayName, start: exam.start, end: exam.end, building: exam.building, venue: exam.venue, rows: exam.rows, instructor: exam.instructor, title: exam.title } : null,
    });
  }
  const now = Date.now();
  const upcoming = items.filter(item => item.exam && new Date(item.exam.date).getTime() >= now && !item.isDone).sort((a, b) => `${a.exam?.date}${a.exam?.start}`.localeCompare(`${b.exam?.date}${b.exam?.start}`));
  return {
    items,
    summary: { total: items.length, done: items.filter(item => item.isDone).length, remaining: items.filter(item => !item.isDone).length, nextExam: upcoming[0] || null, activeVersion: { kind: active.kind, label: active.label || active.name, publishedAt: active.publishedAt || active.uploadedAt } },
  };
}

export { bcrypt };
