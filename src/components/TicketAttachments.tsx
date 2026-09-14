import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Attachment = {
  id: string;
  ticket_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4", "video/webm", "video/quicktime"];
const MAX_FILE = 25 * 1024 * 1024;
const MAX_FILES = 5;

export function TicketAttachments({
  ticketId,
  ownerId,
  canUpload,
}: {
  ticketId: string;
  ownerId: string;
  canUpload: boolean;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (error) return;
    const list = (data ?? []) as Attachment[];
    setItems(list);
    if (list.length > 0) {
      const { data: signed } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrls(list.map((i) => i.file_path), 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s, i) => {
        if (s.signedUrl) map[list[i].id] = s.signedUrl;
      });
      setUrls(map);
    } else {
      setUrls({});
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (items.length + files.length > MAX_FILES) {
      toast.error(`Limit ${MAX_FILES} plików na zgłoszenie`);
      return;
    }
    setUploading(true);
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: niedozwolony typ`);
        continue;
      }
      if (f.size > MAX_FILE) {
        toast.error(`${f.name}: max 10MB`);
        continue;
      }
      const ext = f.name.split(".").pop() ?? "bin";
      const path = `${ownerId}/${ticketId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) {
        toast.error(`${f.name}: ${upErr.message}`);
        continue;
      }
      const { error: insErr } = await supabase.from("ticket_attachments").insert({
        ticket_id: ticketId,
        user_id: ownerId,
        file_path: path,
        file_name: f.name,
        mime_type: f.type,
        size_bytes: f.size,
      });
      if (insErr) {
        toast.error(insErr.message);
        await supabase.storage.from("ticket-attachments").remove([path]);
      }
    }
    setUploading(false);
    toast.success("Pliki wgrane");
    load();
  };

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-mute)" }}>
          Załączniki ({items.length}/{MAX_FILES})
        </div>
        {canUpload && items.length < MAX_FILES && (
          <label className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>
            {uploading ? "Wgrywam..." : "+ Dodaj plik"}
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        )}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-mute)" }}>Brak załączników.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
          {items.map((it) => {
            const url = urls[it.id];
            const isImg = it.mime_type.startsWith("image/");
            return (
              <a
                key={it.id}
                href={url}
                target="_blank"
                rel="noreferrer"
                title={it.file_name}
                style={{
                  display: "block",
                  aspectRatio: "1",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  position: "relative",
                }}
              >
                {isImg && url ? (
                  <img src={url} alt={it.file_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", padding: 6, textAlign: "center" }}>
                    <div style={{ fontSize: 22 }}>📄</div>
                    <div style={{ fontSize: 9, color: "var(--text-dim)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>{it.file_name}</div>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
