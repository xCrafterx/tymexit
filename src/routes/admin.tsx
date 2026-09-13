import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminUser } from "@/lib/user-roles";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — TymekIT" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const isAdmin = await isAdminUser(data.user.id);
    if (!isAdmin) {
      await supabase.auth.signOut();
      toast.error("To konto nie ma uprawnień administratora");
      setLoading(false);
      return;
    }
    toast.success("Zalogowano jako admin");
    navigate({ to: "/panel-admin" });
  };

  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <div>
          <Link to="/" className="brand"><span className="brand-mark"></span><span className="brand-name">TymekIT<small>Admin</small></span></Link>
        </div>
        <div>
          <h2 className="text-grad">Strefa administratora.</h2>
          <p className="text-dim">Zarządzaj zgłoszeniami klientów, cennikiem, terminami napraw i panelem serwisowym TymekIT.</p>
        </div>
        <div className="text-mute" style={{ fontSize: 13 }}>© TymekIT Tymek</div>
      </aside>

      <div className="auth-form-wrap">
        <div className="auth-form reveal visible">
          <h1>Logowanie admina</h1>
          <p className="muted">Dostęp wyłącznie dla autoryzowanych kont.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>E-mail admina</label><input type="email" className="form-control" required placeholder="admin@techit.pl" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
            <div className="form-group"><label>Hasło</label><input type="password" className="form-control" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/></div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {loading ? "Logowanie..." : "Wejdź do panelu admina"}
            </button>
          </form>
          <p className="text-mute" style={{ fontSize: 12, marginTop: 18 }}>Nie jesteś adminem? <Link to="/login" style={{ color: "var(--brand)" }}>Wróć do logowania klienta</Link></p>
        </div>
      </div>
    </div>
  );
}
