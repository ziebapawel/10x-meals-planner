import type { APIRoute } from "astro";
import { RegenerateMealCommandSchema } from "../../../lib/validation/schemas";
import { regenerateSingleMeal } from "../../../lib/services/ai.service";

/**
 * POST /api/meals/regenerate
 * Regenerates a single meal within a meal plan using AI.
 * Takes into account existing meals for the day to ensure variety and
 * proper calorie distribution.
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
    const regeneratedMeal = await regenerateSingleMeal(validationResult.data, context.locals.runtime);

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
