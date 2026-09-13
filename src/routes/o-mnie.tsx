import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/o-mnie")({
  head: () => ({
    meta: [
      { title: "O mnie — TymekIT" },
      { name: "description", content: "Poznaj Tymka — informatyka pasjonata. Naprawiam komputery, składam PC na zamówienie i pomagam zdalnie." },
      { property: "og:title", content: "O mnie — TymekIT" },
      { property: "og:description", content: "Poznaj Tymka — informatyka pasjonata. Naprawa, montaż, sieci i pomoc zdalna." },
    ],
  }),
  component: OMnie,
});

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

function OMnie() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> O mnie</div>
          <h1 className="reveal visible" data-delay="1">Cześć, jestem <span className="grad">Tymek.</span></h1>
          <p className="reveal visible" data-delay="2">Od trzech lat zajmuję się informatyką — naprawiam sprzęt, składam komputery, konfiguruję sieci i ratuję dane. Robię to z pasją i precyzją.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="reveal">
              <span className="eyebrow"><span className="dot"></span> Moja historia</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>Nowoczesny <span className="grad">dział IT</span> w jednej osobie.</h2>
              <p className="text-dim">
                Jestem tutaj aby pomóc osobom z potrzebami informatycznymi lub skonfigurować serwery, zajmuję się też czyszczeniem komputerów oraz
                laptopów, wymieniam podzespoły w sprzętach, pomagam dobrać odpowiednie podzespoły do PC oraz pomagam przy wsparciu technicznym zdalnie
                bądź przez telefon (AnyDesk, TeamViewer).
              </p>
              <p className="text-dim">
                Moje Centrum Operacyjne IT jest wyposażone w zaawansowane narzędzia administracyjne, które pozwalają mi śledzić wydajność i zdrowie systemów klientów w czasie rzeczywistym.
                Pomagam w odzyskiwaniu danych z uszkodzonych dysków, konfiguracji sieci domowych i biurowych oraz w rozwiązywaniu problemów z błędami systemowymi, kompatybilnością i wirusami.
              </p>
              <div className="hero-ctas" style={{ marginTop: 24 }}>
                <Link to="/uslugi" className="btn btn-outline">Moje usługi →</Link>
                <Link to="/kontakt" className="btn btn-ghost">Skontaktuj się ze mną</Link>
              </div>
            </div>
            <div className="reveal" data-delay="2">
              <div className="about-img">
                <img
                  src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80&auto=format&fit=crop"
                  alt="Stanowisko pracy informatyka"
                  onError={hideOnError}
                />
              </div>
            </div>
          </div>

          <div className="hero-stats reveal" style={{ marginTop: 60 }}>
            <div className="hero-stat"><div className="num">20+</div><div className="label">Naprawionego Sprzętu</div></div>
            <div className="hero-stat"><div className="num">5</div><div className="label">Zakupionych Usług</div></div>
            <div className="hero-stat"><div className="num">3</div><div className="label">Lata Doświadczenia</div></div>
            <div className="hero-stat"><div className="num">24/7</div><div className="label">Dostępny</div></div>
          </div>
        </div>
      </section>
    </>
  );
}

export default OMnie;
