import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AccountSettings() {
  const { session } = useAuth();
  const [username, setUsername] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [email, setEmail] = useState(session?.user.email ?? "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loadingU, setLoadingU] = useState(false);
  const [loadingE, setLoadingE] = useState(false);
  const [loadingP, setLoadingP] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        const u = (data?.username as string | null) ?? "";
        setUsername(u);
        setInitialUsername(u);
      });
  }, [session]);

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const u = username.trim();
    if (u && !/^[a-zA-Z0-9_.-]{3,32}$/.test(u)) {
      toast.error("Login: 3–32 znaków, dozwolone litery, cyfry, . _ -");
      return;
    }
    setLoadingU(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: u || null })
      .eq("id", session.user.id);
    setLoadingU(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Ten login jest zajęty" : error.message);
      return;
    }
    setInitialUsername(u);
    toast.success("Login zapisany");
  };

  const saveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingE(true);
    const { error } = await supabase.auth.updateUser({ email });
    setLoadingE(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Wysłaliśmy link potwierdzający na nowy adres");
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (loadingP) return;
    if (password.length < 8) {
      setPwMsg({ type: "err", text: "Hasło musi mieć min. 8 znaków" });
      toast.error("Hasło musi mieć min. 8 znaków");
      return;
    }
    if (password !== password2) {
      setPwMsg({ type: "err", text: "Hasła nie są identyczne" });
      toast.error("Hasła nie są identyczne");
      return;
    }
    setLoadingP(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPwMsg({ type: "err", text: error.message });
        toast.error(`Nie udało się zmienić hasła: ${error.message}`);
        return;
      }
      setPassword("");
      setPassword2("");
      setPwMsg({ type: "ok", text: "Hasło zostało zmienione. Pozostajesz zalogowany." });
      toast.success("Hasło zmienione");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Nieznany błąd";
      setPwMsg({ type: "err", text: msg });
      toast.error(`Błąd: ${msg}`);
    } finally {
      setLoadingP(false);
    }
  };

  return (
    <div className="about-grid" style={{ marginTop: 0 }}>
      <div className="card reveal visible">
        <span className="eyebrow"><span className="dot"></span> Login</span>
        <h3 style={{ marginTop: 16, fontSize: "1.3rem" }}>Twój login</h3>
        <p className="text-dim">Po ustawieniu loginu możesz logować się nim zamiast adresem e-mail.</p>
        <form onSubmit={saveUsername} style={{ marginTop: 18 }}>
          <div className="form-group">
            <label>Login</label>
            <input
              className="form-control"
              placeholder="np. tymek123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
            />
          </div>
          <button
            type="submit"
            disabled={loadingU || username === initialUsername}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loadingU ? "Zapisywanie..." : "Zapisz login"}
          </button>
        </form>
      </div>

      <div className="card reveal visible" data-delay="1">
        <span className="eyebrow"><span className="dot"></span> E-mail</span>
        <h3 style={{ marginTop: 16, fontSize: "1.3rem" }}>Zmień adres e-mail</h3>
        <p className="text-dim">Po zmianie wyślemy link potwierdzający na nowy adres.</p>
        <form onSubmit={saveEmail} style={{ marginTop: 18 }}>
          <div className="form-group">
            <label>Nowy e-mail</label>
            <input
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loadingE || email === session?.user.email}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loadingE ? "Wysyłanie..." : "Zaktualizuj e-mail"}
          </button>
        </form>
      </div>

      <div className="card reveal visible" data-delay="2">
        <span className="eyebrow"><span className="dot"></span> Hasło</span>
        <h3 style={{ marginTop: 16, fontSize: "1.3rem" }}>Zmień hasło</h3>
        <p className="text-dim">Minimum 8 znaków. Po zmianie pozostaniesz zalogowany.</p>
        <form onSubmit={savePassword} style={{ marginTop: 18 }} aria-busy={loadingP}>
          <fieldset disabled={loadingP} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="form-group">
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Nowe hasło</span>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    color: "var(--brand)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  aria-pressed={showPw}
                >
                  {showPw ? "Ukryj" : "Pokaż"} hasło
                </button>
              </label>
              <input
                type={showPw ? "text" : "password"}
                className="form-control"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwMsg) setPwMsg(null); }}
              />
            </div>
            <div className="form-group">
              <label>Powtórz nowe hasło</label>
              <input
                type={showPw ? "text" : "password"}
                className="form-control"
                required
                minLength={8}
                autoComplete="new-password"
                value={password2}
                onChange={(e) => { setPassword2(e.target.value); if (pwMsg) setPwMsg(null); }}
              />
            </div>
            {pwMsg && (
              <div
                role={pwMsg.type === "err" ? "alert" : "status"}
                aria-live="polite"
                style={{
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 12,
                  fontSize: 13,
                  border: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  color: pwMsg.type === "ok" ? "var(--brand-3)" : "#ff6b6b",
                }}
              >
                {pwMsg.type === "ok" ? "✓ " : "⚠ "}{pwMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={loadingP || password.length < 8 || password !== password2}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loadingP ? "Zapisywanie..." : "Zmień hasło"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
