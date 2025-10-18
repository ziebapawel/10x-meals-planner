import { CheckCircle } from "lucide-react";

interface FormSuccessMessageProps {
  message: string;
  testId?: string;
}

export function FormSuccessMessage({ message, testId }: FormSuccessMessageProps) {
  return (
    <div
      className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-md p-3 flex items-start gap-2"
      data-testid={testId}
    >
      <CheckCircle className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
    </div>
  );
}
