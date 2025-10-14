import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "../../lib/validation/auth.schemas";

interface ErrorResponse {
  error?: string;
  message?: string;
}

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData: ErrorResponse = await response.json();

      if (!response.ok) {
        // Use the error message from the backend (already translated by auth-error.service)
        throw new Error(responseData.message || "Nie udało się wysłać emaila");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <KeyRound className="size-6 text-primary" />
            Resetuj hasło
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2">
                  <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Instructions */}
              <p className="text-sm text-muted-foreground">
                Podaj adres email powiązany z Twoim kontem, a wyślemy Ci link do resetowania hasła.
              </p>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="size-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  disabled={isLoading}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center">
                <a href="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="size-4" />
                  Wróć do logowania
                </a>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-md p-4 flex items-start gap-3">
                <CheckCircle className="size-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Email został wysłany!</p>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    Sprawdź swoją skrzynkę odbiorczą i kliknij w link, aby zresetować hasło.
                  </p>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Nie otrzymałeś emaila?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Sprawdź folder spam</li>
                  <li>Upewnij się, że podałeś prawidłowy adres email</li>
                  <li>Spróbuj ponownie za kilka minut</li>
                </ul>
              </div>

              {/* Back to Login Button */}
              <Button onClick={() => (window.location.href = "/login")} variant="outline" className="w-full">
                <ArrowLeft className="size-4" />
                Wróć do logowania
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
