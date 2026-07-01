"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [conversations, setConversations] = useState<ProConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { unreadCounts } = useUnread();

  useEffect(() => {
    messagesApi
      .getProConversations()
      .then(setConversations)
      .catch(() => setError("Nu am putut incarca conversatiile."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Inbox</p>
        <h1 className="text-2xl font-bold text-text-primary">Mesaje</h1>
      </div>

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
          {conversations.map((conv) => {
            const lastMsg = conv.messages[0];
            const isActive = conv.status === "ACTIVE";
            const unread = unreadCounts[conv.id] ?? 0;
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
                      {formatTime(conv.lastMessageAt)}
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
                      {lastMsg?.content ?? "Conversatie noua"}
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
