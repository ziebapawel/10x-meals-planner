import type { APIRoute } from "astro";
import { CreateMealPlanCommandSchema, PaginationQuerySchema } from "../../../lib/validation/schemas";
import { createMealPlan, listMealPlans } from "../../../lib/services/meal-plan.service";

/**
 * POST /api/meal-plans
 * Creates and saves a new meal plan to the database.
 *
 * GET /api/meal-plans
 * Lists saved meal plans for the authenticated user with pagination.
 */

export const prerender = false;

/**
 * POST handler - Creates a new meal plan
 */
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

/**
 * GET handler - Lists meal plans with pagination
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
