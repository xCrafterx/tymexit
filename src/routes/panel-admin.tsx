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
import { printTicketProtocol } from "@/components/PrintProtocol";
import { openProtonMail } from "@/lib/protonMail";
import { ReputationBadge } from "@/components/ReputationBadge";
import { ALL_STATUSES, STATUS_META, DELETABLE_STATUSES, type TicketStatus } from "@/lib/ticket-status";
import { notifyMessage, notifyNewTicket, notifyNewReview } from "@/lib/notify";
import { AdminAccounts } from "@/components/AdminAccounts";
import { AdminLiveChats } from "@/routes/admin.czaty";
import { AdminReviews } from "@/components/Reviews";
import { PopularServicesAdmin } from "@/components/PopularServicesAdmin";
import { PanelTabs, type PanelTabGroup } from "@/components/PanelTabs";
import { AdminVisitLogs } from "@/components/AdminVisitLogs";
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
  const [tab, setTab] = useState<"tickets" | "form_logs" | "visit_logs" | "accounts" | "site_ratings" | "trash" | "chats" | "reviews" | "popular" | "secrets" | "eggs" | "account" | "reset_visitors" | "reset_downloads">("tickets");
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

  const active = useMemo(() => tickets.filter((t) => !t.deleted_at && !["ocena_strony", "odwiedziny_strony", "pobranie_programu"].includes(t.source || "")), [tickets]);
  const trashed = useMemo(() => tickets.filter((t) => !!t.deleted_at), [tickets]);

  const stats = useMemo(() => ({
    oczekuje: active.filter((t) => t.status === "oczekuje").length,
    zaakceptowane: active.filter((t) => t.status === "zaakceptowane").length,
    inRepair: active.filter((t) => ["w diagnozie", "w naprawie", "oczekuje na części"].includes(t.status)).length,
    ready: active.filter((t) => t.status === "gotowe do odbioru").length,
    zakończone: active.filter((t) => t.status === "zakończone").length,
  }), [active]);

  const filtered = filter === "all" ? active : active.filter((t) => t.status === filter);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status zaktualizowany");
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const togglePriority = async (id: string, current: boolean | null | undefined) => {
    const next = !current;
    const { error } = await supabase
      .from("tickets")
      .update({ is_priority: next } as any)
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
    const { error } = await supabase.from("tickets").update({ admin_note: note }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Notatka zapisana");
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, admin_note: note } : t)));
    }
    setEditing((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setActing(true);
    const { ticket, kind } = confirm;
    if (kind === "soft") {
      if (!(DELETABLE_STATUSES as readonly string[]).includes(ticket.status)) {
        toast.error("Tylko zlecenia zakończone, odrzucone lub nieaktywne mogą trafić do kosza.");
        setActing(false);
        setConfirm(null);
        return;
      }
      const { error } = await supabase
        .from("tickets")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", ticket.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Zlecenie przeniesiono do kosza");
        setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, deleted_at: new Date().toISOString() } : t)));
      }
    } else if (kind === "restore") {
      const { error } = await supabase
        .from("tickets")
        .update({ deleted_at: null })
        .eq("id", ticket.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Zlecenie zostało przywrócone");
        setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, deleted_at: null } : t)));
      }
    } else if (kind === "hard") {
      const { error } = await supabase
        .from("tickets")
        .delete().eq("id", ticket.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Zlecenie zostało trwale usunięte");
        setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
      }
    }
    setActing(false);
    setConfirm(null);
  };

  const confirmCopy = (() => {
    if (!confirm) return { title: "", desc: "", action: "Potwierdź" };
    if (confirm.kind === "soft") return { title: "Czy na pewno chcesz usunąć to zlecenie?", desc: "Zlecenie zostanie przeniesione do kosza. Możesz je później przywrócić.", action: "Przenieś do kosza" };
    if (confirm.kind === "restore") return { title: "Przywrócić zlecenie?", desc: "Zlecenie wróci na główną listę i znów będzie widoczne dla klienta.", action: "Przywróć" };
    return { title: "Usunąć zlecenie trwale?", desc: "Tej operacji nie można cofnąć. Usunięta zostanie też pełna historia statusów.", action: "Usuń trwale" };
  })();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> Panel admina</div>
          <h1 className="reveal visible" data-delay="1">Panel <span className="grad">administratora.</span></h1>
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
                  { key: "tickets", label: "Zgłoszenia", icon: "📋", badge: active.length, badgeVariant: "success", excludeFromGroupBadge: true },
                  { key: "form_logs", label: "Logi formularzy", icon: "🌐", badgeDot: tickets.some((t) => t.source === "formularz") },
                  { key: "visit_logs", label: "Logi odwiedzin", icon: "🛰" },
                  { key: "chats", label: "Czat na żywo", icon: "💬" },
                  { key: "trash", label: "Kosz", icon: "🗑", badge: trashed.length, badgeVariant: "danger", excludeFromGroupBadge: true },
                ],
              },
              {
                id: "spolecznosc",
                label: "Społeczność",
                icon: "✨",
                items: [
                  { key: "reviews", label: "Opinie", icon: "⭐" },
                  { key: "site_ratings", label: "Oceny strony", icon: "📊", badge: tickets.filter((t) => t.source === "ocena_strony").length || undefined },
                  { key: "popular", label: "Popularne usługi", icon: "★" },
                ],
              },
              {
                id: "ustawienia",
                label: "Ustawienia Strony",
                icon: "⚙️",
                items: [
                  { key: "reset_visitors", label: "Reset Odwiedzających", icon: "👥" },
                  { key: "reset_downloads", label: "Reset Pobrań", icon: "📥" },
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
                  const desc = t.description || "";
                  const metaMatch = desc.match(/--- METADATA ---\s*IP:\s*(.*?)\s*Przeglądarka:\s*(.*?)\s*Data:\s*(.*)/s);
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
                    ) : tab === "site_ratings" ? (
            <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 10px", fontSize: "18px", color: "#fff" }}>⭐ Podsumowanie ocen strony</h3>
                <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
                  Liczba wszystkich ocen: <strong>{tickets.filter((t) => t.source === "ocena_strony" && !t.deleted_at).length}</strong> | 
                  Widoczne na stronie: <strong>{tickets.filter((t) => t.source === "ocena_strony" && !t.deleted_at && t.status !== "nieaktywne").length}</strong> | 
                  Ukryte: <strong>{tickets.filter((t) => t.source === "ocena_strony" && !t.deleted_at && t.status === "nieaktywne").length}</strong>
                </p>
              </div>

              {tickets
                .filter((t) => t.source === "ocena_strony" && !t.deleted_at)
                .map((t) => {
                  const desc = t.description || "";
                  const metaMatch = desc.match(/--- METADATA ---\s*IP:\s*(.*?)\s*Ocena:\s*(.*?)\s*Przeglądarka:\s*(.*?)\s*Data:\s*(.*)/s);
                  const ip = metaMatch ? metaMatch[1] : (t.client_email || "Nieznane IP");
                  const ratingStr = metaMatch ? metaMatch[2] : (t.title || "");
                  const browser = metaMatch ? metaMatch[3] : "Brak danych";
                  const sentTime = metaMatch ? metaMatch[4] : new Date(t.created_at).toLocaleString("pl-PL");
                  const userComment = desc.split("--- METADATA ---")[0].trim();
                  const isHidden = t.status === "nieaktywne";

                  return (
                    <div
                      key={t.id}
                      style={{
                        background: isHidden ? "rgba(239, 68, 68, 0.05)" : "rgba(255, 255, 255, 0.04)",
                        border: isHidden ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "12px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "20px", fontWeight: "bold", color: "#22d3ee" }}>⭐ {ratingStr}</span>
                            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: isHidden ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)", color: isHidden ? "#f87171" : "#4ade80" }}>
                              {isHidden ? "UKRYTA" : "WIDOCZNA NA STRONIE"}
                            </span>
                          </div>
                          <p style={{ margin: "6px 0 0", color: "#a5b4fc", fontSize: "13px" }}>
                            IP: <code>{ip}</code>
                          </p>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={async () => {
                              const newStatus = isHidden ? "oczekuje" : "nieaktywne";
                              const { error } = await supabase.from("tickets").update({ status: newStatus }).eq("id", t.id);
                              if (error) toast.error(error.message);
                              else {
                                toast.success(isHidden ? "Przywrócono ocenę na stronę" : "Ukryto ocenę");
                                fetchTickets();
                              }
                            }}
                          >
                            {isHidden ? "👁️ Pokaż na stronie" : "🙈 Ukryj"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            onClick={async () => {
                              if (!window.confirm("Czy na pewno chcesz usunąć tę ocenę?")) return;
                              const { error } = await supabase.from("tickets").update({ deleted_at: new Date().toISOString() }).eq("id", t.id);
                              if (error) toast.error(error.message);
                              else {
                                toast.success("Usunięto ocenę");
                                fetchTickets();
                              }
                            }}
                          >
                            🗑️ Usuń
                          </button>
                        </div>
                      </div>

                      {userComment && userComment !== "(brak komentarza)" && (
                        <div style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.25)", padding: "12px", borderRadius: "8px" }}>
                          <span style={{ fontSize: "11px", color: "#c084fc", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "4px" }}>Prywatny komentarz od użytkownika:</span>
                          <p style={{ margin: 0, color: "#fff", fontSize: "14px", fontStyle: "italic" }}>„{userComment}”</p>
                        </div>
                      )}

                      <div style={{ background: "rgba(0, 0, 0, 0.25)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", display: "grid", gap: "6px" }}>
                        <div><strong>🕒 Godzina wysłania:</strong> {sentTime}</div>
                        <div><strong>🌐 Przeglądarka:</strong> <span style={{ wordBreak: "break-all" }}>{browser}</span></div>
                      </div>
                    </div>
                  );
                })}

              {tickets.filter((t) => t.source === "ocena_strony" && !t.deleted_at).length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.5)" }}>
                  Brak oddanych ocen strony.
                </div>
              )}
            </div>
          ) : tab === "visit_logs" ? <AdminVisitLogs /> : tab === "chats" ? <AdminLiveChats /> : tab === "reviews" ? <AdminReviews /> : tab === "popular" ? <PopularServicesAdmin /> : tab === "secrets" ? <MySecrets /> : tab === "eggs" ? <AllEasterEggs /> : tab === "account" ? <AccountSettings /> : tab === "reset_visitors" ? <AdminResetVisitors /> : tab === "reset_downloads" ? <AdminResetDownloads /> : tab === "trash" ? (
            <>
              <div className="reveal visible">
                <span className="eyebrow" style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}><span className="dot" style={{ background: "#ef4444", boxShadow: "0 0 14px #ef4444", animation: "redBadgePulse 2s ease-in-out infinite" }}></span> Kosz ({trashed.length})</span>
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
                  {trashed.map((t, i) => {
                    const meta = STATUS_META[t.status as TicketStatus] ?? { color: "var(--text-mute)", label: t.status, icon: "•" };
                    return (
                      <div key={t.id} className="testi reveal visible" data-delay={(i % 3) + 1} style={{ opacity: 0.85 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12, color: meta.color, textTransform: "uppercase", letterSpacing: ".12em" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }}></span>{meta.label}
                          </span>
                          <small className="text-mute">
                            Usunięte {t.deleted_at ? new Date(t.deleted_at).toLocaleDateString("pl-PL") : ""}
                          </small>
                        </div>
                        <h3 style={{ marginTop: 14, fontSize: "1.05rem", color: "var(--text)" }}>{t.title}</h3>
                        <p style={{ marginTop: 6, color: "var(--text-dim)" }}>{t.description}</p>
                        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => setConfirm({ kind: "restore", ticket: t })} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>Przywróć</button>
                          <button type="button" onClick={() => setConfirm({ kind: "hard", ticket: t })} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12, color: "#ff6b6b", borderColor: "#ff6b6b55" }}>Usuń trwale</button>
                        </div>
                        <div className="who" style={{ marginTop: 16 }}>
                          <div className="avatar">{t.service_type[0]}</div>
                          <div className="who-text"><strong>{t.service_type}</strong><small>Klient #{t.user_id.slice(0, 8)} · #{t.id.slice(0, 8)}</small></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (<>

          <div className="hero-stats reveal visible" style={{ marginTop: 0 }}>
            <div className="hero-stat"><div className="num">{stats.oczekuje}</div><div className="label">Oczekuje</div></div>
            <div className="hero-stat"><div className="num">{stats.zaakceptowane}</div><div className="label">Zaakceptowane</div></div>
            <div className="hero-stat"><div className="num">{stats.inRepair}</div><div className="label">W naprawie</div></div>
            <div className="hero-stat"><div className="num">{stats.ready}</div><div className="label">Do odbioru</div></div>
            <div className="hero-stat"><div className="num">{stats.zakończone}</div><div className="label">Zakończone</div></div>
          </div>

          <div className="reveal visible" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "24px 0" }}>
            <button
              type="button"
              className={`btn ${filter === "all" ? "" : "btn-ghost"}`}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: filter === "all" ? 700 : 500,
                background: filter === "all" ? "rgba(34, 211, 238, 0.22)" : undefined,
                color: filter === "all" ? "#22d3ee" : undefined,
                borderColor: filter === "all" ? "rgba(34, 211, 238, 0.6)" : undefined,
                boxShadow: filter === "all" ? "0 0 16px rgba(34, 211, 238, 0.45)" : undefined,
                transition: "all 0.2s ease",
              }}
              onClick={() => setFilter("all")}
            >
              Wszystkie ({active.length})
            </button>
            {STATUSES.map((st) => {
              const count = active.filter((t) => t.status === st).length;
              const meta = STATUS_META[st];
              const isActive = filter === st;
              return (
                <button
                  key={st}
                  type="button"
                  className={`btn ${isActive ? "" : "btn-ghost"}`}
                  style={{
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    background: isActive ? meta.bg : undefined,
                    color: isActive ? meta.color : undefined,
                    borderColor: isActive ? meta.border : undefined,
                    boxShadow: isActive ? meta.glow : undefined,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setFilter(st)}
                >
                  <span style={{ marginRight: 6 }}>{meta?.icon}</span>
                  {meta?.label ?? st} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-dim">Ładowanie zleceń…</p>
          ) : filtered.length === 0 ? (
            <div className="glass reveal visible" style={{ padding: 40, textAlign: "center" }}>
              <p className="text-dim">Brak zleceń w tej kategorii.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {filtered.map((t) => {
                const meta = STATUS_META[t.status as TicketStatus] ?? { color: "var(--brand-2)", label: t.status, icon: "•" };
                const currentNote = editing[t.id]?.note ?? t.admin_note ?? "";
                const isDeletable = (DELETABLE_STATUSES as readonly string[]).includes(t.status);
                const chatOpen = !!openChats[t.id];

                return (
                  <article key={t.id} className="glass reveal visible" style={{ padding: 28, borderRadius: "var(--rad)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                          <span className="badge badge-accent">#{t.id.slice(0, 8)}</span>
                          <span className="badge badge-cyan">{t.service_type}</span>
                          {t.is_priority && (
                            <span className="badge" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                              🔥 Priorytet
                            </span>
                          )}
                          {t.source && <span className="badge badge-ghost">źródło: {t.source}</span>}
                          <ReputationBadge userId={t.user_id} editable={true} />
                          <small className="text-mute">
                            {new Date(t.created_at).toLocaleString("pl-PL")}
                          </small>
                        </div>
                        <h2 style={{ fontSize: "1.3rem", margin: "4px 0 10px", color: "var(--text)" }}>{t.title}</h2>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => togglePriority(t.id, t.is_priority)}
                          title="Przełącz status priorytetu"
                        >
                          {t.is_priority ? "★ Priorytet" : "☆ Oznacz jako priorytet"}
                        </button>
                        <select
                          className="form-control"
                          value={t.status}
                          onChange={(e) => updateStatus(t.id, e.target.value)}
                          style={{
                            minWidth: 180,
                            padding: "8px 12px",
                            fontSize: 13,
                            borderColor: meta.color,
                            color: meta.color,
                            fontWeight: 600,
                          }}
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st} style={{ color: "#fff", background: "#0a0a0f" }}>
                              {STATUS_META[st]?.label ?? st}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          title={isDeletable ? "Przenieś do kosza" : "Tylko zlecenia zakończone, odrzucone lub nieaktywne można przenieść do kosza"}
                          disabled={!isDeletable}
                          onClick={() => setConfirm({ kind: "soft", ticket: t })}
                          style={{ opacity: isDeletable ? 1 : 0.4 }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <TicketProgressBar status={t.status as TicketStatus} />
                    </div>

                    <div style={{ margin: "16px 0", padding: "14px 18px", borderRadius: "calc(var(--rad) - 4px)", background: "rgba(0,0,0,0.3)" }}>
                      <p style={{ color: "var(--text-sec)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{(t.description || "").split("--- METADATA ---")[0].trim()}</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, margin: "14px 0", fontSize: 13 }}>
                      <div>
                        <span className="text-dim">Klient:</span>{" "}
                        <strong style={{ color: "var(--text)" }}>{t.client_name || "Brak danych"}</strong>
                      </div>
                      <div>
                        <span className="text-dim">Telefon:</span>{" "}
                        <a href={`tel:${t.client_phone}`} style={{ color: "var(--brand-2)" }}>{t.client_phone || "Brak"}</a>
                      </div>
                      <div>
                        <span className="text-dim">E-mail:</span>{" "}
                        <a href={`mailto:${t.client_email}`} style={{ color: "var(--brand-2)" }}>{t.client_email || "Brak"}</a>
                      </div>
                      {t.preferred_date && (
                        <div>
                          <span className="text-dim">Preferowany termin:</span>{" "}
                          <strong style={{ color: "var(--text)" }}>{t.preferred_date} ({t.preferred_slot || "dowolna pora"})</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ margin: "16px 0" }}>
                      <TicketAttachments ticketId={t.id} ownerId={t.user_id || session?.user?.id || ""} canUpload={true} />
                    </div>

                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setOpenChats((p) => ({ ...p, [t.id]: !p[t.id] }))}
                      >
                        💬 {chatOpen ? "Ukryj czat" : "Pokaż czat z klientem"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}
                        onClick={() => printTicketProtocol(t)}
                      >
                        📄 Drukuj protokół PDF
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ color: "#a855f7", borderColor: "rgba(168, 85, 247, 0.4)" }}
                        onClick={() => openProtonMail(t)}
                        title="Otwórz ProtonMail z gotową wiadomością do tego klienta"
                      >
                        📧 Wyślij z ProtonMail
                      </button>
                    </div>

                    {chatOpen && (
                      <div style={{ marginTop: 16, padding: 16, borderRadius: "calc(var(--rad) - 4px)", background: "rgba(0,0,0,0.35)", border: "1px solid var(--border)" }}>
                        <TicketChat ticketId={t.id} currentUserId={session?.user?.id || ""} isAdminView={true} />
                      </div>
                    )}

                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <label style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                        Notatka serwisowa (widoczna dla klienta w statusie)
                      </label>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="np. Czekamy na dostawę ekranu z hurtowni, planowany odbiór: piątek"
                          value={currentNote}
                          onChange={(e) => setEditing((p) => ({ ...p, [t.id]: { note: e.target.value, saving: false } }))}
                          style={{ flex: 1, minWidth: 260 }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={editing[t.id]?.saving}
                          onClick={() => saveNote(t.id)}
                          style={{ padding: "8px 18px", fontSize: 13 }}
                        >
                          {editing[t.id]?.saving ? "Zapisywanie…" : "Zapisz notatkę"}
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


function AdminResetVisitors() {
  const [visits, setVisits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchVisits = async () => {
    try {
      const res = await fetch("/api/public/site-ratings?type=analytics");
      const data = await res.json();
      setVisits(data?.visits ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleReset = async () => {
    if (!confirm("Czy na pewno chcesz zresetować licznik wejść do 0?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/public/site-ratings?type=reset_visits");
      const data = await res.json();
      if (data?.ok) {
        setVisits(0);
        toast.success("Licznik odwiedzających został zresetowany do 0!");
      } else {
        toast.error("Nie udało się zresetować licznika.");
      }
    } catch {
      toast.error("Błąd podczas resetowania licznika.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reveal visible" style={{ marginTop: "24px" }}>
      <div className="glass" style={{ padding: "30px", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "28px" }}>👥</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "20px", color: "#fff" }}>Reset Odwiedzających</h3>
            <p className="text-dim" style={{ margin: 0, fontSize: "14px" }}>Zarządzaj licznikiem unikalnych wejść na stronę główną.</p>
          </div>
        </div>

        <div style={{ margin: "24px 0", padding: "20px", background: "rgba(0, 0, 0, 0.25)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>Aktualny stan licznika wejść w bazie danych:</p>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#10b981" }}>
            {visits === null ? "..." : `${visits} osób`}
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="btn"
          style={{
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#fff",
            fontWeight: "600",
            padding: "12px 24px",
            borderRadius: "10px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
          }}
        >
          {loading ? "Resetowanie..." : "🔄 Zresetuj licznik wejść do 0"}
        </button>
      </div>
    </div>
  );
}

function AdminResetDownloads() {
  const [downloads, setDownloads] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const fetchDownloads = async () => {
    try {
      const res = await fetch("/api/public/site-ratings?type=analytics");
      const data = await res.json();
      if (data?.downloads) setDownloads(data.downloads);
    } catch {}
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleReset = async (toolId: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz zresetować licznik pobrań dla: ${name}?`)) return;
    setLoading(toolId);
    try {
      const res = await fetch(`/api/public/site-ratings?type=reset_downloads&toolId=${encodeURIComponent(toolId)}`);
      const data = await res.json();
      if (data?.ok) {
        if (toolId === "all") {
          setDownloads({});
          toast.success("Zresetowano liczniki pobrań wszystkich programów do 0!");
        } else {
          setDownloads((prev) => ({ ...prev, [toolId]: 0 }));
          toast.success(`Zresetowano pobrania dla: ${name}!`);
        }
      } else {
        toast.error("Nie udało się zresetować pobrań.");
      }
    } catch {
      toast.error("Błąd podczas resetowania.");
    } finally {
      setLoading(null);
    }
  };

  const programs = [
    { id: "plan-zadan", name: "Plan Zadań", icon: "📋" },
    { id: "narzedzia-systemowe", name: "Narzędzia Systemowe", icon: "🛠️" },
    { id: "czyszczenie-androida", name: "Czyszczenie Androida", icon: "📱" },
  ];

  return (
    <div className="reveal visible" style={{ marginTop: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "20px", color: "#fff" }}>Reset Pobrań</h3>
        <p className="text-dim" style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
          Wybierz dany program, aby wyzerować jego licznik pobrań.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        {programs.map((prog) => {
          const count = downloads[prog.id] || 0;
          const isBusy = loading === prog.id;
          return (
            <div
              key={prog.id}
              className="glass"
              style={{
                padding: "24px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "18px",
              }}
            >
              <div>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>{prog.icon}</div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "17px", color: "#fff" }}>{prog.name}</h4>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#06b6d4" }}>
                  {count} pobrań
                </div>
              </div>

              <button
                onClick={() => handleReset(prog.id, prog.name)}
                disabled={isBusy}
                className="btn"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  cursor: isBusy ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {isBusy ? "Resetowanie..." : "🗑️ Wyzeruj pobrania"}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "24px", textAlign: "right" }}>
        <button
          onClick={() => handleReset("all", "wszystkie programy")}
          disabled={loading === "all"}
          className="btn"
          style={{
            background: "linear-gradient(135deg, #ef4444, #b91c1c)",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "600",
            cursor: loading === "all" ? "not-allowed" : "pointer",
          }}
        >
          {loading === "all" ? "Resetowanie..." : "⚡ Resetuj wszystkie programy naraz"}
        </button>
      </div>
    </div>
  );
}
