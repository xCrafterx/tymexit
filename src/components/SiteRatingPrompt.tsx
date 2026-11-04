import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function SiteRatingPrompt() {
  const [tipDismissed, setTipDismissed] = useState(false);
  const [hasRated, setHasRated] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Sprawdzamy czy już kiedyś oceniono
    const rated = localStorage.getItem("tymekit_site_rated");
    if (!rated) {
      setHasRated(false);
    }
  }, []);

  if (hasRated || isDismissed) {
    return null;
  }

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Wybierz ocenę od 1 do 10!");
      return;
    }

    setSubmitting(true);
    try {
      let clientIp = "Nieznane IP";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        clientIp = ipData.ip;
      } catch {}

      const res = await fetch("/api/public/site-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          clientIp,
          browser: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Błąd podczas zapisywania oceny");
      }

      localStorage.setItem("tymekit_site_rated", "true");
      setHasRated(true);
      window.dispatchEvent(new CustomEvent("tymekit_rating_submitted"));
      toast.success("Dziękujemy za ocenę strony!");
    } catch (e: any) {
      toast.error(e.message || "Nie udało się zapisać oceny.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div
      className="site-rating-prompt"
      style={{
        background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95))",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        borderLeft: "4px solid #6366f1",
        borderRadius: "14px",
        padding: "16px 20px",
        margin: "140px auto 20px auto",
        maxWidth: "960px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        position: "relative",
        zIndex: 40,
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <button
        onClick={() => setIsDismissed(true)}
        title="Zamknij (pojawi się ponownie przy odświeżeniu)"
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          background: "transparent",
          border: "none",
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: "18px",
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      <div className="site-rating-prompt-content" style={{ paddingRight: "30px" }}>
        <div className="site-rating-prompt-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "18px" }}>⭐</span>
          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#fff" }}>
            Na ile ta strona jest ładna i ogarnięta? (od 1 do 10)
          </h4>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "rgba(255, 255, 255, 0.65)" }}>
          Twój głos pomaga mi rozwijać i ulepszać stronę TymekIT. Ocena jest jednorazowa.
        </p>

        {/* Przyciski 1 do 10 */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const isSelected = rating === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  border: isSelected ? "1px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: isSelected
                    ? "linear-gradient(135deg, #06b6d4, #a855f7)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: isSelected ? "#fff" : "rgba(255, 255, 255, 0.85)",
                  fontWeight: isSelected ? "bold" : "normal",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Opcjonalny komentarz */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600", display: "block" }}>
            Napisz tutaj co mam dodać lub zmienić.
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Komentarz lub uwagi (opcjonalnie, widoczne tylko dla administratora)..."
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || rating === null}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                border: "none",
                background:
                  rating === null
                    ? "rgba(255, 255, 255, 0.1)"
                    : "linear-gradient(135deg, #06b6d4, #6366f1)",
                color: rating === null ? "rgba(255, 255, 255, 0.4)" : "#fff",
                fontWeight: "600",
                fontSize: "13px",
                cursor: rating === null || submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Wysyłanie..." : "Wyślij ocenę"}
            </button>
          </div>
        </div>
      </div>
    </div>
    {!tipDismissed && (
      <div
        style={{
          background: "linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.95))",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(6, 182, 212, 0.3)",
          borderLeft: "4px solid #06b6d4",
          borderRadius: "14px",
          padding: "16px 20px",
          margin: "0 auto 20px auto",
          maxWidth: "960px",
          boxShadow: "0 0 24px rgba(6, 182, 212, 0.15)",
          position: "relative",
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setTipDismissed(true)}
          title="Zamknij"
          aria-label="Zamknij"
          style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}
        >
          ✕
        </button>
        <h4 style={{ margin: "0 0 6px", paddingRight: 30, fontSize: 16, fontWeight: 600, color: "#fff" }}>
          💡 Zanim ocenisz, rzuć okiem na inne zakątki serwisu!
        </h4>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
          Chciałbym, abyś przed wystawieniem oceny sprawdził też inne podstrony – dzięki temu Twoja opinia będzie pełniejsza.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { to: "/programy", label: "💾 Moje Programy" },
            { to: "/najczestsze-problemy", label: "⚡ Najczęstsze problemy" },
            { to: "/faq", label: "❓ FAQ" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(168,85,247,0.4)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    )}
    </>
  );
}
