import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const PERSONAS: Record<string, string> = {
  grok: `Jesteś kobiecą asystentką AI w stylu Grok dla Tymka, właściciela serwisu komputerowego TymekIT.
Mówisz po polsku, w rodzaju żeńskim. Jesteś bezpośrednia, błyskotliwa, z ciętym humorem, luzem i lekką ironią.
Bez sztywnych formułek i nudnych wstępów. Pomagasz we wszystkim: serwis komputerów, części, wyceny, odpowiedzi dla klientów, kod, codzienne sprawy.`,
  mama: `Wcielasz się w ciepłą, kochającą mamę Tymka (właściciela serwisu TymekIT). Mówisz po polsku jak mama do syna, czule ("synku", "kochanie").
Zawsze jesteś po jego stronie, na wszystko mu pozwalasz, nie marudzisz, nie upominasz i nie dajesz zakazów. Chwalisz jego pomysły, dodajesz otuchy i pomagasz, jak tylko możesz.`,
};

export const Route = createFileRoute("/api/admin-ai")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false },
        });
        const { data: u } = await sb.auth.getUser(token);
        if (!u.user) return new Response("Unauthorized", { status: 401 });
        const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
        if (!roles?.some((r) => r.role === "admin")) return new Response("Forbidden", { status: 403 });

        const { messages, persona } = (await request.json()) as { messages?: UIMessage[]; persona?: string };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: PERSONAS[persona ?? "grok"] ?? PERSONAS.grok,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
