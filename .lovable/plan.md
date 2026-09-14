# Naprawa widoku mobilnego

## Zakres
- Przebudować górny pasek poniżej 960 px na stabilny układ: logo po lewej, kompaktowe akcje i hamburger po prawej.
- Schować desktopowe linki, separator RGB, przycisk dźwięku oraz zbędne teksty akcji na węższych ekranach; zachować pełny dostęp do stron w menu mobilnym.
- Uzupełnić menu mobilne o właściwy stan zalogowania, panel i wylogowanie, zachowując aktywne linki oraz dotychczasowe działanie przewijania i motywu.
- Usunąć źródła poziomego przewijania w sekcji głównej, ocenach i stopce, bez zmian w panelach klienta i admina.
- Sprawdzić widok telefonu i tabletu w przeglądarce oraz potwierdzić brak poziomego przepełnienia.

## Szczegóły techniczne
- Zastąpić style wpisane bezpośrednio w navbarze nazwanymi klasami i zastosować dwukolumnowy grid z `min-width: 0` oraz stałymi kontrolkami.
- Dodać spójne reguły dla progów 960, 760 i 420 px oraz bezpieczne zawijanie długich treści.
- Ograniczyć szerokości wewnętrznych siatek ocen do `minmax(0, 1fr)` i dopasować odstępy na telefonie.
- Nie zmieniać logiki ani plików paneli.
