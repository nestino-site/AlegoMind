"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProviders, type ProvidersQuery } from "@/lib/hooks/useProviders";
import { ProviderCard } from "@/components/shared/ProviderCard";
import { Modal } from "@/components/ui/Modal";
import { IconSearch, IconMessage, IconVideo, IconPhone, IconMapPin } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import type { Provider, ProfessionalType, SessionFormat } from "@/lib/types";

const PAGE_SIZE = 12;
const MAX_PRICE_CEILING = 1000;

const TYPE_OPTIONS: { value: ProfessionalType | undefined; label: string }[] = [
  { value: undefined, label: "Toți" },
  { value: "THERAPIST", label: "Terapeuți" },
  { value: "COACH", label: "Coaches" },
  { value: "MENTOR", label: "Mentori" },
];

const FORMAT_OPTIONS: { value: SessionFormat; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { value: "TEXT", label: "Text", Icon: IconMessage },
  { value: "VIDEO", label: "Video", Icon: IconVideo },
  { value: "VOICE", label: "Voce", Icon: IconPhone },
  { value: "IN_PERSON", label: "Fizic", Icon: IconMapPin },
];

const RATING_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: undefined, label: "Orice" },
  { value: 4.0, label: "4.0+" },
  { value: 4.5, label: "4.5+" },
  { value: 4.8, label: "4.8+" },
];

function parseQuery(params: URLSearchParams): ProvidersQuery {
  const maxPrice = params.get("maxPrice");
  const minRating = params.get("minRating");
  const page = params.get("page");
  return {
    type: (params.get("type") as ProfessionalType) || undefined,
    sessionFormat: (params.get("sessionFormat") as SessionFormat) || undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    isVerified: params.get("isVerified") === "true" || undefined,
    availableNow: params.get("availableNow") === "true" || undefined,
    page: page ? Number(page) : 1,
    limit: PAGE_SIZE,
  };
}

// ─── Toggle row (Verified / Available now) ─────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2.5 cursor-pointer hover:border-brand-300 transition-colors">
      <span className="text-sm text-text-secondary">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-brand-500" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </label>
  );
}

// ─── Filter sidebar / drawer content ───────────────────────────────────────────

function FilterPanel({
  query,
  onUpdate,
  onReset,
}: {
  query: ProvidersQuery;
  onUpdate: (updates: Record<string, string | undefined>) => void;
  onReset: () => void;
}) {
  // Local draft so the slider label updates live while dragging; the URL
  // (and therefore the API call) only updates once the user releases it.
  const [maxPriceDraft, setMaxPriceDraft] = useState(query.maxPrice ?? MAX_PRICE_CEILING);
  useEffect(() => {
    setMaxPriceDraft(query.maxPrice ?? MAX_PRICE_CEILING);
  }, [query.maxPrice]);

  function commitMaxPrice() {
    onUpdate({ maxPrice: maxPriceDraft >= MAX_PRICE_CEILING ? undefined : String(maxPriceDraft) });
  }

  return (
    <div className="space-y-7">
      {/* Type */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Tip</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => onUpdate({ type: value })}
              className={cn(
                "rounded-2xl border px-3.5 py-1.5 text-sm font-medium transition-all",
                query.type === value
                  ? "border-brand-400 bg-brand-50 text-brand-600 ring-1 ring-brand-300"
                  : "border-border bg-white text-text-secondary hover:border-brand-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Session format — the API only supports one active format at a time
          (ProvidersQuery.sessionFormat is a single value), so these behave
          as an exclusive toggle group even though they're styled as checkboxes. */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Format</p>
        <div className="space-y-2">
          {FORMAT_OPTIONS.map(({ value, label, Icon }) => {
            const checked = query.sessionFormat === value;
            return (
              <label
                key={value}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 cursor-pointer hover:border-brand-300 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onUpdate({ sessionFormat: checked ? undefined : value })}
                  className="h-4 w-4 rounded border-border text-brand-500 focus:ring-brand-300"
                />
                <Icon size={14} className="text-text-muted" />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Max price */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Până la {maxPriceDraft} RON
        </p>
        <input
          type="range"
          min={0}
          max={MAX_PRICE_CEILING}
          step={10}
          value={maxPriceDraft}
          onChange={(e) => setMaxPriceDraft(Number(e.target.value))}
          onMouseUp={commitMaxPrice}
          onTouchEnd={commitMaxPrice}
          className="w-full accent-brand-500"
        />
      </div>

      {/* Min rating */}
      <div>
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Rating minim</p>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map(({ value, label }) => (
            <button
              key={label}
              onClick={() => onUpdate({ minRating: value ? String(value) : undefined })}
              className={cn(
                "rounded-2xl border px-3.5 py-1.5 text-sm font-medium transition-all",
                query.minRating === value
                  ? "border-brand-400 bg-brand-50 text-brand-600 ring-1 ring-brand-300"
                  : "border-border bg-white text-text-secondary hover:border-brand-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <ToggleRow
          label="Verificat"
          checked={query.isVerified === true}
          onChange={(v) => onUpdate({ isVerified: v ? "true" : undefined })}
        />
        <ToggleRow
          label="Disponibil acum"
          checked={query.availableNow === true}
          onChange={(v) => onUpdate({ availableNow: v ? "true" : undefined })}
        />
      </div>

      <button
        onClick={onReset}
        className="w-full rounded-2xl border border-border py-2.5 text-sm font-medium text-text-secondary hover:border-brand-300 transition-colors"
      >
        Resetează filtrele
      </button>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreContent />
    </Suspense>
  );
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const query = useMemo(() => parseQuery(searchParams), [searchParams]);
  const { providers, total, loading, error } = useProviders(query);

  const [accumulated, setAccumulated] = useState<Provider[]>([]);

  // Append on load-more, replace on a fresh filter search — detected by
  // watching the loading flag flip from true to false (a fetch just landed),
  // rather than reacting to `providers` directly, to avoid acting on a stale
  // page number while the next fetch is still in flight.
  const [wasLoading, setWasLoading] = useState(loading);
  useEffect(() => {
    if (wasLoading && !loading) {
      setAccumulated((prev) => ((query.page ?? 1) > 1 ? [...prev, ...providers] : providers));
    }
    setWasLoading(loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Keep the search box in sync if the URL changes from elsewhere (e.g. back button).
  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("q")]);

  // Debounce pushing the search box value into the URL.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (searchInput) next.set("q", searchInput);
      else next.delete("q");
      router.replace(`/explorez?${next.toString()}`);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    });
    next.delete("page");
    router.push(`/explorez?${next.toString()}`);
    setDrawerOpen(false);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) next.set("q", q);
    router.push(`/explorez?${next.toString()}`);
    setDrawerOpen(false);
  }

  function loadMore() {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String((query.page ?? 1) + 1));
    router.replace(`/explorez?${next.toString()}`);
  }

  const q = searchParams.get("q") ?? "";
  const visible = q
    ? accumulated.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q.toLowerCase()) ||
          p.specializations.some((s) => s.toLowerCase().includes(q.toLowerCase())),
      )
    : accumulated;

  const hasMore = accumulated.length < total;
  const initialLoading = loading && accumulated.length === 0;

  return (
    <div className="container-app py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Explorează furnizori</h1>
        <p className="text-sm text-text-secondary mt-1">
          Găsește terapeutul, coach-ul sau mentorul potrivit pentru tine.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="sticky top-24 rounded-3xl border border-border bg-white p-5">
            <FilterPanel query={query} onUpdate={updateParams} onReset={resetFilters} />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Search + mobile filter trigger */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Caută după nume sau specializare..."
                className="w-full rounded-2xl border border-border bg-white py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex-shrink-0 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-text-secondary hover:border-brand-300 transition-colors"
            >
              Filtrează
            </button>
          </div>

          {/* Header */}
          <div className="mb-5">
            <p className="text-sm text-text-secondary">
              {loading && accumulated.length === 0 ? "Se caută..." : `${total} furnizori găsiți`}
            </p>
          </div>

          {/* Error */}
          {error && !loading && (
            <div className="rounded-3xl border border-danger/20 bg-red-50 p-6 text-center text-sm text-danger mb-6">
              A apărut o eroare la încărcarea furnizorilor. Încearcă din nou.
            </div>
          )}

          {/* Grid / states */}
          {initialLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-border bg-white p-5 animate-pulse h-48" />
              ))}
            </div>
          ) : visible.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.map((p) => (
                  <ProviderCard key={p.id} provider={p} variant="list" />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="rounded-2xl border border-border bg-white px-6 py-3 text-sm font-semibold text-text-secondary hover:border-brand-300 disabled:opacity-60 transition-colors"
                  >
                    {loading ? "Se încarcă..." : "Încarcă mai mulți"}
                  </button>
                </div>
              )}
            </>
          ) : !error ? (
            <div className="rounded-3xl border border-border bg-white p-10 text-center">
              <p className="text-sm text-text-muted">Niciun rezultat. Încearcă să ajustezi filtrele.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filtrează" variant="sheet">
        <FilterPanel query={query} onUpdate={updateParams} onReset={resetFilters} />
      </Modal>
    </div>
  );
}
