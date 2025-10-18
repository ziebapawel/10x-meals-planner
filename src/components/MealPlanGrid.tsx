import { MealCard } from "./MealCard";
import type { GeneratedMealPlanDto, RecipeDto } from "../types";

interface MealPlanGridProps {
  plan: GeneratedMealPlanDto;
  onRegenerate: (day: number, type: string) => void;
  onViewDetails: (recipe: RecipeDto) => void;
  regeneratingMeal: { day: number; type: string } | null;
  showRegenerate?: boolean;
}

export function MealPlanGrid({
  plan,
  onRegenerate,
  onViewDetails,
  regeneratingMeal,
  showRegenerate = true,
}: MealPlanGridProps) {
  if (!plan || !plan.plan || !plan.plan.days) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {plan.plan.days.map((dayData) => (
        <div key={dayData.day} className="space-y-4 animate-slide-in-up">
          <h3 className="text-xl font-bold border-b border-border pb-2">Dzień {dayData.day}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dayData.meals.map((meal) => {
              const isRegenerating = regeneratingMeal?.day === dayData.day && regeneratingMeal?.type === meal.type;

              return (
                <MealCard
                  key={`${dayData.day}-${meal.type}`}
                  meal={meal}
                  day={dayData.day}
                  onRegenerate={onRegenerate}
                  onViewDetails={onViewDetails}
                  isRegenerating={isRegenerating}
                  showRegenerate={showRegenerate}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
