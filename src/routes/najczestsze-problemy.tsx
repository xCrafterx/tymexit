import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/najczestsze-problemy")({
  head: () => ({
    meta: [
      { title: "Najczęstsze problemy z komputerem — napraw sam | TymekIT" },
      { name: "description", content: "11 najczęstszych problemów z komputerem i proste rozwiązania krok po kroku, które zrobisz sam w domu." },
      { property: "og:title", content: "Najczęstsze problemy z komputerem — TymekIT" },
      { property: "og:description", content: "Wolny komputer, brak internetu, brak dźwięku? Proste rozwiązania krok po kroku." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProblemsPage,
});

const PROBLEMS: { q: string; why: string; steps: string[] }[] = [
  {
    q: "Komputer bardzo zwolnił i „muli”",
    why: "Najczęściej przez nagromadzone pliki tymczasowe i zbyt wiele programów uruchamiających się razem z systemem.",
    steps: [
      "Naciśnij Windows + R, wpisz %temp% i Enter → zaznacz wszystko (Ctrl + A) i usuń. Pliki, których nie da się usunąć – pomiń.",
      "Ponownie Windows + R, wpisz temp i Enter → usuń wszystko.",
      "Windows + R, wpisz prefetch i Enter → usuń wszystko.",
      "Ctrl + Shift + Esc → zakładka „Autostart” → wyłącz programy, których nie potrzebujesz od razu po włączeniu.",
      "Opróżnij Kosz i uruchom komputer ponownie.",
    ],
  },
  {
    q: "Nie działa internet / Wi-Fi",
    why: "Zwykle chwilowy błąd routera albo karty sieciowej.",
    steps: [
      "Wyłącz router z prądu na 30 sekund i włącz ponownie (poczekaj ok. 2 minuty).",
      "Na komputerze włącz i wyłącz „Tryb samolotowy”.",
      "Kliknij prawym na ikonę sieci → „Rozwiąż problemy”.",
      "Windows + R → cmd → wpisz ipconfig /flushdns i Enter.",
    ],
  },
  {
    q: "Nie ma dźwięku",
    why: "Często system wybrał złe urządzenie wyjściowe (np. monitor zamiast głośników).",
    steps: [
      "Kliknij ikonę głośnika przy zegarze i sprawdź, czy nie jest wyciszony.",
      "Kliknij strzałkę obok suwaka głośności i wybierz właściwe głośniki/słuchawki.",
      "Sprawdź pokrętło i kabel głośników albo podłącz słuchawki ponownie.",
      "Uruchom ponownie komputer.",
    ],
  },
  {
    q: "Brakuje miejsca na dysku C (czerwony pasek)",
    why: "Pobrane pliki, kosz i stare aktualizacje zajmują dziesiątki GB.",
    steps: [
      "Windows + R → wpisz cleanmgr → Enter → zaznacz wszystko → „Wyczyść pliki systemowe”.",
      "Przejrzyj folder „Pobrane” i usuń niepotrzebne instalatory.",
      "Opróżnij Kosz.",
      "Ustawienia → Aplikacje → odinstaluj nieużywane programy i gry.",
    ],
  },
  {
    q: "Klawiatura pisze „z” zamiast „y” albo dziwne znaki",
    why: "Przypadkiem przełączył się układ klawiatury.",
    steps: [
      "Naciśnij Windows + Spacja (lub lewy Alt + Shift) i wybierz „Polski (programisty)”.",
      "Usuń zbędne układy: Ustawienia → Czas i język → Język → Opcje.",
    ],
  },
  {
    q: "Przeglądarka się zacina lub wyskakują reklamy",
    why: "Zapchana pamięć podręczna albo podejrzane rozszerzenia.",
    steps: [
      "Naciśnij Ctrl + Shift + Delete → wyczyść pamięć podręczną i pliki cookie.",
      "Wejdź w rozszerzenia (chrome://extensions) i usuń te, których nie znasz.",
      "Zaktualizuj przeglądarkę i uruchom ją ponownie.",
    ],
  },
  {
    q: "Program się zawiesił i nie da się go zamknąć",
    why: "Program przestał odpowiadać – trzeba go zamknąć siłą.",
    steps: [
      "Naciśnij Ctrl + Shift + Esc (Menedżer zadań).",
      "Zaznacz program → „Zakończ zadanie”.",
      "Gdy zawiesza się cały pulpit: zakończ „Eksplorator Windows” lub kliknij go prawym → „Uruchom ponownie”.",
    ],
  },
  {
    q: "Czarny / mrugający ekran lub dziwna rozdzielczość",
    why: "Zwykle to zawieszony sterownik karty graficznej.",
    steps: [
      "Naciśnij jednocześnie Windows + Ctrl + Shift + B – ekran mrugnie i sterownik się zrestartuje.",
      "Prawy klik na pulpicie → Ustawienia ekranu → ustaw rozdzielczość „(Zalecana)”.",
      "Sprawdź, czy kabel monitora dobrze siedzi.",
    ],
  },
  {
    q: "Drukarka nie drukuje",
    why: "Najczęściej zablokowana kolejka wydruku.",
    steps: [
      "Wyłącz i włącz drukarkę.",
      "Windows + R → services.msc → znajdź „Bufor wydruku” → prawy klik → „Uruchom ponownie”.",
      "Ustawienia → Drukarki → wybierz drukarkę → usuń zawieszone dokumenty z kolejki.",
    ],
  },
  {
    q: "Laptop głośno szumi i parzy od spodu",
    why: "Zatkane wloty powietrza – laptop nie może się schłodzić.",
    steps: [
      "Nie trzymaj laptopa na kocu, łóżku ani kolanach – połóż go na twardym blacie.",
      "Przedmuchaj kratki sprężonym powietrzem (przy wyłączonym laptopie).",
      "Jeśli nic nie pomaga – czas na czyszczenie i wymianę pasty. Wtedy napisz do mnie.",
    ],
  },
  {
    q: "Klawisze F1–F12 nie działają jak trzeba (głośność zamiast F5)",
    why: "Włączona lub wyłączona blokada klawisza Fn.",
    steps: [
      "Naciśnij Fn + Esc (na wielu laptopach to przełącznik Fn Lock).",
      "Albo przytrzymaj Fn i wtedy naciśnij potrzebny klawisz F.",
    ],
  },
];

function ProblemsPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState("");
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; mine?: "up" | "down" }>>({});
  useEffect(() => {
    try { setVotes(JSON.parse(localStorage.getItem("tymekit_problem_votes") || "{}")); } catch { /* ignore */ }
  }, []);
  const vote = (key: string, dir: "up" | "down") => {
    setVotes((prev) => {
      const cur = prev[key] || { up: 0, down: 0 };
      if (cur.mine) return prev;
      const next = { ...prev, [key]: { ...cur, [dir]: cur[dir] + 1, mine: dir } };
      localStorage.setItem("tymekit_problem_votes", JSON.stringify(next));
      return next;
    });
  };
  const term = q.trim().toLowerCase();
  const list = PROBLEMS.map((p, i) => ({ p, i })).filter(({ p }) =>
    !term || (p.q + " " + p.why + " " + p.steps.join(" ")).toLowerCase().includes(term));
  return (
      <main className="container" style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 900 }}>
        <h1 className="problems-title">Najczęstsze problemy</h1>
        <p className="text-dim" style={{ marginBottom: 20, lineHeight: 1.7 }}>
          Proste rzeczy, które możesz zrobić sam w domu w kilka minut — bez dzwonienia do serwisu. Kliknij problem, aby zobaczyć rozwiązanie.
        </p>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Szukaj problemu, np. internet, dźwięk, wolny komputer…"
          aria-label="Szukaj problemu"
          style={{ width: "100%", padding: "14px 16px", marginBottom: 20, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface)", color: "inherit", fontSize: 15 }}
        />
        <div style={{ display: "grid", gap: 12 }}>
          {list.length === 0 && <p className="text-dim">Nic nie znaleziono — spróbuj innego słowa albo zgłoś problem niżej.</p>}
          {list.map(({ p, i }) => {
            const v = votes[p.q] || { up: 0, down: 0 };
            return (
            <div key={p.q} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                style={{ width: "100%", textAlign: "left", padding: "16px 18px", background: "transparent", border: "none", color: "inherit", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", fontSize: 16, fontWeight: 600 }}
              >
                <span className="problems-num">{i + 1}</span>
                <span style={{ flex: 1 }}>{p.q}</span>
                <span aria-hidden>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 18px 18px 60px", lineHeight: 1.7 }}>
                  <p className="text-dim" style={{ marginBottom: 10 }}><strong>Dlaczego?</strong> {p.why}</p>
                  <ol style={{ paddingLeft: 18, display: "grid", gap: 6 }}>
                    {p.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                  <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" className="btn btn-ghost" disabled={!!v.mine} onClick={() => vote(p.q, "up")}>👍 Pomogło ({v.up})</button>
                    <button type="button" className="btn btn-ghost" disabled={!!v.mine} onClick={() => vote(p.q, "down")}>👎 Nie pomogło ({v.down})</button>
                    {v.mine && <span className="text-dim" style={{ fontSize: 13 }}>Dzięki za ocenę!</span>}
                  </div>
                </div>
              )}
            </div>
          );})}
        </div>
        <div className="card" style={{ marginTop: 28, textAlign: "center", padding: 24 }}>
          <p style={{ marginBottom: 14 }}>Nie pomogło? Spokojnie — zajmę się tym.</p>
          <Link to="/zgloszenie" className="btn btn-primary">Zgłoś problem</Link>
        </div>
      </main>
  );
}
