import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/site-ratings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { data, error } = await supabaseAdmin
            .from("tickets")
            .select("title, description, status")
            .eq("source", "ocena_strony")
            .is("deleted_at", null)
            .neq("status", "nieaktywne");

          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const counts: Record<number, number> = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0,
          };
          let total = 0;
          let sum = 0;

          (data || []).forEach((t: any) => {
            const m = (t.title || "").match(/(\d+)/);
            if (m) {
              const r = parseInt(m[1], 10);
              if (r >= 1 && r <= 10) {
                counts[r] = (counts[r] || 0) + 1;
                total += 1;
                sum += r;
              }
            }
          });

          const average = total > 0 ? sum / total : 0;

          return new Response(
            JSON.stringify({ counts, total, average }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },

      POST: async ({ request }) => {
        try {
          let body: any = {};
          try {
            body = await request.json();
          } catch {}

          const rating = Number(body.rating);
          if (!rating || rating < 1 || rating > 10) {
            return new Response(
              JSON.stringify({ ok: false, message: "Niepoprawna ocena (wymagane 1-10)" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const clientIp = String(body.clientIp || "Nieznane IP").trim();
          const comment = String(body.comment || "").slice(0, 1000).trim();
          const browser = String(body.browser || "").slice(0, 300);

          // Sprawdzamy czy z tego IP już oddano ocenę
          if (clientIp && clientIp !== "Nieznane IP") {
            const { data: existing } = await supabaseAdmin
              .from("tickets")
              .select("id")
              .eq("source", "ocena_strony")
              .ilike("description", `%IP: ${clientIp}%`)
              .is("deleted_at", null)
              .limit(1);

            if (existing && existing.length > 0) {
              return new Response(
                JSON.stringify({ ok: false, message: "Z tego adresu IP oddano już ocenę." }),
                { status: 409, headers: { "Content-Type": "application/json" } }
              );
            }
          }

          const sentTime = new Date().toLocaleString("pl-PL");
          const techMetadata = `\n\n--- METADATA ---\nIP: ${clientIp}\nOcena: ${rating}/10\nPrzeglądarka: ${browser}\nData: ${sentTime}`;
          const fullDesc = (comment || "(brak komentarza)") + techMetadata;

          // Wstawiamy jako ticket z source = 'ocena_strony'
          const { error: insertErr } = await supabaseAdmin.from("tickets").insert({
            user_id: "10bfa389-afad-426e-887d-c98c2145a466",
            title: `[Ocena strony] ${rating}/10`,
            description: fullDesc,
            service_type: "ocena_strony",
            status: "oczekuje",
            client_name: `Ocena: ${rating}/10`,
            client_email: clientIp,
            source: "ocena_strony",
          });

          if (insertErr) {
            return new Response(JSON.stringify({ ok: false, message: insertErr.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ ok: true, message: "Dziękujemy za ocenę!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, message: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
