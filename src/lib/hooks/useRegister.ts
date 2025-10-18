import { useState, useEffect, useRef } from "react";
import { authService } from "../api/auth.service";
import type { RegisterFormData } from "../types/auth.types";

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const redirectTimeoutRef = useRef<number>();

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const register = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.register({
        email: data.email,
        password: data.password,
      });

      setSuccess(true);

      // Redirect to homepage (meal plans list) after successful registration
      redirectTimeoutRef.current = window.setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd";
      setError(errorMessage);
      throw err; // Re-throw for component to handle if needed
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, success };
}
