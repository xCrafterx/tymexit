import { useEffect, useRef, useState } from "react";
import { isSoundEnabled, setSoundEnabled } from "@/lib/notify";

// Cicha, nastrojowa muzyka w tle (royalty-free chill/ambient)
const BG_MUSIC_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";

export function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2); // Domyślnie cicho: 20%
  const [showSlider, setShowSlider] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Inicjalizacja dźwięków
  useEffect(() => {
    const notifyEnabled = isSoundEnabled();
    if (!notifyEnabled) {
      setVolume(0);
    }
  }, []);

  // Synchronizacja poziomu głośności z odtwarzaczem
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    const enabled = volume > 0 && isPlaying;
    setSoundEnabled(enabled);
  }, [volume, isPlaying]);

  // Autoodtwarzanie po pierwszej interakcji użytkownika ze stroną (obsługa blokad przeglądarek)
  useEffect(() => {
    const startAudio = () => {
      if (!userInteracted && audioRef.current && !isPlaying) {
        setUserInteracted(true);
        audioRef.current.volume = volume;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
    };

    window.addEventListener("pointerdown", startAudio, { once: true });
    window.addEventListener("keydown", startAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", startAudio);
      window.removeEventListener("keydown", startAudio);
    };
  }, [userInteracted, isPlaying, volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    setUserInteracted(true);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setSoundEnabled(false);
    } else {
      const targetVol = volume > 0 ? volume : 0.2;
      setVolume(targetVol);
      audioRef.current.volume = targetVol;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setSoundEnabled(true);
        })
        .catch(() => {});
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setUserInteracted(true);
    if (!audioRef.current) return;
    audioRef.current.volume = newVol;
    if (newVol > 0) {
      if (!isPlaying) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      }
      setSoundEnabled(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
      setSoundEnabled(false);
    }
  };

  const currentPercent = isPlaying ? Math.round(volume * 100) : 0;

  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <audio
        ref={audioRef}
        src={BG_MUSIC_URL}
        loop
        preload="auto"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="btn btn-ghost"
        style={{
          padding: "6px 10px",
          fontSize: 11,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          whiteSpace: "nowrap"
        }}
        title={isPlaying ? "Kliknij, aby wyciszyć" : "Kliknij, aby włączyć muzykę w tle"}
      >
        <span>{isPlaying && volume > 0 ? "🔊" : "🔇"}</span>
        <span>{isPlaying && volume > 0 ? `${currentPercent}%` : "Dźwięk"}</span>
      </button>

      {/* Pasek regulacji głośności od 0% do 100% */}
      {showSlider && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "rgba(10, 15, 30, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
          }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isPlaying ? volume : 0}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            style={{
              width: 90,
              accentColor: "#06b6d4",
              cursor: "pointer"
            }}
          />
          <span style={{ fontSize: 11, minWidth: 32, textAlign: "right", color: "#94a3b8", fontWeight: 600 }}>
            {currentPercent}%
          </span>
        </div>
      )}
    </div>
  );
}
