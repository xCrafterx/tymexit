import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MySecrets } from "@/components/MySecrets";
import { AllEasterEggs } from "@/components/AllEasterEggs";
import { AccountSettings } from "@/components/AccountSettings";
import { TicketProgressBar } from "@/components/TicketProgressBar";
import { TicketAttachments } from "@/components/TicketAttachments";
import { TicketChat } from "@/components/TicketChat";
import { ReputationBadge } from "@/components/ReputationBadge";
import { ALL_STATUSES, STATUS_META as STATUS_META_LIB, DELETABLE_STATUSES as DEL_LIB, type TicketStatus } from "@/lib/ticket-status";
import { notifyMessage } from "@/lib/notify";
import { AdminLiveChats } from "@/routes/admin.czaty";
import { AdminReviews } from "@/components/Reviews";
import { PopularServicesAdmin } from "@/components/PopularServicesAdmin";
import { PanelTabs, type PanelTabGroup } from "@/components/PanelTabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/panel-admin")({
  head: () => ({ meta: [{ title: "Panel admina — TymekIT" }] }),
  component: () => (
    <AuthGuard requireRole="admin">
      <PanelAdmin />
    </AuthGuard>
  ),
});

type Ticket = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  service_type: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  deleted_at: string | null;
  is_priority?: boolean | null;
  source?: string | null;
  preferred_date?: string | null;
  preferred_slot?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
};

const STATUSES = ALL_STATUSES;
const DELETABLE_STATUSES = DEL_LIB;
const STATUS_META = STATUS_META_LIB;

type ConfirmAction =
  | { kind: "soft"; ticket: Ticket }
  | { kind: "restore"; ticket: Ticket }
  | { kind: "hard"; ticket: Ticket }
  | null;

export function PanelAdmin() {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Record<string, { note: string; saving: boolean }>>({});
  const [tab, setTab] = useState<"tickets" | "form_logs" | "trash" | "chats" | "reviews" | "popular" | "secrets" | "eggs" | "account">("tickets");
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [acting, setActing] = useState(false);
  const [openChats, setOpenChats] = useState<Record<string, boolean>>({});

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tickets")
      .select("id,user_id,title,description,service_type,status,admin_note,created_at,deleted_at,is_priority,source,preferred_date,preferred_slot,client_name,client_email,client_phone")
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Realtime: nowe wiadomości w dowolnym zgłoszeniu
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel("admin_all_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages" },
        (payload) => {
          const m = payload.new as { sender_id: string; ticket_id: string; body: string };
          if (m.sender_id !== session.user.id) {
            notifyMessage(`Nowa wiadomość w zgłoszeniu #${m.ticket_id.slice(0, 8)}`);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  const active = useMemo(() => tickets.filter((t) => !t.deleted_at), [tickets]);
  const trashed = useMemo(() => tickets.filter((t) => !!t.deleted_at), [tickets]);

  const stats = useMemo(() => ({
    all: active.length,
    oczekuje: active.filter((t) => t.status === "oczekuje").length,
    diagnoza: active.filter((t) => t.status === "diagnoza").length,
    w_trakcie: active.filter((t) => t.status === "w_trakcie").length,
    czesci: active.filter((t) => t.status === "czesci").length,
    gotowe: active.filter((t) => t.status === "gotowe").length,
    zamkniete: active.filter((t) => t.status === "zamkniete").length,
  }), [active]);

  const filtered = useMemo(() => {
    if (filter === "all") return active;
    return active.filter((t) => t.status === filter);
  }, [active, filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("tickets")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Błąd zmiany statusu: " + error.message);
      return;
    }
    toast.success("Zmieniono status na: " + (STATUS_META[newStatus as TicketStatus]?.label ?? newStatus));
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  const togglePriority = async (id: string, current: boolean | null | undefined) => {
    const next = !current;
    const { error } = await supabase
      .from("tickets")
      .update({ is_priority: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Błąd: " + error.message);
      return;
    }
    toast.success(next ? "Oznaczono jako priorytet" : "Zdjęto priorytet");
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, is_priority: next } : t)));
  };

  const saveNote = async (id: string) => {
    const note = editing[id]?.note ?? "";
    setEditing((p) => ({ ...p, [id]: { note, saving: true } }));
    const { error } = await supabase
      .from("tickets")
      .update({ admin_note: note, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Błąd zapisu notatki: " + error.message);
      setEditing((p) => ({ ...p, [id]: { note, saving: false } }));
      return;
    }
    toast.success("Notatka zapisana");
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, admin_note: note } : t)));
    setEditing((p) => {
      const copy = { ...p };
      delete copy[id];
      return copy;
    });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setActing(true);
    const { kind, ticket } = confirm;
    try {
      if (kind === "soft") {
        const { error } = await supabase
          .from("tickets")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", ticket.id);
        if (error) throw error;
        setTickets((p) => p.map((t) => (t.id === ticket.id ? { ...t, deleted_at: new Date().toISOString() } : t)));
        toast.success(`Zlecenie #${ticket.id.slice(0, 8)} przeniesione do kosza`);
      } else if (kind === "restore") {
        const { error } = await supabase
          .from("tickets")
          .update({ deleted_at: null })
          .eq("id", ticket.id);
        if (error) throw error;
        setTickets((p) => p.map((t) => (t.id === ticket.id ? { ...t, deleted_at: null } : t)));
        toast.success(`Zlecenie #${ticket.id.slice(0, 8)} przywrócone`);
      } else if (kind === "hard") {
        await supabase.from("ticket_messages").delete().eq("ticket_id", ticket.id);
        await supabase.from("ticket_attachments").delete().eq("ticket_id", ticket.id);
        await supabase.from("ticket_history").delete().eq("ticket_id", ticket.id);
        const { error } = await supabase.from("tickets").delete().eq("id", ticket.id);
        if (error) throw error;
        setTickets((p) => p.filter((t) => t.id !== ticket.id));
        toast.success(`Zlecenie #${ticket.id.slice(0, 8)} bezpowrotnie usunięte`);
      }
      setConfirm(null);
    } catch (e: unknown) {
      toast.error("Operacja nie powiodła się: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setActing(false);
    }
  };

  const confirmCopy = useMemo(() => {
    if (!confirm) return { title: "", desc: "", action: "" };
    const idShort = `#${confirm.ticket.id.slice(0, 8)}`;
    switch (confirm.kind) {
      case "soft":
        return {
          title: `Przenieść zlecenie ${idShort} do kosza?`,
          desc: "Zlecenie nie będzie widoczne na liście aktywnych, ale możesz je w każdej chwili przywrócić z Kosza.",
          action: "Przenieś do kosza",
        };
      case "restore":
        return {
          title: `Przywrócić zlecenie ${idShort}?`,
          desc: "Zlecenie wróci na listę aktywnych z zachowaniem dotychczasowego statusu.",
          action: "Przywróć",
        };
      case "hard":
        return {
          title: `Bezpowrotnie usunąć zlecenie ${idShort}?`,
          desc: "Ta operacja jest nieodwracalna. Zostaną usunięte załączniki, historia zmian i wiadomości z czatu.",
          action: "Usuń na zawsze",
        };
    }
  }, [confirm]);

  return (
    <>
      <section className="hero-sm">
        <div className="container">
          <div className="reveal visible" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <span className="badge badge-accent">Panel administratora</span>
            <span className="badge badge-cyan">TymekIT Service Hub</span>
          </div>
          <h1 className="reveal visible" data-delay="1">Zarządzanie <span className="grad">serwisem.</span></h1>
          <p className="reveal visible" data-delay="2">Pełny widok zgłoszeń klientów, zmiana statusu, notatki serwisowe i statystyki warsztatu TymekIT.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          {(() => {
            const groups: PanelTabGroup[] = [
              {
                id: "obsluga",
                label: "Obsługa klienta",
                icon: "🛠",
                items: [
                  { key: "tickets", label: "Zgłoszenia", icon: "📋" },
                  { key: "form_logs", label: "Logi formularzy", icon: "🌐", badge: tickets.filter((t) => t.source === "formularz").length || undefined },
                  { key: "chats", label: "Czat na żywo", icon: "💬" },
                  { key: "trash", label: "Kosz", icon: "🗑", badge: trashed.length || undefined },
                ],
              },
              {
                id: "spolecznosc",
                label: "Społeczność",
                icon: "✨",
                items: [
                  { key: "reviews", label: "Opinie", icon: "⭐" },
                  { key: "popular", label: "Popularne usługi", icon: "★" },
                ],
              },
              {
                id: "konto",
                label: "Konto i profil",
                icon: "👤",
                items: [
                  { key: "account", label: "Konto", icon: "⚙️" },
                  { key: "secrets", label: "Moje sekrety", icon: "🔐" },
                  { key: "eggs", label: "Easter eggi", icon: "🥚" },
                ],
              },
            ];
            return <PanelTabs groups={groups} active={tab} onChange={(k) => setTab(k as typeof tab)} />;
          })()}

          {tab === "form_logs" ? (
            <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
              {tickets
                .filter((t) => t.source === "formularz")
                .map((t) => {
                  const metaMatch = t.description.match(/--- METADATA ---\s*IP:\s*(.*?)\s*Przeglądarka:\s*(.*?)\s*Data:\s*(.*)/s);
                  const ip = metaMatch ? metaMatch[1] : "Brak danych (stary wpis)";
                  const browser = metaMatch ? metaMatch[2] : "Brak danych";
                  const sentTime = metaMatch ? metaMatch[3] : new Date(t.created_at).toLocaleString("pl-PL");

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
                        <div>
                          <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Zgłoszenie z formularza</span>
                          <h3 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "600", color: "#fff" }}>
                            {t.client_name || "Brak imienia i nazwiska"}
                          </h3>
                          <p style={{ margin: "2px 0 0", color: "#67e8f9", fontSize: "14px" }}>
                            ✉️ {t.client_email || "Brak e-mail"}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)" }}>Wpłynęło:</span>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}>
                            🕒 {new Date(t.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: "rgba(0, 0, 0, 0.25)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", display: "grid", gap: "6px" }}>
                        <div><strong>🕒 Godzina wysłania:</strong> {sentTime}</div>
                        <div><strong>🌐 Przeglądarka:</strong> <span style={{ wordBreak: "break-all" }}>{browser}</span></div>
                        <div><strong>📍 Adres IP:</strong> <code style={{ color: "#a5b4fc" }}>{ip}</code></div>
                      </div>
                    </div>
                  );
                })}
              {tickets.filter((t) => t.source === "formularz").length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.5)" }}>
                  Brak zgłoszeń wysłanych przez formularz.
                </div>
              )}
            </div>
          ) : tab === "chats" ? <AdminLiveChats /> : tab === "reviews" ? <AdminReviews /> : tab === "popular" ? <PopularServicesAdmin /> : tab === "secrets" ? <MySecrets /> : tab === "eggs" ? <AllEasterEggs /> : tab === "account" ? <AccountSettings /> : tab === "trash" ? (
            <>
              <div className="reveal visible">
                <span className="eyebrow"><span className="dot"></span> Kosz</span>
                <h2 className="section-title" style={{ marginTop: 18 }}>Usunięte <span className="grad">zlecenia.</span></h2>
                <p className="text-dim" style={{ marginTop: 10 }}>Możesz przywrócić zlecenie lub usunąć je trwale wraz z historią statusów.</p>
              </div>
              {loading ? (
                <p className="text-dim" style={{ marginTop: 30 }}>Ładowanie…</p>
              ) : trashed.length === 0 ? (
                <div className="glass reveal visible" style={{ marginTop: 30, padding: 30, textAlign: "center" }}>
                  <p className="text-dim">Kosz jest pusty.</p>
                </div>
              ) : (
                <div className="testi-grid" style={{ marginTop: 30 }}>
                  {trashed.map((t) => (
                    <article key={t.id} className="testi-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="badge badge-accent">#{t.id.slice(0, 8)}</span>
                        <span className="badge badge-ghost">Usunięto {t.deleted_at ? new Date(t.deleted_at).toLocaleDateString("pl-PL") : ""}</span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{t.title}</h3>
                      <p className="text-dim" style={{ fontSize: 13, flex: 1 }}>{t.description}</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setConfirm({ kind: "restore", ticket: t })}
                        >
                          Przywróć
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          style={{ color: "var(--red, #f87171)" }}
                          onClick={() => setConfirm({ kind: "hard", ticket: t })}
                        >
                          Usuń trwale
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
          {/* STATYSTYKI */}
          <div className="stats-row reveal visible" style={{ marginBottom: 30 }}>
            <div className="stat-card" onClick={() => setFilter("all")} style={{ cursor: "pointer" }}>
              <span className="stat-num">{stats.all}</span>
              <span className="stat-label">Wszystkie aktywne</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("oczekuje")} style={{ cursor: "pointer" }}>
              <span className="stat-num" style={{ color: STATUS_META.oczekuje.color }}>{stats.oczekuje}</span>
              <span className="stat-label">Oczekuje</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("diagnoza")} style={{ cursor: "pointer" }}>
              <span className="stat-num" style={{ color: STATUS_META.diagnoza.color }}>{stats.diagnoza}</span>
              <span className="stat-label">Diagnoza</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("w_trakcie")} style={{ cursor: "pointer" }}>
              <span className="stat-num" style={{ color: STATUS_META.w_trakcie.color }}>{stats.w_trakcie}</span>
              <span className="stat-label">W trakcie</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("czesci")} style={{ cursor: "pointer" }}>
              <span className="stat-num" style={{ color: STATUS_META.czesci.color }}>{stats.czesci}</span>
              <span className="stat-label">Części</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("gotowe")} style={{ cursor: "pointer" }}>
              <span className="stat-num" style={{ color: STATUS_META.gotowe.color }}>{stats.gotowe}</span>
              <span className="stat-label">Gotowe</span>
            </div>
            <div className="stat-card" onClick={() => setFilter("zamkniete")} style={{ cursor: "pointer" }}>
              <span className="stat-num" style={{ color: STATUS_META.zamkniete.color }}>{stats.zamkniete}</span>
              <span className="stat-label">Zamknięte</span>
            </div>
          </div>

          {/* FILTRY */}
          <div className="reveal visible" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <button
              className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter("all")}
            >
              Wszystkie ({stats.all})
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-outline"}`}
                onClick={() => setFilter(s)}
              >
                {STATUS_META[s].label} ({stats[s as keyof typeof stats] ?? 0})
              </button>
            ))}
          </div>

          {/* LISTA ZLECEŃ */}
          {loading ? (
            <p className="text-dim">Ładowanie zleceń…</p>
          ) : filtered.length === 0 ? (
            <div className="glass reveal visible" style={{ padding: 40, textAlign: "center" }}>
              <p className="text-dim">Brak zleceń w tej kategorii.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map((t) => {
                const meta = STATUS_META[t.status as TicketStatus] ?? { label: t.status, color: "#fff", bg: "rgba(255,255,255,0.1)" };
                const noteState = editing[t.id];
                const currentNote = noteState !== undefined ? noteState.note : (t.admin_note ?? "");
                const isDeletable = DELETABLE_STATUSES.includes(t.status as TicketStatus);
                const chatOpen = !!openChats[t.id];

                return (
                  <article key={t.id} className="glass reveal visible" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <span className="badge badge-accent">#{t.id.slice(0, 8)}</span>
                        <span className="badge badge-cyan">{t.service_type}</span>
                        {t.is_priority && (
                          <span className="badge" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                            🔥 Priorytet
                          </span>
                        )}
                        {t.source && <span className="badge badge-ghost">źródło: {t.source}</span>}
                        <ReputationBadge userId={t.user_id} />
                        <span style={{ fontSize: 13, color: "var(--dim)" }}>
                          Utworzono: {new Date(t.created_at).toLocaleString("pl-PL")}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${t.is_priority ? "btn-accent" : "btn-outline"}`}
                          onClick={() => togglePriority(t.id, t.is_priority)}
                          title="Przełącz status priorytetu"
                        >
                          {t.is_priority ? "★ Priorytet" : "☆ Priorytet"}
                        </button>
                        <select
                          className="status-select"
                          value={t.status}
                          onChange={(e) => updateStatus(t.id, e.target.value)}
                          style={{
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.color}40`,
                            borderRadius: 8,
                            padding: "6px 12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} style={{ background: "#0a0a0f", color: "#fff" }}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          title={isDeletable ? "Przenieś do kosza" : "Tylko zlecenia gotowe lub zamknięte można przenieść do kosza"}
                          disabled={!isDeletable}
                          onClick={() => setConfirm({ kind: "soft", ticket: t })}
                          style={{ opacity: isDeletable ? 1 : 0.4 }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t.title}</h3>
                    <p style={{ color: "var(--text-sec)", lineHeight: 1.6, marginBottom: 16 }}>{t.description}</p>

                    <div style={{ marginBottom: 16 }}>
                      <TicketProgressBar status={t.status} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 16, fontSize: 13, color: "var(--dim)" }}>
                      <div>
                        <strong style={{ color: "var(--text)" }}>Klient:</strong> {t.client_name || "—"}<br />
                        <strong style={{ color: "var(--text)" }}>Email:</strong> {t.client_email || "—"}<br />
                        <strong style={{ color: "var(--text)" }}>Telefon:</strong> {t.client_phone || "—"}
                      </div>
                      <div>
                        <strong style={{ color: "var(--text)" }}>Preferowany termin:</strong> {t.preferred_date || "—"}<br />
                        <strong style={{ color: "var(--text)" }}>Przedział:</strong> {t.preferred_slot || "—"}<br />
                        <strong style={{ color: "var(--text)" }}>ID klienta:</strong> <code style={{ fontSize: 11 }}>{t.user_id.slice(0, 12)}…</code>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <TicketAttachments ticketId={t.id} />
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setOpenChats((p) => ({ ...p, [t.id]: !p[t.id] }))}
                      >
                        💬 {chatOpen ? "Ukryj czat" : "Pokaż czat z klientem"}
                      </button>
                    </div>

                    {chatOpen && (
                      <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "rgba(0,0,0,0.3)" }}>
                        <TicketChat ticketId={t.id} />
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                      <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--dim)", display: "block", marginBottom: 6 }}>
                        Notatka serwisowa (widoczna dla klienta w statusie)
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="np. Czekamy na dostawę ekranu z hurtowni, planowany odbiór: piątek"
                          value={currentNote}
                          onChange={(e) => setEditing((p) => ({ ...p, [t.id]: { note: e.target.value, saving: false } }))}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={noteState?.saving}
                          onClick={() => saveNote(t.id)}
                        >
                          {noteState?.saving ? "Zapisuję…" : "Zapisz"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </>)}
        </div>
      </section>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); runConfirm(); }} disabled={acting}>
              {acting ? "Pracuję..." : confirmCopy.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PanelAdmin;
