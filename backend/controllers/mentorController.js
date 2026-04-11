import { supabaseAdmin } from '../config/supabaseClient.js';
import { cleanText, parseAvailabilityStatus, parsePositiveInt } from '../utils/validation.js';
import { getUserRole } from '../services/userService.js';

function mentorRowToCard(row) {
  return {
    id: row.user_id,
    fullName: row.user_profiles?.full_name || 'Unknown Mentor',
    bio: row.bio || '',
    expertise: row.expertise || [],
    availabilityStatus: row.availability_status,
    photoUrl: row.photo_url || '',
    averageRating: Number(row.average_rating || 0),
    ratingCount: Number(row.rating_count || 0),
    isApproved: Boolean(row.is_approved),
  };
}

export async function listMentors(req, res) {
  try {
    const limit = parsePositiveInt(req.query.limit, { fallback: 24, min: 1, max: 100 });
    const offset = parsePositiveInt(req.query.offset, { fallback: 0, min: 0, max: 10_000 });
    const availabilityStatus = req.query.availability_status
      ? parseAvailabilityStatus(req.query.availability_status)
      : null;

    if (req.query.availability_status && !availabilityStatus) {
      return res.status(400).json({ error: 'availability_status must be available, busy, or offline' });
    }

    let query = supabaseAdmin
      .from('mentor_profiles')
      .select([
        'user_id',
        'bio',
        'expertise',
        'availability_status',
        'photo_url',
        'average_rating',
        'rating_count',
        'is_approved',
        'user_profiles!mentor_profiles_user_id_fkey(full_name)',
      ].join(','))
      .eq('is_approved', true)
      .order('average_rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (availabilityStatus) {
      query = query.eq('availability_status', availabilityStatus);
    }

    const expertiseFilter = cleanText(req.query.expertise, { max: 80, allowEmpty: true });
    if (expertiseFilter) {
      query = query.contains('expertise', [expertiseFilter]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('listMentors error', error);
      return res.status(500).json({ error: 'Failed to load mentors' });
    }

    const q = cleanText(req.query.q, { max: 120, allowEmpty: true })?.toLowerCase();

    const mentors = (data || []).map(mentorRowToCard).filter((m) => {
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.expertise.some((e) => e.toLowerCase().includes(q))
      );
    });

    return res.json({
      items: mentors,
      count: mentors.length,
      limit,
      offset,
    });
  } catch (err) {
    console.error('listMentors exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMentorById(req, res) {
  try {
    const mentorId = req.params.id;

    const { data: mentor, error: mentorError } = await supabaseAdmin
      .from('mentor_profiles')
      .select([
        'user_id',
        'bio',
        'expertise',
        'availability_status',
        'photo_url',
        'average_rating',
        'rating_count',
        'is_approved',
        'approved_at',
        'user_profiles!mentor_profiles_user_id_fkey(full_name)',
      ].join(','))
      .eq('user_id', mentorId)
      .maybeSingle();

    if (mentorError) {
      console.error('getMentorById mentor error', mentorError);
      return res.status(500).json({ error: 'Failed to load mentor details' });
    }

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const requesterRole = await getUserRole(req.user.id);
    const canView = mentor.is_approved || req.user.id === mentorId || requesterRole === 'admin';
    if (!canView) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    const nowIso = new Date().toISOString();

    const [{ data: slots, error: slotsError }, { data: reviews, error: reviewsError }] = await Promise.all([
      supabaseAdmin
        .from('availability_slots')
        .select('id, start_at, end_at, is_booked')
        .eq('mentor_id', mentorId)
        .eq('is_booked', false)
        .gt('start_at', nowIso)
        .order('start_at', { ascending: true })
        .limit(50),
      supabaseAdmin
        .from('reviews')
        .select('id, rating, comment, created_at, student_id')
        .eq('mentor_id', mentorId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    if (slotsError || reviewsError) {
      console.error('getMentorById related query error', { slotsError, reviewsError });
      return res.status(500).json({ error: 'Failed to load mentor details' });
    }

    return res.json({
      mentor: {
        id: mentor.user_id,
        fullName: mentor.user_profiles?.full_name || 'Unknown Mentor',
        bio: mentor.bio || '',
        expertise: mentor.expertise || [],
        availabilityStatus: mentor.availability_status,
        photoUrl: mentor.photo_url || '',
        averageRating: Number(mentor.average_rating || 0),
        ratingCount: Number(mentor.rating_count || 0),
        isApproved: Boolean(mentor.is_approved),
      },
      slots: (slots || []).map((s) => ({
        id: s.id,
        startAt: s.start_at,
        endAt: s.end_at,
        isBooked: s.is_booked,
      })),
      reviews: (reviews || []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.created_at,
        studentId: r.student_id,
      })),
    });
  } catch (err) {
    console.error('getMentorById exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
