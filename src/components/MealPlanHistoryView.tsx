import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Calendar, Users, ChefHat, Plus, ArrowRight, Clock, Utensils, Flame, Star } from "lucide-react";
import { toast } from "sonner";
import type { MealPlanListItemDto, ListMealPlansDto, GenerateMealPlanCommand } from "../types";

interface MealPlanHistoryState {
  data: ListMealPlansDto | null;
  loading: boolean;
  error: string | null;
}

// Helper function to get cuisine emoji
const getCuisineEmoji = (cuisine: string): string => {
  const cuisineEmojis: Record<string, string> = {
    'Italian': '🍝',
    'Polish': '🥟',
    'Mexican': '🌮',
    'Asian': '🍜',
    'Indian': '🍛',
    'French': '🥐',
    'Mediterranean': '🫒',
    'American': '🍔',
    'Thai': '🌶️',
    'Chinese': '🥢',
    'Japanese': '🍣',
    'Greek': '🧀',
    'Spanish': '🥘',
    'German': '🥨',
    'Turkish': '🥙',
  };
  return cuisineEmojis[cuisine] || '🍽️';
};

// Helper function to calculate total calories
const calculateTotalCalories = (planInput: GenerateMealPlanCommand): number => {
  return planInput.calorieTargets.reduce((total, target) => total + target.calories, 0);
};


export function MealPlanHistoryView() {
  const [state, setState] = useState<MealPlanHistoryState>({
    data: null,
    loading: true,
    error: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch meal plans
  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch(`/api/meal-plans?page=${currentPage}&pageSize=${pageSize}`);
        
        if (!response.ok) {
          throw new Error("Wystąpił błąd podczas ładowania planów");
        }
        
        const data: ListMealPlansDto = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
        setState({ data: null, loading: false, error: errorMessage });
        toast.error(errorMessage);
      }
    };

    fetchMealPlans();
  }, [currentPage, pageSize]);

  // Handle plan click
  const handlePlanClick = (planId: string) => {
    window.location.href = `/plans/${planId}`;
  };

  // Handle create new plan
  const handleCreateNew = () => {
    window.location.href = "/generate";
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie planów posiłków...</p>
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
            <Button onClick={() => window.location.reload()}>
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data } = state;
  const plans = data?.data || [];
  const pagination = data?.pagination;

  // Empty state
  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8">
              <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Brak planów posiłków</h1>
              <p className="text-muted-foreground mb-8">
                Nie masz jeszcze żadnych zapisanych planów posiłków. 
                Stwórz swój pierwszy plan, aby rozpocząć!
              </p>
            </div>
            <Button onClick={handleCreateNew} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Stwórz pierwszy plan
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Moje Plany Posiłków</h1>
            <p className="text-muted-foreground">
              Zarządzaj swoimi zapisanymi planami posiłków
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nowy plan
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const planInput = plan.plan_input as GenerateMealPlanCommand;
            const totalCalories = calculateTotalCalories(planInput);
            const cuisineEmoji = getCuisineEmoji(planInput.cuisine);
            const totalMeals = planInput.daysCount * planInput.mealsToPlan.length;
            
            return (
              <Card 
                key={plan.id} 
                className="cursor-pointer card-elevated group border-2 hover:border-primary/30 hover:scale-[1.02] transition-all duration-300"
                onClick={() => handlePlanClick(plan.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{cuisineEmoji}</span>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          Plan {planInput.cuisine}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(plan.created_at).toLocaleDateString("pl-PL")}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-light rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Calendar className="w-4 h-4 text-orange-warm" />
                        <span className="text-sm font-medium text-orange-warm">{planInput.daysCount}</span>
                      </div>
                      <p className="text-xs text-orange-warm">dni</p>
                    </div>
                    
                    <div className="bg-green-light rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-green-fresh" />
                        <span className="text-sm font-medium text-green-fresh">{planInput.peopleCount}</span>
                      </div>
                      <p className="text-xs text-green-fresh">
                        {planInput.peopleCount === 1 ? 'osoba' : 'osób'}
                      </p>
                    </div>
                  </div>

                  {/* Calories and Meals */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-light rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Flame className="w-4 h-4 text-orange-warm" />
                        <span className="text-sm font-medium text-orange-warm">{totalCalories}</span>
                      </div>
                      <p className="text-xs text-orange-warm">kcal/dzień</p>
                    </div>
                    
                    <div className="bg-green-light rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Utensils className="w-4 h-4 text-green-fresh" />
                        <span className="text-sm font-medium text-green-fresh">{totalMeals}</span>
                      </div>
                      <p className="text-xs text-green-fresh">posiłków</p>
                    </div>
                  </div>


                  {/* Meal Types */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Typy posiłków:</p>
                    <div className="flex flex-wrap gap-1">
                      {planInput.mealsToPlan.map((mealType) => (
                        <span 
                          key={mealType}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground"
                        >
                          {mealType === 'breakfast' && '🌅'}
                          {mealType === 'lunch' && '☀️'}
                          {mealType === 'dinner' && '🌙'}
                          {mealType === 'snack' && '🍎'}
                          <span className="ml-1 capitalize">
                            {mealType === 'breakfast' ? 'Śniadanie' :
                             mealType === 'lunch' ? 'Obiad' :
                             mealType === 'dinner' ? 'Kolacja' :
                             mealType === 'snack' ? 'Przekąska' : mealType}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Excluded Ingredients */}
                  {planInput.excludedIngredients.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Wykluczone składniki:</p>
                      <div className="flex flex-wrap gap-1">
                        {planInput.excludedIngredients.slice(0, 3).map((ingredient) => (
                          <span 
                            key={ingredient}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-destructive/10 text-destructive border border-destructive/20"
                          >
                            🚫 {ingredient}
                          </span>
                        ))}
                        {planInput.excludedIngredients.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground">
                            +{planInput.excludedIngredients.length - 3} więcej
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Poprzednia
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Następna
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
