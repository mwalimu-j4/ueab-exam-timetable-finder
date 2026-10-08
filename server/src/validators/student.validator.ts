import { z } from 'zod';

export const STUDENT_ID_PATTERN = /^[A-Z0-9]{6,20}$/;
const pin = z.string().regex(/^\d{4,6}$/, 'PIN must contain 4 to 6 digits');
const examKey = z.object({ code: z.string().trim().min(1).max(30), option: z.string().trim().min(1).max(80) });

export const studentSessionSchema = z.object({
  studentId: z.string().trim().min(1).max(30),
  pin,
  mode: z.enum(['register', 'login']),
  merge: z.array(examKey).max(100).optional(),
});
export const studentItemSchema = examKey;
export const doneSchema = z.object({ isDone: z.boolean() });
export const pinChangeSchema = z.object({ currentPin: pin, newPin: pin });
export const deleteStudentSchema = z.object({ pin });
