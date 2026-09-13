import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AuthGuard({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: AppRole;
}) {
  const { session, user, role, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedUser = user ?? session?.user ?? null;
  const waitingForRole = !!requireRole && !!resolvedUser && roleLoading;
  const missingUserAfterLoad = !loading && !resolvedUser;
  const missingRoleAfterLoad = !!requireRole && !!resolvedUser && !roleLoading && role === null;
  const unauthorized = !!requireRole && !!resolvedUser && !roleLoading && role !== null && role !== "admin" && role !== requireRole;

  useEffect(() => {
    console.info("[auth-debug] guard state", {
      route: location.pathname,
      requireRole: requireRole ?? null,
      hasSession: !!session,
      sessionUserId: session?.user.id ?? null,
      getUserId: user?.id ?? null,
      resolvedUserId: resolvedUser?.id ?? null,
      role,
      loading,
      roleLoading,
      missingUserAfterLoad,
      missingRoleAfterLoad,
      unauthorized,
    });
  }, [location.pathname, requireRole, session, user, resolvedUser, role, loading, roleLoading, missingUserAfterLoad, missingRoleAfterLoad, unauthorized]);

  useEffect(() => {
    if (loading || waitingForRole) return;
    if (missingUserAfterLoad) {
      console.info("[auth-debug] redirecting to login", { route: location.pathname, requireRole: requireRole ?? null });
      navigate({ to: "/login" });
      return;
    }
    if (missingRoleAfterLoad) {
      console.warn("[auth-debug] user has no resolved role after loading", {
        route: location.pathname,
        userId: resolvedUser?.id ?? null,
      });
    }
    if (unauthorized) {
      toast.error("Brak uprawnień do tej strony");
    }
  }, [loading, waitingForRole, missingUserAfterLoad, missingRoleAfterLoad, unauthorized, location.pathname, requireRole, navigate, resolvedUser?.id]);

  if (loading || waitingForRole) {
    return (
      <section className="page-hero">
        <div className="container">
          <p className="text-dim">Ładowanie…</p>
        </div>
      </section>
    );
  }

  if (missingUserAfterLoad) return null;

  if (missingRoleAfterLoad || unauthorized) {
    return (
      <section className="page-hero">
        <div className="container">
          <h1>Brak dostępu</h1>
          <p className="text-dim">To konto nie ma uprawnień do tej strony.</p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

export function LogoutButton() {
  const navigate = useNavigate();
  return (
    <button
      className="btn btn-ghost"
      onClick={async () => {
        await supabase.auth.signOut();
        toast.success("Wylogowano");
        navigate({ to: "/" });
      }}
    >
      Wyloguj się
    </button>
  );
}
