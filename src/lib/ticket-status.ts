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

export const STATUS_META: Record<TicketStatus, { label: string; color: string; icon: string }> = {
  oczekuje: { label: "Oczekuje", color: "var(--brand-2)", icon: "⏳" },
  zaakceptowane: { label: "Zaakceptowane", color: "var(--brand)", icon: "✅" },
  "w diagnozie": { label: "W diagnozie", color: "#60a5fa", icon: "🔍" },
  "w naprawie": { label: "W naprawie", color: "var(--brand-3)", icon: "🛠️" },
  "oczekuje na części": { label: "Oczekuje na części", color: "#f59e0b", icon: "📦" },
  "gotowe do odbioru": { label: "Gotowe do odbioru", color: "#10b981", icon: "🎉" },
  zakończone: { label: "Zakończone", color: "var(--brand-3)", icon: "🏁" },
  odrzucone: { label: "Odrzucone", color: "var(--text-mute)", icon: "✖️" },
  nieaktywne: { label: "Nieaktywne", color: "var(--text-mute)", icon: "💤" },
};

export const DELETABLE_STATUSES: TicketStatus[] = ["zakończone", "odrzucone", "nieaktywne"];
