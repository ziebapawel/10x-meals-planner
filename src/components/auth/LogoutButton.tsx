import { useState } from "react";
import { Button } from "../ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Nie udało się wylogować");
      }

      // Redirect to homepage after successful logout
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect to homepage even if there's an error
      // (the session might have been cleared on the server)
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className={className}
    >
      <LogOut className="size-4 mr-2" />
      {isLoading ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
}

