import { Router, IRouter } from 'express';
import { studentAuthMiddleware } from '../middleware/studentAuth.middleware';
import { addStudentExam, acknowledgeChanges, deleteStudent, getStudentTimetableController, removeStudentExam, studentLogout, studentLogoutAll, studentSession, toggleStudentExam } from '../controllers/student.controller';
import { doneSchema, studentItemSchema, studentSessionSchema } from '../validators/student.validator';
import { validateRequest } from '../middleware/validation.middleware';
import rateLimit from 'express-rate-limit';

const router: IRouter = Router();
const sessionRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post('/session', sessionRateLimit, validateRequest(studentSessionSchema, 'body'), studentSession);
router.use(studentAuthMiddleware);
router.post('/logout', studentLogout);
router.post('/logout-all', studentLogoutAll);
router.delete('/me', deleteStudent);
router.get('/timetable', getStudentTimetableController);
router.post('/timetable/items', validateRequest(studentItemSchema, 'body'), addStudentExam);
router.delete('/timetable/items/:code/:option', removeStudentExam);
router.patch('/timetable/items/:code/:option', validateRequest(doneSchema, 'body'), toggleStudentExam);
router.post('/timetable/changes/ack', acknowledgeChanges);

export default router;
