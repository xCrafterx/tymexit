export type Egg = {
  id: string;
  name: string;
  path: "/sekret" | "/matrix" | "/pizza" | "/kawa" | "/retro";
  hint: string;
  icon: string;
};

export const EGGS: Egg[] = [
  { id: "sekret", name: "Tajny Klub Kotów", path: "/sekret", icon: "🐱",
    hint: "Kliknij kropkę przed napisem „24/7 Jestem dostępny” w hero." },
  { id: "matrix", name: "Matrix", path: "/matrix", icon: "💊",
    hint: "Wpisz kod Konami na klawiaturze: ↑ ↑ ↓ ↓ ← → ← → B A." },
  { id: "pizza", name: "Tajna Loża Pizzy", path: "/pizza", icon: "🍕",
    hint: "Kliknij 5× w kartę „Tymoteusz Czech” obok zdjęcia w hero." },
  { id: "kawa", name: "Sekretna Kawiarnia", path: "/kawa", icon: "☕",
    hint: "Kliknij kropkę po „Jesteśmy gotowi na Ciebie.” w sekcji kontakt." },
  { id: "retro", name: "Retro Mode (1998)", path: "/retro", icon: "💾",
    hint: "Kliknij 3× szybko w słowo „TymekIT” w nagłówku hero." },
];

const KEY = "tymekit:secrets";

export const getUnlocked = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

export const unlock = (id: string) => {
  if (typeof window === "undefined") return;
  const cur = getUnlocked();
  if (!cur.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...cur, id]));
  }
};

export const resetUnlocks = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
};
