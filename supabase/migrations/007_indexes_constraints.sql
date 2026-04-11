-- 007_indexes_constraints.sql
-- Purpose:
-- - Add query/perf indexes and additional integrity constraints

BEGIN;

-- Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_approved ON public.mentor_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_availability ON public.mentor_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);

-- Chat
CREATE INDEX IF NOT EXISTS idx_conversations_type_created_at
  ON public.conversations(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_conversation
  ON public.conversation_members(user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_active
  ON public.conversation_members(conversation_id)
  WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at
  ON public.messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at
  ON public.messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_invites_active_lookup
  ON public.conversation_invites(conversation_id, revoked_at, expires_at);

-- Availability + bookings
CREATE INDEX IF NOT EXISTS idx_slots_mentor_start_at
  ON public.availability_slots(mentor_id, start_at);

CREATE INDEX IF NOT EXISTS idx_slots_open_future
  ON public.availability_slots(start_at)
  WHERE is_booked = false;

CREATE INDEX IF NOT EXISTS idx_bookings_student_created_at
  ON public.bookings(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_mentor_created_at
  ON public.bookings(mentor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at
  ON public.bookings(status, created_at DESC);

-- Reviews + admin
CREATE INDEX IF NOT EXISTS idx_reviews_mentor_created_at
  ON public.reviews(mentor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_visibility
  ON public.reviews(is_visible, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_student_created_at
  ON public.reviews(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentor_approval_events_mentor_created_at
  ON public.mentor_approval_events(mentor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_moderation_actions_review_created_at
  ON public.review_moderation_actions(review_id, created_at DESC);

DO $$
BEGIN
  IF to_regclass('public.conversation_invites') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'conversation_invites_used_count_limit'
    ) THEN
      ALTER TABLE public.conversation_invites
        ADD CONSTRAINT conversation_invites_used_count_limit
        CHECK (max_uses IS NULL OR used_count <= max_uses);
    END IF;
  END IF;
END;
$$;

COMMIT;
