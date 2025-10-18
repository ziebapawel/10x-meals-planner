export interface ErrorResponse {
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
  };
}

// Re-export from validation schemas
export type { LoginFormData, RegisterFormData } from "../validation/auth.schemas";
