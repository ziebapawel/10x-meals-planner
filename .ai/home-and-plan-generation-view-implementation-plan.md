# Plan implementacji widoku: Strona główna i generowanie planu

## 1. Przegląd
Widok "Strona główna i generowanie planu" jest głównym punktem wejścia dla uwierzytelnionych użytkowników. Jego celem jest umożliwienie użytkownikom zdefiniowania swoich preferencji żywieniowych w formularzu, wygenerowanie na tej podstawie planu posiłków przy użyciu AI, a następnie interaktywną modyfikację (regenerację pojedynczych posiłków) i finalne zapisanie planu na swoim koncie. Widok ten zarządza tymczasowym, "roboczym" stanem planu posiłków przed jego trwałym zapisaniem.

## 2. Routing widoku
- **Ścieżka**: `/`
- **Dostępność**: Widok ten powinien być dostępny tylko dla uwierzytelnionych użytkowników. Użytkownicy nieuwierzytelnieni powinni być przekierowywani do strony logowania.

## 3. Struktura komponentów
Hierarchia komponentów dla tego widoku będzie następująca:

```
- HomeAndPlanGenerationView (Komponent główny widoku, React)
  - PlanGenerationForm (Formularz do wprowadzania danych przez użytkownika)
    - Input, Select, Button (komponenty UI z Shadcn)
  - MealPlanGrid (Siatka wyświetlająca wygenerowany plan)
    - MealCard (Karta dla pojedynczego posiłku z opcją regeneracji)
      - Button (przycisk "Regeneruj")
  - RecipeDetailModal (Modal wyświetlający szczegóły przepisu)
    - Dialog (komponent UI z Shadcn)
  - Button (przycisk "Zapisz plan")
```

## 4. Szczegóły komponentów

### `HomeAndPlanGenerationView`
- **Opis komponentu**: Główny, nadrzędny komponent React, który zarządza stanem całego widoku. Odpowiada za integrację z API, obsługę stanu ładowania i błędów oraz koordynację przepływu danych między komponentami podrzędnymi (`PlanGenerationForm`, `MealPlanGrid`).
- **Główne elementy**: Renderuje `PlanGenerationForm` oraz warunkowo `MealPlanGrid` (po wygenerowaniu planu) i przycisk "Zapisz plan".
- **Obsługiwane interakcje**:
  - Inicjowanie generowania planu posiłków.
  - Inicjowanie regeneracji pojedynczego posiłku.
  - Inicjowanie zapisu finalnego planu.
  - Otwieranie i zamykanie modala ze szczegółami przepisu.
- **Obsługiwana walidacja**: Brak (delegowana do `PlanGenerationForm`).
- **Typy**: `HomeAndPlanGenerationViewModel`, `GeneratedMealPlanDto`.
- **Propsy**: Brak.

### `PlanGenerationForm`
- **Opis komponentu**: Formularz oparty na `react-hook-form` i `zod`, pozwalający użytkownikowi na wprowadzenie kryteriów dla generowanego planu. Stan formularza jest synchronizowany z `localStorage`, aby zachować dane między sesjami.
- **Główne elementy**: Zestaw pól formularza (`Input`, `Select`, `Checkbox`) z `Shadcn/ui` dla liczby osób, liczby dni, kuchni, wykluczonych składników, docelowej kaloryczności i typów posiłków.
- **Obsługiwane interakcje**:
  - `onSubmit`: Przesyła dane formularza do komponentu nadrzędnego w celu wywołania API.
- **Obsługiwana walidacja**:
  - `peopleCount`: liczba całkowita > 0 (np. 1-10).
  - `daysCount`: liczba całkowita > 0 (np. 1-7).
  - `cuisine`: niepusty ciąg znaków.
  - `calorieTargets`: Długość tablicy musi odpowiadać `peopleCount`, każda wartość `calories` musi być dodatnią liczbą całkowitą (np. 1000-5000).
  - `mealsToPlan`: Musi być wybrany co najmniej jeden typ posiłku.
- **Typy**: `GenerateMealPlanCommand`.
- **Propsy**:
  - `onSubmit: (data: GenerateMealPlanCommand) => void`: Funkcja zwrotna wywoływana po pomyślnej walidacji i wysłaniu formularza.
  - `isLoading: boolean`: Informuje, czy trwa proces generowania, aby zablokować przycisk.
  - `initialValues: GenerateMealPlanCommand`: Początkowe wartości formularza (np. z `localStorage`).

### `MealPlanGrid`
- **Opis komponentu**: Komponent wizualizujący "roboczy" plan posiłków w formie siatki (dni jako kolumny, typy posiłków jako wiersze). Renderuje komponenty `MealCard` dla każdego posiłku w planie.
- **Główne elementy**: Struktura `div` oparta na CSS Grid lub Flexbox, iterująca po danych planu i renderująca `MealCard`.
- **Obsługiwane interakcje**: Brak (delegowane do `MealCard`).
- **Obsługiwana walidacja**: Brak.
- **Typy**: `GeneratedMealPlanDto`.
- **Propsy**:
  - `plan: GeneratedMealPlanDto`: Obiekt z danymi planu do wyświetlenia.
  - `onRegenerate: (day: number, type: string) => void`: Funkcja zwrotna do obsługi żądania regeneracji.
  - `onViewDetails: (recipe: RecipeDto) => void`: Funkcja zwrotna do otwarcia modala z przepisem.
  - `regeneratingMeal: { day: number; type: string } | null`: Informuje, który posiłek jest w trakcie regeneracji.

### `MealCard`
- **Opis komponentu**: Karta wyświetlająca nazwę pojedynczego posiłku oraz przyciski akcji ("Regeneruj", "Zobacz szczegóły").
- **Główne elementy**: Nazwa posiłku, przycisk "Regeneruj", kontener karty reagujący na kliknięcie w celu pokazania szczegółów.
- **Obsługiwane interakcje**:
  - `onClick`: Wywołuje `onViewDetails` z danymi przepisu.
  - `onRegenerateClick`: Wywołuje `onRegenerate` z informacją o dniu i typie posiłku.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `MealInPlanDto`.
- **Propsy**:
  - `meal: MealInPlanDto`: Dane posiłku do wyświetlenia.
  - `day: number`: Dzień, do którego należy posiłek.
  - `onRegenerate: (day: number, type: string) => void`: Funkcja zwrotna.
  - `onViewDetails: (recipe: RecipeDto) => void`: Funkcja zwrotna.
  - `isRegenerating: boolean`: Wskazuje, czy ta konkretna karta jest w trakcie regeneracji (do wyświetlenia wskaźnika ładowania).

### `RecipeDetailModal`
- **Opis komponentu**: Modal (dialog) z `Shadcn/ui` wyświetlający pełne informacje o przepisie.
- **Główne elementy**: Tytuł (nazwa dania), lista składników, instrukcje przygotowania, informacja o porcjach.
- **Obsługiwane interakcje**: Zamknięcie modala.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `RecipeDto`.
- **Propsy**:
  - `recipe: RecipeDto | null`: Dane przepisu do wyświetlenia. Jeśli `null`, modal jest ukryty.
  - `onClose: () => void`: Funkcja zwrotna do zamknięcia modala.

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy DTO z `src/types.ts`. Dodatkowo, na potrzeby zarządzania stanem widoku, wprowadzony zostanie jeden ViewModel.

- **`GenerateMealPlanCommand` (DTO)**: Używany do typowania danych formularza i jako payload dla `POST /api/meal-plans/generate`.
- **`GeneratedMealPlanDto` (DTO)**: Reprezentuje strukturę planu posiłków zwróconą przez API.
- **`RegenerateMealCommand` (DTO)**: Payload dla `POST /api/meals/regenerate`.
- **`CreateMealPlanCommand` (DTO)**: Payload dla `POST /api/meal-plans` (zapis planu).
- **`RecipeDto` (DTO)**: Struktura pojedynczego przepisu.

- **`HomeAndPlanGenerationViewModel` (ViewModel, client-side)**:
  ```typescript
  interface HomeAndPlanGenerationViewModel {
    // Stan formularza, synchronizowany z localStorage
    generationFormState: GenerateMealPlanCommand;
    
    // "Roboczy" plan posiłków zwrócony z API, modyfikowalny przez regenerację
    workingMealPlan: GeneratedMealPlanDto | null;
    
    // Przepis aktualnie wyświetlany w modalu
    selectedRecipe: RecipeDto | null;
    
    // Globalny stan ładowania (generowanie, zapisywanie)
    isLoading: boolean;
    
    // Stan ładowania dla konkretnego posiłku podczas regeneracji
    isRegenerating: { day: number; type: string } | null;
    
    // Komunikat błędu z API
    error: string | null;
  }
  ```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie scentralizowane w niestandardowym hooku `useMealPlanGenerator`. Takie podejście enkapsuluje logikę, ułatwia jej ponowne użycie i testowanie oraz utrzymuje komponent `HomeAndPlanGenerationView` w czystości.

- **Hook**: `useMealPlanGenerator`
- **Cel**:
  - Zarządzanie całym stanem opisanym w `HomeAndPlanGenerationViewModel`.
  - Obsługa interakcji z `localStorage` w celu odczytu i zapisu danych formularza.
  - Enkapsulacja logiki wywołań API (generowanie, regeneracja, zapis).
  - Dostarczenie przetworzonych danych i funkcji do komponentu widoku.
- **Użycie**:
  ```javascript
  const {
    form, // instancja react-hook-form
    workingMealPlan,
    isLoading,
    isRegenerating,
    handleGeneratePlan,
    handleRegenerateMeal,
    handleSavePlan,
    // ...
  } = useMealPlanGenerator();
  ```

## 7. Integracja API

- **Generowanie planu**:
  - **Endpoint**: `POST /api/meal-plans/generate`
  - **Akcja**: Wywoływane po przesłaniu `PlanGenerationForm`.
  - **Request Body**: `GenerateMealPlanCommand`
  - **Response Body**: `GeneratedMealPlanDto`

- **Regeneracja posiłku**:
  - **Endpoint**: `POST /api/meals/regenerate`
  - **Akcja**: Wywoływane po kliknięciu przycisku "Regeneruj" na `MealCard`.
  - **Request Body**: `RegenerateMealCommand` (złożony z danych formularza, informacji o posiłku do regeneracji i istniejących posiłków z danego dnia).
  - **Response Body**: `RegeneratedMealDto`

- **Zapisywanie planu**:
  - **Endpoint**: `POST /api/meal-plans`
  - **Akcja**: Wywoływane po kliknięciu przycisku "Zapisz plan".
  - **Request Body**: `CreateMealPlanCommand` (złożony z danych formularza i finalnej listy posiłków z `workingMealPlan`).
  - **Response Body**: `MealPlanDto` (zawierający `id` nowo utworzonego planu).

## 8. Interakcje użytkownika
1.  **Wypełnianie formularza**: Użytkownik wprowadza dane. Pola są walidowane na bieżąco. Liczba pól na kalorie dynamicznie dostosowuje się do liczby osób.
2.  **Generowanie planu**: Użytkownik klika "Generuj plan". Przycisk jest blokowany, a na ekranie pojawia się wskaźnik ładowania. Po otrzymaniu odpowiedzi, `MealPlanGrid` jest renderowany z danymi.
3.  **Przeglądanie przepisu**: Użytkownik klika na kartę posiłku. Otwiera się modal `RecipeDetailModal` ze szczegółami.
4.  **Regeneracja posiłku**: Użytkownik klika "Regeneruj" na wybranym posiłku. Na tej karcie pojawia się wskaźnik ładowania. Po sukcesie, treść karty jest aktualizowana nowym przepisem.
5.  **Zapisywanie planu**: Użytkownik klika "Zapisz plan". Na ekranie pojawia się globalny wskaźnik ładowania. Po pomyślnym zapisie, użytkownik jest przekierowywany do widoku szczegółów planu (`/app/plans/[planId]`).

## 9. Warunki i walidacja
- **Przycisk "Generuj plan"**: Jest aktywny tylko wtedy, gdy formularz `PlanGenerationForm` jest poprawnie wypełniony.
- **Przycisk "Zapisz plan"**: Jest widoczny i aktywny tylko wtedy, gdy plan posiłków został pomyślnie wygenerowany (`workingMealPlan` nie jest `null`).
- **Pola kalorii**: Ich liczba musi być równa wartości w polu "Liczba osób".
- **Walidacja pól**: Wszystkie wymagane pola muszą być wypełnione, a wartości liczbowe muszą znajdować się w rozsądnych zakresach (zgodnie z `zod` schema).

## 10. Obsługa błędów
- **Błędy walidacji formularza**: Komunikaty o błędach są wyświetlane bezpośrednio pod odpowiednimi polami formularza, zarządzane przez `react-hook-form`.
- **Błędy API (4xx, 5xx)**:
  - W przypadku niepowodzenia generowania, regeneracji lub zapisu, użytkownikowi zostanie wyświetlona notyfikacja typu "toast" (np. z `Shadcn/ui`) z ogólnym komunikatem błędu (np. "Nie udało się wygenerować planu. Spróbuj ponownie później.").
  - Wskaźniki ładowania są ukrywane, a stan aplikacji wraca do poprzedniego (np. przy nieudanej regeneracji, stary posiłek pozostaje na miejscu).
  - Szczegółowe błędy są logowane do konsoli deweloperskiej.

## 11. Kroki implementacji
1.  **Struktura plików**: Utworzenie plików dla nowych komponentów w `src/components/`, np. `HomeAndPlanGenerationView.tsx`, `PlanGenerationForm.tsx`, `MealPlanGrid.tsx`, `MealCard.tsx`, `RecipeDetailModal.tsx`.
2.  **Hook stanu**: Implementacja `useMealPlanGenerator.ts` w `src/lib/hooks/` z całą logiką zarządzania stanem i API, na razie z zaślepionymi wywołaniami API.
3.  **Formularz (`PlanGenerationForm`)**: Budowa formularza z wykorzystaniem `react-hook-form`, `zod` i komponentów `Shadcn/ui`. Podłączenie do hooka `useMealPlanGenerator`. Implementacja logiki zapisu do `localStorage`.
4.  **Komponenty widoku (`MealPlanGrid`, `MealCard`, `RecipeDetailModal`)**: Stworzenie komponentów do wyświetlania danych. Podłączenie ich do stanu (`workingMealPlan`, `selectedRecipe`) z hooka.
5.  **Komponent główny (`HomeAndPlanGenerationView`)**: Złożenie wszystkich komponentów w całość, wykorzystując hook `useMealPlanGenerator` do przekazywania propsów i obsługi zdarzeń.
6.  **Integracja API**: Implementacja rzeczywistych wywołań `fetch` do endpointów API w `useMealPlanGenerator`, zastępując zaślepki. Dodanie obsługi stanów ładowania i błędów.
7.  **Strona Astro**: Modyfikacja `src/pages/index.astro` w celu renderowania komponentu React `HomeAndPlanGenerationView` z dyrektywą `client:load`. Zabezpieczenie strony, aby była dostępna tylko dla zalogowanych użytkowników.
8.  **Stylowanie i UX**: Dopracowanie stylów za pomocą Tailwind CSS, dodanie animacji, obsługa responsywności (np. zmiana siatki w akordeon na mobile) i zapewnienie zgodności z a11y.
9.  **Testowanie**: Ręczne przetestowanie całego przepływu użytkownika: wypełnianie formularza, generowanie, regenerowanie, obsługa błędów i zapisywanie planu.
