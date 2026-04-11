import { Server } from 'socket.io';
import { supabaseAdmin } from '../config/supabaseClient.js';
import { getAllowedOrigins } from '../config/allowedOrigins.js';
import {
  createMessage,
  getConversationMembership,
  listConversationIdsForUser,
} from '../services/chatService.js';

let ioInstance = null;

function extractBearerToken(authorization) {
  const raw = typeof authorization === 'string' ? authorization : '';
  const [scheme, token] = raw.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

function getHandshakeToken(socket) {
  if (typeof socket.handshake.auth?.token === 'string' && socket.handshake.auth.token.trim()) {
    return socket.handshake.auth.token.trim();
  }
  return extractBearerToken(socket.handshake.headers?.authorization);
}

export function getSocketServer() {
  return ioInstance;
}

export function initSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getHandshakeToken(socket);
      if (!token) {
        return next(new Error('Missing auth token'));
      }

      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) {
        return next(new Error('Invalid auth token'));
      }

      socket.user = {
        id: data.user.id,
        email: data.user.email,
      };

      return next();
    } catch (err) {
      return next(new Error('Socket auth failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;

    socket.join(`user:${userId}`);

    try {
      const conversationIds = await listConversationIdsForUser(userId);
      for (const conversationId of conversationIds) {
        socket.join(`conversation:${conversationId}`);
      }
    } catch (err) {
      console.error('socket initial room join failed', err);
    }

    socket.on('conversation:join', async (payload, ack) => {
      try {
        const conversationId = payload?.conversationId;
        if (!conversationId || typeof conversationId !== 'string') {
          throw new Error('conversationId is required');
        }

        const membership = await getConversationMembership(conversationId, userId);
        if (!membership) {
          throw new Error('Not a conversation member');
        }

        socket.join(`conversation:${conversationId}`);
        if (typeof ack === 'function') {
          ack({ ok: true });
        }
      } catch (err) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message || 'Failed to join conversation' });
        }
      }
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        const conversationId = payload?.conversationId;
        const content = payload?.content;
        if (!conversationId || typeof conversationId !== 'string') {
          throw new Error('conversationId is required');
        }

        const message = await createMessage(conversationId, userId, content);
        io.to(`conversation:${conversationId}`).emit('message:new', message);
        if (typeof ack === 'function') {
          ack({ ok: true, message });
        }
      } catch (err) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: err.message || 'Failed to send message' });
        }
      }
    });
  });

  ioInstance = io;
  return io;
}

