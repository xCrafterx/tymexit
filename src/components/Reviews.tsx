import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type Review = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  rating: number;
  content: string;
  service_type: string | null;
  review_date: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

const SERVICES = [
  "Naprawa komputera",
  "Naprawa laptopa",
  "Budowa PC",
  "Instalacja systemu",
  "Czyszczenie / pasta",
  "Sieć / Wi-Fi",
  "Pomoc zdalna",
  "Inna",
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function initials(first: string, last: string) {
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "??";
}

export function Stars({ value, size = 16, interactive, onChange }: { value: number; size?: number; interactive?: boolean; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div style={{ display: "inline-flex", gap: 2, fontSize: size, lineHeight: 1, color: "var(--brand-2, #f5b042)" }} aria-label={`Ocena ${value} na 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(n)}
          style={{
            background: "transparent",
            border: 0,
            cursor: interactive ? "pointer" : "default",
            padding: 0,
            color: n <= display ? "var(--brand-2, #f5b042)" : "color-mix(in oklab, var(--text-mute) 60%, transparent)",
            fontSize: "inherit",
            lineHeight: 1,
          }}
          aria-label={`${n} gwiazd${n === 1 ? "ka" : "ki"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function useReviewsRealtime(filterVisibleOnly: boolean) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    let q = supabase.from("reviews").select("*").order("review_date", { ascending: false });
    if (filterVisibleOnly) q = q.eq("is_visible", true);
    const { data, error } = await q;
    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("reviews-rt-" + (filterVisibleOnly ? "pub" : "all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => fetchAll())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterVisibleOnly]);

  return { reviews, loading, refetch: fetchAll };
}

export function ReviewsList({ limit, emptyText }: { limit?: number; emptyText?: string }) {
  const { reviews, loading } = useReviewsRealtime(true);
  const items = useMemo(() => (limit ? reviews.slice(0, limit) : reviews), [reviews, limit]);

  if (loading) return <p className="text-dim" style={{ marginTop: 30 }}>Ładowanie opinii…</p>;
  if (items.length === 0) return <p className="text-dim" style={{ marginTop: 30 }}>{emptyText ?? "Brak opinii. Bądź pierwszą osobą, która oceni TymekIT!"}</p>;

  return (
    <div className="testi-grid" style={{ marginTop: 40 }}>
      {items.map((r, i) => (
        <div key={r.id} className="testi reveal visible" data-delay={(i % 3) + 1}>
          <Stars value={r.rating} size={18} />
          <p style={{ marginTop: 10 }}>{r.content}</p>
          <div className="who">
            <div className="avatar">{initials(r.first_name, r.last_name)}</div>
            <div className="who-text">
              <strong>{r.first_name} {r.last_name}</strong>
              <small>{r.service_type ? `${r.service_type} · ` : ""}{formatDate(r.review_date)}</small>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { session, user, profile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [serviceType, setServiceType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    const uname = profile?.username ?? "";
    const parts = uname.split(/[ ._-]+/).filter(Boolean);
    if (parts[0] && !firstName) setFirstName(parts[0].charAt(0).toUpperCase() + parts[0].slice(1));
    if (parts[1] && !lastName) setLastName(parts[1].charAt(0).toUpperCase() + parts[1].slice(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, profile?.username]);

  if (!session?.user) {
    return (
      <div className="glass" style={{ padding: 24, textAlign: "center" }}>
        <p style={{ marginBottom: 14 }}>Aby dodać opinię, musisz być zalogowany.</p>
        <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/login" className="btn btn-primary">Zaloguj się</Link>
          <Link to="/register" className="btn btn-ghost">Załóż konto</Link>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const c = content.trim();
    if (!fn || !ln) return toast.error("Podaj imię i nazwisko");
    if (!c) return toast.error("Treść opinii nie może być pusta");
    if (rating < 1 || rating > 5) return toast.error("Ocena musi być od 1 do 5");
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user!.id,
      first_name: fn,
      last_name: ln,
      rating,
      content: c,
      service_type: serviceType || null,
      review_date: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Opinia została dodana");
    setContent("");
    setRating(5);
    setServiceType("");
    onSubmitted?.();
  };

  return (
    <form onSubmit={submit} className="glass" style={{ padding: 24, display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
          <span className="text-dim">Imię</span>
          <input className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={80} required />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
          <span className="text-dim">Nazwisko</span>
          <input className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} required />
        </label>
      </div>
      <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
        <span className="text-dim">Twoja ocena</span>
        <Stars value={rating} size={28} interactive onChange={setRating} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
        <span className="text-dim">Typ usługi (opcjonalnie)</span>
        <select className="form-control" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          <option value="">— wybierz —</option>
          {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
        <span className="text-dim">Twoja opinia</span>
        <textarea className="form-control" rows={5} maxLength={2000} value={content} onChange={(e) => setContent(e.target.value)} required />
      </label>
      <div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Wysyłanie…" : "Dodaj opinię"}</button>
      </div>
    </form>
  );
}

export function MyReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, Partial<Review>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchMine = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("review_date", { ascending: false });
    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMine();
    if (!user) return;
    const ch = supabase
      .channel("my-reviews-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews", filter: `user_id=eq.${user.id}` }, () => fetchMine())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;
  if (loading) return <p className="text-dim">Ładowanie…</p>;
  if (reviews.length === 0) {
    return <p className="text-dim" style={{ marginTop: 16 }}>Nie masz jeszcze żadnych opinii. Dodaj pierwszą poniżej.</p>;
  }

  const patch = (id: string, p: Partial<Review>) =>
    setEditing((e) => ({ ...e, [id]: { ...e[id], ...p } }));

  const save = async (r: Review) => {
    const p = editing[r.id];
    if (!p) return;
    const fn = (p.first_name ?? r.first_name).trim();
    const ln = (p.last_name ?? r.last_name).trim();
    const c = (p.content ?? r.content).trim();
    const rating = p.rating ?? r.rating;
    if (!fn || !ln) return toast.error("Imię i nazwisko nie mogą być puste");
    if (!c) return toast.error("Treść opinii nie może być pusta");
    if (rating < 1 || rating > 5) return toast.error("Ocena musi być od 1 do 5");
    setSaving(r.id);
    const { error } = await supabase
      .from("reviews")
      .update({ first_name: fn, last_name: ln, content: c, rating, service_type: p.service_type ?? r.service_type })
      .eq("id", r.id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Opinia została zaktualizowana");
    setEditing((e) => { const n = { ...e }; delete n[r.id]; return n; });
  };

  const remove = async (r: Review) => {
    if (!confirm("Usunąć tę opinię?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Opinia została usunięta");
  };

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
      {reviews.map((r) => {
        const e = editing[r.id] ?? {};
        const cur = { ...r, ...e } as Review;
        const dirty = Object.keys(e).length > 0;
        return (
          <div key={r.id} className="glass" style={{ padding: 16, display: "grid", gap: 10, opacity: r.is_visible ? 1 : 0.65 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input className="form-control" value={cur.first_name} onChange={(ev) => patch(r.id, { first_name: ev.target.value })} placeholder="Imię" maxLength={80} />
              <input className="form-control" value={cur.last_name} onChange={(ev) => patch(r.id, { last_name: ev.target.value })} placeholder="Nazwisko" maxLength={80} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <Stars value={cur.rating} size={24} interactive onChange={(v) => patch(r.id, { rating: v })} />
              <select className="form-control" style={{ maxWidth: 220 }} value={cur.service_type ?? ""} onChange={(ev) => patch(r.id, { service_type: ev.target.value || null })}>
                <option value="">— typ usługi —</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea className="form-control" rows={3} maxLength={2000} value={cur.content} onChange={(ev) => patch(r.id, { content: ev.target.value })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" className="btn btn-primary" disabled={!dirty || saving === r.id} onClick={() => save(r)}>
                {saving === r.id ? "Zapisywanie…" : "Zapisz zmiany"}
              </button>
              <button type="button" className="btn btn-ghost" style={{ color: "var(--brand-3, #ef4444)" }} onClick={() => remove(r)}>Usuń</button>
              <span className="text-dim" style={{ fontSize: 12, marginLeft: "auto" }}>
                {formatDate(r.review_date)} · {r.is_visible ? "widoczna" : "ukryta przez admina"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminReviews() {
  const { user } = useAuth();
  const { reviews, loading, refetch } = useReviewsRealtime(false);
  const [editing, setEditing] = useState<Record<string, Partial<Review>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // Formularz dodawania nowej opinii przez admina
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newServiceType, setNewServiceType] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDate, setNewDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const patch = (id: string, p: Partial<Review>) =>
    setEditing((e) => ({ ...e, [id]: { ...e[id], ...p } }));

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return toast.error("Brak aktywnej sesji administratora");
    const fn = newFirstName.trim();
    const ln = newLastName.trim();
    const c = newContent.trim();
    if (!fn || !ln) return toast.error("Podaj imię i nazwisko");
    if (!c) return toast.error("Treść opinii nie może być pusta");
    if (newRating < 1 || newRating > 5) return toast.error("Ocena musi wynosić od 1 do 5");

    setIsAdding(true);
    const reviewDate = newDate ? new Date(newDate).toISOString() : new Date().toISOString();
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      first_name: fn,
      last_name: ln,
      rating: newRating,
      content: c,
      service_type: newServiceType || null,
      review_date: reviewDate,
      is_visible: true,
    });
    setIsAdding(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Opinia została pomyślnie dodana");
    setNewFirstName("");
    setNewLastName("");
    setNewRating(5);
    setNewServiceType("");
    setNewContent("");
    setNewDate("");
    setShowAddForm(false);
    refetch();
  };

  const save = async (r: Review) => {
    const patchData = editing[r.id];
    if (!patchData) return;
    setSaving(r.id);
    const { error } = await supabase.from("reviews").update(patchData).eq("id", r.id);
    setSaving(null);
    if (error) return toast.error(error.message);
    toast.success("Opinia została zaktualizowana");
    setEditing((e) => {
      const n = { ...e };
      delete n[r.id];
      return n;
    });
  };

  const toggleVisible = async (r: Review) => {
    const next = !r.is_visible;
    const { error } = await supabase.from("reviews").update({ is_visible: next }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Opinia jest widoczna" : "Opinia została ukryta");
  };

  const remove = async (r: Review) => {
    if (!confirm(`Usunąć opinię od ${r.first_name} ${r.last_name}?`)) return;
    const { error } = await supabase.from("reviews").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Opinia została usunięta");
  };

  if (loading) return <p className="text-dim">Ładowanie…</p>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="reveal visible" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <span className="eyebrow"><span className="dot"></span> Opinie</span>
          <h2 className="section-title" style={{ marginTop: 18 }}>Zarządzanie <span className="grad">opiniami.</span></h2>
          <p className="text-dim" style={{ marginTop: 10 }}>Edytuj treść, ocenę, datę, ukrywaj, usuwaj lub dodawaj nowe opinie.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="btn btn-primary"
          style={{ padding: "10px 18px", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10 }}
        >
          {showAddForm ? "✕ Anuluj dodawanie" : "+ Dodaj nową opinię"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddReview} className="glass reveal visible" style={{ padding: 22, display: "grid", gap: 14, border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: 16 }}>Dodaj nową opinię klienta</strong>
            <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
              Panel administratora
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span className="text-dim">Imię</span>
              <input className="form-control" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="np. Tomasz" maxLength={80} required />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
              <span className="text-dim">Nazwisko</span>
              <input className="form-control" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="np. Nowak" maxLength={80} required />
            </label>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <span className="text-dim" style={{ fontSize: 12 }}>Ocena (gwiazdki)</span>
              <Stars value={newRating} size={26} interactive onChange={(v) => setNewRating(v)} />
            </div>
            <div style={{ display: "grid", gap: 6, flex: 1, minWidth: 180 }}>
              <span className="text-dim" style={{ fontSize: 12 }}>Typ usługi</span>
              <select className="form-control" value={newServiceType} onChange={(e) => setNewServiceType(e.target.value)}>
                <option value="">— wybierz lub zostaw puste —</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gap: 6, minWidth: 200 }}>
              <span className="text-dim" style={{ fontSize: 12 }}>Data wystawienia opinii (opcjonalnie)</span>
              <input className="form-control" type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
          </div>
          <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <span className="text-dim">Treść opinii</span>
            <textarea className="form-control" rows={3} value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Wpisz treść opinii..." maxLength={2000} required />
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Anuluj</button>
            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              {isAdding ? "Dodawanie…" : "Zapisz i opublikuj opinię"}
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <div className="glass" style={{ padding: 30, textAlign: "center" }}>
          <p className="text-dim">Brak opinii.</p>
        </div>
      ) : (
        reviews.map((r) => {
          const e = editing[r.id] ?? {};
          const cur = { ...r, ...e } as Review;
          const dirty = Object.keys(e).length > 0;
          return (
            <div key={r.id} className="glass" style={{ padding: 18, display: "grid", gap: 12, opacity: r.is_visible ? 1 : 0.65 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input className="form-control" value={cur.first_name} onChange={(ev) => patch(r.id, { first_name: ev.target.value })} placeholder="Imię" />
                <input className="form-control" value={cur.last_name} onChange={(ev) => patch(r.id, { last_name: ev.target.value })} placeholder="Nazwisko" />
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <Stars value={cur.rating} size={24} interactive onChange={(v) => patch(r.id, { rating: v })} />
                <input className="form-control" style={{ maxWidth: 200 }} value={cur.service_type ?? ""} onChange={(ev) => patch(r.id, { service_type: ev.target.value || null })} placeholder="Typ usługi" />
                <input className="form-control" style={{ maxWidth: 200 }} type="datetime-local"
                  value={new Date(cur.review_date).toISOString().slice(0, 16)}
                  onChange={(ev) => patch(r.id, { review_date: new Date(ev.target.value).toISOString() })} />
              </div>
              <textarea className="form-control" rows={3} value={cur.content} onChange={(ev) => patch(r.id, { content: ev.target.value })} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" disabled={!dirty || saving === r.id} onClick={() => save(r)}>
                  {saving === r.id ? "Zapisywanie…" : "Zapisz"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => toggleVisible(r)}>
                  {r.is_visible ? "Ukryj" : "Pokaż"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ color: "var(--brand-3, #ef4444)" }} onClick={() => remove(r)}>
                  Usuń
                </button>
                <span className="text-dim" style={{ fontSize: 12, marginLeft: "auto", alignSelf: "center" }}>
                  {formatDate(r.created_at)} · {r.is_visible ? "widoczna" : "ukryta"}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
