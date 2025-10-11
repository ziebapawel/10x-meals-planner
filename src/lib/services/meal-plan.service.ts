import type { SupabaseClient } from "../../db/supabase.client";
import type { Database } from "../../db/database.types";
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
      plan_input: command.planInput as unknown as Database["public"]["Tables"]["meal_plans"]["Insert"]["plan_input"],
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
    recipe_data: meal.recipeData as unknown as Database["public"]["Tables"]["meals"]["Insert"]["recipe_data"],
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
    meals: meals as unknown as MealDto[],
    shoppingList: (shoppingList as unknown as MealPlanDetailsDto["shoppingList"]) || null,
  };
}

/**
 * Deletes a meal plan and all associated data
 */
export async function deleteMealPlan(supabase: SupabaseClient, userId: string, planId: string): Promise<boolean> {
  // First check if plan exists and belongs to user
  const { error: checkError } = await supabase
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
