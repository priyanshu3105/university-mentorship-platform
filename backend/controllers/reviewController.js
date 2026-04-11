import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserProfilesByIds } from '../services/userService.js';
import { cleanOptionalText } from '../utils/validation.js';

function normalizeRating(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < 1 || parsed > 5) return null;
  return parsed;
}

export async function createReview(req, res) {
  try {
    const mentorId = typeof req.body?.mentorId === 'string' ? req.body.mentorId.trim() : '';
    const bookingId = typeof req.body?.bookingId === 'string' ? req.body.bookingId.trim() : null;
    const rating = normalizeRating(req.body?.rating);
    const comment = cleanOptionalText(req.body?.comment, { max: 2500 });

    if (!mentorId) {
      return res.status(400).json({ error: 'mentorId is required' });
    }
    if (rating === null) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    }

    const { data: canReview, error: canReviewError } = await supabaseAdmin.rpc(
      'can_review_mentor',
      {
        p_student_id: req.user.id,
        p_mentor_id: mentorId,
        p_booking_id: bookingId,
      }
    );

    if (canReviewError) {
      console.error('createReview canReview error', canReviewError);
      return res.status(500).json({ error: 'Failed to validate review permissions' });
    }
    if (!canReview) {
      return res.status(403).json({
        error: 'You can only review mentors you have completed or held sessions with',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        mentor_id: mentorId,
        student_id: req.user.id,
        booking_id: bookingId,
        rating,
        comment: comment || null,
      })
      .select('id, mentor_id, student_id, booking_id, rating, comment, is_visible, created_at')
      .single();

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('unique') && msg.includes('booking')) {
        return res.status(409).json({ error: 'A review already exists for this booking' });
      }
      console.error('createReview insert error', error);
      return res.status(500).json({ error: 'Failed to submit review' });
    }

    return res.status(201).json({
      id: data.id,
      mentorId: data.mentor_id,
      studentId: data.student_id,
      bookingId: data.booking_id,
      rating: data.rating,
      comment: data.comment || '',
      isVisible: data.is_visible,
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error('createReview exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listMentorReviews(req, res) {
  try {
    const mentorId = req.params.id;
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, mentor_id, student_id, rating, comment, created_at')
      .eq('mentor_id', mentorId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('listMentorReviews error', error);
      return res.status(500).json({ error: 'Failed to load reviews' });
    }

    const rows = data || [];
    const students = await getUserProfilesByIds(rows.map((row) => row.student_id));

    return res.json({
      items: rows.map((row) => ({
        id: row.id,
        mentorId: row.mentor_id,
        studentId: row.student_id,
        studentName: students.get(row.student_id)?.full_name || 'Student',
        rating: row.rating,
        comment: row.comment || '',
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error('listMentorReviews exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

