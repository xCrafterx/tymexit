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

// Głośny sygnał "plum plum" dla admina — nowe zgłoszenie / nowa opinia / nowa ocena.
// Celowo ignoruje wyciszenie muzyki w tle: to alert, a nie muzyka.
function plum(startAt: number, ctx: AudioContext) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  o.type = "sine";
  o.frequency.setValueAtTime(760, startAt);
  o.frequency.exponentialRampToValueAtTime(300, startAt + 0.28);
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(0.85, startAt + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.34);
  o.start(startAt);
  o.stop(startAt + 0.36);
}

export function playAlertSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    void ctx.resume?.();
    const now = ctx.currentTime + 0.02;
    plum(now, ctx);
    plum(now + 0.38, ctx);
    setTimeout(() => ctx.close().catch(() => {}), 1400);
  } catch {
    // ignore
  }
}

export function notifyNewTicket(label?: string) {
  toast.success(label ?? "Nowe zgłoszenie od klienta!");
  playAlertSound();
}

export function notifyNewReview(label?: string) {
  toast.success(label ?? "Nowa opinia od klienta!");
  playAlertSound();
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
