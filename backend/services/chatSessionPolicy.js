import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserProfilesByIds } from './userService.js';
import { cleanOptionalText } from '../utils/validation.js';

/**
 * Returns active session window if now is within [start_at, end_at] for a confirmed booking.
 */
export async function getActiveBookingWindowForPair(mentorId, studentId) {
  const { data: rows, error } = await supabaseAdmin
    .from('bookings')
    .select('id, status, availability_slots!inner(start_at, end_at)')
    .eq('mentor_id', mentorId)
    .eq('student_id', studentId)
    .eq('status', 'confirmed');

  if (error) throw error;

  const now = Date.now();
  for (const row of rows || []) {
    const slot = row.availability_slots;
    if (!slot?.start_at || !slot?.end_at) continue;
    const start = new Date(slot.start_at).getTime();
    const end = new Date(slot.end_at).getTime();
    if (now >= start && now <= end) {
      return {
        bookingId: row.id,
        startAt: slot.start_at,
        endAt: slot.end_at,
      };
    }
  }
  return null;
}

/**
 * Resolve mentorId and studentId from a direct conversation.
 */
export async function getDirectPairFromConversation(conversationId) {
  const { data: members, error } = await supabaseAdmin
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .is('left_at', null);

  if (error) throw error;
  const ids = (members || []).map((m) => m.user_id);
  if (ids.length !== 2) return null;

  const profiles = await getUserProfilesByIds(ids);
  const roles = ids.map((id) => ({ id, role: profiles.get(id)?.role }));

  const mentor = roles.find((r) => r.role === 'mentor');
  const student = roles.find((r) => r.role === 'student');
  if (!mentor || !student) return null;

  return { mentorId: mentor.id, studentId: student.id };
}

export async function assertDirectMessagingAllowed(conversationId, senderId) {
  const { data: conv, error: convErr } = await supabaseAdmin
    .from('conversations')
    .select('id, type, closed_at')
    .eq('id', conversationId)
    .maybeSingle();

  if (convErr) throw convErr;
  if (!conv) {
    const err = new Error('Conversation not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (conv.closed_at) {
    const err = new Error('This conversation has ended');
    err.code = 'FORBIDDEN';
    throw err;
  }

  if (conv.type === 'group') return;

  const pair = await getDirectPairFromConversation(conversationId);
  if (!pair) {
    const err = new Error('Invalid direct conversation');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const window = await getActiveBookingWindowForPair(pair.mentorId, pair.studentId);
  if (!window) {
    const err = new Error(
      'Messaging is only available during your scheduled session time. Book a new session to chat again.'
    );
    err.code = 'FORBIDDEN';
    throw err;
  }
}

export async function findDirectConversationIdForPair(userA, userB) {
  const [x, y] = [userA, userB].sort();
  const { data, error } = await supabaseAdmin
    .from('direct_conversation_pairs')
    .select('conversation_id')
    .eq('user_a_id', x)
    .eq('user_b_id', y)
    .maybeSingle();

  if (error) throw error;
  return data?.conversation_id || null;
}

/**
 * Clear closure when a new booking is created so the pair can chat in the new window.
 */
export async function reopenDirectConversationForPair(mentorId, studentId) {
  const convId = await findDirectConversationIdForPair(mentorId, studentId);
  if (!convId) return;

  const { error } = await supabaseAdmin
    .from('conversations')
    .update({
      closed_at: null,
      closed_by_student_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', convId);

  if (error) throw error;
}

/**
 * Student ends a direct conversation after submitting a review (rating + optional comment).
 */
export async function endDirectConversationAsStudent({
  conversationId,
  studentId,
  rating,
  comment,
  bookingId,
}) {
  const pair = await getDirectPairFromConversation(conversationId);
  if (!pair || pair.studentId !== studentId) {
    const e = new Error('Only the student can end this conversation');
    e.code = 'FORBIDDEN';
    throw e;
  }

  const { data: conv, error: cErr } = await supabaseAdmin
    .from('conversations')
    .select('id, type, closed_at')
    .eq('id', conversationId)
    .maybeSingle();

  if (cErr) throw cErr;
  if (conv?.type !== 'direct') {
    const e = new Error('Not a direct conversation');
    e.code = 'VALIDATION';
    throw e;
  }
  if (conv?.closed_at) {
    const e = new Error('This conversation has already ended');
    e.code = 'VALIDATION';
    throw e;
  }

  const r = Number.parseInt(String(rating), 10);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    const e = new Error('rating must be an integer between 1 and 5');
    e.code = 'VALIDATION';
    throw e;
  }

  const normalizedComment = cleanOptionalText(comment, { max: 2500 });
  if (!normalizedComment || !String(normalizedComment).trim()) {
    const e = new Error('Please write a short review');
    e.code = 'VALIDATION';
    throw e;
  }

  let bid = typeof bookingId === 'string' && bookingId.trim() ? bookingId.trim() : null;
  if (bid) {
    const { data: revExisting } = await supabaseAdmin
      .from('reviews')
      .select('id')
      .eq('booking_id', bid)
      .maybeSingle();
    if (revExisting) bid = null;
  }

  if (!bid) {
    const { data: bookingRows } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('mentor_id', pair.mentorId)
      .eq('student_id', pair.studentId)
      .in('status', ['confirmed', 'completed'])
      .order('created_at', { ascending: false });

    for (const row of bookingRows || []) {
      const { data: revExisting } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('booking_id', row.id)
        .maybeSingle();
      if (!revExisting) {
        bid = row.id;
        break;
      }
    }
  }

  if (!bid) {
    const e = new Error('No session is available to review, or you already submitted a review');
    e.code = 'VALIDATION';
    throw e;
  }

  const { error: revErr } = await supabaseAdmin.from('reviews').insert({
    mentor_id: pair.mentorId,
    student_id: studentId,
    booking_id: bid,
    rating: r,
    comment: normalizedComment,
  });

  if (revErr) {
    const msg = String(revErr.message || '').toLowerCase();
    if (msg.includes('unique') || msg.includes('duplicate')) {
      const e = new Error('You have already submitted a review for this booking');
      e.code = 'CONFLICT';
      throw e;
    }
    throw revErr;
  }

  const { error: upErr } = await supabaseAdmin
    .from('conversations')
    .update({
      closed_at: new Date().toISOString(),
      closed_by_student_id: studentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (upErr) throw upErr;
}
