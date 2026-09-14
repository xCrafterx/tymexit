export type TicketStatus =
  | "oczekuje"
  | "zaakceptowane"
  | "w diagnozie"
  | "w naprawie"
  | "oczekuje na części"
  | "gotowe do odbioru"
  | "zakończone"
  | "odrzucone"
  | "nieaktywne";

export const ALL_STATUSES: TicketStatus[] = [
  "oczekuje",
  "zaakceptowane",
  "w diagnozie",
  "w naprawie",
  "oczekuje na części",
  "gotowe do odbioru",
  "zakończone",
  "odrzucone",
  "nieaktywne",
];

// Statusy tworzące pipeline postępu naprawy (bez odrzucone/nieaktywne)
export const PIPELINE: TicketStatus[] = [
  "oczekuje",
  "zaakceptowane",
  "w diagnozie",
  "w naprawie",
  "oczekuje na części",
  "gotowe do odbioru",
  "zakończone",
];

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: string;
}

export const STATUS_META: Record<TicketStatus, StatusMeta> = {
  oczekuje: {
    label: "Oczekuje",
    color: "#fbbf24", // Ciepły żółty / bursztynowy
    bg: "rgba(245, 158, 11, 0.2)",
    border: "rgba(245, 158, 11, 0.55)",
    glow: "0 0 16px rgba(245, 158, 11, 0.45)",
    icon: "⏳",
  },
  zaakceptowane: {
    label: "Zaakceptowane",
    color: "#22c55e", // Zielony logiczny
    bg: "rgba(34, 197, 94, 0.2)",
    border: "rgba(34, 197, 94, 0.55)",
    glow: "0 0 16px rgba(34, 197, 94, 0.45)",
    icon: "✅",
  },
  "w diagnozie": {
    label: "W diagnozie",
    color: "#38bdf8", // Jasny błękit
    bg: "rgba(56, 189, 248, 0.2)",
    border: "rgba(56, 189, 248, 0.55)",
    glow: "0 0 16px rgba(56, 189, 248, 0.45)",
    icon: "🔍",
  },
  "w naprawie": {
    label: "W naprawie",
    color: "#a855f7", // Fiolet
    bg: "rgba(168, 85, 247, 0.2)",
    border: "rgba(168, 85, 247, 0.55)",
    glow: "0 0 16px rgba(168, 85, 247, 0.45)",
    icon: "🛠️",
  },
  "oczekuje na części": {
    label: "Oczekuje na części",
    color: "#f97316", // Pomarańczowy
    bg: "rgba(249, 115, 22, 0.2)",
    border: "rgba(249, 115, 22, 0.55)",
    glow: "0 0 16px rgba(249, 115, 22, 0.45)",
    icon: "📦",
  },
  "gotowe do odbioru": {
    label: "Gotowe do odbioru",
    color: "#10b981", // Szmaragdowy sukces
    bg: "rgba(16, 185, 129, 0.24)",
    border: "rgba(16, 185, 129, 0.6)",
    glow: "0 0 18px rgba(16, 185, 129, 0.5)",
    icon: "🎉",
  },
  zakończone: {
    label: "Zakończone",
    color: "#06b6d4", // Cyan / turkus
    bg: "rgba(6, 182, 212, 0.2)",
    border: "rgba(6, 182, 212, 0.55)",
    glow: "0 0 16px rgba(6, 182, 212, 0.45)",
    icon: "🏁",
  },
  odrzucone: {
    label: "Odrzucone",
    color: "#ef4444", // Czerwony
    bg: "rgba(239, 68, 68, 0.2)",
    border: "rgba(239, 68, 68, 0.55)",
    glow: "0 0 16px rgba(239, 68, 68, 0.45)",
    icon: "✖️",
  },
  nieaktywne: {
    label: "Nieaktywne",
    color: "#94a3b8", // Szary
    bg: "rgba(148, 163, 184, 0.18)",
    border: "rgba(148, 163, 184, 0.4)",
    glow: "0 0 14px rgba(148, 163, 184, 0.35)",
    icon: "💤",
  },
};

export const DELETABLE_STATUSES: TicketStatus[] = ["zakończone", "odrzucone", "nieaktywne"];
