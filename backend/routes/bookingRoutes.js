import { Router } from 'express';
import { createBooking, listMyBookings } from '../controllers/bookingController.js';
import { requireAuth, requireStudent } from '../middleware/auth.js';

const router = Router();

router.post('/bookings', requireAuth, requireStudent, createBooking);
router.get('/bookings/mine', requireAuth, listMyBookings);

export default router;

