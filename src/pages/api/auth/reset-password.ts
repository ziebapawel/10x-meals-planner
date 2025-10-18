import type { APIRoute } from "astro";
import { resetPasswordSchema } from "../../../lib/validation/auth.schemas.ts";
import { getAuthErrorMessage } from "../../../lib/services/auth-error.service.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: validationResult.error.errors[0]?.message || "Nieprawidłowe dane",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { password } = validationResult.data;

    // Get Supabase instance from locals (set by middleware)
    const supabase = locals.supabase;

    // Update user's password
    // This will only work if the user accessed this page via a valid reset token
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

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
        message: "Hasło zostało pomyślnie zresetowane",
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
    console.error("Reset password error:", err);

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
