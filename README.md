# TymekIT Service Hub

Zbuduj pełną aplikację serwisu TymekIT na podstawie załączonego archiwum tymekit-main.zip oraz stylistyki https://tymexit.lovable.app/.

Kluczowe wymagania:
1. Design: ciemny motyw premium (ciemne tło, akcenty cyan i fiolet, glassmorphism, gradienty, zaokrąglone karty).
2. Formularz publiczny zgłoszenia:
   - Pola: Imię i nazwisko, Telefon, Email, Hasło, Tytuł problemu, Typ usługi (dropdown: Naprawa laptopa, Naprawa komputera, Czyszczenie i optymalizacja, Instalacja systemu, Komputer na zamówienie, Modernizacja sprzętu, Sieć Wi-Fi, Pomoc zdalna), Opis problemu, Upload zdjęć/plików (max 5).
   - Po wysłaniu: automatyczne utworzenie konta klienta (email + hasło), zapis zgłoszenia, przekierowanie do /login z komunikatem: „Zgłoszenie wysłane! Zaloguj się, aby zobaczyć status swojego zgłoszenia.”
3. Panel Klienta (/panel-klienta):
   - Zakładki: Zgłoszenia (liczniki statusów, formularz nowego zgłoszenia, historia z podglądem postępu i czatem), Wystaw opinię (lista własnych opinii + formularz dodawania/edycji), Konto (zmiana email i hasła), Moje sekrety.
4. Panel Admina (/panel-admin, /admin):
   - Nawigacja: Obsługa klienta | Społeczność | Konto i profil
   - Obsługa klienta → Zgłoszenia (liczniki statusów, filtry, lista zleceń, Kosz, Czat na żywo)
   - Społeczność → Opinie (edycja, usuwanie, dodawanie opinii)
   - Konto i profil (zmiana danych logowania)
5. Włącz Lovable Cloud z bazą Supabase (tabele tickets, ticket_attachments, ticket_messages, reviews, profiles z rolami admin/klient wg załączonych migracji).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://tymexit.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1bb132c6-d86a-484b-afcf-27501798e09b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
