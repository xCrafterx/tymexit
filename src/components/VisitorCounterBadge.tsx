import { useEffect, useState } from "react";

const VISITED_KEY = "tymekit_visitor_logged_v1";

export function VisitorCounterBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const registerAndFetch = async () => {
      // 1. Zawsze natychmiast pobierz aktualną liczbę unikalnych osób
      try {
        const initialRes = await fetch("/api/public/site-ratings?type=analytics");
        const initialData = await initialRes.json();
        if (mounted && typeof initialData.visits === "number") {
          setCount(Math.max(1, initialData.visits));
        }
      } catch {}

      // 2. Pobierz IP i zarejestruj wizytę (serwer sam pilnuje unikalności i odrzuca boty)
      try {
        let clientIp = "";
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2000);
          const ipRes = await fetch("https://api.ipify.org?format=json", { signal: ctrl.signal });
          clearTimeout(timer);
          const ipData = await ipRes.json();
          clientIp = ipData.ip || "";
        } catch {}

        const res = await fetch("/api/public/site-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "visit",
            clientIp: clientIp || undefined,
            path: window.location.pathname,
          }),
        });
        const data = await res.json();
        if (mounted && typeof data.visits === "number") {
          setCount(Math.max(1, data.visits));
        }
      } catch {}
    };

    registerAndFetch();

    return () => {
      mounted = false;
    };
  }, []);

  const displayCount = count ?? 1;

  return (
    <aside
      aria-label="Licznik unikalnych odwiedzin"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 99999,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        borderRadius: 999,
        background: "rgba(10, 25, 18, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1.5px solid rgba(34, 197, 94, 0.65)",
        boxShadow: "0 0 25px rgba(34, 197, 94, 0.45), 0 8px 32px rgba(0, 0, 0, 0.65)",
        color: "#f0fdf4",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em",
        userSelect: "none",
        pointerEvents: "auto",
        animation: "badgeFloat 3s ease-in-out infinite",
      }}
      title="Liczba unikalnych osób, które odwiedziły stronę (1 wejście na 1 urządzenie i IP)"
    >
      <style>{`
        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <span
        style={{
          display: "inline-block",
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: "#22c55e",
          boxShadow: "0 0 10px #22c55e",
        }}
      />
      <span>
        <strong style={{ color: "#4ade80", fontWeight: 700, marginRight: 5 }}>
          {displayCount}
        </strong>
        {displayCount === 1 ? "osoba odwiedziła stronę" : "osób odwiedziło stronę"}
      </span>
    </aside>
  );
}
