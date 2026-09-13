import { Link } from "@tanstack/react-router";
import { EGGS } from "@/lib/secrets";

export function AllEasterEggs() {
  return (
    <>
      <div className="reveal visible">
        <span className="eyebrow"><span className="dot"></span> Wszystkie easter eggi</span>
        <h2 className="section-title" style={{ marginTop: 18 }}>Galeria <span className="grad">sekretów.</span></h2>
        <p className="text-dim" style={{ maxWidth: 640, marginTop: 8 }}>
          Pełna lista ukrytych podstron strony głównej. Kliknij kartę, aby przejść bezpośrednio do easter egga.
        </p>
      </div>

      <div className="doctor-grid" style={{ marginTop: 40 }}>
        {EGGS.map((e, i) => (
          <Link
            key={e.id}
            to={e.path}
            className="doctor-card reveal visible"
            data-delay={(i % 4) + 1}
            style={{ textDecoration: "none", cursor: "pointer" }}
          >
            <div className="doctor-img" style={{ display: "grid", placeItems: "center", fontSize: 72, background: "var(--surface-2)" }}>
              <span>{e.icon}</span>
            </div>
            <div className="doctor-info">
              <span className="specialty">{e.path}</span>
              <h4>{e.name}</h4>
              <div className="degree">{e.hint}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
