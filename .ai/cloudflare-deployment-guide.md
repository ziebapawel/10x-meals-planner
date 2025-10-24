# Przewodnik wdrożenia na Cloudflare Pages

## Podsumowanie zmian

Projekt został dostosowany do wdrożenia na Cloudflare Pages z pełną konfiguracją CI/CD.

## 1. Zmiany w projekcie

### Dodane zależności

Do `package.json` dodano adapter Cloudflare:
- `@astrojs/cloudflare@^12.3.1` - adapter umożliwiający deployment na Cloudflare Pages

### Aktualizacja konfiguracji Astro

Plik `astro.config.mjs` został zaktualizowany:
- Zmieniono adapter z `@astrojs/node` na `@astrojs/cloudflare`
- Włączono `platformProxy` dla lepszej integracji z Cloudflare

## 2. Workflow CI/CD (master.yml)

Utworzono nowy scenariusz wdrożenia produkcyjnego z następującymi krokami:

### Jobs wykonywane w pipeline:

1. **lint** - Sprawdzenie jakości kodu
   - Checkout kodu
   - Instalacja Node.js (wersja z `.nvmrc`: 22.14.0)
   - Instalacja zależności (`npm ci`)
   - Uruchomienie lintera

2. **unit-test** - Testy jednostkowe
   - Checkout kodu
   - Instalacja Node.js
   - Instalacja zależności
   - Uruchomienie testów z pokryciem kodu
   - Upload raportu pokrycia jako artefakt (30 dni retencji)

3. **build-and-deploy** - Budowanie i wdrożenie na Cloudflare Pages
   - Checkout kodu
   - Instalacja Node.js
   - Instalacja zależności
   - Budowanie produkcyjne z przekazaniem zmiennych środowiskowych
   - Deployment na Cloudflare Pages za pomocą Wrangler

### Różnice względem poprzedniej wersji:

- ❌ **Usunięto**: Job `e2e-test` - testy E2E nie są wykonywane na master
- ✅ **Dodano**: Deployment do Cloudflare Pages w job `build-and-deploy`

## 3. Aktualizacja wersji akcji GitHub

Zgodnie z regułami `github-action.mdc`, zaktualizowano wszystkie akcje do najnowszych wersji:

| Akcja | Poprzednia wersja | Nowa wersja | Status |
|-------|------------------|-------------|---------|
| `actions/checkout` | v5 | v5 | ✅ Aktualna |
| `actions/setup-node` | v6 | v6 | ✅ Aktualna |
| `actions/upload-artifact` | v4 | v5 | ⬆️ Zaktualizowano |
| `actions/github-script` | v7 | v8 | ⬆️ Zaktualizowano |
| `cloudflare/wrangler-action` | v3 | v3 | ✅ Aktualna |

## 4. Wymagane secrets w GitHub

Aby wdrożenie działało poprawnie, należy skonfigurować następujące secrets w GitHub:

### Dla budowania aplikacji:
- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_ANON_KEY` - Klucz publiczny Supabase
- `OPENROUTER_API_KEY` - Klucz API do OpenRouter

### Dla deployment na Cloudflare:
- `CLOUDFLARE_API_TOKEN` - Token API z Cloudflare (z uprawnieniami do Cloudflare Pages)
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare
- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu w Cloudflare Pages

## 5. Jak utworzyć wymagane secrets w Cloudflare?

### Krok 1: Utwórz API Token
1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do "My Profile" → "API Tokens"
3. Kliknij "Create Token"
4. Użyj template "Edit Cloudflare Workers" lub stwórz custom token z uprawnieniami:
   - Account - Cloudflare Pages - Edit
5. Skopiuj wygenerowany token → `CLOUDFLARE_API_TOKEN`

### Krok 2: Znajdź Account ID
1. W Cloudflare Dashboard, wybierz swoją stronę
2. Po prawej stronie znajdziesz "Account ID"
3. Skopiuj → `CLOUDFLARE_ACCOUNT_ID`

### Krok 3: Nazwa projektu
- Użyj nazwy istniejącego projektu Cloudflare Pages lub utwórz nowy
- Nazwa projektu → `CLOUDFLARE_PROJECT_NAME`

## 6. Konfiguracja Environment w GitHub

Workflow korzysta z environment `production`. Aby go skonfigurować:

1. Przejdź do Settings → Environments w repozytorium GitHub
2. Utwórz environment o nazwie `production`
3. (Opcjonalnie) Dodaj protection rules:
   - Required reviewers - wymaga zatwierdzenia przed deployment
   - Wait timer - opóźnienie przed deploymentem
   - Deployment branches - ograniczenie do gałęzi master

## 7. Struktura katalogów wdrożenia

Po zbudowaniu projektu (`npm run build`), Astro generuje katalog `dist/` który zawiera:
- `dist/client/` - pliki statyczne (CSS, JS, assets)
- `dist/server/` - kod serwerowy (SSR)

Cloudflare Pages otrzymuje cały katalog `dist/` i automatycznie wykrywa strukturę Astro.

## 8. Triggery workflow

Workflow `master.yml` uruchamia się:
- ✅ Przy każdym push do gałęzi `master`
- ✅ Ręcznie przez GitHub Actions UI (`workflow_dispatch`)

## 9. Dalsze kroki

Po skonfigurowaniu wszystkich secrets:

1. Wykonaj commit i push zmian do gałęzi master
2. Sprawdź zakładkę "Actions" w GitHub
3. Workflow powinien automatycznie uruchomić się i wdrożyć aplikację
4. Po sukcesie, aplikacja będzie dostępna pod adresem:
   `https://<CLOUDFLARE_PROJECT_NAME>.pages.dev`

## 10. Debugging

Jeśli deployment nie powiedzie się:

1. Sprawdź logi w GitHub Actions
2. Upewnij się, że wszystkie secrets są poprawnie skonfigurowane
3. Zweryfikuj czy projekt Cloudflare Pages istnieje
4. Sprawdź uprawnienia API Token w Cloudflare

## 11. Lokalne testowanie przed deploymentem

Przed wdrożeniem na Cloudflare, możesz przetestować lokalnie:

```bash
# Instalacja zależności
npm ci

# Build produkcyjny
npm run build

# Preview lokalny
npm run preview
```

## 12. Monitorowanie i logi

Po wdrożeniu możesz monitorować aplikację:
- **Cloudflare Dashboard** → Pages → Twój projekt → Deployments
- **GitHub Actions** → Zakładka Actions → Historia workflow
- **Cloudflare Analytics** → Statystyki ruchu i wydajności

