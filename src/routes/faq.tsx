import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Najczęstsze Pytania (FAQ) — TymekIT" },
      { name: "description", content: "Odpowiedzi na najczęściej zadawane pytania dotyczące serwisu komputerów, bezpieczeństwa danych i czasu naprawy w TymekIT." },
      { property: "og:title", content: "Często Zadawane Pytania — TymekIT" },
    ],
  }),
  component: FaqPage,
});

interface FaqItem {
  q: string;
  a: string;
  category: "bezpieczenstwo" | "terminy" | "sprzet" | "koszty";
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "bezpieczenstwo",
    q: "Czy moje prywatne dane (zdjęcia, hasła, dokumenty) są bezpieczne?",
    a: "Tak, w 100%. Szanuję prywatność każdego klienta – Twoje dyski nie są przeszukiwane ani kopiowane bez wyraźnej zgody. Przed każdą poważniejszą naprawą lub instalacją nowego systemu oferuję wykonanie pełnej kopii zapasowej (backupu) wybranych folderów.",
  },
  {
    category: "sprzet",
    q: "Co muszę dostarczyć ze sprzętem do naprawy?",
    a: "W przypadku laptopa: prosimy o dostarczenie samego laptopa oraz jego oryginalnego zasilacza. W przypadku komputera stacjonarnego (PC): wystarczy sama skrzynka (jednostka centralna) – kable zasilające, monitor, myszka i klawiatura nie są potrzebne, chyba że problem dotyczy konkretnego akcesorium.",
  },
  {
    category: "terminy",
    q: "Ile zazwyczaj trwa diagnoza i naprawa?",
    a: "Wstępna diagnoza i kontakt z informacją o usterce następuje zazwyczaj w ciągu 24–48 godzin. Proste naprawy, czyszczenie z kurzu, wymiana pasty czy instalacja czystego Windowsa często wykonywane są jeszcze tego samego lub kolejnego dnia roboczego.",
  },
  {
    category: "koszty",
    q: "Czy zapłacę, jeśli naprawa okaże się nieopłacalna?",
    a: "Nie naciągam na koszty. Po wstępnej diagnozie kontaktuję się z Tobą z informacją, co jest uszkodzone i ile wyniesie naprawa. Jeśli koszt części przekracza wartość sprzętu i zdecydujesz się nie kontynuować, płacisz jedynie symboliczny koszt poświęconego czasu na diagnostykę (20–30 zł).",
  },
  {
    category: "sprzet",
    q: "Czy pomagasz również zdalnie przez internet?",
    a: "Tak! Do problemów programowych (usunięcie wirusów, przyspieszenie Windowsa, instalacja oprogramowania, konfiguracja poczty czy drukarki) oferuję bezpieczną pomoc zdalną przez program AnyDesk lub TeamViewer. Nie musisz nawet wychodzić z domu.",
  },
  {
    category: "terminy",
    q: "Jak mogę sprawdzić, na jakim etapie jest moja naprawa?",
    a: "Podczas składania zamówienia tworzone jest dla Ciebie konto w Panelu Klienta. Wystarczy się zalogować, aby w czasie rzeczywistym widzieć pasek postępu (np. 'W diagnozie', 'W naprawie', 'Gotowe do odbioru') oraz czytać notatki serwisowe.",
  },
];

function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filtered = activeCategory === "all" 
    ? FAQ_ITEMS 
    : FAQ_ITEMS.filter((i) => i.category === activeCategory);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 18px 80px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.35)", color: "#22c55e", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          💡 Baza Wiedzy & Pomoc
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Często Zadawane Pytania
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 16, maxWidth: 580, margin: "0 auto" }}>
          Wszystko, co warto wiedzieć przed oddaniem komputera do serwisu. Proste zasady, bez ukrytych gwiazdek.
        </p>
      </div>

      {/* Filtry kategorii */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        {[
          { id: "all", label: "Wszystkie pytania" },
          { id: "bezpieczenstwo", label: "🔒 Bezpieczeństwo danych" },
          { id: "sprzet", label: "💻 Sprzęt & Dostarczenie" },
          { id: "terminy", label: "⏱️ Czas naprawy" },
          { id: "koszty", label: "💰 Koszty i wycena" },
        ].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setActiveCategory(c.id);
              setOpenIdx(null);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              border: activeCategory === c.id ? "1px solid var(--brand)" : "1px solid rgba(255, 255, 255, 0.08)",
              background: activeCategory === c.id ? "rgba(56, 189, 248, 0.15)" : "rgba(0, 0, 0, 0.2)",
              color: activeCategory === c.id ? "#38bdf8" : "var(--text-sec)",
              transition: "all 0.15s ease",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Lista pytań (Akordeon) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 44 }}>
        {filtered.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              style={{
                borderRadius: 14,
                border: isOpen ? "1px solid rgba(56, 189, 248, 0.4)" : "1px solid var(--border)",
                background: isOpen ? "rgba(56, 189, 248, 0.05)" : "rgba(255, 255, 255, 0.02)",
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "18px 20px",
                  background: "transparent",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  cursor: "pointer",
                  color: isOpen ? "#38bdf8" : "var(--text)",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                <span>{item.q}</span>
                <span style={{ fontSize: 20, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                  ▾
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 20px 20px", color: "var(--text-sec)", fontSize: 15, lineHeight: 1.6, borderTop: "1px solid rgba(255, 255, 255, 0.04)", paddingTop: 14 }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Karta zachęty */}
      <div style={{ background: "rgba(0, 0, 0, 0.25)", border: "1px solid var(--border)", borderRadius: 16, padding: "26px 24px", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 19 }}>Nie znalazłeś odpowiedzi na swoje pytanie?</h3>
        <p style={{ color: "var(--text-sec)", margin: "0 0 20px", fontSize: 14 }}>
          Napisz do mnie bezpośrednio lub skorzystaj z kalkulatora wyceny naprawy.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/wycena" className="btn btn-primary" style={{ padding: "10px 22px" }}>
            ⚙️ Oblicz koszt naprawy
          </Link>
          <Link to="/zgloszenie" className="btn btn-outline" style={{ padding: "10px 22px" }}>
            💬 Napisz zgłoszenie
          </Link>
        </div>
      </div>
    </div>
  );
}
