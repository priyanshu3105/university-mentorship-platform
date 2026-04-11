-- 008_rls_hardening.sql
-- Purpose:
-- - Final RLS hardening pass and privilege cleanup

BEGIN;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'user_profiles',
      'student_profiles',
      'mentor_profiles',
      'conversations',
      'conversation_members',
      'messages',
      'conversation_invites',
      'availability_slots',
      'bookings',
      'reviews',
      'mentor_approval_events',
      'review_moderation_actions'
    ])
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    END IF;
  END LOOP;
END;
$$;

-- Keep schema usage, but data access must go through table grants + RLS.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

COMMIT;
