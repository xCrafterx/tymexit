import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/user-roles";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Utwórz konto — Tymek Informatyk" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      toast.error("Hasła nie są identyczne");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/panel-klienta` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Konto utworzone");
    if (data.session) {
      const isAdmin = await isAdminUser(data.user!.id);
      navigate({ to: isAdmin ? "/panel-admin" : "/panel-klienta" });
    } else {
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <div>
          <Link to="/" className="brand"><span className="brand-mark"></span><span className="brand-name">TymekIT<small>Tymek</small></span></Link>
        </div>
        <div>
          <h2 className="text-grad">Panel klienta TymekIT.</h2>
          <p className="text-dim">Zgłaszaj naprawy, sprawdzaj ustalenia, opisuj problemy i zarządzaj usługami IT z jednego konta.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "28px 0 0", display: "grid", gap: 12 }}>
            {["Historia zgłoszeń i napraw","Przypomnienia SMS i WhatsApp","Pomoc zdalna z informatykiem"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--grad-emerald)", display: "grid", placeItems: "center", color: "#04060c", fontSize: 11, fontWeight: 700 }}>✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-mute" style={{ fontSize: 13 }}>© TymekIT Tymek</div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form reveal visible">
          <h1>Utwórz konto</h1>
          <p className="muted">Masz już konto? <Link to="/login" style={{ color: "var(--brand)" }}>Zaloguj się</Link></p>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>E-mail</label><input type="email" className="form-control" required placeholder="twoj@email.com" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
            <div className="form-group"><label>Hasło</label><input type="password" className="form-control" required minLength={8} placeholder="Minimum 8 znaków" value={password} onChange={(e) => setPassword(e.target.value)}/></div>
            <div className="form-group"><label>Powtórz hasło</label><input type="password" className="form-control" required placeholder="Powtórz hasło" value={password2} onChange={(e) => setPassword2(e.target.value)}/></div>
            <label className="checkbox-row" style={{ margin: "8px 0 20px" }}><input type="checkbox" required/> Akceptuję <a href="#" style={{ color: "var(--brand)" }}>regulamin</a> i <a href="#" style={{ color: "var(--brand)" }}>politykę prywatności</a></label>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Tworzenie..." : "Utwórz konto"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
