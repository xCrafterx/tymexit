import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/uslugi")({
  head: () => ({
    meta: [
      { title: "Usługi — TymekIT" },
      { name: "description", content: "Naprawa komputerów i laptopów, składanie PC na zamówienie, instalacja Windows, czyszczenie sprzętu i konfiguracja sieci Wi-Fi." },
      { property: "og:title", content: "Usługi — TymekIT" },
      { property: "og:description", content: "Pełny zakres usług IT: naprawa, montaż, instalacja systemów, sieci Wi-Fi." },
    ],
  }),
  component: Uslugi,
});

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const SERVICES = [
  {
    sp: "Składanie PC",
    h: "Komputery na zamówienie",
    d: "Dobór podzespołów, montaż i testy stabilności pod gry, pracę i naukę.",
    img: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&q=80&auto=format&fit=crop",
  },
  {
    sp: "Serwis laptopów",
    h: "Naprawa i diagnoza",
    d: "Wymiana dysków, RAM, pasty termicznej, baterii oraz zasilaczy.",
    img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&q=80&auto=format&fit=crop",
  },
  {
    sp: "Windows i programy",
    h: "Instalacja systemów",
    d: "Czysta instalacja Windows, sterowniki, pakiety biurowe i antywirus.",
    img: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1000&q=80&auto=format&fit=crop",
  },
  {
    sp: "Sieci domowe",
    h: "Wi-Fi i routery",
    d: "Konfiguracja routera, wzmacniaczy zasięgu i drukarek sieciowych.",
    img: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=1000&q=80&auto=format&fit=crop",
  },
  {
    sp: "Optymalizacja",
    h: "Czyszczenie sprzętu i Windows",
    d: "Kurz, chłodzenie, autostart i porządek w plikach systemowych.",
    img: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1000&q=80&auto=format&fit=crop",
  },
  {
    sp: "Pomoc zdalna",
    h: "Wsparcie online 24/7",
    d: "AnyDesk i TeamViewer — pomoc bez wychodzenia z domu.",
    img: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1000&q=80&auto=format&fit=crop",
  },
];

function Uslugi() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible"><Link to="/">Start</Link> <span>/</span> Usługi</div>
          <h1 className="reveal visible" data-delay="1"><span className="grad">TymekIT</span> obejmuje <span className="grad">każdy system.</span></h1>
          <p className="reveal visible" data-delay="2">Pomagam przy awariach sprzętu, składam komputery na zamówienie, instaluję systemy i programy, czyszczę Windows oraz konfiguruję sieci Wi-Fi w domu i firmie.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="doctor-grid">
            {SERVICES.map((d, i) => (
              <div key={d.h} className="doctor-card reveal" data-delay={(i % 4) + 1}>
                <div className="doctor-img"><img src={d.img} alt={d.h} onError={hideOnError}/></div>
                <div className="doctor-info">
                  <span className="specialty">{d.sp}</span>
                  <h4>{d.h}</h4>
                  <div className="degree">{d.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal" style={{ marginTop: 60, textAlign: "center" }}>
            <Link to="/kontakt" className="btn btn-primary">Skontaktuj się ze mną →</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Uslugi;
