import { Router } from 'express';
import {
  addConversationMember,
  createConversationInvite,
  createDirectConversation,
  createGroupConversationHandler,
  deleteConversationMember,
  endStudentDirectConversation,
  joinConversationByInvite,
  listChatConversations,
  listConversationMessages,
  patchConversationMember,
  sendConversationMessage,
} from '../controllers/chatController.js';
import { requireAuth, requireStudent } from '../middleware/auth.js';

const router = Router();

router.get('/chat/conversations', requireAuth, listChatConversations);
router.post('/chat/conversations/direct', requireAuth, createDirectConversation);
router.post('/chat/conversations/group', requireAuth, createGroupConversationHandler);
router.get('/chat/conversations/:id/messages', requireAuth, listConversationMessages);
router.post('/chat/conversations/:id/end-session', requireAuth, requireStudent, endStudentDirectConversation);
router.post('/chat/conversations/:id/messages', requireAuth, sendConversationMessage);
router.post('/chat/conversations/:id/members', requireAuth, addConversationMember);
router.patch('/chat/conversations/:id/members/:userId', requireAuth, patchConversationMember);
router.delete('/chat/conversations/:id/members/:userId', requireAuth, deleteConversationMember);
router.post('/chat/conversations/:id/invites', requireAuth, createConversationInvite);
router.post('/chat/invites/:token/join', requireAuth, joinConversationByInvite);

export default router;

