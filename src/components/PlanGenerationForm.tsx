import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import type { GenerateMealPlanCommand } from "../types";

interface PlanGenerationFormProps {
  form: UseFormReturn<GenerateMealPlanCommand>;
  onSubmit: (data: GenerateMealPlanCommand) => void;
  isLoading: boolean;
}

const AVAILABLE_MEALS = [
  { id: "śniadanie", label: "Śniadanie" },
  { id: "obiad", label: "Obiad" },
  { id: "kolacja", label: "Kolacja" },
  { id: "przekąska", label: "Przekąska" },
];

const CUISINES = [
  "Polska",
  "Włoska",
  "Francuska",
  "Japońska",
  "Meksykańska",
  "Indyjska",
  "Tajska",
  "Śródziemnomorska",
  "Amerykańska",
];

export function PlanGenerationForm({ form, onSubmit, isLoading }: PlanGenerationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const peopleCount = watch("peopleCount");
  const mealsToPlan = watch("mealsToPlan");
  const excludedIngredients = watch("excludedIngredients");

  // Update calorie targets when people count changes
  useEffect(() => {
    const currentTargets = form.getValues("calorieTargets");
    const newTargets = Array.from({ length: peopleCount }, (_, i) => ({
      person: i + 1,
      calories: currentTargets[i]?.calories || 2000,
    }));
    setValue("calorieTargets", newTargets);
  }, [peopleCount, form, setValue]);

  const handleMealToggle = (mealId: string, checked: boolean) => {
    const current = mealsToPlan || [];
    if (checked) {
      setValue("mealsToPlan", [...current, mealId]);
    } else {
      setValue(
        "mealsToPlan",
        current.filter((m) => m !== mealId)
      );
    }
  };

  const handleAddIngredient = (ingredient: string) => {
    if (ingredient.trim()) {
      const current = excludedIngredients || [];
      setValue("excludedIngredients", [...current, ingredient.trim()]);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    const current = excludedIngredients || [];
    setValue(
      "excludedIngredients",
      current.filter((_, i) => i !== index)
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in" data-testid="plan-generation-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* People Count */}
        <div className="space-y-2">
          <Label htmlFor="peopleCount">Liczba osób</Label>
          <Input
            id="peopleCount"
            type="number"
            min={1}
            max={20}
            {...register("peopleCount", { valueAsNumber: true })}
            aria-invalid={!!errors.peopleCount}
            data-testid="people-count-input"
          />
          {errors.peopleCount && <p className="text-sm text-destructive">{errors.peopleCount.message}</p>}
        </div>

        {/* Days Count */}
        <div className="space-y-2">
          <Label htmlFor="daysCount">Liczba dni</Label>
          <Input
            id="daysCount"
            type="number"
            min={1}
            max={14}
            {...register("daysCount", { valueAsNumber: true })}
            aria-invalid={!!errors.daysCount}
            data-testid="days-count-input"
          />
          {errors.daysCount && <p className="text-sm text-destructive">{errors.daysCount.message}</p>}
        </div>
      </div>

      {/* Cuisine */}
      <div className="space-y-2">
        <Label htmlFor="cuisine">Kuchnia</Label>
        <select
          id="cuisine"
          {...register("cuisine")}
          className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          aria-invalid={!!errors.cuisine}
          data-testid="cuisine-select"
        >
          {CUISINES.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>
        {errors.cuisine && <p className="text-sm text-destructive">{errors.cuisine.message}</p>}
      </div>

      {/* Meals to Plan */}
      <div className="space-y-3">
        <Label>Posiłki do zaplanowania</Label>
        <div className="grid grid-cols-2 gap-3" data-testid="meals-to-plan-checkboxes">
          {AVAILABLE_MEALS.map((meal) => (
            <div key={meal.id} className="flex items-center space-x-2">
              <Checkbox
                id={meal.id}
                checked={mealsToPlan?.includes(meal.id)}
                onCheckedChange={(checked) => handleMealToggle(meal.id, !!checked)}
                data-testid={`meal-checkbox-${meal.id}`}
              />
              <Label htmlFor={meal.id} className="text-sm font-normal cursor-pointer">
                {meal.label}
              </Label>
            </div>
          ))}
        </div>
        {errors.mealsToPlan && <p className="text-sm text-destructive">{errors.mealsToPlan.message}</p>}
      </div>

      {/* Calorie Targets */}
      <div className="space-y-3">
        <Label>Dzienne cele kaloryczne</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="calorie-targets-inputs">
          {Array.from({ length: peopleCount }, (_, i) => (
            <div key={i} className="space-y-2">
              <Label htmlFor={`calories-${i}`}>Osoba {i + 1}</Label>
              <Input
                id={`calories-${i}`}
                type="number"
                min={500}
                max={5000}
                step={100}
                {...register(`calorieTargets.${i}.calories`, {
                  valueAsNumber: true,
                })}
                aria-invalid={!!errors.calorieTargets?.[i]?.calories}
                data-testid={`calorie-target-input-${i}`}
              />
              {errors.calorieTargets?.[i]?.calories && (
                <p className="text-sm text-destructive">{errors.calorieTargets[i]?.calories?.message}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Excluded Ingredients */}
      <div className="space-y-3">
        <Label>Wykluczone składniki</Label>
        <div className="flex gap-2">
          <Input
            id="newIngredient"
            placeholder="Dodaj składnik..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const input = e.currentTarget;
                handleAddIngredient(input.value);
                input.value = "";
              }
            }}
            data-testid="excluded-ingredient-input"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const input = document.getElementById("newIngredient") as HTMLInputElement;
              if (input) {
                handleAddIngredient(input.value);
                input.value = "";
              }
            }}
            data-testid="add-excluded-ingredient-button"
          >
            Dodaj
          </Button>
        </div>
        {excludedIngredients && excludedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-2" data-testid="excluded-ingredients-list">
            {excludedIngredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md"
                data-testid={`excluded-ingredient-${index}`}
              >
                <span className="text-sm">{ingredient}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Usuń ${ingredient}`}
                  data-testid={`remove-excluded-ingredient-${index}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading} data-testid="generate-plan-submit-button">
        {isLoading ? "Generowanie..." : "Generuj plan posiłków"}
      </Button>
    </form>
  );
}
