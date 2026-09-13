import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRoles, resolvePrimaryRole } from "@/lib/user-roles";

export type AppRole = "admin" | "client";

type AuthProfile = {
  id: string;
  email: string | null;
  username: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: AuthProfile | null;
  loading: boolean; // session still being resolved
  roleLoading: boolean; // role still being fetched
  signOut: () => Promise<unknown>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const lastUserId = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchUserContext = async (userId: string, sessionUser: User | null) => {
    const requestId = ++requestIdRef.current;
    setRoleLoading(true);
    try {
      const [{ data: userData, error: userError }, { data: profileData, error: profileError }, roles] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("profiles").select("id,email,username").eq("id", userId).maybeSingle(),
        fetchUserRoles(userId),
      ]);

      if (requestId !== requestIdRef.current || lastUserId.current !== userId) return;

      const resolvedUser = userData.user ?? sessionUser ?? null;
      const resolvedRole = resolvePrimaryRole(roles);

      setUser(resolvedUser);
      setProfile((profileData as AuthProfile | null) ?? null);
      setRole(resolvedRole);

      console.info("[auth-debug] user context loaded", {
        sessionUserId: sessionUser?.id ?? null,
        getUserId: resolvedUser?.id ?? null,
        email: resolvedUser?.email ?? sessionUser?.email ?? null,
        profileLoaded: !!profileData,
        roles,
        resolvedRole,
        userError: userError?.message ?? null,
        profileError: profileError?.message ?? null,
      });
    } catch (error) {
      if (requestId !== requestIdRef.current || lastUserId.current !== userId) return;
      setUser(sessionUser ?? null);
      setProfile(null);
      setRole(null);
      console.error("[auth-debug] failed to load user context", error);
    } finally {
      if (requestId === requestIdRef.current && lastUserId.current === userId) {
        setRoleLoading(false);
      }
    }
  };

  const applySession = (s: Session | null, source: string) => {
    setSession(s);
    setUser(s?.user ?? null);
    const uid = s?.user.id ?? null;
    console.info("[auth-debug] applySession", {
      source,
      hasSession: !!s,
      sessionUserId: uid,
      email: s?.user.email ?? null,
    });

    if (uid && s && uid !== lastUserId.current) {
      lastUserId.current = uid;
      void fetchUserContext(uid, s.user);
    } else if (uid && s && uid === lastUserId.current) {
      setUser(s.user);
    } else if (!uid) {
      requestIdRef.current += 1;
      lastUserId.current = null;
      setUser(null);
      setRole(null);
      setProfile(null);
      setRoleLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.info("[auth-debug] onAuthStateChange", {
        event,
        hasSession: !!s,
        sessionUserId: s?.user.id ?? null,
        email: s?.user.email ?? null,
      });
      applySession(s, `onAuthStateChange:${event}`);
    });

    void supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      console.info("[auth-debug] getSession", {
        hasSession: !!s,
        sessionUserId: s?.user.id ?? null,
        email: s?.user.email ?? null,
        error: error?.message ?? null,
      });
      applySession(s, "getSession");
    }).finally(() => {
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user,
    role,
    profile,
    loading,
    roleLoading,
    signOut: () => supabase.auth.signOut(),
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;
  // Fallback (shouldn't happen if provider wired)
  return {
    session: null,
    user: null,
    role: null,
    profile: null,
    loading: true,
    roleLoading: false,
    signOut: () => supabase.auth.signOut(),
  };
}
