export function openProtonMail(ticket: {
  id: string;
  client_name?: string | null;
  client_email?: string | null;
  service_type: string;
  status: string;
  admin_note?: string | null;
}) {
  const email = ticket.client_email || "";
  const subject = `[TymekIT] Aktualizacja zlecenia #${ticket.id.slice(0, 8)} (${ticket.status.toUpperCase()})`;

  let body = `Dzień dobry${ticket.client_name ? ` ${ticket.client_name}` : ""},\n\n`;
  body += `Przesyłam aktualizację dotyczącą Twojego sprzętu w serwisie TymekIT:\n`;
  body += `• Numer zlecenia: #${ticket.id.slice(0, 8).toUpperCase()}\n`;
  body += `• Usługa: ${ticket.service_type}\n`;
  body += `• Aktualny status: ${ticket.status.toUpperCase()}\n`;

  if (ticket.admin_note) {
    body += `• Notatka serwisowa: ${ticket.admin_note}\n`;
  }

  if (ticket.status === "gotowe do odbioru" || ticket.status === "zakończone") {
    body += `\nTwój sprzęt został przetestowany i jest gotowy do odbioru! 💻✨\n`;
    body += `Możesz odpisać na tego maila, aby ustalić dogodną godzinę odbioru.\n`;
  } else if (ticket.status === "w diagnozie" || ticket.status === "w naprawie") {
    body += `\nSprzęt znajduje się obecnie na stanowisku diagnostycznym/naprawczym. Kolejne informacje prześlę po zakończeniu testów.\n`;
  } else if (ticket.status === "oczekuje na części") {
    body += `\nCzęści do Twojego komputera zostały zamówione. Czas oczekiwania na dostawę to zazwyczaj 24-48h.\n`;
  }

  body += `\nPozdrawiam serdecznie,\nTymoteusz — TymekIT Pogotowie Komputerowe\nE-mail: tymek2008@protonmail.com\nStrona: https://tymexit.lovable.app`;

  const protonUrl = `https://mail.proton.me/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(protonUrl, "_blank");
}
