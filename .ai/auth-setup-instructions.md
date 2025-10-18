# Instrukcje konfiguracji autentykacji Supabase

## ✅ Co zostało zaimplementowane

Integracja autentykacji z Supabase została w pełni wdrożona zgodnie ze specyfikacją. Poniżej znajdują się kroki niezbędne do uruchomienia systemu.

---

## 📋 Kroki konfiguracji

### 1. Zmienne środowiskowe

Skopiuj plik `.env.example` do `.env` i uzupełnij wartości:

```bash
cp .env.example .env
```

Wypełnij następujące zmienne:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
OPENROUTER_API_KEY=your-openrouter-api-key
```

**Gdzie znaleźć wartości Supabase:**

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

---

### 2. Wyłączenie weryfikacji emaila (WAŻNE!)

Zgodnie z user story `US-001`, użytkownicy powinni być automatycznie zalogowani po rejestracji. Wymaga to wyłączenia weryfikacji emaila:

1. W Supabase Dashboard przejdź do **Authentication** → **Providers**
2. Kliknij **Email**
3. **Wyłącz** opcję **"Confirm email"**
4. Zapisz zmiany

**Alternatywnie:** Możesz też skonfigurować szablon emaila potwierdzającego, jeśli wolisz zachować weryfikację (wymaga dodatkowej implementacji endpointu `/api/auth/callback`).

### 2.1. Konfiguracja emaili dla resetowania hasła (OPCJONALNE)

Jeśli chcesz włączyć funkcję resetowania hasła:

1. W Supabase Dashboard przejdź do **Authentication** → **Email Templates**
2. Kliknij **Reset Password**
3. Skonfiguruj szablon emaila:
   ```
   Kliknij poniższy link, aby zresetować hasło:
   {{ .ConfirmationURL }}
   ```
4. Zapisz zmiany

---

### 3. Konfiguracja Site URL i Redirect URLs

W Supabase Dashboard, w sekcji **Authentication** → **URL Configuration**, ustaw:

- **Site URL**: `http://localhost:4321` (dla developmentu) lub Twój URL produkcyjny
- **Redirect URLs**:
  - `http://localhost:4321`
  - `http://localhost:4321/`
  - `http://localhost:4321/reset-password` (dla resetowania hasła)
  - Twój URL produkcyjny (jeśli dotyczy)

---

### 4. Sprawdzenie migracji bazy danych

Upewnij się, że tabele użytkowników i meal plans są poprawnie skonfigurowane:

```bash
# Uruchom migracje Supabase (jeśli jeszcze tego nie zrobiłeś)
npx supabase db push
```

---

## 🧪 Testowanie

### Uruchomienie aplikacji

```bash
npm run dev
```

### Test flow rejestracji i logowania

1. **Rejestracja:**
   - Przejdź do `http://localhost:4321/register`
   - Wprowadź email i hasło (min. 8 znaków, 1 mała, 1 duża litera, 1 cyfra)
   - Po pomyślnej rejestracji zostaniesz automatycznie przekierowany do strony głównej

2. **Logowanie:**
   - Przejdź do `http://localhost:4321/login`
   - Wprowadź dane logowania
   - Po pomyślnym zalogowaniu zostaniesz przekierowany do strony głównej

3. **Wylogowanie:**
   - Kliknij przycisk "Wyloguj się" w nawigacji (widoczny tylko dla zalogowanych użytkowników)
   - Zostaniesz przekierowany na stronę główną

### Test ochrony tras

- Próba dostępu do chronionej trasy bez logowania → przekierowanie do `/login`
- Próba dostępu do `/login` lub `/register` będąc zalogowanym → przekierowanie do `/`

### Test conditional rendering na stronie głównej

1. **Niezalogowany użytkownik:**
   - Wejdź na `http://localhost:4321/`
   - Powinieneś zobaczyć landing page z CTA do rejestracji
   - Nawigacja pokazuje przyciski "Zaloguj się" i "Zarejestruj się"

2. **Zalogowany użytkownik:**
   - Zaloguj się na swoje konto
   - Wejdź na `http://localhost:4321/`
   - Powinieneś zobaczyć generator planów posiłków
   - Nawigacja pokazuje Twój email i przycisk "Wyloguj się"

### Test flow resetowania hasła

1. **Forgot Password:**
   - Wejdź na `http://localhost:4321/forgot-password`
   - Podaj email zarejestrowany w systemie
   - Powinieneś zobaczyć komunikat o wysłaniu emaila

2. **Reset Password:**
   - Sprawdź skrzynkę email (lub folder spam)
   - Kliknij link w emailu
   - Zostaniesz przekierowany na `/reset-password`
   - Podaj nowe hasło (2x dla potwierdzenia)
   - Po 2 sekundach auto-redirect do `/login`
   - Zaloguj się nowym hasłem

---

## 📁 Zaimplementowane komponenty

### Backend

- ✅ `src/db/supabase.client.ts` - Klient SSR Supabase z zarządzaniem ciasteczkami
- ✅ `src/middleware/index.ts` - Middleware z session management i route protection
- ✅ `src/lib/services/auth-error.service.ts` - Serwis tłumaczenia błędów auth na język polski
- ✅ `src/pages/api/auth/login.ts` - Endpoint logowania
- ✅ `src/pages/api/auth/register.ts` - Endpoint rejestracji
- ✅ `src/pages/api/auth/logout.ts` - Endpoint wylogowania
- ✅ `src/pages/api/auth/forgot-password.ts` - Endpoint resetowania hasła (wysyłanie emaila)
- ✅ `src/pages/api/auth/reset-password.ts` - Endpoint resetowania hasła (ustawianie nowego)

### Frontend

- ✅ `src/pages/login.astro` - Strona logowania z redirect logic
- ✅ `src/pages/register.astro` - Strona rejestracji z redirect logic
- ✅ `src/pages/forgot-password.astro` - Strona resetowania hasła
- ✅ `src/pages/reset-password.astro` - Strona ustawiania nowego hasła
- ✅ `src/pages/index.astro` - Strona główna z conditional rendering
- ✅ `src/components/auth/LoginForm.tsx` - Formularz logowania z integracją error service
- ✅ `src/components/auth/RegisterForm.tsx` - Formularz rejestracji z integracją error service
- ✅ `src/components/auth/ForgotPasswordForm.tsx` - Formularz resetowania hasła
- ✅ `src/components/auth/ResetPasswordForm.tsx` - Formularz ustawiania nowego hasła
- ✅ `src/components/auth/LogoutButton.tsx` - Przycisk wylogowania
- ✅ `src/components/LandingView.astro` - Landing page dla niezalogowanych użytkowników
- ✅ `src/layouts/Layout.astro` - Layout z conditional navigation

### Konfiguracja

- ✅ `src/env.d.ts` - Typy TypeScript dla zmiennych środowiskowych i `Astro.locals`
- ✅ `.env.example` - Szablon zmiennych środowiskowych

---

## 🔒 Zabezpieczenia

Zaimplementowane zabezpieczenia zgodnie z best practices:

- ✅ **HTTP-only cookies** - Ciasteczka auth są niedostępne dla JavaScriptu
- ✅ **Secure cookies** - Wymagane HTTPS (w produkcji)
- ✅ **SameSite: Lax** - Ochrona przed CSRF
- ✅ **Server-side session validation** - Wszystkie żądania sprawdzane w middleware
- ✅ **Input validation** - Zod schemas po stronie serwera i klienta
- ✅ **Protected routes** - Middleware automatycznie chroni nieautoryzowany dostęp

---

## 🛠️ Rozwiązywanie problemów

### "Invalid login credentials"

- Sprawdź czy email i hasło są poprawne
- Upewnij się, że użytkownik jest zarejestrowany
- Jeśli włączona jest weryfikacja email, sprawdź czy email został potwierdzony

### "Ten adres email jest już zajęty"

- Email jest już zarejestrowany w systemie
- Użyj innego adresu email lub zaloguj się na istniejące konto

### "Session expired" / Ciągłe wylogowywanie

- Sprawdź czy `SUPABASE_URL` i `SUPABASE_ANON_KEY` są poprawne
- Sprawdź czy Redirect URLs w Supabase Dashboard są prawidłowo skonfigurowane
- Sprawdź cookies w przeglądarce (DevTools → Application → Cookies)

### "Link resetujący hasło wygasł"

- Linki resetujące hasło mają ograniczony czas ważności (domyślnie 1 godzina)
- Poproś o nowy link resetujący
- Sprawdź czy email nie trafił do folderu spam

### "Nie otrzymałem emaila resetującego"

- Sprawdź folder spam/junk
- Upewnij się, że podałeś prawidłowy adres email
- Sprawdź konfigurację SMTP w Supabase Dashboard
- Spróbuj ponownie za kilka minut (rate limiting)

### Middleware redirect loop

- Sprawdź czy `PUBLIC_PATHS` w middleware zawiera wszystkie publiczne trasy
- Upewnij się, że strona główna (`/`) jest w `PUBLIC_PATHS`

---

## 🚀 Następne kroki

Po pomyślnej konfiguracji możesz:

1. **Dodać endpoint `/api/auth/callback`** jeśli chcesz włączyć weryfikację emaila
2. **Dodać user profile page** z możliwością edycji danych użytkownika
3. **Zaimplementować social login** (Google, GitHub, etc.) przez Supabase
4. **Dodać 2FA (Two-Factor Authentication)** dla zwiększenia bezpieczeństwa
5. **Rozszerzyć system ról** (admin, user, premium) jeśli potrzebne
6. **Dodać audit log** dla śledzenia działań użytkowników

---

## 📚 Dokumentacja

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Astro Middleware](https://docs.astro.build/en/guides/middleware/)

---

## 🎯 Zaimplementowane funkcjonalności

### ✅ Kompletny system autentykacji

- **Rejestracja** - nowi użytkownicy mogą tworzyć konta
- **Logowanie** - uwierzytelnianie z walidacją
- **Wylogowanie** - bezpieczne zakończenie sesji
- **Reset hasła** - pełny flow przez email
- **Ochrona tras** - middleware automatycznie chroni chronione strony
- **Conditional rendering** - różne treści dla zalogowanych/niezalogowanych

### ✅ User Experience

- **Landing page** - atrakcyjna strona powitalna dla nowych użytkowników
- **Empty state** - zachęta do stworzenia pierwszego planu dla zalogowanych
- **Error handling** - przetłumaczone komunikaty błędów w języku polskim
- **Loading states** - wskaźniki ładowania podczas operacji
- **Success feedback** - potwierdzenia udanych operacji

### ✅ Bezpieczeństwo

- **HTTP-only cookies** - ciasteczka niedostępne dla JavaScript
- **Server-side validation** - walidacja po stronie serwera
- **CSRF protection** - SameSite cookies
- **Rate limiting** - ochrona przed nadużyciami
- **Secure password requirements** - silne wymagania hasła

---

**Status:** ✅ Pełna implementacja autentykacji zakończona
**Data:** 2025-10-14
**Wersja:** 2.0 (zaktualizowana po implementacji wszystkich funkcjonalności)
