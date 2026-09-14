import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  reputation_score: number;
  client_level: string;
  notes: string | null;
  is_blacklisted: boolean;
};

const LEVELS = [
  "Zwykły klient",
  "Klient VIP",
  "Problematyczny klient",
  "Zaufany klient",
  "Nowy klient",
] as const;

const LEVEL_COLOR: Record<string, string> = {
  "Zwykły klient": "var(--text-mute)",
  "Nowy klient": "var(--text-mute)",
  "Zaufany klient": "var(--brand)",
  "Klient VIP": "#f59e0b",
  VIP: "#f59e0b",
  "Problematyczny klient": "#ff6b6b",
  Problemowy: "#ff6b6b",
};

export function ReputationBadge({
  userId,
  editable = false,
}: {
  userId: string;
  editable?: boolean;
}) {
  const [p, setP] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    reputation_score: 0,
    client_level: "Zwykły klient",
    notes: "",
    is_blacklisted: false,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,email,username,reputation_score,client_level,notes,is_blacklisted")
      .eq("id", userId)
      .maybeSingle();

    if (data) {
      const normalizedLevel =
        data.client_level === "VIP"
          ? "Klient VIP"
          : data.client_level === "Problemowy"
          ? "Problematyczny klient"
          : data.client_level || "Zwykły klient";

      setP({ ...(data as Profile), client_level: normalizedLevel });
      setForm({
        reputation_score: data.reputation_score ?? 0,
        client_level: normalizedLevel,
        notes: data.notes ?? "",
        is_blacklisted: !!data.is_blacklisted,
      });
    } else {
      setP({
        id: userId,
        email: null,
        username: null,
        reputation_score: 0,
        client_level: "Zwykły klient",
        notes: null,
        is_blacklisted: false,
      });
      setForm({
        reputation_score: 0,
        client_level: "Zwykły klient",
        notes: "",
        is_blacklisted: false,
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const currentLevel = p?.client_level || form.client_level || "Zwykły klient";
  const currentScore = p?.reputation_score ?? form.reputation_score ?? 0;
  const isBlacklisted = p?.is_blacklisted ?? form.is_blacklisted ?? false;
  const color = LEVEL_COLOR[currentLevel] ?? "var(--text-mute)";

  const save = async () => {
    if (!userId) {
      toast.error("Brak ID użytkownika dla tego zgłoszenia");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        reputation_score: form.reputation_score,
        client_level: form.client_level,
        notes: form.notes || null,
        is_blacklisted: form.is_blacklisted,
      });

    if (error) {
      toast.error("Błąd zapisu: " + error.message);
    } else {
      toast.success("Reputacja klienta zaktualizowana!");
      setOpen(false);
      load();
    }
    setSaving(false);
  };

  const icon = isBlacklisted
    ? "⛔"
    : currentLevel.includes("VIP")
    ? "⭐"
    : currentLevel.includes("Problematyczny")
    ? "⚠️"
    : currentLevel.includes("Zaufany")
    ? "🛡️"
    : "👤";

  return (
    <>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => editable && setOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 999,
            background: "var(--surface-2)",
            border: ,
            fontSize: 11,
            color,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            fontWeight: 700,
            cursor: editable ? "pointer" : "default",
            transition: "all 0.15s ease",
          }}
          title={editable ? "Kliknij, aby zmienić reputację klienta" : (p?.notes ?? "")}
        >
          <span>{icon}</span>
          <span>{currentLevel}</span>
          <span style={{ opacity: 0.6 }}>·</span>
          <span>{currentScore} pkt</span>
          {editable && (
            <span style={{ fontSize: 10, opacity: 0.75, marginLeft: 2 }}>✏️ Zmień</span>
          )}
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent style={{ maxWidth: 460 }}>
          <AlertDialogHeader>
            <AlertDialogTitle>Zmień reputację klienta</AlertDialogTitle>
          </AlertDialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, margin: "12px 0" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>
                Ilość punktów reputacji
              </label>
              <input
                type="number"
                className="form-control"
                value={form.reputation_score}
                onChange={(e) =>
                  setForm({ ...form, reputation_score: parseInt(e.target.value || "0", 10) })
                }
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>
                Status / Ranga klienta
              </label>
              <select
                className="form-control"
                value={form.client_level}
                onChange={(e) => setForm({ ...form, client_level: e.target.value })}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, display: "block" }}>
                Prywatna notatka o kliencie
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Np. stały klient, polecony przez znajomego..."
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: form.is_blacklisted ? "#ff6b6b" : "var(--text-dim)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.is_blacklisted}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_blacklisted: e.target.checked,
                    client_level: e.target.checked ? "Problematyczny klient" : form.client_level,
                  })
                }
              />
              ⛔ Oznacz jako klient na czarnej liście
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                save();
              }}
              disabled={saving}
            >
              {saving ? "Zapisywanie..." : "Zapisz zmiany"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
