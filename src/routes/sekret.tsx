import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { unlock } from "@/lib/secrets";

export const Route = createFileRoute("/sekret")({
  head: () => ({
    meta: [
      { title: "Tajny Klub Kotów · TymekIT" },
      { name: "description", content: "Znalazłeś sekretną podstronę. Witamy w Tajnym Klubie Kotów." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SekretPage,
});

function SekretPage() {
  useEffect(() => { unlock("sekret"); }, []);
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <span className="eyebrow"><span className="dot"></span> Znalazłeś sekret · 1 na milion</span>
            <h1 style={{ marginTop: 10 }}>
              Witaj w <span className="grad">Tajnym Klubie Kotów</span>.
            </h1>
            <p className="hero-sub">
              Tutaj nie ma kabli, RAM-u ani Windowsa. Jest tylko spokój, herbata i mruczenie.
              Jeśli trafiłeś tu przypadkiem — pogłaszcz monitor i zostań chwilę.
            </p>

            <div className="hero-ctas" style={{ marginTop: 18 }}>
              <Link to="/" className="btn btn-primary">← Wracam do TymekIT</Link>
              <a href="#manifest" className="btn btn-ghost">Manifest Klubu</a>
            </div>

            <div id="manifest" style={{ marginTop: 36, display: "grid", gap: 14 }}>
              <div className="glass" style={{ padding: 18 }}>
                <strong style={{ color: "var(--text)" }}>§1.</strong>{" "}
                <span className="text-dim">Każdy karton jest schronieniem.</span>
              </div>
              <div className="glass" style={{ padding: 18 }}>
                <strong style={{ color: "var(--text)" }}>§2.</strong>{" "}
                <span className="text-dim">Klawiatura to legowisko. Klawisze to opcja.</span>
              </div>
              <div className="glass" style={{ padding: 18 }}>
                <strong style={{ color: "var(--text)" }}>§3.</strong>{" "}
                <span className="text-dim">3:00 nad ranem to godzina sprintów po mieszkaniu.</span>
              </div>
              <div className="glass" style={{ padding: 18 }}>
                <strong style={{ color: "var(--text)" }}>§4.</strong>{" "}
                <span className="text-dim">Nigdy nie mów kotu „nie". Powiedz „może później".</span>
              </div>
            </div>
          </div>

          <div>
            <div className="hero-visual">
              <img src="/assets/img/easter/cat.jpg" alt="Sekretny kot" style={{ borderRadius: 24 }} />
              <div className="floating-card tl">
                <strong style={{ color: "var(--text)", fontSize: 13 }}>Prezes Klubu</strong>
                <div style={{ color: "var(--text-mute)", fontSize: 11 }}>Mruczy od 2019</div>
              </div>
              <div className="floating-card br">
                <strong style={{ color: "var(--text)", fontSize: 13 }}>Status</strong>
                <div style={{ color: "var(--text-mute)", fontSize: 11 }}>Drzemka w toku</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
