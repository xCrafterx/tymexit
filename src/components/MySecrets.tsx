import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EGGS, getUnlocked, resetUnlocks } from "@/lib/secrets";

export function MySecrets() {
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const refresh = () => setUnlocked(getUnlocked());

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleReset = () => {
    resetUnlocks();
    refresh();
    toast.success("Zresetowano odblokowania");
  };

  const found = unlocked.length;
  const total = EGGS.length;

  return (
    <>
      <div className="reveal visible" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }}>
        <div>
          <span className="eyebrow"><span className="dot"></span> Odkrycia · {found}/{total}</span>
          <h2 className="section-title" style={{ marginTop: 18 }}>Moje <span className="grad">sekrety.</span></h2>
          <p className="text-dim" style={{ maxWidth: 560, marginTop: 8 }}>
            Lista ukrytych podstron i easter eggów. Te, które odkryjesz, zostaną oznaczone.
            Możesz zresetować postęp, żeby polować na nie od nowa.
          </p>
        </div>
        <button type="button" onClick={handleReset} className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: 12 }}>
          Zresetuj odblokowania
        </button>
      </div>

      <div className="testi-grid" style={{ marginTop: 30 }}>
        {EGGS.map((e, i) => {
          const isUnlocked = unlocked.includes(e.id);
          return (
            <div key={e.id} className="testi reveal visible" data-delay={(i % 3) + 1} style={{ opacity: isUnlocked ? 1 : 0.65 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 999,
                  background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 12,
                  color: isUnlocked ? "var(--brand)" : "var(--text-mute)",
                  textTransform: "uppercase", letterSpacing: ".12em",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: isUnlocked ? "var(--brand)" : "var(--text-mute)" }}></span>
                  {isUnlocked ? "Odblokowane" : "Ukryte"}
                </span>
                <span style={{ fontSize: 24 }}>{isUnlocked ? e.icon : "❓"}</span>
              </div>
              <h3 style={{ marginTop: 14, fontSize: "1.05rem", color: "var(--text)" }}>
                {isUnlocked ? e.name : "Sekret #" + (i + 1)}
              </h3>
              <p style={{ marginTop: 6, color: "var(--text-dim)", fontSize: 14 }}>
                {isUnlocked ? e.hint : "Odkryj ten easter egg, aby zobaczyć szczegóły."}
              </p>
              {isUnlocked && (
                <Link to={e.path} className="btn btn-ghost" style={{ marginTop: 12, padding: "8px 14px", fontSize: 12 }}>
                  Otwórz →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
