-- 006_admin_support.sql
-- Purpose:
-- - Admin audit tables for mentor approval and review moderation

BEGIN;

CREATE TABLE IF NOT EXISTS public.mentor_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  approved boolean NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  action text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_approval_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_approval_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.review_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_moderation_actions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mentor_approval_events_admin_only ON public.mentor_approval_events;
CREATE POLICY mentor_approval_events_admin_only
  ON public.mentor_approval_events
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS review_moderation_actions_admin_only ON public.review_moderation_actions;
CREATE POLICY review_moderation_actions_admin_only
  ON public.review_moderation_actions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON TABLE public.mentor_approval_events FROM anon, authenticated;
REVOKE ALL ON TABLE public.review_moderation_actions FROM anon, authenticated;

GRANT SELECT, INSERT ON TABLE public.mentor_approval_events TO authenticated;
GRANT SELECT, INSERT ON TABLE public.review_moderation_actions TO authenticated;

COMMIT;
