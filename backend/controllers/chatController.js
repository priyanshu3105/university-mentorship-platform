import { getSocketServer } from '../socket/socketServer.js';
import {
  addOrRejoinGroupMember,
  createGroupConversation,
  createGroupInvite,
  createMessage,
  getOrCreateDirectConversation,
  joinGroupByInvite,
  listConversationsForUser,
  listMessagesForConversation,
  removeGroupMember,
  updateGroupMemberRole,
} from '../services/chatService.js';
import {
  endDirectConversationAsStudent,
  getDirectPairFromConversation,
} from '../services/chatSessionPolicy.js';
import { cleanText } from '../utils/validation.js';
import { hasConfirmedBookingBetween } from '../services/bookingPairGuard.js';
import { getUserRole } from '../services/userService.js';

function statusFromError(err) {
  if (err?.code === 'VALIDATION') return 400;
  if (err?.code === 'FORBIDDEN') return 403;
  if (err?.code === 'NOT_FOUND') return 404;
  if (err?.code === 'CONFLICT') return 409;
  return 500;
}

function errorMessageFromError(err) {
  if (typeof err?.message === 'string' && err.message.trim()) return err.message;
  return 'Request failed';
}

export async function listChatConversations(req, res) {
  try {
    const items = await listConversationsForUser(req.user.id);
    return res.json({ items });
  } catch (err) {
    console.error('listChatConversations error', err);
    return res.status(500).json({ error: 'Failed to load conversations' });
  }
}

export async function createDirectConversation(req, res) {
  try {
    const participantId = typeof req.body?.participantId === 'string'
      ? req.body.participantId.trim()
      : '';

    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    const allowDmWithoutBooking = process.env.ALLOW_DM_WITHOUT_BOOKING === 'true';
    if (!allowDmWithoutBooking) {
      const role = await getUserRole(req.user.id);
      if (role !== 'admin') {
        const ok = await hasConfirmedBookingBetween(req.user.id, participantId);
        if (!ok) {
          return res.status(403).json({
            error:
              'You can only start a direct message with someone you share a confirmed booking with',
          });
        }
      }
    }

    const conversationId = await getOrCreateDirectConversation(req.user.id, participantId);
    const io = getSocketServer();
    if (io) {
      io.to(`user:${req.user.id}`).emit('conversation:updated', { conversationId });
      io.to(`user:${participantId}`).emit('conversation:updated', { conversationId });
    }

    return res.status(201).json({ conversationId });
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('createDirectConversation error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function createGroupConversationHandler(req, res) {
  try {
    const name = cleanText(req.body?.name, { max: 140 });
    const memberIds = Array.isArray(req.body?.memberIds)
      ? req.body.memberIds.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim())
      : [];

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const conversationId = await createGroupConversation(req.user.id, name, memberIds);
    const io = getSocketServer();
    if (io) {
      for (const userId of [...new Set([req.user.id, ...memberIds])]) {
        io.to(`user:${userId}`).emit('conversation:updated', { conversationId });
      }
    }

    return res.status(201).json({ conversationId });
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('createGroupConversationHandler error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function listConversationMessages(req, res) {
  try {
    const items = await listMessagesForConversation(req.params.id, req.user.id, req.query);
    return res.json({ items });
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('listConversationMessages error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function sendConversationMessage(req, res) {
  try {
    const message = await createMessage(req.params.id, req.user.id, req.body?.content);
    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('message:new', message);
    }
    return res.status(201).json(message);
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('sendConversationMessage error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function addConversationMember(req, res) {
  try {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
    const role = req.body?.role === 'admin' ? 'admin' : 'member';
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const member = await addOrRejoinGroupMember(req.params.id, req.user.id, userId, role);
    const io = getSocketServer();
    if (io) {
      io.to(`user:${userId}`).emit('conversation:updated', { conversationId: req.params.id });
      io.to(`conversation:${req.params.id}`).emit('group:member_added', {
        conversationId: req.params.id,
        userId,
        role: member.role,
      });
    }

    return res.status(201).json(member);
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('addConversationMember error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function patchConversationMember(req, res) {
  try {
    const role = req.body?.role;
    if (role !== 'admin' && role !== 'member') {
      return res.status(400).json({ error: 'role must be admin or member' });
    }

    const member = await updateGroupMemberRole(
      req.params.id,
      req.user.id,
      req.params.userId,
      role
    );

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('group:member_role_updated', {
        conversationId: req.params.id,
        userId: req.params.userId,
        role: member.role,
      });
    }

    return res.json(member);
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('patchConversationMember error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function deleteConversationMember(req, res) {
  try {
    await removeGroupMember(req.params.id, req.user.id, req.params.userId);
    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('group:member_removed', {
        conversationId: req.params.id,
        userId: req.params.userId,
      });
      io.to(`user:${req.params.userId}`).emit('conversation:updated', {
        conversationId: req.params.id,
      });
    }
    return res.status(204).send();
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('deleteConversationMember error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function createConversationInvite(req, res) {
  try {
    const expiresInHours = Number.parseInt(req.body?.expiresInHours ?? '48', 10);
    const maxUsesRaw = req.body?.maxUses;
    const maxUses = maxUsesRaw === undefined || maxUsesRaw === null
      ? null
      : Number.parseInt(String(maxUsesRaw), 10);

    const invite = await createGroupInvite(req.params.id, req.user.id, {
      expiresInHours: Number.isInteger(expiresInHours) ? expiresInHours : 48,
      maxUses: Number.isInteger(maxUses) ? maxUses : null,
    });

    return res.status(201).json(invite);
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('createConversationInvite error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function endStudentDirectConversation(req, res) {
  try {
    const conversationId = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!conversationId) {
      return res.status(400).json({ error: 'conversation id is required' });
    }

    const rating = req.body?.rating;
    const comment = req.body?.comment;
    const bookingId =
      typeof req.body?.bookingId === 'string' && req.body.bookingId.trim()
        ? req.body.bookingId.trim()
        : undefined;

    await endDirectConversationAsStudent({
      conversationId,
      studentId: req.user.id,
      rating,
      comment,
      bookingId,
    });

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('conversation:closed', { conversationId });
      const pair = await getDirectPairFromConversation(conversationId);
      if (pair) {
        io.to(`user:${pair.mentorId}`).emit('conversation:updated', { conversationId });
        io.to(`user:${pair.studentId}`).emit('conversation:updated', { conversationId });
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('endStudentDirectConversation error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

export async function joinConversationByInvite(req, res) {
  try {
    const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';
    if (!token) {
      return res.status(400).json({ error: 'token is required' });
    }

    const conversationId = await joinGroupByInvite(token, req.user.id);
    const io = getSocketServer();
    if (io) {
      io.to(`user:${req.user.id}`).emit('conversation:updated', { conversationId });
      io.to(`conversation:${conversationId}`).emit('group:member_added', {
        conversationId,
        userId: req.user.id,
      });
    }

    return res.json({ conversationId });
  } catch (err) {
    const status = statusFromError(err);
    if (status === 500) console.error('joinConversationByInvite error', err);
    return res.status(status).json({ error: errorMessageFromError(err) });
  }
}

