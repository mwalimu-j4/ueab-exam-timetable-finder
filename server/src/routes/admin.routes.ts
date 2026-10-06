import { Router, IRouter } from 'express';
import {
  login,
  uploadTimetable,
  publishTimetable,
  listTimetables,
  deleteTimetable,
} from '../controllers/admin.controller';
import { getAnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { uploadRateLimit } from '../middleware/rateLimit.middleware';
import { upload } from '../config/multer.config';
import { loginSchema, analyticsQuerySchema } from '../validators/admin.validator';

const router: IRouter = Router();

// Public admin routes
router.post('/login', validateRequest(loginSchema, 'body'), login);

// Protected admin routes
router.post(
  '/timetables/upload',
  authMiddleware,
  uploadRateLimit,
  upload.single('file'),
  uploadTimetable
);

router.post('/timetables/:id/publish', authMiddleware, publishTimetable);

router.get('/timetables', authMiddleware, listTimetables);

router.delete('/timetables/:id', authMiddleware, deleteTimetable);

router.get('/analytics', authMiddleware, validateRequest(analyticsQuerySchema, 'query'), getAnalyticsController);

export default router;
