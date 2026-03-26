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

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    return next();
  } catch (err) {
    console.error('requireAuth error', err);
    return res.status(500).json({ error: 'Internal auth error' });
  }
}