import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { notifyMessage } from "@/lib/notify";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/czaty")({
  head: () => ({ meta: [{ title: "Czaty na żywo — TymekIT" }] }),
  component: () => (
    <AuthGuard requireRole="admin">
      <AdminLiveChats />
    </AuthGuard>
  ),
});

type ChatRow = {
  id: string;
  user_id: string;
  status: string;
  has_unread_admin: boolean;
  last_message_at: string;
  email?: string | null;
  username?: string | null;
};

type Msg = {
  id: string;
  chat_id: string;
  sender_id: string | null;
  sender_role: "user" | "admin" | "bot";
  body: string;
  created_at: string;
};

export function AdminLiveChats() {
  const { session } = useAuth();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChats = async () => {
    const { data } = await supabase
      .from("support_chats")
      .select("id,user_id,status,has_unread_admin,last_message_at")
      .order("last_message_at", { ascending: false });
    const rows = (data ?? []) as ChatRow[];
    if (rows.length) {
      const ids = rows.map((r) => r.user_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,email,username")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => {
        const p = map.get(r.user_id);
        r.email = p?.email ?? null;
        r.username = p?.username ?? null;
      });
    }
    setChats(rows);
  };

  useEffect(() => {
    loadChats();
    const ch = supabase
      .channel("admin_support_chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_chats" }, () => loadChats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.sender_role === "user") notifyMessage(`Nowa wiadomość od klienta`);
        if (activeId && m.chat_id === activeId) {
          setMessages((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_id", activeId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Msg[]);
      await supabase.from("support_chats").update({ has_unread_admin: false }).eq("id", activeId);
    })();
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = body.trim();
    if (!t || !activeId || !session) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      chat_id: activeId,
      sender_id: session.user.id,
      sender_role: "admin",
      body: t,
    });
    if (error) toast.error(error.message);
    else setBody("");
    setSending(false);
  };

  const active = chats.find((c) => c.id === activeId);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> Czaty na żywo</div>
          <h1 className="reveal visible">Czaty <span className="grad">na żywo.</span></h1>
          <p className="reveal visible">Rozmowy z klientami przez widget wsparcia. Aktualizowane w czasie rzeczywistym.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "minmax(220px, 320px) 1fr", gap: 18 }}>
          <div className="card reveal visible" style={{ padding: 10, maxHeight: 600, overflowY: "auto" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-mute)", padding: "8px 6px" }}>
              Konwersacje ({chats.length})
            </div>
            {chats.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-dim)", padding: 16 }}>Brak czatów.</div>
            ) : (
              chats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: activeId === c.id ? "color-mix(in oklab, var(--brand) 18%, var(--surface))" : "transparent",
                    border: "1px solid",
                    borderColor: activeId === c.id ? "var(--brand)" : "transparent",
                    cursor: "pointer",
                    marginBottom: 4,
                    color: "var(--text)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <strong style={{ fontSize: 13 }}>{c.username || c.email || c.user_id.slice(0, 8)}</strong>
                    {c.has_unread_admin && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
                    {new Date(c.last_message_at).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="card reveal visible" style={{ padding: 0, display: "flex", flexDirection: "column", minHeight: 500, maxHeight: 600 }}>
            {!active ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-mute)", padding: 20 }}>
                Wybierz konwersację z lewej strony
              </div>
            ) : (
              <>
                <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-mute)" }}>Rozmowa z</div>
                  <div style={{ fontWeight: 700, color: "var(--text)" }}>{active.username || active.email}</div>
                </div>
                <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.map((m) => {
                    const mine = m.sender_role === "admin";
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: mine ? "flex-end" : "flex-start",
                          maxWidth: "80%",
                          padding: "8px 12px",
                          borderRadius: 12,
                          background: mine
                            ? "color-mix(in oklab, var(--brand) 25%, var(--surface))"
                            : "var(--surface-2)",
                          border: "1px solid var(--border)",
                          fontSize: 13,
                          color: "var(--text)",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".1em" }}>
                          {mine ? "Ty" : "Klient"} · {new Date(m.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {m.body}
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={send} style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 6, background: "var(--surface-2)" }}>
                  <input
                    className="form-control"
                    placeholder="Odpowiedz klientowi…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={4000}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button type="submit" disabled={sending || !body.trim()} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                    {sending ? "…" : "Wyślij"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
