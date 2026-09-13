import { useEffect, useRef, useState } from "react";

export type PanelTabKey = string;

export type PanelTabItem = {
  key: PanelTabKey;
  label: string;
  icon: string;
  badge?: number;
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
          const groupBadge = group.items.reduce((s, i) => s + (i.badge ?? 0), 0);
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
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handlePick(item.key)}
                        className={`panel-tabs__item${isActive ? " is-active" : ""}`}
                      >
                        <span className="panel-tabs__item-icon">{item.icon}</span>
                        <span className="panel-tabs__item-label">{item.label}</span>
                        {item.badge ? <span className="panel-tabs__badge">{item.badge}</span> : null}
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
