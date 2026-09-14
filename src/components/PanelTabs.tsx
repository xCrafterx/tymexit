import { useEffect, useRef, useState } from "react";

export type PanelTabKey = string;

export type PanelTabItem = {
  key: PanelTabKey;
  label: string;
  icon: string;
  badge?: number;
  badgeVariant?: "default" | "danger" | "success";
  excludeFromGroupBadge?: boolean;
};

export type PanelTabGroup = {
  id: string;
  label: string;
  icon: string;
  items: PanelTabItem[];
};

type Props = {
  groups: PanelTabGroup[];
  active: PanelTabKey;
  onChange: (key: PanelTabKey) => void;
};

const dangerPulseStyle = `
@keyframes redBadgePulse {
  0%, 100% {
    box-shadow: 0 0 2px rgba(239, 68, 68, 0.3);
    filter: brightness(0.65);
    transform: scale(0.92);
    opacity: 0.55;
  }
  50% {
    box-shadow: 0 0 14px #ff1a1a, 0 0 30px #ef4444, 0 0 60px rgba(255, 30, 30, 0.9), 0 0 90px rgba(239, 68, 68, 0.7), inset 0 0 8px rgba(255, 255, 255, 0.8);
    filter: brightness(1.7) drop-shadow(0 0 16px rgba(255, 0, 0, 0.95));
    transform: scale(1.22);
    opacity: 1;
  }
}
.panel-tabs__badge--danger {
  animation: redBadgePulse 1.8s ease-in-out infinite !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 999px !important;
  position: relative;
  z-index: 2;
}
@keyframes greenBadgePulse {
  0%, 100% {
    box-shadow: 0 0 3px rgba(16, 185, 129, 0.3);
    filter: brightness(0.88);
    transform: scale(0.96);
    opacity: 0.78;
  }
  50% {
    box-shadow: 0 0 8px #10b981, 0 0 16px rgba(16, 185, 129, 0.6);
    filter: brightness(1.2);
    transform: scale(1.06);
    opacity: 1;
  }
}
.panel-tabs__badge--success {
  animation: greenBadgePulse 2.2s ease-in-out infinite !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 999px !important;
}

`;

export function PanelTabs({ groups, active, onChange }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const activeGroup = groups.find((g) => g.items.some((i) => i.key === active));
  const activeItem = activeGroup?.items.find((i) => i.key === active);

  const handlePick = (key: PanelTabKey) => {
    onChange(key);
    setOpenGroup(null);
    setMobileOpen(false);
  };

  return (
    <div ref={rootRef} className="panel-tabs reveal visible">
      <style>{dangerPulseStyle}</style>
      {/* Mobile trigger */}
      <button
        type="button"
        className="panel-tabs__mobile-trigger"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
      >
        <span className="panel-tabs__mobile-icon">{activeItem?.icon ?? "☰"}</span>
        <span className="panel-tabs__mobile-text">
          <small>{activeGroup?.label ?? "Menu"}</small>
          <strong>{activeItem?.label ?? "Wybierz"}</strong>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>

      <div className={`panel-tabs__bar${mobileOpen ? " is-open" : ""}`}>
        {groups.map((group) => {
          const isActiveGroup = activeGroup?.id === group.id;
          const isOpen = openGroup === group.id;
          const groupBadge = group.items.reduce((s, i) => s + (i.excludeFromGroupBadge ? 0 : (i.badge ?? 0)), 0);
          return (
            <div
              key={group.id}
              className={`panel-tabs__group${isActiveGroup ? " is-active" : ""}${isOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="panel-tabs__group-btn"
                onClick={() => setOpenGroup(isOpen ? null : group.id)}
                onMouseEnter={() => setOpenGroup(group.id)}
                aria-expanded={isOpen}
              >
                <span className="panel-tabs__group-icon">{group.icon}</span>
                <span className="panel-tabs__group-label">{group.label}</span>
                {groupBadge > 0 && <span className="panel-tabs__badge">{groupBadge}</span>}
                <svg className="panel-tabs__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>

              <div className="panel-tabs__menu" onMouseLeave={() => setOpenGroup(null)}>
                <div className="panel-tabs__menu-inner">
                  {group.items.map((item) => {
                    const isActive = item.key === active;
                    const hasBadge = typeof item.badge === "number";
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handlePick(item.key)}
                        className={`panel-tabs__item${isActive ? " is-active" : ""}`}
                      >
                        <span className="panel-tabs__item-icon">{item.icon}</span>
                        <span className="panel-tabs__item-label">{item.label}</span>
                        {hasBadge ? (
                          <span
                            className={`panel-tabs__badge ${item.badgeVariant === "danger" ? "panel-tabs__badge--danger" : item.badgeVariant === "success" ? "panel-tabs__badge--success" : ""}`}
                            style={
                              item.badgeVariant === "danger" ? {
                                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                                color: "#fff",
                                boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
                              } : item.badgeVariant === "success" ? {
                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "#fff",
                                boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                              } : undefined
                            }
                          >
                            {item.badge}
                          </span>
                        ) : null}
                        {isActive && <span className="panel-tabs__item-dot" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
