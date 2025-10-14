import { useEffect, useState } from "react";
import { MealPlanGrid } from "./MealPlanGrid";
import { RecipeDetailModal } from "./RecipeDetailModal";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Calendar, Users, ChefHat, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MealPlanDetailsDto, MealDto } from "../types";

interface MealPlanDetailViewProps {
  planId: string;
}

interface MealPlanState {
  data: MealPlanDetailsDto | null;
  loading: boolean;
  error: string | null;
}

export function MealPlanDetailView({ planId }: MealPlanDetailViewProps) {
  const [state, setState] = useState<MealPlanState>({
    data: null,
    loading: true,
    error: null,
  });
  const [selectedRecipe, setSelectedRecipe] = useState<MealDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch meal plan details
  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
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
  const handleViewRecipe = (meal: MealDto) => {
    setSelectedRecipe(meal);
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
      // Redirect to app dashboard
      window.location.href = "/app";
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    window.location.href = "/app";
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
              <Button onClick={() => window.location.reload()}>
                Spróbuj ponownie
              </Button>
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
            <p className="text-muted-foreground mb-4">
              Nie udało się znaleźć planu posiłków o podanym ID.
            </p>
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
  const planInput = plan.plan_input;

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
              <p className="text-muted-foreground">
                Utworzony {new Date(plan.created_at).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleDeletePlan} 
            variant="destructive" 
            size="sm"
            disabled={isDeleting}
          >
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
                <span className="font-medium">{planInput.days}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Osoby:</span>
                <span className="font-medium">{planInput.people}</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Dieta:</span>
                <span className="font-medium">{planInput.diet || "Standardowa"}</span>
              </div>
            </div>
            {planInput.allergies && planInput.allergies.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">Alergie:</span>
                <span className="ml-2 text-sm">{planInput.allergies.join(", ")}</span>
              </div>
            )}
            {planInput.preferences && planInput.preferences.length > 0 && (
              <div className="mt-2">
                <span className="text-sm text-muted-foreground">Preferencje:</span>
                <span className="ml-2 text-sm">{planInput.preferences.join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Plan Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Plan posiłków</h2>
          <MealPlanGrid 
            plan={plan} 
            onRegenerate={() => {}} // No regeneration in detail view
            onViewDetails={handleViewRecipe}
            regeneratingMeal={null}
          />
        </div>

        {/* Shopping List */}
        {plan.shoppingList && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Lista zakupów
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(plan.shoppingList.categories).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-semibold text-lg mb-2 capitalize">{category}</h4>
                    <ul className="space-y-1">
                      {items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal 
          recipe={selectedRecipe} 
          onClose={handleCloseRecipe} 
        />
      )}
    </div>
  );
}
