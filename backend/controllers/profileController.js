import { supabaseAdmin } from '../config/supabaseClient.js';
import {
  cleanOptionalText,
  cleanStringArray,
  cleanText,
  parseAvailabilityStatus,
} from '../utils/validation.js';

function toStudentProfileResponse(row) {
  return {
    userId: row.user_id,
    courseProgram: row.course_program || '',
    interests: row.interests || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMentorProfileResponse(row) {
  return {
    userId: row.user_id,
    bio: row.bio || '',
    expertise: row.expertise || [],
    availabilityStatus: row.availability_status,
    photoUrl: row.photo_url || '',
    averageRating: Number(row.average_rating || 0),
    ratingCount: Number(row.rating_count || 0),
    isApproved: Boolean(row.is_approved),
    approvedAt: row.approved_at,
    updatedAt: row.updated_at,
  };
}

export async function getMyBaseProfile(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, role, created_at, updated_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('getMyBaseProfile error', error);
      return res.status(500).json({ error: 'Failed to load profile' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('getMyBaseProfile exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMyBaseProfile(req, res) {
  try {
    const fullName = cleanText(req.body?.fullName, { max: 120 });
    if (!fullName) {
      return res.status(400).json({ error: 'fullName is required and must be valid' });
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update({ full_name: fullName })
      .eq('id', req.user.id)
      .select('id, full_name, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('updateMyBaseProfile error', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.json({
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (err) {
    console.error('updateMyBaseProfile exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyStudentProfile(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .select('user_id, course_program, interests, created_at, updated_at')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('getMyStudentProfile error', error);
      return res.status(500).json({ error: 'Failed to load student profile' });
    }

    if (!data) {
      return res.json({
        userId: req.user.id,
        courseProgram: '',
        interests: [],
        createdAt: null,
        updatedAt: null,
      });
    }

    return res.json(toStudentProfileResponse(data));
  } catch (err) {
    console.error('getMyStudentProfile exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertMyStudentProfile(req, res) {
  try {
    const courseProgramRaw = cleanOptionalText(req.body?.courseProgram, { max: 180 });
    const interests = cleanStringArray(req.body?.interests, {
      maxItems: 40,
      maxItemLength: 80,
    });

    if (req.body?.interests !== undefined && !interests) {
      return res.status(400).json({ error: 'interests must be an array of valid strings' });
    }

    const payload = {
      user_id: req.user.id,
      ...(courseProgramRaw !== undefined ? { course_program: courseProgramRaw || null } : {}),
      ...(interests ? { interests } : {}),
    };

    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id, course_program, interests, created_at, updated_at')
      .single();

    if (error) {
      console.error('upsertMyStudentProfile error', error);
      return res.status(500).json({ error: 'Failed to save student profile' });
    }

    return res.json(toStudentProfileResponse(data));
  } catch (err) {
    console.error('upsertMyStudentProfile exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMyMentorProfile(req, res) {
  try {
    const { data, error } = await supabaseAdmin
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
        'updated_at',
      ].join(','))
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('getMyMentorProfile error', error);
      return res.status(500).json({ error: 'Failed to load mentor profile' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    return res.json(toMentorProfileResponse(data));
  } catch (err) {
    console.error('getMyMentorProfile exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertMyMentorProfile(req, res) {
  try {
    const bio = cleanOptionalText(req.body?.bio, { max: 2500 });
    const expertise = cleanStringArray(req.body?.expertise, {
      maxItems: 40,
      maxItemLength: 80,
    });
    const availabilityStatus = req.body?.availabilityStatus
      ? parseAvailabilityStatus(req.body.availabilityStatus)
      : undefined;
    const photoUrl = cleanOptionalText(req.body?.photoUrl, { max: 500 });

    if (req.body?.expertise !== undefined && !expertise) {
      return res.status(400).json({ error: 'expertise must be an array of valid strings' });
    }

    if (req.body?.availabilityStatus !== undefined && !availabilityStatus) {
      return res.status(400).json({ error: 'availabilityStatus must be available, busy, or offline' });
    }

    const payload = {
      user_id: req.user.id,
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(expertise ? { expertise } : {}),
      ...(availabilityStatus ? { availability_status: availabilityStatus } : {}),
      ...(photoUrl !== undefined ? { photo_url: photoUrl || null } : {}),
    };

    const { data, error } = await supabaseAdmin
      .from('mentor_profiles')
      .upsert(payload, { onConflict: 'user_id' })
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
        'updated_at',
      ].join(','))
      .single();

    if (error) {
      console.error('upsertMyMentorProfile error', error);
      return res.status(500).json({ error: 'Failed to save mentor profile' });
    }

    return res.json(toMentorProfileResponse(data));
  } catch (err) {
    console.error('upsertMyMentorProfile exception', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
