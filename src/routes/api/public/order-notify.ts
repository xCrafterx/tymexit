import { createFileRoute } from "@tanstack/react-router";

const NOTIFY_EMAIL = "tymek2008@protonmail.com";
const NOTIFY_PHONE = "+48695560039";

// Publiczny endpoint do powiadomień o nowym zamówieniu usługi.
// Wysyła e-mail przez Twilio jeśli skonfigurowane są klucze (Twilio SMS + Resend/Brevo email).
// Brak konfiguracji = no-op (logujemy i zwracamy ok, nie blokujemy UX).
export const Route = createFileRoute("/api/public/order-notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try { body = await request.json(); } catch { /* ignore */ }

        const safe = {
          title: String(body.title ?? "Nowe zamówienie usługi"),
          client_name: String(body.client_name ?? "").slice(0, 200),
          client_email: String(body.client_email ?? "").slice(0, 255),
          client_phone: String(body.client_phone ?? "").slice(0, 50),
          service_type: String(body.service_type ?? "").slice(0, 200),
          preferred_date: String(body.preferred_date ?? "").slice(0, 50),
          preferred_slot: String(body.preferred_slot ?? "").slice(0, 50),
          goal: String(body.goal ?? "").slice(0, 500),
        };

        const message =
          `🔔 Nowe zamówienie usługi TymekIT\n\n` +
          `Usługa: ${safe.service_type}\n` +
          `Klient: ${safe.client_name}\n` +
          `E-mail: ${safe.client_email}\n` +
          `Telefon: ${safe.client_phone}\n` +
          `Termin: ${safe.preferred_date}, ${safe.preferred_slot}\n` +
          `Cel: ${safe.goal}`;

        const results: { email?: string; sms?: string } = {};

        // SMS przez Twilio (gdy podłączony konektor)
        try {
          const LOVABLE = process.env.LOVABLE_API_KEY;
          const TW = process.env.TWILIO_API_KEY;
          const TW_FROM = process.env.TWILIO_FROM_NUMBER;
          if (LOVABLE && TW && TW_FROM) {
            const r = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE}`,
                "X-Connection-Api-Key": TW,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ To: NOTIFY_PHONE, From: TW_FROM, Body: message.slice(0, 1500) }),
            });
            results.sms = r.ok ? "sent" : `error_${r.status}`;
          } else {
            results.sms = "twilio_not_configured";
          }
        } catch (e) {
          results.sms = `error_${(e as Error).message}`;
        }

        // E-mail przez Resend (gdy podłączony konektor)
        try {
          const LOVABLE = process.env.LOVABLE_API_KEY;
          const RESEND = process.env.RESEND_API_KEY;
          const FROM = process.env.RESEND_FROM_EMAIL ?? "TymekIT <noreply@resend.dev>";
          if (LOVABLE && RESEND) {
            const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE}`,
                "X-Connection-Api-Key": RESEND,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: FROM,
                to: [NOTIFY_EMAIL],
                subject: `🔔 ${safe.title}`,
                text: message,
                html: `<pre style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6">${message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</pre>`,
              }),
            });
            results.email = r.ok ? "sent" : `error_${r.status}`;
          } else {
            results.email = "email_not_configured";
          }
        } catch (e) {
          results.email = `error_${(e as Error).message}`;
        }

        return new Response(JSON.stringify({ ok: true, results }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
