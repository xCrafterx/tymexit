import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listClientAccounts, deleteClientAccount, type AdminAccount } from "@/lib/admin-accounts.functions";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pl-PL");
}

export function AdminAccounts() {
  const load = useServerFn(listClientAccounts);
  const remove = useServerFn(deleteClientAccount);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await load({}));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się pobrać kont");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (onlySuspicious && a.suspicious.length < 2) return false;
      if (!q) return true;
      return [a.email, a.fullName, a.username, a.phone].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [accounts, query, onlySuspicious]);

  const handleDelete = async (a: AdminAccount) => {
    if (!window.confirm(`Usunąć konto ${a.email ?? a.id}? Zniknie razem ze zgłoszeniami i opiniami. Tej operacji nie można cofnąć.`)) return;
    setBusy(a.id);
    try {
      await remove({ data: { userId: a.id } });
      toast.success("Konto zostało usunięte");
      setAccounts((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się usunąć konta");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
      <div className="glass" style={{ padding: 18, display: "grid", gap: 12 }}>
        <h3 style={{ margin: 0, color: "#fff", fontSize: 18 }}>👥 Konta klientów ({accounts.length})</h3>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,.65)" }}>
          Hasła klientów są zapisywane wyłącznie w postaci zaszyfrowanej (hash) i nikt — łącznie z Tobą — nie może ich odczytać.
          Zamiast hasła pokazuję sygnały, po których poznasz fejkowe konto: potwierdzenie e-maila, ostatnie logowanie, liczbę zgłoszeń i opinii.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="form-control"
            placeholder="Szukaj: e-mail, imię, telefon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,.8)" }}>
            <input type="checkbox" checked={onlySuspicious} onChange={(e) => setOnlySuspicious(e.target.checked)} />
            Tylko podejrzane
          </label>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => void refresh()}>↻ Odśwież</button>
        </div>
      </div>

      {loading ? (
        <p className="text-dim">Ładowanie kont…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.5)" }}>Brak kont do wyświetlenia.</div>
      ) : (
        filtered.map((a) => {
          const flagged = a.suspicious.length >= 2;
          return (
            <div
              key={a.id}
              style={{
                background: flagged ? "rgba(239,68,68,.06)" : "rgba(255,255,255,.04)",
                border: `1px solid ${flagged ? "rgba(239,68,68,.28)" : "rgba(255,255,255,.1)"}`,
                borderRadius: 12,
                padding: 18,
                display: "grid",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: 0, color: "#fff", fontSize: 17 }}>
                    {a.fullName || a.username || "Brak imienia i nazwiska"}
                    {a.role === "admin" && <span style={{ marginLeft: 8, fontSize: 11, color: "#a78bfa" }}>ADMIN</span>}
                  </h4>
                  <p style={{ margin: "4px 0 0", color: "#67e8f9", fontSize: 14 }}>✉️ {a.email ?? "brak e-maila"}</p>
                  {a.phone && <p style={{ margin: "2px 0 0", color: "rgba(255,255,255,.7)", fontSize: 13 }}>📞 {a.phone}</p>}
                </div>
                {a.role !== "admin" && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={busy === a.id}
                    onClick={() => void handleDelete(a)}
                    style={{ background: "rgba(239,68,68,.2)", color: "#f87171", border: "1px solid rgba(239,68,68,.35)", alignSelf: "flex-start" }}
                  >
                    {busy === a.id ? "Usuwanie…" : "🗑️ Usuń konto"}
                  </button>
                )}
              </div>

              <div style={{ background: "rgba(0,0,0,.25)", borderRadius: 8, padding: 12, display: "grid", gap: 6, fontSize: 13, color: "rgba(255,255,255,.75)" }}>
                <div><strong>🔑 Hasło:</strong> zaszyfrowane — niemożliwe do podejrzenia</div>
                <div><strong>📅 Konto założone:</strong> {fmt(a.createdAt)}</div>
                <div><strong>🕒 Ostatnie logowanie:</strong> {fmt(a.lastSignInAt)}</div>
                <div><strong>✅ E-mail potwierdzony:</strong> {a.emailConfirmed ? "tak" : "nie"} · <strong>Sposób logowania:</strong> {a.provider}</div>
                <div><strong>📋 Zgłoszenia:</strong> {a.ticketCount} · <strong>⭐ Opinie:</strong> {a.reviewCount}</div>
              </div>

              {a.suspicious.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {a.suspicious.map((s) => (
                    <span key={s} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "rgba(239,68,68,.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,.25)" }}>
                      ⚠ {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
