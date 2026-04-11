-- 009_feature_extensions.sql
-- Purpose:
-- - Add unique direct-conversation pairing helper table
-- - Add transactional booking RPC for race-safe booking

BEGIN;

CREATE TABLE IF NOT EXISTS public.direct_conversation_pairs (
  user_a_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_direct_conversation_pairs_conversation
  ON public.direct_conversation_pairs(conversation_id);

ALTER TABLE public.direct_conversation_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_conversation_pairs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS direct_pairs_select_own_or_admin ON public.direct_conversation_pairs;
CREATE POLICY direct_pairs_select_own_or_admin
  ON public.direct_conversation_pairs
  FOR SELECT
  USING (
    public.is_admin()
    OR auth.uid() = user_a_id
    OR auth.uid() = user_b_id
  );

DROP POLICY IF EXISTS direct_pairs_insert_own_or_admin ON public.direct_conversation_pairs;
CREATE POLICY direct_pairs_insert_own_or_admin
  ON public.direct_conversation_pairs
  FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR auth.uid() = user_a_id
    OR auth.uid() = user_b_id
  );

REVOKE ALL ON TABLE public.direct_conversation_pairs FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.direct_conversation_pairs TO authenticated;

CREATE OR REPLACE FUNCTION public.create_booking_transactional(
  p_slot_id uuid,
  p_student_id uuid
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slot public.availability_slots;
  v_booking public.bookings;
BEGIN
  SELECT *
  INTO v_slot
  FROM public.availability_slots
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_NOT_FOUND';
  END IF;

  IF v_slot.is_booked THEN
    RAISE EXCEPTION 'SLOT_ALREADY_BOOKED';
  END IF;

  IF v_slot.start_at <= now() THEN
    RAISE EXCEPTION 'SLOT_IN_PAST';
  END IF;

  IF v_slot.mentor_id = p_student_id THEN
    RAISE EXCEPTION 'SELF_BOOKING_NOT_ALLOWED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.mentor_profiles mp
    WHERE mp.user_id = v_slot.mentor_id
      AND mp.is_approved = true
  ) THEN
    RAISE EXCEPTION 'MENTOR_NOT_APPROVED';
  END IF;

  INSERT INTO public.bookings (slot_id, mentor_id, student_id, status)
  VALUES (p_slot_id, v_slot.mentor_id, p_student_id, 'confirmed')
  RETURNING * INTO v_booking;

  RETURN v_booking;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'SLOT_ALREADY_BOOKED';
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_transactional(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_transactional(uuid, uuid) TO authenticated;

COMMIT;
