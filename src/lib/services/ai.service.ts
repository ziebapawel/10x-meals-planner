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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Jesteś profesjonalnym planistą posiłków i dietetykiem. Odpowiadaj wyłącznie w języku polskim. Wszystkie nazwy przepisów, składników i instrukcje muszą być w języku polskim.",
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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Jesteś profesjonalnym planistą posiłków i dietetykiem. Odpowiadaj wyłącznie w języku polskim. Wszystkie nazwy przepisów, składników i instrukcje muszą być w języku polskim.",
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
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content:
              "Jesteś pomocnym asystentem tworzącym zorganizowane listy zakupów. Odpowiadaj wyłącznie w języku polskim. Wszystkie nazwy kategorii i składników muszą być w języku polskim.",
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

/**
 * Helper function to build meal plan generation prompt
 */
function buildMealPlanPrompt(command: GenerateMealPlanCommand): string {
  return `Wygeneruj plan posiłków z następującymi wymaganiami:
- Liczba osób: ${command.peopleCount}
- Liczba dni: ${command.daysCount}
- Typ kuchni: ${command.cuisine}
- Wykluczone składniki: ${command.excludedIngredients.join(", ") || "brak"}
- Cele kaloryczne na osobę: ${JSON.stringify(command.calorieTargets)}
- Posiłki do zaplanowania: ${command.mealsToPlan.join(", ")}

Zwróć obiekt JSON o następującej strukturze:
{
  "plan": {
    "days": [
      {
        "day": 1,
        "meals": [
          {
            "type": "breakfast",
            "recipe": {
              "name": "Nazwa Przepisu",
              "ingredients": [{"item": "składnik", "quantity": "ilość"}],
              "instructions": ["krok 1", "krok 2"],
              "portions": [{"person": 1, "grams": 250}]
            }
          }
        ]
      }
    ]
  }
}

Upewnij się, że:
1. Każdy posiłek odpowiada celowi kalorycznemu dla każdej osoby
2. Rozmiary porcji są podane w gramach dla każdej osoby
3. Nie używasz wykluczonych składników
4. Przepisy odpowiadają określonemu typowi kuchni
5. Wszystkie nazwy przepisów, składników i instrukcje są w języku polskim`;
}

/**
 * Helper function to build meal regeneration prompt
 */
function buildRegenerateMealPrompt(command: RegenerateMealCommand): string {
  return `Wygeneruj ponownie pojedynczy posiłek z następującym kontekstem:
- Dzień: ${command.mealToRegenerate.day}
- Typ posiłku: ${command.mealToRegenerate.type}
- Kuchnia: ${command.planInput.cuisine}
- Wykluczone składniki: ${command.planInput.excludedIngredients.join(", ") || "brak"}
- Cele kaloryczne: ${JSON.stringify(command.planInput.calorieTargets)}
- Istniejące posiłki na ten dzień: ${JSON.stringify(command.existingMealsForDay)}

Wygeneruj NOWY przepis, który:
1. Różni się od istniejących posiłków
2. Mieści się w dziennym rozkładzie kalorii
3. Odpowiada typowi kuchni
4. Unika wykluczonych składników

Zwróć obiekt JSON o tej strukturze:
{
  "day": ${command.mealToRegenerate.day},
  "type": "${command.mealToRegenerate.type}",
  "recipe": {
    "name": "Nazwa Przepisu",
    "ingredients": [{"item": "składnik", "quantity": "ilość"}],
    "instructions": ["krok 1", "krok 2"],
    "portions": [{"person": 1, "grams": 250}]
  }
}

Upewnij się, że wszystkie nazwy przepisów, składników i instrukcje są w języku polskim.`;
}

/**
 * Helper function to build shopping list aggregation prompt
 */
function buildShoppingListPrompt(meals: MealDto[]): string {
  const allIngredients = meals.flatMap((meal) =>
    meal.recipe_data.ingredients.map((ing) => `${ing.item}: ${ing.quantity}`)
  );

  return `Utwórz zorganizowaną listę zakupów z tych składników:
${allIngredients.join("\n")}

Pogrupuj duplikaty i zorganizuj w kategorie takie jak:
- Warzywa
- Owoce
- Nabiał
- Mięso i Ryby
- Zboża i Makarony
- Przyprawy i Sosy
- Inne

Zwróć obiekt JSON, gdzie klucze to nazwy kategorii, a wartości to tablice elementów:
{
  "Warzywa": [
    {"item": "Cebula", "quantity": "2 duże"},
    {"item": "Pomidor", "quantity": "500g"}
  ],
  "Nabiał": [
    {"item": "Mleko", "quantity": "1 litr"}
  ]
}

Upewnij się, że wszystkie nazwy kategorii i składników są w języku polskim.`;
}
