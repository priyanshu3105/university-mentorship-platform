import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * True if there is at least one confirmed booking between the two users (mentor–student either way).
 */
export async function hasConfirmedBookingBetween(userIdA, userIdB) {
  if (!userIdA || !userIdB || userIdA === userIdB) return false;

  const { data: aMentor, error: e1 } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('status', 'confirmed')
    .eq('mentor_id', userIdA)
    .eq('student_id', userIdB)
    .limit(1)
    .maybeSingle();

  if (e1) throw e1;
  if (aMentor?.id) return true;

  const { data: bMentor, error: e2 } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('status', 'confirmed')
    .eq('mentor_id', userIdB)
    .eq('student_id', userIdA)
    .limit(1)
    .maybeSingle();

  if (e2) throw e2;
  return !!bMentor?.id;
}
