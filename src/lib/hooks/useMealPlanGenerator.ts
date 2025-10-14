import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GenerateMealPlanCommandSchema } from "../validation/schemas";
import type {
  GenerateMealPlanCommand,
  GeneratedMealPlanDto,
  RecipeDto,
  RegenerateMealCommand,
  RegeneratedMealDto,
  CreateMealPlanCommand,
  MealPlanDto,
  MealToCreate,
} from "../../types";

const STORAGE_KEY = "mealPlanGeneratorFormData";

interface HomeAndPlanGenerationViewModel {
  generationFormState: GenerateMealPlanCommand;
  workingMealPlan: GeneratedMealPlanDto | null;
  selectedRecipe: RecipeDto | null;
  isLoading: boolean;
  isRegenerating: { day: number; type: string } | null;
  error: string | null;
}

const getDefaultFormValues = (): GenerateMealPlanCommand => {
  if (typeof window === "undefined") {
    return {
      peopleCount: 2,
      daysCount: 7,
      cuisine: "Polska",
      excludedIngredients: [],
      calorieTargets: [
        { person: 1, calories: 2000 },
        { person: 2, calories: 2000 },
      ],
      mealsToPlan: ["śniadanie", "obiad", "kolacja"],
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored form data:", e);
    }
  }

  return {
    peopleCount: 2,
    daysCount: 7,
    cuisine: "Polska",
    excludedIngredients: [],
    calorieTargets: [
      { person: 1, calories: 2000 },
      { person: 2, calories: 2000 },
    ],
    mealsToPlan: ["śniadanie", "obiad", "kolacja"],
  };
};

export function useMealPlanGenerator() {
  const [workingMealPlan, setWorkingMealPlan] = useState<GeneratedMealPlanDto | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<{
    day: number;
    type: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GenerateMealPlanCommand>({
    resolver: zodResolver(GenerateMealPlanCommandSchema),
    defaultValues: getDefaultFormValues(),
  });

  // Save form data to localStorage on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleGeneratePlan = async (data: GenerateMealPlanCommand) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/meal-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Nie udało się wygenerować planu posiłków");
      }

      const generatedPlan: GeneratedMealPlanDto = await response.json();
      setWorkingMealPlan(generatedPlan);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas generowania planu";
      setError(message);
      console.error("Failed to generate meal plan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateMeal = async (day: number, type: string) => {
    if (!workingMealPlan) return;

    setIsRegenerating({ day, type });
    setError(null);

    try {
      const planInput = form.getValues();

      // Get existing meals for this day
      const dayData = workingMealPlan.plan.days.find((d) => d.day === day);
      if (!dayData) {
        throw new Error("Day not found in plan");
      }

      const existingMealsForDay = dayData.meals.map((m) => ({
        type: m.type,
        recipe: {
          name: m.recipe.name,
          portions: m.recipe.portions,
        },
      }));

      const regenerateCommand: RegenerateMealCommand = {
        planInput,
        mealToRegenerate: { day, type },
        existingMealsForDay,
      };

      const response = await fetch("/api/meals/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regenerateCommand),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Nie udało się zregenerować posiłku");
      }

      const regeneratedMeal: RegeneratedMealDto = await response.json();

      // Update the working meal plan with the regenerated meal
      setWorkingMealPlan((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          plan: {
            ...prev.plan,
            days: prev.plan.days.map((d) => {
              if (d.day !== day) return d;

              return {
                ...d,
                meals: d.meals.map((m) => {
                  if (m.type !== type) return m;
                  return {
                    type: regeneratedMeal.type,
                    recipe: regeneratedMeal.recipe,
                  };
                }),
              };
            }),
          },
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas regeneracji posiłku";
      setError(message);
      console.error("Failed to regenerate meal:", err);
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleSavePlan = async (): Promise<string | null> => {
    if (!workingMealPlan) return null;

    setIsLoading(true);
    setError(null);

    try {
      const planInput = form.getValues();

      // Transform GeneratedMealPlanDto to MealToCreate[]
      const meals: MealToCreate[] = [];
      workingMealPlan.plan.days.forEach((dayData) => {
        dayData.meals.forEach((meal) => {
          meals.push({
            day: dayData.day,
            type: meal.type,
            recipeData: meal.recipe,
          });
        });
      });

      const createCommand: CreateMealPlanCommand = {
        planInput,
        meals,
      };

      const response = await fetch("/api/meal-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createCommand),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Nie udało się zapisać planu");
      }

      const savedPlan: MealPlanDto = await response.json();

      // Clear form from localStorage after successful save
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }

      return savedPlan.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania planu";
      setError(message);
      console.error("Failed to save meal plan:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openRecipeModal = (recipe: RecipeDto) => {
    setSelectedRecipe(recipe);
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    form,
    workingMealPlan,
    selectedRecipe,
    isLoading,
    isRegenerating,
    error,
    handleGeneratePlan,
    handleRegenerateMeal,
    handleSavePlan,
    openRecipeModal,
    closeRecipeModal,
    clearError,
  };
}
