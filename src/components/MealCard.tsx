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
}

export function MealCard({ meal, day, onRegenerate, onViewDetails, isRegenerating }: MealCardProps) {
  return (
    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer animate-fade-in">
      <CardHeader
        className="pb-3"
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
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{meal.type}</p>
            <CardTitle className="text-base group-hover:text-primary transition-colors">{meal.recipe.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate(day, meal.type);
          }}
          disabled={isRegenerating}
          className="w-full"
          aria-label={`Regeneruj ${meal.type}`}
        >
          {isRegenerating ? (
            <>
              <RefreshCw className="animate-spin" />
              Regenerowanie...
            </>
          ) : (
            <>
              <RefreshCw />
              Regeneruj
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
