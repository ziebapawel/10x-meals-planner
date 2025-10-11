import type { APIRoute } from "astro";
import { UUIDParamSchema } from "../../../../lib/validation/schemas";
import { generateShoppingList } from "../../../../lib/services/shopping-list.service";

/**
 * POST /api/meal-plans/{planId}/shopping-list
 * Generates an aggregated and categorized shopping list for a meal plan using AI.
 * The list is saved to the database and can only be generated once per meal plan.
 */

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
      return new Response(
        JSON.stringify({ error: "Invalid plan ID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate shopping list
    const shoppingList = await generateShoppingList(
      supabase,
      user.id,
      validationResult.data
    );

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

