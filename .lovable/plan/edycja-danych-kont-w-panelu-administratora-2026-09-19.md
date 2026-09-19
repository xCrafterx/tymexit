# Edycja danych kont w panelu administratora

## Zakres
- Zmienić oznaczenie konta administratora z „ADMIN” na „ADMINISTRATOR” i nadać mu mocną czerwoną, pulsującą poświatę.
- Dodać przy każdym koncie przycisk „Zmień dane”, otwierający formularz edycji imienia, nazwiska i adresu e-mail.
- Udostępnić tę samą edycję dla kont klientów oraz konta administratora.
- Po zapisie odświeżać kartę konta i pokazywać czytelny komunikat powodzenia lub błędu.

## Dane i bezpieczeństwo
- Dodać do profilu osobne, opcjonalne pola imienia i nazwiska, aby dane nie zależały od treści wcześniejszych zgłoszeń.
- Zmianę wykonywać wyłącznie po potwierdzeniu uprawnień administratora po stronie serwera.
- Przy zmianie e-maila zaktualizować zarówno dane logowania, jak i profil; obsłużyć zajęty lub nieprawidłowy adres.
- Nie zmieniać ani nie ujawniać haseł.

## Weryfikacja
- Sprawdzić zapis zmian dla klienta i administratora, anulowanie edycji oraz wygląd na telefonie.
- Potwierdzić brak błędów kompilacji i działania strony.

## Szczegóły techniczne
- Rozszerzyć tabelę profili o `first_name` i `last_name` przez bezpieczną migrację.
- Dodać chronioną funkcję aktualizacji konta oraz interfejs edycji w istniejącej zakładce „Konta klientów”.
- Zmiany pozostaną w projekcie zsynchronizowanym przez Lovable; bezpośrednie operacje Git nie są wykonywane w tym środowisku.
