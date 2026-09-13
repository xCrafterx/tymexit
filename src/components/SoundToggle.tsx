import { useEffect, useRef, useState } from "react";
import { setSoundEnabled } from "@/lib/notify";

// Ciągły, 24/7 spokojny i rytmiczny strumień lo-fi / chillhop beats bez przerw i bez resetowania się
const BG_MUSIC_STREAM_URL = "https://streams.ilovemusic.de/iloveradio17.mp3";

const STORAGE_KEY = "tymekit_audio_volume";
const DEFAULT_VOLUME = 0.10; // 10%

export function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Odczyt zapamiętanej głośności lub domyślnie 10%
  const [volume, setVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
      }
    } catch {}
    return DEFAULT_VOLUME;
  });

  const [isPlaying, setIsPlaying] = useState(false);

  // Ustawienie i blokada głośności na elemencie audio
  const applyVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  useEffect(() => {
    applyVolume(volume);
    setSoundEnabled(volume > 0);
    try {
      localStorage.setItem(STORAGE_KEY, String(volume));
    } catch {}
  }, [volume]);

  // Strażnik głośności: przeglądarka przy zmianie utworu / buforowaniu nie może podbić głośności
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const enforce = () => {
      if (audio.volume !== volume) {
        audio.volume = volume;
      }
    };

    audio.addEventListener("play", enforce);
    audio.addEventListener("playing", enforce);
    audio.addEventListener("canplay", enforce);
    audio.addEventListener("timeupdate", enforce);
    audio.addEventListener("volumechange", () => {
      // Zapobiegaj samowolnemu resetowaniu głośności przez przeglądarkę
      if (Math.abs(audio.volume - volume) > 0.02) {
        audio.volume = volume;
      }
    });

    return () => {
      audio.removeEventListener("play", enforce);
      audio.removeEventListener("playing", enforce);
      audio.removeEventListener("canplay", enforce);
      audio.removeEventListener("timeupdate", enforce);
    };
  }, [volume]);

  // Autoodtwarzanie przy pierwszej interakcji użytkownika (klik, klawisz, scroll)
  useEffect(() => {
    const playMusic = () => {
      if (audioRef.current && !isPlaying && volume > 0) {
        applyVolume(volume);
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

  // Zamykanie menu suwaka po kliknięciu poza komponentem
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
    setIsOpen((prev) => !prev);

    if (audioRef.current && !isPlaying && volume > 0) {
      applyVolume(volume);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    applyVolume(newVol);
    if (newVol > 0) {
      if (!isPlaying && audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  };

  const percent = Math.round(volume * 100);

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <audio
        ref={audioRef}
        src={BG_MUSIC_STREAM_URL}
        preload="auto"
        loop
      />

      {/* Przycisk Dźwięki - kliknięcie otwiera suwak */}
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
