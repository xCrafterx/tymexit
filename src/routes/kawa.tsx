import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { unlock } from "@/lib/secrets";

export const Route = createFileRoute("/kawa")({
  head: () => ({
    meta: [
      { title: "Kawa · TymekIT" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KawaPage,
});

function KawaPage() {
  useEffect(() => { unlock("kawa"); }, []);
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow"><span className="dot"></span> Sekretna kawiarnia · tylko dla odkrywców</span>
        <h1 style={{ marginTop: 10 }}>
          Pora na <span className="grad">przerwę na kawę</span>.
        </h1>
        <p className="hero-sub">
          Każda dobra linijka kodu zaczyna się od espresso. Usiądź, oddychaj, scrolluj wolniej.
          Internet nigdzie nie ucieknie — a jeśli ucieknie, to znaczy że potrzebujesz nowego routera.
        </p>

        <div style={{ fontSize: 80, marginTop: 20 }}>☕</div>

        <div className="glass" style={{ padding: 20, marginTop: 20, maxWidth: 560 }}>
          <strong style={{ color: "var(--text)" }}>Przepis dnia</strong>
          <p className="text-dim" style={{ marginTop: 6 }}>
            1 łyżeczka cierpliwości · 2 łyżki ciekawości · szczypta humoru ·
            zalej wrzątkiem i pij małymi łykami patrząc w okno.
          </p>
        </div>

        <div className="hero-ctas" style={{ marginTop: 30 }}>
          <Link to="/" className="btn btn-primary">← Wracam do roboty</Link>
        </div>
      </div>
    </section>
  );
}
