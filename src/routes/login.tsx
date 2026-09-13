import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/user-roles";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: { zgloszenie?: string }): { zgloszenie?: string } =>
    search.zgloszenie === "1" ? { zgloszenie: "1" } : {},
  head: () => ({
    meta: [
      { title: "Logowanie — TymekIT" },
      { name: "description", content: "Zaloguj się do panelu TymekIT i sprawdź status swojego zgłoszenia serwisowego." },
      { property: "og:title", content: "Logowanie — TymekIT" },
      { property: "og:description", content: "Sprawdź status swojego zgłoszenia w panelu klienta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { zgloszenie } = Route.useSearch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let email = identifier.trim();
    if (!email.includes("@")) {
      const { data: resolved, error: rpcErr } = await supabase.rpc("get_email_by_username", { _username: email });
      if (rpcErr || !resolved) {
        toast.error("Nie znaleziono użytkownika o takim loginie");
        setLoading(false);
        return;
      }
      email = resolved as string;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const isAdmin = await isAdminUser(data.user.id);
    toast.success("Zalogowano");
    navigate({ to: isAdmin ? "/panel-admin" : "/panel-klienta" });
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <div>
          <Link to="/" className="brand"><span className="brand-mark"></span><span className="brand-name">TymekIT<small>Tymek</small></span></Link>
        </div>
        <div>
          <h2 className="text-grad">Witaj ponownie.</h2>
          <p className="text-dim">Wróć do zgłoszeń, ustaleń serwisowych, wycen i informacji o naprawie sprzętu.</p>
        </div>
        <div className="text-mute" style={{ fontSize: 13 }}>© TymekIT Tymek</div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form reveal visible">
          {zgloszenie === "1" && (
            <div
              className="glass"
              style={{ padding: "14px 16px", borderRadius: 14, marginBottom: 18, fontSize: 14 }}
            >
              Zgłoszenie wysłane! Zaloguj się, aby zobaczyć status swojego zgłoszenia.
            </div>
          )}
          <h1>Zaloguj się</h1>
          <p className="muted">Jesteś tu pierwszy raz? <Link to="/register" style={{ color: "var(--brand)" }}>Utwórz konto</Link></p>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Login lub e-mail</label><input type="text" className="form-control" required placeholder="tymek123 lub twoj@email.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username"/></div>
            <div className="form-group"><label>Hasło</label><input type="password" className="form-control" required placeholder="Twoje hasło" value={password} onChange={(e) => setPassword(e.target.value)}/></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 20px" }}>
              <label className="checkbox-row"><input type="checkbox"/> Zostań zalogowany</label>
              <Link to="/admin" style={{ color: "var(--brand)", fontSize: 14 }}>Jesteś adminem?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Logowanie..." : "Zaloguj się"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
