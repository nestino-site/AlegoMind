"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { messagesApi, type Message, type ProConversation } from "@/lib/api/messages";
import { useAuth } from "@/lib/context/AuthContext";
import { useChat } from "@/lib/hooks/useChat";
import { useUnread } from "@/lib/context/UnreadContext";
import { IconChevronLeft, IconSend } from "@/components/ui/Icons";

function DoubleTick({ read }: { read: boolean }) {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" className={`inline-block ml-1 flex-shrink-0 ${read ? "text-blue-500" : "text-gray-400"}`}>
      <path d="M1 5.5l3 3L10 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5.5l3 3L15 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function seekerName(c: ProConversation) {
  return c.seeker?.displayName ?? c.seeker?.firstName ?? "Client";
}
function seekerInitial(c: ProConversation) { return seekerName(c)[0]?.toUpperCase() ?? "C"; }
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function EndSessionButton({ onEnd, ending }: { onEnd: () => void; ending: boolean }) {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Ești sigur?</span>
        <button
          onClick={() => { setConfirm(false); onEnd(); }}
          disabled={ending}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
        >
          {ending ? "Se închide..." : "Da, închide"}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg transition-colors"
        >
          Anulează
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
    >
      Încheie sesiunea
    </button>
  );
}

export default function ProChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setActiveConversation } = useUnread();

  // Mark as read while viewing; clear on leave
  useEffect(() => {
    if (id) setActiveConversation(id);
    return () => setActiveConversation(null);
  }, [id, setActiveConversation]);

  const { user } = useAuth();
  const [conv, setConv] = useState<ProConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherPartyReadAt, setOtherPartyReadAt] = useState<Date | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      messagesApi.getProConversations(),
      messagesApi.getMessages(id),
    ])
      .then(([convs, page]) => {
        setConv(convs.find((c) => c.id === id) ?? null);
        setMessages([...page.messages].reverse());
        // Pro sees ticks based on when the seeker last read
        if (page.seekerLastReadAt) setOtherPartyReadAt(new Date(page.seekerLastReadAt));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleIncoming = useCallback((msg: Message) => {
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  // When seeker selects a topic, this fires — update status to ACTIVE
  const handleConversationReset = useCallback(() => {
    setConv((p) => p ? { ...p, status: "PENDING_TOPIC", topicLabel: null } : p);
  }, []);

  const { sendMessage: wsSend } = useChat({
    conversationId: id,
    userId: user?.id,
    onMessage: handleIncoming,
    onConversationReset: handleConversationReset,
    onMessagesRead: (event) => {
      // Pro sees ticks go blue when the seeker reads
      if (event.isSeeker) setOtherPartyReadAt(new Date(event.readAt));
    },
  });

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    setSending(true);
    try {
      // Always use HTTP — controller broadcasts to the room so the seeker
      // gets real-time notification, and we see our own message immediately.
      const msg = await messagesApi.sendMessage(id, content);
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    } catch (err) {
      console.error(err);
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  async function handleEndSession() {
    setEnding(true);
    try {
      const result = await messagesApi.endSession(id);
      setMessages((prev) => [...prev, result.message]);
      setConv((p) => p ? { ...p, status: "PENDING_TOPIC", topicLabel: null } : p);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      console.error(err);
    } finally {
      setEnding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] lg:h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] lg:h-screen items-center justify-center text-sm text-text-muted">
        Conversatie negasita.
      </div>
    );
  }

  const name = seekerName(conv);
  const isActive = conv.status === "ACTIVE";

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100vh-3.5rem)] -mx-4 -my-6 lg:-mx-8 lg:-my-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 flex-shrink-0">
        <button
          onClick={() => router.push("/profesionist/mesaje")}
          className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-bg transition-colors"
        >
          <IconChevronLeft size={18} className="text-text-secondary" />
        </button>

        <div className="h-10 w-10 rounded-xl bg-brand-50 border border-border flex items-center justify-center flex-shrink-0">
          {conv.seeker?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={conv.seeker.avatar} alt={name} className="h-full w-full rounded-xl object-cover" />
          ) : (
            <span className="text-base font-bold text-brand-500">{seekerInitial(conv)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-text-primary truncate">{name}</p>
          {conv.topicLabel ? (
            <p className="text-xs text-text-muted truncate">{conv.topicLabel}</p>
          ) : (
            <p className="text-xs text-amber-500">Așteaptă alegerea unui subiect</p>
          )}
        </div>

        {/* End session button — only when active */}
        {isActive && (
          <EndSessionButton onEnd={handleEndSession} ending={ending} />
        )}

        {/* Status badge when waiting */}
        {!isActive && (
          <span className="flex-shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600 border border-amber-200">
            Fără subiect activ
          </span>
        )}
      </div>

      {/* Active topic banner */}
      {isActive && conv.topicLabel && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-brand-100 bg-brand-50 text-xs font-medium text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          <span>{conv.topicLabel}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.map((msg) => {
          const isPro = msg.senderType === "PROFESSIONAL";
          const isSystem = msg.content.startsWith("—") && msg.content.endsWith("—");

          if (isSystem) {
            return (
              <div key={msg.id} className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-medium text-text-muted px-2 text-center max-w-xs">
                  {msg.content.replace(/^—\s*/, "").replace(/\s*—$/, "")}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex mb-1 ${isPro ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isPro
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-white border border-border text-text-primary rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${isPro ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-text-muted">{formatTime(msg.createdAt)}</span>
                  {isPro && (
                    <DoubleTick read={otherPartyReadAt != null && new Date(msg.createdAt) <= otherPartyReadAt} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — disabled when no active topic */}
      <div className={`border-t border-border bg-white px-4 py-3 flex-shrink-0 transition-opacity ${!isActive ? "opacity-40 pointer-events-none" : ""}`}>
        {!isActive && (
          <p className="text-xs text-text-muted text-center mb-2">
            Clientul trebuie să aleagă un subiect înainte de a putea trimite mesaje.
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrie un mesaj..."
            disabled={!isActive}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!isActive || !input.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            <IconSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
