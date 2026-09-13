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

const LEVELS = ["Nowy klient", "Zaufany klient", "VIP", "Problemowy"] as const;

const LEVEL_COLOR: Record<string, string> = {
  "Nowy klient": "var(--text-mute)",
  "Zaufany klient": "var(--brand)",
  VIP: "#f59e0b",
  Problemowy: "#ff6b6b",
};

export function ReputationBadge({ userId, editable = false }: { userId: string; editable?: boolean }) {
  const [p, setP] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ reputation_score: 0, client_level: "Nowy klient", notes: "", is_blacklisted: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,username,reputation_score,client_level,notes,is_blacklisted")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setP(data as Profile);
      setForm({
        reputation_score: data.reputation_score ?? 0,
        client_level: data.client_level ?? "Nowy klient",
        notes: data.notes ?? "",
        is_blacklisted: !!data.is_blacklisted,
      });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!p) return null;

  const color = LEVEL_COLOR[p.client_level] ?? "var(--text-mute)";

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        reputation_score: form.reputation_score,
        client_level: form.client_level,
        notes: form.notes || null,
        is_blacklisted: form.is_blacklisted,
      })
      .eq("id", userId);
    if (error) toast.error(error.message);
    else {
      toast.success("Reputacja zapisana");
      setOpen(false);
      load();
    }
    setSaving(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--surface-2)",
            border: `1px solid ${color}55`,
            fontSize: 11,
            color,
            textTransform: "uppercase",
            letterSpacing: ".1em",
            fontWeight: 600,
          }}
          title={p.notes ?? ""}
        >
          {p.is_blacklisted ? "⛔" : p.client_level === "VIP" ? "⭐" : "👤"} {p.client_level} · {p.reputation_score} pkt
        </span>
        {editable && (
          <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
            Edytuj
          </button>
        )}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edycja reputacji klienta</AlertDialogTitle>
          </AlertDialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Punkty reputacji</label>
              <input
                type="number"
                className="form-control"
                value={form.reputation_score}
                onChange={(e) => setForm({ ...form, reputation_score: parseInt(e.target.value || "0", 10) })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Poziom</label>
              <select className="form-control" value={form.client_level} onChange={(e) => setForm({ ...form, client_level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Notatka</label>
              <textarea
                className="form-control"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notatka admina o kliencie..."
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-dim)" }}>
              <input
                type="checkbox"
                checked={form.is_blacklisted}
                onChange={(e) => setForm({ ...form, is_blacklisted: e.target.checked, client_level: e.target.checked ? "Problemowy" : form.client_level })}
              />
              Klient na czarnej liście
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); save(); }} disabled={saving}>
              {saving ? "Zapisywanie..." : "Zapisz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
