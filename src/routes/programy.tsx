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

export interface ToolItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  details: string;
  // Nazwa pliku do pobrania
  fileName: string;
  // Bezpośrednia ścieżka do Twojego pliku .exe (np. "/pliki/plan-zadan.exe" lub "/narzedzia.exe")
  // Jeśli podasz tu link lub wrzucisz plik do folderu public, pobierze się bezpośrednio Twój plik .exe!
  exeUrl?: string;
  // Ścieżka do ikony lub element React
  iconSrc?: string;
  iconSvg?: React.ReactNode;
}

// =========================================================================
// KONFIGURACJA PLIKÓW DO POBRANIA:
// Aby Twój plik .exe się pobierał:
// 1. Wrzuć plik .exe do folderu 'public/' (np. public/narzedzia.exe)
// 2. Wpisz poniżej w 'exeUrl' jego ścieżkę: "/narzedzia.exe"
// =========================================================================
const TOOLS: ToolItem[] = [
  {
    id: "plan-zadan",
    title: "Plan Zadań",
    badge: "Organizacja",
    desc: "Aplikacja i narzędzie do planowania oraz organizacji codziennych zadań.",
    details: "Ułatwia zarządzanie priorytetami, terminami i listą zadań serwisowych lub domowych.",
    fileName: "Plan-Zadan.exe",
    exeUrl: "/Plan-Zadan.exe",
    iconSvg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32 }}>
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
    fileName: "Narzedzia-Systemowe.exe",
    exeUrl: "/Narzedzia-Systemowe.exe",
    iconSrc: "/narzedzia.ico",
  },
  {
    id: "czyszczenie-androida",
    title: "Czyszczenie Androida",
    badge: "Android & Mobile",
    desc: "Optymalizacja i usuwanie zbędnych procesów oraz plików tymczasowych na Androidzie.",
    details: "Pakiet narzędziowy pozwalający odzyskać pamięć i poprawić płynność działania smartfona.",
    fileName: "Czyszczenie-Androida.exe",
    exeUrl: "/Czyszczenie-Androida.exe",
    iconSrc: "/android.ico",
  },
];

function ProgramyPage() {
  const handleDownload = async (tool: ToolItem) => {
    // 1. Sprawdzamy czy plik .exe istnieje pod podaną ścieżką
    if (tool.exeUrl) {
      try {
        const response = await fetch(tool.exeUrl, { method: "HEAD" });
        if (response.ok) {
          const a = document.createElement("a");
          a.href = tool.exeUrl;
          a.download = tool.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success(`Rozpoczęto pobieranie pliku: ${tool.fileName}`);
          return;
        }
      } catch {
        // Fallback jeśli nie wrzucono jeszcze fizycznego pliku na serwer
      }
    }

    // 2. Jeśli plik .exe nie został jeszcze fizycznie wrzucony, generujemy plik informacyjny .bat / .exe wrapper
    const placeholderText = `@echo off
echo =======================================================
echo ${tool.title} - TymekIT
echo =======================================================
echo Autor: Tymek
echo Kontakt: tymek2008@protonmail.com
echo.
echo Opis: ${tool.desc}
echo.
echo Aby zaktualizowac do najnowszej wersji .exe,
echo skontaktuj sie z Tymkiem lub pobierz bezposrednio z panelu.
echo =======================================================
pause
`;
    const blob = new Blob([placeholderText], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tool.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Pobrano plik: ${tool.fileName}`);
  };

  return (
    <>
      <section className="page-hero" style={{ textAlign: "center", paddingBottom: 30, paddingTop: 60 }}>
        <div className="container" style={{ maxWidth: 840, margin: "0 auto" }}>
          <div className="breadcrumb reveal visible" style={{ justifyContent: "center" }}>
            <Link to="/">Start</Link> <span>/</span> Moje Programy
          </div>
          <h1 className="reveal visible" data-delay="1" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", marginTop: 14 }}>
            Moje <span className="grad">Narzędzia Informatyczne</span>
          </h1>
          <p className="reveal visible" data-delay="2" style={{ maxWidth: 640, margin: "16px auto 0", fontSize: 16, lineHeight: 1.6, color: "var(--text-dim)" }}>
            Zbiór autorskich programów, skryptów i narzędzi przygotowanych do codziennej optymalizacji, organizacji zadań oraz przyspieszania urządzeń.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20, paddingBottom: 110 }}>
        <div className="container" style={{ maxWidth: 1120 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
              gap: 28,
              alignItems: "stretch",
            }}
          >
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                style={{
                  background: "var(--panel-bg, rgba(255, 255, 255, 0.03))",
                  border: "1px solid var(--border-color, rgba(255, 255, 255, 0.09))",
                  borderRadius: 20,
                  padding: "32px 26px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
                  textAlign: "center",
                }}
              >
                <div>
                  {/* Ikona umieszczona ładnie nad badge Organizacja / Windows / Android */}
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 18,
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      overflow: "hidden",
                    }}
                  >
                    {tool.iconSrc ? (
                      <img
                        src={tool.iconSrc}
                        alt={tool.title}
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "contain",
                          filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
                        }}
                      />
                    ) : (
                      <div style={{ color: "var(--brand, #38bdf8)" }}>{tool.iconSvg}</div>
                    )}
                  </div>

                  {/* Badge np. Organizacja */}
                  <div style={{ marginBottom: 14 }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "5px 12px",
                        borderRadius: 999,
                        background: "rgba(255, 255, 255, 0.06)",
                        color: "var(--text-dim)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 23, fontWeight: 700, margin: "0 0 10px", color: "#fff" }}>
                    {tool.title}
                  </h3>

                  <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.55, margin: "0 0 12px" }}>
                    {tool.desc}
                  </p>

                  <p style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.45, margin: "0 0 24px" }}>
                    {tool.details}
                  </p>
                </div>

                <div>
                  <button
                    onClick={() => handleDownload(tool)}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      gap: 8,
                      padding: "13px 22px",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Pobierz {tool.fileName}
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
