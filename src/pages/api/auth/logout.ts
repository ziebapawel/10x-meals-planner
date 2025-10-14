import type { APIRoute } from "astro";
import { getAuthErrorMessage } from "../../../lib/services/auth-error.service.ts";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase instance from locals (set by middleware)
    const supabase = locals.supabase;

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      const errorMessage = getAuthErrorMessage(error);
      return new Response(
        JSON.stringify({
          error: error.name,
          message: errorMessage,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    // Handle unexpected errors
    console.error("Logout error:", err);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
