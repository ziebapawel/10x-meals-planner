# Dokument wymagań produktu (PRD) - Meals planner

## 1. Przegląd produktu

Aplikacja "Meals planner" to inteligentny asystent planowania posiłków w formie aplikacji webowej, zaprojektowany w celu uproszczenia i automatyzacji procesu tworzenia tygodniowych planów żywieniowych oraz generowania list zakupów dla wieloosobowych gospodarstw domowych. Sercem aplikacji jest silnik AI (korzystający z `openrouter.ai`), który na podstawie szczegółowych wytycznych użytkownika – takich jak liczba osób, dni, preferencje kulinarne, ograniczenia dietetyczne i indywidualne zapotrzebowanie kaloryczne – tworzy spersonalizowane przepisy. System kont użytkowników, oparty o `Supabase`, umożliwia zapisywanie historii planów i list zakupów. Aplikacja ma na celu rozwiązanie problemu czasochłonnego planowania, monotonii w diecie oraz niekompletnych zakupów spożywczych.

## 2. Problem użytkownika

Ręczne tworzenie listy zakupów spożywczych oraz planowanie zróżnicowanych posiłków dla kilkuosobowej rodziny jest procesem skomplikowanym, czasochłonnym i podatnym na błędy. Użytkownicy często borykają się z brakiem pomysłów na dania, co prowadzi do monotonii w diecie. Ponadto, ręczne agregowanie składników z wielu przepisów w jedną listę zakupów często kończy się zapominaniem o niezbędnych produktach lub kupowaniem nadmiarowych ilości. Brak centralnego miejsca do przechowywania planów i list dodatkowo utrudnia organizację.

## 3. Wymagania funkcjonalne

- `F-001`: System uwierzytelniania użytkowników (rejestracja, logowanie, wylogowanie) z wykorzystaniem `Supabase`.
- `F-002`: Formularz generowania planu posiłków, pozwalający na zdefiniowanie:
  - `F-002.1`: Liczby osób.
  - `F-002.2`: Liczby dni.
  - `F-002.3`: Rodzaju kuchni (np. polska, włoska).
  - `F-002.4`: Listy wykluczonych składników (wspólnej dla wszystkich).
  - `F-002.5`: Indywidualnej docelowej kaloryczności dla każdej z osób.
  - `F-002.6`: Wyboru posiłków do zaplanowania (śniadanie, obiad, kolacja etc.).
- `F-003`: Integracja z silnikiem AI (`openrouter.ai`) do generowania przepisów spełniających podane kryteria.
- `F-004`: AI musi obliczyć i podać w gramach wielkość porcji dla każdej osoby, aby dopasować posiłek do jej indywidualnych celów kalorycznych.
- `F-005`: Interaktywny interfejs (siatka) do przeglądania wygenerowanego planu posiłków.
- `F-006`: Możliwość regeneracji pojedynczego posiłku w planie bez zmiany pozostałych dań.
- `F-007`: Zapisywanie zaakceptowanego planu posiłków w bazie danych na koncie użytkownika.
- `F-008`: Generowanie zagregowanej listy zakupów dla zapisanego planu posiłków.
- `F-009`: AI musi agregować składniki z wszystkich przepisów i kategoryzować je według typowych działów sklepowych (np. warzywa, nabiał, mięso).
- `F-010`: Dostęp do historii zapisanych planów posiłków i powiązanych z nimi list zakupów.
- `F-011`: Wyświetlanie ekranu powitalnego ("empty state") dla nowych użytkowników, zachęcającego do stworzenia pierwszego planu.
- `F-012`: Zapisywanie ostatnich ustawień formularza (kaloryczność, liczba osób etc.) w `localStorage` przeglądarki.

## 4. Granice produktu

Wersja MVP (Minimum Viable Product) aplikacji celowo nie będzie zawierać następujących funkcjonalności:

- `OOS-001`: Ręczne tworzenie, dodawanie lub edytowanie posiłków w planie.
- `OOS-002`: System oceniania posiłków lub planów.
- `OOS-003`: Funkcje współdzielenia planów posiłków i list zakupów między użytkownikami.
- `OOS-004`: Dedykowane aplikacje mobilne (iOS, Android). Dostępna będzie tylko wersja webowa.
- `OOS-005`: Eksport planu posiłków (przepisów) do plików zewnętrznych (np. PDF, DOCX).
- `OOS-006`: Eksport listy zakupów do plików zewnętrznych.
- `OOS-007`: Możliwość odznaczania (check-off) posiadanych produktów na liście zakupów.
- `OOS-008`: Możliwość ręcznej edycji lub usuwania produktów z wygenerowanej listy zakupów.
- `OOS-009`: Zapisywanie preferencji użytkownika (np. domyślnej kaloryczności) na jego koncie w bazie danych.

## 5. Historyjki użytkowników

---

- ID: `US-001`
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu adresu e-mail i hasła, aby móc zapisywać swoje plany posiłków i listy zakupów.
- Kryteria akceptacji:
  - 1. Formularz rejestracji zawiera pola na adres e-mail i hasło.
  - 2. System waliduje poprawność formatu adresu e-mail.
  - 3. System wymaga hasła o minimalnej długości.
  - 4. Po pomyślnej rejestracji, jestem automatycznie zalogowany i przekierowany do głównego panelu aplikacji.
  - 5. W przypadku błędu (np. zajęty e-mail), wyświetlany jest czytelny komunikat.

---

- ID: `US-002`
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto przy użyciu adresu e-mail i hasła, aby uzyskać dostęp do moich zapisanych danych.
- Kryteria akceptacji:
  - 1. Formularz logowania zawiera pola na adres e-mail i hasło.
  - 2. Po pomyślnym zalogowaniu, jestem przekierowany do głównego panelu aplikacji.
  - 3. W przypadku podania błędnych danych, wyświetlany jest odpowiedni komunikat.

---

- ID: `US-003`
- Tytuł: Tworzenie nowego planu posiłków
- Opis: Jako zalogowany użytkownik, chcę wypełnić formularz z moimi wymaganiami (liczba osób, dni, rodzaj kuchni, wykluczone składniki, kaloryczność dla każdej osoby), aby wygenerować dopasowany do mnie plan posiłków.
- Kryteria akceptacji:
  - 1. Mogę zdefiniować liczbę osób i liczbę dni (np. od 1 do 7).
  - 2. Po wpisaniu liczby osób, dynamicznie pojawia się odpowiednia liczba pól do wpisania kaloryczności.
  - 3. Mogę wybrać rodzaj kuchni z predefiniowanej listy.
  - 4. Mogę wpisać listę składników do wykluczenia.
  - 5. Formularz jest walidowany (np. kaloryczność musi być w rozsądnym zakresie).
  - 6. Po kliknięciu "Generuj plan", widzę wskaźnik ładowania, informujący o trwającym procesie.
  - 7. Po zakończeniu generowania, widzę interaktywną siatkę z propozycjami posiłków.

---

- ID: `US-004`
- Tytuł: Przeglądanie i modyfikacja planu posiłków
- Opis: Jako użytkownik, po wygenerowaniu planu, chcę móc go przejrzeć i w razie potrzeby wymienić pojedynczy posiłek, który mi nie odpowiada, na inną propozycję.
- Kryteria akceptacji:
  - 1. Wygenerowany plan jest wyświetlony w formie czytelnej siatki (dni/posiłki).
  - 2. Każdy posiłek na siatce posiada przycisk "Regeneruj".
  - 3. Kliknięcie "Regeneruj" powoduje wysłanie zapytania do AI o nową propozycję tylko dla tego konkretnego posiłku, z zachowaniem tych samych kryteriów.
  - 4. Nowa propozycja zastępuje starą na siatce, a reszta planu pozostaje bez zmian.
  - 5. Proces regeneracji również pokazuje stan ładowania.

---

- ID: `US-005`
- Tytuł: Akceptacja i zapisywanie planu
- Opis: Jako użytkownik, gdy jestem zadowolony z wygenerowanego planu posiłków, chcę go zapisać na moim koncie, aby móc do niego wrócić w przyszłości i wygenerować listę zakupów.
- Kryteria akceptacji:
  - 1. Na ekranie z planem posiłków znajduje się przycisk "Zapisz plan".
  - 2. Po kliknięciu przycisku, cały plan (wszystkie posiłki i ich szczegóły) jest zapisywany w bazie danych.
  - 3. Po zapisaniu jestem przekierowywany do widoku zapisanego planu lub widzę komunikat potwierdzający zapisanie.

---

- ID: `US-006`
- Tytuł: Generowanie listy zakupów
- Opis: Jako użytkownik, po zapisaniu planu posiłków, chcę jednym kliknięciem wygenerować kompletną listę zakupów, która jest automatycznie posortowana według kategorii sklepowych.
- Kryteria akceptacji:
  - 1. W widoku zapisanego planu znajduje się przycisk "Generuj listę zakupów".
  - 2. Po kliknięciu, aplikacja wysyła wszystkie przepisy z planu do AI.
  - 3. AI zwraca jedną, zagregowaną listę produktów (np. jeśli 3 przepisy wymagają cebuli, na liście jest sumaryczna ilość).
  - 4. Lista zakupów jest podzielona na kategorie (np. Warzywa i Owoce, Nabiał, Mięso, Produkty Suche, Inne).
  - 5. Produkty, których AI nie potrafi skategoryzować, trafiają do kategorii "Inne".
  - 6. Wygenerowana lista jest wyświetlana na ekranie.

---

- ID: `US-007`
- Tytuł: Przeglądanie szczegółów przepisu
- Opis: Jako osoba przygotowująca posiłek, chcę móc zobaczyć szczegóły przepisu z planu, a w nim informację, jakiej wielkości porcję (w gramach) mam przygotować dla każdej osoby.
- Kryteria akceptacji:
  - 1. Kliknięcie na posiłek w zapisanym planie otwiera widok szczegółowy.
  - 2. Widok szczegółowy zawiera:
    - Nazwę dania.
    - Listę składników z ilościami i jednostkami.
    - Kroki przygotowania.
    - Oddzielną sekcję z instrukcją podziału na porcje, podającą wagę w gramach dla każdej osoby (zgodnie z zadaną kalorycznością).

---

- ID: `US-008`
- Tytuł: Dostęp do historii planów
- Opis: Jako powracający użytkownik, chcę mieć dostęp do listy moich poprzednio zapisanych planów posiłków, aby móc je ponownie przejrzeć.
- Kryteria akceptacji:
  - 1. W aplikacji istnieje sekcja "Historia planów".
  - 2. Sekcja ta wyświetla listę wszystkich moich zapisanych planów, posortowaną od najnowszego.
  - 3. Każdy element listy zawiera podstawowe informacje o planie (np. data utworzenia, zakres dat).
  - 4. Kliknięcie na element listy przenosi mnie do statycznego widoku tego planu i powiązanej listy zakupów.

---

- ID: `US-009`
- Tytuł: Obsługa błędów AI
- Opis: Jako użytkownik, w przypadku gdy AI nie jest w stanie wygenerować planu lub listy zakupów, chcę otrzymać jasny komunikat o błędzie i sugestię, co mogę zrobić.
- Kryteria akceptacji:
  - 1. Jeśli zapytanie do AI zakończy się niepowodzeniem, na ekranie pojawia się komunikat, np. "Nie udało się wygenerować planu. Spróbuj zmienić kryteria lub spróbuj ponownie później".
  - 2. Aplikacja loguje techniczne szczegóły błędu po stronie serwera w celu dalszej analizy.
  - 3. W przypadku, gdy AI nie może spełnić zbyt restrykcyjnych wymagań, komunikat powinien sugerować ich uproszczenie.

---

- ID: `US-010`
- Tytuł: Obsługa pustego stanu dla nowego użytkownika
- Opis: Jako nowy, zalogowany użytkownik, który nie stworzył jeszcze żadnego planu, chcę zobaczyć ekran powitalny, który pokieruje mnie do stworzenia mojego pierwszego planu posiłków.
- Kryteria akceptacji:
  - 1. Po pierwszym zalogowaniu, zamiast pustej listy historii, widzę ekran "empty state".
  - 2. Ekran zawiera powitanie oraz wyraźnie widoczny przycisk/link "Stwórz swój pierwszy plan".
  - 3. Kliknięcie przycisku przenosi mnie bezpośrednio do formularza generowania planu.

## 6. Metryki sukcesu

Głównym celem produktu jest dostarczenie wartościowego i trafnego narzędzia, które minimalizuje wysiłek użytkownika w procesie planowania.

- `S-001`: Główny wskaźnik sukcesu: Co najmniej 90% posiłków generowanych przez AI jest akceptowanych przez użytkownika od razu, bez konieczności użycia funkcji "regeneruj".
- `S-001.1`: Sposób pomiaru: Wdrożenie analityki (np. z wykorzystaniem Supabase) do śledzenia dwóch zdarzeń: `meal_candidate_generated` (każda propozycja posiłku wygenerowana przez AI) oraz `meal_regenerated` (każde kliknięcie przycisku "regeneruj"). Stosunek liczby regeneracji do liczby wszystkich wygenerowanych propozycji pozwoli obliczyć wskaźnik akceptacji.
