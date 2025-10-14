import { useEffect } from "react";
import { useMealPlanGenerator } from "../lib/hooks/useMealPlanGenerator";
import { PlanGenerationForm } from "./PlanGenerationForm";
import { MealPlanGrid } from "./MealPlanGrid";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { ChefHat, Save, Sparkles } from "lucide-react";

export function HomeAndPlanGenerationView() {
  const {
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
  } = useMealPlanGenerator();

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const onSubmit = async (data: Parameters<typeof handleGeneratePlan>[0]) => {
    await handleGeneratePlan(data);
    toast.success("Plan posiłków został wygenerowany!");
  };

  const onSavePlan = async () => {
    const planId = await handleSavePlan();
    if (planId) {
      toast.success("Plan został zapisany!");
      // Navigate to the plan details page
      window.location.href = `/app/plans/${planId}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ChefHat className="size-10 text-primary" />
            <h1 className="text-4xl font-bold">Planer Posiłków</h1>
          </div>
          <p className="text-muted-foreground text-lg">Wygeneruj spersonalizowany plan posiłków z pomocą AI</p>
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Stwórz swój plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PlanGenerationForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Generated Plan */}
          {workingMealPlan && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Twój Plan Posiłków</h2>
                <Button onClick={onSavePlan} disabled={isLoading} size="lg" className="gap-2">
                  <Save />
                  {isLoading ? "Zapisywanie..." : "Zapisz plan"}
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <MealPlanGrid
                    plan={workingMealPlan}
                    onRegenerate={handleRegenerateMeal}
                    onViewDetails={openRecipeModal}
                    regeneratingMeal={isRegenerating}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!workingMealPlan && !isLoading && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <ChefHat className="size-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Zacznij planować posiłki</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Wypełnij formularz powyżej i kliknij "Generuj plan posiłków", aby stworzyć spersonalizowany plan
                  żywieniowy dostosowany do Twoich potrzeb.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && !workingMealPlan && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Generowanie planu...</h3>
                    <p className="text-muted-foreground">
                      AI tworzy dla Ciebie spersonalizowany plan posiłków. To może potrwać kilka chwil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal recipe={selectedRecipe} onClose={closeRecipeModal} />
    </div>
  );
}
