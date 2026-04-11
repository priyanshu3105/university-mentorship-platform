import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserProfilesByIds } from '../services/userService.js';
import { cleanOptionalText } from '../utils/validation.js';

export async function listPendingMentors(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentor_profiles')
      .select('user_id, is_approved, created_at, user_profiles!mentor_profiles_user_id_fkey(full_name)')
      .eq('is_approved', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('listPendingMentors error', error);
      return res.status(500).json({ error: 'Failed to load pending mentors' });
    }

    return res.json({
      items: (data || []).map((row) => ({
        mentorId: row.user_id,
        fullName: row.user_profiles?.full_name || 'Unknown Mentor',
        isApproved: Boolean(row.is_approved),
        requestedAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error('listPendingMentors exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function setMentorApproval(req, res) {
  try {
    const mentorId = req.params.id;
    const approved = req.body?.approved === false ? false : true;
    const reason = cleanOptionalText(req.body?.reason, { max: 1000 }) || null;
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('mentor_profiles')
      .update({
        is_approved: approved,
        approved_at: approved ? now : null,
        approved_by: req.user.id,
      })
      .eq('user_id', mentorId)
      .select('user_id, is_approved, approved_at, approved_by')
      .maybeSingle();

    if (error) {
      console.error('setMentorApproval update error', error);
      return res.status(500).json({ error: 'Failed to update mentor approval' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const { error: eventError } = await supabaseAdmin
      .from('mentor_approval_events')
      .insert({
        mentor_id: mentorId,
        admin_id: req.user.id,
        approved,
        reason,
      });

    if (eventError) {
      console.error('setMentorApproval event insert error', eventError);
    }

    return res.json({
      mentorId: data.user_id,
      isApproved: data.is_approved,
      approvedAt: data.approved_at,
      approvedBy: data.approved_by,
    });
  } catch (err) {
    console.error('setMentorApproval exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listReviewsForModeration(req, res) {
  try {
    const includeHidden = req.query.include_hidden === 'true';
    let query = supabaseAdmin
      .from('reviews')
      .select('id, mentor_id, student_id, rating, comment, is_visible, hidden_at, hide_reason, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('listReviewsForModeration error', error);
      return res.status(500).json({ error: 'Failed to load reviews' });
    }

    const rows = data || [];
    const users = await getUserProfilesByIds(
      rows.flatMap((row) => [row.mentor_id, row.student_id])
    );

    return res.json({
      items: rows.map((row) => ({
        id: row.id,
        mentorId: row.mentor_id,
        mentorName: users.get(row.mentor_id)?.full_name || 'Mentor',
        studentId: row.student_id,
        studentName: users.get(row.student_id)?.full_name || 'Student',
        rating: row.rating,
        comment: row.comment || '',
        isVisible: row.is_visible,
        hiddenAt: row.hidden_at,
        hideReason: row.hide_reason || '',
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error('listReviewsForModeration exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function hideReview(req, res) {
  try {
    const reviewId = req.params.id;
    const reason = cleanOptionalText(req.body?.reason, { max: 1000 }) || null;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({
        is_visible: false,
        hidden_at: new Date().toISOString(),
        hidden_by: req.user.id,
        hide_reason: reason,
      })
      .eq('id', reviewId)
      .select('id, is_visible, hidden_at, hidden_by, hide_reason')
      .maybeSingle();

    if (error) {
      console.error('hideReview update error', error);
      return res.status(500).json({ error: 'Failed to hide review' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { error: actionError } = await supabaseAdmin
      .from('review_moderation_actions')
      .insert({
        review_id: reviewId,
        admin_id: req.user.id,
        action: 'hide',
        reason,
      });

    if (actionError) {
      console.error('hideReview action insert error', actionError);
    }

    return res.json({
      id: data.id,
      isVisible: data.is_visible,
      hiddenAt: data.hidden_at,
      hiddenBy: data.hidden_by,
      hideReason: data.hide_reason || '',
    });
  } catch (err) {
    console.error('hideReview exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

