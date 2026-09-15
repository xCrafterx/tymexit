import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/zgloszenie")({
  head: () => ({
    meta: [
      { title: "Zgłoś problem — TymekIT" },
      {
        name: "description",
        content:
          "Wyślij zgłoszenie serwisowe: opisz usterkę, dodaj zdjęcia i śledź postęp naprawy w panelu klienta TymekIT.",
      },
      { property: "og:title", content: "Zgłoś problem — TymekIT" },
      {
        property: "og:description",
        content: "Opisz usterkę, dodaj zdjęcia i śledź postęp naprawy online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    service: typeof s.service === "string" ? s.service : undefined,
    title: typeof s.title === "string" ? s.title : undefined,
    desc: typeof s.desc === "string" ? s.desc : undefined,
    priority: s.priority === "1" || s.priority === true,
    backup: s.backup === "1" || s.backup === true,
  }),
  component: ZgloszeniePage,
});

// Usługi, przy których istnieje ryzyko utraty danych
const RISKY_SERVICES = [
  "Instalacja systemu",
  "Modernizacja sprzętu",
  "Naprawa laptopa",
  "Naprawa komputera",
];


const SERVICES = [
  "Naprawa laptopa",
  "Naprawa komputera",
  "Czyszczenie i optymalizacja",
  "Instalacja systemu",
  "Komputer na zamówienie",
  "Modernizacja sprzętu",
  "Sieć Wi-Fi",
  "Pomoc zdalna",
  "Inna",
];

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const schema = z.object({
  client_name: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  client_phone: z.string().trim().min(7, "Podaj numer telefonu").max(40),
  client_email: z.string().trim().email("Niepoprawny e-mail").max(255),
  password: z.string().max(72).optional().or(z.literal("")),
  title: z.string().trim().min(3, "Podaj tytuł problemu").max(200),
  service_type: z.string().refine((v) => SERVICES.includes(v), "Wybierz typ usługi"),
  description: z.string().trim().min(10, "Opisz problem (min. 10 znaków)").max(4000),
});

function ZgloszeniePage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [otherServiceType, setOtherServiceType] = useState("");
  const [priority, setPriority] = useState(!!search.priority);
  const [backup, setBackup] = useState(!!search.backup);
  const [backupTouched, setBackupTouched] = useState(!!search.backup);
  useEffect(() => {
    if (user?.email) {
      setForm((f) => ({ ...f, client_email: f.client_email || user.email || "" }));
    }
  }, [user]);

  const [form, setForm] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    password: "",
    title: search.title ?? "",
    service_type: search.service && SERVICES.includes(search.service) ? search.service : "",
    description: search.desc ?? "",
  });

  const isRisky = RISKY_SERVICES.includes(form.service_type);

  // Sugeruj backup automatycznie przy usługach ryzykownych
  useEffect(() => {
    if (isRisky && !backupTouched) setBackup(true);
  }, [isRisky, backupTouched]);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));


  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next: File[] = [...files];
    for (const f of picked) {
      if (next.length >= MAX_FILES) {
        toast.error(`Maksymalnie ${MAX_FILES} plików`);
        break;
      }
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: dozwolone JPG, PNG, WEBP, PDF`);
        continue;
      }
      if (f.size > MAX_FILE) {
        toast.error(`${f.name}: maksymalnie 10 MB`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const d = parsed.data;
    setSubmitting(true);

    // 1. Konto klienta (lub istniejąca sesja zalogowanego użytkownika/admina)
    let userId: string | null = session?.user?.id ?? null;

    if (!userId) {
      if (!d.password || d.password.length < 8) {
        toast.error("Podaj hasło do swojego konta (min. 8 znaków)");
        setSubmitting(false);
        return;
      }
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: d.client_email,
        password: d.password,
        options: { emailRedirectTo: `${window.location.origin}/panel-klienta` },
      });

      if (signUpErr) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: d.client_email,
          password: d.password,
        });
        if (signInErr) {
          toast.error(
            "Konto z tym e-mailem już istnieje. Podaj swoje hasło do konta lub zaloguj się.",
          );
          setSubmitting(false);
          return;
        }
        userId = signInData.user.id;
      } else {
        userId = signUpData.user?.id ?? null;
        if (!signUpData.session) {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: d.client_email,
            password: d.password,
          });
          userId = signInData?.user?.id ?? userId;
        }
      }
    }

    if (!userId) {
      toast.error("Nie udało się utworzyć konta. Spróbuj ponownie.");
      setSubmitting(false);
      return;
    }

        // 2. Zgłoszenie (pobranie IP, przeglądarki i czasu)
    let clientIp = "Nieznane";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const json = await res.json();
      clientIp = json.ip;
    } catch {}

    const browserInfo = navigator.userAgent;
    const sentTime = new Date().toLocaleString("pl-PL");

    // Zapisujemy dane techniczne na końcu opisu
    const techMetadata = `\n\n--- METADATA ---\nIP: ${clientIp}\nPrzeglądarka: ${browserInfo}\nData: ${sentTime}`;

    const extrasNote = [
      priority ? "⚡ Ekspresowy priorytet (+20 zł)" : null,
      backup ? "💾 Kopia zapasowa / backup danych" : null,
    ].filter(Boolean).join("\n");

    const { data: created, error: ticketErr } = await supabase
      .from("tickets")
      .insert({
        user_id: userId,
        title: d.title,
        description: extrasNote ? `${d.description}\n\n--- OPCJE DODATKOWE ---\n${extrasNote}` : d.description,
        is_priority: priority,
        service_type: d.service_type === "Inna" && otherServiceType.trim() ? `Inne - ${otherServiceType.trim()}` : d.service_type,

        status: "oczekuje",
        client_name: d.client_name,
        client_phone: d.client_phone,
        client_email: d.client_email,
        source: "formularz",
      })
      .select("id")
      .single();

    if (ticketErr || !created) {
      toast.error(ticketErr?.message ?? "Nie udało się zapisać zgłoszenia");
      setSubmitting(false);
      return;
    }

    // 3. Załączniki
    for (const f of files) {
      const ext = f.name.split(".").pop() ?? "bin";
      const path = `${userId}/${created.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (upErr) {
        toast.error(`${f.name}: ${upErr.message}`);
        continue;
      }
      const { error: insErr } = await supabase.from("ticket_attachments").insert({
        ticket_id: created.id,
        user_id: userId,
        file_path: path,
        file_name: f.name,
        mime_type: f.type,
        size_bytes: f.size,
      });
      if (insErr) {
        await supabase.storage.from("ticket-attachments").remove([path]);
      }
    }

    if (session) {
      toast.success("Zgłoszenie zostało pomyślnie utworzone!");
      setSubmitting(false);
      navigate({ to: "/panel-admin" });
    } else {
      await supabase.auth.signOut();
      setSubmitting(false);
      navigate({ to: "/login", search: { zgloszenie: "1" } });
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb reveal visible">
            <Link to="/">Start</Link> <span>/</span> Zgłoszenie
          </div>
          <h1 className="reveal visible" data-delay="1">
            Zgłoś <span className="grad">swój problem.</span>
          </h1>
          <p className="reveal visible" data-delay="2">
            Wypełnij formularz — automatycznie założę Ci konto, żebyś mógł śledzić postęp naprawy i
            pisać ze mną na czacie.
          </p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 860 }}>
          <form className="glass" style={{ padding: 28, borderRadius: 24 }} onSubmit={handleSubmit}>
            <span className="eyebrow">
              <span className="dot"></span> Nowe zgłoszenie
            </span>

            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                marginTop: 22,
              }}
            >
              <div className="form-group">
                <label>Imię i nazwisko</label>
                <input
                  className="form-control"
                  required
                  placeholder="Jan Kowalski"
                  value={form.client_name}
                  onChange={set("client_name")}
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  className="form-control"
                  required
                  placeholder="+48 600 000 000"
                  value={form.client_phone}
                  onChange={set("client_phone")}
                />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="twoj@email.com"
                  autoComplete="email"
                  value={form.client_email}
                  onChange={set("client_email")}
                />
              </div>
              <div className="form-group">
                <label>Hasło do konta</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  minLength={8}
                  placeholder="Minimum 8 znaków"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set("password")}
                />
              </div>
              <div className="form-group">
                <label>Tytuł problemu</label>
                <input
                  className="form-control"
                  required
                  placeholder="Np. Laptop się nie uruchamia"
                  value={form.title}
                  onChange={set("title")}
                />
              </div>
              <div className="form-group">
                <label>Typ usługi</label>
                <select
                  className="form-control"
                  required
                  value={form.service_type}
                  onChange={set("service_type")}
                >
                  <option value="">Wybierz usługę…</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {form.service_type === "Inna" && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 12, color: "var(--brand-2, #f5b042)", display: "block", marginBottom: 4 }}>
                      Jaki to typ usługi? (opcjonalnie, maks. 100 znaków)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={100}
                      placeholder="np. naprawa telefonu, czyszczenie konsoli..."
                      value={otherServiceType}
                      onChange={(e) => setOtherServiceType(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Opis problemu</label>
              <textarea
                className="form-control"
                required
                rows={6}
                placeholder="Opisz co się dzieje, od kiedy i co już próbowałeś zrobić."
                value={form.description}
                onChange={set("description")}
              />
            </div>

            <div className="form-group">
              <label>Zdjęcia lub pliki (max 5)</label>
              <input
                type="file"
                className="form-control"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={pickFiles}
                disabled={files.length >= MAX_FILES}
              />
              {files.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between"
                      style={{ fontSize: 14, color: "var(--text-dim)" }}
                    >
                      <span>
                        {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        Usuń
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="glass" style={{ padding: 18, borderRadius: 16, display: "grid", gap: 12, marginBottom: 16 }}>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} style={{ width: 18, height: 18, marginTop: 3, accentColor: "var(--brand)" }} />
                <span>
                  <strong>Ekspresowy priorytet (+20 zł)</strong>
                  <span style={{ display: "block", fontSize: 13, color: "var(--text-dim)" }}>
                    Szybka diagnoza i realizacja poza kolejką.
                  </span>
                </span>
              </label>

              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={backup}
                  onChange={(e) => { setBackup(e.target.checked); setBackupTouched(true); }}
                  style={{ width: 18, height: 18, marginTop: 3, accentColor: "var(--brand)" }}
                />
                <span>
                  <strong>Kopia zapasowa / backup danych (+20 zł)</strong>
                  <span style={{ display: "block", fontSize: 13, color: "var(--text-dim)" }}>
                    Zabezpieczę Twoje zdjęcia, dokumenty i pliki przed rozpoczęciem prac.
                  </span>
                </span>
              </label>

              {isRisky && (
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(245, 176, 66, .12)", border: "1px solid rgba(245, 176, 66, .38)", color: "#f5b042", fontSize: 13 }}>
                  ⚠️ Wybrana usługa niesie ryzyko utraty danych (np. reinstalacja systemu, formatowanie,
                  wymiana dysku). Zalecam zaznaczenie kopii zapasowej.
                </div>
              )}
            </div>


            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
            >
              {submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
            </button>

            <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
              Masz już konto? <Link to="/login" style={{ color: "var(--brand)" }}>Zaloguj się</Link> i wyślij
              zgłoszenie z panelu klienta.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
