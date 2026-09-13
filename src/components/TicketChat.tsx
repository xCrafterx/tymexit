import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyMessage } from "@/lib/notify";

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: "client" | "admin";
  body: string;
  created_at: string;
};

export function TicketChat({
  ticketId,
  currentUserId,
  isAdminView = false,
}: {
  ticketId: string;
  currentUserId: string;
  isAdminView?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setMessages((data ?? []) as Message[]);
      });

    const channel = supabase
      .channel(`ticket_messages_${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== currentUserId) {
            notifyMessage(`Nowa wiadomość: ${m.body.slice(0, 60)}`);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ticketId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    if (text.length > 4000) {
      toast.error("Max 4000 znaków");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: currentUserId,
      sender_role: isAdminView ? "admin" : "client",
      body: text,
    });
    if (error) toast.error(error.message);
    else setBody("");
    setSending(false);
  };

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-mute)", marginBottom: 10 }}>
        Czat ze zgłoszenia
      </div>
      <div
        ref={scrollRef}
        style={{
          maxHeight: 280,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 4,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: 16 }}>
            Brak wiadomości. Napisz pierwszą.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const isAdmin = m.sender_role === "admin";
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
                    : isAdmin
                      ? "color-mix(in oklab, var(--brand-2) 18%, var(--surface))"
                      : "var(--surface)",
                  border: "1px solid var(--border)",
                  fontSize: 13,
                  color: "var(--text)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", opacity: 0.7, marginBottom: 3 }}>
                  {isAdmin ? "Admin" : "Klient"} · {new Date(m.created_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {m.body}
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} style={{ marginTop: 10, display: "flex", gap: 6 }}>
        <input
          className="form-control"
          placeholder="Napisz wiadomość..."
          maxLength={4000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
          {sending ? "..." : "Wyślij"}
        </button>
      </form>
    </div>
  );
}
