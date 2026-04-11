import { supabaseAdmin } from '../config/supabaseClient.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const [, token] = authHeader.split(' '); // "Bearer <token>"

    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const emailConfirmed = Boolean(data.user.email_confirmed_at);
    if (!emailConfirmed) {
      return res.status(403).json({ error: 'Please verify your email before continuing' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed,
    };

    return next();
  } catch (err) {
    console.error('requireAuth error', err);
    return res.status(500).json({ error: 'Internal auth error' });
  }
}

export function requireRole(...allowedRoles) {
  return async function enforceRole(req, res, next) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', req.user.id)
        .maybeSingle();

      if (error) {
        console.error('requireRole profile error', error);
        return res.status(500).json({ error: 'Failed to verify user role' });
      }

      if (!data?.role) {
        return res.status(403).json({ error: 'Complete registration to access this resource' });
      }

      req.user.role = data.role;

      if (!allowedRoles.includes(data.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      return next();
    } catch (err) {
      console.error('requireRole error', err);
      return res.status(500).json({ error: 'Role authorization failed' });
    }
  };
}

export const requireStudent = requireRole('student');
export const requireMentor = requireRole('mentor');
export const requireAdmin = requireRole('admin');
