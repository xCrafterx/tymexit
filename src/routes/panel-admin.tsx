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
  const [tab, setTab] = useState<"tickets" | "trash" | "chats" | "reviews" | "popular" | "secrets" | "eggs" | "account">("tickets");
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
        toast.error("Tylko zlecenia: zakończone, odrzucone lub nieaktywne mogą trafić do kosza.");
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
      // Best-effort clean up of related rows; ticket_status_history has ON DELETE CASCADE so it goes automatically.
      const { error } = await supabase.from("tickets").delete().eq("id", ticket.id);
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
                  { key: "tickets", label: "Zgłoszenia", icon: "📋" },
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

          {tab === "chats" ? <AdminLiveChats /> : tab === "reviews" ? <AdminReviews /> : tab === "popular" ? <PopularServicesAdmin /> : tab === "secrets" ? <MySecrets /> : tab === "eggs" ? <AllEasterEggs /> : tab === "account" ? <AccountSettings /> : tab === "trash" ? (
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

          <div className="reveal visible" style={{ marginTop: 60, display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }}>
            <div>
              <span className="eyebrow"><span className="dot"></span> Zgłoszenia</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>Wszystkie <span className="grad">zlecenia.</span></h2>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["all", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={filter === s ? "btn btn-primary" : "btn btn-ghost"}
                  style={{ padding: "8px 14px", fontSize: 12 }}
                >
                  {s === "all" ? "Wszystkie" : STATUS_META[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-dim" style={{ marginTop: 30 }}>Ładowanie…</p>
          ) : filtered.length === 0 ? (
            <div className="glass reveal visible" style={{ marginTop: 30, padding: 30, textAlign: "center" }}>
              <p className="text-dim">Brak zgłoszeń w tym filtrze.</p>
            </div>
          ) : (
            <div className="testi-grid" style={{ marginTop: 30 }}>
              {filtered.map((t, i) => {
                const meta = STATUS_META[t.status as TicketStatus] ?? { color: "var(--text-mute)", label: t.status, icon: "•" };
                const edit = editing[t.id];
                const noteValue = edit ? edit.note : (t.admin_note ?? "");
                const canDelete = (DELETABLE_STATUSES as readonly string[]).includes(t.status);
                const chatOpen = openChats[t.id];
                return (
                  <div key={t.id} className="testi reveal visible" data-delay={(i % 3) + 1} style={t.is_priority ? { borderColor: "#ff6b35", boxShadow: "0 0 0 1px #ff6b3540, 0 12px 40px -12px #ff6b3530" } : undefined}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {t.is_priority && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "linear-gradient(135deg,#ff6b35,#e84393)", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em" }}>
                            🔥 Priorytet
                          </span>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12, color: meta.color, textTransform: "uppercase", letterSpacing: ".12em" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color }}></span>{meta.label}
                        </span>
                      </div>
                      <small className="text-mute">
                        {new Date(t.created_at).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </small>
                    </div>
                    <h3 style={{ marginTop: 14, fontSize: "1.05rem", color: "var(--text)" }}>{t.title}</h3>
                    {t.is_priority && (t.client_name || t.client_phone || t.client_email || t.preferred_date) && (
                      <div style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 13, display: "grid", gap: 4 }}>
                        {t.client_name && <div><strong style={{ color: "var(--text)" }}>Klient:</strong> <span className="text-dim">{t.client_name}</span></div>}
                        {t.client_phone && <div><strong style={{ color: "var(--text)" }}>Tel:</strong> <a href={`tel:${t.client_phone}`} style={{ color: "var(--brand)" }}>{t.client_phone}</a></div>}
                        {t.client_email && <div><strong style={{ color: "var(--text)" }}>E-mail:</strong> <a href={`mailto:${t.client_email}`} style={{ color: "var(--brand)" }}>{t.client_email}</a></div>}
                        {t.preferred_date && <div><strong style={{ color: "var(--text)" }}>Termin:</strong> <span className="text-dim">{t.preferred_date} {t.preferred_slot ? `(${t.preferred_slot})` : ""}</span></div>}
                      </div>
                    )}
                    <p style={{ marginTop: 6, color: "var(--text-dim)", whiteSpace: "pre-wrap" }}>{t.description}</p>

                    <div style={{ marginTop: 12 }}>
                      <ReputationBadge userId={t.user_id} editable />
                    </div>

                    <TicketProgressBar status={t.status} />

                    <TicketAttachments ticketId={t.id} ownerId={t.user_id} canUpload={false} />

                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => setOpenChats((p) => ({ ...p, [t.id]: !p[t.id] }))}
                        className="btn btn-ghost"
                        style={{ padding: "8px 14px", fontSize: 12, width: "100%", justifyContent: "center" }}
                      >
                        {chatOpen ? "Zwiń czat ▲" : "💬 Otwórz czat"}
                      </button>
                      {chatOpen && session && (
                        <TicketChat ticketId={t.id} currentUserId={session.user.id} isAdminView />
                      )}
                    </div>

                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label>Status</label>
                      <select
                        className="form-control"
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Notatka admina</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Notatka widoczna dla klienta..."
                        value={noteValue}
                        onChange={(e) => setEditing((p) => ({ ...p, [t.id]: { note: e.target.value, saving: false } }))}
                      />
                      <button
                        type="button"
                        onClick={() => saveNote(t.id)}
                        disabled={edit?.saving || (!edit && (t.admin_note ?? "") === noteValue)}
                        className="btn btn-primary"
                        style={{ marginTop: 10, padding: "8px 14px", fontSize: 12 }}
                      >
                        {edit?.saving ? "Zapisywanie..." : "Zapisz notatkę"}
                      </button>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: "soft", ticket: t })}
                        disabled={!canDelete}
                        title={canDelete ? "Przenieś do kosza" : "Tylko zlecenia zakończone, odrzucone lub nieaktywne można usunąć"}
                        className="btn btn-ghost"
                        style={{ padding: "8px 14px", fontSize: 12, color: canDelete ? "#ff6b6b" : "var(--text-mute)", borderColor: canDelete ? "#ff6b6b55" : "var(--border)", opacity: canDelete ? 1 : 0.5, cursor: canDelete ? "pointer" : "not-allowed" }}
                      >
                        Usuń zlecenie
                      </button>
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
