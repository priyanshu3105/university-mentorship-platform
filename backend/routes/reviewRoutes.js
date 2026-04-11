import { Router } from 'express';
import { createReview, listMentorReviews } from '../controllers/reviewController.js';
import { requireAuth, requireStudent } from '../middleware/auth.js';

const router = Router();

router.post('/reviews', requireAuth, requireStudent, createReview);
router.get('/mentors/:id/reviews', requireAuth, listMentorReviews);

export default router;

