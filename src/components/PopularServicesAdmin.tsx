import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SERVICES = [
  "Naprawa komputera",
  "Czyszczenie i optymalizacja",
  "Instalacja systemu",
  "Komputer na zamówienie",
  "Naprawa laptopa",
  "Modernizacja sprzętu",
  "Sieć Wi-Fi",
  "Pomoc zdalna",
];

export function PopularServicesAdmin() {
  const [popular, setPopular] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("popular_services").select("service_name");
    if (error) toast.error(error.message);
    else setPopular(new Set((data ?? []).map((r: any) => r.service_name)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("popular_services_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "popular_services" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const toggle = async (name: string) => {
    setBusy(name);
    const isPop = popular.has(name);
    if (isPop) {
      const { error } = await supabase.from("popular_services").delete().eq("service_name", name);
      if (error) toast.error(error.message);
      else toast.success("Oznaczenie usunięte");
    } else {
      const { error } = await supabase.from("popular_services").insert({ service_name: name });
      if (error) toast.error(error.message);
      else toast.success("Oznaczono jako często wybieraną");
    }
    setBusy(null);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 18 }}>Popularne usługi</h3>
        <p className="text-dim" style={{ fontSize: 13, marginTop: 6 }}>
          Kliknij usługę, aby oznaczyć ją jako „często wybieraną”. Podświetli się na stronie głównej w cenniku.
        </p>
      </div>
      {loading ? (
        <p className="text-dim" style={{ fontSize: 13 }}>Ładowanie…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {SERVICES.map((name) => {
            const active = popular.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                disabled={busy === name}
                className={active ? "btn btn-primary" : "btn btn-ghost"}
                style={{
                  justifyContent: "flex-start",
                  padding: "14px 16px",
                  borderRadius: 14,
                  fontSize: 13,
                  textAlign: "left",
                  opacity: busy === name ? 0.6 : 1,
                  border: active ? undefined : "1px solid var(--border, rgba(255,255,255,0.08))",
                }}
              >
                <span style={{ marginRight: 8 }}>{active ? "★" : "☆"}</span>
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
