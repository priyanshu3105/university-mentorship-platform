-- 002_profiles_extend.sql
-- Purpose:
-- - Extend profile domain (student + richer mentor profile)
-- - Harden profile policies

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'mentor', 'admin');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
    CREATE TYPE public.availability_status AS ENUM ('available', 'busy', 'offline');
  END IF;
END;
$$;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_full_name_nonempty;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_full_name_nonempty
  CHECK (length(trim(full_name)) > 0);

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_program text,
  interests text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS expertise text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_status public.availability_status NOT NULL DEFAULT 'offline',
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.mentor_profiles
  DROP CONSTRAINT IF EXISTS mentor_profiles_rating_nonnegative;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_rating_nonnegative CHECK (average_rating >= 0 AND average_rating <= 5);

ALTER TABLE public.mentor_profiles
  DROP CONSTRAINT IF EXISTS mentor_profiles_rating_count_nonnegative;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_rating_count_nonnegative CHECK (rating_count >= 0);

DROP TRIGGER IF EXISTS mentor_profiles_updated_at ON public.mentor_profiles;
CREATE TRIGGER mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.id = auth.uid()
      AND up.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profiles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_self_or_admin ON public.user_profiles;
CREATE POLICY user_profiles_select_self_or_admin
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS user_profiles_insert_self_or_admin ON public.user_profiles;
CREATE POLICY user_profiles_insert_self_or_admin
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS user_profiles_update_self_or_admin ON public.user_profiles;
CREATE POLICY user_profiles_update_self_or_admin
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS student_profiles_select_self_or_admin ON public.student_profiles;
CREATE POLICY student_profiles_select_self_or_admin
  ON public.student_profiles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS student_profiles_insert_self_or_admin ON public.student_profiles;
CREATE POLICY student_profiles_insert_self_or_admin
  ON public.student_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS student_profiles_update_self_or_admin ON public.student_profiles;
CREATE POLICY student_profiles_update_self_or_admin
  ON public.student_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS mentor_profiles_select_visibility_rule ON public.mentor_profiles;
CREATE POLICY mentor_profiles_select_visibility_rule
  ON public.mentor_profiles
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = user_id
    OR is_approved = true
  );

DROP POLICY IF EXISTS mentor_profiles_insert_self_or_admin ON public.mentor_profiles;
CREATE POLICY mentor_profiles_insert_self_or_admin
  ON public.mentor_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS mentor_profiles_update_self_or_admin ON public.mentor_profiles;
CREATE POLICY mentor_profiles_update_self_or_admin
  ON public.mentor_profiles
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

REVOKE ALL ON TABLE public.user_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.student_profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.mentor_profiles FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mentor_profiles TO authenticated;

COMMIT;
