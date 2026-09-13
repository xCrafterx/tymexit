import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { SupportChatWidget } from "@/components/SupportChatWidget";
import { AdminDebugPanel } from "@/components/AdminDebugPanel";
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
  const { pathname, hash } = useLocation();
  const { session, role } = useAuth();
  const navigate = useNavigate();

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <BrandMark />
        {session && <SoundToggle />}
        {session && role === "admin" && (
          <Link to="/admin/dashboard" className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 11 }}>📊 Dashboard</Link>
        )}
      </div>
      <ul className="nav-links">
        {NAV_LINKS.map(([h, l]) => (
          <li key={h}>
            <a href={h} className={isActive(h) ? "active" : ""}>{l}</a>
          </li>
        ))}
      </ul>
      <div className="nav-actions">
        <button className="theme-toggle" aria-label="Zmień motyw" onClick={toggleTheme}>
          <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </button>
        {session ? (
          <>
            <Link
              to={role === "admin" ? "/panel-admin" : "/panel-klienta"}
              className="btn btn-ghost"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              Panel
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2 7 7 7-7 2 2"/></svg>
            </Link>
            <button onClick={handleLogout} className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
            Wyloguj
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </button>
          </>
        ) : (
          <>
          <Link to="/zgloszenie" className="btn btn-ghost" style={{ padding: "10px 16px", fontSize: 13 }}>
            Zgłoś problem
          </Link>
          <Link to="/login" className="btn btn-primary" style={{ padding: "10px 18px", fontSize: 13 }}>
            Zaloguj
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
          </>
        )}
        <button className="nav-burger" aria-label="Otwórz menu" onClick={onOpenMenu}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
    </nav>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className={`mobile-menu${open ? " is-open" : ""}`}>
      <button className="close" aria-label="Zamknij menu" onClick={onClose}>✕</button>
      {NAV_LINKS.map(([h, l]) => (
        <a key={h} href={h} onClick={onClose}>{l}</a>
      ))}
      <a href="/zgloszenie" onClick={onClose}>Zgłoś problem</a>
      <a href="/login" style={{ color: "var(--brand)" }} onClick={onClose}>Zaloguj się →</a>
      <a href="/register" onClick={onClose}>Utwórz konto</a>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <BrandMark />
            <p className="text-dim mt-6" style={{ maxWidth: 340, fontSize: 14 }}>
              Tymek Informatyk pomaga przy komputerach, laptopach, systemach, czyszczeniu Windowsa, budowie PC i sieciach Wi-Fi.
            </p>
            <div className="socials">
              <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.3V12h2.2l-.3 3h-1.9v7A10 10 0 0 0 22 12z"/></svg></a>
              <a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.7 11.7 0 0 1 3 4.9a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.7 3.3 4-.6.2-1.3.2-1.9.1.5 1.7 2.1 2.9 4 2.9A8.3 8.3 0 0 1 2 18.6a11.7 11.7 0 0 0 6.3 1.8c7.6 0 11.8-6.3 11.8-11.8v-.5c.8-.6 1.5-1.3 2-2.2z"/></svg></a>
              <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
            </div>
          </div>
          <div>
            <h4>Odkrywaj</h4>
            <ul>
              <li><Link to="/o-mnie">O mnie</Link></li>
              <li><Link to="/uslugi">Usługi</Link></li>
              <li><Link to="/opinie">Opinie</Link></li>
            </ul>
          </div>
          <div>
            <h4>Konto</h4>
            <ul>
              <li><Link to="/zgloszenie">Zgłoś problem</Link></li>
              <li><Link to="/login">Logowanie</Link></li>
              <li><Link to="/register">Rejestracja</Link></li>
              <li><Link to="/panel-klienta">Panel klienta</Link></li>
              <li><Link to="/admin">Admin</Link></li>
            </ul>
          </div>
          <div>
            <h4>Kontakt</h4>
            <ul>
              <li>Pomoc zdalna i lokalna<br/>po wcześniejszym ustaleniu</li>
              <li><a href="tel:+48695560039">+48 695 560 039</a></li>
              <li><a href="mailto:kontakt24@tymek.it">kontakt24@tymek.it</a></li>
              <li style={{ color: "var(--brand-3)" }}>● Pilna pomoc IT 24/7</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TymekIT Tymek. Wszystkie prawa zastrzeżone.</span>
          <span><a href="#">Prywatność</a> · <a href="#">Regulamin</a></span>
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

  // scroll reveal on every route change
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.visible)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("visible");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  // smooth-scroll to hash after navigation
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [hash, pathname]);

  return (
    <>
      <div className="aurora" />
      {!hideChrome && <Nav onOpenMenu={() => setMenuOpen(true)} />}
      {!hideChrome && <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />}
      {children}
      {!hideChrome && <Footer />}
      <SupportChatWidget />
      <AdminDebugPanel />
    </>
  );
}
