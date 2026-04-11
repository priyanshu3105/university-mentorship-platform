import { Router } from 'express';
import { getMentorById, listMentors } from '../controllers/mentorController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/mentors', requireAuth, listMentors);
router.get('/mentors/:id', requireAuth, getMentorById);

export default router;

