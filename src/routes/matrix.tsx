import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { unlock } from "@/lib/secrets";

export const Route = createFileRoute("/matrix")({
  head: () => ({
    meta: [
      { title: "Matrix · TymekIT" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MatrixPage,
});

function MatrixPage() {
  useEffect(() => { unlock("matrix"); }, []);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const letters = "アァイィウエカキクケコサシスセソタチツテトナニヌネノ0123456789".split("");
    const fontSize = 16;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = new Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(4, 6, 12, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#34d399";
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const id = window.setInterval(draw, 50);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="hero" style={{ position: "relative", minHeight: "80vh" }}>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.5 }} />
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <span className="eyebrow"><span className="dot"></span> Konami unlocked · poziom hakera</span>
        <h1 style={{ marginTop: 10 }}>
          Witaj w <span className="grad">Matriksie</span>.
        </h1>
        <p className="hero-sub">
          ↑ ↑ ↓ ↓ ← → ← → B A — wpisałeś prawidłowy kod. Czerwona pigułka czy niebieska?
          Tu już nic nie jest tym, czym się wydaje. Nawet Twój pulpit.
        </p>
        <div className="hero-ctas" style={{ marginTop: 18 }}>
          <Link to="/" className="btn btn-primary">← Wyjście z symulacji</Link>
        </div>
      </div>
    </section>
  );
}
