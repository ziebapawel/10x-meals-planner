import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Calendar, Users, ChefHat, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { MealPlanListItemDto, ListMealPlansDto } from "../types";

interface MealPlanHistoryState {
  data: ListMealPlansDto | null;
  loading: boolean;
  error: string | null;
}

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
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handlePlanClick(plan.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Plan posiłków</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(plan.created_at).toLocaleDateString("pl-PL")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{(plan.plan_input as any).daysCount} dni</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{(plan.plan_input as any).peopleCount} {(plan.plan_input as any).peopleCount === 1 ? 'osoba' : 'osób'}</span>
                  </div>
                  
                  {(plan.plan_input as any).cuisine && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChefHat className="w-4 h-4" />
                      <span>{(plan.plan_input as any).cuisine}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
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
