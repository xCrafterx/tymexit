import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ReviewsList, ReviewForm } from "@/components/Reviews";
import { SiteRatingPrompt } from "@/components/SiteRatingPrompt";
import { VisitorCounterBadge } from "@/components/VisitorCounterBadge";
import { SiteRatingAllegro } from "@/components/SiteRatingAllegro";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tymek Informatyk! - TymekIT" },
      { name: "description", content: "Tymek Informatyk — naprawa komputerów i laptopów, budowa PC na zamówienie, instalacja systemów, czyszczenie Windows oraz konfiguracja sieci Wi-Fi." },
    ],
  }),
  component: Index,
});

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

function Index() {
  const navigate = useNavigate();
  const pizzaClicks = useRef(0);
  const pizzaTimer = useRef<number | null>(null);
  const tymekitClicks = useRef(0);
  const tymekitTimer = useRef<number | null>(null);
  const [popular, setPopular] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("popular_services").select("service_name");
      if (mounted && data) setPopular(new Set(data.map((r: any) => r.service_name)));
    };
    load();
    const ch = supabase
      .channel("popular_services_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "popular_services" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);


  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let pos = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[pos]) {
        pos++;
        if (pos === seq.length) { pos = 0; navigate({ to: "/matrix" }); }
      } else {
        pos = k === seq[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const handlePizzaClick = () => {
    pizzaClicks.current++;
    if (pizzaTimer.current) window.clearTimeout(pizzaTimer.current);
    pizzaTimer.current = window.setTimeout(() => { pizzaClicks.current = 0; }, 2000);
    if (pizzaClicks.current >= 5) { pizzaClicks.current = 0; navigate({ to: "/pizza" }); }
  };

  const handleTymekitClick = () => {
    tymekitClicks.current++;
    if (tymekitTimer.current) window.clearTimeout(tymekitTimer.current);
    tymekitTimer.current = window.setTimeout(() => { tymekitClicks.current = 0; }, 700);
    if (tymekitClicks.current >= 3) { tymekitClicks.current = 0; navigate({ to: "/retro" }); }
  };

  return (
    <>
      <div className="container" style={{ position: "relative", zIndex: 50 }}>
        <SiteRatingPrompt />
      <VisitorCounterBadge />
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <span className="eyebrow reveal">
                <Link to="/sekret" aria-label="?" title="" className="dot" style={{ cursor: "pointer", display: "inline-block" }} />
                {" "}24/7 Jestem dostępny · Zapraszam!
              </span>
              <h1 className="reveal" data-delay="1">
                Informatyk,<br/>
                <span className="grad" onClick={handleTymekitClick} style={{ cursor: "default" }}>TymekIT</span> stworzony myślą o tobie.
              </h1>
              <p className="hero-sub reveal" data-delay="2">
                Jestem Tymek (informatykiem) zajmuję się naprawą sprzętu oraz konfugurowaniu systemów IT itp,
                robie to z dokładną precyzją aby starannie naprawić problem, a moja jakość usługi jest bezkompromisowa, a klienci są zawsze zadowoleni z mojej pracy.
              </p>
              <div className="hero-ctas reveal" data-delay="3">
                <Link to="/zgloszenie" className="btn btn-primary">
                  Zakup Usługę
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
                <a href="#uslugi" className="btn btn-ghost">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
                  Zobacz moje usługi
                </a>
              </div>
            </div>
            <div className="reveal" data-delay="2">
              <div className="hero-visual">
                <img src="/zdj/elek.jpg" alt="Tymek Informatyk" onError={hideOnError}/>
                <div className="floating-card tl">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--grad-emerald)", display: "grid", placeItems: "center", color: "#04060c" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text)", fontSize: 13 }}>Monitorowanie na żywo</strong>
                      <div style={{ color: "var(--text-mute)", fontSize: 11 }}>Najlepszy na rynku!</div>
                    </div>
                  </div>
                </div>
                <div className="floating-card br" onClick={handlePizzaClick} style={{ cursor: "default" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--grad-violet)", display: "grid", placeItems: "center", color: "#04060c" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18"><path d="M12 21s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10z"/></svg>
                    </div>
                    <div>
                      <strong style={{ color: "var(--text)", fontSize: 13 }}>Tymoteusz Czech</strong>
                      <div style={{ color: "var(--text-mute)", fontSize: 11 }}>Najlepszy Informatyk!</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-stats reveal" data-delay="3">
            <div className="hero-stat"><div className="num">20+</div><div className="label">Naprawionego Sprzętu</div></div>
            <div className="hero-stat"><div className="num">5</div><div className="label">Zakupionych Usług</div></div>
            <div className="hero-stat"><div className="num">3</div><div className="label">Lata Doświadczenia</div></div>
            <div className="hero-stat"><div className="num">24/7</div><div className="label">Dostępny</div></div>
          </div>
        </div>
      </section>

      {/* WELCOME / O MNIE */}
      <section className="section" id="o-mnie">
        <div className="container">
          <div className="about-grid">
            <div className="reveal">
              <span className="eyebrow"><span className="dot"></span> Witamy w Tech</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>
                Nowoczesny <span className="grad">dział IT</span> przychodzi z pomocą.
              </h2>
              <p className="text-dim">
                Jestem tutaj aby pomóc osobom z potrzebami informatycznymi lub skonfigurować serwery, zajmuje się też czyszczeniem komputerów oraz
                laptopów, wymieniam podzespoły w sprzętach, pomagam osobą dobrać odpowiednie podzespoły do PC oraz pomagam przy pomocy technicznej zdalnie
                bądż przez telefon jeżeli ktoś nie zna się na takich programach np. anydesk, teamviewer.
              </p>
              <p className="text-dim">
                Moje tzw. Centrum Operacyjne IT jest wyposażone w zaawansowane narzędzia administracyjne, które pozwalają mi śledzić wydajność i zdrowie systemów klientów w czasie rzeczywistym.
                Dzięki temu mogę proaktywnie identyfikować i rozwiązywać potencjalne problemy, zanim staną się one poważne, zapewniając płynne i niezawodne działanie ich infrastruktury IT.
                Pomagam w odzyskiwaniu danych z uszkodzonych dysków twardych, konfiguracji sieci domowych i biurowych, oraz w rozwiązywaniu problemów takich jak błędy systemowe, problemy z kompatybilnością i ataki wirusowe.
              </p>
              <div className="hero-ctas" style={{ marginTop: 24 }}>
                <a href="#uslugi" className="btn btn-outline">Moje usługi →</a>
                <a href="#kontakt" className="btn btn-ghost">Skontaktuj się zemną</a>
              </div>
            </div>
            <div className="reveal" data-delay="2">
              <div className="about-img">
                <img src="/assets/img/bg/1.jpg" alt="Tech Tymek" onError={hideOnError}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIALTIES / USŁUGI */}
      <section className="section" id="uslugi" style={{ paddingTop: 30 }}>
        <div className="container">
          <div className="reveal">
            <span className="eyebrow"><span className="dot"></span> Moje Umiejętności</span>
            <h2 className="section-title" style={{ marginTop: 18 }}><span className="grad">TymekIT</span> obejmuję <span className="grad">każdy system.</span></h2>
            <p className="section-lead">Pomagam przy awariach sprzętu, składam komputery na zamówienie, instaluję systemy i programy, czyszczę Windows oraz konfiguruję sieci Wi-Fi w domu i firmie.</p>
          </div>
          <div className="bento">
            <div className="spec-card reveal b-feature" data-delay="1">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
              <h3>Szybka pomoc IT 24/7</h3>
              <p>Diagnoza awarii, wsparcie zdalne i pomoc przy problemach, które zatrzymują pracę komputera.</p>
            </div>
            <div className="spec-card reveal" data-delay="2">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z"/></svg></div>
              <h3>Budowa komputerów na zamówienie</h3>
              <p>Dobieram podzespoły, składam zestawy do gier, nauki, pracy biurowej i programowania.</p>
            </div>
            <div className="spec-card reveal" data-delay="3">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0-3 3v4a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5v-4a3 3 0 0 0-3-3V5a3 3 0 0 0-3-3z"/></svg></div>
              <h3>Naprawa laptopów i PC</h3>
              <p>Wymieniam dyski, pamięć RAM, pastę termiczną, zasilacze i inne elementy po dokładnej diagnozie.</p>
            </div>
            <div className="spec-card reveal" data-delay="1">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 8v8M8 12h8"/></svg></div>
              <h3>Instalacja systemów i programów</h3>
              <p>Instaluję Windows, sterowniki, pakiety biurowe, antywirusy oraz potrzebne oprogramowanie.</p>
            </div>
            <div className="spec-card reveal" data-delay="2">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v18M18 3v18M6 12h12"/></svg></div>
              <h3>Czyszczenie sprzętu i Windows</h3>
              <p>Usuwam kurz, poprawiam chłodzenie, porządkuję system, autostart i zbędne pliki.</p>
            </div>
            <div className="spec-card reveal b-full" data-delay="3">
              <div className="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
              <h3>Sieci Wi-Fi i bezpieczeństwo</h3>
              <p>Konfiguruję routery, wzmacniacze, drukarki sieciowe, kopie zapasowe i podstawowe zabezpieczenia.</p>
            </div>
          </div>
        </div>
      </section>

      
        {/* EFEKTY WIZUALNE I STATYSTYKI */}
        <WeeklySlotsBanner />
        <LiveRepairStats />
        <BeforeAfterSlider />
        <DiagnosticTerminal />
        <AvailabilityWidget />

        {/* PRICING */}
      <section className="section" id="cennik">
        <div className="container">
          <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }}>
            <div>
              <span className="eyebrow"><span className="dot"></span> Cennik usługi</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>Plan TymekIT,<br/><span className="grad">w cenie dla każdego.</span></h2>
            </div>
            <Link to="/zgloszenie" className="btn btn-ghost">Napisz o kupno usługi →</Link>
          </div>

          <div className="pricing-grid" style={{ marginTop: 60 }}>
            {[
              {
                h: "Naprawa komputera",
                p: "od 50 zł",
                d: "Kompleksowa diagnoza i naprawa komputerów stacjonarnych.",
                items: [
                  "Diagnoza usterki sprzętu i systemu",
                  "Test podzespołów (płyta, RAM, zasilacz)",
                  "Naprawa lub wymiana uszkodzonych elementów",
                  "Konsultacja techniczna po naprawie",
                ],
              },
              {
                h: "Czyszczenie i optymalizacja",
                p: "od 30 zł",
                d: "Przywrócenie kultury pracy i wydajności sprzętu.",
                items: [
                  "Czyszczenie wnętrza i układu chłodzenia",
                  "Wymiana pasty termoprzewodzącej",
                  "Optymalizacja autostartu i usług Windows",
                  "Usunięcie zbędnych plików i tymczasowych danych",
                ],
              },
              {
                h: "Instalacja systemu",
                p: "od 50 zł",
                d: "Czysta instalacja systemu z pełną konfiguracją.",
                items: [
                  "Instalacja Windows 10/11 lub Linux",
                  "Sterowniki i najnowsze aktualizacje",
                  "Pakiet podstawowych programów (przeglądarka, biuro, antywirus)",
                  "Konfiguracja konta użytkownika i kopii zapasowej",
                ],
              },
              {
                h: "Komputer na zamówienie",
                p: "od 30 zł",
                d: "Zestaw PC dopasowany do Twoich potrzeb i budżetu.",
                items: [
                  "Dobór podzespołów (gaming, biuro, praca twórcza)",
                  "Profesjonalny montaż i kable management",
                  "Testy stabilności i temperatur",
                  "Instalacja systemu i sterowników",
                ],
              },
              {
                h: "Naprawa laptopa",
                p: "od 40 zł",
                d: "Serwis laptopów wszystkich popularnych marek.",
                items: [
                  "Diagnoza problemów z uruchamianiem",
                  "Wymiana dysku, pamięci RAM lub baterii",
                  "Czyszczenie chłodzenia i wymiana pasty",
                  "Naprawa portów ładowania (po wycenie)",
                ],
              },
              {
                h: "Modernizacja sprzętu",
                p: "od 40 zł",
                d: "Przyspiesz starszy komputer bez kupowania nowego.",
                items: [
                  "Doradztwo w wyborze podzespołów",
                  "Montaż dysku SSD i klonowanie systemu",
                  "Rozbudowa pamięci RAM",
                  "Wymiana karty graficznej lub zasilacza",
                ],
              },
              {
                h: "Sieć Wi-Fi",
                p: "od 30 zł",
                d: "Stabilna i bezpieczna sieć w domu lub firmie.",
                items: [
                  "Konfiguracja routera i hasła sieci",
                  "Poprawa zasięgu (wzmacniacze, mesh)",
                  "Podłączenie drukarek i urządzeń sieciowych",
                  "Podstawowe zabezpieczenia i kontrola dostępu",
                ],
              },
              {
                h: "Pomoc zdalna",
                p: "od 20 zł",
                d: "Szybka pomoc bez wychodzenia z domu.",
                items: [
                  "Połączenie przez AnyDesk lub TeamViewer",
                  "Rozwiązywanie problemów z programami",
                  "Konfiguracja kont e-mail i Windows",
                  "Pomoc przy aktualizacjach i instalacjach",
                ],
              },
              {
                h: "Odzyskiwanie danych",
                p: "od 80 zł",
                d: "Profesonalne i dokładne odzyskiwanie",
                items: [
                  "Odzyskiwanie danych z SSD, HDD, pendrive oraz kart SD",
                  "Odzyskiwanie przy użyciu profesjonalnych programów DMDE oraz EaseUS",
                  "Bezpłatne skanowanie nośnika w celu sprawdzenia możliwości odzysku",
                  "Odzyskiwanie przypadkowo usuniętych plików i folderów",
                  "Odzyskiwanie danych po przypadkowym sformatowaniu nośnika",
                  "",
                  "Odzyskane dane przekazywane na wskazany przez klienta nośnik",
                  "Nie zapisujemy nowych danych na uszkodzonym nośniku",
                ],
              },
            ].map((c, i) => {
              const isPopular = popular.has(c.h);
              return (
                <div key={c.h} className={`pricing-card reveal${isPopular ? " featured" : ""}`} data-delay={(i % 4) + 1}>
                  <span className="tag">{isPopular ? "★ Często wybierana" : "TymekIT"}</span>
                  <h3>{c.h}</h3>
                  <div className="price">{c.p}</div>
                  <p className="text-dim" style={{ fontSize: 13, margin: "8px 0 14px" }}>{c.d}</p>
                  <ul>{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  <p className="text-dim" style={{ fontSize: 11, marginTop: 14, opacity: 0.75 }}>
                    Końcowa cena zależy od diagnozy i ewentualnych części.
                  </p>
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {/* DOCTORS / portfolio */}
      <section className="section">
        <div className="container">
          <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: 20 }}>
            <div>
              <span className="eyebrow"><span className="dot"></span> Co potrafię</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>Usługi, które <span className="grad">rozwiązują problemy.</span></h2>
            </div>
            <a href="#uslugi" className="btn btn-ghost">Zobacz wszystkie →</a>
          </div>

          <div className="doctor-grid" style={{ marginTop: 60 }}>
            {[
              { sp: "Składanie PC", h: "Tymek Informatyk", d: "Komputery na zamówienie", img: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&q=80&auto=format&fit=crop" },
              { sp: "Serwis laptopów", h: "Naprawa i diagnoza", d: "Dyski, RAM, chłodzenie", img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&q=80&auto=format&fit=crop" },
              { sp: "Windows i programy", h: "Instalacja systemów", d: "Sterowniki · aktualizacje · konfiguracja", img: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=1000&q=80&auto=format&fit=crop" },
              { sp: "Sieci domowe", h: "Wi-Fi i routery", d: "Zasięg · bezpieczeństwo · drukarki", img: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=1000&q=80&auto=format&fit=crop" },
            ].map((d, i) => (
              <div key={d.h} className="doctor-card reveal" data-delay={i + 1}>
                <div className="doctor-img"><img src={d.img} alt={d.h} onError={hideOnError}/></div>
                <div className="doctor-info">
                  <span className="specialty">{d.sp}</span>
                  <h4>{d.h}</h4>
                  <div className="degree">{d.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="opinie">
        <div className="container">
          <div className="reveal" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
            <div>
              <span className="eyebrow"><span className="dot"></span> Opinie</span>
              <h2 className="section-title" style={{ marginTop: 18 }}>Opinie zadowolonych <span className="grad">klientów TymekIT.</span></h2>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to="/opinie" className="btn btn-primary" style={{ padding: "10px 18px" }}>
                + Wystaw nową opinię
              </Link>
              <Link to="/opinie" className="btn btn-ghost" style={{ padding: "10px 18px" }}>
                Zobacz wszystkie opinie →
              </Link>
            </div>
          </div>
          <ReviewsList limit={6} />
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Link to="/opinie" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 14 }}>
              ✍️ Kliknij tutaj, aby dodać swoją opinię o TymekIT
            </Link>
          </div>
        </div>
      </section>

      {/* OCENA STRONY I WYGLĄDU (ALLEGRO STYLE) */}
      <SiteRatingAllegro />

      {/* CTA + KONTAKT */}
      <section className="section-sm" id="kontakt">
        <div className="container">
          <div className="cta-banner reveal">
            <span className="eyebrow" style={{ background: "rgba(255,255,255,.1)" }}><span className="dot"></span> Napisz o kupno usługi mniej niż 60 sekund</span>
            <h2 style={{ marginTop: 18 }}>Gotowy na pomoc specjalistyczną?<br/><span className="text-grad">Jesteśmy gotowi na Ciebie</span><Link to="/kawa" aria-label="." title="" style={{ color: "inherit", textDecoration: "none", cursor: "default" }}>.</Link></h2>
            <p className="text-dim" style={{ maxWidth: 560, margin: "10px auto 28px" }}>Napisz o kupno usługi — a my się odezwiemy.</p>
            <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <Link to="/zgloszenie" className="btn btn-primary">Kup Usługę</Link>
              <a href="mailto:tymek2008@protonmail.com" className="btn btn-ghost">Skontaktuj się</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
