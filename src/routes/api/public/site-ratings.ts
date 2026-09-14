import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/site-ratings")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          if (url.searchParams.get("type") === "analytics") {
            // Licznik unikalnych wizyt
            const { count: visitsCount } = await supabaseAdmin
              .from("tickets")
              .select("id", { count: "exact", head: true })
              .eq("source", "odwiedziny_strony")
              .is("deleted_at", null);

            // Liczniki pobrań programów
            const { data: downloadRows } = await supabaseAdmin
              .from("tickets")
              .select("service_type")
              .eq("source", "pobranie_programu")
              .is("deleted_at", null);

            const downloads: Record<string, number> = {};
            (downloadRows || []).forEach((row: any) => {
              const key = (row.service_type || "").replace("pobranie_", "");
              if (key) {
                downloads[key] = (downloads[key] || 0) + 1;
              }
            });

            return new Response(
              JSON.stringify({ visits: visitsCount || 0, downloads }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

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

      POST: async ({ request }: { request: Request }) => {
        try {
          let body: any = {};
          try {
            body = await request.json();
          } catch {}

          // 1. Rejestracja unikalnej wizyty (1 na IP)
          if (body.type === "visit") {
            const clientIp = String(body.clientIp || "").trim();
            if (clientIp && clientIp !== "Nieznane IP") {
              const { data: existing } = await supabaseAdmin
                .from("tickets")
                .select("id")
                .eq("source", "odwiedziny_strony")
                .eq("client_email", clientIp)
                .limit(1);

              if (!existing || existing.length === 0) {
                await supabaseAdmin.from("tickets").insert({
                  user_id: "10bfa389-afad-426e-887d-c98c2145a466",
                  title: `[Odwiedziny] ${clientIp}`,
                  description: `Unikalna wizyta ze strony głównej. IP: ${clientIp}`,
                  service_type: "odwiedziny",
                  status: "oczekuje",
                  client_name: "Odwiedzający",
                  client_email: clientIp,
                  source: "odwiedziny_strony",
                });
              }
            }

            const { count: visitsCount } = await supabaseAdmin
              .from("tickets")
              .select("id", { count: "exact", head: true })
              .eq("source", "odwiedziny_strony")
              .is("deleted_at", null);

            return new Response(JSON.stringify({ ok: true, visits: visitsCount || 0 }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 2. Rejestracja unikalnego pobrania programu (1 na IP dla danego programu)
          if (body.type === "download") {
            const toolId = String(body.toolId || "").trim();
            const clientIp = String(body.clientIp || "").trim();
            if (toolId && clientIp && clientIp !== "Nieznane IP") {
              const serviceType = `pobranie_${toolId}`;
              const { data: existing } = await supabaseAdmin
                .from("tickets")
                .select("id")
                .eq("source", "pobranie_programu")
                .eq("service_type", serviceType)
                .eq("client_email", clientIp)
                .limit(1);

              if (!existing || existing.length === 0) {
                await supabaseAdmin.from("tickets").insert({
                  user_id: "10bfa389-afad-426e-887d-c98c2145a466",
                  title: `[Pobranie] ${toolId}`,
                  description: `Unikalne pobranie programu ${toolId} z IP: ${clientIp}`,
                  service_type: serviceType,
                  status: "oczekuje",
                  client_name: `Pobranie: ${toolId}`,
                  client_email: clientIp,
                  source: "pobranie_programu",
                });
              }
            }

            const { count: toolDownloads } = await supabaseAdmin
              .from("tickets")
              .select("id", { count: "exact", head: true })
              .eq("source", "pobranie_programu")
              .eq("service_type", `pobranie_${body.toolId}`)
              .is("deleted_at", null);

            return new Response(JSON.stringify({ ok: true, count: toolDownloads || 0 }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 3. Ocena strony
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
