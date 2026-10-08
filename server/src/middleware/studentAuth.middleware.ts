import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prisma';

export type StudentRequest = Request & { student?: { id: string; studentId: string }; studentSessionId?: string };

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function studentAuthMiddleware(req: StudentRequest, res: Response, next: NextFunction) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined;
    const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('ueab_student_session='));
    const token = bearer || cookie?.slice('ueab_student_session='.length);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const session = await prisma.studentSession.findUnique({ where: { tokenHash: hashToken(token) }, include: { student: true } });
    if (!session || session.expiresAt <= new Date()) return res.status(401).json({ error: 'Unauthorized' });
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await prisma.studentSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date(), expiresAt } });
    req.student = { id: session.student.id, studentId: session.student.studentId };
    req.studentSessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
}
