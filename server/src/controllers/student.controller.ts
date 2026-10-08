import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma';
import { STUDENT_ID_PATTERN, studentSessionSchema } from '../validators/student.validator';
import { createStudentSession, GENERIC_STUDENT_ERROR, getStudentTimetable, mergeSavedExams, normalizeStudentId, setStudentCookie } from '../services/student.service';
import type { StudentRequest } from '../middleware/studentAuth.middleware';

function generic(res: Response) { return res.status(401).json({ error: GENERIC_STUDENT_ERROR }); }

export async function studentSession(req: Request, res: Response) {
  const parsed = studentSessionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });
  const id = normalizeStudentId(parsed.data.studentId);
  if (!STUDENT_ID_PATTERN.test(id)) return generic(res);
  const existing = await prisma.student.findUnique({ where: { studentId: id } });
  if (parsed.data.mode === 'register') {
    if (existing) return generic(res);
    const student = await prisma.student.create({ data: { studentId: id, pinHash: await bcrypt.hash(parsed.data.pin, 12), lastLoginAt: new Date() } });
    await mergeSavedExams(student.id, parsed.data.merge);
    const token = await createStudentSession(student.id, req.headers['user-agent']);
    setStudentCookie(res, token);
    return res.status(201).json({ token, studentId: id, timetable: await getStudentTimetable(student.id) });
  }
  if (!existing || (existing.lockedUntil && existing.lockedUntil > new Date())) return generic(res);
  const valid = await bcrypt.compare(parsed.data.pin, existing.pinHash);
  if (!valid) {
    const failedAttempts = existing.failedAttempts + 1;
    const delay = failedAttempts >= 5 ? Math.min(60 * 60 * 1000, 15 * 60 * 1000 * Math.pow(2, failedAttempts - 5)) : 0;
    await prisma.student.update({ where: { id: existing.id }, data: { failedAttempts, lockedUntil: delay ? new Date(Date.now() + delay) : null } });
    return generic(res);
  }
  await prisma.student.update({ where: { id: existing.id }, data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await mergeSavedExams(existing.id, parsed.data.merge);
  const token = await createStudentSession(existing.id, req.headers['user-agent']);
  setStudentCookie(res, token);
  return res.json({ token, studentId: id, timetable: await getStudentTimetable(existing.id) });
}

export async function getStudentTimetableController(req: StudentRequest, res: Response) {
  res.json(await getStudentTimetable(req.student!.id));
}

export async function studentLogout(req: StudentRequest, res: Response) {
  if (req.studentSessionId) await prisma.studentSession.delete({ where: { id: req.studentSessionId } });
  res.clearCookie('ueab_student_session');
  res.json({ message: 'Logged out' });
}

export async function studentLogoutAll(req: StudentRequest, res: Response) {
  await prisma.studentSession.deleteMany({ where: { studentRefId: req.student!.id } });
  res.clearCookie('ueab_student_session');
  res.json({ message: 'Logged out of all devices' });
}

export async function deleteStudent(req: StudentRequest, res: Response) {
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  const student = await prisma.student.findUnique({ where: { id: req.student!.id } });
  if (!student || !(await bcrypt.compare(pin, student.pinHash))) return generic(res);
  await prisma.student.delete({ where: { id: student.id } });
  res.clearCookie('ueab_student_session');
  res.json({ message: 'Your data has been deleted' });
}

export async function addStudentExam(req: StudentRequest, res: Response) {
  const code = String(req.body.code || '').trim();
  const option = String(req.body.option || 'Main').trim();
  const active = await prisma.timetableVersion.findFirst({ where: { isActive: true }, include: { exams: true } });
  const exam = active?.exams.find(item => item.code.toUpperCase() === code.toUpperCase() && (item.option || 'Main') === option);
  if (!exam) return res.status(404).json({ error: 'Exam not found in the active timetable' });
  const item = await prisma.savedExam.upsert({ where: { studentRefId_code_option: { studentRefId: req.student!.id, code: exam.code, option } }, create: { studentRefId: req.student!.id, code: exam.code, option }, update: {} });
  res.status(201).json(item);
}

export async function removeStudentExam(req: StudentRequest, res: Response) {
  await prisma.savedExam.deleteMany({ where: { studentRefId: req.student!.id, code: req.params.code, option: req.params.option } });
  res.status(204).send();
}

export async function toggleStudentExam(req: StudentRequest, res: Response) {
  const isDone = Boolean(req.body.isDone);
  const item = await prisma.savedExam.updateMany({ where: { studentRefId: req.student!.id, code: req.params.code, option: req.params.option }, data: { isDone, doneAt: isDone ? new Date() : null } });
  if (!item.count) return res.status(404).json({ error: 'Saved exam not found' });
  res.json(await getStudentTimetable(req.student!.id));
}

export async function acknowledgeChanges(req: StudentRequest, res: Response) {
  await prisma.savedExam.updateMany({ where: { studentRefId: req.student!.id, changeFlag: { not: null } }, data: { changeSeenAt: new Date() } });
  res.json({ message: 'Changes acknowledged' });
}
