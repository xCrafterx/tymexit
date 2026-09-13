import { useEffect } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/notify";
import { useState } from "react";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { setEnabled(isSoundEnabled()); }, []);
  return (
    <button
      type="button"
      onClick={() => { const v = !enabled; setEnabled(v); setSoundEnabled(v); }}
      className="btn btn-ghost"
      style={{ padding: "6px 12px", fontSize: 11 }}
      title={enabled ? "Wyłącz dźwięki powiadomień" : "Włącz dźwięki powiadomień"}
    >
      {enabled ? "🔔 Dźwięk: wł." : "🔕 Dźwięk: wył."}
    </button>
  );
}
