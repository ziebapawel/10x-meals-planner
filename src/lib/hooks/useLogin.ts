import { useState } from "react";
import { authService } from "../api/auth.service";
import type { LoginFormData } from "../types/auth.types";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login(data);
      // Redirect to homepage (meal plans list) on success
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      setError(errorMessage);
      throw err; // Re-throw for component to handle if needed
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
}
