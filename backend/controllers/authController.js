import { supabaseAdmin } from '../config/supabaseClient.js';
import { isUniversityEmail } from '../utils/email.js';

export async function getMe(req, res) {
  try {
    const { id, email } = req.user;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select(
        'id, full_name, role, mentor_profiles!mentor_profiles_user_id_fkey ( is_approved )'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('getMe profile error', error);
      return res.status(500).json({ error: 'Failed to load profile' });
    }

    if (!data) {
      return res.json({
        id,
        email,
        profileExists: false,
        profile: null,
        mentor: null,
      });
    }

    const { mentor_profiles, ...profile } = data;

    return res.json({
      id,
      email,
      profileExists: true,
      profile,
      mentor: mentor_profiles
        ? { isApproved: mentor_profiles.is_approved }
        : null,
    });
  } catch (err) {
    console.error('getMe error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function completeRegistration(req, res) {
  try {
    const { id, email } = req.user;
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ error: 'fullName is required' });
    }

    // Role is determined entirely by the backend based on email domain
    const role = isUniversityEmail(email) ? 'mentor' : 'student';

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          id,
          full_name: fullName.trim(),
          role,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('completeRegistration user_profiles error', profileError);
      return res.status(500).json({ error: 'Failed to save user profile' });
    }

    let mentorProfile = null;

    if (role === 'mentor') {
      const { data, error } = await supabaseAdmin
        .from('mentor_profiles')
        .upsert(
          { user_id: id },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) {
        console.error('completeRegistration mentor_profiles error', error);
        return res.status(500).json({ error: 'Failed to save mentor profile' });
      }

      mentorProfile = data;
    }

    return res.status(201).json({
      id,
      email,
      profile,
      mentorProfile,
    });
  } catch (err) {
    console.error('completeRegistration error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
