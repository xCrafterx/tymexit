import { useEffect, useState } from "react";

export function VisitorCounterBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
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
          body: JSON.stringify({ type: "visit", clientIp }),
        });
        const data = await res.json();
        if (mounted && typeof data.visits === "number") {
          setCount(data.visits);
          return;
        }
      } catch {}

      try {
        const res = await fetch("/api/public/site-ratings?type=analytics");
        const data = await res.json();
        if (mounted && typeof data.visits === "number") {
          setCount(data.visits);
        }
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (count === null) return null;

  return (
    <aside
      aria-label="Licznik unikalnych odwiedzin"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 99,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        borderRadius: 999,
        background: "rgba(10, 25, 18, 0.9)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1.5px solid rgba(34, 197, 94, 0.6)",
        boxShadow: "0 0 24px rgba(34, 197, 94, 0.4), 0 8px 32px rgba(0, 0, 0, 0.55)",
        color: "#f0fdf4",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em",
        userSelect: "none",
        pointerEvents: "auto",
        transition: "transform 0.2s ease",
      }}
      title="Liczba unikalnych osób, które odwiedziły stronę (1 wejście na 1 IP)"
    >
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
          {count}
        </strong>
        {count === 1 ? "osoba odwiedziła stronę" : "osób odwiedziło stronę"}
      </span>
    </aside>
  );
}
