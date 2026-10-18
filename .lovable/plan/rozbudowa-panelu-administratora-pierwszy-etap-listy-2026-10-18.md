# Rozbudowa panelu administratora — pierwszy etap listy

## Teraz
- Dodać magazyn części: nazwa, ilość, koszt jednostkowy, dodawanie części oraz przyciski +1/−1 z zapisem; ilość nie może spaść poniżej zera.
- Dodać finanse: zapis ceny dla klienta i kosztów przy zgłoszeniu, automatycznie wyliczany zysk oraz zestawienie zarobków.
- Dodać kalendarz zleceń oparty na zapisanych terminach zgłoszeń, z możliwością zmiany daty i godziny.
- Dodać pobieranie zestawienia zgłoszeń i finansów do CSV otwieranego w Excelu.
- Zachować istniejący protokół przyjęcia sprzętu i możliwość zapisania go jako PDF przez drukowanie.
- Sprawdzić nowe funkcje na zalogowanym koncie administratora i poprawić napotkane błędy.

## Następne etapy pozostają na liście
- Gotowe odpowiedzi w czacie, czarna lista numerów i e-maili, własne kody rabatowe z procentem rabatu, ranking podstron.
- Pasek ostatnich napraw, suwak „Przed i Po”, kontakt WhatsApp/telefon oraz kalkulator czasu naprawy.
- Schematy kroków w „Najczęstszych problemach” i tekstowa diagnoza AI bez analizy zdjęć.

## Szczegóły techniczne
- Nowe dane przechowywać w Lovable Cloud, z dostępem do finansów i magazynu wyłącznie dla administratora przez polityki bezpieczeństwa.
- Ilość części zmieniać atomowo, aby równoczesne kliknięcia nie nadpisywały stanów.
- Nowe zakładki dołączyć do istniejącego panelu bez zmiany nawigacji strony.
- Dodać testy zasad ilości, obliczania zysku i eksportu CSV; publikacja nie jest częścią tego etapu.