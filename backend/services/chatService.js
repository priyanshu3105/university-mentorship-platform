import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { cleanText, parsePositiveInt } from '../utils/validation.js';
import { getUserProfilesByIds } from './userService.js';
import {
  assertDirectMessagingAllowed,
  getActiveBookingWindowForPair,
} from './chatSessionPolicy.js';

function hashInviteToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function messageToResponse(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listConversationIdsForUser(userId) {
  const { data, error } = await supabaseAdmin
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId)
    .is('left_at', null);

  if (error) throw error;
  return (data || []).map((row) => row.conversation_id);
}

export async function getConversationMembership(conversationId, userId) {
  const { data, error } = await supabaseAdmin
    .from('conversation_members')
    .select('conversation_id, user_id, role, joined_at, left_at')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .is('left_at', null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getConversationById(conversationId) {
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('id, type, name, created_by, created_at, updated_at')
    .eq('id', conversationId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listConversationsForUser(userId) {
  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from('conversation_members')
    .select('conversation_id, role, joined_at')
    .eq('user_id', userId)
    .is('left_at', null);

  if (membershipsError) throw membershipsError;

  const conversationIds = (memberships || []).map((m) => m.conversation_id);
  if (!conversationIds.length) return [];

  const [
    { data: conversations, error: conversationsError },
    { data: members, error: membersError },
    { data: messages, error: messagesError },
  ] = await Promise.all([
    supabaseAdmin
      .from('conversations')
      .select('id, type, name, created_by, created_at, updated_at, closed_at, closed_by_student_id')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('conversation_members')
      .select('conversation_id, user_id, role')
      .in('conversation_id', conversationIds)
      .is('left_at', null),
    supabaseAdmin
      .from('messages')
      .select('id, conversation_id, sender_id, content, created_at, updated_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })
      .limit(500),
  ]);

  if (conversationsError) throw conversationsError;
  if (membersError) throw membersError;
  if (messagesError) throw messagesError;

  const userIds = (members || []).map((row) => row.user_id);
  const users = await getUserProfilesByIds(userIds);
  const membershipByConversation = new Map(
    (memberships || []).map((row) => [row.conversation_id, row])
  );

  const membersByConversation = new Map();
  for (const member of members || []) {
    const list = membersByConversation.get(member.conversation_id) || [];
    list.push({
      userId: member.user_id,
      role: member.role,
      fullName: users.get(member.user_id)?.full_name || 'Unknown User',
      appRole: users.get(member.user_id)?.role || null,
    });
    membersByConversation.set(member.conversation_id, list);
  }

  const latestMessageByConversation = new Map();
  for (const message of messages || []) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }
  }

  const rows = await Promise.all(
    (conversations || []).map(async (conversation) => {
      const convMembers = membersByConversation.get(conversation.id) || [];
      const selfMembership = membershipByConversation.get(conversation.id);
      const latest = latestMessageByConversation.get(conversation.id) || null;

      let displayName = conversation.name || 'Conversation';
      if (conversation.type === 'direct') {
        const other = convMembers.find((m) => m.userId !== userId);
        displayName = other?.fullName || displayName;
      }

      let canSendMessages = true;
      let chatSessionEndsAt = null;
      let activeBookingId = null;
      let studentCanEndSession = false;
      const closedAt = conversation.closed_at || null;
      const closedByStudentId = conversation.closed_by_student_id || null;

      if (conversation.type === 'group') {
        canSendMessages = true;
      } else if (conversation.type === 'direct') {
        const m1 = convMembers[0];
        const m2 = convMembers[1];
        const r1 = users.get(m1?.userId)?.role;
        const r2 = users.get(m2?.userId)?.role;
        const mentorId = r1 === 'mentor' ? m1.userId : r2 === 'mentor' ? m2.userId : null;
        const studentMemberId = r1 === 'student' ? m1.userId : r2 === 'student' ? m2.userId : null;

        if (closedAt) {
          canSendMessages = false;
        } else if (mentorId && studentMemberId) {
          const win = await getActiveBookingWindowForPair(mentorId, studentMemberId);
          canSendMessages = !!win;
          chatSessionEndsAt = win?.endAt || null;
          activeBookingId = win?.bookingId || null;
        } else {
          canSendMessages = false;
        }

        studentCanEndSession =
          users.get(userId)?.role === 'student' &&
          userId === studentMemberId &&
          !closedAt &&
          !!mentorId;
      }

      return {
        id: conversation.id,
        type: conversation.type,
        name: displayName,
        rawName: conversation.name,
        myRole: selfMembership?.role || 'member',
        members: convMembers,
        lastMessage: latest ? messageToResponse(latest) : null,
        updatedAt: conversation.updated_at,
        createdAt: conversation.created_at,
        closedAt,
        closedByStudentId,
        canSendMessages,
        chatSessionEndsAt,
        activeBookingId,
        studentCanEndSession,
      };
    })
  );

  return rows;
}

export async function listMessagesForConversation(conversationId, userId, query = {}) {
  const membership = await getConversationMembership(conversationId, userId);
  if (!membership) {
    const err = new Error('Not a conversation member');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const limit = parsePositiveInt(query.limit, { fallback: 50, min: 1, max: 200 });
  let builder = supabaseAdmin
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, updated_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (typeof query.before === 'string' && query.before.trim()) {
    builder = builder.lt('created_at', query.before.trim());
  }

  const { data, error } = await builder;
  if (error) throw error;

  return (data || []).map(messageToResponse).reverse();
}

export async function createMessage(conversationId, senderId, content) {
  const normalized = cleanText(content, { max: 4000 });
  if (!normalized) {
    const err = new Error('Message content is required');
    err.code = 'VALIDATION';
    throw err;
  }

  const membership = await getConversationMembership(conversationId, senderId);
  if (!membership) {
    const err = new Error('Not a conversation member');
    err.code = 'FORBIDDEN';
    throw err;
  }

  await assertDirectMessagingAllowed(conversationId, senderId);

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: normalized,
    })
    .select('id, conversation_id, sender_id, content, created_at, updated_at')
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return messageToResponse(data);
}

export async function getOrCreateDirectConversation(initiatorId, participantId) {
  if (!participantId || participantId === initiatorId) {
    const err = new Error('A different participant is required');
    err.code = 'VALIDATION';
    throw err;
  }

  const [userAId, userBId] = [initiatorId, participantId].sort();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('direct_conversation_pairs')
    .select('conversation_id')
    .eq('user_a_id', userAId)
    .eq('user_b_id', userBId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.conversation_id) {
    return existing.conversation_id;
  }

  const profiles = await getUserProfilesByIds([initiatorId, participantId]);
  const rInit = profiles.get(initiatorId)?.role;
  const rPart = profiles.get(participantId)?.role;
  const mentorId = rInit === 'mentor' ? initiatorId : rPart === 'mentor' ? participantId : null;
  const studentId = rInit === 'student' ? initiatorId : rPart === 'student' ? participantId : null;
  if (!mentorId || !studentId) {
    const err = new Error('Direct messages are only between a mentor and a student');
    err.code = 'VALIDATION';
    throw err;
  }

  const win = await getActiveBookingWindowForPair(mentorId, studentId);
  if (!win) {
    const err = new Error(
      'You can only start a new chat during your scheduled session time. Open Chat to view an existing conversation.',
    );
    err.code = 'FORBIDDEN';
    throw err;
  }

  const { data: conversation, error: createConversationError } = await supabaseAdmin
    .from('conversations')
    .insert({
      type: 'direct',
      created_by: initiatorId,
      name: null,
    })
    .select('id')
    .single();

  if (createConversationError) throw createConversationError;

  const conversationId = conversation.id;

  const { error: membersError } = await supabaseAdmin
    .from('conversation_members')
    .insert([
      { conversation_id: conversationId, user_id: initiatorId, role: 'member' },
      { conversation_id: conversationId, user_id: participantId, role: 'member' },
    ]);

  if (membersError) throw membersError;

  const { error: pairError } = await supabaseAdmin
    .from('direct_conversation_pairs')
    .insert({
      user_a_id: userAId,
      user_b_id: userBId,
      conversation_id: conversationId,
    });

  if (pairError) {
    const { data: retryExisting, error: retryError } = await supabaseAdmin
      .from('direct_conversation_pairs')
      .select('conversation_id')
      .eq('user_a_id', userAId)
      .eq('user_b_id', userBId)
      .maybeSingle();

    if (retryError) throw retryError;
    if (retryExisting?.conversation_id) {
      return retryExisting.conversation_id;
    }
    throw pairError;
  }

  return conversationId;
}

export async function createGroupConversation(ownerId, name, memberIds = []) {
  const normalizedName = cleanText(name, { max: 140 });
  if (!normalizedName) {
    const err = new Error('Group name is required');
    err.code = 'VALIDATION';
    throw err;
  }

  const uniqueMembers = [...new Set(memberIds.filter(Boolean).filter((id) => id !== ownerId))];

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('conversations')
    .insert({
      type: 'group',
      name: normalizedName,
      created_by: ownerId,
    })
    .select('id')
    .single();

  if (conversationError) throw conversationError;

  const membershipRows = [
    { conversation_id: conversation.id, user_id: ownerId, role: 'owner' },
    ...uniqueMembers.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: 'member',
    })),
  ];

  const { error: membersError } = await supabaseAdmin
    .from('conversation_members')
    .insert(membershipRows);

  if (membersError) throw membersError;

  return conversation.id;
}

async function requireGroupAdmin(conversationId, actorId) {
  const [conversation, membership] = await Promise.all([
    getConversationById(conversationId),
    getConversationMembership(conversationId, actorId),
  ]);

  if (!conversation) {
    const err = new Error('Conversation not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (conversation.type !== 'group') {
    const err = new Error('Conversation is not a group');
    err.code = 'VALIDATION';
    throw err;
  }
  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    const err = new Error('Group admin access required');
    err.code = 'FORBIDDEN';
    throw err;
  }

  return { conversation, membership };
}

export async function addOrRejoinGroupMember(conversationId, actorId, userId, role = 'member') {
  await requireGroupAdmin(conversationId, actorId);

  const normalizedRole = role === 'admin' || role === 'member' ? role : 'member';
  const { data, error } = await supabaseAdmin
    .from('conversation_members')
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        role: normalizedRole,
        left_at: null,
      },
      { onConflict: 'conversation_id,user_id' }
    )
    .select('conversation_id, user_id, role, joined_at, left_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateGroupMemberRole(conversationId, actorId, targetUserId, role) {
  await requireGroupAdmin(conversationId, actorId);
  if (role !== 'admin' && role !== 'member') {
    const err = new Error('role must be admin or member');
    err.code = 'VALIDATION';
    throw err;
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId)
    .is('left_at', null)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!current) {
    const err = new Error('Member not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (current.role === 'owner') {
    const err = new Error('Cannot change owner role');
    err.code = 'VALIDATION';
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('conversation_members')
    .update({ role })
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId)
    .is('left_at', null)
    .select('conversation_id, user_id, role, joined_at, left_at')
    .single();

  if (error) throw error;
  return data;
}

export async function removeGroupMember(conversationId, actorId, targetUserId) {
  const actorMembership = await getConversationMembership(conversationId, actorId);
  if (!actorMembership) {
    const err = new Error('Not a conversation member');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const canManageOthers = actorMembership.role === 'owner' || actorMembership.role === 'admin';
  if (targetUserId !== actorId && !canManageOthers) {
    const err = new Error('Group admin access required');
    err.code = 'FORBIDDEN';
    throw err;
  }

  const { data: targetMembership, error: targetError } = await supabaseAdmin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId)
    .is('left_at', null)
    .maybeSingle();

  if (targetError) throw targetError;
  if (!targetMembership) {
    const err = new Error('Member not found');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (targetMembership.role === 'owner' && targetUserId !== actorId) {
    const err = new Error('Owner can only leave voluntarily');
    err.code = 'VALIDATION';
    throw err;
  }

  const { error } = await supabaseAdmin
    .from('conversation_members')
    .update({ left_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', targetUserId)
    .is('left_at', null);

  if (error) throw error;
}

export async function createGroupInvite(conversationId, actorId, { expiresInHours = 48, maxUses = null } = {}) {
  await requireGroupAdmin(conversationId, actorId);

  const token = crypto.randomBytes(24).toString('base64url');
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + Math.max(1, Number(expiresInHours)) * 3600 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('conversation_invites')
    .insert({
      conversation_id: conversationId,
      token_hash: tokenHash,
      created_by: actorId,
      expires_at: expiresAt,
      max_uses: maxUses,
      used_count: 0,
    })
    .select('id, conversation_id, expires_at, max_uses, used_count, created_at')
    .single();

  if (error) throw error;

  return {
    ...data,
    token,
  };
}

export async function joinGroupByInvite(token, userId) {
  const tokenHash = hashInviteToken(token);

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('conversation_invites')
    .select('id, conversation_id, expires_at, max_uses, used_count, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (inviteError) throw inviteError;
  if (!invite || invite.revoked_at) {
    const err = new Error('Invite not found');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    const err = new Error('Invite is expired');
    err.code = 'VALIDATION';
    throw err;
  }
  if (invite.max_uses !== null && invite.used_count >= invite.max_uses) {
    const err = new Error('Invite has reached max uses');
    err.code = 'VALIDATION';
    throw err;
  }

  const conversation = await getConversationById(invite.conversation_id);
  if (!conversation || conversation.type !== 'group') {
    const err = new Error('Invite conversation is invalid');
    err.code = 'VALIDATION';
    throw err;
  }

  const { error: joinError } = await supabaseAdmin
    .from('conversation_members')
    .upsert(
      {
        conversation_id: invite.conversation_id,
        user_id: userId,
        role: 'member',
        left_at: null,
      },
      { onConflict: 'conversation_id,user_id' }
    );

  if (joinError) throw joinError;

  const { error: incrementError } = await supabaseAdmin
    .from('conversation_invites')
    .update({ used_count: invite.used_count + 1 })
    .eq('id', invite.id);

  if (incrementError) throw incrementError;

  return invite.conversation_id;
}
