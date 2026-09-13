import { useEffect, useRef, useState } from "react";
import { setSoundEnabled } from "@/lib/notify";

// Cicha, klimatyczna muzyka w tle (royalty-free lofi / synth chill)
const BG_MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";

export function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [volume, setVolume] = useState(0.5); // Domyślnie automatycznie 50%
  const [isPlaying, setIsPlaying] = useState(false);

  // Ustawienie początkowej głośności 50%
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, []);

  // Aktualizacja audio i notify
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setSoundEnabled(volume > 0);
  }, [volume]);

  // Autoodtwarzanie przy pierwszej interakcji ze stroną (kliknięcie / przewijanie / klawisz)
  useEffect(() => {
    const playMusic = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.volume = volume;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener("pointerdown", playMusic, { once: true });
    window.addEventListener("keydown", playMusic, { once: true });
    window.addEventListener("scroll", playMusic, { once: true });

    return () => {
      window.removeEventListener("pointerdown", playMusic);
      window.removeEventListener("keydown", playMusic);
      window.removeEventListener("scroll", playMusic);
    };
  }, [isPlaying, volume]);

  // Zamykanie menu suwaka po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleClick = () => {
    // Kliknięcie rozwija/zwija suwak głośności
    setIsOpen((prev) => !prev);

    // Jeśli muzyka nie grała jeszcze, uruchamiamy ją od razu na 50%
    if (audioRef.current && !isPlaying && volume > 0) {
      audioRef.current.volume = volume;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (!audioRef.current) return;
    audioRef.current.volume = newVol;
    if (newVol > 0) {
      if (!isPlaying) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const percent = Math.round(volume * 100);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <audio
        ref={audioRef}
        src={BG_MUSIC_URL}
        loop
        preload="auto"
      />

      {/* Przycisk Dźwięki - bez on/off, kliknięcie otwiera suwak */}
      <button
        type="button"
        onClick={handleToggleClick}
        className="btn btn-ghost"
        style={{
          padding: "6px 12px",
          fontSize: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          background: isOpen ? "rgba(255, 255, 255, 0.08)" : undefined
        }}
        title="Regulacja głośności muzyki"
      >
        <span>{volume > 0 ? "🔊" : "🔇"}</span>
        <span>Dźwięki</span>
      </button>

      {/* Suwak pojawiający się tylko po kliknięciu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            background: "rgba(10, 15, 30, 0.96)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 99999,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)"
          }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            style={{
              width: 100,
              accentColor: "#06b6d4",
              cursor: "pointer"
            }}
          />
          <span style={{ fontSize: 12, minWidth: 36, textAlign: "right", color: "#38bdf8", fontWeight: 700 }}>
            {percent}%
          </span>
        </div>
      )}
    </div>
  );
}
