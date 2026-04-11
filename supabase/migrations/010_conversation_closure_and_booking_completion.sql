-- 010_conversation_closure_and_booking_completion.sql
-- - Mark past confirmed bookings as completed
-- - Direct conversations: optional closure after student ends session (review)

BEGIN;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by_student_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_closed_at ON public.conversations(closed_at)
  WHERE closed_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.mark_past_bookings_completed()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.bookings b
  SET status = 'completed'::public.booking_status,
      updated_at = now()
  FROM public.availability_slots s
  WHERE b.slot_id = s.id
    AND b.status = 'confirmed'::public.booking_status
    AND s.end_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_past_bookings_completed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_past_bookings_completed() TO service_role;

COMMIT;
