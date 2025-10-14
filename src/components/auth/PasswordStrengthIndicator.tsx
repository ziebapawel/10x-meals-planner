import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements = [
    {
      label: "Co najmniej 8 znaków",
      met: password.length >= 8,
    },
    {
      label: "Zawiera małą literę",
      met: /[a-z]/.test(password),
    },
    {
      label: "Zawiera dużą literę",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Zawiera cyfrę",
      met: /\d/.test(password),
    },
  ];

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
      <p className="text-xs font-medium text-muted-foreground">Wymagania dotyczące hasła:</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-xs ${
              req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {req.met ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
