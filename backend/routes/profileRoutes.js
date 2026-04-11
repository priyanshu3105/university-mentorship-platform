import { Router } from 'express';
import {
  getMyBaseProfile,
  getMyMentorProfile,
  getMyStudentProfile,
  updateMyBaseProfile,
  upsertMyMentorProfile,
  upsertMyStudentProfile,
} from '../controllers/profileController.js';
import { requireAuth, requireMentor, requireStudent } from '../middleware/auth.js';

const router = Router();

router.get('/profiles/me', requireAuth, getMyBaseProfile);
router.put('/profiles/me', requireAuth, updateMyBaseProfile);

router.get('/students/me', requireAuth, requireStudent, getMyStudentProfile);
router.put('/students/me', requireAuth, requireStudent, upsertMyStudentProfile);

router.get('/mentors/me', requireAuth, requireMentor, getMyMentorProfile);
router.put('/mentors/me', requireAuth, requireMentor, upsertMyMentorProfile);

export default router;

