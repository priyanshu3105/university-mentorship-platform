-- 005_reviews.sql
-- Purpose:
-- - Review + rating domain
-- - Automatic mentor rating aggregation

BEGIN;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_visible boolean NOT NULL DEFAULT true,
  hidden_at timestamptz,
  hidden_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  hide_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (mentor_id <> student_id)
);

DROP TRIGGER IF EXISTS reviews_updated_at ON public.reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'reviews_unique_per_booking'
  ) THEN
    CREATE UNIQUE INDEX reviews_unique_per_booking
      ON public.reviews(booking_id)
      WHERE booking_id IS NOT NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_review_mentor(
  p_student_id uuid,
  p_mentor_id uuid,
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.availability_slots s
      ON s.id = b.slot_id
    WHERE b.student_id = p_student_id
      AND b.mentor_id = p_mentor_id
      AND b.status IN ('confirmed', 'completed')
      AND s.start_at <= now()
      AND (p_booking_id IS NULL OR b.id = p_booking_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.refresh_mentor_rating(p_mentor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric(3,2);
  v_count integer;
BEGIN
  SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0.00),
         COUNT(*)::integer
  INTO v_avg, v_count
  FROM public.reviews r
  WHERE r.mentor_id = p_mentor_id
    AND r.is_visible = true;

  UPDATE public.mentor_profiles mp
  SET average_rating = v_avg,
      rating_count = v_count,
      updated_at = now()
  WHERE mp.user_id = p_mentor_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_refresh_mentor_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_mentor_rating(OLD.mentor_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_mentor_rating(NEW.mentor_id);
  IF TG_OP = 'UPDATE' AND OLD.mentor_id <> NEW.mentor_id THEN
    PERFORM public.refresh_mentor_rating(OLD.mentor_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_refresh_mentor_rating ON public.reviews;
CREATE TRIGGER reviews_refresh_mentor_rating
  AFTER INSERT OR UPDATE OR DELETE
  ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_mentor_rating();

REVOKE ALL ON FUNCTION public.can_review_mentor(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_mentor(uuid, uuid, uuid) TO authenticated;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_select_visibility_rule ON public.reviews;
CREATE POLICY reviews_select_visibility_rule
  ON public.reviews
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = student_id
    OR auth.uid() = mentor_id
    OR is_visible = true
  );

DROP POLICY IF EXISTS reviews_insert_student_eligibility ON public.reviews;
CREATE POLICY reviews_insert_student_eligibility
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND public.can_review_mentor(auth.uid(), mentor_id, booking_id)
  );

DROP POLICY IF EXISTS reviews_update_owner_or_admin ON public.reviews;
CREATE POLICY reviews_update_owner_or_admin
  ON public.reviews
  FOR UPDATE
  USING (public.is_admin() OR auth.uid() = student_id)
  WITH CHECK (public.is_admin() OR auth.uid() = student_id);

DROP POLICY IF EXISTS reviews_delete_admin_only ON public.reviews;
CREATE POLICY reviews_delete_admin_only
  ON public.reviews
  FOR DELETE
  USING (public.is_admin());

REVOKE ALL ON TABLE public.reviews FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated;

COMMIT;
