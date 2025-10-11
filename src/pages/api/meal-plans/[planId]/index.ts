import type { APIRoute } from "astro";
import { UUIDParamSchema } from "../../../../lib/validation/schemas";
import {
  getMealPlanDetails,
  deleteMealPlan,
} from "../../../../lib/services/meal-plan.service";

/**
 * GET /api/meal-plans/{planId}
 * Retrieves detailed information about a single meal plan, including all meals
 * and the shopping list (if generated).
 *
 * DELETE /api/meal-plans/{planId}
 * Deletes a meal plan and all associated data (meals, shopping list).
 */

export const prerender = false;

/**
 * GET handler - Retrieves meal plan details
 */
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
      return new Response(
        JSON.stringify({ error: "Invalid plan ID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get meal plan details
    const mealPlan = await getMealPlanDetails(
      supabase,
      user.id,
      validationResult.data
    );

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

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE handler - Deletes a meal plan
 */
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
      return new Response(
        JSON.stringify({ error: "Invalid plan ID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete meal plan
    const deleted = await deleteMealPlan(
      supabase,
      user.id,
      validationResult.data
    );

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

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

