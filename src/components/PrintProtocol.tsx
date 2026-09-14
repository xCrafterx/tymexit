import React from "react";

export function printTicketProtocol(ticket: {
  id: string;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  title: string;
  description: string;
  service_type: string;
  created_at: string;
}) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="utf-8">
      <title>Protokół przyjęcia sprzętu #${ticket.id.slice(0, 8)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.5; font-size: 14px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #06b6d4; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #0891b2; }
        .title { font-size: 18px; font-weight: 800; margin: 0; }
        .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #f8fafc; }
        .box h3 { margin-top: 0; font-size: 14px; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
        .sign-line { border-top: 1px dashed #64748b; padding-top: 8px; text-align: center; font-size: 12px; color: #64748b; }
        .rules { font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">TymekIT</div>
          <div>Pogotowie Komputerowe & Serwis IT</div>
          <div>E-mail: tymek2008@protonmail.com</div>
        </div>
        <div style="text-align: right;">
          <h1 class="title">PROTOKÓŁ PRZYJĘCIA SPRZĘTU</h1>
          <div>Numer: <strong>#${ticket.id.slice(0, 8).toUpperCase()}</strong></div>
          <div>Data: ${new Date(ticket.created_at).toLocaleDateString("pl-PL")}</div>
        </div>
      </div>

      <div class="grid">
        <div class="box">
          <h3>Dane Klienta</h3>
          <div><strong>Imię i nazwisko:</strong> ${ticket.client_name || "Nie podano"}</div>
          <div><strong>Telefon:</strong> ${ticket.client_phone || "Nie podano"}</div>
          <div><strong>E-mail:</strong> ${ticket.client_email || "Nie podano"}</div>
        </div>
        <div class="box">
          <h3>Szczegóły zgłoszenia</h3>
          <div><strong>Typ usługi:</strong> ${ticket.service_type}</div>
          <div><strong>Tytuł / Urządzenie:</strong> ${ticket.title}</div>
          <div><strong>Stan wizualny:</strong> Przyjęto do diagnozy</div>
        </div>
      </div>

      <div class="box">
        <h3>Opis zgłaszanej usterki / Uwagi</h3>
        <p style="white-space: pre-wrap; margin: 0;">${ticket.description || "Brak szczegółowego opisu"}</p>
      </div>

      <div class="rules">
        <strong>Warunki przyjęcia do serwisu:</strong><br>
        1. Serwis nie odpowiada za dane znajdujące się na nośnikach pamięci. Klient oświadcza, że wykonał kopię zapasową lub zlecił jej wykonanie.<br>
        2. Wstępna diagnoza i ustalenie kosztów następuje przed przystąpieniem do naprawy właściwej.<br>
        3. Sprzęt nieodebrany w ciągu 90 dni od powiadomienia o zakończeniu naprawy podlega procedurze utylizacji.
      </div>

      <div class="signatures">
        <div class="sign-line">Podpis i pieczęć Serwisu</div>
        <div class="sign-line">Czytelny podpis Klienta</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
