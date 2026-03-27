import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { conversations, messages as allMessages, currentUser } from "@/data/mockData";

export default function Chat() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [newMsg, setNewMsg] = useState("");
  const [msgs, setMsgs] = useState(allMessages);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const threadMessages = msgs.filter((m) => m.conversationId === conversationId);

  const isMobile = window.innerWidth < 768;
  const showList = !conversationId || !isMobile;
  const showThread = !!conversationId;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !conversationId) return;
    const msg = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: currentUser.id,
      text: newMsg.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMsgs((prev) => [...prev, msg]);
    setNewMsg("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-4">
        {/* Left panel: Conversation list */}
        <div
          className={`${
            conversationId ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 lg:w-72 shrink-0 border border-border rounded-lg overflow-hidden`}
        >
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors ${
                  conv.id === conversationId ? "bg-secondary/70" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold shrink-0">
                  {conv.participantInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{conv.participantName}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{conv.lastTimestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel: Message thread */}
        <div className={`${conversationId ? "flex" : "hidden md:flex"} flex-1 flex-col border border-border rounded-lg overflow-hidden`}>
          {activeConv ? (
            <>
              {/* Thread header */}
              <div className="border-b border-border px-4 py-3 flex items-center gap-3">
                <button
                  onClick={() => navigate("/chat")}
                  className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold">
                  {activeConv.participantInitials}
                </div>
                <span className="text-sm font-semibold text-foreground">{activeConv.participantName}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadMessages.map((msg) => {
                  const isSelf = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-xs lg:max-w-sm">
                        <div
                          className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                            isSelf
                              ? "bg-primary/10 text-foreground rounded-br-sm"
                              : "bg-secondary text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <p className={`text-xs text-muted-foreground mt-1 ${isSelf ? "text-right" : "text-left"}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  />
                  <button
                    type="submit"
                    disabled={!newMsg.trim()}
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
    </div>
  );
}
