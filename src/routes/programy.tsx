import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/programy")({
  head: () => ({
    meta: [
      { title: "Moje Programy — TymekIT" },
      {
        name: "description",
        content: "Moje Narzędzia Informatyczne: Plan Zadań, Narzędzia Systemowe i Czyszczenie Androida.",
      },
      { property: "og:title", content: "Moje Programy — TymekIT" },
      {
        property: "og:description",
        content: "Autorskie narzędzia i skrypty informatyczne od Tymka.",
      },
    ],
  }),
  component: ProgramyPage,
});

interface ToolItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  details: string;
  fileName: string;
  iconSvg: React.ReactNode;
}

const TOOLS: ToolItem[] = [
  {
    id: "plan-zadan",
    title: "Plan Zadań",
    badge: "Organizacja",
    desc: "Aplikacja i narzędzie do planowania oraz organizacji codziennych zadań.",
    details: "Ułatwia zarządzanie priorytetami, terminami i listą zadań serwisowych lub domowych.",
    fileName: "Plan-Zadan-TymekIT.zip",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "narzedzia-systemowe",
    title: "Narzędzia Systemowe",
    badge: "Windows & Diagnostyka",
    desc: "Zestaw skryptów do diagnostyki, konserwacji i optymalizacji Windows.",
    details: "Naprawa typowych błędów systemowych, czyszczenie pamięci podręcznej i przyspieszanie działania komputera.",
    fileName: "Narzedzia-Systemowe-TymekIT.zip",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    id: "czyszczenie-androida",
    title: "Czyszczenie Androida",
    badge: "Android & Mobile",
    desc: "Optymalizacja i usuwanie zbędnych procesów oraz plików tymczasowych na Androidzie.",
    details: "Pakiet narzędziowy pozwalający odzyskać pamięć i poprawić płynność działania smartfona.",
    fileName: "Czyszczenie-Androida-TymekIT.zip",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
];

function ProgramyPage() {
  const handleDownload = (tool: ToolItem) => {
    // Utworzenie pliku demonstracyjnego/instalatora do natychmiastowego pobrania
    const content = `=========================================
${tool.title} — TymekIT
=========================================
Autor: Tymek (TymekIT)
Kontakt / Pomoc: tymek2008@protonmail.com

Opis programu:
${tool.desc}

Szczegóły:
${tool.details}

Status: Wersja gotowa do wdrożenia.
Jeśli potrzebujesz dedykowanej wersji lub wsparcia przy konfiguracji,
napisz na tymek2008@protonmail.com lub skorzystaj z formularza zgłoszenia na stronie.
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tool.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Rozpoczęto pobieranie: ${tool.title}`);
  };

  return (
    <>
      <section className="page-hero" style={{ textAlign: "center", paddingBottom: 40 }}>
        <div className="container" style={{ maxWidth: 840, margin: "0 auto" }}>
          <div className="breadcrumb reveal visible" style={{ justifyContent: "center" }}>
            <Link to="/">Start</Link> <span>/</span> Moje Programy
          </div>
          <h1 className="reveal visible" data-delay="1" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", marginTop: 12 }}>
            Moje <span className="grad">Narzędzia Informatyczne</span>
          </h1>
          <p className="reveal visible" data-delay="2" style={{ maxWidth: 640, margin: "16px auto 0", fontSize: 16, lineHeight: 1.6, color: "var(--text-dim)" }}>
            Zbiór autorskich programów, skryptów i narzędzi przygotowanych do codziennej optymalizacji, organizacji zadań oraz przyspieszania sprzętu komputerowego i mobilnego.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20, paddingBottom: 100 }}>
        <div className="container" style={{ maxWidth: 1080 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
              alignItems: "stretch",
            }}
          >
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                style={{
                  background: "var(--panel-bg, rgba(255, 255, 255, 0.03))",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.08))",
                  borderRadius: 18,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backdropFilter: "blur(12px)",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  textAlign: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      background: "rgba(56, 189, 248, 0.12)",
                      color: "var(--brand, #38bdf8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 18px",
                    }}
                  >
                    <div style={{ width: 28, height: 28 }}>{tool.iconSvg}</div>
                  </div>

                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(255, 255, 255, 0.06)",
                      color: "var(--text-dim)",
                      marginBottom: 12,
                    }}
                  >
                    {tool.badge}
                  </span>

                  <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>
                    {tool.title}
                  </h3>

                  <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.5, margin: "0 0 12px" }}>
                    {tool.desc}
                  </p>

                  <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.4, margin: "0 0 20px" }}>
                    {tool.details}
                  </p>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => handleDownload(tool)}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      fontSize: 14,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Pobierz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default ProgramyPage;
