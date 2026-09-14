import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  fileName: string;
  exeUrl: string;
  iconSrc?: string;
  iconSvg?: React.ReactNode;
  warningNote?: React.ReactNode;
}

const TOOLS: ToolItem[] = [
  {
    id: "plan-zadan",
    title: "Plan Zadań",
    badge: "Organizacja",
    desc: "Program służący do mediów społecznościowych",
    details: "Program tworzy overlay i wiele innych rzeczy",
    fileName: "PlanZadan.exe",
    exeUrl: "https://github.com/xCrafterx/tymexit/releases/download/TymexIT/PlanZadan.exe",
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
    fileName: "Narzedzia.Systemowe.exe",
    exeUrl: "https://github.com/xCrafterx/tymexit/releases/download/tymekIT/Narzedzia.Systemowe.exe",
    iconSrc: "/narzedzia.ico",
  },
  {
    id: "czyszczenie-androida",
    title: "Czyszczenie Androida",
    badge: "Android & Mobile",
    desc: "Optymalizacja i usuwanie zbędnych procesów oraz plików tymczasowych na Androidzie.",
    details: "Pakiet narzędziowy pozwalający odzyskać pamięć i poprawić płynność działania smartfona.",
    fileName: "Czyszczenie.Androida.exe",
    exeUrl: "https://github.com/xCrafterx/tymexit/releases/download/TymixIT/Czyszczenie.Androida.exe",
    iconSrc: "/android.ico",
    warningNote: (
      <div
        style={{
          marginTop: 14,
          marginBottom: 16,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          color: "#f87171",
          fontSize: 12.5,
          lineHeight: 1.5,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        ⚠️ Wymagano pobranie adb (
        <a
          href="https://tinyurl.com/3ddc658h"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#fca5a5", textDecoration: "underline", fontWeight: 700 }}
        >
          https://tinyurl.com/3ddc658h
        </a>
        ) oraz wrzucenie programu do plików adb!
      </div>
    ),
  },
];

function ProgramyPage() {
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/site-ratings?type=analytics");
        const data = await res.json();
        if (data?.downloads) setDownloadCounts(data.downloads);
      } catch {}
    })();
  }, []);

  const handleDownload = async (tool: ToolItem) => {
    toast.info(`Pobieranie ${tool.fileName}...`);
    try {
      let clientIp = "Nieznane IP";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        clientIp = ipData.ip;
      } catch {}

      const res = await fetch("/api/public/site-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "download", toolId: tool.id, clientIp }),
      });
      const data = await res.json();
      if (typeof data.count === "number") {
        setDownloadCounts((prev) => ({ ...prev, [tool.id]: data.count }));
      }
    } catch {}
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

                  <p style={{ fontSize: 14.5, color: "#f3f4f6", lineHeight: 1.55, margin: "0 0 12px", fontWeight: 500 }}>
                    {tool.desc}
                  </p>

                  <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.55)", lineHeight: 1.45, margin: "0 0 16px" }}>
                    {tool.details}
                  </p>
                </div>

                <div>
                  {/* Ostrzeżenie na czerwono nad pobieraniem jeśli zdefiniowane */}
                  {tool.warningNote}

                  <a
                    href={tool.exeUrl}
                    download={tool.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDownload(tool)}
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      gap: 8,
                      padding: "13px 22px",
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Pobierz {tool.fileName}
                  </a>

                  <div
                    style={{
                      marginTop: 10,
                      textAlign: "center",
                      fontSize: 12.5,
                      color: "#86efac",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 8px #22c55e",
                      }}
                    />
                    Pobrań:{" "}
                    <strong style={{ color: "#fff", marginLeft: 2, marginRight: 2 }}>
                      {downloadCounts[tool.id] ?? 0}
                    </strong>{" "}
                    {(downloadCounts[tool.id] ?? 0) === 1 ? "osoba" : "osób"}
                  </div>
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
