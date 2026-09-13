import { PIPELINE, STATUS_META, type TicketStatus } from "@/lib/ticket-status";

export function TicketProgressBar({ status }: { status: string }) {
  const isOff = status === "odrzucone" || status === "nieaktywne";
  const idx = PIPELINE.indexOf(status as TicketStatus);

  return (
    <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--text-mute)", marginBottom: 12 }}>
        Postęp naprawy
      </div>
      {isOff ? (
        <div style={{ fontSize: 13, color: STATUS_META[status as TicketStatus]?.color ?? "var(--text-mute)" }}>
          {STATUS_META[status as TicketStatus]?.icon} {STATUS_META[status as TicketStatus]?.label ?? status}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PIPELINE.map((s, i) => {
            const meta = STATUS_META[s];
            const reached = i <= idx;
            const current = i === idx;
            return (
              <div
                key={s}
                title={meta.label}
                style={{
                  flex: "1 1 90px",
                  minWidth: 80,
                  padding: "8px 6px",
                  borderRadius: 10,
                  border: `1px solid ${current ? meta.color : "var(--border)"}`,
                  background: reached ? `color-mix(in oklab, ${meta.color} 18%, transparent)` : "transparent",
                  color: reached ? meta.color : "var(--text-mute)",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: current ? 700 : 500,
                  transition: "all .25s ease",
                }}
              >
                <div style={{ fontSize: 16, lineHeight: 1 }}>{meta.icon}</div>
                <div style={{ marginTop: 4 }}>{meta.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
