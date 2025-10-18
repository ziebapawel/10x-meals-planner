import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Utensils, Flame } from "lucide-react";
import type { RecipeDto } from "../types";

interface RecipeDetailModalProps {
  recipe: RecipeDto | null;
  onClose: () => void;
}

export function RecipeDetailModal({ recipe, onClose }: RecipeDetailModalProps) {
  if (!recipe) return null;

  return (
    <Dialog open={!!recipe} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-3xl font-bold">{recipe.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Portions */}
          {recipe.portions && recipe.portions.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Porcje
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {recipe.portions.map((portion) => (
                  <div
                    key={portion.person}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 px-4 py-3 rounded-lg text-center"
                  >
                    <div className="text-sm font-medium text-orange-800">Osoba {portion.person}</div>
                    <div className="text-lg font-bold text-orange-900">{portion.grams}g</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h3 className="text-xl font-bold mb-4">Składniki</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="font-medium text-gray-900">{ingredient.item}</span>
                  <span className="text-sm font-semibold text-gray-600 bg-white px-2 py-1 rounded border">
                    {ingredient.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Instrukcje przygotowania
            </h3>
            <div className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-gray-800 leading-relaxed pt-1">{instruction}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
