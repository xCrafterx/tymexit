import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/wycena")({
  head: () => ({
    meta: [
      { title: "Kalkulator Wyceny Naprawy — TymekIT" },
      { name: "description", content: "Szybki kalkulator i asystent wyceny naprawy komputera lub laptopa w serwisie TymekIT." },
      { property: "og:title", content: "Kalkulator Wyceny Naprawy — TymekIT" },
    ],
  }),
  component: WycenaPage,
});

type DeviceType = "pc" | "laptop" | "software" | "other";
type IssueKey = string;

interface IssueOption {
  id: string;
  name: string;
  desc: string;
  priceEstimate: string;
  priceValue: number;
}

const ISSUES: Record<DeviceType, IssueOption[]> = {
  pc: [
    { id: "pc-clean", name: "Czyszczenie i wymiana past", desc: "Dokładne odkurzenie, nowa pasta termoprzewodząca, cichsza praca", priceEstimate: "ok. 50 zł", priceValue: 50 },
    { id: "pc-slow", name: "Wolno działa / Reinstalacja Windows", desc: "Nowy system ze sterownikami i optymalizacją pod gry i pracę", priceEstimate: "ok. 60 zł", priceValue: 60 },
    { id: "pc-noboot", name: "Nie włącza się / Brak obrazu", desc: "Diagnostyka płyty, zasilacza, karty graficznej i pamięci RAM", priceEstimate: "od 50 zł", priceValue: 50 },
    { id: "pc-build", name: "Złożenie komputera z części", desc: "Profesjonalny montaż podzespołów, cable management, testy stabilności", priceEstimate: "ok. 50 zł", priceValue: 50 },
    { id: "pc-upgrade", name: "Modernizacja (SSD / RAM / Grafika)", desc: "Dobór i montaż szybszych podzespołów oraz przeniesienie systemu", priceEstimate: "od 45 zł", priceValue: 45 },
  ],
  laptop: [
    { id: "lap-clean", name: "Czyszczenie układu chłodzenia", desc: "Usunięcie kurzu z radiatora, wymiana pasty/termopadów na CPU i GPU", priceEstimate: "ok. 50 zł", priceValue: 50 },
    { id: "lap-repair", name: "Naprawa ogólna laptopa", desc: "Wymiana matrycy, klawiatury, gniazda zasilania lub obudowy", priceEstimate: "od 60 zł", priceValue: 60 },
    { id: "lap-system", name: "Instalacja / Odświeżenie systemu", desc: "Czysty system, instalacja sterowników i zachowanie prywatnych danych", priceEstimate: "ok. 60 zł", priceValue: 60 },
    { id: "lap-ssd", name: "Wymiana dysku na szybki SSD", desc: "Przyspieszenie starego laptopa nawet 5x + klonowanie Twoich danych", priceEstimate: "od 45 zł", priceValue: 45 },
  ],
  software: [
    { id: "soft-remote", name: "Pomoc zdalna (AnyDesk / TeamViewer)", desc: "Usunięcie błędów, instalacja programów lub konfiguracja bez wychodzenia z domu", priceEstimate: "od 30 zł", priceValue: 30 },
    { id: "soft-virus", name: "Odwirusowanie i czyszczenie reklam", desc: "Usunięcie złośliwego oprogramowania, spyware i niechcianych pasków", priceEstimate: "ok. 40 zł", priceValue: 40 },
    { id: "soft-wifi", name: "Konfiguracja sieci i Wi-Fi", desc: "Ustawienie routera, mesh, wzmacniacza sygnału lub drukarki sieciowej", priceEstimate: "od 40 zł", priceValue: 40 },
  ],
  other: [
    { id: "other-diag", name: "Indywidualna diagnoza usterki", desc: "Nietypowy problem, zalanie sprzętu lub doradztwo sprzętowe", priceEstimate: "od 30 zł", priceValue: 30 },
  ],
};

const DEVICE_LABELS: Record<DeviceType, string> = {
  pc: "Komputer PC",
  laptop: "Laptop",
  software: "Programy / Zdalnie",
  other: "Inne urządzenie",
};

const SERVICE_MAP: Record<string, string> = {
  "pc-clean": "Czyszczenie i optymalizacja",
  "pc-slow": "Instalacja systemu",
  "pc-noboot": "Naprawa komputera",
  "pc-build": "Komputer na zamówienie",
  "pc-upgrade": "Modernizacja sprzętu",
  "lap-clean": "Czyszczenie i optymalizacja",
  "lap-repair": "Naprawa laptopa",
  "lap-system": "Instalacja systemu",
  "lap-ssd": "Modernizacja sprzętu",
  "soft-remote": "Pomoc zdalna",
  "soft-virus": "Czyszczenie i optymalizacja",
  "soft-wifi": "Sieć Wi-Fi",
  "other-diag": "Inna",
};

function WycenaPage() {
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceType>("pc");
  const [selectedIssue, setSelectedIssue] = useState<string>("pc-clean");
  const [backupData, setBackupData] = useState(false);
  const [expressDelivery, setExpressDelivery] = useState(false);

  const currentIssues = ISSUES[device] || [];
  const activeIssue = currentIssues.find((i) => i.id === selectedIssue) || currentIssues[0];

  let totalPrice = (activeIssue?.priceValue || 50) + (backupData ? 20 : 0) + (expressDelivery ? 20 : 0);

  const handleGoToOrder = () => {
    const extras = [
      backupData ? "kopia zapasowa danych" : null,
      expressDelivery ? "tryb ekspresowy" : null,
    ].filter(Boolean).join(", ");
    const deviceLabel = DEVICE_LABELS[device];
    const desc = `Wycena z kalkulatora TymekIT\nUrządzenie: ${deviceLabel}\nUsterka: ${activeIssue?.name || "Naprawa"}${extras ? `\nDodatki: ${extras}` : ""}\nSzacowany koszt: od ${totalPrice} zł.\n\nOpis problemu: `;
    navigate({
      to: "/zgloszenie",
      search: {
        service: SERVICE_MAP[activeIssue?.id || ""] || "Inna",
        title: `${deviceLabel} — ${activeIssue?.name || "Naprawa"}`,
        desc,
        priority: expressDelivery ? "1" : undefined,
        backup: backupData ? "1" : undefined,
      } as any,
    });
  };


  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "40px 18px 80px", color: "var(--text)" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.35)", color: "#38bdf8", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          ⚙️ Wycena w 30 sekund
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          Kalkulator Wyceny Naprawy
        </h1>
        <p style={{ color: "var(--text-sec)", fontSize: 16, maxWidth: 600, margin: "0 auto" }}>
          Wybierz rodzaj sprzętu i problem, aby poznać orientacyjny koszt. Ceny prywatne, bez naciągania.
        </p>
      </div>

      {/* Krok 1: Typ sprzętu */}
      <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--brand)", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>1</span>
          Wybierz rodzaj sprzętu
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          {[
            { id: "pc", label: "Komputer PC", icon: "🖥️" },
            { id: "laptop", label: "Laptop", icon: "💻" },
            { id: "software", label: "Programy / Zdalnie", icon: "🌐" },
            { id: "other", label: "Inne urządzenia", icon: "🔧" },
          ].map((item) => {
            const active = device === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDevice(item.id as DeviceType);
                  setSelectedIssue(ISSUES[item.id as DeviceType][0]?.id || "");
                }}
                style={{
                  padding: "16px 14px",
                  borderRadius: 12,
                  border: active ? "2px solid var(--brand)" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: active ? "rgba(56, 189, 248, 0.15)" : "rgba(0, 0, 0, 0.2)",
                  color: active ? "#fff" : "var(--text-sec)",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.18s ease",
                }}
              >
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Krok 2: Usterka */}
      <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--brand)", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>2</span>
          Co dolega urządzeniu?
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {currentIssues.map((issue) => {
            const active = (activeIssue?.id === issue.id);
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => setSelectedIssue(issue.id)}
                style={{
                  textAlign: "left",
                  padding: "16px 18px",
                  borderRadius: 12,
                  border: active ? "2px solid var(--brand)" : "1px solid rgba(255, 255, 255, 0.07)",
                  background: active ? "rgba(56, 189, 248, 0.12)" : "rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ color: active ? "#38bdf8" : "var(--text)", fontSize: 15 }}>{issue.name}</strong>
                  <span style={{ fontSize: 13, padding: "2px 8px", borderRadius: 6, background: "rgba(34, 197, 94, 0.18)", color: "#22c55e", fontWeight: 700 }}>
                    {issue.priceEstimate}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-sec)", lineHeight: 1.4 }}>{issue.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Krok 3: Opcje dodatkowe */}
      <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border)", borderRadius: 16, padding: "22px 24px", marginBottom: 32 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--brand)", color: "#000", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>3</span>
          Dodatkowe opcje (opcjonalnie)
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <input type="checkbox" checked={backupData} onChange={(e) => setBackupData(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--brand)" }} />
            <div style={{ flex: 1 }}>
              <strong>Kopia zapasowa prywatnych danych (+20 zł)</strong>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Zabezpieczenie Twoich zdjęć, dokumentów i plików przed reinstalacją systemu.</div>
            </div>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <input type="checkbox" checked={expressDelivery} onChange={(e) => setExpressDelivery(e.target.checked)} style={{ width: 18, height: 18, accentColor: "var(--brand)" }} />
            <div style={{ flex: 1 }}>
              <strong>Tryb ekspresowy (priorytet w kolejce) (+20 zł)</strong>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Diagnoza i rozpoczęcie prac jeszcze tego samego dnia.</div>
            </div>
          </label>
        </div>
      </div>

      {/* Podsumowanie wyceny i przycisk */}
      <div style={{ background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: 18, padding: "28px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
        <div>
          <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--brand)", fontWeight: 700 }}>Orientacyjny koszt naprawy</span>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#22c55e", margin: "4px 0" }}>
            od {totalPrice} zł
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-sec)" }}>
            Wybrano: <strong>{activeIssue?.name}</strong> na {device.toUpperCase()}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleGoToOrder}
            className="btn btn-primary"
            style={{ fontSize: 15, padding: "14px 28px", fontWeight: 700 }}
          >
            📋 Zgłoś naprawę z tą wyceną &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
