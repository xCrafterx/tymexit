import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminAccount = {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  role: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  provider: string;
  ticketCount: number;
  reviewCount: number;
  isBlacklisted: boolean;
  suspicious: string[];
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Brak uprawnień administratora");
}

export const listClientAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAccount[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: tickets }, { data: reviews }, { data: roleRows }, authList] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,email,username,first_name,last_name,role,created_at,is_blacklisted"),
      supabaseAdmin.from("tickets").select("user_id,client_name,client_phone,source,deleted_at"),
      supabaseAdmin.from("reviews").select("user_id"),
      supabaseAdmin.from("user_roles").select("user_id,role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const authUsers = new Map(
      (authList.data?.users ?? []).map((u) => [u.id, u]),
    );

    const realSources = ["ocena_strony", "odwiedziny_strony", "pobranie_programu"];
    const ticketStats = new Map<string, { count: number; name: string | null; phone: string | null }>();
    (tickets ?? []).forEach((t: any) => {
      if (realSources.includes(t.source ?? "")) return;
      const cur = ticketStats.get(t.user_id) ?? { count: 0, name: null, phone: null };
      if (!t.deleted_at) cur.count += 1;
      if (!cur.name && t.client_name) cur.name = t.client_name;
      if (!cur.phone && t.client_phone) cur.phone = t.client_phone;
      ticketStats.set(t.user_id, cur);
    });

    const reviewCounts = new Map<string, number>();
    (reviews ?? []).forEach((r: any) => {
      reviewCounts.set(r.user_id, (reviewCounts.get(r.user_id) ?? 0) + 1);
    });

    const roles = new Map<string, string>();
    (roleRows ?? []).forEach((row: any) => {
      if (row.role === "admin" || !roles.has(row.user_id)) roles.set(row.user_id, row.role);
    });

    return (profiles ?? []).map((p: any) => {
      const au = authUsers.get(p.id);
      const stats = ticketStats.get(p.id);
      const email: string | null = p.email ?? au?.email ?? null;
      const firstName: string | null = p.first_name?.trim() || null;
      const lastName: string | null = p.last_name?.trim() || null;
      const profileName = [firstName, lastName].filter(Boolean).join(" ") || null;
      const suspicious: string[] = [];
      if (!au?.email_confirmed_at) suspicious.push("Email niepotwierdzony");
      if (!au?.last_sign_in_at) suspicious.push("Nigdy się nie zalogował");
      if (!(stats?.count ?? 0) && !(reviewCounts.get(p.id) ?? 0)) suspicious.push("Brak aktywności");
      if (email && /^(test|abc|asd|qwe|xxx|aaa|fake|spam)/i.test(email)) suspicious.push("Podejrzany adres e-mail");
      if (!profileName && !stats?.name) suspicious.push("Brak imienia i nazwiska");

      return {
        id: p.id,
        email,
        username: p.username ?? null,
        firstName,
        lastName,
        fullName: profileName ?? stats?.name ?? null,
        phone: stats?.phone ?? null,
        role: roles.get(p.id) ?? p.role ?? "client",
        createdAt: p.created_at ?? au?.created_at ?? null,
        lastSignInAt: au?.last_sign_in_at ?? null,
        emailConfirmed: !!au?.email_confirmed_at,
        provider: (au?.app_metadata?.provider as string) ?? "email",
        ticketCount: stats?.count ?? 0,
        reviewCount: reviewCounts.get(p.id) ?? 0,
        isBlacklisted: !!p.is_blacklisted,
        suspicious,
      };
    }).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  });

export const updateAccountDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; firstName: string; lastName: string; email: string }) => {
    const userId = input?.userId?.trim();
    const firstName = input?.firstName?.trim();
    const lastName = input?.lastName?.trim();
    const email = input?.email?.trim().toLowerCase();
    if (!userId) throw new Error("Brak identyfikatora konta");
    if (!firstName || firstName.length > 80) throw new Error("Podaj poprawne imię");
    if (!lastName || lastName.length > 100) throw new Error("Podaj poprawne nazwisko");
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Podaj poprawny adres e-mail");
    return { userId, firstName, lastName, email };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: target, error: targetError } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (targetError || !target.user) throw new Error("Nie znaleziono tego konta");

    if ((target.user.email ?? "").toLowerCase() !== data.email) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        email: data.email,
        email_confirm: true,
      });
      if (authError) {
        if (/already|registered|exists/i.test(authError.message)) throw new Error("Ten adres e-mail jest już zajęty");
        throw new Error(authError.message);
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ email: data.email, first_name: data.firstName, last_name: data.lastName })
      .eq("id", data.userId);
    if (profileError) throw new Error(profileError.message);

    return {
      id: data.userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
    };
  });

export const deleteClientAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!input?.userId) throw new Error("Brak identyfikatora konta");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("Nie możesz usunąć własnego konta administratora");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isTargetAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: data.userId, _role: "admin" });
    if (isTargetAdmin) throw new Error("Nie można usunąć konta administratora");

    // Usuwamy powiązane dane, aby klucze obce nie zablokowały usunięcia konta
    await supabaseAdmin.from("reviews").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("support_chats").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("tickets").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
