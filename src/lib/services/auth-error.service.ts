import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps Supabase authentication errors to user-friendly Polish messages
 * @param error - The error object from Supabase auth operations
 * @returns A user-friendly error message in Polish
 */
export function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  // Handle non-error objects
  if (!error || typeof error !== "object") {
    return "Wystąpił nieoczekiwany błąd";
  }

  const errorMessage = "message" in error ? error.message : "";

  // Map common Supabase auth errors to Polish messages
  const errorMap: Record<string, string> = {
    // Registration errors
    "User already registered": "Ten adres email jest już zajęty",
    "Email rate limit exceeded": "Zbyt wiele prób. Spróbuj ponownie później",
    "Signup disabled": "Rejestracja jest obecnie wyłączona",

    // Login errors
    "Invalid login credentials": "Nieprawidłowy email lub hasło",
    "Email not confirmed": "Potwierdź swój adres email przed zalogowaniem",
    "Invalid email or password": "Nieprawidłowy email lub hasło",

    // Password errors
    "Password should be at least 6 characters": "Hasło musi mieć co najmniej 6 znaków",
    "Password should contain at least one lowercase letter": "Hasło musi zawierać co najmniej jedną małą literę",
    "Password should contain at least one uppercase letter": "Hasło musi zawierać co najmniej jedną dużą literę",
    "Password should contain at least one number": "Hasło musi zawierać co najmniej jedną cyfrę",

    // Session errors
    "Invalid session": "Sesja wygasła. Zaloguj się ponownie",
    "Session expired": "Sesja wygasła. Zaloguj się ponownie",

    // Network errors
    "Failed to fetch": "Błąd połączenia. Sprawdź połączenie internetowe",
    "Network error": "Błąd połączenia. Sprawdź połączenie internetowe",

    // Rate limiting
    "Over request rate limit": "Zbyt wiele prób. Spróbuj ponownie później",

    // Password reset errors
    "Invalid reset token": "Link resetujący hasło wygasł lub jest nieprawidłowy",
    "Password reset token expired": "Link resetujący hasło wygasł. Poproś o nowy",
    "Same password": "Nowe hasło musi różnić się od poprzedniego",

    // Generic errors
    "User not found": "Nie znaleziono użytkownika",
    "Invalid token": "Nieprawidłowy token",
  };

  // Check for exact match
  if (errorMessage in errorMap) {
    return errorMap[errorMessage];
  }

  // Check for partial matches (for more flexible error handling)
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Log the original error for debugging (in development)
  if (import.meta.env.DEV) {
    console.error("Unmapped auth error:", errorMessage);
  }

  // Default error message
  return "Wystąpił błąd. Spróbuj ponownie";
}

/**
 * Checks if an error is related to email already being in use
 */
export function isEmailInUseError(error: AuthError | Error | unknown): boolean {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return false;
  }

  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("user already registered") ||
    message.includes("email already registered") ||
    message.includes("duplicate")
  );
}

/**
 * Checks if an error is related to invalid credentials
 */
export function isInvalidCredentialsError(error: AuthError | Error | unknown): boolean {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return false;
  }

  const message = error.message?.toLowerCase() || "";
  return message.includes("invalid login credentials") || message.includes("invalid email or password");
}
