# REST API Implementation Plan - Meals Planner

Ten dokument zawiera szczegółowy plan implementacji wszystkich endpointów REST API dla aplikacji Meals Planner. Plan obejmuje siedem endpointów zgrupowanych w trzy kategorie: Meal Plans, Meals oraz Shopping Lists.

---

## Spis treści

1. [Architektura ogólna](#architektura-ogólna)
2. [Wspólne komponenty](#wspólne-komponenty)
3. [Endpoint: Generate Meal Plan (AI)](#endpoint-generate-meal-plan-ai)
4. [Endpoint: Create Meal Plan](#endpoint-create-meal-plan)
5. [Endpoint: List Meal Plans](#endpoint-list-meal-plans)
6. [Endpoint: Get Meal Plan](#endpoint-get-meal-plan)
7. [Endpoint: Delete Meal Plan](#endpoint-delete-meal-plan)
8. [Endpoint: Regenerate Single Meal (AI)](#endpoint-regenerate-single-meal-ai)
9. [Endpoint: Generate Shopping List (AI)](#endpoint-generate-shopping-list-ai)

---

## Architektura ogólna

### Struktura katalogów

```
src/
├── pages/
│   └── api/
│       ├── meal-plans/
│       │   ├── generate.ts
│       │   ├── index.ts
│       │   └── [planId]/
│       │       ├── index.ts
│       │       └── shopping-list.ts
│       └── meals/
│           └── regenerate.ts
├── lib/
│   ├── services/
│   │   ├── ai.service.ts
│   │   ├── meal-plan.service.ts
│   │   └── shopping-list.service.ts
│   └── validation/
│       └── schemas.ts
└── types.ts (już istnieje)
```

### Zasady ogólne

- Każdy endpoint jest osobnym plikiem w strukturze `src/pages/api/`
- Logika biznesowa wyodrębniona do serwisów w `src/lib/services/`
- Walidacja danych wejściowych z użyciem Zod w `src/lib/validation/schemas.ts`
- Supabase client pobierany z `context.locals.supabase`
- Wszystkie endpointy wymagają uwierzytelnienia (sprawdzane przez middleware)
- Handler HTTP musi być nazwany wielką literą: `POST`, `GET`, `DELETE`
- Każdy endpoint musi mieć `export const prerender = false`

---

## Wspólne komponenty

### 1. Validation Schemas (`src/lib/validation/schemas.ts`)

Nowy plik zawierający schematy Zod do walidacji:

```typescript
import { z } from "zod";

// Schema dla generowania planu posiłków
export const GenerateMealPlanCommandSchema = z.object({
  peopleCount: z.number().int().min(1).max(20),
  daysCount: z.number().int().min(1).max(14),
  cuisine: z.string().min(1).max(100),
  excludedIngredients: z.array(z.string()).default([]),
  calorieTargets: z.array(
    z.object({
      person: z.number().int().min(1),
      calories: z.number().int().min(500).max(5000),
    })
  ),
  mealsToPlan: z.array(z.string().min(1)).min(1),
});

// Schema dla tworzenia planu
export const CreateMealPlanCommandSchema = z.object({
  planInput: GenerateMealPlanCommandSchema,
  meals: z
    .array(
      z.object({
        day: z.number().int().min(1),
        type: z.string().min(1),
        recipeData: z.object({
          name: z.string().min(1),
          ingredients: z.array(
            z.object({
              item: z.string(),
              quantity: z.string(),
            })
          ),
          instructions: z.array(z.string()),
          portions: z.array(
            z.object({
              person: z.number().int().min(1),
              grams: z.number().int().min(1),
            })
          ),
        }),
      })
    )
    .min(1),
});

// Schema dla regeneracji pojedynczego posiłku
export const RegenerateMealCommandSchema = z.object({
  planInput: GenerateMealPlanCommandSchema,
  mealToRegenerate: z.object({
    day: z.number().int().min(1),
    type: z.string().min(1),
  }),
  existingMealsForDay: z.array(
    z.object({
      type: z.string(),
      recipe: z.object({
        name: z.string(),
        portions: z.array(
          z.object({
            person: z.number().int(),
            grams: z.number().int(),
          })
        ),
      }),
    })
  ),
});

// Schema dla parametrów paginacji
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// Schema dla parametru UUID
export const UUIDParamSchema = z.string().uuid();
```

### 2. AI Service (`src/lib/services/ai.service.ts`)

Nowy serwis odpowiedzialny za komunikację z OpenRouter.ai:

```typescript
import type {
  GenerateMealPlanCommand,
  GeneratedMealPlanDto,
  RegenerateMealCommand,
  RegeneratedMealDto,
  MealDto,
  ShoppingListContent,
} from "../../types";

/**
 * AI Service
 * Handles all communication with OpenRouter.ai
 */

const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not defined in environment variables");
}

/**
 * Generates a complete meal plan using AI
 */
export async function generateMealPlan(command: GenerateMealPlanCommand): Promise<GeneratedMealPlanDto> {
  const prompt = buildMealPlanPrompt(command);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4-turbo-preview", // lub inny model
        messages: [
          {
            role: "system",
            content: "You are a professional meal planner and nutritionist.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    const parsedPlan: GeneratedMealPlanDto = JSON.parse(aiResponse);

    // Validate response structure
    if (!parsedPlan.plan || !parsedPlan.plan.days) {
      throw new Error("Invalid AI response structure");
    }

    return parsedPlan;
  } catch (error) {
    console.error("Error generating meal plan with AI:", error);
    throw new Error("Failed to generate meal plan. Please try again later.");
  }
}

/**
 * Regenerates a single meal using AI
 */
export async function regenerateSingleMeal(command: RegenerateMealCommand): Promise<RegeneratedMealDto> {
  const prompt = buildRegenerateMealPrompt(command);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a professional meal planner and nutritionist.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    const parsedMeal: RegeneratedMealDto = JSON.parse(aiResponse);

    return parsedMeal;
  } catch (error) {
    console.error("Error regenerating meal with AI:", error);
    throw new Error("Failed to regenerate meal. Please try again later.");
  }
}

/**
 * Aggregates and categorizes shopping list using AI
 */
export async function aggregateShoppingList(meals: MealDto[]): Promise<ShoppingListContent> {
  const prompt = buildShoppingListPrompt(meals);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates organized shopping lists.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    const parsedList: ShoppingListContent = JSON.parse(aiResponse);

    return parsedList;
  } catch (error) {
    console.error("Error aggregating shopping list with AI:", error);
    throw new Error("Failed to generate shopping list. Please try again later.");
  }
}

// Helper functions to build prompts
function buildMealPlanPrompt(command: GenerateMealPlanCommand): string {
  return `Generate a meal plan with the following requirements:
- Number of people: ${command.peopleCount}
- Number of days: ${command.daysCount}
- Cuisine type: ${command.cuisine}
- Excluded ingredients: ${command.excludedIngredients.join(", ") || "none"}
- Calorie targets per person: ${JSON.stringify(command.calorieTargets)}
- Meals to plan: ${command.mealsToPlan.join(", ")}

Return a JSON object with the following structure:
{
  "plan": {
    "days": [
      {
        "day": 1,
        "meals": [
          {
            "type": "breakfast",
            "recipe": {
              "name": "Recipe Name",
              "ingredients": [{"item": "ingredient", "quantity": "amount"}],
              "instructions": ["step 1", "step 2"],
              "portions": [{"person": 1, "grams": 250}]
            }
          }
        ]
      }
    ]
  }
}

Ensure:
1. Each meal matches the calorie target for each person
2. Portion sizes are specified in grams for each person
3. No excluded ingredients are used
4. Recipes match the specified cuisine type`;
}

function buildRegenerateMealPrompt(command: RegenerateMealCommand): string {
  return `Regenerate a single meal with the following context:
- Day: ${command.mealToRegenerate.day}
- Meal type: ${command.mealToRegenerate.type}
- Cuisine: ${command.planInput.cuisine}
- Excluded ingredients: ${command.planInput.excludedIngredients.join(", ") || "none"}
- Calorie targets: ${JSON.stringify(command.planInput.calorieTargets)}
- Existing meals for this day: ${JSON.stringify(command.existingMealsForDay)}

Generate a NEW recipe that:
1. Is different from the existing meals
2. Fits within the daily calorie distribution
3. Matches the cuisine type
4. Avoids excluded ingredients

Return a JSON object with this structure:
{
  "day": ${command.mealToRegenerate.day},
  "type": "${command.mealToRegenerate.type}",
  "recipe": {
    "name": "Recipe Name",
    "ingredients": [{"item": "ingredient", "quantity": "amount"}],
    "instructions": ["step 1", "step 2"],
    "portions": [{"person": 1, "grams": 250}]
  }
}`;
}

function buildShoppingListPrompt(meals: MealDto[]): string {
  const allIngredients = meals.flatMap((meal) =>
    meal.recipe_data.ingredients.map((ing) => `${ing.item}: ${ing.quantity}`)
  );

  return `Create an organized shopping list from these ingredients:
${allIngredients.join("\n")}

Aggregate duplicate items and organize into categories like:
- Vegetables
- Fruits
- Dairy
- Meat & Fish
- Grains & Pasta
- Spices & Condiments
- Other

Return a JSON object where keys are category names and values are arrays of items:
{
  "Vegetables": [
    {"item": "Onion", "quantity": "2 large"},
    {"item": "Tomato", "quantity": "500g"}
  ],
  "Dairy": [
    {"item": "Milk", "quantity": "1 liter"}
  ]
}`;
}
```

### 3. Meal Plan Service (`src/lib/services/meal-plan.service.ts`)

Nowy serwis do operacji CRUD na planach posiłków:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateMealPlanCommand,
  MealPlanDto,
  MealPlanListItemDto,
  ListMealPlansDto,
  MealPlanDetailsDto,
  MealDto,
} from "../../types";

/**
 * Meal Plan Service
 * Handles CRUD operations for meal plans
 */

/**
 * Creates a new meal plan with all its meals in a transaction
 */
export async function createMealPlan(
  supabase: SupabaseClient,
  userId: string,
  command: CreateMealPlanCommand
): Promise<MealPlanDto> {
  // Insert meal plan
  const { data: mealPlan, error: planError } = await supabase
    .from("meal_plans")
    .insert({
      user_id: userId,
      plan_input: command.planInput,
    })
    .select()
    .single();

  if (planError) {
    console.error("Error creating meal plan:", planError);
    throw new Error("Failed to create meal plan");
  }

  // Insert all meals
  const mealsToInsert = command.meals.map((meal) => ({
    plan_id: mealPlan.id,
    day: meal.day,
    type: meal.type,
    recipe_data: meal.recipeData,
  }));

  const { error: mealsError } = await supabase.from("meals").insert(mealsToInsert);

  if (mealsError) {
    // Rollback: delete the meal plan
    await supabase.from("meal_plans").delete().eq("id", mealPlan.id);
    console.error("Error creating meals:", mealsError);
    throw new Error("Failed to create meals for the plan");
  }

  return mealPlan as MealPlanDto;
}

/**
 * Lists meal plans for a user with pagination
 */
export async function listMealPlans(
  supabase: SupabaseClient,
  userId: string,
  page: number,
  pageSize: number
): Promise<ListMealPlansDto> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count, error: countError } = await supabase
    .from("meal_plans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    console.error("Error counting meal plans:", countError);
    throw new Error("Failed to count meal plans");
  }

  // Get paginated data
  const { data: plans, error: plansError } = await supabase
    .from("meal_plans")
    .select("id, created_at, plan_input")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (plansError) {
    console.error("Error listing meal plans:", plansError);
    throw new Error("Failed to list meal plans");
  }

  const totalPages = Math.ceil((count || 0) / pageSize);

  return {
    data: plans as MealPlanListItemDto[],
    pagination: {
      currentPage: page,
      pageSize,
      totalPages,
    },
  };
}

/**
 * Gets a single meal plan with all meals and shopping list
 */
export async function getMealPlanDetails(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<MealPlanDetailsDto | null> {
  // Get meal plan
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (planError) {
    if (planError.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error getting meal plan:", planError);
    throw new Error("Failed to get meal plan");
  }

  // Get meals
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("*")
    .eq("plan_id", planId)
    .order("day", { ascending: true })
    .order("type", { ascending: true });

  if (mealsError) {
    console.error("Error getting meals:", mealsError);
    throw new Error("Failed to get meals");
  }

  // Get shopping list (if exists)
  const { data: shoppingList, error: listError } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("plan_id", planId)
    .maybeSingle();

  if (listError) {
    console.error("Error getting shopping list:", listError);
    // Don't throw, shopping list is optional
  }

  return {
    ...(plan as MealPlanDto),
    meals: meals as MealDto[],
    shoppingList: shoppingList || null,
  };
}

/**
 * Deletes a meal plan and all associated data
 */
export async function deleteMealPlan(supabase: SupabaseClient, userId: string, planId: string): Promise<boolean> {
  // First check if plan exists and belongs to user
  const { data: plan, error: checkError } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (checkError) {
    if (checkError.code === "PGRST116") {
      return false; // Plan not found
    }
    console.error("Error checking meal plan:", checkError);
    throw new Error("Failed to check meal plan");
  }

  // Delete meal plan (cascade will handle meals and shopping_lists)
  const { error: deleteError } = await supabase.from("meal_plans").delete().eq("id", planId).eq("user_id", userId);

  if (deleteError) {
    console.error("Error deleting meal plan:", deleteError);
    throw new Error("Failed to delete meal plan");
  }

  return true;
}
```

### 4. Shopping List Service (`src/lib/services/shopping-list.service.ts`)

Nowy serwis do generowania list zakupów:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { ShoppingListDto, MealDto } from "../../types";
import { aggregateShoppingList } from "./ai.service";

/**
 * Shopping List Service
 * Handles shopping list generation
 */

/**
 * Generates a shopping list for a meal plan
 */
export async function generateShoppingList(
  supabase: SupabaseClient,
  userId: string,
  planId: string
): Promise<ShoppingListDto> {
  // Check if plan exists and belongs to user
  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", userId)
    .single();

  if (planError) {
    if (planError.code === "PGRST116") {
      throw new Error("Meal plan not found");
    }
    console.error("Error checking meal plan:", planError);
    throw new Error("Failed to check meal plan");
  }

  // Check if shopping list already exists
  const { data: existingList, error: existingError } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("plan_id", planId)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking existing shopping list:", existingError);
    throw new Error("Failed to check existing shopping list");
  }

  if (existingList) {
    throw new Error("Shopping list already exists for this plan");
  }

  // Get all meals for the plan
  const { data: meals, error: mealsError } = await supabase.from("meals").select("*").eq("plan_id", planId);

  if (mealsError) {
    console.error("Error getting meals:", mealsError);
    throw new Error("Failed to get meals");
  }

  if (!meals || meals.length === 0) {
    throw new Error("No meals found for this plan");
  }

  // Use AI to aggregate and categorize ingredients
  const listContent = await aggregateShoppingList(meals as MealDto[]);

  // Save shopping list to database
  const { data: shoppingList, error: saveError } = await supabase
    .from("shopping_lists")
    .insert({
      plan_id: planId,
      list_content: listContent,
    })
    .select()
    .single();

  if (saveError) {
    console.error("Error saving shopping list:", saveError);
    throw new Error("Failed to save shopping list");
  }

  return shoppingList as ShoppingListDto;
}
```

---

## Endpoint: Generate Meal Plan (AI)

### 1. Przegląd punktu końcowego

**Cel:** Wygenerowanie nowego planu posiłków przy użyciu AI na podstawie preferencji użytkownika. Plan nie jest zapisywany w bazie danych - zwracany jest tylko do klienta, który może go zaakceptować lub zmodyfikować.

**Metoda HTTP:** `POST`  
**URL:** `/api/meal-plans/generate`  
**Plik:** `src/pages/api/meal-plans/generate.ts`

### 2. Szczegóły żądania

**Request Body:**

```json
{
  "peopleCount": 2,
  "daysCount": 3,
  "cuisine": "Italian",
  "excludedIngredients": ["pork", "nuts"],
  "calorieTargets": [
    { "person": 1, "calories": 2200 },
    { "person": 2, "calories": 1800 }
  ],
  "mealsToPlan": ["breakfast", "lunch", "dinner"]
}
```

**Wymagane pola:**

- `peopleCount` (number): Liczba osób (1-20)
- `daysCount` (number): Liczba dni (1-14)
- `cuisine` (string): Typ kuchni
- `excludedIngredients` (string[]): Lista wykluczonych składników
- `calorieTargets` (array): Cele kaloryczne dla każdej osoby
- `mealsToPlan` (string[]): Lista rodzajów posiłków do zaplanowania

### 3. Wykorzystywane typy

- Command: `GenerateMealPlanCommand`
- Response DTO: `GeneratedMealPlanDto`
- Supporting types: `DayPlanDto`, `MealInPlanDto`, `RecipeDto`
- Validation: `GenerateMealPlanCommandSchema`

### 4. Szczegóły odpowiedzi

**Success Response (200 OK):**

```json
{
  "plan": {
    "days": [
      {
        "day": 1,
        "meals": [
          {
            "type": "breakfast",
            "recipe": {
              "name": "Scrambled Eggs with Spinach",
              "ingredients": [
                { "item": "Eggs", "quantity": "4 large" },
                { "item": "Spinach", "quantity": "100g" }
              ],
              "instructions": ["Heat pan", "Cook eggs", "Add spinach"],
              "portions": [
                { "person": 1, "grams": 250 },
                { "person": 2, "grams": 210 }
              ]
            }
          }
        ]
      }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Nieprawidłowa struktura danych
- `401 Unauthorized`: Brak uwierzytelnienia
- `500 Internal Server Error`: Błąd AI service

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie użytkownika
2. Endpoint waliduje request body za pomocą Zod schema
3. Wywołanie `ai.service.generateMealPlan()` z command
4. AI service wysyła request do OpenRouter API
5. Parsowanie i walidacja odpowiedzi z AI
6. Zwrot wygenerowanego planu do klienta

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane (middleware Astro)
- **Walidacja:** Zod schema waliduje wszystkie pola wejściowe
- **Rate Limiting:** Zalecane (opcjonalnie dla MVP)
- **API Key:** OPENROUTER_API_KEY przechowywany w zmiennych środowiskowych
- **Input Sanitization:** Walidacja długości stringów i zakresów liczbowych

### 7. Obsługa błędów

| Scenariusz                  | Kod HTTP | Response Body                                        |
| --------------------------- | -------- | ---------------------------------------------------- |
| Brak wymaganych pól         | 400      | `{ "error": "Validation failed", "details": [...] }` |
| Nieprawidłowy format danych | 400      | `{ "error": "Invalid input format" }`                |
| Brak sesji użytkownika      | 401      | `{ "error": "Unauthorized" }`                        |
| Błąd API OpenRouter         | 500      | `{ "error": "Failed to generate meal plan" }`        |
| Timeout AI                  | 500      | `{ "error": "Request timeout. Please try again." }`  |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** 10-30 sekund (zależnie od modelu AI)
- **Caching:** Brak (każda generacja jest unikalna)
- **Timeout:** Ustawić timeout na 60 sekund dla AI request
- **Optymalizacja:** Użyć szybszego modelu dla MVP (np. GPT-3.5-turbo)

### 9. Etapy wdrożenia

1. Utworzyć plik `src/lib/validation/schemas.ts` z `GenerateMealPlanCommandSchema`
2. Utworzyć plik `src/lib/services/ai.service.ts` z funkcją `generateMealPlan()`
3. Dodać zmienną środowiskową `OPENROUTER_API_KEY` do `.env`
4. Utworzyć plik `src/pages/api/meal-plans/generate.ts`
5. Zaimplementować handler `POST`:
   - Pobrać `supabase` i `user` z `context.locals`
   - Sprawdzić uwierzytelnienie (jeśli nie obsługiwane przez middleware)
   - Sparsować i zwalidować request body
   - Wywołać `generateMealPlan()` z ai.service
   - Obsłużyć błędy i zwrócić odpowiedź
6. Dodać `export const prerender = false`
7. Przetestować endpoint z różnymi danymi wejściowymi
8. Przetestować scenariusze błędów

**Przykładowa implementacja:**

```typescript
// src/pages/api/meal-plans/generate.ts
import type { APIRoute } from "astro";
import { GenerateMealPlanCommandSchema } from "../../../lib/validation/schemas";
import { generateMealPlan } from "../../../lib/services/ai.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await context.request.json();
    const validationResult = GenerateMealPlanCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate meal plan using AI
    const mealPlan = await generateMealPlan(validationResult.data);

    return new Response(JSON.stringify(mealPlan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate meal plan endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Endpoint: Create Meal Plan

### 1. Przegląd punktu końcowego

**Cel:** Zapisanie zaakceptowanego przez użytkownika planu posiłków do bazy danych. Tworzy rekord w tabeli `meal_plans` oraz wszystkie powiązane rekordy w tabeli `meals` w ramach jednej transakcji.

**Metoda HTTP:** `POST`  
**URL:** `/api/meal-plans`  
**Plik:** `src/pages/api/meal-plans/index.ts`

### 2. Szczegóły żądania

**Request Body:**

```json
{
  "planInput": {
    "peopleCount": 2,
    "daysCount": 3,
    "cuisine": "Italian",
    "excludedIngredients": ["pork", "nuts"],
    "calorieTargets": [
      { "person": 1, "calories": 2200 },
      { "person": 2, "calories": 1800 }
    ],
    "mealsToPlan": ["breakfast", "lunch", "dinner"]
  },
  "meals": [
    {
      "day": 1,
      "type": "breakfast",
      "recipeData": {
        "name": "Scrambled Eggs with Spinach",
        "ingredients": [...],
        "instructions": [...],
        "portions": [...]
      }
    }
  ]
}
```

**Wymagane pola:**

- `planInput` (GenerateMealPlanCommand): Oryginalne parametry wejściowe
- `meals` (MealToCreate[]): Tablica wszystkich posiłków do zapisania

### 3. Wykorzystywane typy

- Command: `CreateMealPlanCommand`
- Response DTO: `MealPlanDto`
- Supporting types: `GenerateMealPlanCommand`, `MealToCreate`, `RecipeDto`
- Validation: `CreateMealPlanCommandSchema`

### 4. Szczegóły odpowiedzi

**Success Response (201 Created):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "userId": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
  "planInput": { ... },
  "createdAt": "2025-10-11T10:00:00Z",
  "updatedAt": "2025-10-11T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Nieprawidłowa struktura payload
- `401 Unauthorized`: Brak uwierzytelnienia
- `500 Internal Server Error`: Błąd bazy danych

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie
2. Endpoint waliduje request body
3. Wywołanie `meal-plan.service.createMealPlan()` z userId i command
4. Service wstawia rekord do `meal_plans`
5. Service wstawia wszystkie rekordy do `meals` z `plan_id`
6. W przypadku błędu - rollback (usunięcie meal_plan)
7. Zwrot zapisanego planu do klienta

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane
- **Autoryzacja:** `user_id` pobierany z sesji (nie z request body)
- **Walidacja:** Zod schema dla całej struktury
- **RLS:** Supabase RLS zapewnia izolację danych między użytkownikami
- **Transakcja:** Atomiczność zapisu planu i posiłków

### 7. Obsługa błędów

| Scenariusz              | Kod HTTP | Response Body                                        |
| ----------------------- | -------- | ---------------------------------------------------- |
| Nieprawidłowy payload   | 400      | `{ "error": "Validation failed", "details": [...] }` |
| Pusta tablica meals     | 400      | `{ "error": "At least one meal is required" }`       |
| Brak sesji              | 401      | `{ "error": "Unauthorized" }`                        |
| Błąd insertu meal_plans | 500      | `{ "error": "Failed to create meal plan" }`          |
| Błąd insertu meals      | 500      | `{ "error": "Failed to create meals for the plan" }` |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** < 1 sekundy
- **Transakcja:** Rollback w przypadku błędu wymaga dodatkowego DELETE query
- **Indeksy:** Index na `meal_plans.user_id` i `meals.plan_id` (już istnieją zgodnie z db-plan)
- **Bulk insert:** Wszystkie meals wstawiane jednym zapytaniem

### 9. Etapy wdrożenia

1. Dodać `CreateMealPlanCommandSchema` do `schemas.ts`
2. Utworzyć plik `src/lib/services/meal-plan.service.ts` z funkcją `createMealPlan()`
3. Utworzyć plik `src/pages/api/meal-plans/index.ts`
4. Zaimplementować handler `POST`:
   - Sprawdzić uwierzytelnienie
   - Zwalidować request body
   - Pobrać `userId` z sesji
   - Wywołać `createMealPlan()` z service
   - Obsłużyć błędy
   - Zwrócić 201 Created z zapisanym planem
5. Dodać `export const prerender = false`
6. Przetestować tworzenie planu z różnymi danymi
7. Przetestować rollback w przypadku błędu podczas wstawiania meals

**Przykładowa implementacja:**

```typescript
// src/pages/api/meal-plans/index.ts
import type { APIRoute } from "astro";
import { CreateMealPlanCommandSchema } from "../../lib/validation/schemas";
import { createMealPlan } from "../../lib/services/meal-plan.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await context.request.json();
    const validationResult = CreateMealPlanCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create meal plan
    const mealPlan = await createMealPlan(supabase, user.id, validationResult.data);

    return new Response(JSON.stringify(mealPlan), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in create meal plan endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Endpoint: List Meal Plans

### 1. Przegląd punktu końcowego

**Cel:** Pobranie listy zapisanych planów posiłków dla zalogowanego użytkownika z obsługą paginacji.

**Metoda HTTP:** `GET`  
**URL:** `/api/meal-plans?page=1&pageSize=10`  
**Plik:** `src/pages/api/meal-plans/index.ts` (ten sam co POST, ale handler GET)

### 2. Szczegóły żądania

**Query Parameters:**

- `page` (number, optional): Numer strony (default: 1, min: 1)
- `pageSize` (number, optional): Liczba elementów na stronie (default: 10, min: 1, max: 100)

### 3. Wykorzystywane typy

- Response DTO: `ListMealPlansDto`
- Supporting types: `MealPlanListItemDto`, `PaginationDto`
- Validation: `PaginationQuerySchema`

### 4. Szczegóły odpowiedzi

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "createdAt": "2025-10-11T10:00:00Z",
      "planInput": {
        "peopleCount": 2,
        "daysCount": 3,
        "cuisine": "Italian",
        ...
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

**Error Responses:**

- `400 Bad Request`: Nieprawidłowe parametry paginacji
- `401 Unauthorized`: Brak uwierzytelnienia

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie
2. Endpoint parsuje i waliduje query parameters
3. Wywołanie `meal-plan.service.listMealPlans()` z userId, page, pageSize
4. Service wykonuje COUNT query dla całkowitej liczby planów
5. Service wykonuje SELECT query z LIMIT i OFFSET
6. Obliczenie totalPages
7. Zwrot paginowanej listy do klienta

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane
- **RLS:** Supabase automatycznie filtruje po `user_id`
- **Walidacja:** Query parameters walidowane przez Zod
- **Limit:** pageSize ograniczony do max 100

### 7. Obsługa błędów

| Scenariusz                  | Kod HTTP | Response Body                                  |
| --------------------------- | -------- | ---------------------------------------------- |
| Nieprawidłowy page/pageSize | 400      | `{ "error": "Invalid pagination parameters" }` |
| Brak sesji                  | 401      | `{ "error": "Unauthorized" }`                  |
| Błąd bazy danych            | 500      | `{ "error": "Failed to list meal plans" }`     |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** < 500ms
- **Indeks:** Index na `meal_plans.user_id` i `created_at` dla sortowania
- **Paginacja:** LIMIT i OFFSET w Supabase
- **Cache:** Możliwość cachowania pierwszej strony (opcjonalnie)

### 9. Etapy wdrożenia

1. Dodać `PaginationQuerySchema` do `schemas.ts`
2. Dodać funkcję `listMealPlans()` do `meal-plan.service.ts`
3. W pliku `src/pages/api/meal-plans/index.ts` dodać handler `GET`:
   - Sprawdzić uwierzytelnienie
   - Pobrać query parameters z `context.url.searchParams`
   - Zwalidować parametry paginacji
   - Wywołać `listMealPlans()` z service
   - Zwrócić 200 OK z paginowanymi danymi
4. Przetestować z różnymi wartościami page i pageSize
5. Przetestować edge cases (page > totalPages, pageSize = 0, etc.)

**Przykładowa implementacja:**

```typescript
// src/pages/api/meal-plans/index.ts (dodać do istniejącego pliku)
export const GET: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page") || "1",
      pageSize: url.searchParams.get("pageSize") || "10",
    };

    const validationResult = PaginationQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid pagination parameters",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // List meal plans
    const result = await listMealPlans(supabase, user.id, validationResult.data.page, validationResult.data.pageSize);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in list meal plans endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Endpoint: Get Meal Plan

### 1. Przegląd punktu końcowego

**Cel:** Pobranie szczegółów pojedynczego planu posiłków wraz z wszystkimi posiłkami i powiązaną listą zakupów (jeśli istnieje).

**Metoda HTTP:** `GET`  
**URL:** `/api/meal-plans/{planId}`  
**Plik:** `src/pages/api/meal-plans/[planId]/index.ts`

### 2. Szczegóły żądania

**URL Parameters:**

- `planId` (UUID, required): ID planu posiłków

### 3. Wykorzystywane typy

- Response DTO: `MealPlanDetailsDto`
- Supporting types: `MealPlanDto`, `MealDto`, `ShoppingListDto`
- Validation: `UUIDParamSchema`

### 4. Szczegóły odpowiedzi

**Success Response (200 OK):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "userId": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
  "planInput": { ... },
  "createdAt": "2025-10-11T10:00:00Z",
  "updatedAt": "2025-10-11T10:00:00Z",
  "meals": [
    {
      "id": "uuid-meal-1",
      "planId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "day": 1,
      "type": "breakfast",
      "recipeData": {
        "name": "Scrambled Eggs",
        "ingredients": [...],
        "instructions": [...],
        "portions": [...]
      },
      "createdAt": "2025-10-11T10:00:00Z"
    }
  ],
  "shoppingList": {
    "id": "uuid-list-1",
    "planId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "listContent": {
      "Vegetables": [...],
      "Dairy": [...]
    },
    "createdAt": "2025-10-11T10:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Nieprawidłowy format UUID
- `401 Unauthorized`: Brak uwierzytelnienia
- `404 Not Found`: Plan nie istnieje lub nie należy do użytkownika

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie
2. Endpoint waliduje planId (UUID format)
3. Wywołanie `meal-plan.service.getMealPlanDetails()` z userId i planId
4. Service wykonuje SELECT na `meal_plans` z filtrem po `id` i `user_id`
5. Service wykonuje SELECT na `meals` z filtrem po `plan_id`
6. Service wykonuje SELECT na `shopping_lists` z filtrem po `plan_id` (optional)
7. Zwrot złożonego obiektu do klienta

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane
- **Autoryzacja:** RLS sprawdza czy plan należy do użytkownika
- **Walidacja:** planId musi być poprawnym UUID
- **Privacy:** Użytkownik nie może zobaczyć cudzych planów

### 7. Obsługa błędów

| Scenariusz               | Kod HTTP | Response Body                            |
| ------------------------ | -------- | ---------------------------------------- |
| Nieprawidłowy UUID       | 400      | `{ "error": "Invalid plan ID format" }`  |
| Brak sesji               | 401      | `{ "error": "Unauthorized" }`            |
| Plan nie istnieje        | 404      | `{ "error": "Meal plan not found" }`     |
| Plan nie należy do usera | 404      | `{ "error": "Meal plan not found" }`     |
| Błąd bazy danych         | 500      | `{ "error": "Failed to get meal plan" }` |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** < 500ms
- **Joins:** Możliwość użycia JOIN zamiast multiple queries (opcjonalnie)
- **N+1 problem:** Unikamy przez bulk select dla meals
- **Index:** Indexy na `meals.plan_id` i `shopping_lists.plan_id`

### 9. Etapy wdrożenia

1. Dodać `UUIDParamSchema` do `schemas.ts`
2. Dodać funkcję `getMealPlanDetails()` do `meal-plan.service.ts`
3. Utworzyć katalog `src/pages/api/meal-plans/[planId]/`
4. Utworzyć plik `src/pages/api/meal-plans/[planId]/index.ts`
5. Zaimplementować handler `GET`:
   - Sprawdzić uwierzytelnienie
   - Pobrać `planId` z `context.params`
   - Zwalidować planId jako UUID
   - Wywołać `getMealPlanDetails()` z service
   - Jeśli null - zwrócić 404
   - Zwrócić 200 OK ze szczegółami planu
6. Dodać `export const prerender = false`
7. Przetestować z istniejącym planId
8. Przetestować z nieistniejącym planId
9. Przetestować z planId innego użytkownika

**Przykładowa implementacja:**

```typescript
// src/pages/api/meal-plans/[planId]/index.ts
import type { APIRoute } from "astro";
import { UUIDParamSchema } from "../../../../lib/validation/schemas";
import { getMealPlanDetails } from "../../../../lib/services/meal-plan.service";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate planId
    const planId = context.params.planId;
    const validationResult = UUIDParamSchema.safeParse(planId);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid plan ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get meal plan details
    const mealPlan = await getMealPlanDetails(supabase, user.id, validationResult.data);

    if (!mealPlan) {
      return new Response(JSON.stringify({ error: "Meal plan not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(mealPlan), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get meal plan endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Endpoint: Delete Meal Plan

### 1. Przegląd punktu końcowego

**Cel:** Usunięcie planu posiłków i wszystkich powiązanych danych (meals, shopping_lists) z bazy danych. Dzięki CASCADE w schemacie bazy, usunięcie planu automatycznie usuwa powiązane dane.

**Metoda HTTP:** `DELETE`  
**URL:** `/api/meal-plans/{planId}`  
**Plik:** `src/pages/api/meal-plans/[planId]/index.ts` (ten sam co GET, ale handler DELETE)

### 2. Szczegóły żądania

**URL Parameters:**

- `planId` (UUID, required): ID planu posiłków do usunięcia

### 3. Wykorzystywane typy

- Response: Brak body
- Validation: `UUIDParamSchema`

### 4. Szczegóły odpowiedzi

**Success Response (204 No Content):**

- Brak response body
- Status 204

**Error Responses:**

- `400 Bad Request`: Nieprawidłowy format UUID
- `401 Unauthorized`: Brak uwierzytelnienia
- `404 Not Found`: Plan nie istnieje lub nie należy do użytkownika

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie
2. Endpoint waliduje planId (UUID format)
3. Wywołanie `meal-plan.service.deleteMealPlan()` z userId i planId
4. Service sprawdza czy plan istnieje i należy do użytkownika
5. Service wykonuje DELETE na `meal_plans`
6. Database CASCADE automatycznie usuwa powiązane meals i shopping_lists
7. Zwrot 204 No Content

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane
- **Autoryzacja:** RLS zapewnia że użytkownik może usunąć tylko własne plany
- **Walidacja:** planId musi być poprawnym UUID
- **Cascade:** Foreign key constraints z ON DELETE CASCADE zapewniają spójność danych

### 7. Obsługa błędów

| Scenariusz               | Kod HTTP | Response Body                               |
| ------------------------ | -------- | ------------------------------------------- |
| Nieprawidłowy UUID       | 400      | `{ "error": "Invalid plan ID format" }`     |
| Brak sesji               | 401      | `{ "error": "Unauthorized" }`               |
| Plan nie istnieje        | 404      | `{ "error": "Meal plan not found" }`        |
| Plan nie należy do usera | 404      | `{ "error": "Meal plan not found" }`        |
| Błąd bazy danych         | 500      | `{ "error": "Failed to delete meal plan" }` |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** < 500ms
- **Cascade:** Database automatycznie usuwa powiązane dane
- **Transakcja:** DELETE jest atomiczna
- **Indexy:** Index na `meal_plans.id` (primary key)

### 9. Etapy wdrożenia

1. Dodać funkcję `deleteMealPlan()` do `meal-plan.service.ts`
2. W pliku `src/pages/api/meal-plans/[planId]/index.ts` dodać handler `DELETE`:
   - Sprawdzić uwierzytelnienie
   - Pobrać `planId` z `context.params`
   - Zwalidować planId jako UUID
   - Wywołać `deleteMealPlan()` z service
   - Jeśli false - zwrócić 404
   - Zwrócić 204 No Content
3. Przetestować usuwanie istniejącego planu
4. Przetestować próbę usunięcia nieistniejącego planu
5. Przetestować próbę usunięcia planu innego użytkownika
6. Zweryfikować w bazie że meals i shopping_lists zostały usunięte (CASCADE)

**Przykładowa implementacja:**

```typescript
// src/pages/api/meal-plans/[planId]/index.ts (dodać do istniejącego pliku)
export const DELETE: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate planId
    const planId = context.params.planId;
    const validationResult = UUIDParamSchema.safeParse(planId);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid plan ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete meal plan
    const deleted = await deleteMealPlan(supabase, user.id, validationResult.data);

    if (!deleted) {
      return new Response(JSON.stringify({ error: "Meal plan not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Error in delete meal plan endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Endpoint: Regenerate Single Meal (AI)

### 1. Przegląd punktu końcowego

**Cel:** Wygenerowanie nowej propozycji dla pojedynczego posiłku w planie przy użyciu AI, z uwzględnieniem istniejących posiłków danego dnia. Nie zapisuje nowego posiłku w bazie - zwraca tylko propozycję do klienta.

**Metoda HTTP:** `POST`  
**URL:** `/api/meals/regenerate`  
**Plik:** `src/pages/api/meals/regenerate.ts`

### 2. Szczegóły żądania

**Request Body:**

```json
{
  "planInput": {
    "peopleCount": 2,
    "daysCount": 3,
    "cuisine": "Italian",
    "excludedIngredients": ["pork", "nuts"],
    "calorieTargets": [
      { "person": 1, "calories": 2200 },
      { "person": 2, "calories": 1800 }
    ],
    "mealsToPlan": ["breakfast", "lunch", "dinner"]
  },
  "mealToRegenerate": {
    "day": 1,
    "type": "dinner"
  },
  "existingMealsForDay": [
    {
      "type": "breakfast",
      "recipe": {
        "name": "Scrambled Eggs with Spinach",
        "portions": [
          { "person": 1, "grams": 250 },
          { "person": 2, "grams": 210 }
        ]
      }
    },
    {
      "type": "lunch",
      "recipe": {
        "name": "Chicken Salad",
        "portions": [
          { "person": 1, "grams": 300 },
          { "person": 2, "grams": 250 }
        ]
      }
    }
  ]
}
```

**Wymagane pola:**

- `planInput` (GenerateMealPlanCommand): Oryginalne parametry planu
- `mealToRegenerate` (object): day i type posiłku do regeneracji
- `existingMealsForDay` (array): Lista istniejących posiłków z danego dnia

### 3. Wykorzystywane typy

- Command: `RegenerateMealCommand`
- Response DTO: `RegeneratedMealDto`
- Supporting types: `GenerateMealPlanCommand`, `RecipeDto`
- Validation: `RegenerateMealCommandSchema`

### 4. Szczegóły odpowiedzi

**Success Response (200 OK):**

```json
{
  "day": 1,
  "type": "dinner",
  "recipe": {
    "name": "New Chicken Alfredo",
    "ingredients": [
      { "item": "Chicken breast", "quantity": "400g" },
      { "item": "Pasta", "quantity": "300g" }
    ],
    "instructions": ["Cook pasta", "Prepare sauce", "Combine"],
    "portions": [
      { "person": 1, "grams": 450 },
      { "person": 2, "grams": 380 }
    ]
  }
}
```

**Error Responses:**

- `400 Bad Request`: Nieprawidłowa struktura danych
- `401 Unauthorized`: Brak uwierzytelnienia
- `500 Internal Server Error`: Błąd AI service

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie
2. Endpoint waliduje request body
3. Wywołanie `ai.service.regenerateSingleMeal()` z command
4. AI service buduje prompt z kontekstem (istniejące posiłki, preferencje)
5. AI service wysyła request do OpenRouter API
6. Parsowanie i walidacja odpowiedzi z AI
7. Zwrot nowego posiłku do klienta

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane
- **Walidacja:** Zod schema dla całej struktury command
- **Rate Limiting:** Zalecane (opcjonalnie dla MVP)
- **Input Sanitization:** Walidacja day >= 1, type niepuste

### 7. Obsługa błędów

| Scenariusz                 | Kod HTTP | Response Body                                        |
| -------------------------- | -------- | ---------------------------------------------------- |
| Nieprawidłowa struktura    | 400      | `{ "error": "Validation failed", "details": [...] }` |
| Brak sesji                 | 401      | `{ "error": "Unauthorized" }`                        |
| Błąd API OpenRouter        | 500      | `{ "error": "Failed to regenerate meal" }`           |
| Timeout AI                 | 500      | `{ "error": "Request timeout. Please try again." }`  |
| Nieprawidłowa odpowiedź AI | 500      | `{ "error": "Invalid AI response" }`                 |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** 5-15 sekund (szybsze niż pełny plan)
- **Caching:** Brak
- **Timeout:** 30 sekund dla AI request
- **Optymalizacja:** Użyć szybszego modelu

### 9. Etapy wdrożenia

1. Dodać `RegenerateMealCommandSchema` do `schemas.ts`
2. Dodać funkcję `regenerateSingleMeal()` do `ai.service.ts`
3. Utworzyć katalog `src/pages/api/meals/`
4. Utworzyć plik `src/pages/api/meals/regenerate.ts`
5. Zaimplementować handler `POST`:
   - Sprawdzić uwierzytelnienie
   - Zwalidować request body
   - Wywołać `regenerateSingleMeal()` z ai.service
   - Obsłużyć błędy
   - Zwrócić 200 OK z nowym posiłkiem
6. Dodać `export const prerender = false`
7. Przetestować regenerację różnych typów posiłków
8. Przetestować z różnymi istniejącymi posiłkami
9. Przetestować scenariusze błędów

**Przykładowa implementacja:**

```typescript
// src/pages/api/meals/regenerate.ts
import type { APIRoute } from "astro";
import { RegenerateMealCommandSchema } from "../../../lib/validation/schemas";
import { regenerateSingleMeal } from "../../../lib/services/ai.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await context.request.json();
    const validationResult = RegenerateMealCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Regenerate meal using AI
    const regeneratedMeal = await regenerateSingleMeal(validationResult.data);

    return new Response(JSON.stringify(regeneratedMeal), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in regenerate meal endpoint:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Endpoint: Generate Shopping List (AI)

### 1. Przegląd punktu końcowego

**Cel:** Wygenerowanie zagregowanej listy zakupów dla istniejącego planu posiłków przy użyciu AI. Lista jest kategoryzowana według działów sklepowych i zapisywana w bazie danych.

**Metoda HTTP:** `POST`  
**URL:** `/api/meal-plans/{planId}/shopping-list`  
**Plik:** `src/pages/api/meal-plans/[planId]/shopping-list.ts`

### 2. Szczegóły żądania

**URL Parameters:**

- `planId` (UUID, required): ID planu posiłków

**Request Body:** Brak

### 3. Wykorzystywane typy

- Response DTO: `ShoppingListDto`
- Supporting types: `ShoppingListContent`, `ShoppingListItem`
- Validation: `UUIDParamSchema`

### 4. Szczegóły odpowiedzi

**Success Response (201 Created):**

```json
{
  "id": "uuid-shopping-list",
  "planId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "listContent": {
    "Vegetables": [
      { "item": "Onion", "quantity": "2 large" },
      { "item": "Tomato", "quantity": "500g" }
    ],
    "Dairy": [
      { "item": "Milk", "quantity": "1 liter" },
      { "item": "Cheese", "quantity": "200g" }
    ],
    "Meat": [{ "item": "Chicken breast", "quantity": "800g" }],
    "Other": [{ "item": "Olive oil", "quantity": "50ml" }]
  },
  "createdAt": "2025-10-11T10:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Nieprawidłowy format UUID
- `401 Unauthorized`: Brak uwierzytelnienia
- `404 Not Found`: Plan nie istnieje lub nie należy do użytkownika
- `409 Conflict`: Lista zakupów już istnieje dla tego planu
- `500 Internal Server Error`: Błąd AI service lub bazy danych

### 5. Przepływ danych

1. Middleware sprawdza uwierzytelnienie
2. Endpoint waliduje planId (UUID format)
3. Wywołanie `shopping-list.service.generateShoppingList()` z userId i planId
4. Service sprawdza czy plan istnieje i należy do użytkownika
5. Service sprawdza czy lista zakupów już nie istnieje (409 jeśli tak)
6. Service pobiera wszystkie meals dla planu
7. Service wywołuje `ai.service.aggregateShoppingList()` z meals
8. AI agreguje składniki i kategoryzuje
9. Service zapisuje wygenerowaną listę do `shopping_lists`
10. Zwrot zapisanej listy do klienta

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagane
- **Autoryzacja:** RLS sprawdza własność planu
- **Walidacja:** planId musi być poprawnym UUID
- **Idempotencja:** Sprawdzanie czy lista już nie istnieje (409)
- **Privacy:** Użytkownik nie może generować listy dla cudzego planu

### 7. Obsługa błędów

| Scenariusz               | Kod HTTP | Response Body                                               |
| ------------------------ | -------- | ----------------------------------------------------------- |
| Nieprawidłowy UUID       | 400      | `{ "error": "Invalid plan ID format" }`                     |
| Brak sesji               | 401      | `{ "error": "Unauthorized" }`                               |
| Plan nie istnieje        | 404      | `{ "error": "Meal plan not found" }`                        |
| Plan nie należy do usera | 404      | `{ "error": "Meal plan not found" }`                        |
| Brak meals w planie      | 400      | `{ "error": "No meals found for this plan" }`               |
| Lista już istnieje       | 409      | `{ "error": "Shopping list already exists for this plan" }` |
| Błąd AI service          | 500      | `{ "error": "Failed to generate shopping list" }`           |
| Błąd zapisu do bazy      | 500      | `{ "error": "Failed to save shopping list" }`               |

### 8. Rozważania dotyczące wydajności

- **Czas odpowiedzi:** 10-20 sekund (AI aggregation)
- **Transakcja:** Sprawdzenie + insert w ramach transakcji
- **Index:** Index na `shopping_lists.plan_id` (UNIQUE constraint)
- **Caching:** Możliwość cache'owania wygenerowanych list
- **Timeout:** 60 sekund dla AI request

### 9. Etapy wdrożenia

1. Dodać funkcję `aggregateShoppingList()` do `ai.service.ts`
2. Utworzyć plik `src/lib/services/shopping-list.service.ts` z funkcją `generateShoppingList()`
3. Utworzyć plik `src/pages/api/meal-plans/[planId]/shopping-list.ts`
4. Zaimplementować handler `POST`:
   - Sprawdzić uwierzytelnienie
   - Pobrać `planId` z `context.params`
   - Zwalidować planId jako UUID
   - Wywołać `generateShoppingList()` z service
   - Obsłużyć błędy (404, 409, 500)
   - Zwrócić 201 Created z zapisaną listą
5. Dodać `export const prerender = false`
6. Przetestować generowanie listy dla istniejącego planu
7. Przetestować próbę generowania dla nieistniejącego planu
8. Przetestować próbę generowania gdy lista już istnieje (409)
9. Przetestować próbę generowania dla planu bez meals
10. Przetestować próbę generowania dla planu innego użytkownika

**Przykładowa implementacja:**

```typescript
// src/pages/api/meal-plans/[planId]/shopping-list.ts
import type { APIRoute } from "astro";
import { UUIDParamSchema } from "../../../../lib/validation/schemas";
import { generateShoppingList } from "../../../../lib/services/shopping-list.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const { supabase } = context.locals;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate planId
    const planId = context.params.planId;
    const validationResult = UUIDParamSchema.safeParse(planId);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid plan ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate shopping list
    const shoppingList = await generateShoppingList(supabase, user.id, validationResult.data);

    return new Response(JSON.stringify(shoppingList), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate shopping list endpoint:", error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message === "Meal plan not found") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "Shopping list already exists for this plan") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message === "No meals found for this plan") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## Podsumowanie implementacji

### Kolejność wdrożenia

1. **Wspólne komponenty (Foundation)**
   - Utworzyć `src/lib/validation/schemas.ts` z wszystkimi schematami Zod
   - Utworzyć `src/lib/services/ai.service.ts` z funkcjami AI
   - Dodać zmienną `OPENROUTER_API_KEY` do `.env`

2. **Meal Plan CRUD**
   - Utworzyć `src/lib/services/meal-plan.service.ts`
   - Zaimplementować `POST /api/meal-plans/generate` (AI generation)
   - Zaimplementować `POST /api/meal-plans` (create)
   - Zaimplementować `GET /api/meal-plans` (list)
   - Zaimplementować `GET /api/meal-plans/{planId}` (get)
   - Zaimplementować `DELETE /api/meal-plans/{planId}` (delete)

3. **Meal Operations**
   - Zaimplementować `POST /api/meals/regenerate` (AI regeneration)

4. **Shopping List**
   - Utworzyć `src/lib/services/shopping-list.service.ts`
   - Zaimplementować `POST /api/meal-plans/{planId}/shopping-list` (generate)

### Checklist ogólny

- [ ] Wszystkie endpointy mają `export const prerender = false`
- [ ] Wszystkie handlery HTTP używają wielkich liter (GET, POST, DELETE)
- [ ] Wszystkie endpointy sprawdzają uwierzytelnienie
- [ ] Wszystkie endpointy walidują input za pomocą Zod
- [ ] Wszystkie błędy są logowane za pomocą `console.error()`
- [ ] Wszystkie błędy zwracają odpowiednie kody HTTP
- [ ] Wszystkie response'y mają `Content-Type: application/json`
- [ ] Zmienne środowiskowe są sprawdzane przy starcie aplikacji
- [ ] RLS policies są aktywne w Supabase
- [ ] Indexy są utworzone zgodnie z db-plan.md
- [ ] Foreign key constraints z CASCADE są skonfigurowane

### Testowanie

Dla każdego endpointu przetestować:

- ✅ Happy path (poprawne dane)
- ✅ Nieprawidłowe dane wejściowe (400)
- ✅ Brak uwierzytelnienia (401)
- ✅ Nieistniejące zasoby (404)
- ✅ Konflikty (409 dla shopping list)
- ✅ Błędy serwera (500)
- ✅ Edge cases (pusta tablica, max values, etc.)

### Możliwe usprawnienia (poza MVP)

- Rate limiting dla endpointów AI
- Caching wygenerowanych planów (krótkoterminowy)
- Websockets dla real-time progress AI generation
- Retry mechanism dla failed AI requests
- Monitoring i alerting dla AI service failures
- Compression dla dużych response'ów
- API versioning (/v1/api/...)
- OpenAPI/Swagger documentation
