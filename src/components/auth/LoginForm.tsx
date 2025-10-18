import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { LogIn, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginFormData } from "../../lib/validation/auth.schemas";
import { useLogin } from "../../lib/hooks/useLogin";
import { FormErrorMessage } from "../ui/FormErrorMessage";

export function LoginForm() {
  const { login, isLoading, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Error is handled by the useLogin hook
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LogIn className="size-6 text-primary" />
            Zaloguj się
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
            {/* Error Message */}
            {error && <FormErrorMessage message={error} testId="login-error-message" />}

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
                data-testid="login-email-input"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="size-4" />
                Hasło
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={!!errors.password}
                disabled={isLoading}
                data-testid="login-password-input"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <a href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="login-forgot-password-link">
                Zapomniałeś hasła?
              </a>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-submit-button">
              {isLoading ? "Logowanie..." : "Zaloguj się"}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-muted-foreground">
              Nie masz konta?{" "}
              <a href="/register" className="text-primary hover:underline" data-testid="login-register-link">
                Zarejestruj się
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
