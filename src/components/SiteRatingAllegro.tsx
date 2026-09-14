import { useState, useEffect } from "react";

type RatingStats = {
  counts: Record<number, number>;
  total: number;
  average: number;
};

export function SiteRatingAllegro() {
  const [stats, setStats] = useState<RatingStats>({
    counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
    total: 0,
    average: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/public/site-ratings");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Błąd pobierania statystyk ocen:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const handleRatingUpdated = () => {
      fetchStats();
    };
    window.addEventListener("tymekit_rating_submitted", handleRatingUpdated);
    return () => {
      window.removeEventListener("tymekit_rating_submitted", handleRatingUpdated);
    };
  }, []);

  return (
    <section className="section-sm" id="ocena-strony" style={{ paddingTop: "20px" }}>
      <div className="container">
        <div
          className="site-rating-card"
          style={{
            background: "linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(24, 24, 27, 0.85))",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span className="dot"></span> Społeczność
            </span>
            <h2 className="section-title" style={{ marginTop: "12px", marginBottom: 0, fontSize: "28px", textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
              Ocena mojej strony <span className="grad">i wyglądu</span>
            </h2>
            <p className="text-dim" style={{ maxWidth: "560px", margin: "8px auto 0", fontSize: "14px", textAlign: "center" }}>
              Oceny odwiedzających w skali od 1 do 10.
            </p>
          </div>

          <div
            className="site-rating-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
              gap: "32px",
              alignItems: "center",
            }}
          >
            {/* Lewa kolumna: Wielka średnia ocen */}
            <div
              className="site-rating-average"
              style={{
                textAlign: "center",
                padding: "24px",
                background: "rgba(0, 0, 0, 0.2)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div style={{ fontSize: "54px", fontWeight: "800", color: "#fff", lineHeight: 1 }}>
                {stats.total > 0 ? stats.average.toFixed(1) : "—"}
                <span style={{ fontSize: "24px", color: "rgba(255, 255, 255, 0.4)", fontWeight: "400" }}>
                  /10
                </span>
              </div>
              <div style={{ margin: "12px 0 6px", fontSize: "20px", color: "#fbbf24" }}>
                {"★".repeat(Math.round((stats.average || 0) / 2))}
                {"☆".repeat(5 - Math.round((stats.average || 0) / 2))}
              </div>
              <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                Łącznie ocen: <strong style={{ color: "#fff" }}>{stats.total}</strong>
              </div>
            </div>

            {/* Prawa kolumna: Rozpiska od 10 na 10 do 1 na 10 w stylu Allegro */}
            <div className="site-rating-breakdown" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((lvl) => {
                const count = stats.counts[lvl] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div
                    className="site-rating-row"
                    key={lvl}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "13px",
                    }}
                  >
                    {/* Etykieta N na 10 */}
                    <div style={{ width: "70px", color: "rgba(255, 255, 255, 0.8)", fontWeight: "500" }}>
                      {lvl} na 10
                    </div>

                    {/* Pasek postępu */}
                    <div
                      style={{
                        flex: 1,
                        height: "10px",
                        background: "rgba(255, 255, 255, 0.08)",
                        borderRadius: "5px",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background:
                            lvl >= 8
                              ? "linear-gradient(90deg, #10b981, #06b6d4)"
                              : lvl >= 5
                              ? "linear-gradient(90deg, #f59e0b, #eab308)"
                              : "linear-gradient(90deg, #ef4444, #f43f5e)",
                          borderRadius: "5px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>

                    {/* Licznik głosów po prawej stronie */}
                    <div
                      style={{
                        width: "35px",
                        textAlign: "right",
                        color: count > 0 ? "#fff" : "rgba(255, 255, 255, 0.35)",
                        fontWeight: count > 0 ? "600" : "normal",
                      }}
                    >
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Na samym dole na zielono: Średnia ocen */}
          <div
            className="site-rating-summary"
            style={{
              marginTop: "28px",
              padding: "14px 20px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>📊</span>
              <span style={{ color: "#34d399", fontWeight: "700", fontSize: "16px" }}>
                Średnia ocen: {stats.total > 0 ? stats.average.toFixed(2) : "Brak ocen"} / 10
              </span>
            </div>
            <div style={{ color: "#a7f3d0", fontSize: "13px" }}>
              Wszystkie głosy są weryfikowane pod kątem unikalności adresu IP
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
