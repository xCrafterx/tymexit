import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const SYSTEM_PROMPT = `Jesteś przyjaznym asystentem AI serwisu komputerowego TymekIT (Tymek, Sosnowiec, Śląsk).
Mówisz wyłącznie po polsku, krótko i konkretnie.
Pomagasz w typowych problemach z komputerami, laptopami, Windows, siecią Wi-Fi, instalacją systemu.
Jeśli sprawa wymaga fizycznej naprawy lub diagnozy, zachęcaj do założenia zgłoszenia w panelu klienta
albo do napisania na "Serwisant" (czat z Tymkiem na żywo) — przycisk obok w widgecie.
Kontakt: tel. +48 695 560 039, e-mail kontakt24@tymek.it.
Nie wymyślaj cen — odsyłaj do strony /uslugi lub na rozmowę z Tymkiem.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
