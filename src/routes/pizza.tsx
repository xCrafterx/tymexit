import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { unlock } from "@/lib/secrets";

export const Route = createFileRoute("/pizza")({
  head: () => ({
    meta: [
      { title: "Pizza Klub · TymekIT" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PizzaPage,
});

function PizzaPage() {
  useEffect(() => { unlock("pizza"); }, []);
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow"><span className="dot"></span> Tajna Loża Pizzy · poziom 5 kliknięć</span>
        <h1 style={{ marginTop: 10 }}>
          Klub miłośników <span className="grad">pizzy o 2 w nocy</span>.
        </h1>
        <p className="hero-sub">
          Klikałeś tak uparcie, że odblokowałeś sekretne menu. Tu nie naprawiamy laptopów —
          tu debatujemy, czy ananas ma prawo istnieć na cieście.
        </p>

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginTop: 30 }}>
          {[
            { e: "🍕", n: "Margherita", d: "Klasyka. Bez dyskusji." },
            { e: "🍍", n: "Hawajska", d: "Kontrowersyjna. Lubimy ryzyko." },
            { e: "🌶️", n: "Diavola", d: "Dla odważnych adminów." },
            { e: "🧀", n: "Quattro Formaggi", d: "Cztery sery, zero żalu." },
          ].map((p) => (
            <div key={p.n} className="glass" style={{ padding: 18 }}>
              <div style={{ fontSize: 32 }}>{p.e}</div>
              <strong style={{ color: "var(--text)" }}>{p.n}</strong>
              <div className="text-dim" style={{ fontSize: 13 }}>{p.d}</div>
            </div>
          ))}
        </div>

        <div className="hero-ctas" style={{ marginTop: 30 }}>
          <Link to="/" className="btn btn-primary">← Wracam do TymekIT</Link>
        </div>
      </div>
    </section>
  );
}
