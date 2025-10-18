import type { LoginFormData, RegisterFormData, AuthResponse, ErrorResponse } from "../types/auth.types";

class AuthService {
  private readonly baseUrl = "/api/auth";

  async login(data: LoginFormData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData: ErrorResponse = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Nieprawidłowy email lub hasło");
    }

    return responseData;
  }

  async register(data: Omit<RegisterFormData, "confirmPassword">): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData: ErrorResponse = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || "Nie udało się utworzyć konta");
    }

    return responseData;
  }
}

export const authService = new AuthService();
