import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
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
  const { error: planError } = await supabase
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
  const listContent = await aggregateShoppingList(meals as unknown as MealDto[]);

  // Save shopping list to database
  const { data: shoppingList, error: saveError } = await supabase
    .from("shopping_lists")
    .insert({
      plan_id: planId,
      list_content: listContent as unknown as Database["public"]["Tables"]["shopping_lists"]["Insert"]["list_content"],
    })
    .select()
    .single();

  if (saveError) {
    console.error("Error saving shopping list:", saveError);
    throw new Error("Failed to save shopping list");
  }

  return shoppingList as unknown as ShoppingListDto;
}
