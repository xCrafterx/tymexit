import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, BarChart3, MessageSquareText, Percent, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatMoney, localDate } from "@/lib/workshop";

type ToolsView = "canned" | "blacklist" | "discounts" | "ranking";
const TITLES: Record<ToolsView, string> = {
  canned: "Gotowe odpowiedzi do czatu",
  blacklist: "Czarna lista telefonów i e-maili",
  discounts: "Kody rabatowe",
  ranking: "Ranking podstron",
};
const ICONS: Record<ToolsView, React.ReactNode> = {
  canned: <MessageSquareText />,
  blacklist: <Ban />,
  discounts: <Percent />,
  ranking: <BarChart3 />,
};

export function AdminTools({ view }: { view: ToolsView }) {
  const query = useQuery({ queryKey: ["admin-tools", view], queryFn: () => load(view) });
  const cache = useQueryClient();
  const refresh = async () => { await cache.invalidateQueries({ queryKey: ["admin-tools", view] }); };
  return (
    <div className="workshop">
      <div className="workshop-heading"><h2>{ICONS[view]}{TITLES[view]}</h2></div>
      {query.isPending ? (
        <p role="status">Wczytywanie…</p>
      ) : query.isError ? (
        <div role="alert"><p>Nie udało się wczytać danych.</p><Button variant="outline" onClick={() => void refresh()}>Spróbuj ponownie</Button></div>
      ) : view === "canned" ? (
        <Canned rows={query.data as CannedRow[]} onSaved={refresh} />
      ) : view === "blacklist" ? (
        <Blacklist rows={query.data as BlacklistRow[]} onSaved={refresh} />
      ) : view === "discounts" ? (
        <Discounts rows={query.data as DiscountRow[]} onSaved={refresh} />
      ) : (
        <Ranking rows={query.data as VisitRow[]} />
      )}
    </div>
  );
}

type CannedRow = { id: string; title: string; body: string };
type BlacklistRow = { id: string; kind: "phone" | "email"; value: string; note: string | null };
type DiscountRow = { id: string; code: string; percent: number; active: boolean };
type VisitRow = { path: string | null; ip: string };

async function load(view: ToolsView) {
  if (view === "canned") {
    const { data, error } = await supabase.from("canned_responses").select("id, title, body").order("created_at");
    if (error) throw error;
    return data ?? [];
  }
  if (view === "blacklist") {
    const { data, error } = await supabase.from("contact_blacklist").select("id, kind, value, note").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  if (view === "discounts") {
    const { data, error } = await supabase.from("discount_codes").select("id, code, percent, active").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  const { data, error } = await supabase.from("site_visit_logs").select("path, ip");
  if (error) throw error;
  return data ?? [];
}

function Canned({ rows, onSaved }: { rows: CannedRow[]; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error("Wpisz tytuł i treść odpowiedzi."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("canned_responses").insert({ title: form.title.trim(), body: form.body.trim() });
      if (error) throw error;
      setForm({ title: "", body: "" });
      await onSaved();
      toast.success("Dodano gotową odpowiedź");
    } catch { toast.error("Nie udało się zapisać."); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("canned_responses").delete().eq("id", id);
    if (error) { toast.error("Nie udało się usunąć."); return; }
    await onSaved();
    toast.success("Usunięto odpowiedź");
  };
  return (
    <>
      <form className="workshop-add" style={{ gridTemplateColumns: "1fr 2fr auto" }} onSubmit={add}>
        <label>Tytuł (skrót)<input className="form-control" maxLength={80} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="np. Gotowe do odbioru" /></label>
        <label>Treść odpowiedzi<input className="form-control" maxLength={500} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Dzień dobry! Twoje urządzenie…" /></label>
        <Button type="submit" disabled={busy}><Plus />Dodaj</Button>
      </form>
      <div className="workshop-list">
        {rows.length === 0 ? <p>Brak zapisanych odpowiedzi.</p> : rows.map((r) => (
          <div className="workshop-part" key={r.id}>
            <div><strong>{r.title}</strong><small>{r.body}</small></div>
            <Button variant="outline" size="icon" aria-label={`Usuń: ${r.title}`} onClick={() => void remove(r.id)}><Trash2 /></Button>
          </div>
        ))}
      </div>
    </>
  );
}

function Blacklist({ rows, onSaved }: { rows: BlacklistRow[]; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ kind: "phone", value: "", note: "" });
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.trim()) { toast.error("Wpisz numer telefonu lub e-mail."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("contact_blacklist").insert({ kind: form.kind, value: form.value.trim(), note: form.note.trim() || null });
      if (error) throw error;
      setForm({ kind: "phone", value: "", note: "" });
      await onSaved();
      toast.success("Dodano do czarnej listy");
    } catch { toast.error("Nie udało się dodać (może już jest na liście?)."); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_blacklist").delete().eq("id", id);
    if (error) { toast.error("Nie udało się usunąć."); return; }
    await onSaved();
    toast.success("Usunięto z czarnej listy");
  };
  return (
    <>
      <form className="workshop-add" style={{ gridTemplateColumns: "1fr 2fr 2fr auto" }} onSubmit={add}>
        <label>Typ
          <select className="form-control" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="phone">Telefon</option>
            <option value="email">E-mail</option>
          </select>
        </label>
        <label>Wartość<input className="form-control" maxLength={120} required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="np. 600123456 lub spam@x.pl" /></label>
        <label>Notatka (opcjonalnie)<input className="form-control" maxLength={200} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        <Button type="submit" disabled={busy}><Plus />Zablokuj</Button>
      </form>
      <p className="text-dim" style={{ fontSize: "0.8rem" }}>Osoby z tej listy nie mogą wysłać formularza zgłoszenia.</p>
      <div className="workshop-list">
        {rows.length === 0 ? <p>Czarna lista jest pusta.</p> : rows.map((r) => (
          <div className="workshop-part" key={r.id}>
            <div><strong>{r.value}</strong><small>{r.kind === "phone" ? "📞 Telefon" : "✉️ E-mail"}{r.note ? ` · ${r.note}` : ""}</small></div>
            <Button variant="outline" size="icon" aria-label={`Odblokuj: ${r.value}`} onClick={() => void remove(r.id)}><Trash2 /></Button>
          </div>
        ))}
      </div>
    </>
  );
}

function Discounts({ rows, onSaved }: { rows: DiscountRow[]; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ code: "", percent: "10" });
  const [busy, setBusy] = useState(false);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = Number(form.percent);
    if (!form.code.trim() || !Number.isInteger(percent) || percent < 1 || percent > 100) { toast.error("Wpisz kod i procent od 1 do 100."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("discount_codes").insert({ code: form.code.trim().toUpperCase(), percent });
      if (error) throw error;
      setForm({ code: "", percent: "10" });
      await onSaved();
      toast.success("Dodano kod rabatowy");
    } catch { toast.error("Nie udało się dodać (może kod już istnieje?)."); } finally { setBusy(false); }
  };
  const toggle = async (row: DiscountRow) => {
    const { error } = await supabase.from("discount_codes").update({ active: !row.active }).eq("id", row.id);
    if (error) { toast.error("Nie udało się zmienić kodu."); return; }
    await onSaved();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("discount_codes").delete().eq("id", id);
    if (error) { toast.error("Nie udało się usunąć."); return; }
    await onSaved();
    toast.success("Usunięto kod");
  };
  return (
    <>
      <form className="workshop-add" style={{ gridTemplateColumns: "2fr 1fr auto" }} onSubmit={add}>
        <label>Kod (wpiszesz klientowi)<input className="form-control" maxLength={30} required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="np. LATO10" /></label>
        <label>Rabat (%)<input className="form-control" type="number" min="1" max="100" step="1" required value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} /></label>
        <Button type="submit" disabled={busy}><Plus />Dodaj kod</Button>
      </form>
      <div className="workshop-list">
        {rows.length === 0 ? <p>Brak kodów rabatowych.</p> : rows.map((r) => (
          <div className="workshop-part" key={r.id}>
            <div><strong>{r.code} <span style={{ color: "#22d3ee" }}>−{r.percent}%</span></strong><small>{r.active ? "Aktywny" : "Wyłączony"}</small></div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="outline" onClick={() => void toggle(r)}>{r.active ? "Wyłącz" : "Włącz"}</Button>
              <Button variant="outline" size="icon" aria-label={`Usuń kod ${r.code}`} onClick={() => void remove(r.id)}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Ranking({ rows }: { rows: VisitRow[] }) {
  const byPath = new Map<string, { visits: number; ips: Set<string> }>();
  for (const row of rows) {
    const path = row.path || "/";
    const entry = byPath.get(path) ?? { visits: 0, ips: new Set<string>() };
    entry.visits += 1;
    entry.ips.add(row.ip);
    byPath.set(path, entry);
  }
  const ranked = [...byPath.entries()].sort((a, b) => b[1].visits - a[1].visits);
  const total = rows.length;
  return (
    <>
      <div className="workshop-summary">
        <div><span>Wszystkie wizyty</span><strong>{total}</strong></div>
        <div><span>Różne podstrony</span><strong>{ranked.length}</strong></div>
        <div><span>Aktualizacja</span><strong>{localDate(new Date())}</strong></div>
      </div>
      <div className="workshop-list">
        {ranked.length === 0 ? <p>Brak danych o odwiedzinach.</p> : ranked.map(([path, stats], index) => (
          <div className="workshop-part" key={path}>
            <div>
              <strong>#{index + 1} · {path}</strong>
              <small>{stats.ips.size} unikalnych adresów IP</small>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong style={{ color: "#22d3ee" }}>{stats.visits}</strong>
              <small style={{ display: "block", color: "rgba(226,232,240,0.5)" }}>{total ? Math.round((stats.visits / total) * 100) : 0}% ruchu</small>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
