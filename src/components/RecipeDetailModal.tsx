import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { RecipeDto } from "../types";

interface RecipeDetailModalProps {
  recipe: RecipeDto | null;
  onClose: () => void;
}

export function RecipeDetailModal({ recipe, onClose }: RecipeDetailModalProps) {
  if (!recipe) return null;

  return (
    <Dialog open={!!recipe} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{recipe.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Portions */}
          {recipe.portions && recipe.portions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Porcje</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {recipe.portions.map((portion) => (
                  <div key={portion.person} className="bg-secondary px-3 py-2 rounded-md text-sm">
                    Osoba {portion.person}: {portion.grams}g
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Składniki</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-3 text-sm border-b border-border pb-2 last:border-0">
                  <span className="text-muted-foreground shrink-0">•</span>
                  <span className="flex-1">{ingredient.item}</span>
                  <span className="text-muted-foreground shrink-0 font-medium">{ingredient.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Instrukcje przygotowania</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                    {index + 1}
                  </span>
                  <p className="flex-1 pt-0.5 text-sm leading-relaxed">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
