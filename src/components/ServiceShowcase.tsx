import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";

// 1. PŁYWAJĄCY WIDŻET DOSTĘPNOŚCI I CZASU REAKCJI
export function AvailabilityWidget() {
  const [minimized, setMinimized] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: minimized ? "8px 12px" : "10px 16px",
        borderRadius: "999px",
        background: "rgba(13, 17, 23, 0.88)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(16, 185, 129, 0.35)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(16, 185, 129, 0.2)",
        transition: "all 0.3s ease",
        color: "var(--text)",
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#10b981",
          boxShadow: "0 0 10px #10b981",
          display: "inline-block",
          animation: "pulse 2s infinite",
        }}
      />
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          style={{ background: "none", border: "none", color: "#10b981", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
        >
          ~15 min
        </button>
      ) : (
        <>
          <div>
            <strong style={{ color: "#10b981", fontWeight: 700 }}>Dostępny online</strong>
            <span style={{ color: "var(--text-sec)", marginLeft: 6, fontSize: 12 }}>Średni czas reakcji: <strong>~15 min</strong></span>
          </div>
          <button
            onClick={() => setMinimized(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dim)",
              cursor: "pointer",
              marginLeft: 4,
              fontSize: 14,
              lineHeight: 1,
            }}
            title="Zminimalizuj"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}

// 2. WSKAŹNIK WOLNYCH SLOTÓW W TYGODNIU
export function WeeklySlotsBanner() {
  return (
    <div
      style={{
        margin: "24px 0",
        padding: "14px 20px",
        borderRadius: "var(--rad)",
        background: "linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.12))",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🔥</span>
        <div>
          <div style={{ fontWeight: 800, color: "var(--text)", fontSize: 15 }}>
            Obciążenie serwisu w tym tygodniu: <span style={{ color: "#f87171" }}>Zostały tylko 3 wolne terminy!</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
            Zgłoś komputer już teraz, aby diagnoza odbyła się jeszcze przed weekendem.
          </div>
        </div>
      </div>
      <Link to="/zgloszenie" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
        Zarezerwuj termin ⚡
      </Link>
    </div>
  );
}

// 3. LICZNIK ZREALIZOWANYCH NAPRAW NA ŻYWO (ANIMOWANE STATYSTYKI)
export function LiveRepairStats() {
  return (
    <section style={{ margin: "48px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900 }}>
          Liczby, które <span className="grad-brand">mówią same za siebie</span>
        </h2>
        <p className="lead" style={{ marginTop: 8 }}>
          Rzetelna praca i zaufanie dziesiątek zadowolonych klientów.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {[
          { icon: "💻", count: "10+", label: "Naprawionych urządzeń", sub: "Komputery, laptopy i konsole" },
          { icon: "⭐", count: "100%", label: "Zadowolonych opinii", sub: "Średnia ocen 5.0 w serwisie" },
          { icon: "⏱️", count: "~24h", label: "Średni czas diagnozy", sub: "Szybka informacja o usterce i cenie" },
          { icon: "🛡️", count: "30 dni", label: "Gwarancji na usługę", sub: "Pewność i bezpieczeństwo naprawy" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              textAlign: "center",
              padding: "28px 20px",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border)",
              borderRadius: "var(--rad)",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "var(--brand-2)", letterSpacing: "-1px" }}>
              {item.count}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// 4. INTERAKTYWNE PORÓWNANIE PRZED / PO (SUWAK ZDJĘĆ)
export function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  return (
    <section style={{ margin: "56px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900 }}>
          Efekt przed i po: <span className="grad-brand">Generalne czyszczenie</span>
        </h2>
        <p className="lead" style={{ marginTop: 8 }}>
          Przesuń suwak, aby zobaczyć różnicę po profesjonalnym odkurzeniu, wymianie past i termopadów.
        </p>
      </div>

      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 820,
          height: 380,
          margin: "0 auto",
          borderRadius: "var(--rad)",
          overflow: "hidden",
          cursor: "ew-resize",
          userSelect: "none",
          border: "2px solid rgba(6, 182, 212, 0.4)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Po prawej / Pod spodem: PO CZYSZCZENIU */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #064e3b 0%, #0f172a 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 54, marginBottom: 12 }}>✨ ❄️</div>
          <span style={{ background: "#10b981", color: "#000", fontWeight: 800, padding: "4px 12px", borderRadius: 999, fontSize: 13, textTransform: "uppercase" }}>
            PO SERWISIE
          </span>
          <h3 style={{ marginTop: 14, fontSize: 24, fontWeight: 900, color: "#fff" }}>Cichy, chłodny i jak nowy!</h3>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, maxWidth: 360, marginTop: 8 }}>
            Nowa pasta termoprzewodząca Arctic MX-4, wyczyszczone żebra radiatora i wentylator. Spadek temperatur z 88°C na 58°C pod obciążeniem!
          </p>
        </div>

        {/* Po lewej / Na wierzchu: PRZED CZYSZCZENIEM (przycięte szerokością) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${sliderPos}%`,
            overflow: "hidden",
            background: "linear-gradient(135deg, #451a03 0%, #1e1b4b 100%)",
            borderRight: "3px solid #06b6d4",
          }}
        >
          <div
            style={{
              width: containerRef.current ? containerRef.current.clientWidth : 820,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 54, marginBottom: 12 }}>💨 ⚠️</div>
            <span style={{ background: "#ef4444", color: "#fff", fontWeight: 800, padding: "4px 12px", borderRadius: 999, fontSize: 13, textTransform: "uppercase" }}>
              PRZED CZYSZCZENIEM
            </span>
            <h3 style={{ marginTop: 14, fontSize: 24, fontWeight: 900, color: "#fff" }}>Przegrzewanie i głośny hałas</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, maxWidth: 360, marginTop: 8 }}>
              Zaschnięta pasta fabryczna, zablokowany kołtun kurzu, wentylator wyjący na 100% obrotów i dławienie procesora (throttling).
            </p>
          </div>
        </div>

        {/* Uchwyt suwaka na środku */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${sliderPos}%`,
            transform: "translate(-50%, -50%)",
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "#06b6d4",
            boxShadow: "0 0 20px #06b6d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: 900,
            fontSize: 16,
            pointerEvents: "none",
          }}
        >
          ↔
        </div>
      </div>
    </section>
  );
}

// 5. ANIMOWANA KONSOLA HAKERA / DIAGNOSTYKA SERWISOWA
export function DiagnosticTerminal() {
  const [lines, setLines] = useState<string[]>([
    "TymekIT Diagnostics Suite v3.2.0 [x86_64-linux-gnu]",
    "Inicjalizacja środowiska diagnostycznego...",
  ]);

  const allLogs = [
    "Skanowanie szyny PCI-Express... Wykryto GPU: NV-RTX & CPU: AMD Ryzen",
    "Analiza dysku NVMe SMART... Zdrowie: 98%, Liczba godzin pracy: 412h (Brak bad sectorów)",
    "Test pamięci RAM (MemTest86+ pattern)... 16384 MB OK, 0 błędów parzystości",
    "Pomiary napięć zasilacza: +12V: 12.08V (Idealnie), +5V: 5.01V, +3.3V: 3.32V",
    "Wykryto zapylenie układu chłodzenia: Zalecana wymiana pasty termoprzewodzącej",
    "Test połączenia sieciowego: Ping: 12ms | Jitter: 1.1ms | Pakiety: 0% utraty",
    "Optymalizacja rejestru Windows & autostartu... Zwolniono 3.4 GB śmieci",
    "Gotowość serwisowa potwierdzona. System TymekIT gotowy do naprawy!",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < allLogs.length) {
        setLines((prev) => [...prev.slice(-7), `[${new Date().toLocaleTimeString()}] ${allLogs[i]}`]);
        i++;
      } else {
        i = 0;
      }
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ margin: "56px 0" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", borderRadius: "var(--rad)", overflow: "hidden", border: "1px solid #1e293b", boxShadow: "0 16px 40px rgba(0,0,0,0.8)" }}>
        {/* Belka okna terminala */}
        <div style={{ background: "#0f172a", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>serwis@tymekit-diagnostics:~</span>
          </div>
          <span style={{ fontSize: 11, color: "#06b6d4", fontFamily: "monospace", fontWeight: 700 }}>● LIVE RUNNING</span>
        </div>

        {/* Ciało terminala */}
        <div style={{ background: "#050811", padding: "20px", minHeight: 220, fontFamily: "monospace", fontSize: 13, lineHeight: 1.7, color: "#38bdf8" }}>
          {lines.map((line, idx) => (
            <div key={idx} style={{ color: line.includes("Zalecana") ? "#fbbf24" : line.includes("błędów") || line.includes("Idealnie") ? "#4ade80" : "#93c5fd" }}>
              <span style={{ color: "#06b6d4", marginRight: 8 }}>➜</span>
              {line}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{ color: "#10b981" }}>serwis@tymekit:~$</span>
            <span style={{ display: "inline-block", width: 8, height: 16, background: "#38bdf8", animation: "pulse 1s infinite" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
