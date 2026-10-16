import { useEffect, useRef, useState } from "react";

type Line = { text: string; color?: string };

// Wirtualny system plików (Windows)
const FS: Record<string, string[]> = {
  "C:\\": ["Program Files", "Program Files (x86)", "Users", "Windows", "TymekIT", "pagefile.sys"],
  "C:\\Program Files": ["Google", "Mozilla Firefox", "7-Zip", "Windows Defender", "TymekIT Narzedzia"],
  "C:\\Program Files (x86)": ["Steam", "Microsoft", "Common Files"],
  "C:\\Users": ["Public", "Tymek", "Default"],
  "C:\\Users\\Tymek": ["Desktop", "Documents", "Downloads", "Pictures", "Music", "Videos", "AppData"],
  "C:\\Users\\Tymek\\Desktop": ["Narzedzia TymekIT.lnk", "sekret.txt", "faktura.pdf"],
  "C:\\Users\\Tymek\\Documents": ["protokol_naprawy.docx", "cennik.xlsx"],
  "C:\\Users\\Tymek\\Downloads": ["narzedzia-tymekit.exe", "sterowniki.zip"],
  "C:\\Windows": ["System32", "SysWOW64", "Temp", "Prefetch", "Fonts", "explorer.exe", "notepad.exe", "regedit.exe"],
  "C:\\Windows\\System32": ["cmd.exe", "drivers", "config", "taskmgr.exe", "calc.exe", "mspaint.exe", "ipconfig.exe", "ping.exe", "cleanmgr.exe", "msconfig.exe", "hosts"],
  "C:\\Windows\\System32\\drivers": ["etc", "nvlddmkm.sys", "tcpip.sys", "disk.sys"],
  "C:\\Windows\\System32\\drivers\\etc": ["hosts", "networks", "services"],
  "C:\\Windows\\System32\\config": ["SAM", "SYSTEM", "SOFTWARE"],
  "C:\\Windows\\Temp": ["~tmp001.tmp", "~tmp002.tmp", "log_update.tmp"],
  "C:\\Windows\\Prefetch": ["CHROME.EXE-1A2B.pf", "STEAM.EXE-9F8E.pf"],
  "C:\\TymekIT": ["README.txt", "diagnostyka.log"],
};

const exe = (name: string, desc: string, ver: string, size: string) =>
  `MZ\u0090\u0000\u0003\u0000\u0000\u0000\u0004\u0000\u0000\u0000\u00ff\u00ff  ...\nThis program cannot be run in DOS mode.\n\n[Nagłówek PE] Maszyna: x64 (0x8664) | Sekcje: .text .rdata .data .rsrc\n[Info] Nazwa: ${name}\n[Info] Opis: ${desc}\n[Info] Wersja: ${ver}\n[Info] Rozmiar: ${size}\n4D 5A 90 00 03 00 00 00 04 00 00 00 FF FF 00 00\nB8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00`;

const FILES: Record<string, string> = {
  "sekret.txt": "Gratulacje! Znalazłeś sekret 🎉\nWpisz 'matrix', zagraj w 'rpg' albo odwiedź /sekret 😉",
  "README.txt": "TymekIT — serwis komputerowy z pasją.\nZgłoś problem: /zgloszenie  |  tel. +48 695 560 039\nGodziny pracy: pn–pt 15:00–21:00, sob 10:00–18:00",
  "diagnostyka.log": "[2026-10-12 18:02] Start diagnostyki\n[OK]   CPU Intel Core i5-14400F — 38°C\n[OK]   RAM 32GB DDR5 — test MemTest zaliczony\n[OK]   NVMe 2TB — zdrowie 98%\n[WARN] Pasta termoprzewodząca do wymiany (wiek: 3 lata)\n[DONE] Diagnostyka zakończona w 4 min 12 s",
  "hosts": "# Plik hosts systemu Windows\n127.0.0.1  localhost\n::1        localhost\n0.0.0.0    reklamy-precz.example",
  "networks": "loopback   127\ncampus     128.32\nlocalnet   192.168.1",
  "services": "echo     7/tcp\nftp     21/tcp\nssh     22/tcp\nhttp    80/tcp\nhttps  443/tcp",
  "faktura.pdf": "%PDF-1.7\n======== FAKTURA VAT nr FV/10/2026/017 (PRZYKŁAD) ========\nSprzedawca: TymekIT Serwis Komputerowy\nNabywca:    Jan Przykładowy\n-----------------------------------------------------------\n1. Czyszczenie laptopa + wymiana pasty      1 szt.   149,00 zł\n2. Instalacja Windows 11 + sterowniki       1 szt.   129,00 zł\n3. Dysk SSD 1TB NVMe                        1 szt.   289,00 zł\n-----------------------------------------------------------\nRAZEM DO ZAPŁATY:                                    567,00 zł\nStatus: OPŁACONO ✔  (dokument przykładowy, nie jest fakturą)",
  "cennik.xlsx": "PK\u0003\u0004 [arkusz: Cennik 2026 — ceny przykładowe]\n| Usługa                              | Cena od   | Czas     |\n|-------------------------------------|-----------|----------|\n| Diagnoza komputera                  |   0 zł    | 1 dzień  |\n| Czyszczenie + pasta termoprzewodząca|  99 zł    | 1 dzień  |\n| Reinstalacja systemu Windows        | 119 zł    | 1–2 dni  |\n| Usuwanie wirusów                    |  89 zł    | 1 dzień  |\n| Konfiguracja routera / Wi-Fi        |  69 zł    | 2 godz.  |\n| Odzyskiwanie danych                 | 199 zł    | 2–5 dni  |\n| Składanie PC z części               | 149 zł    | 1 dzień  |\n| Ekspresowy priorytet                | +20 zł    | dziś     |",
  "protokol_naprawy.docx": "PK\u0003\u0004 [dokument Word]\nPROTOKÓŁ NAPRAWY nr 2026/104 (przykład)\nUrządzenie: Laptop Lenovo IdeaPad 5\nZgłoszona usterka: przegrzewanie, wyłączanie się w grach\nWykonane czynności:\n  • rozkręcenie i czyszczenie układu chłodzenia\n  • wymiana pasty na Arctic MX-6\n  • wymiana termopadów 1 mm\nTemperatura przed: 97°C → po: 71°C\nPodpis serwisanta: Tymek ✍",
  "narzedzia-tymekit.exe": exe("Narzędzia TymekIT", "Zestaw narzędzi serwisowych do czyszczenia i diagnostyki", "2.4.0.0", "8 421 376 bajtów"),
  "explorer.exe": exe("Eksplorator Windows", "Powłoka systemu: pulpit, pasek zadań, foldery", "10.0.22631.4317", "5 312 512 bajtów"),
  "notepad.exe": exe("Notatnik", "Prosty edytor plików tekstowych", "11.2409.9.0", "360 448 bajtów"),
  "regedit.exe": exe("Edytor rejestru", "Narzędzie do przeglądania rejestru — ostrożnie!", "10.0.22631.1", "397 312 bajtów"),
  "cmd.exe": exe("Wiersz polecenia", "Interpreter poleceń systemu Windows", "10.0.22631.2506", "323 584 bajtów"),
  "taskmgr.exe": exe("Menedżer zadań", "Procesy, wydajność i autostart (Ctrl+Shift+Esc)", "10.0.22631.4169", "1 581 056 bajtów"),
  "calc.exe": exe("Kalkulator", "2 + 2 = 4 (sprawdzone przez serwis)", "11.2408.12.0", "27 648 bajtów"),
  "mspaint.exe": exe("Paint", "Rysowanie kółek, które nigdy nie wychodzą okrągłe", "11.2408.30.0", "6 144 000 bajtów"),
  "ipconfig.exe": exe("IPConfig", "Wyświetla i odnawia konfigurację sieci IP", "10.0.22631.1", "35 840 bajtów"),
  "ping.exe": exe("Ping", "Sprawdza, czy drugi komputer w ogóle żyje", "10.0.22631.1", "22 528 bajtów"),
  "cleanmgr.exe": exe("Oczyszczanie dysku", "Usuwa pliki tymczasowe i stare aktualizacje", "10.0.22631.3527", "280 064 bajtów"),
  "msconfig.exe": exe("Konfiguracja systemu", "Uruchamianie, usługi i tryb awaryjny", "10.0.22631.1", "301 568 bajtów"),
  "~tmp001.tmp": "Plik tymczasowy aktualizacji przeglądarki — można bezpiecznie usunąć.",
  "~tmp002.tmp": "Fragment instalatora sterownika audio, porzucony w 2024 roku. Smutny los.",
  "log_update.tmp": "[WU] Pobieranie KB5044284 … 100%\n[WU] Oczekiwanie na ponowne uruchomienie (od 37 dni 🙃)",
  "CHROME.EXE-1A2B.pf": "Prefetch: chrome.exe | uruchomień: 1 482 | ostatnio: dziś 14:55",
  "STEAM.EXE-9F8E.pf": "Prefetch: steam.exe | uruchomień: 611 | ostatnio: wczoraj 22:41",
  "Narzedzia TymekIT.lnk": "Skrót → C:\\Users\\Tymek\\Downloads\\narzedzia-tymekit.exe",
  "pagefile.sys": "Plik stronicowania (16 GB). Zablokowany przez system — tu RAM odpoczywa na dysku.",
  "nvlddmkm.sys": "Sterownik NVIDIA GeForce RTX 5050 | wersja 566.36 | status: działa poprawnie",
  "tcpip.sys": "Sterownik protokołu TCP/IP — dzięki niemu działa internet.",
  "disk.sys": "Sterownik klasy dysku — obsługuje NVMe 2 TB.",
  "SAM": "Odmowa dostępu. Ten plik chroni konta użytkowników i jest zablokowany 🔒",
  "SYSTEM": "Gałąź rejestru SYSTEM — używana podczas startu Windows.",
  "SOFTWARE": "Gałąź rejestru SOFTWARE — ustawienia zainstalowanych programów.",
};

// Wirtualne archiwum ZIP
const ZIPS: Record<string, Record<string, string>> = {
  "sterowniki.zip": {
    "czytaj_to.txt": "Archiwum ze sterownikami przygotowane przez TymekIT.\nNajpierw chipset, potem grafika, na końcu audio i Wi-Fi.",
    "chipset_intel_b760.exe": exe("Intel Chipset Device Software", "Sterowniki chipsetu B760", "10.1.19600", "3 145 728 bajtów"),
    "nvidia_rtx5050_566.36.exe": exe("NVIDIA Graphics Driver", "Sterownik GeForce RTX 5050", "566.36", "712 441 856 bajtów"),
    "realtek_audio.inf": "[Version]\nSignature=\"$WINDOWS NT$\"\nClass=MEDIA\nProvider=%Realtek%\nDriverVer=09/14/2026,6.0.9750.1",
    "wifi_ax211_changelog.log": "v23.80 — poprawiona stabilność Wi-Fi 6E\nv23.60 — szybsze wybudzanie ze snu\nv23.40 — naprawiony błąd rozłączania z routerem",
    "lista_kontrolna.txt": "[x] Kopia zapasowa danych\n[x] Punkt przywracania\n[ ] Restart po instalacji (nie zapomnij!)",
  },
};

const WIN_HINTS: [string, string][] = [
  ["help", "lista wszystkich komend"],
  ["ipconfig", "podstawowe informacje o sieci"],
  ["ipconfig /all", "pełne szczegóły karty sieciowej"],
  ["ipconfig /flushdns", "wyczyść pamięć DNS"],
  ["dir", "zawartość folderu"],
  ["dir /s", "zawartość folderu z podfolderami"],
  ["cd C:\\Windows\\System32", "przejdź do folderu (cd .. – wyżej)"],
  ["cd sterowniki.zip", "otwórz archiwum ZIP (w Downloads)"],
  ["type sekret.txt", "pokaż zawartość pliku"],
  ["cls", "wyczyść ekran"],
  ["ping google.com", "test połączenia"],
  ["tracert google.com", "trasa pakietów"],
  ["nslookup google.com", "zapytanie DNS"],
  ["netstat", "aktywne połączenia"],
  ["systeminfo", "informacje o komputerze"],
  ["tasklist", "uruchomione procesy"],
  ["whoami", "kim jestem"],
  ["hostname", "nazwa komputera"],
  ["tree", "drzewo folderów"],
  ["sfc /scannow", "naprawa plików systemu"],
  ["chkdsk", "sprawdzenie dysku"],
  ["ver", "wersja Windows"],
];
const LINUX_HINTS: [string, string][] = [
  ["ifconfig", "konfiguracja sieci"],
  ["ls", "zawartość folderu"],
  ["ls -la", "szczegółowa lista"],
  ["cat README.txt", "pokaż zawartość pliku"],
  ["pwd", "bieżący folder"],
  ["clear", "wyczyść ekran"],
  ["uname -a", "informacje o jądrze"],
  ["neofetch", "informacje o systemie"],
  ["ps", "procesy"],
  ["df -h", "miejsce na dysku"],
  ["free -h", "pamięć RAM"],
  ["uptime", "czas pracy"],
  ["sudo", "spróbuj 😉"],
];
const FUN_HINTS: [string, string][] = [
  ["matrix", "zielony deszcz w konsoli (Esc – stop)"],
  ["rpg", "minigra serwisanta"],
  ["bench", "test wydajności CPU i GPU"],
  ["klik", "włącz/wyłącz dźwięk klawiatury"],
  ["Tab", "autouzupełnianie komend i plików"],
];
const ALL_HINTS = [...WIN_HINTS, ...LINUX_HINTS, ...FUN_HINTS];

const COMMANDS = [
  "help", "cls", "clear", "ipconfig", "ifconfig", "ping", "tracert", "traceroute", "nslookup", "netstat", "dir", "ls", "tree", "cd", "pwd",
  "type", "cat", "more", "whoami", "hostname", "ver", "uname", "date", "time", "uptime", "systeminfo", "neofetch", "tasklist", "taskkill",
  "df", "free", "sfc", "chkdsk", "dism", "gpupdate", "cleanmgr", "echo", "color", "exit", "shutdown", "sudo", "matrix", "rpg", "gra",
  "bench", "benchmark", "klik", "history", "kawa", "zgloszenie",
];

// Minigra serwisanta
type Scene = { text: string[]; options: { label: string; next: string }[] };
const RPG: Record<string, Scene> = {
  start: { text: ["☕ Klient przynosi laptopa zalanego herbatą. Ekran czarny.", "Co robisz?"], options: [{ label: "Odłączam baterię i zasilanie", next: "bat" }, { label: "Podłączam do prądu, żeby sprawdzić", next: "boom" }] },
  boom: { text: ["⚡ PSTRYK! Zwarcie na płycie. Klient płacze, Ty też.", "KONIEC GRY — zawsze najpierw odłączaj zasilanie!"], options: [] },
  bat: { text: ["🔋 Bateria odłączona. Laptop rozkręcony, widzisz lepką plamę.", "Czym czyścisz?"], options: [{ label: "Alkoholem izopropylowym i pędzelkiem", next: "ipa" }, { label: "Wodą z kranu", next: "water" }] },
  water: { text: ["💧 Woda z kranu zostawiła osad i korozję...", "KONIEC GRY — używaj alkoholu IPA 99%."], options: [] },
  ipa: { text: ["✨ Płyta czysta i sucha. Laptop się włącza, ale wentylator wyje.", "Co dalej?"], options: [{ label: "Wymieniam pastę i czyszczę chłodzenie", next: "win" }, { label: "Oddaję klientowi tak jak jest", next: "meh" }] },
  meh: { text: ["😐 Klient wraca po tygodniu: laptop się przegrzewa.", "Wynik: 1/3 ⭐ — zawsze dokończ robotę!"], options: [] },
  win: { text: ["🏆 Laptop chodzi cicho, 65°C w grach. Klient wystawia 5⭐ opinię!", "WYGRAŁEŚ — jesteś prawdziwym serwisantem TymekIT!"], options: [] },
};

const norm = (p: string) => p.replace(/\//g, "\\").replace(/\\+$/, "") || "C:";

function isMuted() {
  try { return sessionStorage.getItem("tymekit_audio_volume") === "0"; } catch { return false; }
}

export function InteractiveTerminal() {
  const [lines, setLines] = useState<Line[]>([
    { text: "TymekIT Terminal v5.0 — Microsoft Windows [Wersja 10.0.22631] + bash", color: "#38bdf8" },
    { text: "Wpisz 'help', aby zobaczyć komendy. Tab uzupełnia nazwy. To tylko symulacja 🙂", color: "#94a3b8" },
  ]);
  const [cwd, setCwd] = useState("C:\\Users\\Tymek");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [expanded, setExpanded] = useState(false);
  const [zip, setZip] = useState<string | null>(null);
  const [zipView, setZipView] = useState<string | null>(null);
  const [matrix, setMatrix] = useState(false);
  const [rpg, setRpg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clicks, setClicks] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  // Matrix wewnątrz konsoli
  useEffect(() => {
    if (!matrix) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.width = cv.offsetWidth; cv.height = cv.offsetHeight;
    const cols = Math.floor(cv.width / 14);
    const drops = Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = "アイウエオカキクケコ0123456789TYMEKIT";
    const id = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#22c55e";
      ctx.font = "14px monospace";
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 14, y * 14);
        drops[i] = y * 14 > cv.height && Math.random() > 0.975 ? 0 : y + 1;
      });
    }, 45);
    const stop = (e: KeyboardEvent) => {
      if (e.key === "Escape" || (e.ctrlKey && e.key.toLowerCase() === "c")) setMatrix(false);
    };
    window.addEventListener("keydown", stop);
    return () => { clearInterval(id); window.removeEventListener("keydown", stop); };
  }, [matrix]);

  const playClick = () => {
    if (!clicks || isMuted()) return;
    try {
      const ac = audioRef.current ?? new AudioContext();
      audioRef.current = ac;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "square";
      o.frequency.value = 1800 + Math.random() * 600;
      g.gain.setValueAtTime(0.03, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.03);
      o.connect(g).connect(ac.destination);
      o.start(); o.stop(ac.currentTime + 0.035);
    } catch { /* brak audio */ }
  };

  const resolve = (arg: string): string | null => {
    const a = arg.trim().replace(/^"|"$/g, "");
    if (!a || a === "~") return "C:\\Users\\Tymek";
    if (a === "/" || a === "\\") return "C:\\";
    let path: string;
    if (/^[a-z]:/i.test(a)) path = a.toUpperCase().slice(0, 1) + a.slice(1);
    else {
      const parts = cwd.split("\\").filter(Boolean);
      for (const seg of a.replace(/\//g, "\\").split("\\")) {
        if (!seg || seg === ".") continue;
        if (seg === "..") { if (parts.length > 1) parts.pop(); }
        else parts.push(seg);
      }
      path = parts.join("\\");
    }
    path = norm(path);
    if (path === "C:") path = "C:\\";
    const key = Object.keys(FS).find((k) => k.toLowerCase() === path.toLowerCase());
    return key ?? null;
  };

  const listDir = (dir: string, recursive = false, depth = 0): Line[] => {
    const out: Line[] = [];
    for (const name of FS[dir] ?? []) {
      const full = dir.endsWith("\\") ? dir + name : `${dir}\\${name}`;
      const isDir = !!FS[full];
      out.push({ text: `${"  ".repeat(depth)}${isDir ? "<DIR>     " : "   4 096  "}${name}`, color: isDir ? "#60a5fa" : name.endsWith(".zip") ? "#fbbf24" : "#cbd5e1" });
      if (recursive && isDir) out.push(...listDir(full, true, depth + 1));
    }
    return out;
  };

  const rpgLines = (id: string): Line[] => {
    const s = RPG[id];
    return [
      ...s.text.map((t) => ({ text: t, color: "#fde68a" })),
      ...s.options.map((o, i) => ({ text: `  ${i + 1}. ${o.label}`, color: "#c084fc" })),
      ...(s.options.length ? [{ text: "Wpisz numer odpowiedzi (lub 'exit').", color: "#94a3b8" }] : [{ text: "Wpisz 'rpg', aby zagrać jeszcze raz.", color: "#94a3b8" }]),
    ];
  };

  const runBench = () => {
    setBusy(true);
    const steps = 10;
    let i = 0;
    const tests = ["CPU (Intel i5-14400F)", "GPU (RTX 5050)", "Dysk NVMe 2TB"];
    let t = 0;
    setLines((p) => [...p, { text: `Test: ${tests[0]}`, color: "#fbbf24" }, { text: "[          ] 0%" }]);
    const id = setInterval(() => {
      i++;
      const bar = "=".repeat(i) + (i < steps ? ">" : "") + " ".repeat(Math.max(0, steps - i - 1));
      setLines((p) => [...p.slice(0, -1), { text: `[${bar}] ${i * 10}%`, color: i === steps ? "#4ade80" : "#38bdf8" }]);
      if (i >= steps) {
        t++;
        i = 0;
        if (t >= tests.length) {
          clearInterval(id);
          setLines((p) => [...p,
            { text: "────────── WYNIKI ──────────", color: "#fbbf24" },
            { text: "CPU: 24 870 pkt (wielowątkowo)  |  1 980 pkt (1 rdzeń)" },
            { text: "GPU: 13 420 pkt (Time Spy)" },
            { text: "NVMe: odczyt 7 050 MB/s  |  zapis 6 300 MB/s" },
            { text: "Ocena ogólna: ★★★★☆ — świetny sprzęt do gier 🎮", color: "#4ade80" },
          ]);
          setBusy(false);
        } else {
          setLines((p) => [...p, { text: `Test: ${tests[t]}`, color: "#fbbf24" }, { text: "[          ] 0%" }]);
        }
      }
    }, 180);
  };

  const run = (raw: string): Line[] | "clear" => {
    const cmdLine = raw.trim();
    if (!cmdLine) return [];
    const [c0, ...rest] = cmdLine.split(/\s+/);
    const cmd = c0.toLowerCase();
    const arg = rest.join(" ");
    const al = arg.toLowerCase();
    const L = (t: string, color?: string): Line => ({ text: t, color });
    const host = arg || "google.com";

    // Minigra przejmuje wejście
    if (rpg) {
      if (cmd === "exit" || cmd === "quit") { setRpg(null); return [L("Wyszedłeś z gry.", "#94a3b8")]; }
      const opt = RPG[rpg].options[parseInt(cmd, 10) - 1];
      if (!opt) return [L("Wybierz numer z listy.", "#f87171")];
      const next = RPG[opt.next];
      setRpg(next.options.length ? opt.next : null);
      return rpgLines(opt.next);
    }

    // Wnętrze archiwum ZIP
    if (zip) {
      const files = ZIPS[zip];
      if (cmd === "exit" || (cmd === "cd" && (al === ".." || !al))) { setZip(null); setZipView(null); return [L(`Zamknięto archiwum ${zip}.`, "#94a3b8")]; }
      if (cmd === "dir" || cmd === "ls") return [L(` Archiwum: ${zip}`, "#fbbf24"), ...Object.keys(files).map((f) => L(`   ${f}`))];
      if (cmd === "type" || cmd === "cat") {
        const f = Object.keys(files).find((k) => k.toLowerCase() === al);
        if (f) { setZipView(f); return files[f].split("\n").map((t) => L(t, "#4ade80")); }
        return [L(`Brak pliku w archiwum: ${arg || "?"}`, "#f87171")];
      }
    }

    switch (cmd) {
      case "help": case "?": case "man":
        return [
          L("== Komendy Windows ==", "#fbbf24"), ...WIN_HINTS.map(([c, d]) => L(`  ${c.padEnd(26)} ${d}`)),
          L("== Komendy Linux ==", "#fbbf24"), ...LINUX_HINTS.map(([c, d]) => L(`  ${c.padEnd(26)} ${d}`)),
          L("== Zabawa ==", "#fbbf24"), ...FUN_HINTS.map(([c, d]) => L(`  ${c.padEnd(26)} ${d}`)),
        ];
      case "cls": case "clear": return "clear";
      case "ipconfig":
        if (al === "/all") return [
          L("Konfiguracja IP systemu Windows"), L("   Nazwa hosta . . . . . . . : TYMEKIT-PC"), L("   Typ węzła . . . . . . . . : Hybrydowy"), L("   Routing IP włączony . . . : Nie"), L(""),
          L("Karta bezprzewodowa sieci LAN Wi-Fi:", "#fbbf24"),
          L("   Opis. . . . . . . . . . . : Intel(R) Wi-Fi 6E AX211 160MHz"),
          L("   Adres fizyczny. . . . . . : 3C-A9-F4-12-7B-9E"),
          L("   DHCP włączone . . . . . . : Tak"),
          L("   Adres IPv6 lokalny. . . . : fe80::1c2b:7a9f:3e1d:4b2a%12"),
          L("   Adres IPv4. . . . . . . . : 192.168.1.37(Preferowany)"),
          L("   Maska podsieci. . . . . . : 255.255.255.0"),
          L("   Dzierżawa uzyskana. . . . : dziś 08:12:44"),
          L("   Brama domyślna. . . . . . : 192.168.1.1"),
          L("   Serwer DHCP . . . . . . . : 192.168.1.1"),
          L("   Serwery DNS . . . . . . . : 1.1.1.1, 8.8.8.8"),
          L(""), L("Karta Ethernet:", "#fbbf24"), L("   Stan nośnika. . . . . . . : Nośnik odłączony"), L("   Opis. . . . . . . . . . . : Realtek PCIe 2.5GbE"),
        ];
        if (al === "/release") return [L("Adres IP zwolniony.", "#fbbf24")];
        if (al === "/renew") return [L("Odnowiono dzierżawę DHCP: 192.168.1.37", "#4ade80")];
        if (al === "/flushdns") return [L("Pomyślnie opróżniono pamięć podręczną programu rozpoznawania nazw DNS.", "#4ade80")];
        return [L("Konfiguracja IP systemu Windows"), L(""), L("Karta Wi-Fi:", "#fbbf24"), L("   Adres IPv4. . . : 192.168.1.37"), L("   Maska . . . . . : 255.255.255.0"), L("   Brama . . . . . : 192.168.1.1"), L("Wskazówka: 'ipconfig /all' pokaże pełne szczegóły.", "#94a3b8")];
      case "ifconfig": case "ip":
        return [L("wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500", "#fbbf24"), L("        inet 192.168.1.37  netmask 255.255.255.0  broadcast 192.168.1.255"), L("        ether 3c:a9:f4:12:7b:9e  txqueuelen 1000"), L("lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536"), L("        inet 127.0.0.1  netmask 255.0.0.0")];
      case "ping":
        return [L(`Badanie ${host} [142.250.186.206] z 32 bajtami danych:`), ...[11, 12, 10, 13].map((t) => L(`Odpowiedź z 142.250.186.206: bajtów=32 czas=${t}ms TTL=117`, "#4ade80")), L("Pakiety: Wysłane = 4, Odebrane = 4, Utracone = 0 (0% straty)")];
      case "tracert": case "traceroute":
        return [L(`Śledzenie trasy do ${host}:`), L("  1    1 ms  192.168.1.1 (router)"), L("  2    8 ms  10.10.0.1 (dostawca)"), L("  3   11 ms  72.14.215.85"), L("  4   12 ms  142.250.186.206"), L("Śledzenie zakończone.", "#4ade80")];
      case "nslookup": case "dig":
        return [L("Serwer:  one.one.one.one"), L("Address:  1.1.1.1"), L(`Nazwa:    ${host}`), L("Addresses:  142.250.186.206")];
      case "netstat": case "ss":
        return [L("Proto  Adres lokalny          Adres obcy             Stan"), L("TCP    192.168.1.37:52114   142.250.186.206:443    ESTABLISHED"), L("TCP    192.168.1.37:52120   104.18.32.7:443        ESTABLISHED"), L("TCP    0.0.0.0:135          0.0.0.0:0              LISTENING")];
      case "dir": case "ls": case "ll": {
        const recursive = al.includes("/s") || al.includes("-r");
        const target = arg.replace(/\/s|-la|-l|-a|-r/gi, "").trim();
        const dir = target ? resolve(target) : cwd;
        if (!dir) return [L("Nie można odnaleźć określonej ścieżki.", "#f87171")];
        return [L(` Katalog: ${dir}`, "#fbbf24"), ...listDir(dir, recursive), L(`   ${(FS[dir] ?? []).length} element(y)`, "#94a3b8")];
      }
      case "tree":
        return [L(cwd, "#fbbf24"), ...listDir(cwd, true).filter((l) => l.text.includes("<DIR>")).map((l) => L(l.text.replace("<DIR>     ", "├── "), "#60a5fa"))];
      case "cd": case "chdir": {
        if (!arg) return [L(cwd)];
        const zipName = Object.keys(ZIPS).find((z) => z === al.split("\\").pop());
        if (zipName) {
          if (!(FS[cwd] ?? []).includes(zipName)) return [L(`Brak ${zipName} w tym folderze. Spróbuj: cd C:\\Users\\Tymek\\Downloads`, "#f87171")];
          setZip(zipName); setZipView(null);
          return [L(`Otwieram archiwum ${zipName} w nowym oknie… (cd .. – zamknij)`, "#fbbf24")];
        }
        const dir = resolve(arg);
        if (!dir) return [L("System nie może odnaleźć określonej ścieżki.", "#f87171")];
        setCwd(dir);
        return [];
      }
      case "pwd": return [L(cwd)];
      case "type": case "cat": case "more": {
        const name = al.split("\\").pop() ?? "";
        if (ZIPS[name]) return [L("To archiwum — wejdź do niego: cd " + name, "#fbbf24")];
        const f = Object.keys(FILES).find((k) => k.toLowerCase() === name);
        return f ? FILES[f].split("\n").map((t) => L(t, "#4ade80")) : [L(`Nie można odnaleźć pliku: ${arg || "?"}`, "#f87171")];
      }
      case "mkdir": case "md": case "del": case "rm": case "rmdir": case "touch": case "copy": case "move": case "cp": case "mv":
        return [L("Odmowa dostępu — to tylko pokazowy terminal 😉", "#fbbf24")];
      case "whoami": return [L("tymekit-pc\\gosc")];
      case "hostname": return [L("TYMEKIT-PC")];
      case "ver": return [L("Microsoft Windows [Wersja 10.0.22631.4317]")];
      case "uname": return [L(al.includes("-a") ? "Linux tymekit 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux" : "Linux")];
      case "date": return [L(new Date().toLocaleDateString("pl-PL", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))];
      case "time": return [L(new Date().toLocaleTimeString("pl-PL"))];
      case "uptime": return [L(`up ${Math.floor(performance.now() / 60000)} min, 1 user, load average: 0.12, 0.08, 0.05`)];
      case "systeminfo": case "neofetch": case "winver":
        return [
          L("Nazwa hosta:            TYMEKIT-PC", "#fbbf24"),
          L("System operacyjny:      Microsoft Windows 11 Pro 64-bit"),
          L("Procesor:               Intel(R) Core(TM) i5-14400F (14. generacja, 10 rdzeni / 16 wątków)"),
          L("Pamięć RAM:             32 GB DDR5 6000 MHz (2x 16 GB)"),
          L("Karta graficzna:        NVIDIA GeForce RTX 5050 (8 GB GDDR7)"),
          L("Dysk:                   NVMe SSD 2 TB PCIe 4.0 (zdrowie 98%)"),
          L("Serwisant:              TymekIT ✔", "#4ade80"),
        ];
      case "tasklist": case "ps": case "top": case "htop":
        return [L("Nazwa obrazu           PID     Pamięć"), L("explorer.exe           4120    98 412 KB"), L("chrome.exe             6644   412 800 KB"), L("discord.exe            7012   210 334 KB"), L("steam.exe              8120   156 220 KB"), L("TymekIT-Narzedzia.exe  9001    24 576 KB", "#4ade80")];
      case "taskkill": case "kill": return [L(`SUKCES: Proces "${arg || "?"}" został zakończony.`, "#4ade80")];
      case "df": return [L("System plików  Rozmiar  Użyte  Dostępne  Użycie"), L("C:\\            1.8T     612G   1.2T      33%")];
      case "free": return [L("          razem    użyte    wolne"), L("Pamięć:   32Gi     9.4Gi    22.6Gi")];
      case "sfc": return [L("Rozpoczynanie skanowania systemu... 100%"), L("Ochrona zasobów systemu Windows nie znalazła żadnych naruszeń integralności.", "#4ade80")];
      case "chkdsk": return [L("Typ systemu plików: NTFS. Sprawdzanie... 100%"), L("System Windows przeskanował system plików i nie znalazł problemów.", "#4ade80")];
      case "dism": return [L("Operacja przywracania zakończona pomyślnie.", "#4ade80")];
      case "gpupdate": return [L("Aktualizacja zasad zakończyła się pomyślnie.", "#4ade80")];
      case "cleanmgr": case "temp": case "%temp%": return [L("Usunięto 1 248 plików tymczasowych — zwolniono 3,4 GB 🧹", "#4ade80")];
      case "echo": return [L(arg)];
      case "color": return [L("Kolor? U nas zawsze jest neonowo 😎", "#c084fc")];
      case "exit": return [L("Nie uciekniesz tak łatwo 😄", "#fbbf24")];
      case "shutdown": return [L("System zostanie zamknięty za 3… 2… 1… żartowałem 😜", "#fbbf24")];
      case "sudo": return [L("gosc nie znajduje się w pliku sudoers. Ten incydent zostanie zgłoszony Tymkowi. 🚨", "#f87171")];
      case "matrix": setMatrix(true); return [L("Wchodzisz do Matrixa… (Esc lub Ctrl+C – wyjście)", "#4ade80")];
      case "rpg": case "gra": setRpg("start"); return [L("=== SERWISANT RPG ===", "#c084fc"), ...rpgLines("start")];
      case "bench": case "benchmark": setTimeout(runBench, 0); return [L("Uruchamiam benchmark TymekIT…", "#38bdf8")];
      case "klik": {
        const next = !clicks;
        setClicks(next);
        return [L(next ? "Dźwięk klawiatury włączony ⌨️ (wycisza się razem z suwakiem dźwięku)" : "Dźwięk klawiatury wyłączony.", "#c084fc")];
      }
      case "kawa": case "coffee": window.location.href = "/kawa"; return [L("Parzę kawę ☕…")];
      case "zgloszenie": case "pomoc": window.location.href = "/zgloszenie"; return [L("Otwieram formularz zgłoszenia…")];
      case "history": return history.map((h, i) => L(`  ${i + 1}  ${h}`));
      default:
        return [L(`'${c0}' nie jest rozpoznawane jako polecenie wewnętrzne lub zewnętrzne. Wpisz 'help'.`, "#f87171")];
    }
  };

  const prompt = rpg ? "RPG>" : zip ? `${cwd}\\${zip}>` : `${cwd}>`;

  const submit = () => {
    if (busy) return;
    const cmd = input;
    const res = run(cmd);
    if (cmd.trim()) setHistory((h) => [...h, cmd]);
    setHIdx(-1);
    setInput("");
    if (res === "clear") { setLines([]); return; }
    setLines((prev) => [...prev, { text: `${prompt} ${cmd}`, color: "#10b981" }, ...res].slice(-300));
  };

  const autocomplete = () => {
    const parts = input.split(" ");
    if (parts.length === 1) {
      const m = COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
      if (m.length === 1) setInput(m[0] + " ");
      else if (m.length > 1) setLines((p) => [...p, { text: m.join("   "), color: "#94a3b8" }]);
      return;
    }
    const last = parts[parts.length - 1].toLowerCase();
    const pool = zip ? Object.keys(ZIPS[zip]) : (FS[cwd] ?? []);
    const m = pool.filter((n) => n.toLowerCase().startsWith(last));
    if (m.length === 1) { parts[parts.length - 1] = m[0]; setInput(parts.join(" ")); }
    else if (m.length > 1) setLines((p) => [...p, { text: m.join("   "), color: "#94a3b8" }]);
  };

  const hintRow = ([c, d]: [string, string]) => (
    <div key={c} onClick={() => { if (c !== "Tab") setInput(c); inputRef.current?.focus(); }} style={{ cursor: "pointer", padding: "2px 0" }}>
      {c} <span style={{ color: "#4b5563" }}>— {d}</span>
    </div>
  );
  const catTitle = (t: string) => <div style={{ color: "#9ca3af", fontWeight: 700, margin: "10px 0 4px", textTransform: "uppercase", letterSpacing: ".08em" }}>{t}</div>;

  return (
    <section style={{ margin: "56px 0" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", borderRadius: "var(--rad)", overflow: "hidden", border: "1px solid #1e293b", boxShadow: "0 16px 40px rgba(0,0,0,0.8)" }}>
        <div style={{ background: "#0f172a", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
            <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>serwis@tymekit — cmd / bash</span>
          </div>
          <span style={{ fontSize: 11, color: "#06b6d4", fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap" }}>● WPISZ KOMENDĘ</span>
        </div>

        <div
          ref={bodyRef}
          onClick={() => inputRef.current?.focus()}
          style={{ position: "relative", background: "#050811", padding: 20, height: 320, overflowY: "auto", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, color: "#93c5fd", cursor: "text", wordBreak: "break-word" }}
        >
          {matrix && (
            <div style={{ position: "sticky", top: -20, height: 320, margin: -20, marginBottom: -300, zIndex: 2 }} onClick={() => setMatrix(false)}>
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", background: "#000", display: "block" }} />
              <div style={{ position: "absolute", bottom: 8, right: 12, color: "#4ade80", fontSize: 11 }}>Esc / Ctrl+C / kliknij – wyjście</div>
            </div>
          )}
          {lines.map((l, i) => (
            <div key={i} style={{ color: l.color ?? "#cbd5e1", whiteSpace: "pre-wrap" }}>{l.text || "\u00a0"}</div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span style={{ color: "#10b981", whiteSpace: "nowrap" }}>{prompt}</span>
            <input
              ref={inputRef}
              value={input}
              aria-label="Wpisz komendę"
              spellCheck={false}
              autoComplete="off"
              disabled={busy}
              onChange={(e) => { setInput(e.target.value); playClick(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                else if (e.key === "Tab") { e.preventDefault(); autocomplete(); }
                else if (e.key === "ArrowUp" && history.length) {
                  e.preventDefault();
                  const n = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1);
                  setHIdx(n); setInput(history[n]);
                } else if (e.key === "ArrowDown" && hIdx >= 0) {
                  e.preventDefault();
                  const n = hIdx + 1;
                  if (n >= history.length) { setHIdx(-1); setInput(""); } else { setHIdx(n); setInput(history[n]); }
                }
              }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontFamily: "monospace", fontSize: 13, caretColor: "#38bdf8" }}
            />
          </div>
        </div>
      </div>

      {zip && (
        <div style={{ maxWidth: 820, margin: "14px auto 0", borderRadius: "var(--rad)", overflow: "hidden", border: "1px solid #78350f", boxShadow: "0 12px 30px rgba(0,0,0,0.7)" }}>
          <div style={{ background: "#1c1408", padding: "8px 14px", display: "flex", justifyContent: "space-between", fontFamily: "monospace", fontSize: 12, color: "#fbbf24" }}>
            <span>🗜️ {zip} — podgląd archiwum (kliknij dwa razy plik)</span>
            <button type="button" onClick={() => { setZip(null); setZipView(null); }} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontFamily: "monospace" }}>✕ zamknij</button>
          </div>
          <div style={{ background: "#0a0703", padding: 14, fontFamily: "monospace", fontSize: 13, display: "grid", gap: 2 }}>
            {Object.keys(ZIPS[zip]).map((f) => (
              <div key={f} onDoubleClick={() => setZipView(f)} style={{ cursor: "pointer", padding: "3px 6px", borderRadius: 4, color: zipView === f ? "#050811" : "#fde68a", background: zipView === f ? "#fbbf24" : "transparent", userSelect: "none" }}>
                {f.endsWith(".exe") ? "⚙️" : "📄"} {f}
              </div>
            ))}
            {zipView && (
              <pre style={{ marginTop: 10, padding: 12, background: "#050811", border: "1px solid #1e293b", borderRadius: 8, color: "#4ade80", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12.5 }}>
                {ZIPS[zip][zipView]}
              </pre>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 820, margin: "14px auto 0", fontFamily: "monospace", fontSize: 12.5, color: "#6b7280", padding: "0 6px" }}>
        <div style={{ marginBottom: 6 }}>Przykładowe komendy (kliknij, aby wpisać):</div>
        {expanded ? (
          <>
            {catTitle("Komendy Windows")}
            {WIN_HINTS.map(hintRow)}
            {catTitle("Komendy Linux")}
            {LINUX_HINTS.map(hintRow)}
            {catTitle("Zabawa i triki")}
            {FUN_HINTS.map(hintRow)}
          </>
        ) : (
          ALL_HINTS.slice(0, 3).map(hintRow)
        )}
        <button type="button" className="terminal-more-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "▲ Zwiń" : `▼ Rozwiń więcej (${ALL_HINTS.length - 3})`}
        </button>
      </div>
    </section>
  );
}
