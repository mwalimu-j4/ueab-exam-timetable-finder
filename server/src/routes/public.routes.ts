import { Router, IRouter } from 'express';
import { searchExamsController } from '../controllers/exams.controller';
import { recordVisitController, recordEventController } from '../controllers/tracking.controller';
import { createRating } from '../controllers/rating.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { publicRateLimit } from '../middleware/rateLimit.middleware';
import { searchExamsSchema, visitSchema, eventSchema } from '../validators/public.validator';
import { ratingSchema } from '../validators/rating.validator';

const router: IRouter = Router();

router.get('/exams', publicRateLimit, validateRequest(searchExamsSchema, 'query'), searchExamsController);

router.post('/visit', publicRateLimit, validateRequest(visitSchema, 'body'), recordVisitController);

router.post('/events', publicRateLimit, validateRequest(eventSchema, 'body'), recordEventController);

router.post('/ratings', publicRateLimit, validateRequest(ratingSchema, 'body'), createRating);

export default router;
