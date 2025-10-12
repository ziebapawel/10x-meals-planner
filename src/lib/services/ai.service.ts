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
        model: "google/gemini-2.5-pro",
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
        model: "google/gemini-2.5-pro",
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

/**
 * Helper function to build meal plan generation prompt
 */
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

/**
 * Helper function to build meal regeneration prompt
 */
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

/**
 * Helper function to build shopping list aggregation prompt
 */
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
