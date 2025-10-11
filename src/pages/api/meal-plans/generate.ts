import type { APIRoute } from "astro";
import { GenerateMealPlanCommandSchema } from "../../../lib/validation/schemas";
import { generateMealPlan } from "../../../lib/services/ai.service";

/**
 * POST /api/meal-plans/generate
 * Generates a new meal plan using AI based on user preferences.
 * The plan is not saved to the database - it's only returned to the client.
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

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

