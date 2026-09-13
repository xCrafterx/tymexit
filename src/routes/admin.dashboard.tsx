import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { STATUS_META, type TicketStatus } from "@/lib/ticket-status";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard admina — TymekIT" }] }),
  component: () => (
    <AuthGuard requireRole="admin">
      <AdminDashboard />
    </AuthGuard>
  ),
});

type Ticket = {
  id: string;
  title: string;
  status: string;
  service_type: string;
  user_id: string;
  created_at: string;
  deleted_at: string | null;
};

type Profile = {
  id: string;
  client_level: string;
};

function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [history, setHistory] = useState<{ ticket_id: string; new_status: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [tk, pr, hs] = await Promise.all([
        supabase.from("tickets").select("id,title,status,service_type,user_id,created_at,deleted_at").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,client_level"),
        supabase.from("ticket_status_history").select("ticket_id,new_status,created_at"),
      ]);
      setTickets((tk.data ?? []) as Ticket[]);
      setProfiles((pr.data ?? []) as Profile[]);
      setHistory((hs.data ?? []) as { ticket_id: string; new_status: string; created_at: string }[]);
      setLoading(false);
    })();
  }, []);

  const active = useMemo(() => tickets.filter((t) => !t.deleted_at), [tickets]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const inRepairStatuses = ["w naprawie", "w diagnozie", "oczekuje na części"];
    const completionTimes: number[] = [];
    const ticketCreated = new Map(active.map((t) => [t.id, new Date(t.created_at).getTime()]));
    history.forEach((h) => {
      if (h.new_status === "zakończone") {
        const start = ticketCreated.get(h.ticket_id);
        if (start) completionTimes.push(new Date(h.created_at).getTime() - start);
      }
    });
    const avgMs = completionTimes.length ? completionTimes.reduce((a,b)=>a+b,0)/completionTimes.length : 0;
    const avgDays = avgMs ? (avgMs / (1000 * 60 * 60 * 24)).toFixed(1) : "—";
    return {
      total: active.length,
      pending: active.filter((t) => t.status === "oczekuje").length,
      inRepair: active.filter((t) => inRepairStatuses.includes(t.status)).length,
      done: active.filter((t) => t.status === "zakończone").length,
      clients: profiles.length,
      vip: profiles.filter((p) => p.client_level === "VIP").length,
      today: active.filter((t) => new Date(t.created_at) >= today).length,
      avgDays,
    };
  }, [active, profiles, history]);

  const last7 = useMemo(() => {
    const days: { date: Date; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0,0,0,0);
      d.setDate(d.getDate() - i);
      days.push({ date: d, label: d.toLocaleDateString("pl-PL", { weekday: "short" }), count: 0 });
    }
    active.forEach((t) => {
      const td = new Date(t.created_at); td.setHours(0,0,0,0);
      const slot = days.find((d) => d.date.getTime() === td.getTime());
      if (slot) slot.count++;
    });
    return days;
  }, [active]);

  const maxCount = Math.max(1, ...last7.map((d) => d.count));
  const recent = active.slice(0, 10);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> <Link to="/panel-admin">Panel admina</Link> <span>/</span> Dashboard</div>
          <h1 className="reveal visible" data-delay="1">Dashboard <span className="grad">administratora.</span></h1>
          <p className="reveal visible" data-delay="2">Statystyki warsztatu TymekIT w czasie rzeczywistym.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          {loading ? (
            <p className="text-dim">Ładowanie...</p>
          ) : (
            <>
              <div className="hero-stats reveal visible" style={{ marginTop: 0 }}>
                <div className="hero-stat"><div className="num">{stats.total}</div><div className="label">Wszystkie zgłoszenia</div></div>
                <div className="hero-stat"><div className="num">{stats.pending}</div><div className="label">Oczekujące</div></div>
                <div className="hero-stat"><div className="num">{stats.inRepair}</div><div className="label">W naprawie</div></div>
                <div className="hero-stat"><div className="num">{stats.done}</div><div className="label">Zakończone</div></div>
                <div className="hero-stat"><div className="num">{stats.clients}</div><div className="label">Klienci</div></div>
                <div className="hero-stat"><div className="num">{stats.vip}</div><div className="label">VIP</div></div>
                <div className="hero-stat"><div className="num">{stats.today}</div><div className="label">Dziś</div></div>
                <div className="hero-stat"><div className="num">{stats.avgDays}</div><div className="label">Śr. czas (dni)</div></div>
              </div>

              <div className="reveal visible" style={{ marginTop: 60 }}>
                <span className="eyebrow"><span className="dot"></span> Aktywność</span>
                <h2 className="section-title" style={{ marginTop: 18 }}>Zgłoszenia z <span className="grad">ostatnich 7 dni.</span></h2>
              </div>

              <div className="glass reveal visible" style={{ marginTop: 24, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 200 }}>
                  {last7.map((d) => {
                    const h = (d.count / maxCount) * 100;
                    return (
                      <div key={d.label + d.date.getTime()} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{d.count}</div>
                        <div style={{
                          width: "100%",
                          height: `${h}%`,
                          minHeight: 4,
                          background: "linear-gradient(180deg, var(--brand), var(--brand-3))",
                          borderRadius: "8px 8px 0 0",
                          transition: "height .5s ease",
                        }} />
                        <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "capitalize" }}>{d.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="reveal visible" style={{ marginTop: 60 }}>
                <span className="eyebrow"><span className="dot"></span> Najnowsze</span>
                <h2 className="section-title" style={{ marginTop: 18 }}>Ostatnie <span className="grad">zgłoszenia.</span></h2>
              </div>

              <div className="testi-grid" style={{ marginTop: 24 }}>
                {recent.map((t, i) => {
                  const meta = STATUS_META[t.status as TicketStatus] ?? { color: "var(--text-mute)", label: t.status, icon: "•" };
                  return (
                    <Link key={t.id} to="/panel-admin" className="testi reveal visible" data-delay={(i % 3) + 1} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 11, color: meta.color, textTransform: "uppercase", letterSpacing: ".1em" }}>
                          {meta.icon} {meta.label}
                        </span>
                        <small className="text-mute">{new Date(t.created_at).toLocaleDateString("pl-PL")}</small>
                      </div>
                      <h3 style={{ marginTop: 12, fontSize: "1rem", color: "var(--text)" }}>{t.title}</h3>
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-dim)" }}>{t.service_type} · #{t.id.slice(0, 8)}</div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
