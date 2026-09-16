import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type VisitLog = {
  id: string;
  ip: string;
  browser: string | null;
  device: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  path: string | null;
  user_agent: string | null;
  created_at: string;
};

type IgnoredIp = {
  id: string;
  ip: string;
  created_at: string;
};

export function AdminVisitLogs() {
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [ignored, setIgnored] = useState<IgnoredIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyIp, setBusyIp] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [lg, ig] = await Promise.all([
      supabase
        .from("site_visit_logs")
        .select("id,ip,browser,device,country,region,city,path,user_agent,created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("ignored_ips").select("id,ip,created_at").order("created_at", { ascending: false }),
    ]);
    setLogs((lg.data ?? []) as VisitLog[]);
    setIgnored((ig.data ?? []) as IgnoredIp[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hideIp = async (ip: string) => {
    if (!confirm(`Ukryć adres ${ip}? Jego wpisy znikną z logów i licznika odwiedzin.`)) return;
    setBusyIp(ip);
    try {
      const { error } = await supabase.from("ignored_ips").insert({ ip });
      if (error && !error.message.includes("duplicate")) throw error;
      await supabase.from("site_visit_logs").delete().eq("ip", ip);
      await supabase.from("tickets").delete().eq("source", "odwiedziny_strony").eq("client_email", ip);
      toast.success(`Adres ${ip} został ukryty.`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Nie udało się ukryć tego adresu IP.");
    } finally {
      setBusyIp(null);
    }
  };

  const unhideIp = async (id: string, ip: string) => {
    setBusyIp(ip);
    try {
      const { error } = await supabase.from("ignored_ips").delete().eq("id", id);
      if (error) throw error;
      toast.success(`Adres ${ip} znów jest rejestrowany.`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Nie udało się przywrócić tego adresu IP.");
    } finally {
      setBusyIp(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.ip, l.browser, l.device, l.city, l.region, l.country, l.path]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [logs, query]);

  const uniqueIps = useMemo(() => new Set(logs.map((l) => l.ip)).size, [logs]);

  return (
    <div className="reveal visible" style={{ marginTop: 24, display: "grid", gap: 20 }}>
      <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 26 }}>🛰</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ margin: 0, fontSize: 20, color: "#fff" }}>Logi odwiedzin</h3>
            <p className="text-dim" style={{ margin: 0, fontSize: 14 }}>
              {loading ? "Ładowanie..." : `${logs.length} wpisów · ${uniqueIps} unikalnych adresów IP · boty są odfiltrowane`}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={load} disabled={loading}>Odśwież</button>
        </div>

        <input
          className="form-control"
          placeholder="Szukaj po IP, mieście, przeglądarce..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginTop: 18 }}
        />

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          {!loading && filtered.length === 0 && (
            <p className="text-dim" style={{ margin: 0 }}>Brak zarejestrowanych odwiedzin.</p>
          )}
          {filtered.map((l) => {
            const place = [l.city, l.region, l.country].filter(Boolean).join(", ") || "Lokalizacja nieznana";
            return (
              <div
                key={l.id}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "grid", gap: 4, minWidth: 220, flex: 1 }}>
                  <strong style={{ color: "#fff", fontSize: 15 }}>{l.ip}</strong>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                    📍 {place}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                    🖥 {l.browser || "?"} · {l.device || "?"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    🕒 {new Date(l.created_at).toLocaleString("pl-PL")} · {l.path || "/"}
                  </span>
                </div>
                <button
                  className="btn"
                  onClick={() => hideIp(l.ip)}
                  disabled={busyIp === l.ip}
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: busyIp === l.ip ? "not-allowed" : "pointer",
                  }}
                >
                  {busyIp === l.ip ? "Pracuję..." : "Nie pokazuj więcej tego IP"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass" style={{ padding: 24, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#fff" }}>Ukryte adresy IP ({ignored.length})</h3>
        <p className="text-dim" style={{ margin: "4px 0 16px", fontSize: 14 }}>
          Te adresy nie są logowane i nie zwiększają licznika odwiedzin.
        </p>
        {ignored.length === 0 ? (
          <p className="text-dim" style={{ margin: 0 }}>Lista jest pusta.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {ignored.map((i) => (
              <div
                key={i.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ color: "#fff", fontWeight: 600 }}>{i.ip}</span>
                <button
                  className="btn btn-ghost"
                  onClick={() => unhideIp(i.id, i.ip)}
                  disabled={busyIp === i.ip}
                >
                  {busyIp === i.ip ? "Pracuję..." : "Przywróć rejestrowanie"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminVisitLogs;
