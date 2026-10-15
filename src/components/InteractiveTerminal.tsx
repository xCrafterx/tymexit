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
const FILES: Record<string, string> = {
  "sekret.txt": "Gratulacje! Znalazłeś sekret 🎉 Wpisz 'matrix' albo odwiedź /sekret 😉",
  "README.txt": "TymekIT — serwis komputerowy. Zgłoś problem: /zgloszenie  |  tel. +48 695 560 039",
  "diagnostyka.log": "[OK] CPU  [OK] RAM 16GB  [OK] NVMe 98%  [WARN] pasta termoprzewodząca do wymiany",
  "hosts": "127.0.0.1  localhost\n::1        localhost",
};

const HINTS: [string, string][] = [
  ["help", "lista wszystkich komend"],
  ["ipconfig /all", "konfiguracja sieci (Windows)"],
  ["ifconfig", "konfiguracja sieci (Linux)"],
  ["dir  /  dir /s  /  ls", "zawartość folderu"],
  ["cd C:\\Windows\\System32", "przejdź do folderu (cd .. – wyżej)"],
  ["cls  /  clear", "wyczyść ekran"],
  ["ping google.com", "test połączenia"],
  ["tracert google.com", "trasa pakietów"],
  ["systeminfo  /  neofetch", "informacje o systemie"],
  ["tasklist  /  ps  /  top", "uruchomione procesy"],
  ["whoami  /  hostname", "kim jestem"],
  ["type sekret.txt  /  cat", "pokaż plik"],
  ["tree", "drzewo folderów"],
  ["netstat  /  nslookup google.com", "połączenia i DNS"],
  ["sfc /scannow  /  chkdsk", "naprawa systemu i dysku"],
  ["ver  /  uname -a  /  date  /  time", "wersja i czas"],
  ["df -h  /  free -h  /  uptime", "dysk, RAM, czas pracy"],
  ["shutdown  /  sudo  /  matrix", "niespodzianki 😉"],
];

const norm = (p: string) => p.replace(/\//g, "\\").replace(/\\+$/, "") || "C:";

export function InteractiveTerminal() {
  const [lines, setLines] = useState<Line[]>([
    { text: "TymekIT Terminal v4.0 — Microsoft Windows [Wersja 10.0.22631] + bash", color: "#38bdf8" },
    { text: "Wpisz 'help', aby zobaczyć komendy. Śmiało, to tylko symulacja 🙂", color: "#94a3b8" },
  ]);
  const [cwd, setCwd] = useState("C:\\Users\\Tymek");
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const resolve = (arg: string): string | null => {
    let a = arg.trim().replace(/^"|"$/g, "");
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
      out.push({ text: `${"  ".repeat(depth)}${isDir ? "<DIR>     " : "   4 096  "}${name}`, color: isDir ? "#60a5fa" : "#cbd5e1" });
      if (recursive && isDir) out.push(...listDir(full, true, depth + 1));
    }
    return out;
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

    switch (cmd) {
      case "help": case "?": case "man":
        return [L("Dostępne komendy:", "#fbbf24"), ...HINTS.map(([c, d]) => L(`  ${c.padEnd(34)} ${d}`))];
      case "cls": case "clear": return "clear";
      case "ipconfig":
        if (al === "/all") return [
          L("Konfiguracja IP systemu Windows"), L("   Nazwa hosta . . . . . . . : TYMEKIT-PC"), L(""),
          L("Karta bezprzewodowa sieci LAN Wi-Fi:", "#fbbf24"),
          L("   Opis. . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201 160MHz"),
          L("   Adres fizyczny. . . . . . : 3C-A9-F4-12-7B-9E"),
          L("   DHCP włączone . . . . . . : Tak"),
          L("   Adres IPv4. . . . . . . . : 192.168.1.37(Preferowany)"),
          L("   Maska podsieci. . . . . . : 255.255.255.0"),
          L("   Brama domyślna. . . . . . : 192.168.1.1"),
          L("   Serwery DNS . . . . . . . : 1.1.1.1, 8.8.8.8"),
        ];
        if (al === "/release") return [L("Adres IP zwolniony.", "#fbbf24")];
        if (al === "/renew") return [L("Odnowiono dzierżawę DHCP: 192.168.1.37", "#4ade80")];
        if (al === "/flushdns") return [L("Pomyślnie opróżniono pamięć podręczną programu rozpoznawania nazw DNS.", "#4ade80")];
        return [L("Karta Wi-Fi:"), L("   Adres IPv4. . . : 192.168.1.37"), L("   Maska . . . . . : 255.255.255.0"), L("   Brama . . . . . : 192.168.1.1")];
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
        const dir = resolve(arg);
        if (!dir) return [L("System nie może odnaleźć określonej ścieżki.", "#f87171")];
        setCwd(dir);
        return [];
      }
      case "pwd": return [L(cwd)];
      case "type": case "cat": case "more": {
        const f = Object.keys(FILES).find((k) => k.toLowerCase() === al.split("\\").pop());
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
        return [L("Nazwa hosta:            TYMEKIT-PC", "#fbbf24"), L("System operacyjny:      Microsoft Windows 11 Pro"), L("Procesor:               AMD Ryzen 7 5800X 8-Core 3.8GHz"), L("Pamięć RAM:             16 384 MB"), L("Karta graficzna:        NVIDIA GeForce RTX 3060"), L("Dysk:                   NVMe 1TB (zdrowie 98%)"), L("Serwisant:              TymekIT ✔", "#4ade80")];
      case "tasklist": case "ps": case "top": case "htop":
        return [L("Nazwa obrazu           PID     Pamięć"), L("explorer.exe           4120    98 412 KB"), L("chrome.exe             6644   412 800 KB"), L("discord.exe            7012   210 334 KB"), L("steam.exe              8120   156 220 KB"), L("TymekIT-Narzedzia.exe  9001    24 576 KB", "#4ade80")];
      case "taskkill": case "kill": return [L(`SUKCES: Proces "${arg || "?"}" został zakończony.`, "#4ade80")];
      case "df": return [L("System plików  Rozmiar  Użyte  Dostępne  Użycie"), L("C:\\            931G     412G   519G      45%")];
      case "free": return [L("          razem    użyte    wolne"), L("Pamięć:   16Gi     6.2Gi    9.8Gi")];
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
      case "matrix": window.location.href = "/matrix"; return [L("Wchodzisz do Matrixa…", "#4ade80")];
      case "kawa": case "coffee": window.location.href = "/kawa"; return [L("Parzę kawę ☕…")];
      case "zgloszenie": case "pomoc": window.location.href = "/zgloszenie"; return [L("Otwieram formularz zgłoszenia…")];
      case "history": return history.map((h, i) => L(`  ${i + 1}  ${h}`));
      default:
        return [L(`'${c0}' nie jest rozpoznawane jako polecenie wewnętrzne lub zewnętrzne. Wpisz 'help'.`, "#f87171")];
    }
  };

  const prompt = `${cwd}>`;

  const submit = () => {
    const cmd = input;
    const res = run(cmd);
    if (cmd.trim()) setHistory((h) => [...h, cmd]);
    setHIdx(-1);
    setInput("");
    if (res === "clear") { setLines([]); return; }
    setLines((prev) => [...prev, { text: `${prompt} ${cmd}`, color: "#10b981" }, ...res].slice(-300));
  };

  const visibleHints = expanded ? HINTS : HINTS.slice(0, 3);

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
          style={{ background: "#050811", padding: 20, height: 320, overflowY: "auto", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, color: "#93c5fd", cursor: "text", wordBreak: "break-word" }}
        >
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
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

      <div style={{ maxWidth: 820, margin: "14px auto 0", fontFamily: "monospace", fontSize: 12.5, color: "#6b7280", padding: "0 6px" }}>
        <div style={{ marginBottom: 6 }}>Przykładowe komendy (kliknij, aby wpisać):</div>
        {visibleHints.map(([c, d]) => (
          <div key={c} onClick={() => { setInput(c.split("  /  ")[0]); inputRef.current?.focus(); }} style={{ cursor: "pointer", padding: "2px 0" }}>
            {c} <span style={{ color: "#4b5563" }}>— {d}</span>
          </div>
        ))}
        <button type="button" className="terminal-more-btn" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "▲ Zwiń" : `▼ Rozwiń więcej (${HINTS.length - 3})`}
        </button>
      </div>
    </section>
  );
}
