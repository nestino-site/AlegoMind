"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { messagesApi, type ProConversation } from "@/lib/api/messages";
import { useUnread } from "@/lib/context/UnreadContext";
import { IconMessage } from "@/components/ui/Icons";

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short" });
}

function seekerName(c: ProConversation) {
  return c.seeker?.displayName ?? c.seeker?.firstName ?? "Client";
}

function seekerInitial(c: ProConversation) {
  return seekerName(c)[0]?.toUpperCase() ?? "C";
}

export default function ProMesajePage() {
  const [conversations, setConversations] = useState<ProConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { unreadCounts, latestMessages, notifPermission, requestNotifPermission } = useUnread();

  useEffect(() => {
    messagesApi
      .getProConversations()
      .then(setConversations)
      .catch(() => setError("Nu am putut incarca conversatiile."))
      .finally(() => setLoading(false));
  }, []);

  // Re-sort when real-time messages arrive so active conversations bubble to top
  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aTime = new Date(latestMessages[a.id]?.createdAt ?? a.lastMessageAt ?? 0).getTime();
        const bTime = new Date(latestMessages[b.id]?.createdAt ?? b.lastMessageAt ?? 0).getTime();
        return bTime - aTime;
      }),
    [conversations, latestMessages],
  );

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Inbox</p>
        <h1 className="text-2xl font-bold text-text-primary">Mesaje</h1>
      </div>

      {/* Notification permission banner */}
      {notifPermission === "default" && !bannerDismissed && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary">Activează notificările</p>
            <p className="text-[11px] text-text-muted leading-relaxed">Primești o alertă când un client îți trimite un mesaj nou.</p>
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

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-border bg-white animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && conversations.length === 0 && (
        <div className="rounded-3xl border border-border bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <IconMessage size={24} className="text-brand-400" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">Nicio conversatie inca</p>
          <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
            Mesajele de la clienti vor aparea aici dupa ce incep o conversatie cu tine.
          </p>
        </div>
      )}

      {!loading && !error && conversations.length > 0 && (
        <div className="divide-y divide-border rounded-3xl border border-border bg-white overflow-hidden">
          {sortedConversations.map((conv) => {
            const lastMsg = conv.messages[0];
            const latest = latestMessages[conv.id];
            const isActive = conv.status === "ACTIVE";
            const unread = unreadCounts[conv.id] ?? 0;
            const previewText = latest?.content ?? lastMsg?.content ?? "Conversatie noua";
            const previewTime = formatTime(latest?.createdAt ?? conv.lastMessageAt);
            return (
              <Link
                key={conv.id}
                href={`/profesionist/conversatii/${conv.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-hover transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0 h-12 w-12 rounded-2xl bg-brand-50 border border-border flex items-center justify-center">
                  {conv.seeker?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={conv.seeker.avatar}
                      alt={seekerName(conv)}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-brand-500">{seekerInitial(conv)}</span>
                  )}
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={`text-sm truncate ${unread > 0 ? "font-bold text-text-primary" : "font-semibold text-text-primary"}`}>{seekerName(conv)}</p>
                    <span className="text-xs text-text-muted flex-shrink-0">
                      {previewTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && conv.topicLabel && (
                      <span className="flex-shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                        {conv.topicLabel}
                      </span>
                    )}
                    {!isActive && (
                      <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        Asteptare topic
                      </span>
                    )}
                    <p className={`text-xs truncate ${unread > 0 ? "text-text-secondary font-medium" : "text-text-secondary"}`}>
                      {previewText}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
