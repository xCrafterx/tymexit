import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function AdminDebugPanel() {
  const location = useLocation();
  const { session, user, role, loading, roleLoading } = useAuth();

  if (role !== "admin") return null;

  return (
    <aside
      style={{
        position: "fixed",
        left: 12,
        bottom: 12,
        zIndex: 9999,
        width: "min(320px, calc(100vw - 24px))",
        padding: 12,
        borderRadius: 12,
        background: "color-mix(in oklab, var(--surface) 92%, black)",
        border: "1px solid var(--border)",
        boxShadow: "0 18px 48px -18px rgba(0,0,0,.65)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-mute)", marginBottom: 8 }}>
        Admin debug
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: "6px 10px", fontSize: 12, color: "var(--text)" }}>
        <strong>User ID</strong>
        <span style={{ overflowWrap: "anywhere" }}>{user?.id ?? session?.user.id ?? "—"}</span>
        <strong>Email</strong>
        <span style={{ overflowWrap: "anywhere" }}>{user?.email ?? session?.user.email ?? "—"}</span>
        <strong>Role</strong>
        <span>{role ?? "—"}</span>
        <strong>authLoading</strong>
        <span>{String(loading)}</span>
        <strong>roleLoading</strong>
        <span>{String(roleLoading)}</span>
        <strong>Current route</strong>
        <span style={{ overflowWrap: "anywhere" }}>{location.pathname}</span>
      </div>
    </aside>
  );
}