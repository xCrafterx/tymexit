import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { SupportChatWidget } from "@/components/SupportChatWidget";
import { SoundToggle } from "@/components/SoundToggle";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NAV_LINKS: [string, string][] = [
  ["/", "Start"],
  ["/o-mnie", "O mnie"],
  ["/uslugi", "Usługi"],
  ["/#cennik", "Cennik"],
  ["/kontakt", "Kontakt"],
];

function BrandMark() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark" aria-hidden />
      <span className="brand-name">
        TymekIT<small>Tymek</small>
      </span>
    </Link>
  );
}

function Nav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { pathname, hash } = useLocation();
  const { session, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 960);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > lastY);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const doc = document.documentElement;
    const next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (next === "dark") doc.removeAttribute("data-theme");
    else doc.setAttribute("data-theme", "light");
    localStorage.setItem("uh-theme", next);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" && !hash;
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Wylogowano");
    navigate({ to: "/" });
  };

  return (
    <nav className={`nav${hidden ? " is-hidden" : ""}`} aria-label="Główna nawigacja">
      <div className="nav-leading">
        <BrandMark />
        {!isMobile && <div className="nav-sound"><SoundToggle /></div>}
      </div>
      {!isMobile && (
        <ul className="nav-links">
        {NAV_LINKS.map(([h, l]) => (
          <li key={h}>
            <a href={h} className={isActive(h) ? "active" : ""} style={{ whiteSpace: "nowrap", padding: "8px 10px" }}>{l}</a>
          </li>
        ))}
        <li className="nav-rgb-separator" aria-hidden>
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "32px",
              borderRadius: "4px",
              background: "linear-gradient(180deg, #ff007a, #7928ca, #0070f3, #00dfd8, #00ff88, #ffea00, #ff007a)",
              backgroundSize: "100% 300%",
              animation: "navRgbWaveDown 1.1s linear infinite",
              boxShadow: "0 0 10px rgba(0, 223, 216, 0.8), 0 0 18px rgba(121, 40, 202, 0.6)"
            }}
          />
        </li>
        <li>
          <Link to="/programy" className={isActive("/programy") ? "active" : ""} style={{ whiteSpace: "nowrap", padding: "8px 10px" }}>Moje Programy</Link>
        </li>
      </ul>
      )}
      <div className="nav-actions">
        <button className="theme-toggle" aria-label="Zmień motyw" onClick={toggleTheme}>
          <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </button>
        {!isMobile && (
          <>
            <Link to="/zgloszenie" className="btn btn-ghost nav-desktop-action" style={{ padding: "10px 16px", fontSize: 13 }}>
              Zgłoś problem
            </Link>
            {session ? (
              <>
                <Link
                  to={role === "admin" ? "/panel-admin" : "/panel-klienta"}
                  className="btn btn-ghost nav-desktop-action"
                  style={{ padding: "10px 16px", fontSize: 13 }}
                >
                  Panel
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2 7 7 7-7 2 2"/></svg>
                </Link>
                <button onClick={handleLogout} className="btn btn-primary nav-desktop-action" style={{ padding: "10px 18px", fontSize: 13 }}>
                Wyloguj
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary nav-desktop-action" style={{ padding: "10px 18px", fontSize: 13 }}>
                Zaloguj
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
            )}
          </>
        )}
        <button className="nav-burger" aria-label="Otwórz menu" onClick={onOpenMenu} style={isMobile ? { display: "inline-flex" } : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
    </nav>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname, hash } = useLocation();
  const { session, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" && !hash;
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href;
  };

  const handleMobileLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Wylogowano");
    onClose();
    navigate({ to: "/" });
  };

  return (
    <div className={`mobile-menu${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="close" aria-label="Zamknij menu" onClick={onClose}>✕</button>
      {NAV_LINKS.map(([h, l]) => (
        <a key={h} href={h} className={isActive(h) ? "active" : ""} onClick={onClose}>{l}</a>
      ))}
      <Link to="/programy" className={isActive("/programy") ? "active" : ""} onClick={onClose}>Moje Programy</Link>
      <Link to="/zgloszenie" className={isActive("/zgloszenie") ? "active" : ""} onClick={onClose}>Zgłoś problem</Link>
      <div className="mobile-menu-actions">
        {session ? (
          <>
            <Link to={role === "admin" ? "/panel-admin" : "/panel-klienta"} onClick={onClose}>Panel</Link>
            <button type="button" onClick={handleMobileLogout}>Wyloguj</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={onClose}>Zaloguj się</Link>
            <Link to="/register" onClick={onClose}>Utwórz konto</Link>
          </>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="footer"
      style={{
        position: "relative",
        paddingTop: 100,
        paddingBottom: 65,
        overflow: "hidden",
        borderTop: "none",
        background: "linear-gradient(180deg, rgba(10, 15, 30, 0.98) 0%, rgba(5, 7, 15, 0.99) 100%)"
      }}
    >
      <style>{`
        @keyframes navRgbWaveDown {
          0% { background-position: 50% 0%; }
          100% { background-position: 50% 100%; }
        }
        @keyframes footerRgbLine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes footerRgbWaveDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          70% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(750px);
            opacity: 0;
          }
        }
      `}</style>

      {/* Gruba, mieniąca się belka RGB na samej górze stopki (6px) z poświatą */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          background: "linear-gradient(90deg, #ff007a, #7928ca, #0070f3, #00dfd8, #00ff88, #ffea00, #ff007a)",
          backgroundSize: "300% 100%",
          animation: "footerRgbLine 2s linear infinite",
          boxShadow: "0 0 20px rgba(0, 223, 216, 0.9), 0 0 35px rgba(121, 40, 202, 0.7), 0 0 50px rgba(255, 0, 122, 0.4)",
          zIndex: 3
        }}
      />

      {/* Efekt fali RGB płynącej z góry na dół */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 1
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 380,
            background: "linear-gradient(180deg, rgba(0, 223, 216, 0.32) 0%, rgba(121, 40, 202, 0.26) 40%, rgba(255, 0, 122, 0.18) 75%, transparent 100%)",
            filter: "blur(20px)",
            animation: "footerRgbWaveDown 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite"
          }}
        />
      </div>

      <div className="container" style={{ position: "relative", zIndex: 2 }}>
        <div className="footer-grid">
          <div>
            <BrandMark />
            <p className="text-dim mt-6" style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.7 }}>
              Tymek Informatyk — profesjonalny serwis komputerowy, naprawa laptopów, optymalizacja systemów, konfiguracja sieci Wi-Fi i autorskie oprogramowanie narzędziowe dla każdego.
            </p>
            <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", fontSize: 12, color: "var(--brand, #38bdf8)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
              Status serwisu: Przyjmuję zgłoszenia 24/7
            </div>
            <div className="socials" style={{ marginTop: 24 }}>
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.3V12h2.2l-.3 3h-1.9v7A10 10 0 0 0 22 12z"/></svg></a>
              <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.7 11.7 0 0 1 3 4.9a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4-.6.2-1.3.2-1.9.1.5 1.7 2.1 2.9 4 2.9A8.3 8.3 0 0 1 2 18.6a11.7 11.7 0 0 0 6.3 1.8c7.6 0 11.8-6.3 11.8-11.8v-.5c.8-.6 1.5-1.3 2-2.2z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
            </div>
          </div>
          <div>
            <h4>Odkrywaj</h4>
            <ul>
              <li><Link to="/">Strona główna</Link></li>
              <li><Link to="/o-mnie">O mnie & Doświadczenie</Link></li>
              <li><Link to="/uslugi">Wszystkie usługi</Link></li>
              <li><Link to="/programy" style={{ color: "var(--brand, #38bdf8)", fontWeight: 600 }}>Moje Programy & Pliki</Link></li>
              <li><Link to="/opinie">Opinie klientów</Link></li>
            </ul>
          </div>
          <div>
            <h4>Obsługa zgłoszeń</h4>
            <ul>
              <li><Link to="/zgloszenie">Zgłoś problem online</Link></li>
              <li><Link to="/login">Logowanie do panelu</Link></li>
              <li><Link to="/register">Rejestracja konta</Link></li>
              <li><Link to="/panel-klienta">Panel klienta (statusy)</Link></li>
              <li><Link to="/admin">Panel administracyjny</Link></li>
            </ul>
          </div>
          <div>
            <h4>Godziny & Pomoc</h4>
            <ul>
              <li><strong>Poniedziałek – Sobota:</strong> 8:00 – 22:00</li>
              <li><strong>Niedziela & Święta:</strong> pomoc pilna / online</li>
              <li>Obsługa stacjonarna oraz zdalna (AnyDesk / TeamViewer)</li>
              <li style={{ marginTop: 10 }}>
                <a href="tel:+48695560039" style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>+48 695 560 039</a>
              </li>
              <li>
                <a href="mailto:tymek2008@protonmail.com" style={{ color: "var(--brand-2, #818cf8)" }}>tymek2008@protonmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-service-summary">
          <div>
            Szybka diagnoza · Przejrzysty cennik · Bezpieczeństwo Twoich danych i sprzętu · Gwarancja na wykonane usługi
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <span>Płatności: Blik / Przelew / Gotówka</span>
          </div>
        </div>

        <div className="footer-bottom" style={{ paddingTop: 20, borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <span>© {new Date().getFullYear()} TymekIT — Tymek. Wszelkie prawa zastrzeżone.</span>
          <span><a href="#">Polityka prywatności</a> · <a href="#">Regulamin serwisu</a> · <a href="/zgloszenie">Kontakt serwisowy</a></span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children, hideChrome = false }: { children: React.ReactNode; hideChrome?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // theme restore
  useEffect(() => {
    const saved = localStorage.getItem("uh-theme");
    if (saved === "light") document.documentElement.setAttribute("data-theme", "light");
  }, []);

  // Scroll to top upon navigating to a page without a hash
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash]);

  // scroll reveal on every route change (with safe timeout to wait for children to mount)
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    const runReveal = () => {
      const els = document.querySelectorAll(".reveal:not(.visible)");
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("visible");
              io?.unobserve(en.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: "0px 0px 50px 0px" }
      );
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If element is already in the viewport or above, reveal it immediately
        if (rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 50) {
          el.classList.add("visible");
        } else {
          io?.observe(el);
        }
      });
    };

    // Run immediately and after a short tick to capture newly mounted route components
    runReveal();
    const timer = setTimeout(runReveal, 80);

    return () => {
      clearTimeout(timer);
      io?.disconnect();
    };
  }, [pathname, hash]);

  // smooth-scroll to hash after navigation
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [hash, pathname]);

  return (
    <>
      <div className="aurora" />
      {!hideChrome && <Nav onOpenMenu={() => setMenuOpen(true)} />}
      {!hideChrome && <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
      {children}
      {!hideChrome && <Footer />}
      <SupportChatWidget />
    </>
  );
}
