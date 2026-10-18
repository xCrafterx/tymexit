import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, Minus, Plus, Save, Package, Wallet, CalendarDays, RefreshCw, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { printTicketProtocol } from "@/components/PrintProtocol";
import { downloadCsv, financeSchema, formatMoney, localDate, partSchema, profit } from "@/lib/workshop";
import type { Tables } from "@/integrations/supabase/types";

type Ticket = Tables<"tickets">;
type Finance = Tables<"ticket_finances">;
type Part = Tables<"workshop_parts">;
type WorkshopView = "inventory" | "finance" | "calendar";
const financeZero = { customer_price: 0, parts_cost: 0, other_cost: 0, paid: false };
const queryKey = ["admin-workshop"];

async function loadWorkshop() {
  const [tickets, finances, parts] = await Promise.all([
    supabase.from("tickets").select("*").is("deleted_at", null).in("source", ["panel", "formularz"]).order("created_at", { ascending: false }),
    supabase.from("ticket_finances").select("*"),
    supabase.from("workshop_parts").select("*").order("name"),
  ]);
  const error = tickets.error || finances.error || parts.error;
  if (error) throw new Error(error.message);
  return { tickets: tickets.data ?? [], finances: finances.data ?? [], parts: parts.data ?? [] };
}

export function AdminWorkshop({ view }: { view: WorkshopView }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey, queryFn: loadWorkshop, refetchInterval: 30000 });
  const refresh = async () => { await cache.invalidateQueries({ queryKey }); };
  const icon = view === "inventory" ? <Package /> : view === "finance" ? <Wallet /> : <CalendarDays />;
  const title = view === "inventory" ? "Magazyn części" : view === "finance" ? "Finanse i zysk" : "Kalendarz zleceń";
  return <div className="workshop">
    <div className="workshop-heading"><h2>{icon}{title}</h2><Button variant="outline" size="icon" title="Odśwież" aria-label="Odśwież dane warsztatu" onClick={() => void refresh()} disabled={query.isFetching}><RefreshCw /></Button></div>
    {query.isPending ? <p role="status">Wczytywanie…</p> : query.isError ? <div role="alert"><p>Nie udało się wczytać danych.</p><Button variant="outline" onClick={() => void refresh()}>Spróbuj ponownie</Button></div> : <>
      {view === "inventory" && <Inventory parts={query.data.parts} onSaved={refresh} />}
      {view === "finance" && <Finances tickets={query.data.tickets} finances={query.data.finances} onSaved={refresh} />}
      {view === "calendar" && <Calendar tickets={query.data.tickets} onSaved={refresh} />}
    </>}
  </div>;
}

function Inventory({ parts, onSaved }: { parts: Part[]; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ name: "", quantity: "0", unit_cost: "0" });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = partSchema.safeParse(form);
    if (!parsed.success) { toast.error("Wpisz nazwę, całkowitą ilość i poprawną cenę."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("workshop_parts").insert(parsed.data);
      if (error) throw error;
      setForm({ name: "", quantity: "0", unit_cost: "0" });
      await onSaved(); toast.success("Dodano część do magazynu");
    } catch { toast.error("Nie udało się dodać części."); } finally { setSaving(false); }
  };
  const adjust = async (part: Part, delta: number) => {
    if (busy || (delta < 0 && part.quantity === 0)) return;
    setBusy(part.id);
    try {
      const { error } = await supabase.rpc("adjust_workshop_stock", { _part_id: part.id, _delta: delta });
      if (error) throw error;
      await onSaved(); toast.success(delta > 0 ? "Dodano 1 sztukę" : "Zapisano zużycie 1 sztuki");
    } catch { toast.error("Nie udało się zmienić stanu. Odśwież magazyn i spróbuj ponownie."); } finally { setBusy(null); }
  };
  return <>
    <div className="workshop-summary">
      <div><span>Rodzaje części</span><strong>{parts.length}</strong></div>
      <div><span>Łącznie sztuk</span><strong>{parts.reduce((n, p) => n + p.quantity, 0)}</strong></div>
      <div><span>Wartość magazynu</span><strong>{formatMoney(parts.reduce((n, p) => n + p.quantity * p.unit_cost, 0))}</strong></div>
    </div>
    <form onSubmit={add} className="workshop-add">
      <label>Nazwa części<input className="form-control" maxLength={120} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Ilość sztuk<input className="form-control" type="number" min="0" max="2147483647" step="1" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
      <label>Koszt za sztukę (zł)<input className="form-control" type="number" min="0" max="9999999999.99" step="0.01" required value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></label>
      <Button type="submit" disabled={saving}><Plus />Dodaj część</Button>
    </form>
    <div className="workshop-list">{parts.length === 0 ? <p>Magazyn jest pusty.</p> : parts.map((part) => <div className="workshop-part" key={part.id}>
      <div><strong>{part.name}</strong><small>{formatMoney(part.unit_cost)} / szt.</small></div>
      <div className="workshop-stock"><Button variant="outline" size="icon" aria-label={`Zużyj jedną: ${part.name}`} title="Zużyj 1 sztukę" disabled={!!busy || part.quantity === 0} onClick={() => void adjust(part, -1)}><Minus /></Button><output aria-label={`Stan: ${part.name}`}>{part.quantity}</output><Button variant="outline" size="icon" aria-label={`Dodaj jedną: ${part.name}`} title="Dodaj 1 sztukę" disabled={!!busy || part.quantity === 2147483647} onClick={() => void adjust(part, 1)}><Plus /></Button></div>
    </div>)}</div>
  </>;
}

function Finances({ tickets, finances, onSaved }: { tickets: Ticket[]; finances: Finance[]; onSaved: () => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [onlyPaid, setOnlyPaid] = useState(false);
  const map = useMemo(() => new Map(finances.map((row) => [row.ticket_id, row])), [finances]);
  const filtered = tickets.filter((ticket) => {
    const date = localDate(new Date(ticket.created_at));
    return (!from || date >= from) && (!to || date <= to) && (!onlyPaid || map.get(ticket.id)?.paid) && `${ticket.title} ${ticket.client_name ?? ""} ${ticket.id}`.toLocaleLowerCase("pl").includes(search.toLocaleLowerCase("pl"));
  });
  const sums = filtered.reduce((sum, ticket) => {
    const values = map.get(ticket.id) ?? financeZero;
    sum.revenue += values.customer_price; sum.costs += values.parts_cost + values.other_cost;
    if (values.paid) { sum.paid += values.customer_price; sum.paidProfit += profit(values); }
    return sum;
  }, { revenue: 0, costs: 0, paid: 0, paidProfit: 0 });
  const exportRows = () => {
    downloadCsv(`tymekit-zgloszenia-${localDate(new Date())}.csv`, [
      ["Numer", "Data zgłoszenia", "Klient", "E-mail", "Telefon", "Tytuł", "Usługa", "Status", "Termin", "Godzina", "Cena (PLN)", "Części (PLN)", "Inne koszty (PLN)", "Zysk (PLN)", "Opłacone"],
      ...filtered.map((ticket) => { const f = map.get(ticket.id) ?? financeZero; return [ticket.id, localDate(new Date(ticket.created_at)), ticket.client_name, ticket.client_email, ticket.client_phone, ticket.title, ticket.service_type, ticket.status, ticket.preferred_date, ticket.preferred_slot, f.customer_price, f.parts_cost, f.other_cost, profit(f), f.paid ? "Tak" : "Nie"]; }),
    ]);
  };
  return <>
    <div className="workshop-summary">
      <div><span>Wyceny łącznie</span><strong>{formatMoney(sums.revenue)}</strong></div><div><span>Koszty</span><strong>{formatMoney(sums.costs)}</strong></div><div><span>Wpłacono</span><strong>{formatMoney(sums.paid)}</strong></div><div><span>Zysk opłaconych napraw</span><strong>{formatMoney(sums.paidProfit)}</strong></div>
    </div>
    <div className="workshop-filters">
      <label>Szukaj zgłoszenia<input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Klient, tytuł lub numer" /></label>
      <label>Wpłynęło od<input className="form-control" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>Wpłynęło do<input className="form-control" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
      <label className="workshop-check"><input type="checkbox" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} />Tylko opłacone</label>
      <Button variant="outline" onClick={exportRows} disabled={filtered.length === 0}><Download />Eksport CSV</Button>
    </div>
    {filtered.length === 0 ? <p>Brak zgłoszeń w tym zakresie.</p> : <div className="workshop-list">{filtered.map((ticket) => <FinanceRow key={`${ticket.id}-${map.get(ticket.id)?.updated_at ?? "new"}`} ticket={ticket} saved={map.get(ticket.id)} onSaved={onSaved} />)}</div>}
  </>;
}

function FinanceRow({ ticket, saved, onSaved }: { ticket: Ticket; saved?: Finance; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({ customer_price: String(saved?.customer_price ?? 0), parts_cost: String(saved?.parts_cost ?? 0), other_cost: String(saved?.other_cost ?? 0), paid: saved?.paid ?? false });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const parsed = financeSchema.safeParse(form);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!parsed.success) { toast.error("Kwoty muszą być poprawne i nieujemne."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("ticket_finances").upsert({ ticket_id: ticket.id, ...parsed.data, updated_at: new Date().toISOString() });
      if (error) throw error;
      await onSaved(); setDirty(false); toast.success("Zapisano rozliczenie");
    } catch { toast.error("Nie udało się zapisać rozliczenia."); } finally { setSaving(false); }
  };
  return <form className="workshop-finance-row" onSubmit={save} aria-label={`Rozliczenie: ${ticket.title}`}>
    <div className="workshop-row-title"><h3>{ticket.title}</h3><small>{ticket.client_name || "Klient"} · #{ticket.id.slice(0, 8)} · {ticket.status}</small></div>
    <div className="workshop-money-fields">{(["customer_price", "parts_cost", "other_cost"] as const).map((key, index) => <label key={key}>{["Cena dla klienta (zł)", "Koszt części (zł)", "Inne koszty (zł)"][index]}<input className="form-control" type="number" min="0" max="9999999999.99" step="0.01" required value={form[key]} onChange={(e) => { setForm({ ...form, [key]: e.target.value }); setDirty(true); }} /></label>)}
      <div className="workshop-profit"><span>Zysk</span><strong className={parsed.success && profit(parsed.data) < 0 ? "workshop-loss" : ""}>{parsed.success ? formatMoney(profit(parsed.data)) : "—"}</strong></div>
    </div>
    <div className="workshop-row-actions"><label className="workshop-check"><input type="checkbox" checked={form.paid} onChange={(e) => { setForm({ ...form, paid: e.target.checked }); setDirty(true); }} />Opłacone</label><span className="text-dim">{dirty ? "Niezapisane zmiany" : saved ? "Zapisano" : "Brak rozliczenia"}</span><Button type="button" variant="outline" onClick={() => printTicketProtocol(ticket)}><Printer />Protokół PDF</Button><Button type="submit" disabled={saving || !dirty || !parsed.success}><Save />Zapisz</Button></div>
  </form>;
}

function Calendar({ tickets, onSaved }: { tickets: Ticket[]; onSaved: () => Promise<void> }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(localDate(new Date()));
  const [unscheduled, setUnscheduled] = useState(false);
  const available = tickets.filter((ticket) => !["zakończone", "anulowane", "nieaktywne"].includes(ticket.status));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const visible = available.filter((ticket) => unscheduled ? !ticket.preferred_date : ticket.preferred_date === selected).sort((a, b) => (a.preferred_slot ?? "").localeCompare(b.preferred_slot ?? ""));
  const move = (direction: number) => { const next = new Date(month.getFullYear(), month.getMonth() + direction, 1); setMonth(next); setSelected(localDate(next)); setUnscheduled(false); };
  return <>
    <div className="workshop-calendar-toolbar"><Button variant="outline" size="icon" aria-label="Poprzedni miesiąc" onClick={() => move(-1)}><ChevronLeft /></Button><h3>{month.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}</h3><Button variant="outline" size="icon" aria-label="Następny miesiąc" onClick={() => move(1)}><ChevronRight /></Button><Button variant="outline" onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(localDate(now)); setUnscheduled(false); }}>Dzisiaj</Button></div>
    <div className="workshop-calendar-grid">{["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => <span className="workshop-weekday" key={day}>{day}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => {
      const date = localDate(new Date(month.getFullYear(), month.getMonth(), index + 1));
      const count = available.filter((ticket) => ticket.preferred_date === date).length;
      return <Button key={date} variant="ghost" className={`workshop-day${date === selected && !unscheduled ? " is-selected" : ""}`} aria-label={`${date}, zgłoszeń: ${count}`} aria-pressed={date === selected && !unscheduled} onClick={() => { setSelected(date); setUnscheduled(false); }}><span>{index + 1}</span><small>{count ? `${count} zlec.` : ""}</small></Button>;
    })}</div>
    <div className="workshop-heading"><h3>{unscheduled ? "Zgłoszenia bez terminu" : `Zlecenia: ${new Date(`${selected}T12:00:00`).toLocaleDateString("pl-PL")}`}</h3><Button variant={unscheduled ? "default" : "outline"} onClick={() => setUnscheduled((value) => !value)}>Bez terminu ({available.filter((ticket) => !ticket.preferred_date).length})</Button></div>
    {visible.length === 0 ? <p>Brak zgłoszeń.</p> : <div className="workshop-list">{visible.map((ticket) => <ScheduleRow key={`${ticket.id}-${ticket.preferred_date}-${ticket.preferred_slot}`} ticket={ticket} onSaved={onSaved} />)}</div>}
  </>;
}

function ScheduleRow({ ticket, onSaved }: { ticket: Ticket; onSaved: () => Promise<void> }) {
  const [date, setDate] = useState(ticket.preferred_date ?? "");
  const [slot, setSlot] = useState(ticket.preferred_slot ?? "");
  const [saving, setSaving] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const { error } = await supabase.from("tickets").update({ preferred_date: date || null, preferred_slot: date ? slot.trim() || null : null }).eq("id", ticket.id);
      if (error) throw error;
      await onSaved(); toast.success("Zapisano termin");
    } catch { toast.error("Nie udało się zapisać terminu."); } finally { setSaving(false); }
  };
  return <form className="workshop-schedule-row" onSubmit={save} aria-label={`Termin: ${ticket.title}`}><div><strong>{ticket.title}</strong><small>{ticket.client_name || "Klient"} · {ticket.status} · #{ticket.id.slice(0, 8)}</small></div><label>Data<input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Godzina / przedział<input className="form-control" value={slot} maxLength={50} placeholder="np. 14:00 – 15:00" disabled={!date} onChange={(e) => setSlot(e.target.value)} /></label><Button type="submit" disabled={saving || (date === (ticket.preferred_date ?? "") && slot === (ticket.preferred_slot ?? ""))}><Save />Zapisz termin</Button></form>;
}