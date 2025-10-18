import { AlertCircle } from "lucide-react";

interface FormErrorMessageProps {
  message: string;
  testId?: string;
}

export function FormErrorMessage({ message, testId }: FormErrorMessageProps) {
  return (
    <div
      className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2"
      data-testid={testId}
    >
      <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
