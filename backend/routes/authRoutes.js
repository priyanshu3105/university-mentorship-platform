import { Router } from 'express';
import {
  requireAuth,
  requireStudent,
  requireMentor,
  requireAdmin,
} from '../middleware/auth.js';
import {
  getMe,
  completeRegistration,
} from '../controllers/authController.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.post('/complete-registration', requireAuth, completeRegistration);

router.get('/student-access', requireAuth, requireStudent, (_req, res) => {
  res.json({ ok: true, role: 'student' });
});

router.get('/mentor-access', requireAuth, requireMentor, (_req, res) => {
  res.json({ ok: true, role: 'mentor' });
});

router.get('/admin-access', requireAuth, requireAdmin, (_req, res) => {
  res.json({ ok: true, role: 'admin' });
});

export default router;
