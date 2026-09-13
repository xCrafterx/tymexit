import { createFileRoute } from "@tanstack/react-router";
import { ReviewForm, ReviewsList } from "@/components/Reviews";

export const Route = createFileRoute("/opinie")({
  head: () => ({
    meta: [
      { title: "Opinie klientów — TymekIT" },
      { name: "description", content: "Przeczytaj opinie klientów TymekIT i podziel się własnym doświadczeniem z usług komputerowych." },
    ],
  }),
  component: OpiniePage,
});

function OpiniePage() {
  return (
    <>
      <section className="section">
        <div className="container">
          <div className="reveal visible">
            <span className="eyebrow"><span className="dot"></span> Opinie</span>
            <h1 className="section-title" style={{ marginTop: 18 }}>Opinie <span className="grad">klientów TymekIT.</span></h1>
            <p className="text-dim" style={{ marginTop: 10, maxWidth: 600 }}>
              Każda opinia ma znaczenie. Jeśli korzystałeś z usług TymekIT — podziel się wrażeniami.
            </p>
          </div>
          <ReviewsList />
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div className="reveal visible" style={{ maxWidth: 720, margin: "0 auto" }}>
            <span className="eyebrow"><span className="dot"></span> Dodaj opinię</span>
            <h2 className="section-title" style={{ marginTop: 18, marginBottom: 24 }}>Wystaw <span className="grad">swoją opinię.</span></h2>
            <ReviewForm />
          </div>
        </div>
      </section>
    </>
  );
}
