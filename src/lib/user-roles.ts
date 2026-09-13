import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useAuth";

export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (error) {
    console.error("[auth-debug] failed to fetch user roles", {
      userId,
      error: error.message,
    });
    return [];
  }

  return (data ?? []).map((entry) => entry.role as AppRole);
}

export function resolvePrimaryRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("client")) return "client";
  return null;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const roles = await fetchUserRoles(userId);
  return roles.includes("admin");
}