"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { messagesApi, type Conversation } from "@/lib/api/messages";
import { useUnread } from "@/lib/context/UnreadContext";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { IconMessage, IconSparkle } from "@/components/ui/Icons";

/* ── helpers ─────────────────────────────────────────────── */

function proName(c: Conversation) {
  return c.professional?.user?.displayName ?? c.professional?.user?.firstName ?? "Profesionist";
}

function proInitial(c: Conversation) {
  return proName(c)[0]?.toUpperCase() ?? "P";
}

function lastMsg(c: Conversation): string {
  return c.messages?.[0]?.content ?? "Incepe o conversatie...";
}

function relTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "acum";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}z`;
}

/* ── skeleton ────────────────────────────────────────────── */

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-12 w-12 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-28 rounded bg-gray-100" />
        <div className="h-3 w-44 rounded bg-gray-100" />
      </div>
      <div className="h-3 w-8 rounded bg-gray-100" />
    </div>
  );
}

/* ── conversation row ────────────────────────────────────── */

function ConvRow({ conv, unread }: { conv: Conversation; unread: number }) {
  const { latestMessages } = useUnread();
  const latest = latestMessages[conv.id];
  const name = proName(conv);
  const preview = latest?.content ?? lastMsg(conv);
  const ts = relTime(latest?.createdAt ?? conv.lastMessageAt);

  return (
    <Link
      href={`/conversatii/${conv.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors rounded-2xl group"
    >
      {conv.professional?.user?.avatar ? (
        <img
          src={conv.professional.user.avatar}
          alt={name}
          className="h-12 w-12 rounded-2xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-2xl bg-brand-50 border border-border flex items-center justify-center text-base font-bold text-brand-500 flex-shrink-0">
          {proInitial(conv)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm truncate ${unread > 0 ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>{name}</span>
          <TypeBadge type={conv.professional?.type} />
        </div>
        <p className={`text-xs truncate ${unread > 0 ? "text-text-secondary font-medium" : "text-text-muted"}`}>{preview}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[10px] text-text-muted">{ts}</span>
        {unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ── page ─────────────────────────────────────────────────── */

export default function ConversatiiPage() {
  const [convs, setConvs]     = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { unreadCounts, latestMessages, notifPermission, requestNotifPermission } = useUnread();

  useEffect(() => {
    messagesApi
      .getConversations()
      .then(setConvs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Re-sort when real-time messages arrive so active conversations bubble to top
  const sortedConvs = useMemo(
    () =>
      [...convs].sort((a, b) => {
        const aTime = new Date(latestMessages[a.id]?.createdAt ?? a.lastMessageAt ?? 0).getTime();
        const bTime = new Date(latestMessages[b.id]?.createdAt ?? b.lastMessageAt ?? 0).getTime();
        return bTime - aTime;
      }),
    [convs, latestMessages],
  );

  return (
    <div className="max-w-2xl mx-auto pb-28 lg:pb-0">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-text-primary">Conversatii</h1>
      </div>

      {/* Notification permission banner */}
      {notifPermission === "default" && !bannerDismissed && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">Activează notificările</p>
            <p className="text-[11px] text-text-muted leading-relaxed">Primește o notificare când ți se trimite un mesaj nou.</p>
          </div>
          <button
            onClick={requestNotifPermission}
            className="flex-shrink-0 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Activează
          </button>
          <button
            onClick={() => setBannerDismissed(true)}
            className="flex-shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg transition-colors"
          >
            Nu acum
          </button>
        </div>
      )}

      {/* AI assistant — always pinned */}
      <div className="mb-6">
        <Link
          href="/asistent"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-50 border border-brand-100 hover:bg-brand-100 transition-colors"
        >
          <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center flex-shrink-0">
            <IconSparkle size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text-primary">Asistent AI</span>
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">AI</span>
            </div>
            <p className="text-xs text-text-muted truncate">Intreaba despre terapie, cum functionam si mai mult...</p>
          </div>
        </Link>
      </div>

      {/* Provider chats */}
      <div>
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2 px-1">
          Conversatii cu profesionisti
        </p>

        {loading ? (
          <div className="rounded-2xl border border-border bg-white divide-y divide-border overflow-hidden">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : convs.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-10 text-center">
            <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
              <IconMessage size={22} className="text-brand-400" />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">Nicio conversatie inca</p>
            <p className="text-xs text-text-muted mb-4 max-w-xs mx-auto leading-relaxed">
              Cand trimiti un mesaj unui terapeut, coach sau mentor, conversatia va aparea aici.
            </p>
            <Link
              href="/explorez"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Gaseste un profesionist
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-white divide-y divide-border overflow-hidden">
            {sortedConvs.map((c) => (
              <ConvRow key={c.id} conv={c} unread={unreadCounts[c.id] ?? 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
