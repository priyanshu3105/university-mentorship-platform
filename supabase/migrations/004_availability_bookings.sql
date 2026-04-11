-- 004_availability_bookings.sql
-- Purpose:
-- - Slot management for mentors
-- - Booking model with hard double-booking protection

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_at < end_at)
);

DROP TRIGGER IF EXISTS availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER availability_slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Prevent overlapping slots for the same mentor.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'availability_slots_no_overlap'
  ) THEN
    ALTER TABLE public.availability_slots
      ADD CONSTRAINT availability_slots_no_overlap
      EXCLUDE USING gist (
        mentor_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
      );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL UNIQUE REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
  mentor_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  CHECK (mentor_id <> student_id)
);

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.sync_booking_mentor_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT s.mentor_id
  INTO NEW.mentor_id
  FROM public.availability_slots s
  WHERE s.id = NEW.slot_id;

  IF NEW.mentor_id IS NULL THEN
    RAISE EXCEPTION 'Invalid slot_id %', NEW.slot_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS booking_sync_mentor_id ON public.bookings;
CREATE TRIGGER booking_sync_mentor_id
  BEFORE INSERT OR UPDATE OF slot_id
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_booking_mentor_id();

CREATE OR REPLACE FUNCTION public.sync_slot_booked_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.availability_slots
    SET is_booked = false
    WHERE id = OLD.slot_id;
    RETURN OLD;
  END IF;

  UPDATE public.availability_slots
  SET is_booked = (NEW.status = 'confirmed')
  WHERE id = NEW.slot_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_sync_slot_flag ON public.bookings;
CREATE TRIGGER bookings_sync_slot_flag
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.sync_slot_booked_flag();

CREATE OR REPLACE FUNCTION public.can_book_slot(p_slot_id uuid, p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.availability_slots s
    JOIN public.mentor_profiles mp
      ON mp.user_id = s.mentor_id
    WHERE s.id = p_slot_id
      AND s.is_booked = false
      AND s.start_at > now()
      AND s.mentor_id <> p_student_id
      AND mp.is_approved = true
  );
$$;

REVOKE ALL ON FUNCTION public.can_book_slot(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_book_slot(uuid, uuid) TO authenticated;

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS availability_slots_select_visible_or_owner ON public.availability_slots;
CREATE POLICY availability_slots_select_visible_or_owner
  ON public.availability_slots
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = mentor_id
    OR EXISTS (
      SELECT 1
      FROM public.mentor_profiles mp
      WHERE mp.user_id = mentor_id
        AND mp.is_approved = true
    )
  );

DROP POLICY IF EXISTS availability_slots_insert_owner_or_admin ON public.availability_slots;
CREATE POLICY availability_slots_insert_owner_or_admin
  ON public.availability_slots
  FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS availability_slots_update_owner_or_admin ON public.availability_slots;
CREATE POLICY availability_slots_update_owner_or_admin
  ON public.availability_slots
  FOR UPDATE
  USING (public.is_admin() OR auth.uid() = mentor_id)
  WITH CHECK (public.is_admin() OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS availability_slots_delete_owner_or_admin ON public.availability_slots;
CREATE POLICY availability_slots_delete_owner_or_admin
  ON public.availability_slots
  FOR DELETE
  USING (public.is_admin() OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS bookings_select_party_or_admin ON public.bookings;
CREATE POLICY bookings_select_party_or_admin
  ON public.bookings
  FOR SELECT
  USING (public.is_admin() OR auth.uid() = student_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS bookings_insert_student_only ON public.bookings;
CREATE POLICY bookings_insert_student_only
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND public.can_book_slot(slot_id, auth.uid())
  );

DROP POLICY IF EXISTS bookings_update_party_or_admin ON public.bookings;
CREATE POLICY bookings_update_party_or_admin
  ON public.bookings
  FOR UPDATE
  USING (public.is_admin() OR auth.uid() = student_id OR auth.uid() = mentor_id)
  WITH CHECK (public.is_admin() OR auth.uid() = student_id OR auth.uid() = mentor_id);

REVOKE ALL ON TABLE public.availability_slots FROM anon, authenticated;
REVOKE ALL ON TABLE public.bookings FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.availability_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bookings TO authenticated;

COMMIT;
