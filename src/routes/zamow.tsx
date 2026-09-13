import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/zamow")({
  head: () => ({
    meta: [
      { title: "Zamów usługę — TymekIT" },
      { name: "description", content: "Zamów usługę IT — naprawa, instalacja, konfiguracja Wi-Fi, pomoc zdalna. Wybierz termin a Tymek skontaktuje się jak najszybciej." },
    ],
  }),
  component: () => (
    <AuthGuard>
      <ZamowPage />
    </AuthGuard>
  ),
});

const SERVICES = [
  "Budowa komputera na zamówienie",
  "Naprawa komputera lub laptopa",
  "Instalacja systemu i programów",
  "Czyszczenie sprzętu lub Windows",
  "Konfiguracja sieci Wi-Fi",
  "Pomoc zdalna",
  "Inne",
];

const SLOTS = [
  { v: "8-10", l: "8:00 – 10:00" },
  { v: "10-12", l: "10:00 – 12:00" },
  { v: "12-14", l: "12:00 – 14:00" },
  { v: "14-16", l: "14:00 – 16:00" },
  { v: "16-18", l: "16:00 – 18:00" },
  { v: "18-20", l: "18:00 – 20:00" },
  { v: "20-22", l: "20:00 – 22:00" },
];

const schema = z.object({
  client_name: z.string().trim().min(2, "Imię i nazwisko min. 2 znaki").max(120),
  client_email: z.string().trim().email("Niepoprawny e-mail").max(255),
  client_phone: z.string().trim().min(7, "Numer telefonu min. 7 znaków").max(40),
  goal: z.string().trim().min(3, "Opisz cel usługi (min. 3 znaki)").max(200),
  service_type: z.string().refine((v) => SERVICES.includes(v), "Wybierz usługę"),
  preferred_date: z.string().min(1, "Wybierz datę"),
  preferred_slot: z.string().min(1, "Wybierz godzinę"),
});

function ZamowPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    client_email: session?.user.email ?? "",
    client_phone: "",
    goal: "",
    service_type: "",
    preferred_date: "",
    preferred_slot: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!session) return;
    setSubmitting(true);
    const d = parsed.data;
    const title = `Zamówienie: ${d.service_type}`;
    const description = `Cel: ${d.goal}\n\nKlient: ${d.client_name}\nE-mail: ${d.client_email}\nTelefon: ${d.client_phone}\nTermin: ${d.preferred_date}, ${d.preferred_slot}`;
    const { error } = await supabase.from("tickets").insert({
      user_id: session.user.id,
      title,
      description,
      service_type: d.service_type,
      status: "oczekuje",
      is_priority: true,
      source: "zamow",
      client_name: d.client_name,
      client_email: d.client_email,
      client_phone: d.client_phone,
      preferred_date: d.preferred_date,
      preferred_slot: d.preferred_slot,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    // Best-effort notyfikacje (jeśli endpoint istnieje – nie blokuj UX)
    fetch("/api/public/order-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        client_name: d.client_name,
        client_email: d.client_email,
        client_phone: d.client_phone,
        service_type: d.service_type,
        preferred_date: d.preferred_date,
        preferred_slot: d.preferred_slot,
        goal: d.goal,
      }),
    }).catch(() => { /* ignoruj */ });

    toast.success("Zamówienie wysłane — Tymek skontaktuje się jak najszybciej.");
    navigate({ to: "/panel-klienta" });
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> Zamów usługę</div>
          <h1 className="reveal visible" data-delay="1">Zamów <span className="grad">usługę IT.</span></h1>
          <p className="reveal visible" data-delay="2">Wybierz rodzaj pomocy, termin i opisz problem — ustalimy szczegóły naprawy lub konfiguracji.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="glass reveal visible" style={{ padding: 40 }}>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Imię i nazwisko</label>
                  <input className="form-control" required placeholder="Twoje imię" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input type="email" className="form-control" required placeholder="twoj@email.com" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Telefon</label>
                  <input className="form-control" required placeholder="+48 ..." value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Cel usługi</label>
                  <input className="form-control" required placeholder="Naprawa, instalacja, czyszczenie, Wi-Fi..." value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Rodzaj usługi</label>
                  <select className="form-control" required value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })}>
                    <option value="">Wybierz usługę</option>
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferowana data</label>
                  <input type="date" className="form-control" required value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Preferowana godzina</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  {SLOTS.map((s) => (
                    <label key={s.v} className="checkbox-row" style={{ justifyContent: "center", padding: 12, border: `1px solid ${form.preferred_slot === s.v ? "var(--brand)" : "var(--border)"}`, borderRadius: 10, background: form.preferred_slot === s.v ? "var(--surface-2)" : "var(--surface)", cursor: "pointer", fontSize: 13 }}>
                      <input type="radio" name="slot" value={s.v} checked={form.preferred_slot === s.v} onChange={() => setForm({ ...form, preferred_slot: s.v })} style={{ display: "none" }} />
                      {s.l}
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-mute" style={{ fontSize: 13, margin: "8px 0 22px" }}>
                Zgłoszenia można wysyłać przez całą dobę. Pilne awarie komputera, internetu lub systemu opisz możliwie dokładnie — trafiają na <strong style={{ color: "var(--brand)" }}>priorytetową listę</strong>.
              </p>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                {submitting ? "Wysyłanie..." : "Wyślij zgłoszenie"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
