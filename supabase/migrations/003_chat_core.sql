-- 003_chat_core.sql
-- Purpose:
-- - Add direct/group conversation model
-- - Add secure membership and invite-link primitives
-- - Add message persistence

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_type') THEN
    CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_member_role') THEN
    CREATE TYPE public.group_member_role AS ENUM ('owner', 'admin', 'member');
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.conversation_type NOT NULL DEFAULT 'direct',
  name text,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_group_name_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_group_name_check
  CHECK (type <> 'group' OR (name IS NOT NULL AND length(trim(name)) > 0));

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_content_nonempty;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_nonempty CHECK (length(trim(content)) > 0);

DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.conversation_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS conversation_invites_updated_at ON public.conversation_invites;
CREATE TRIGGER conversation_invites_updated_at
  BEFORE UPDATE ON public.conversation_invites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_conversation_member(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_admin(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
      AND cm.role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_conversation_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid) TO authenticated;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_invites FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select_if_member ON public.conversations;
CREATE POLICY conversations_select_if_member
  ON public.conversations
  FOR SELECT
  USING (public.is_admin() OR public.is_conversation_member(id));

DROP POLICY IF EXISTS conversations_insert_creator_only ON public.conversations;
CREATE POLICY conversations_insert_creator_only
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = created_by OR public.is_admin());

DROP POLICY IF EXISTS conversations_update_admin_or_creator ON public.conversations;
CREATE POLICY conversations_update_admin_or_creator
  ON public.conversations
  FOR UPDATE
  USING (public.is_admin() OR created_by = auth.uid() OR public.is_conversation_admin(id))
  WITH CHECK (public.is_admin() OR created_by = auth.uid() OR public.is_conversation_admin(id));

DROP POLICY IF EXISTS conversation_members_select_if_member ON public.conversation_members;
CREATE POLICY conversation_members_select_if_member
  ON public.conversation_members
  FOR SELECT
  USING (public.is_admin() OR public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS conversation_members_insert_admin_only ON public.conversation_members;
CREATE POLICY conversation_members_insert_admin_only
  ON public.conversation_members
  FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_conversation_admin(conversation_id));

DROP POLICY IF EXISTS conversation_members_update_self_or_admin ON public.conversation_members;
CREATE POLICY conversation_members_update_self_or_admin
  ON public.conversation_members
  FOR UPDATE
  USING (
    public.is_admin()
    OR public.is_conversation_admin(conversation_id)
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_conversation_admin(conversation_id)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS conversation_members_delete_admin_only ON public.conversation_members;
CREATE POLICY conversation_members_delete_admin_only
  ON public.conversation_members
  FOR DELETE
  USING (public.is_admin() OR public.is_conversation_admin(conversation_id));

DROP POLICY IF EXISTS messages_select_if_member ON public.messages;
CREATE POLICY messages_select_if_member
  ON public.messages
  FOR SELECT
  USING (public.is_admin() OR public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS messages_insert_if_member_and_sender ON public.messages;
CREATE POLICY messages_insert_if_member_and_sender
  ON public.messages
  FOR INSERT
  WITH CHECK (
    (public.is_admin() OR public.is_conversation_member(conversation_id))
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS messages_update_sender_or_admin ON public.messages;
CREATE POLICY messages_update_sender_or_admin
  ON public.messages
  FOR UPDATE
  USING (public.is_admin() OR sender_id = auth.uid())
  WITH CHECK (public.is_admin() OR sender_id = auth.uid());

DROP POLICY IF EXISTS conversation_invites_select_admins_only ON public.conversation_invites;
CREATE POLICY conversation_invites_select_admins_only
  ON public.conversation_invites
  FOR SELECT
  USING (public.is_admin() OR public.is_conversation_admin(conversation_id));

DROP POLICY IF EXISTS conversation_invites_insert_admins_only ON public.conversation_invites;
CREATE POLICY conversation_invites_insert_admins_only
  ON public.conversation_invites
  FOR INSERT
  WITH CHECK (
    (public.is_admin() OR public.is_conversation_admin(conversation_id))
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS conversation_invites_update_admins_only ON public.conversation_invites;
CREATE POLICY conversation_invites_update_admins_only
  ON public.conversation_invites
  FOR UPDATE
  USING (public.is_admin() OR public.is_conversation_admin(conversation_id))
  WITH CHECK (public.is_admin() OR public.is_conversation_admin(conversation_id));

REVOKE ALL ON TABLE public.conversations FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_members FROM anon, authenticated;
REVOKE ALL ON TABLE public.messages FROM anon, authenticated;
REVOKE ALL ON TABLE public.conversation_invites FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.conversation_invites TO authenticated;

COMMIT;
