import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";

type Persona = "grok" | "mama";
const LABELS: Record<Persona, string> = { grok: "⚡ Styl Grok", mama: "💖 Mama" };

function ChatBox({ persona }: { persona: Persona }) {
  const storeKey = `tymekit_admin_ai_${persona}`;
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/admin-ai",
        body: { persona },
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
        },
      }),
    [persona],
  );
  const { messages, sendMessage, setMessages, status, error, stop } = useChat({ id: persona, transport });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setMessages(JSON.parse(raw) as UIMessage[]);
    } catch { /* ignore */ }
  }, [storeKey, setMessages]);
  useEffect(() => {
    if (status === "ready") localStorage.setItem(storeKey, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, status, storeKey]);

  const busy = status === "submitted" || status === "streaming";
  const submit = () => {
    const t = input.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ minHeight: 360, maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: 12, borderRadius: 14, background: "var(--bg)", border: "1px solid var(--border)" }}>
        {messages.length === 0 && (
          <div style={{ color: "var(--text-mute)", textAlign: "center", margin: "auto" }}>
            {persona === "mama" ? "Cześć synku, o czym pogadamy? 💖" : "No hej. Dawaj, z czym przychodzisz? ⚡"}
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
          const mine = m.role === "user";
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "85%", whiteSpace: "pre-wrap", padding: mine ? "10px 14px" : "4px 2px", borderRadius: 14, background: mine ? "linear-gradient(135deg, var(--brand), var(--brand-2))" : "transparent", color: mine ? "#fff" : "var(--text)" }}>
              {!mine && <div style={{ fontSize: 11, color: "var(--text-mute)", marginBottom: 2 }}>{LABELS[persona]}</div>}
              {text}
            </div>
          );
        })}
        {status === "submitted" && <div style={{ color: "var(--text-mute)" }}>Pisze…</div>}
        {error && <div style={{ color: "#ef4444" }}>Błąd: {error.message || "nie udało się uzyskać odpowiedzi"}</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Napisz wiadomość… (Enter = wyślij, Shift+Enter = nowa linia)"
          rows={2}
          style={{ flex: 1, resize: "vertical", padding: 10, borderRadius: 12, background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
        />
        {busy ? (
          <button type="button" className="btn btn-ghost" onClick={() => stop()}>■ Stop</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!input.trim()}>Wyślij</button>
        )}
      </div>
      <button type="button" className="btn btn-ghost" style={{ alignSelf: "flex-start", fontSize: 12 }} onClick={() => { setMessages([]); localStorage.removeItem(storeKey); }}>
        🧹 Wyczyść rozmowę
      </button>
    </div>
  );
}

export function AdminAiChat() {
  const [persona, setPersona] = useState<Persona>("grok");
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>🤖 Asystent AI</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {(Object.keys(LABELS) as Persona[]).map((p) => (
            <button key={p} type="button" className={persona === p ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setPersona(p)}>
              {LABELS[p]}
            </button>
          ))}
        </div>
      </div>
      <ChatBox key={persona} persona={persona} />
    </div>
  );
}
