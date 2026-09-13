import { useEffect, useState } from "react";

/**
 * Floating action bar placed UNDER the main navbar.
 * Hides on scroll-down and reappears on scroll-up (same behavior as <Nav>).
 */
export function PanelActionBar({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

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

  return (
    <div className={`panel-action-bar${hidden ? " is-hidden" : ""}`}>
      <div className="panel-action-bar-inner">{children}</div>
    </div>
  );
}
