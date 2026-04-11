import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft, Users, Link2, Plus, Star, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useChatSocket } from "@/contexts/ChatSocketContext";
import type { ConversationItem, ConversationMember, ConversationMessage } from "@/types/api";

type ChatConversationsResponse = { items: ConversationItem[] };
type ChatMessagesResponse = { items: ConversationMessage[] };

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { socket } = useChatSocket();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endRating, setEndRating] = useState(0);
  const [endComment, setEndComment] = useState("");
  const [endSaving, setEndSaving] = useState(false);
  const [sessionTick, setSessionTick] = useState(0);

  const [groupNameInput, setGroupNameInput] = useState("");
  const [directUserIdInput, setDirectUserIdInput] = useState("");
  const [inviteTokenInput, setInviteTokenInput] = useState("");
  const [memberUserIdInput, setMemberUserIdInput] = useState("");
  const [inviteTokenCreated, setInviteTokenCreated] = useState("");
  const [groupActionError, setGroupActionError] = useState("");

  const activeConversationIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const isMobile = window.innerWidth < 768;

  const canManageMembers = activeConv?.myRole === "owner" || activeConv?.myRole === "admin";

  const canSendInThread =
    activeConv &&
    (activeConv.type === "group" ||
      (Boolean(activeConv.canSendMessages) && !activeConv.closedAt));

  const sessionRemainingLabel = useMemo(() => {
    if (!activeConv?.chatSessionEndsAt || activeConv.type !== "direct") return null;
    const end = new Date(activeConv.chatSessionEndsAt).getTime();
    const ms = end - Date.now();
    if (ms <= 0) return "Scheduled session time has ended — book again to chat.";
    const m = Math.max(1, Math.ceil(ms / 60000));
    return `Session ends in ~${m} min`;
  }, [activeConv?.chatSessionEndsAt, activeConv?.type, sessionTick]);

  useEffect(() => {
    const id = window.setInterval(() => setSessionTick((t) => t + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  const otherMember = useMemo(() => {
    if (!activeConv || !profile?.id) return null;
    return activeConv.members.find((m) => m.userId !== profile.id) || null;
  }, [activeConv, profile?.id]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      setError("");
      const data = (await apiGet("/chat/conversations")) as ChatConversationsResponse;
      setConversations(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      setLoadingMessages(true);
      const data = (await apiGet(`/chat/conversations/${id}/messages?limit=100`)) as ChatMessagesResponse;
      setMessages(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(conversationId);
    socket?.emit("conversation:join", { conversationId });
  }, [conversationId, loadMessages, socket]);

  useEffect(() => {
    if (!socket) return;

    const onMessageNew = (message: ConversationMessage) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
            : conv
        )
      );
      setMessages((prev) => {
        if (message.conversationId !== activeConversationIdRef.current) return prev;
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    };

    const refreshConversations = () => {
      void loadConversations();
    };

    const onConversationClosed = () => {
      void loadConversations();
      const id = activeConversationIdRef.current;
      if (id) void loadMessages(id);
    };

    socket.on("message:new", onMessageNew);
    socket.on("conversation:updated", refreshConversations);
    socket.on("conversation:closed", onConversationClosed);
    socket.on("group:member_added", refreshConversations);
    socket.on("group:member_removed", refreshConversations);
    socket.on("group:member_role_updated", refreshConversations);

    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("conversation:updated", refreshConversations);
      socket.off("conversation:closed", onConversationClosed);
      socket.off("group:member_added", refreshConversations);
      socket.off("group:member_removed", refreshConversations);
      socket.off("group:member_role_updated", refreshConversations);
    };
  }, [socket, loadConversations, loadMessages]);

  const handleEndSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || endRating < 1 || endRating > 5) {
      setError("Please choose a star rating.");
      return;
    }
    if (!endComment.trim()) {
      setError("Please write a short review.");
      return;
    }
    setEndSaving(true);
    setError("");
    try {
      await apiPost(`/chat/conversations/${conversationId}/end-session`, {
        rating: endRating,
        comment: endComment.trim(),
        bookingId: activeConv?.activeBookingId || undefined,
      });
      setEndModalOpen(false);
      setEndRating(0);
      setEndComment("");
      await loadConversations();
      await loadMessages(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end the conversation.");
    } finally {
      setEndSaving(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendInThread) return;
    if (!newMsg.trim() || !conversationId) return;
    setMessageSending(true);
    const content = newMsg.trim();
    setNewMsg("");
    setError("");

    if (socket && socket.connected) {
      await new Promise<void>((resolve) => {
        socket.emit("message:send", { conversationId, content }, (ack: { ok: boolean; error?: string }) => {
          if (!ack?.ok && ack?.error) setError(ack.error);
          resolve();
        });
      });
      setMessageSending(false);
      return;
    }

    try {
      const created = (await apiPost(`/chat/conversations/${conversationId}/messages`, {
        content,
      })) as ConversationMessage;
      setMessages((prev) => [...prev, created]);
      setConversations((prev) =>
        prev.map((conv) => (conv.id === conversationId ? { ...conv, lastMessage: created } : conv))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setNewMsg(content);
    } finally {
      setMessageSending(false);
    }
  };

  const handleCreateGroup = async () => {
    setGroupActionError("");
    if (!groupNameInput.trim()) {
      setGroupActionError("Group name is required.");
      return;
    }
    try {
      const data = (await apiPost("/chat/conversations/group", {
        name: groupNameInput.trim(),
      })) as { conversationId: string };
      setGroupNameInput("");
      await loadConversations();
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to create group.");
    }
  };

  const handleCreateDirect = async () => {
    setGroupActionError("");
    if (!directUserIdInput.trim()) {
      setGroupActionError("User ID is required for direct chat.");
      return;
    }
    try {
      const data = (await apiPost("/chat/conversations/direct", {
        participantId: directUserIdInput.trim(),
      })) as { conversationId: string };
      setDirectUserIdInput("");
      await loadConversations();
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to create direct chat.");
    }
  };

  const handleJoinInvite = async () => {
    setGroupActionError("");
    if (!inviteTokenInput.trim()) {
      setGroupActionError("Invite token is required.");
      return;
    }
    try {
      const data = (await apiPost(`/chat/invites/${inviteTokenInput.trim()}/join`, {})) as {
        conversationId: string;
      };
      setInviteTokenInput("");
      await loadConversations();
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to join by invite.");
    }
  };

  const handleCreateInvite = async () => {
    if (!conversationId) return;
    setGroupActionError("");
    try {
      const data = (await apiPost(`/chat/conversations/${conversationId}/invites`, {
        expiresInHours: 72,
        maxUses: 20,
      })) as { token: string };
      setInviteTokenCreated(data.token || "");
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to create invite.");
    }
  };

  const handleAddMember = async () => {
    if (!conversationId) return;
    setGroupActionError("");
    if (!memberUserIdInput.trim()) {
      setGroupActionError("Member user ID is required.");
      return;
    }
    try {
      await apiPost(`/chat/conversations/${conversationId}/members`, {
        userId: memberUserIdInput.trim(),
      });
      setMemberUserIdInput("");
      await loadConversations();
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to add member.");
    }
  };

  const handleRoleToggle = async (member: ConversationMember) => {
    if (!conversationId) return;
    const role = member.role === "admin" ? "member" : "admin";
    try {
      await apiPatch(`/chat/conversations/${conversationId}/members/${member.userId}`, { role });
      await loadConversations();
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to update role.");
    }
  };

  const handleRemoveMember = async (member: ConversationMember) => {
    if (!conversationId) return;
    try {
      await apiDelete(`/chat/conversations/${conversationId}/members/${member.userId}`);
      await loadConversations();
    } catch (err) {
      setGroupActionError(err instanceof Error ? err.message : "Failed to remove member.");
    }
  };

  const threadMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-4">
        <div
          className={`${
            conversationId ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 lg:w-80 shrink-0 border border-border rounded-lg overflow-hidden`}
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Messages</h2>
          </div>
          <div className="px-3 py-3 border-b border-border space-y-2">
            <p className="text-[10px] text-muted-foreground leading-snug px-0.5">
              <strong className="text-foreground">Direct:</strong> use{" "}
              <span className="text-foreground">Bookings → Message</span> after a confirmed booking, or paste a user
              UUID. <strong className="text-foreground">Groups:</strong> name + invite link for everyone (WhatsApp-style).
            </p>
            <div className="flex gap-2">
              <input
                value={directUserIdInput}
                onChange={(e) => setDirectUserIdInput(e.target.value)}
                placeholder="User UUID (advanced)"
                className="flex-1 px-2 py-1.5 border border-input rounded-md text-xs"
              />
              <button
                type="button"
                onClick={() => void handleCreateDirect()}
                className="px-2 py-1.5 rounded-md text-xs border border-border"
              >
                DM
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                placeholder="New group name"
                className="flex-1 px-2 py-1.5 border border-input rounded-md text-xs"
              />
              <button
                type="button"
                onClick={() => void handleCreateGroup()}
                className="px-2 py-1.5 rounded-md text-xs bg-primary text-primary-foreground"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={inviteTokenInput}
                onChange={(e) => setInviteTokenInput(e.target.value)}
                placeholder="Paste invite token"
                className="flex-1 px-2 py-1.5 border border-input rounded-md text-xs"
              />
              <button
                type="button"
                onClick={() => void handleJoinInvite()}
                className="px-2 py-1.5 rounded-md text-xs border border-border"
              >
                Join
              </button>
            </div>
            {groupActionError ? <p className="text-[11px] text-destructive">{groupActionError}</p> : null}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {loadingConversations ? (
              <p className="text-xs text-muted-foreground px-4 py-3">Loading conversations...</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors ${
                    conv.id === conversationId ? "bg-secondary/70" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold shrink-0">
                    {conv.type === "group" ? <Users size={13} /> : conv.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {conv.type === "group" ? "Group" : "Direct"} · {conv.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={`${conversationId ? "flex" : "hidden md:flex"} flex-1 flex-col border border-border rounded-lg overflow-hidden`}>
          {activeConv ? (
            <>
              <div className="border-b border-border px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold">
                  {activeConv.type === "group" ? <Users size={13} /> : activeConv.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">{activeConv.name}</span>
                  <p className="text-[11px] text-muted-foreground">
                    {activeConv.type === "group"
                      ? `${activeConv.members.length} members`
                      : otherMember?.appRole
                        ? otherMember.appRole === "mentor"
                          ? "Mentor"
                          : otherMember.appRole === "student"
                            ? "Student"
                            : "Direct message"
                        : "Direct message"}
                  </p>
                </div>
                {activeConv.type === "direct" && activeConv.studentCanEndSession ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setEndModalOpen(true);
                    }}
                    className="text-xs px-2 py-1 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    End conversation
                  </button>
                ) : null}
                {activeConv.type === "group" && canManageMembers ? (
                  <button
                    onClick={() => void handleCreateInvite()}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border"
                  >
                    <Link2 size={12} />
                    Invite
                  </button>
                ) : null}
              </div>

              {activeConv.type === "group" ? (
                <div className="border-b border-border px-4 py-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {activeConv.members.map((member) => (
                      <div key={member.userId} className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-border text-xs">
                        <span>{member.fullName}</span>
                        <span className="text-muted-foreground">({member.role})</span>
                        {canManageMembers && member.role !== "owner" ? (
                          <>
                            <button
                              onClick={() => void handleRoleToggle(member)}
                              className="text-primary hover:underline"
                            >
                              {member.role === "admin" ? "Demote" : "Promote"}
                            </button>
                            <button
                              onClick={() => void handleRemoveMember(member)}
                              className="text-destructive hover:underline"
                            >
                              Remove
                            </button>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  {canManageMembers ? (
                    <div className="flex gap-2">
                      <input
                        value={memberUserIdInput}
                        onChange={(e) => setMemberUserIdInput(e.target.value)}
                        placeholder="User ID to add"
                        className="flex-1 px-2 py-1.5 border border-input rounded-md text-xs"
                      />
                      <button
                        onClick={() => void handleAddMember()}
                        className="px-2 py-1.5 rounded-md text-xs bg-primary text-primary-foreground"
                      >
                        Add
                      </button>
                    </div>
                  ) : null}
                  {inviteTokenCreated ? (
                    <p className="text-[11px] text-muted-foreground break-all">
                      Invite token: <span className="font-medium text-foreground">{inviteTokenCreated}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {activeConv.type === "direct" && activeConv.closedAt ? (
                <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/30 text-xs text-foreground">
                  This conversation has ended. You can read the history, but messaging is disabled for both sides
                  until you book a new session (your chat history stays here).
                </div>
              ) : null}

              {activeConv.type === "direct" && !activeConv.closedAt && activeConv.canSendMessages === false ? (
                <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-xs text-foreground flex items-start gap-2">
                  <Clock size={14} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Messaging is only available during your scheduled session window. {sessionRemainingLabel || "Book a session to unlock chat for that time slot."}
                  </span>
                </div>
              ) : null}

              {activeConv.type === "direct" && activeConv.canSendMessages && activeConv.chatSessionEndsAt ? (
                <div className="px-4 py-2 bg-secondary/80 border-b border-border text-[11px] text-muted-foreground flex items-center gap-2">
                  <Clock size={13} />
                  {sessionRemainingLabel}
                </div>
              ) : null}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-sm text-muted-foreground">Loading messages...</p>
                ) : (
                  threadMessages.map((msg) => {
                    const isSelf = msg.senderId === profile?.id;
                    return (
                      <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-xs lg:max-w-md">
                          <div
                            className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                              isSelf
                                ? "bg-primary/10 text-foreground rounded-br-sm"
                                : "bg-secondary text-foreground rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <p className={`text-xs text-muted-foreground mt-1 ${isSelf ? "text-right" : "text-left"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border p-3">
                {error ? <p className="text-xs text-destructive mb-2">{error}</p> : null}
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder={
                      canSendInThread ? "Type a message..." : "Messaging unavailable for this conversation..."
                    }
                    disabled={!canSendInThread}
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!newMsg.trim() || messageSending || !canSendInThread}
                    className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Select a conversation to start messaging.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {!conversationId && isMobile ? null : null}

      {endModalOpen && conversationId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            role="dialog"
            aria-modal="true"
            onSubmit={handleEndSessionSubmit}
            className="w-full max-w-md rounded-lg border border-border bg-background shadow-lg p-5 space-y-4"
          >
            <h3 className="text-sm font-semibold text-foreground">End conversation</h3>
            <p className="text-xs text-muted-foreground">
              Rate this mentor and leave a short written review. The chat will close for both of you after you submit.
            </p>
            <div className="flex gap-1 justify-center py-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEndRating(n)}
                  className="p-1 rounded-md hover:bg-secondary"
                  aria-label={`${n} stars`}
                >
                  <Star
                    size={28}
                    className={n <= endRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={endComment}
              onChange={(e) => setEndComment(e.target.value)}
              placeholder="What went well? What could improve?"
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground resize-y min-h-[96px]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-xs rounded-md border border-border"
                onClick={() => {
                  setEndModalOpen(false);
                  setEndRating(0);
                  setEndComment("");
                }}
                disabled={endSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={endSaving || endRating < 1 || !endComment.trim()}
                className="px-3 py-1.5 text-xs rounded-md bg-destructive text-destructive-foreground disabled:opacity-50"
              >
                {endSaving ? "Submitting…" : "Submit & end"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
