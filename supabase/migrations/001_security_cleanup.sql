-- 001_security_cleanup.sql
-- Purpose:
-- - Prepare extensions/helpers
-- - Remove permissive legacy policies
-- - Enforce strict baseline table privileges

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop permissive policies from the current schema (if present)
DROP POLICY IF EXISTS "Service role can insert user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Service can insert mentor_profiles" ON public.mentor_profiles;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'user_profiles',
      'mentor_profiles'
    ])
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END;
$$;

COMMIT;
