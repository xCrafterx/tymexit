import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — TymekIT" },
      { name: "description", content: "Skontaktuj się z Tymkiem — telefon, e-mail i pomoc zdalna. Dostępny 24/7 dla pilnych spraw." },
      { property: "og:title", content: "Kontakt — TymekIT" },
      { property: "og:description", content: "Telefon, e-mail, pomoc zdalna. Odpowiadam szybko." },
    ],
  }),
  component: Kontakt,
});

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

function Kontakt() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> Kontakt</div>
          <h1 className="reveal visible" data-delay="1">Porozmawiajmy o <span className="grad">Twoim sprzęcie.</span></h1>
          <p className="reveal visible" data-delay="2">Napisz, zadzwoń albo umów się na pomoc zdalną — odpowiadam szybko, a diagnoza i wycena są zawsze gratis.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="reveal">
              <span className="eyebrow"><span className="dot"></span> Dane kontaktowe</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>Wybierz <span className="grad">wygodną formę.</span></h2>

              <div className="testi-grid" style={{ marginTop: 30, gridTemplateColumns: "1fr" }}>
                <a href="tel:+48695560039" className="testi reveal" style={{ textDecoration: "none" }}>
                  <div className="who">
                    <div className="avatar">📞</div>
                    <div className="who-text"><strong>+48 695 560 039</strong><small>Telefon · pn–nd 8:00–22:00</small></div>
                  </div>
                </a>
                <a href="mailto:tymek2008@protonmail.com" className="testi reveal" data-delay="1" style={{ textDecoration: "none" }}>
                  <div className="who">
                    <div className="avatar">✉️</div>
                    <div className="who-text"><strong>tymek2008@protonmail.com</strong><small>E-mail · odpowiadam do 24 h</small></div>
                  </div>
                </a>
                <div className="testi reveal" data-delay="2">
                  <div className="who">
                    <div className="avatar">🖥️</div>
                    <div className="who-text"><strong>Pomoc zdalna</strong><small>AnyDesk · TeamViewer · po wcześniejszym ustaleniu</small></div>
                  </div>
                </div>
                <div className="testi reveal" data-delay="3">
                  <div className="who">
                    <div className="avatar" style={{ background: "var(--grad-emerald)", color: "#04060c" }}>●</div>
                    <div className="who-text"><strong>Pilna pomoc IT 24/7</strong><small>Awarie krytyczne — zadzwoń</small></div>
                  </div>
                </div>
              </div>

              <div className="hero-ctas" style={{ marginTop: 30 }}>
                <Link to="/zgloszenie" className="btn btn-primary">Zakup usługę →</Link>
                <Link to="/uslugi" className="btn btn-ghost">Zobacz usługi</Link>
              </div>
            </div>

            <div className="reveal" data-delay="2">
              <div className="about-img">
                <img
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&auto=format&fit=crop"
                  alt="Kontakt — pomoc IT"
                  onError={hideOnError}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Kontakt;
