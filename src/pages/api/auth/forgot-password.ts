import type { APIRoute } from "astro";
import { forgotPasswordSchema } from "../../../lib/validation/auth.schemas.ts";
import { getAuthErrorMessage } from "../../../lib/services/auth-error.service.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = forgotPasswordSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Get Supabase instance from locals (set by middleware)
    const supabase = locals.supabase;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
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
    // Note: For security, we return success even if the email doesn't exist
    return new Response(
      JSON.stringify({
        success: true,
        message: "Email z linkiem do resetowania hasła został wysłany",
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
    console.error("Forgot password error:", err);

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

