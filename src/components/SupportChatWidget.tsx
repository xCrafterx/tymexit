import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { notifyMessage } from "@/lib/notify";

type Mode = "menu" | "bot" | "live";

type SupportMsg = {
  id: string;
  chat_id: string;
  sender_id: string | null;
  sender_role: "user" | "admin" | "bot";
  body: string;
  created_at: string;
};

export function SupportChatWidget() {
  const { session, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [unread, setUnread] = useState(false);

  // Ukryj widget dla admina (admin obsługuje czaty w panelu)
  if (role === "admin") return null;

  return (
    <>
      <button
        type="button"
        aria-label="Otwórz czat wsparcia"
        onClick={() => {
          setOpen((v) => !v);
          setUnread(false);
        }}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 9998,
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
          color: "#fff",
          fontSize: 24,
          cursor: "pointer",
          boxShadow: "0 12px 40px -10px color-mix(in oklab, var(--brand) 60%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? "✕" : "💬"}
        {!open && unread && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid var(--bg)",
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 88,
            zIndex: 9998,
            width: "min(380px, calc(100vw - 36px))",
            maxHeight: "min(580px, calc(100vh - 120px))",
            display: "flex",
            flexDirection: "column",
            borderRadius: 18,
            overflow: "hidden",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,.6)",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              background: "linear-gradient(135deg, color-mix(in oklab, var(--brand) 22%, var(--surface)), var(--surface))",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-mute)" }}>
                TymekIT · Wsparcie
              </div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>
                {mode === "bot" ? "Asystent AI" : mode === "live" ? "Serwisant na żywo" : "W czym mogę pomóc?"}
              </div>
            </div>
            {mode !== "menu" && (
              <button
                type="button"
                onClick={() => setMode("menu")}
                className="btn btn-ghost"
                style={{ padding: "4px 10px", fontSize: 11 }}
              >
                ← Menu
              </button>
            )}
          </div>

          {mode === "menu" && <ModeMenu onPick={setMode} isLogged={!!session} />}
          {mode === "bot" && <BotChat />}
          {mode === "live" && session && <LiveChat userId={session.user.id} onIncoming={() => !open && setUnread(true)} />}
        </div>
      )}
    </>
  );
}

function ModeMenu({ onPick, isLogged }: { onPick: (m: Mode) => void; isLogged: boolean }) {
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        type="button"
        onClick={() => onPick("bot")}
        className="card"
        style={{ textAlign: "left", cursor: "pointer", padding: 14, border: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 26 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, color: "var(--text)" }}>Asystent AI</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Szybkie odpowiedzi 24/7</div>
          </div>
        </div>
      </button>

      {isLogged ? (
        <button
          type="button"
          onClick={() => onPick("live")}
          className="card"
          style={{ textAlign: "left", cursor: "pointer", padding: 14, border: "1px solid var(--border)" }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 26 }}>👨‍🔧</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>Serwisant na żywo</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Pisz bezpośrednio z Tymkiem</div>
            </div>
          </div>
        </button>
      ) : (
        <div className="card" style={{ padding: 14, border: "1px dashed var(--border)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 26, opacity: 0.6 }}>👨‍🔧</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text)" }}>Serwisant na żywo</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Wymaga zalogowania</div>
            </div>
          </div>
          <Link to="/login" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "8px 12px" }}>
            Zaloguj się
          </Link>
        </div>
      )}
    </div>
  );
}

function BotChat() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "Błąd asystenta"),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, status]);

  const busy = status === "submitted" || status === "streaming";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 260 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-dim)", padding: "10px 6px" }}>
            Cześć! Jestem asystentem AI TymekIT. Zapytaj o cokolwiek związane z komputerem 👋
          </div>
        )}
        {messages.map((m) => {
          const mine = m.role === "user";
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "85%",
                padding: "8px 12px",
                borderRadius: 12,
                background: mine ? "color-mix(in oklab, var(--brand) 25%, var(--surface))" : "var(--surface-2)",
                border: "1px solid var(--border)",
                fontSize: 13,
                color: "var(--text)",
                whiteSpace: "pre-wrap",
              }}
            >
              {text || (busy && !mine ? "..." : "")}
            </div>
          );
        })}
        {status === "submitted" && (
          <div style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--text-mute)", padding: "4px 8px" }}>Asystent pisze…</div>
        )}
      </div>
      <form onSubmit={onSubmit} style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 6, background: "var(--surface-2)" }}>
        <input
          className="form-control"
          placeholder="Napisz do asystenta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          maxLength={2000}
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
          {busy ? "…" : "Wyślij"}
        </button>
      </form>
    </>
  );
}

function LiveChat({ userId, onIncoming }: { userId: string; onIncoming: () => void }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ensure chat exists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: existing } = await supabase
        .from("support_chats")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      let id = existing?.id as string | undefined;
      if (!id) {
        const { data: created, error } = await supabase
          .from("support_chats")
          .insert({ user_id: userId })
          .select("id")
          .single();
        if (error) {
          toast.error(error.message);
          setLoading(false);
          return;
        }
        id = created.id as string;
      }
      if (cancelled) return;
      setChatId(id);
      // mark read
      await supabase.from("support_chats").update({ has_unread_user: false }).eq("id", id);
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_id", id)
        .order("created_at", { ascending: true });
      if (!cancelled) setMessages((msgs ?? []) as SupportMsg[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // realtime
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`support_messages_${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const m = payload.new as SupportMsg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== userId) {
            notifyMessage(`Serwisant: ${m.body.slice(0, 60)}`);
            onIncoming();
            supabase.from("support_chats").update({ has_unread_user: false }).eq("id", chatId);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, userId, onIncoming]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || !chatId || sending) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      chat_id: chatId,
      sender_id: userId,
      sender_role: "user",
      body: t,
    });
    if (error) toast.error(error.message);
    else setInput("");
    setSending(false);
  };

  return (
    <>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, minHeight: 260 }}>
        {loading ? (
          <div style={{ fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: 20 }}>Łączenie…</div>
        ) : messages.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--text-dim)", padding: "10px 6px" }}>
            Napisz pierwszą wiadomość — odpiszę najszybciej jak się da. — Tymek
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === "user";
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: mine
                    ? "color-mix(in oklab, var(--brand) 25%, var(--surface))"
                    : "color-mix(in oklab, var(--brand-2) 18%, var(--surface))",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", opacity: 0.7, marginBottom: 3 }}>
                  {mine ? "Ty" : "Tymek"} · {new Date(m.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {m.body}
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onSubmit} style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 6, background: "var(--surface-2)" }}>
        <input
          className="form-control"
          placeholder="Napisz do serwisanta…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || !chatId}
          maxLength={4000}
          style={{ flex: 1 }}
          autoFocus
        />
        <button type="submit" disabled={sending || !input.trim() || !chatId} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
          {sending ? "…" : "Wyślij"}
        </button>
      </form>
    </>
  );
}
