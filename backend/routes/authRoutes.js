import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMe,
  completeRegistration,
} from '../controllers/authController.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.post('/complete-registration', requireAuth, completeRegistration);

export default router;