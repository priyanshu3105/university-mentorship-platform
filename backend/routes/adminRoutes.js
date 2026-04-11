import { Router } from 'express';
import {
  hideReview,
  listPendingMentors,
  listReviewsForModeration,
  setMentorApproval,
} from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/admin/mentors/pending', requireAuth, requireAdmin, listPendingMentors);
router.post('/admin/mentors/:id/approve', requireAuth, requireAdmin, setMentorApproval);
router.get('/admin/reviews', requireAuth, requireAdmin, listReviewsForModeration);
router.post('/admin/reviews/:id/hide', requireAuth, requireAdmin, hideReview);

export default router;

