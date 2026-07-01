"use client";

import { useEffect, useState } from "react";
import { professionalsApi, type ChatService } from "@/lib/api/professionals";

const DEFAULT_WELCOME: Record<string, string> = {
  THERAPIST: "Buna ziua! Sunt incantata sa ne intalnim. Pentru a incepe conversatia, te rog sa alegi un subiect de mai jos:",
  COACH:     "Salut! Sunt aici si astept sa lucram impreuna. Ce te-a adus astazi? Alege un subiect pentru a incepe:",
  MENTOR:    "Buna! Iti multumesc pentru mesaj. Ce directie vrei sa exploram impreuna? Alege un subiect de mai jos:",
};
const DEFAULT_TOPIC = "Multumesc ca ai ales subiectul \"{topic}\". Cum te pot ajuta?";

interface FormState {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { name: "", description: "", price: "", isActive: true };

function ServiceForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial?: FormState;
  saving: boolean;
  onSave: (v: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);

  function set(field: keyof FormState, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-200 bg-brand-50/30 p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">Nume opțiune *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="ex: Consultație 30 min"
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Preț (RON) * <span className="font-normal text-text-muted">— 0 = gratuit</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            required
            placeholder="0"
            className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">Descriere (opțional)</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Scurtă descriere a acestei opțiuni..."
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set("isActive", e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-text-secondary">Vizibil pentru clienți</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg transition-colors"
          >
            Anulează
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim() || form.price === ""}
            className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Se salvează..." : "Salvează"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PriceBadge({ price }: { price: number }) {
  if (price === 0) {
    return (
      <span className="flex-shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
        Gratuit
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
      {price} RON
    </span>
  );
}

export default function ServiciiPage() {
  const [services, setServices] = useState<ChatService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Message templates
  const [proType, setProType] = useState<string>("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [topicResponseTemplate, setTopicResponseTemplate] = useState("");
  const [msgSaving, setMsgSaving] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      professionalsApi.getMyChatServices(),
      professionalsApi.getMyProfile(),
    ])
      .then(([svcs, profile]) => {
        setServices(svcs);
        setProType(profile.type);
        setWelcomeMessage(profile.welcomeMessage ?? "");
        setTopicResponseTemplate(profile.topicResponseTemplate ?? "");
      })
      .catch(() => setError("Nu am putut încărca datele."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveMessages(e: React.FormEvent) {
    e.preventDefault();
    setMsgSaving(true);
    setMsgSuccess(false);
    try {
      await professionalsApi.updateProfile({
        welcomeMessage: welcomeMessage || null,
        topicResponseTemplate: topicResponseTemplate || null,
      });
      setMsgSuccess(true);
      setTimeout(() => setMsgSuccess(false), 3000);
    } catch { /* ignore */ } finally {
      setMsgSaving(false);
    }
  }

  async function handleCreate(form: FormState) {
    setSaving(true);
    try {
      const created = await professionalsApi.createChatService({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price) || 0,
        isActive: form.isActive,
      });
      setServices((p) => [...p, created]);
      setAdding(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la creare.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string, form: FormState) {
    setSaving(true);
    try {
      const updated = await professionalsApi.updateChatService(id, {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price) || 0,
        isActive: form.isActive,
      });
      setServices((p) => p.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la actualizare.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(s: ChatService) {
    try {
      const updated = await professionalsApi.updateChatService(s.id, { isActive: !s.isActive });
      setServices((p) => p.map((x) => (x.id === s.id ? updated : x)));
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await professionalsApi.deleteChatService(id);
      setServices((p) => p.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Eroare la ștergere.");
    } finally {
      setDeletingId(null);
    }
  }

  const active = services.filter((s) => s.isActive);
  const inactive = services.filter((s) => !s.isActive);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-border bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 lg:pb-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Chat</p>
          <h1 className="text-2xl font-bold text-text-primary">Servicii de chat</h1>
          <p className="text-sm text-text-secondary mt-1">
            Definește opțiunile pe care clienții le vor vedea înainte de a începe o conversație.
            Prețul 0 = gratuit.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => { setAdding(true); setEditingId(null); }}
            className="flex-shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            + Adaugă
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="mb-4">
          <ServiceForm
            saving={saving}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {services.length === 0 && !adding && (
        <div className="rounded-3xl border border-border bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1">Niciun serviciu configurat</p>
          <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed mb-5">
            Clienții vor vedea „Nicio opțiune disponibilă" până când adaugi cel puțin un serviciu.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Adaugă primul serviciu
          </button>
        </div>
      )}

      {/* Active services */}
      {active.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Vizibile</p>
          {active.map((s) => (
            <div key={s.id}>
              {editingId === s.id ? (
                <ServiceForm
                  initial={{ name: s.name, description: s.description ?? "", price: String(s.price), isActive: s.isActive }}
                  saving={saving}
                  onSave={(form) => handleUpdate(s.id, form)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
                        <PriceBadge price={s.price} />
                      </div>
                      {s.description && (
                        <p className="text-xs text-text-muted leading-relaxed">{s.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(s.id); setAdding(false); }}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg hover:text-text-primary transition-colors"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleToggleActive(s)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        Dezactivează
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                      >
                        {deletingId === s.id ? "..." : "Șterge"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inactive services */}
      {inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">Dezactivate</p>
          {inactive.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-white p-4 opacity-60">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
                    <PriceBadge price={s.price} />
                  </div>
                  {s.description && (
                    <p className="text-xs text-text-muted leading-relaxed">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(s)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    Activează
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                  >
                    {deletingId === s.id ? "..." : "Șterge"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Message templates ──────────────────────────────────────── */}
      <div className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">Mesaje automate</p>
          <h2 className="text-lg font-bold text-text-primary">Mesajele tale</h2>
          <p className="text-sm text-text-secondary mt-1">
            Lasă gol pentru a folosi mesajul implicit. În mesajul de răspuns, folosește{" "}
            <code className="rounded bg-bg px-1 py-0.5 text-xs font-mono text-brand-600">{"{topic}"}</code>{" "}
            pentru a insera subiectul ales de client.
          </p>
        </div>

        {msgSuccess && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Mesajele au fost salvate.
          </div>
        )}

        <form onSubmit={handleSaveMessages} className="rounded-3xl border border-border bg-white p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Mesaj de bun venit
              <span className="font-normal text-text-muted ml-1">— trimis când începe o conversație nouă</span>
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={proType ? DEFAULT_WELCOME[proType] : "Mesajul tău de bun venit..."}
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
            />
            <p className="text-[10px] text-text-muted mt-1 text-right">{welcomeMessage.length}/1000</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Mesaj după alegerea subiectului
              <span className="font-normal text-text-muted ml-1">— trimis când clientul selectează un subiect</span>
            </label>
            <textarea
              value={topicResponseTemplate}
              onChange={(e) => setTopicResponseTemplate(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={`ex: Super alegere! Să vorbim despre {topic}. Spune-mi mai multe.`}
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
            />
            {topicResponseTemplate && (
              <p className="text-[10px] text-text-muted mt-1">
                Preview: {topicResponseTemplate.replace(/\{topic\}/g, "exemplu subiect")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={msgSaving}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            {msgSaving ? "Se salvează..." : "Salvează mesajele"}
          </button>
        </form>
      </div>
    </div>
  );
}
