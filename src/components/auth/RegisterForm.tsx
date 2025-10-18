import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { UserPlus, Mail, Lock } from "lucide-react";
import { registerSchema, type RegisterFormData } from "../../lib/validation/auth.schemas";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { useRegister } from "../../lib/hooks/useRegister";
import { FormErrorMessage } from "../ui/FormErrorMessage";
import { FormSuccessMessage } from "../ui/FormSuccessMessage";

export function RegisterForm() {
  const { register: registerUser, isLoading, error, success } = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
    } catch {
      // Error is handled by the useRegister hook
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserPlus className="size-6 text-primary" />
            Zarejestruj się
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Message */}
            {error && <FormErrorMessage message={error} />}

            {/* Success Message */}
            {success && <FormSuccessMessage message="Konto zostało utworzone! Przekierowywanie..." />}

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
                disabled={isLoading || success}
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
                disabled={isLoading || success}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="size-4" />
                Potwierdź hasło
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                disabled={isLoading || success}
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? "Tworzenie konta..." : success ? "Sukces!" : "Utwórz konto"}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-muted-foreground">
              Masz już konto?{" "}
              <a href="/login" className="text-primary hover:underline">
                Zaloguj się
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
