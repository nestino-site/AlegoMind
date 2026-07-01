"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe, type Stripe, type StripeCardElement } from "@stripe/stripe-js";
import { useAuth } from "@/lib/context/AuthContext";
import {
  messagesApi,
  type ChatTopicOption,
  type Conversation,
  type ConversationOptions,
  type Message,
} from "@/lib/api/messages";
import { useChat } from "@/lib/hooks/useChat";
import { useUnread } from "@/lib/context/UnreadContext";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { IconChevronLeft, IconSend } from "@/components/ui/Icons";

/* ── Stripe ──────────────────────────────────────────────────── */

// Support both env var names; return null (not empty string) so loadStripe is never called with ""
const _stripePk =
  process.env.NEXT_PUBLIC_STRIPE_PK ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "";
const stripePromise = _stripePk ? loadStripe(_stripePk) : Promise.resolve(null);

/* ── Helpers ─────────────────────────────────────────────────── */

function proName(c: Conversation) {
  return c.professional?.user?.displayName ?? c.professional?.user?.firstName ?? "Profesionist";
}
function proInitial(c: Conversation) { return proName(c)[0]?.toUpperCase() ?? "P"; }
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function formatDateSep(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Astazi";
  if (d.toDateString() === yesterday.toDateString()) return "Ieri";
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
}

/* ── Topic tag ────────────────────────────────────────────────── */

function TopicTag({ label, type, cost }: { label: string; type: "FREE" | "PAID"; cost?: number | null }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 border-b text-xs font-medium ${
      type === "FREE"
        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
        : "bg-brand-50 border-brand-100 text-brand-700"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${type === "FREE" ? "bg-emerald-500" : "bg-brand-500"}`} />
      <span>{label}</span>
      {type === "PAID" && cost != null && <span className="ml-auto font-semibold">{cost} RON</span>}
      {type === "FREE" && <span className="ml-auto font-semibold">Gratuit</span>}
    </div>
  );
}

/* ── Option cards ─────────────────────────────────────────────── */

function OptionCards({ options, onSelect, selecting }: {
  options: ConversationOptions; onSelect: (o: ChatTopicOption) => void; selecting: boolean;
}) {
  const hasAny = options.freeOptions.length > 0 || options.paidOptions.length > 0;
  return (
    <div className="px-4 pb-4 space-y-2">
      {options.freeOptions.map((opt) => (
        <button key={opt.id ?? opt.label} onClick={() => onSelect(opt)} disabled={selecting}
          className="w-full text-left rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 hover:bg-emerald-100 transition-colors disabled:opacity-60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800">{opt.label}</p>
              {opt.description && <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">{opt.description}</p>}
            </div>
            <span className="flex-shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white">Gratuit</span>
          </div>
        </button>
      ))}
      {options.paidOptions.map((opt) => (
        <button key={opt.id ?? opt.label} onClick={() => onSelect(opt)} disabled={selecting}
          className="w-full text-left rounded-2xl border border-border bg-white p-4 hover:border-brand-300 hover:bg-brand-50/30 transition-colors disabled:opacity-60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
              {opt.description && <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{opt.description}</p>}
            </div>
            <span className="flex-shrink-0 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">{opt.price} RON</span>
          </div>
        </button>
      ))}
      {!hasAny && (
        <p className="text-xs text-text-muted text-center py-4">Profesionistul nu a configurat încă opțiunile de chat.</p>
      )}
    </div>
  );
}

/* ── Stripe payment modal ─────────────────────────────────────── */

function PaymentModal({ topicLabel, price, clientSecret, onSuccess, onCancel }: {
  topicLabel: string; price: number; clientSecret: string;
  onSuccess: () => void; onCancel: () => void;
}) {
  const cardRef   = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const cardElRef = useRef<StripeCardElement | null>(null);
  const [paying, setPaying]   = useState(false);
  const [ready, setReady]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    stripePromise.then((stripe) => {
      if (!stripe || !cardRef.current) return;
      stripeRef.current = stripe;
      const elements = stripe.elements({ clientSecret, locale: "ro" });
      const card = elements.create("card", { style: { base: { fontSize: "14px", color: "#1a1a2e" } } });
      card.mount(cardRef.current);
      cardElRef.current = card;
      card.on("ready", () => setReady(true));
    });
    return () => { cardElRef.current?.destroy(); };
  }, [clientSecret]);

  async function handlePay() {
    const stripe = stripeRef.current;
    const card   = cardElRef.current;
    if (!stripe || !card) return;
    setPaying(true); setError(null);
    const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });
    if (result.error) {
      setError(result.error.message ?? "Plata a esuat. Incearca din nou.");
      setPaying(false);
    } else {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-bold text-text-primary mb-1">Plateste pentru a continua</h2>
        <p className="text-xs text-text-muted mb-4">
          <span className="font-semibold text-text-primary">{topicLabel}</span> — {price} RON
        </p>
        <div ref={cardRef} className="rounded-xl border border-border bg-bg p-3 mb-4 min-h-[42px]" />
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={paying}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg transition-colors">
            Anuleaza
          </button>
          <button onClick={handlePay} disabled={paying || !ready}
            className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
            {paying ? "Se proceseaza..." : `Plateste ${price} RON`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Ticks ────────────────────────────────────────────────────── */

function DoubleTick({ read }: { read: boolean }) {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" className={`inline-block ml-1 flex-shrink-0 ${read ? "text-blue-500" : "text-gray-400"}`}>
      <path d="M1 5.5l3 3L10 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 5.5l3 3L15 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Bubble ───────────────────────────────────────────────────── */

function Bubble({ msg, isMine, showTime, otherPartyReadAt }: {
  msg: Message; isMine: boolean; showTime: boolean; otherPartyReadAt?: Date | null;
}) {
  const isSystemMsg = msg.content.startsWith("—") && msg.content.endsWith("—");
  if (isSystemMsg) {
    return (
      <div className="flex items-center gap-3 my-3 px-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] text-text-muted font-medium">{msg.content.replace(/^—\s*/, "").replace(/\s*—$/, "")}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }

  const isRead = isMine && otherPartyReadAt != null && new Date(msg.createdAt) <= otherPartyReadAt;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      <div className="max-w-[75%]">
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isMine
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-white border border-border text-text-primary rounded-bl-sm"
        }`}>{msg.content}</div>
        {showTime && (
          <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
            <span className="text-[10px] text-text-muted">{formatTime(msg.createdAt)}</span>
            {isMine && <DoubleTick read={isRead} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useAuth();
  const { setActiveConversation } = useUnread();

  // Mark as read while viewing; clear on leave
  useEffect(() => {
    if (id) setActiveConversation(id);
    return () => setActiveConversation(null);
  }, [id, setActiveConversation]);

  const [conv, setConv]           = useState<Conversation | null>(null);
  const [options, setOptions]     = useState<ConversationOptions | null>(null);
  const [msgs, setMsgs]           = useState<Message[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [sending, setSending]     = useState(false);
  const [input, setInput]         = useState("");
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [otherPartyReadAt, setOtherPartyReadAt] = useState<Date | null>(null);
  const [pendingPayment, setPendingPayment] = useState<{
    clientSecret: string; topicLabel: string; price: number; piId: string;
  } | null>(null);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const initialLoad = useRef(true);

  useEffect(() => {
    // Load conversation + messages independently from options so a failed options
    // call never prevents the chat from rendering.
    const emptyMsgs = { messages: [] as Message[], totalPages: 0, seekerLastReadAt: null, proLastReadAt: null };
    Promise.all([
      messagesApi.getConversations().catch((): Conversation[] => []),
      messagesApi.getMessages(id, 1, 30).catch(() => emptyMsgs),
    ]).then(([convs, p1]) => {
      setConv(convs.find((c) => c.id === id) ?? null);
      setMsgs([...p1.messages].reverse());
      setHasMore(p1.totalPages > 1);
      // Seeker sees ticks based on when the pro last read
      if (p1.proLastReadAt) setOtherPartyReadAt(new Date(p1.proLastReadAt));
    }).finally(() => setLoading(false));

    messagesApi.getConversationOptions(id)
      .then(setOptions)
      .catch(() => { /* options unavailable — chat still usable for ACTIVE conversations */ });
  }, [id]);

  useEffect(() => {
    if (!loading && initialLoad.current) {
      initialLoad.current = false;
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    }
  }, [loading]);

  const loadMore = useCallback(async () => {
    const next = page + 1;
    const data = await messagesApi.getMessages(id, next, 30);
    setMsgs((prev) => [...[...data.messages].reverse(), ...prev]);
    setHasMore(next < data.totalPages);
    setPage(next);
  }, [id, page]);

  const handleIncoming = useCallback((msg: Message) => {
    setMsgs((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  const handleConversationReset = useCallback(() => {
    setConv((p) => p ? { ...p, status: "PENDING_TOPIC", topicLabel: null, topicType: null, topicCost: null } : p);
    // Refresh options from server — professional may have changed their menu
    messagesApi.getConversationOptions(id).then(setOptions).catch(() => {});
  }, [id]);

  const { sendMessage: sendWs } = useChat({
    conversationId: id,
    userId: user?.id,
    onMessage: handleIncoming,
    onConversationReset: handleConversationReset,
    onMessagesRead: (event) => {
      // Pro read the messages (isSeeker=false means the pro read)
      if (!event.isSeeker) setOtherPartyReadAt(new Date(event.readAt));
    },
  });

  async function handleSelectTopic(opt: ChatTopicOption) {
    setSelecting(true);
    try {
      const result = await messagesApi.selectTopic(
        id, opt.label, opt.type,
        opt.type === "PAID" ? { chatServiceId: opt.id, price: opt.price } : undefined,
      );
      if (result.status === "ACTIVE") {
        setConv((p) => p ? { ...p, status: "ACTIVE", topicLabel: opt.label, topicType: opt.type, topicCost: opt.type === "PAID" ? opt.price : 0 } : p);
        setOptions((p) => p ? { ...p, conversationStatus: "ACTIVE", topicLabel: opt.label, topicType: opt.type } : p);
        if (result.message) { setMsgs((p) => [...p, result.message!]); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }
      } else if (result.clientSecret) {
        const piId = result.clientSecret.split("_secret_")[0];
        setPendingPayment({ clientSecret: result.clientSecret, topicLabel: opt.label, price: opt.price, piId });
      }
    } catch { /* ignore */ } finally {
      setSelecting(false);
    }
  }

  async function handlePaymentSuccess() {
    if (!pendingPayment) return;
    try {
      await messagesApi.confirmTopicPayment(id, pendingPayment.piId);
      const [opts, p1] = await Promise.all([
        messagesApi.getConversationOptions(id),
        messagesApi.getMessages(id, 1, 30),
      ]);
      setOptions(opts);
      setConv((p) => p ? { ...p, status: "ACTIVE", topicLabel: opts.topicLabel, topicType: opts.topicType ?? null, topicCost: opts.topicCost } : p);
      setMsgs([...p1.messages].reverse());
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch { /* ignore */ } finally {
      setPendingPayment(null);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput(""); setSending(true);
    try {
      // Always use HTTP — the controller broadcasts to the room so the pro
      // gets real-time notification, and we see our own message immediately.
      const sent = await messagesApi.sendMessage(id, text);
      handleIncoming(sent);
    } catch { /* ignore */ } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isActive   = options?.conversationStatus === "ACTIVE" || conv?.status === "ACTIVE";
  const topicLabel = options?.topicLabel ?? conv?.topicLabel;
  const topicType  = options?.topicType  ?? conv?.topicType;
  const topicCost  = options?.topicCost  ?? conv?.topicCost;

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100vh-3.5rem)] -mx-4 -my-6 lg:-mx-8 lg:-my-8">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-white animate-pulse">
          <div className="h-10 w-10 rounded-2xl bg-gray-100" />
          <div className="space-y-2"><div className="h-3.5 w-28 rounded bg-gray-100" /><div className="h-3 w-16 rounded bg-gray-100" /></div>
        </div>
        <div className="flex-1 bg-bg" />
      </div>
    );
  }

  if (!conv) return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <p className="text-sm text-text-muted">Conversatie negasita.</p>
      <button onClick={() => router.back()} className="mt-4 text-xs text-brand-500 underline">Inapoi</button>
    </div>
  );

  const name = proName(conv);

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100vh-3.5rem)] -mx-4 -my-6 lg:-mx-8 lg:-my-8">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-border bg-white flex-shrink-0">
          <button onClick={() => router.push("/conversatii")}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-text-secondary hover:bg-bg transition-colors">
            <IconChevronLeft size={20} />
          </button>
          {conv.professional?.user?.avatar ? (
            <img src={conv.professional.user.avatar} alt={name} className="h-10 w-10 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-brand-50 border border-border flex items-center justify-center text-sm font-bold text-brand-500 flex-shrink-0">
              {proInitial(conv)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
            <TypeBadge type={conv.professional?.type} />
          </div>
        </div>

        {/* Topic tag */}
        {isActive && topicLabel && topicType && (
          <TopicTag label={topicLabel} type={topicType} cost={topicCost} />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-bg space-y-1">
          {hasMore && (
            <div className="text-center mb-4">
              <button onClick={loadMore} className="text-xs text-brand-500 hover:underline">Incarca mesaje mai vechi</button>
            </div>
          )}

          {msgs.map((msg, i) => {
            const prev = msgs[i - 1];
            const showSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
            const isMine = msg.senderId === user?.id;
            const isLast = i === msgs.length - 1 || msgs[i + 1]?.senderId !== msg.senderId;
            return (
              <div key={msg.id}>
                {showSep && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-semibold text-text-muted">{formatDateSep(msg.createdAt)}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <Bubble msg={msg} isMine={isMine} showTime={isLast} otherPartyReadAt={otherPartyReadAt} />
              </div>
            );
          })}

          {/* Option cards after messages when PENDING_TOPIC */}
          {!isActive && options && (
            <div className="mt-2">
              <p className="text-xs text-text-muted text-center mb-3 px-4">Alege un subiect pentru a incepe conversatia</p>
              <OptionCards options={options} onSelect={handleSelectTopic} selecting={selecting} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={`flex items-end gap-3 px-4 py-3 border-t border-border bg-white flex-shrink-0 transition-opacity ${!isActive ? "opacity-40 pointer-events-none" : ""}`}>
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey} placeholder="Scrie un mesaj..." disabled={!isActive} rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <button onClick={handleSend} disabled={!isActive || !input.trim() || sending}
            className="h-11 w-11 flex-shrink-0 rounded-2xl bg-brand-500 flex items-center justify-center text-white hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <IconSend size={18} />
          </button>
        </div>
      </div>

      {pendingPayment && (
        <PaymentModal
          clientSecret={pendingPayment.clientSecret}
          topicLabel={pendingPayment.topicLabel}
          price={pendingPayment.price}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPendingPayment(null)}
        />
      )}
    </>
  );
}
