import { Router } from 'express';
import {
  createAvailabilitySlots,
  deleteAvailabilitySlot,
  listAvailabilitySlots,
  updateAvailabilitySlot,
} from '../controllers/availabilityController.js';
import { requireAuth, requireMentor } from '../middleware/auth.js';

const router = Router();

router.get('/availability/slots', requireAuth, listAvailabilitySlots);
router.post('/availability/slots', requireAuth, requireMentor, createAvailabilitySlots);
router.put('/availability/slots/:id', requireAuth, requireMentor, updateAvailabilitySlot);
router.delete('/availability/slots/:id', requireAuth, requireMentor, deleteAvailabilitySlot);

export default router;

