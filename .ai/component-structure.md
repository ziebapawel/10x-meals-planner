# Component Structure: Home and Plan Generation View

## Component Hierarchy

```
index.astro (Auth Guard + Layout)
├── Layout.astro
│   └── HomeAndPlanGenerationView.tsx [client:load]
│       ├── useMealPlanGenerator() [Custom Hook]
│       │   ├── useForm() [react-hook-form]
│       │   ├── State Management
│       │   │   ├── workingMealPlan
│       │   │   ├── selectedRecipe
│       │   │   ├── isLoading
│       │   │   ├── isRegenerating
│       │   │   └── error
│       │   └── API Handlers
│       │       ├── handleGeneratePlan()
│       │       ├── handleRegenerateMeal()
│       │       └── handleSavePlan()
│       │
│       ├── Header Section
│       │   ├── ChefHat Icon
│       │   └── Title + Description
│       │
│       ├── Card: Generation Form
│       │   └── PlanGenerationForm.tsx
│       │       ├── Input: peopleCount
│       │       ├── Input: daysCount
│       │       ├── Select: cuisine
│       │       ├── Checkboxes: mealsToPlan[]
│       │       ├── Dynamic Inputs: calorieTargets[]
│       │       ├── Tag Input: excludedIngredients[]
│       │       └── Button: Submit
│       │
│       ├── [Conditional] Card: Generated Plan
│       │   ├── Header with Save Button
│       │   └── MealPlanGrid.tsx
│       │       └── For each day:
│       │           ├── Day Header
│       │           └── Grid of MealCard.tsx
│       │               ├── Recipe Name
│       │               ├── Meal Type
│       │               ├── Click Handler → openRecipeModal()
│       │               └── Button: Regenerate
│       │
│       ├── [Conditional] Empty State Card
│       │   └── Shows when no plan generated
│       │
│       ├── [Conditional] Loading State Card
│       │   └── Shows while generating
│       │
│       └── RecipeDetailModal.tsx
│           ├── Dialog (shadcn)
│           ├── Recipe Name
│           ├── Portions List
│           ├── Ingredients List
│           └── Instructions List
│
└── Toaster.tsx [client:load] (Toast Notifications)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    useMealPlanGenerator Hook                     │
│  (Central State Management + API Integration + localStorage)    │
└───────────────────┬──────────────────┬──────────────────────────┘
                    │                  │
        ┌───────────▼──────────┐      │
        │ PlanGenerationForm   │      │
        │   - Form State       │      │
        │   - Validation       │      │
        │   - localStorage     │      │
        └──────────┬───────────┘      │
                   │                  │
                   │ onSubmit()       │
                   │                  │
        ┌──────────▼──────────────────▼──────────┐
        │    handleGeneratePlan()                 │
        │    POST /api/meal-plans/generate        │
        └──────────┬────────────────────────────┬─┘
                   │                            │
                   │ Success                    │ Error
                   │                            │
        ┌──────────▼────────┐         ┌─────────▼───────┐
        │ setWorkingMealPlan │         │ toast.error()   │
        └──────────┬─────────┘         └─────────────────┘
                   │
        ┌──────────▼─────────┐
        │   MealPlanGrid     │
        │   displays plan    │
        └──┬──────────────┬──┘
           │              │
    ┌──────▼────┐   ┌─────▼──────┐
    │ MealCard  │   │ MealCard   │
    │ onClick() │   │ Regenerate │
    └─────┬─────┘   └─────┬──────┘
          │               │
    ┌─────▼────────┐     │
    │ openRecipe   │     │ handleRegenerateMeal()
    │ Modal()      │     │ POST /api/meals/regenerate
    └──────────────┘     │
                         │
              ┌──────────▼────────────┐
              │ Update workingMealPlan│
              │ with new meal         │
              └───────────────────────┘
```

## State Management Flow

### 1. Initial Load
```
App Loads
  → useMealPlanGenerator initializes
    → Load form data from localStorage
    → Initialize form with react-hook-form
    → Set initial state (null plan, not loading)
```

### 2. User Fills Form
```
User Types
  → react-hook-form updates
    → useEffect watches changes
      → Save to localStorage
```

### 3. Generate Plan
```
User Clicks "Generuj plan"
  → onSubmit triggered
    → handleGeneratePlan()
      → setIsLoading(true)
      → POST /api/meal-plans/generate
        → Success: setWorkingMealPlan(data)
        → Error: setError(message) → toast.error()
      → setIsLoading(false)
```

### 4. View Recipe
```
User Clicks MealCard
  → onViewDetails(recipe)
    → openRecipeModal(recipe)
      → setSelectedRecipe(recipe)
        → RecipeDetailModal renders with data
```

### 5. Regenerate Meal
```
User Clicks "Regeneruj"
  → onRegenerate(day, type)
    → handleRegenerateMeal(day, type)
      → setIsRegenerating({day, type})
      → POST /api/meals/regenerate
        → Success: Update workingMealPlan state
        → Error: toast.error()
      → setIsRegenerating(null)
```

### 6. Save Plan
```
User Clicks "Zapisz plan"
  → handleSavePlan()
    → setIsLoading(true)
    → POST /api/meal-plans
      → Success: 
        → Clear localStorage
        → Navigate to /app/plans/[planId]
      → Error: toast.error()
    → setIsLoading(false)
```

## Props Flow

```
HomeAndPlanGenerationView
│
├─→ PlanGenerationForm
│   Props: {
│     form: UseFormReturn<GenerateMealPlanCommand>
│     onSubmit: (data) => void
│     isLoading: boolean
│   }
│
├─→ MealPlanGrid
│   Props: {
│     plan: GeneratedMealPlanDto
│     onRegenerate: (day, type) => void
│     onViewDetails: (recipe) => void
│     regeneratingMeal: { day, type } | null
│   }
│   │
│   └─→ MealCard (for each meal)
│       Props: {
│         meal: MealInPlanDto
│         day: number
│         onRegenerate: (day, type) => void
│         onViewDetails: (recipe) => void
│         isRegenerating: boolean
│       }
│
└─→ RecipeDetailModal
    Props: {
      recipe: RecipeDto | null
      onClose: () => void
    }
```

## Type Safety

All components use TypeScript with strict typing:

- **DTOs**: Shared types from `src/types.ts`
- **Form Validation**: Zod schemas from `src/lib/validation/schemas.ts`
- **API Responses**: Typed with DTO interfaces
- **Component Props**: Explicitly typed interfaces
- **Hook Return**: Fully typed return object

## Styling Approach

- **Base**: Tailwind 4 utility classes
- **Components**: Shadcn/ui with custom styling
- **Animations**: tw-animate-css
  - `animate-fade-in`: Form and cards
  - `animate-slide-in-up`: Day sections
- **Responsive**: Mobile-first breakpoints
  - `sm:`, `md:`, `lg:`, `xl:`
- **Interactions**:
  - Hover effects (scale, shadow)
  - Focus states (ring, border)
  - Disabled states (opacity, cursor)
  - Loading states (spinner, text change)

