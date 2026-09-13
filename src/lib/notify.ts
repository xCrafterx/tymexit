import { toast } from "sonner";

const KEY = "tymekit_sound_enabled";

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY) !== "0";
}

export function setSoundEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, v ? "1" : "0");
}

function beep(freq: number, duration = 120) {
  if (!isSoundEnabled() || typeof window === "undefined") return;
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
    o.start();
    o.stop(ctx.currentTime + duration / 1000);
    setTimeout(() => ctx.close().catch(() => {}), duration + 200);
  } catch {
    // ignore
  }
}

export function notifyStatus(label?: string) {
  toast.success(label ? `Status zgłoszenia został zmieniony: ${label}` : "Status zgłoszenia został zmieniony");
  beep(680);
}

export function notifyMessage(short?: string) {
  toast(short ?? "Nowa wiadomość w zgłoszeniu");
  beep(880, 90);
  setTimeout(() => beep(1180, 90), 110);
}
