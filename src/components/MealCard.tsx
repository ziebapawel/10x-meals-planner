import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { MealInPlanDto, RecipeDto } from "../types";
import { RefreshCw } from "lucide-react";

interface MealCardProps {
  meal: MealInPlanDto;
  day: number;
  onRegenerate: (day: number, type: string) => void;
  onViewDetails: (recipe: RecipeDto) => void;
  isRegenerating: boolean;
  showRegenerate?: boolean;
}

// Helper function to get meal type emoji and Polish name
const getMealTypeInfo = (type: string): { emoji: string; name: string; color: string } => {
  const mealTypes: Record<string, { emoji: string; name: string; color: string }> = {
    'breakfast': { emoji: '🌅', name: 'Śniadanie', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    'lunch': { emoji: '☀️', name: 'Obiad', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'dinner': { emoji: '🌙', name: 'Kolacja', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'snack': { emoji: '🍎', name: 'Przekąska', color: 'bg-green-50 text-green-700 border-green-200' },
  };
  return mealTypes[type] || { emoji: '🍽️', name: type, color: 'bg-gray-50 text-gray-700 border-gray-200' };
};


export function MealCard({ meal, day, onRegenerate, onViewDetails, isRegenerating, showRegenerate = true }: MealCardProps) {
  const mealTypeInfo = getMealTypeInfo(meal.type);

  return (
    <Card 
      className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-fade-in border-2 hover:border-primary/20"
      onClick={() => onViewDetails(meal.recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(meal.recipe);
        }
      }}
      aria-label={`Zobacz szczegóły: ${meal.recipe.name}`}
    >
      <CardHeader className="pb-3">
        <div className="space-y-3">
          {/* Meal Type Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${mealTypeInfo.color}`}>
            <span className="text-sm">{mealTypeInfo.emoji}</span>
            <span>{mealTypeInfo.name}</span>
          </div>

          {/* Recipe Name */}
          <CardTitle className="text-base group-hover:text-primary transition-colors leading-tight">
            {meal.recipe.name}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Regenerate Button */}
        {showRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate(day, meal.type);
            }}
            disabled={isRegenerating}
            className="w-full group/btn"
            aria-label={`Regeneruj ${meal.type}`}
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="animate-spin w-4 h-4 mr-2" />
                Regenerowanie...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2 group-hover/btn:rotate-180 transition-transform" />
                Regeneruj
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
