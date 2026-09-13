import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { unlock } from "@/lib/secrets";

export const Route = createFileRoute("/retro")({
  head: () => ({
    meta: [
      { title: "Retro Mode · TymekIT" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RetroPage,
});

function RetroPage() {
  useEffect(() => { unlock("retro"); }, []);
  return (
    <section className="hero" style={{ background: "#000" }}>
      <div className="container" style={{ fontFamily: "monospace", color: "#33ff66" }}>
        <div style={{ borderBottom: "1px dashed #33ff66", paddingBottom: 8, marginBottom: 16 }}>
          C:\TYMEKIT&gt; retro.exe
        </div>
        <pre style={{ color: "#33ff66", fontSize: 12, lineHeight: 1.2, overflow: "auto" }}>{`
   _______                  _    _____ _
  |__   __|                | |  |_   _| |
     | |_   _ _ __ ___   ___| | __ | | | |_
     | | | | | '_  __ \\ / _ \\ |/ / | | | __|
     | | |_| | | | | | |  __/   < _| |_| |_
     |_|\\__, |_| |_| |_|\\___|_|\\_\\_____|\\__|
         __/ |
        |___/
`}</pre>
        <p style={{ marginTop: 16 }}>
          &gt; Loading 1998... OK<br/>
          &gt; CRT monitor: ON<br/>
          &gt; Modem 56k: dial-up...... CONNECTED<br/>
          &gt; Winamp: it really whips the llama's ass<br/>
        </p>
        <p style={{ marginTop: 16 }}>
          Witaj w trybie retro. Tu wszystko ładuje się 3 minuty, a ICQ piszczy w tle.
          Pamiętasz dyskietki? My też.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link
            to="/"
            style={{
              border: "1px solid #33ff66",
              padding: "8px 16px",
              color: "#33ff66",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            [ESC] powrót do 2026
          </Link>
        </div>
      </div>
    </section>
  );
}
