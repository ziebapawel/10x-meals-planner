import { useEffect, useState } from "react";
import { MealPlanGrid } from "./MealPlanGrid";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  ArrowLeft,
  Calendar,
  Users,
  ChefHat,
  ShoppingCart,
  Trash2,
  CheckCircle,
  Circle,
  Package,
  List,
} from "lucide-react";
import { toast } from "sonner";
import type { MealPlanDetailsDto, RecipeDto, GenerateMealPlanCommand } from "../types";

interface MealPlanDetailViewProps {
  planId: string;
}

interface MealPlanState {
  data: MealPlanDetailsDto | null;
  loading: boolean;
  error: string | null;
}

// Helper function to get category emoji
const getCategoryEmoji = (category: string): string => {
  const categoryEmojis: Record<string, string> = {
    warzywa: "🥬",
    owoce: "🍎",
    mięso: "🥩",
    nabiał: "🥛",
    pieczywo: "🍞",
    przyprawy: "🧂",
    konserwy: "🥫",
    mrożonki: "🧊",
    słodycze: "🍫",
    napoje: "🥤",
    alkohol: "🍷",
    makarony: "🍝",
    ryż: "🍚",
    kasze: "🌾",
    orzechy: "🥜",
    nasiona: "🌰",
    oleje: "🫒",
    sosy: "🍯",
    mąka: "🌾",
    cukier: "🍯",
    sól: "🧂",
    pieprz: "🌶️",
    czosnek: "🧄",
    cebula: "🧅",
  };

  const lowerCategory = category.toLowerCase();
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (lowerCategory.includes(key)) {
      return emoji;
    }
  }
  return "📦";
};

// Helper function to get category color
const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    warzywa: "bg-green-50 border-green-200 text-green-800",
    owoce: "bg-red-50 border-red-200 text-red-800",
    mięso: "bg-pink-50 border-pink-200 text-pink-800",
    nabiał: "bg-blue-50 border-blue-200 text-blue-800",
    pieczywo: "bg-yellow-50 border-yellow-200 text-yellow-800",
    przyprawy: "bg-orange-50 border-orange-200 text-orange-800",
    konserwy: "bg-gray-50 border-gray-200 text-gray-800",
    mrożonki: "bg-cyan-50 border-cyan-200 text-cyan-800",
    słodycze: "bg-purple-50 border-purple-200 text-purple-800",
    napoje: "bg-indigo-50 border-indigo-200 text-indigo-800",
  };

  const lowerCategory = category.toLowerCase();
  for (const [key, color] of Object.entries(categoryColors)) {
    if (lowerCategory.includes(key)) {
      return color;
    }
  }
  return "bg-gray-50 border-gray-200 text-gray-800";
};

export function MealPlanDetailView({ planId }: MealPlanDetailViewProps) {
  const [state, setState] = useState<MealPlanState>({
    data: null,
    loading: true,
    error: null,
  });
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Fetch meal plan details
  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(`/api/meal-plans/${planId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Plan posiłków nie został znaleziony");
          } else if (response.status === 401) {
            throw new Error("Nie masz uprawnień do tego planu");
          } else {
            throw new Error("Wystąpił błąd podczas ładowania planu");
          }
        }

        const data: MealPlanDetailsDto = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
        setState({ data: null, loading: false, error: errorMessage });
        toast.error(errorMessage);
      }
    };

    fetchMealPlan();
  }, [planId]);

  // Handle recipe view
  const handleViewRecipe = (recipe: RecipeDto) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseRecipe = () => {
    setSelectedRecipe(null);
  };

  // Handle plan deletion
  const handleDeletePlan = async () => {
    if (!confirm("Czy na pewno chcesz usunąć ten plan posiłków? Ta operacja jest nieodwracalna.")) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/meal-plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Wystąpił błąd podczas usuwania planu");
      }

      toast.success("Plan posiłków został usunięty");
      // Redirect to homepage (meal plans list)
      window.location.href = "/";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    window.location.href = "/";
  };

  // Handle shopping list item toggle
  const handleItemToggle = (itemKey: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  // Handle shopping list generation
  const handleGenerateShoppingList = async () => {
    try {
      setIsGeneratingShoppingList(true);

      const response = await fetch(`/api/meal-plans/${planId}/shopping-list`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Wystąpił błąd podczas generowania listy zakupów");
      }

      toast.success("Lista zakupów została wygenerowana!");

      // Refresh the meal plan data to show the new shopping list
      const updatedResponse = await fetch(`/api/meal-plans/${planId}`);
      if (updatedResponse.ok) {
        const updatedData: MealPlanDetailsDto = await updatedResponse.json();
        setState((prev) => ({ ...prev, data: updatedData }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie planu posiłków...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Błąd</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{state.error}</p>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót
              </Button>
              <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (!state.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Plan nie znaleziony</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Nie udało się znaleźć planu posiłków o podanym ID.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do listy planów
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: plan } = state;
  const planInput = plan.plan_input as unknown as GenerateMealPlanCommand;

  // Transform MealPlanDetailsDto to GeneratedMealPlanDto format for MealPlanGrid
  const transformPlanForGrid = (planDetails: MealPlanDetailsDto) => {
    // Group meals by day
    const mealsByDay = planDetails.meals.reduce(
      (acc, meal) => {
        if (!acc[meal.day]) {
          acc[meal.day] = [];
        }
        acc[meal.day].push({
          type: meal.type,
          recipe: meal.recipe_data as RecipeDto,
        });
        return acc;
      },
      {} as Record<number, { type: string; recipe: RecipeDto }[]>
    );

    // Convert to the format expected by MealPlanGrid
    const days = Object.entries(mealsByDay)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([day, meals]) => ({
        day: parseInt(day),
        meals: meals.sort((a, b) => a.type.localeCompare(b.type)),
      }));

    return {
      plan: {
        days,
      },
    };
  };

  const gridPlan = transformPlanForGrid(plan);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Plan Posiłków</h1>
              <p className="text-muted-foreground">Utworzony {new Date(plan.created_at).toLocaleDateString("pl-PL")}</p>
            </div>
          </div>
          <Button onClick={handleDeletePlan} variant="destructive" size="sm" disabled={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Usuwanie..." : "Usuń plan"}
          </Button>
        </div>

        {/* Plan Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Podsumowanie planu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Dni:</span>
                <span className="font-medium">{planInput.daysCount as number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Osoby:</span>
                <span className="font-medium">{planInput.peopleCount as number}</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Kuchnia:</span>
                <span className="font-medium">{(planInput.cuisine as string) || "Standardowa"}</span>
              </div>
            </div>
            {planInput.excludedIngredients &&
              Array.isArray(planInput.excludedIngredients) &&
              planInput.excludedIngredients.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-muted-foreground">Wykluczone składniki:</span>
                  <span className="ml-2 text-sm">{planInput.excludedIngredients.join(", ")}</span>
                </div>
              )}
            {planInput.mealsToPlan && Array.isArray(planInput.mealsToPlan) && planInput.mealsToPlan.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">Planowane posiłki:</span>
                <span className="ml-2 text-sm">{planInput.mealsToPlan.join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Plan Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Plan posiłków</h2>
            {!plan.shoppingList && (
              <Button onClick={handleGenerateShoppingList} disabled={isGeneratingShoppingList} className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                {isGeneratingShoppingList ? "Generowanie..." : "Generuj listę zakupów"}
              </Button>
            )}
          </div>
          <MealPlanGrid
            plan={gridPlan}
            onRegenerate={() => {
              // No regeneration in detail view
            }}
            onViewDetails={handleViewRecipe}
            regeneratingMeal={null}
            showRegenerate={false}
          />
        </div>

        {/* Shopping List */}
        {plan.shoppingList && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                Lista zakupów
                <div className="ml-auto flex items-center gap-2 text-sm font-normal text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>
                    {
                      Object.values(
                        ((plan.shoppingList as Record<string, unknown>).list_content as Record<string, unknown[]>) || {}
                      ).flat().length
                    }{" "}
                    produktów
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {Object.entries(
                  ((plan.shoppingList as Record<string, unknown>).list_content as Record<string, unknown[]>) || {}
                ).map(([category, items]) => {
                  const categoryEmoji = getCategoryEmoji(category);
                  const categoryColor = getCategoryColor(category);
                  const categoryItems = items as Record<string, unknown>[];

                  return (
                    <div key={category} className="space-y-3">
                      {/* Category Header */}
                      <div className={`flex items-center gap-3 p-3 rounded-lg border ${categoryColor}`}>
                        <span className="text-2xl">{categoryEmoji}</span>
                        <h4 className="font-bold text-lg capitalize">{category}</h4>
                        <div className="ml-auto flex items-center gap-2 text-sm">
                          <List className="w-4 h-4" />
                          <span>{categoryItems.length} produktów</span>
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-6">
                        {categoryItems.map((item: Record<string, unknown>, index: number) => {
                          const itemKey = `${category}-${index}`;
                          const isChecked = checkedItems.has(itemKey);

                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-green-50 border-green-300 text-green-800"
                                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => handleItemToggle(itemKey)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleItemToggle(itemKey);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`${isChecked ? "Odznacz" : "Zaznacz"} ${item.item as string}`}
                            >
                              <div className="flex items-center justify-center w-5 h-5">
                                {isChecked ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-medium ${
                                    isChecked ? "line-through text-green-600" : "text-gray-900"
                                  }`}
                                >
                                  {item.item as string}
                                </div>
                                <div className="text-sm text-gray-500">{item.quantity as string}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Shopping List Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Podsumowanie zakupów</span>
                    </div>
                    <div className="text-sm text-blue-600">
                      {checkedItems.size} z{" "}
                      {
                        Object.values(
                          ((plan.shoppingList as Record<string, unknown>).list_content as Record<string, unknown[]>) ||
                            {}
                        ).flat().length
                      }{" "}
                      produktów zaznaczonych
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && <RecipeDetailModal recipe={selectedRecipe} onClose={handleCloseRecipe} />}
    </div>
  );
}
