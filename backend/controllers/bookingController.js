import { supabaseAdmin } from '../config/supabaseClient.js';
import { sendBookingConfirmationEmails } from '../services/emailService.js';
import { reopenDirectConversationForPair } from '../services/chatSessionPolicy.js';
import { getUserEmailsByIds, getUserProfilesByIds, getUserRole } from '../services/userService.js';
import { getSocketServer } from '../socket/socketServer.js';

function bookingRowToResponse(row, users = new Map()) {
  const mentor = users.get(row.mentor_id);
  const student = users.get(row.student_id);
  const slot = row.availability_slots || {};

  return {
    id: row.id,
    slotId: row.slot_id,
    mentorId: row.mentor_id,
    mentorName: mentor?.full_name || 'Unknown Mentor',
    studentId: row.student_id,
    studentName: student?.full_name || 'Unknown Student',
    status: row.status,
    startAt: slot.start_at || null,
    endAt: slot.end_at || null,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at || null,
  };
}

function mapBookingRpcError(message) {
  const m = String(message || '');
  if (m.includes('SLOT_NOT_FOUND')) return { status: 404, error: 'Slot not found' };
  if (m.includes('SLOT_ALREADY_BOOKED')) return { status: 409, error: 'Slot already booked' };
  if (m.includes('STUDENT_HAS_OVERLAPPING_BOOKING')) {
    return { status: 409, error: 'You already have another confirmed booking at this time' };
  }
  if (m.includes('SLOT_IN_PAST')) return { status: 400, error: 'Cannot book a past slot' };
  if (m.includes('SELF_BOOKING_NOT_ALLOWED')) return { status: 400, error: 'Cannot book your own slot' };
  if (m.includes('MENTOR_NOT_APPROVED')) return { status: 403, error: 'Mentor is not approved for booking' };
  return null;
}

export async function createBooking(req, res) {
  try {
    const slotId = typeof req.body?.slotId === 'string' ? req.body.slotId.trim() : '';
    if (!slotId) {
      return res.status(400).json({ error: 'slotId is required' });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin.rpc(
      'create_booking_transactional',
      {
        p_slot_id: slotId,
        p_student_id: req.user.id,
      }
    );

    if (bookingError) {
      const mapped = mapBookingRpcError(bookingError.message);
      if (mapped) {
        return res.status(mapped.status).json({ error: mapped.error });
      }
      console.error('createBooking rpc error', bookingError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    const { data: withSlot, error: withSlotError } = await supabaseAdmin
      .from('bookings')
      .select([
        'id',
        'slot_id',
        'mentor_id',
        'student_id',
        'status',
        'created_at',
        'cancelled_at',
        'availability_slots!bookings_slot_id_fkey(start_at, end_at)',
      ].join(','))
      .eq('id', booking.id)
      .single();

    if (withSlotError) {
      console.error('createBooking load created row error', withSlotError);
      return res.status(500).json({ error: 'Booking created but failed to fetch details' });
    }

    const users = await getUserProfilesByIds([withSlot.mentor_id, withSlot.student_id]);
    const response = bookingRowToResponse(withSlot, users);

    try {
      const emails = await getUserEmailsByIds([withSlot.mentor_id, withSlot.student_id]);
      await sendBookingConfirmationEmails({
        bookingId: response.id,
        mentorEmail: emails.get(withSlot.mentor_id),
        studentEmail: emails.get(withSlot.student_id),
        mentorName: response.mentorName,
        studentName: response.studentName,
        startAtIso: response.startAt,
        endAtIso: response.endAt,
      });
    } catch (emailErr) {
      console.error('createBooking email send failed', emailErr);
    }

    try {
      await reopenDirectConversationForPair(withSlot.mentor_id, withSlot.student_id);
    } catch (reopenErr) {
      console.error('createBooking reopen conversation failed', reopenErr);
    }

    const io = getSocketServer();
    if (io) {
      const payload = {
        bookingId: response.id,
        slotId: response.slotId,
        mentorId: response.mentorId,
        studentId: response.studentId,
      };
      io.to(`user:${response.mentorId}`).emit('booking:updated', payload);
      io.to(`user:${response.studentId}`).emit('booking:updated', payload);
      io.to(`user:${response.mentorId}`).emit('availability:updated', payload);
      io.to(`user:${response.studentId}`).emit('availability:updated', payload);
    }

    return res.status(201).json(response);
  } catch (err) {
    console.error('createBooking exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listMyBookings(req, res) {
  try {
    try {
      await supabaseAdmin.rpc('mark_past_bookings_completed');
    } catch (rpcErr) {
      console.warn('mark_past_bookings_completed', rpcErr);
    }

    const role = await getUserRole(req.user.id);
    let query = supabaseAdmin
      .from('bookings')
      .select([
        'id',
        'slot_id',
        'mentor_id',
        'student_id',
        'status',
        'created_at',
        'cancelled_at',
        'availability_slots!bookings_slot_id_fkey(start_at, end_at)',
      ].join(','))
      .order('created_at', { ascending: false })
      .limit(200);

    if (role === 'student') {
      query = query.eq('student_id', req.user.id);
    } else if (role === 'mentor') {
      query = query.eq('mentor_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('listMyBookings error', error);
      return res.status(500).json({ error: 'Failed to load bookings' });
    }

    const rows = data || [];
    const userIds = rows.flatMap((row) => [row.mentor_id, row.student_id]);
    const users = await getUserProfilesByIds(userIds);

    return res.json({ items: rows.map((row) => bookingRowToResponse(row, users)) });
  } catch (err) {
    console.error('listMyBookings exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

