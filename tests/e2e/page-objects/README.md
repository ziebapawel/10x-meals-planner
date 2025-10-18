# Page Object Models (POM)

Ten katalog zawiera klasy Page Object Model dla testów E2E aplikacji Meal Planner.

## Wzorzec Page Object Model

Page Object Model (POM) to wzorzec projektowy, który:

- **Oddziela logikę testów od struktury strony** - zmiany w UI wymagają aktualizacji tylko w jednym miejscu
- **Zwiększa czytelność testów** - testy są bardziej zrozumiałe i przypominają user stories
- **Ułatwia utrzymanie** - zmiany w selektorach wymagają aktualizacji tylko w klasach POM
- **Promuje reużywalność** - metody pomocnicze mogą być używane w wielu testach

## Dostępne Page Objects

### LoginPage

Reprezentuje stronę logowania (`/login`)

**Główne funkcje:**

- `goto()` - Nawigacja do strony logowania
- `fillEmail(email)` - Wypełnienie pola email
- `fillPassword(password)` - Wypełnienie pola hasła
- `clickSubmit()` - Kliknięcie przycisku logowania
- `login(email, password)` - Kompletny flow logowania
- `isErrorMessageVisible()` - Sprawdzenie widoczności komunikatu błędu
- `clickForgotPassword()` - Przejście do strony resetowania hasła
- `clickRegister()` - Przejście do strony rejestracji

**Przykład użycia:**

```typescript
import { LoginPage } from "./page-objects";

test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("user@example.com", "password123");

  await expect(page).toHaveURL("/");
});
```

### MealPlanHistoryPage

Reprezentuje stronę z listą planów posiłków (`/`)

**Główne funkcje:**

- `goto()` - Nawigacja do strony głównej
- `isHistoryViewVisible()` - Sprawdzenie widoczności widoku historii
- `isEmptyState()` - Sprawdzenie czy lista planów jest pusta
- `hasPlans()` - Sprawdzenie czy są jakieś plany
- `clickCreateNewPlan()` - Kliknięcie przycisku tworzenia nowego planu
- `getMealPlanCard(planId)` - Pobranie karty konkretnego planu
- `clickMealPlanCard(planId)` - Kliknięcie w kartę planu
- `getMealPlanCardsCount()` - Liczba widocznych kart planów

**Przykład użycia:**

```typescript
import { MealPlanHistoryPage } from "./page-objects";

test("should display meal plans", async ({ page }) => {
  const historyPage = new MealPlanHistoryPage(page);

  await historyPage.goto();
  await historyPage.waitForHistoryViewLoaded();

  const hasPlans = await historyPage.hasPlans();
  expect(hasPlans).toBeTruthy();
});
```

## Konwencje

### Lokalizacja elementów

Wszystkie elementy są lokalizowane przez atrybuty `data-test-id`:

```typescript
this.emailInput = page.getByTestId("login-email-input");
```

### Struktura klasy

Każda klasa POM powinna zawierać:

1. **Właściwość `page`** - instancja Playwright Page
2. **Lokatory** - wszystkie elementy strony jako readonly Locator
3. **Konstruktor** - inicjalizacja lokatorów
4. **Metody nawigacji** - np. `goto()`
5. **Metody akcji** - np. `clickSubmit()`, `fillEmail()`
6. **Metody sprawdzające** - np. `isErrorMessageVisible()`
7. **Metody pomocnicze** - złożone operacje łączące wiele akcji

### Nazewnictwo

- Klasy: **PascalCase** z sufiksem "Page" (np. `LoginPage`)
- Lokatory: **camelCase** opisujące element (np. `emailInput`, `submitButton`)
- Metody: **camelCase** z czasownikami (np. `clickSubmit`, `fillEmail`)
- Metody boolean: prefiks `is` lub `has` (np. `isVisible`, `hasPlans`)

## Best Practices

### 1. Nie używaj asercji w Page Objects

❌ Źle:

```typescript
async login(email: string, password: string) {
  await this.fillEmail(email);
  await this.fillPassword(password);
  await expect(this.submitButton).toBeEnabled(); // ❌
  await this.clickSubmit();
}
```

✅ Dobrze:

```typescript
async login(email: string, password: string) {
  await this.fillEmail(email);
  await this.fillPassword(password);
  await this.clickSubmit();
}
```

### 2. Zwracaj wartości, które mogą być sprawdzane w testach

✅ Dobrze:

```typescript
async getErrorMessageText(): Promise<string | null> {
  if (await this.isErrorMessageVisible()) {
    return await this.errorMessage.textContent();
  }
  return null;
}
```

### 3. Używaj metod pomocniczych dla złożonych operacji

✅ Dobrze:

```typescript
async loginAndWaitForNavigation(email: string, password: string) {
  await this.login(email, password);
  await this.page.waitForURL('/');
}
```

### 4. Dokumentuj metody JSDoc

```typescript
/**
 * Perform complete login flow
 * @param email - User email
 * @param password - User password
 */
async login(email: string, password: string) {
  // implementation
}
```

## Dodawanie nowych Page Objects

1. Utwórz nowy plik TypeScript w `tests/e2e/page-objects/`
2. Zaimplementuj klasę zgodnie z wzorcem opisanym powyżej
3. Dodaj eksport do `index.ts`
4. Zaktualizuj ten README z opisem nowej klasy

## Przydatne zasoby

- [Playwright Page Object Models](https://playwright.dev/docs/pom)
- [Best Practices for Page Object Models](https://playwright.dev/docs/best-practices)
- [Locators Guide](https://playwright.dev/docs/locators)
