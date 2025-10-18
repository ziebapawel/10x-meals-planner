# Testing Documentation

Ten folder zawiera wszystkie testy dla projektu AI Meal Planner.

## Struktura folderów

```
tests/
├── unit/           # Testy jednostkowe (Vitest + React Testing Library)
├── e2e/            # Testy end-to-end (Playwright)
├── fixtures/       # Dane testowe i fixtures
└── mocks/          # Mocki dla API i serwisów (MSW)
```

## Testy jednostkowe (Vitest)

### Uruchamianie testów jednostkowych

```bash
# Uruchom testy jednostkowe (w trybie watch)
npm run test

# Uruchom testy jednostkowe z UI
npm run test:ui

# Uruchom testy w trybie watch
npm run test:watch

# Uruchom testy z pokryciem kodu
npm run test:coverage
```

### Przykładowe testy jednostkowe

W folderze `unit/` znajdziesz przykłady testów:

- `button.test.tsx` - test komponentu React (Button)
- `utils.test.ts` - test funkcji pomocniczych (cn utility)

### Wskazówki dla testów jednostkowych

1. **Mockowanie funkcji**: Użyj `vi.fn()` do tworzenia mocków funkcji
2. **Testowanie komponentów**: Użyj `render()` z React Testing Library
3. **Asercje DOM**: Użyj matcherów z `@testing-library/jest-dom`
4. **Interakcje użytkownika**: Użyj `userEvent` z `@testing-library/user-event`

## Testy E2E (Playwright)

### Uruchamianie testów E2E

```bash
# Uruchom testy E2E
npm run test:e2e

# Uruchom testy E2E w trybie UI
npm run test:e2e:ui

# Uruchom testy E2E w trybie debug
npm run test:e2e:debug

# Pokaż raport z testów E2E
npm run test:e2e:report
```

### Przykładowe testy E2E

W folderze `e2e/` znajdziesz przykłady testów:

- `homepage.spec.ts` - test strony głównej
- `auth.spec.ts` - test flow autentykacji (login/register)

### Wskazówki dla testów E2E

1. **Browser contexts**: Użyj browser contexts dla izolacji testów
2. **Page Object Model**: Rozważ użycie POM dla złożonych stron
3. **Locators**: Preferuj `getByRole()` i `getByLabel()` dla lepszej dostępności
4. **Screenshots**: Automatyczne screenshot przy błędzie (skonfigurowane)
5. **Trace viewer**: Użyj `npm run test:e2e:debug` do debugowania

## Konfiguracja

### Vitest Configuration

Konfiguracja znajduje się w `vitest.config.ts`:

- Środowisko: jsdom (dla testów komponentów React)
- Setup file: `vitest.setup.ts`
- Pokrycie kodu: v8
- Aliasy ścieżek: `@/*` -> `src/*`

### Playwright Configuration

Konfiguracja znajduje się w `playwright.config.ts`:

- Browser: tylko Chromium (Desktop Chrome)
- Parallel execution: włączone
- Auto-start dev server: włączone
- Trace: on-first-retry
- Screenshot: only-on-failure

## Best Practices

### Testy jednostkowe

1. **Arrange-Act-Assert**: Strukturuj testy w trzech sekcjach
2. **Jeden test - jedna rzecz**: Testuj tylko jedną funkcjonalność na test
3. **Opisowe nazwy**: Użyj jasnych nazw opisujących co test sprawdza
4. **Cleanup**: React Testing Library automatycznie czyści po każdym teście

### Testy E2E

1. **Izolacja**: Każdy test powinien być niezależny
2. **Czekanie**: Użyj `await expect()` zamiast `waitForTimeout()`
3. **Selektory**: Preferuj semantyczne selektory (role, label)
4. **Setup/Teardown**: Użyj `beforeEach`/`afterEach` dla wspólnego kodu

## Continuous Integration

Testy są uruchamiane automatycznie w CI/CD pipeline (GitHub Actions):

- Testy jednostkowe: przy każdym pull request
- Testy E2E: przy każdym pull request do main/develop
- Coverage: raport pokrycia kodu jest generowany i publikowany

## Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
