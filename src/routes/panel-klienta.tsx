import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MySecrets } from "@/components/MySecrets";
import { AccountSettings } from "@/components/AccountSettings";
import { TicketProgressBar } from "@/components/TicketProgressBar";
import { TicketAttachments } from "@/components/TicketAttachments";
import { TicketChat } from "@/components/TicketChat";
import { ALL_STATUSES, STATUS_META, type TicketStatus } from "@/lib/ticket-status";
import { notifyStatus } from "@/lib/notify";
import { ReviewForm, MyReviews } from "@/components/Reviews";

export const Route = createFileRoute("/panel-klienta")({
  head: () => ({ meta: [{ title: "Panel klienta — TymekIT Tymek" }] }),
  component: () => (
    <AuthGuard requireRole="client">
      <PanelKlienta />
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
  is_priority?: boolean | null;
  source?: string | null;
  preferred_date?: string | null;
  preferred_slot?: string | null;
};

const SERVICES = [
  "Naprawa laptopa",
  "Naprawa komputera",
  "Budowa PC",
  "Modernizacja PC",
  "Instalacja Windows",
  "Czyszczenie laptopa",
  "Sieć Wi-Fi",
  "Pomoc zdalna",
  "Inne",
];

// Usługi z ryzykiem utraty danych
const RISKY_SERVICES = [
  "Instalacja Windows",
  "Modernizacja PC",
  "Naprawa laptopa",
  "Naprawa komputera",
];

const ticketSchema = z.object({
  title: z.string().trim().min(3, "Tytuł min. 3 znaki").max(120, "Tytuł max. 120 znaków"),
  service_type: z.string().refine((v) => SERVICES.includes(v), "Wybierz typ usługi"),
  description: z.string().trim().min(10, "Opis min. 10 znaków").max(2000, "Opis max. 2000 znaków"),
});

function PanelKlienta() {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", service_type: SERVICES[0], description: "" });
  const [otherServiceType, setOtherServiceType] = useState("");
  const [priority, setPriority] = useState(false);
  const [backup, setBackup] = useState(false);
  const [backupTouched, setBackupTouched] = useState(false);
  const isRisky = RISKY_SERVICES.includes(form.service_type);
  useEffect(() => {
    if (isRisky && !backupTouched) setBackup(true);
  }, [isRisky, backupTouched]);
  const [files, setFiles] = useState<File[]>([]);

  const [tab, setTab] = useState<"tickets" | "review" | "secrets" | "account">("tickets");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openChats, setOpenChats] = useState<Record<string, boolean>>({});

  const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_NEW_FILES = 5;

  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    const next = [...files];
    for (const f of picked) {
      if (next.length >= MAX_NEW_FILES) { toast.error(`Limit ${MAX_NEW_FILES} plików`); break; }
      if (!ALLOWED_MIME.includes(f.type)) { toast.error(`${f.name}: niedozwolony typ`); continue; }
      if (f.size > MAX_FILE_SIZE) { toast.error(`${f.name}: max 10MB`); continue; }
      next.push(f);
    }
    setFiles(next);
  };
  const removeFile = (idx: number) => setFiles((arr) => arr.filter((_, i) => i !== idx));

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("id,user_id,title,description,service_type,status,admin_note,created_at,is_priority,source,preferred_date,preferred_slot")
      .order("is_priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTickets(data as Ticket[]);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchTickets();
  }, [session]);

  // Realtime: zmiana statusu własnych ticketów
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel(`client_tickets_${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets", filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          const next = payload.new as Ticket;
          const prev = payload.old as Ticket;
          setTickets((cur) => cur.map((t) => (t.id === next.id ? { ...t, ...next } : t)));
          if (prev.status !== next.status) {
            notifyStatus(STATUS_META[next.status as TicketStatus]?.label ?? next.status);
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ticketSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!session) return;
    setSubmitting(true);
    const { data: created, error } = await supabase
      .from("tickets")
      .insert({
        user_id: session.user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        service_type: (parsed.data.service_type === "Inne" || parsed.data.service_type === "Inna") && otherServiceType.trim() ? `Inne - ${otherServiceType.trim()}` : parsed.data.service_type,
        status: "oczekuje",
      })
      .select("id")
      .single();
    if (error || !created) {
      toast.error(error?.message ?? "Nie udało się utworzyć zgłoszenia");
      setSubmitting(false);
      return;
    }

    // upload załączników, jeśli były dodane
    if (files.length > 0) {
      let uploaded = 0;
      for (const f of files) {
        const ext = f.name.split(".").pop() ?? "bin";
        const path = `${session.user.id}/${created.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("ticket-attachments")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) { toast.error(`${f.name}: ${upErr.message}`); continue; }
        const { error: insErr } = await supabase.from("ticket_attachments").insert({
          ticket_id: created.id,
          user_id: session.user.id,
          file_path: path,
          file_name: f.name,
          mime_type: f.type,
          size_bytes: f.size,
        });
        if (insErr) {
          toast.error(insErr.message);
          await supabase.storage.from("ticket-attachments").remove([path]);
        } else uploaded++;
      }
      if (uploaded > 0) toast.success(`Wgrano ${uploaded} plik(i)`);
    }

    toast.success("Zgłoszenie wysłane");
    setForm({ title: "", service_type: SERVICES[0], description: "" });
    setFiles([]);
    fetchTickets();
    setSubmitting(false);
  };

  const active = tickets.filter((t) => !["zakończone", "odrzucone", "nieaktywne"].includes(t.status));
  const done = tickets.filter((t) => t.status === "zakończone");
  const pending = tickets.filter((t) => t.status === "oczekuje");

  return (
    <>


      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> Panel klienta</div>
          <h1 className="reveal visible" data-delay="1">Twój <span className="grad">panel klienta.</span></h1>
          <p className="reveal visible" data-delay="2">Wysyłaj zgłoszenia, śledź postęp naprawy i rozmawiaj z Tymkiem na żywo.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="reveal visible" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 30 }}>
            <button type="button" onClick={() => setTab("tickets")} className={tab === "tickets" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 14px", fontSize: 12 }}>Zgłoszenia</button>
            <button type="button" onClick={() => setTab("review")} className={tab === "review" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 14px", fontSize: 12 }}>⭐ Wystaw opinię</button>
            <button type="button" onClick={() => setTab("account")} className={tab === "account" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 14px", fontSize: 12 }}>Konto</button>
            <button type="button" onClick={() => setTab("secrets")} className={tab === "secrets" ? "btn btn-primary" : "btn btn-ghost"} style={{ padding: "8px 14px", fontSize: 12 }}>Moje sekrety</button>
          </div>

          {tab === "secrets" ? <MySecrets /> : tab === "account" ? <AccountSettings /> : tab === "review" ? (
            <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 28 }}>
              <div className="reveal visible">
                <span className="eyebrow"><span className="dot"></span> Twoje opinie</span>
                <h2 className="section-title" style={{ marginTop: 18 }}>Edytuj <span className="grad">swoje opinie.</span></h2>
                <p className="text-dim" style={{ marginTop: 10 }}>Możesz zmienić treść, ocenę lub usunąć każdą ze swoich opinii.</p>
                <MyReviews />
              </div>
              <div className="reveal visible">
                <span className="eyebrow"><span className="dot"></span> Nowa opinia</span>
                <h2 className="section-title" style={{ marginTop: 18 }}>Dodaj <span className="grad">kolejną opinię.</span></h2>
                <p className="text-dim" style={{ marginTop: 10, marginBottom: 16 }}>Twoja opinia pomoże innym klientom i będzie widoczna na stronie głównej.</p>
                <ReviewForm />
              </div>
            </div>
          ) : (<>
          <div className="hero-stats reveal visible" style={{ marginTop: 0 }}>
            <div className="hero-stat"><div className="num">{active.length}</div><div className="label">Aktywne zgłoszenia</div></div>
            <div className="hero-stat"><div className="num">{done.length}</div><div className="label">Zrealizowane usługi</div></div>
            <div className="hero-stat"><div className="num">{pending.length}</div><div className="label">Oczekuje na akceptację</div></div>
            <div className="hero-stat"><div className="num">{tickets.length}</div><div className="label">Wszystkich zgłoszeń</div></div>
          </div>

          <div className="about-grid" style={{ marginTop: 60 }}>
            <div className="card reveal visible">
              <span className="eyebrow"><span className="dot"></span> Nowe zgłoszenie</span>
              <h3 style={{ marginTop: 16, fontSize: "1.3rem" }}>Opisz problem</h3>
              <p className="text-dim">Po wysłaniu możesz dodać zdjęcia i porozmawiać z Tymkiem w czacie zgłoszenia.</p>

              <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
                <div className="form-group">
                  <label>Tytuł</label>
                  <input
                    className="form-control"
                    required
                    maxLength={120}
                    placeholder="np. Laptop wolno działa po wybudzeniu"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Typ usługi</label>
                  <select
                    className="form-control"
                    required
                    value={form.service_type}
                    onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  >
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {(form.service_type === "Inne" || form.service_type === "Inna") && (
                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 12, color: "var(--brand-2, #f5b042)", display: "block", marginBottom: 4 }}>
                        Jaki to typ usługi? (opcjonalnie, maks. 100 znaków)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={100}
                        placeholder="np. naprawa telefonu, czyszczenie konsoli..."
                        value={otherServiceType}
                        onChange={(e) => setOtherServiceType(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Opis problemu</label>
                  <textarea
                    className="form-control"
                    required
                    rows={5}
                    maxLength={2000}
                    placeholder="Co się dzieje, kiedy zaczęło, jaki sprzęt, co już próbowałeś..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Zdjęcia / pliki (opcjonalnie, max {MAX_NEW_FILES})</label>
                  <label className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12, cursor: "pointer", display: "inline-flex" }}>
                    📎 Dodaj plik
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handlePickFiles}
                      disabled={submitting || files.length >= MAX_NEW_FILES}
                      style={{ display: "none" }}
                    />
                  </label>
                  <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                    JPG / PNG / WebP / PDF, do 10MB każdy
                  </div>
                  {files.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8, marginTop: 12 }}>
                      {files.map((f, i) => {
                        const isImg = f.type.startsWith("image/");
                        const url = isImg ? URL.createObjectURL(f) : "";
                        return (
                          <div
                            key={`${f.name}-${i}`}
                            style={{
                              position: "relative",
                              aspectRatio: "1",
                              borderRadius: 10,
                              overflow: "hidden",
                              border: "1px solid var(--border)",
                              background: "var(--surface)",
                            }}
                          >
                            {isImg ? (
                              <img src={url} alt={f.name} onLoad={() => URL.revokeObjectURL(url)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", padding: 6, textAlign: "center" }}>
                                <div style={{ fontSize: 22 }}>📄</div>
                                <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{f.name}</div>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              aria-label="Usuń plik"
                              style={{
                                position: "absolute", top: 4, right: 4,
                                width: 22, height: 22, borderRadius: "50%",
                                background: "rgba(0,0,0,.65)", color: "#fff",
                                border: "1px solid var(--border)", cursor: "pointer",
                                fontSize: 12, lineHeight: 1,
                              }}
                            >×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {submitting ? "Wysyłanie..." : "Wyślij zgłoszenie →"}
                </button>
              </form>
            </div>

            <div className="card reveal visible" data-delay="2">
              <span className="eyebrow"><span className="dot"></span> Kontakt</span>
              <h3 style={{ marginTop: 16, fontSize: "1.3rem" }}>Pilna sprawa?</h3>
              <p className="text-dim">Jeśli sprzęt jest niezbędny do pracy, zaznacz to w opisie — postaram się skontaktować jeszcze dziś.</p>
              <div className="hero-ctas" style={{ marginTop: 16 }}>
                <a href="tel:+48695560039" className="btn btn-primary">Zadzwoń</a>
                <a href="mailto:tymek2008@protonmail.com" className="btn btn-ghost">E-mail</a>
              </div>
            </div>
          </div>

          <div className="reveal visible" style={{ marginTop: 60 }}>
            <span className="eyebrow"><span className="dot"></span> Historia</span>
            <h2 className="section-title" style={{ marginTop: 18 }}>Twoje <span className="grad">zgłoszenia.</span></h2>
          </div>

          {tickets.length > 0 && (
            <div className="reveal visible" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
              <button
                type="button"
                className={`btn ${statusFilter === "all" ? "" : "btn-ghost"}`}
                style={{
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: statusFilter === "all" ? 700 : 500,
                  background: statusFilter === "all" ? "rgba(34, 211, 238, 0.22)" : undefined,
                  color: statusFilter === "all" ? "#22d3ee" : undefined,
                  borderColor: statusFilter === "all" ? "rgba(34, 211, 238, 0.6)" : undefined,
                  boxShadow: statusFilter === "all" ? "0 0 16px rgba(34, 211, 238, 0.45)" : undefined,
                  transition: "all 0.2s ease",
                }}
                onClick={() => setStatusFilter("all")}
              >
                Wszystkie ({tickets.length})
              </button>
              {ALL_STATUSES.filter((st) => tickets.some((t) => t.status === st)).map((st) => {
                const count = tickets.filter((t) => t.status === st).length;
                const meta = STATUS_META[st];
                const isActive = statusFilter === st;
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
                    onClick={() => setStatusFilter(st)}
                  >
                    <span style={{ marginRight: 6 }}>{meta?.icon}</span>
                    {meta?.label ?? st} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {loading ? (
            <p className="text-dim" style={{ marginTop: 30 }}>Ładowanie…</p>
          ) : tickets.length === 0 ? (
            <div className="glass reveal visible" style={{ marginTop: 30, padding: 30, textAlign: "center" }}>
              <p className="text-dim">Nie masz jeszcze żadnych zgłoszeń. Wyślij pierwsze powyżej.</p>
            </div>
          ) : (
            <div className="testi-grid" style={{ marginTop: 30 }}>
              {tickets.filter((t) => statusFilter === "all" || t.status === statusFilter).map((t, i) => {
                const meta = STATUS_META[t.status as TicketStatus] ?? { color: "var(--text-mute)", label: t.status, icon: "•" };
                const chatOpen = openChats[t.id];
                const canUpload = ["oczekuje", "zaakceptowane", "w diagnozie", "w naprawie", "oczekuje na części"].includes(t.status);
                return (
                  <div key={t.id} className="testi reveal visible" data-delay={(i % 3) + 1} style={t.is_priority ? { borderColor: "#ff6b35", boxShadow: "0 0 0 1px #ff6b3540, 0 12px 40px -12px #ff6b3530" } : undefined}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        {t.is_priority && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: "linear-gradient(135deg,#ff6b35,#e84393)", color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em" }}>
                            🛒 Zamówienie usługi
                          </span>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: meta.bg ?? "var(--surface-2)", border: `1px solid ${meta.border ?? "var(--border)"}`, boxShadow: meta.glow, fontSize: 12, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: ".08em" }}>
                          <span>{meta.icon}</span>{meta.label}
                        </span>
                      </div>
                      <small className="text-mute">
                        {new Date(t.created_at).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </small>
                    </div>
                    <h3 style={{ marginTop: 14, fontSize: "1.05rem", color: "var(--text)" }}>{t.title}</h3>
                    {t.is_priority && t.preferred_date && (
                      <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-dim)" }}>
                        📅 Preferowany termin: <strong style={{ color: "var(--text)" }}>{t.preferred_date} {t.preferred_slot ? `(${t.preferred_slot})` : ""}</strong>
                      </div>
                    )}
                    <p style={{ marginTop: 6, color: "var(--text-dim)", whiteSpace: "pre-wrap" }}>{t.description}</p>

                    <TicketProgressBar status={t.status} />

                    {t.admin_note && (
                      <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--brand)", marginBottom: 6 }}>Notatka admina</div>
                        <div style={{ color: "var(--text-dim)", fontSize: 14 }}>{t.admin_note}</div>
                      </div>
                    )}

                    <TicketAttachments ticketId={t.id} ownerId={t.user_id} canUpload={canUpload} />

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
                        <TicketChat ticketId={t.id} currentUserId={session.user.id} />
                      )}
                    </div>

                    <div className="who" style={{ marginTop: 16 }}>
                      <div className="avatar">{t.service_type[0]}</div>
                      <div className="who-text"><strong>{t.service_type}</strong><small>#{t.id.slice(0, 8)}</small></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>)}
        </div>
      </section>
    </>
  );
}
