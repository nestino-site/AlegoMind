"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bookingsApi, type Booking } from "@/lib/api/bookings";
import { messagesApi } from "@/lib/api/messages";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TypeBadge } from "@/components/ui/TypeBadge";
import {
  IconCalendar,
  IconClock,
  IconVideo,
  IconPhone,
  IconMessage,
  IconMapPin,
} from "@/components/ui/Icons";
import type { SessionFormat } from "@/lib/types";

const MONTH_NAMES_SHORT = [
  "Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const FORMAT_LABELS: Record<SessionFormat, string> = {
  VIDEO:     "Video",
  VOICE:     "Vocal",
  TEXT:      "Chat",
  IN_PERSON: "Fata in fata",
};

const FORMAT_ICONS: Record<SessionFormat, React.ComponentType<{ size?: number; className?: string }>> = {
  VIDEO:     IconVideo,
  VOICE:     IconPhone,
  TEXT:      IconMessage,
  IN_PERSON: IconMapPin,
};

function formatDateRo(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTH_NAMES_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTimeRo(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const STATUS_CHIP: Record<Booking["status"], { label: string; cls: string }> = {
  PENDING:   { label: "In asteptare", cls: "bg-amber-50 text-amber-700 border-amber-200"   },
  CONFIRMED: { label: "Confirmat",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "Finalizat",    cls: "bg-blue-50 text-blue-600 border-blue-200"      },
  CANCELLED: { label: "Anulat",       cls: "bg-red-50 text-red-500 border-red-200"         },
};

function isUpcoming(b: Booking) {
  return (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.scheduledAt) > new Date();
}
function isPast(b: Booking) { return !isUpcoming(b); }
function canCancel(b: Booking) {
  if (b.status === "CANCELLED" || b.status === "COMPLETED") return false;
  return (new Date(b.scheduledAt).getTime() - Date.now()) / 3_600_000 >= 24;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gray-100 flex-shrink-0" />
        <div className="space-y-2 flex-1"><div className="h-4 w-36 rounded bg-gray-100" /><div className="h-3 w-20 rounded bg-gray-100" /></div>
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </div>
      <div className="h-3 w-3/4 rounded bg-gray-100" />
      <div className="h-8 w-full rounded-xl bg-gray-100" />
    </div>
  );
}

interface SessionCardProps { booking: Booking; onCancelRequest: (id: string) => void; cancelling: boolean; }

function SessionCard({ booking, onCancelRequest, cancelling }: SessionCardProps) {
  const router = useRouter();

  async function handleMessage() {
    try {
      const conv = await messagesApi.createConversation(booking.professionalId);
      router.push(`/conversatii/${conv.id}`);
    } catch { /* ignore */ }
  }

  const pro  = booking.professional;
  const name = pro?.user?.displayName ?? pro?.user?.firstName ?? "Profesionist necunoscut";
  const FormatIcon = FORMAT_ICONS[booking.sessionType];
  const chip = STATUS_CHIP[booking.status];
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {pro?.user?.avatar ? (
            <img src={pro.user.avatar} alt={name} className="h-11 w-11 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="h-11 w-11 rounded-2xl bg-brand-50 border border-border flex items-center justify-center text-base font-bold text-brand-500 flex-shrink-0">
              {name[0]?.toUpperCase() ?? "P"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
            {pro && <TypeBadge type={pro.type} />}
          </div>
        </div>
        <span className={`inline-flex flex-shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${chip.cls}`}>
          {chip.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary mb-3">
        <span className="flex items-center gap-1"><IconCalendar size={12} className="text-text-muted" />{formatDateRo(booking.scheduledAt)} · {formatTimeRo(booking.scheduledAt)}</span>
        <span className="flex items-center gap-1"><IconClock size={12} className="text-text-muted" />{booking.durationMinutes} min</span>
        <span className="flex items-center gap-1"><FormatIcon size={12} className="text-text-muted" />{FORMAT_LABELS[booking.sessionType]}</span>
        <span className="font-semibold text-brand-500">{booking.price} RON</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {isUpcoming(booking) && booking.status !== "CANCELLED" && (
          <button onClick={handleMessage}
            className="flex-1 rounded-xl border border-brand-200 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
            Mesaj profesionist
          </button>
        )}
        {isUpcoming(booking) && canCancel(booking) && (
          <button onClick={() => onCancelRequest(booking.id)} disabled={cancelling}
            className="flex-1 rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
            {cancelling ? "Se anuleaza..." : "Anuleaza"}
          </button>
        )}
        {isPast(booking) && (
          <Link href={`/rezervare/${booking.professionalId}/tip`}
            className="flex-1 rounded-xl border border-border py-2 text-center text-xs font-semibold text-text-primary hover:bg-bg transition-colors">
            Rezerva din nou
          </Link>
        )}
        {isUpcoming(booking) && !canCancel(booking) && booking.status !== "CANCELLED" && (
          <p className="text-[10px] text-text-muted leading-relaxed w-full">
            Anularea nu mai este posibila — mai putin de 24h pana la sedinta.
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: "upcoming" | "past" }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-10 text-center">
      <div className="h-12 w-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
        <IconCalendar size={22} className="text-brand-400" />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">
        {tab === "upcoming" ? "Nicio sedinta programata" : "Niciun istoric de sesiuni"}
      </p>
      <p className="text-xs text-text-muted mb-4 max-w-xs mx-auto leading-relaxed">
        {tab === "upcoming"
          ? "Rezerva o sedinta cu un terapeut, coach sau mentor."
          : "Sesiunile finalizate si anulate vor aparea aici."}
      </p>
      {tab === "upcoming" && (
        <Link href="/explorez"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors">
          Exploreaza profesionisti
        </Link>
      )}
    </div>
  );
}

type Tab = "upcoming" | "past";

export default function SesiuniPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  useEffect(() => {
    bookingsApi.getMy()
      .then(setBookings)
      .catch(() => setError("Nu am putut incarca sesiunile. Incearca din nou."))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id: string) {
    setCancelConfirmId(null);
    setCancellingId(id);
    try {
      await bookingsApi.cancel(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" as const } : b));
    } catch { /* ignore */ } finally {
      setCancellingId(null);
    }
  }

  const upcoming  = bookings.filter(isUpcoming);
  const past      = bookings.filter(isPast);
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <div className="max-w-2xl mx-auto pb-28 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Sesiunile mele</h1>
        <p className="text-sm text-text-secondary mt-1">Gestioneaza rezervarile si istoricul sedintelor tale.</p>
      </div>
      <div className="flex gap-1 rounded-2xl border border-border bg-white p-1 mb-6 shadow-card w-fit">
        {(["upcoming", "past"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-brand-500 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>
            {t === "upcoming" ? "Viitoare" : "Trecute"}
            {!loading && (
              <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${tab === t ? "bg-white/20 text-white" : "bg-bg text-text-muted"}`}>
                {t === "upcoming" ? upcoming.length : past.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : displayed.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {displayed.map((b) => (
            <SessionCard key={b.id} booking={b} onCancelRequest={setCancelConfirmId} cancelling={cancellingId === b.id} />
          ))}
        </div>
      )}
      <ConfirmDialog
        open={cancelConfirmId !== null}
        title="Anulezi sedinta?"
        message="Aceasta actiune este definitiva. Sedinta va fi anulata imediat."
        confirmLabel="Da, anuleaza"
        cancelLabel="Inapoi"
        variant="danger"
        onConfirm={() => { if (cancelConfirmId) handleCancel(cancelConfirmId); }}
        onCancel={() => setCancelConfirmId(null)}
      />
    </div>
  );
}
