import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { getSocketUrl } from "@/lib/socketUrl";
import { useAuth } from "@/contexts/AuthContext";
import type { ConversationMessage } from "@/types/api";

interface ChatSocketState {
  socket: Socket | null;
  connected: boolean;
  chatUnreadCount: number;
  clearChatUnread: () => void;
}

const ChatSocketContext = createContext<ChatSocketState | undefined>(undefined);

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { session, user } = useAuth(); // session used for socket lifecycle + sign-out reset
  const location = useLocation();
  const navigate = useNavigate();
  const locationPathRef = useRef(location.pathname);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    locationPathRef.current = location.pathname;
  }, [location.pathname]);

  const clearChatUnread = useCallback(() => {
    setChatUnreadCount(0);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/chat")) {
      clearChatUnread();
    }
  }, [location.pathname, clearChatUnread]);

  useEffect(() => {
    if (!session) setChatUnreadCount(0);
  }, [session]);

  useEffect(() => {
    const token = session?.access_token;
    const myId = user?.id;
    if (!token || !myId) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setConnected(false);
      return;
    }

    let mounted = true;
    const s = io(getSocketUrl(), {
      auth: { token },
      transports: ["websocket"],
    });

    const onMessageNew = (message: ConversationMessage) => {
      if (!mounted || message.senderId === myId) return;

      const path = locationPathRef.current;
      const openMatch = path.match(/^\/chat\/([^/]+)/);
      const openConvId = openMatch?.[1];
      const viewingThis = openConvId === message.conversationId;

      if (!viewingThis) {
        setChatUnreadCount((c) => c + 1);
        toast.message("New message", {
          description: message.content.length > 100 ? `${message.content.slice(0, 100)}…` : message.content,
          action: {
            label: "Open",
            onClick: () => navigate(`/chat/${message.conversationId}`),
          },
        });
        if (typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined") {
          if (Notification.permission === "granted") {
            try {
              new Notification("MentorConnect", {
                body: message.content.slice(0, 140),
                tag: message.conversationId,
              });
            } catch {
              /* ignore */
            }
          }
        }
      }
    };

    s.on("connect", () => {
      if (mounted) setConnected(true);
    });
    s.on("disconnect", () => {
      if (mounted) setConnected(false);
    });
    s.on("message:new", onMessageNew);

    setSocket(s);

    return () => {
      mounted = false;
      s.off("message:new", onMessageNew);
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [session?.access_token, user?.id, navigate]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      chatUnreadCount,
      clearChatUnread,
    }),
    [socket, connected, chatUnreadCount, clearChatUnread]
  );

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) throw new Error("useChatSocket must be used within ChatSocketProvider");
  return ctx;
}
