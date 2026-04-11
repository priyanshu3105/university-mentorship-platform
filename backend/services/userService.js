import { supabaseAdmin } from '../config/supabaseClient.js';

export async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role || null;
}

export async function getUserProfilesByIds(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return new Map();

  const uniqueIds = [...new Set(userIds)];
  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, full_name, role')
    .in('id', uniqueIds);

  if (error) throw error;

  const result = new Map();
  for (const row of data || []) {
    result.set(row.id, row);
  }
  return result;
}

export async function getUserEmailById(userId) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error) throw error;
  return data?.user?.email || null;
}

export async function getUserEmailsByIds(userIds) {
  const out = new Map();
  for (const userId of [...new Set(userIds)]) {
    if (!userId) continue;
    try {
      const email = await getUserEmailById(userId);
      out.set(userId, email);
    } catch {
      out.set(userId, null);
    }
  }
  return out;
}
