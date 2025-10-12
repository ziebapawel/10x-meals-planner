# UI Architecture for 10x Meals Planner

## 1. UI Structure Overview

The UI architecture for the 10x Meals Planner is designed as a single-page application (SPA) experience built with Astro and interactive React components. It follows a modular, view-based structure that guides the user through the core flows of meal plan generation, modification, and review.

The architecture prioritizes a clear separation of concerns:
-   **Views**: Top-level pages corresponding to major application routes (`/`, `/app`, `/app/plans/[planId]`).
-   **Components**: Reusable UI elements (`MealPlanGrid`, `ShoppingList`, `RecipeDetailModal`) that encapsulate specific functionalities and are shared across different views.
-   **State Management**: A hybrid approach is used. Global state (e.g., user authentication) is handled by a React Context. Local, complex state (e.g., the plan generation form, the "working" meal plan) is managed within client-side React components, leveraging libraries like React Hook Form and persisting to `localStorage` where appropriate.

This structure ensures a responsive, accessible, and intuitive user experience, directly aligning with the API endpoints and fulfilling all user stories outlined in the PRD.

## 2. View List

### View 1: Home & Plan Generation
-   **View Path**: `/`
-   **Primary Purpose**: To serve as the main entry point for generating new meal plans. For unauthenticated users, it acts as a landing page with authentication options.
-   **Key Information to Display**:
    -   The meal plan generation form.
    -   The interactive, "working" (unsaved) meal plan grid after generation.
-   **Key View Components**:
    -   `Header`: Contains navigation and user authentication status.
    -   `PlanGenerationForm`: The form for user inputs (people, days, calories, etc.).
    -   `MealPlanGrid`: A responsive grid displaying the generated `MealCard` components.
    -   `MealCard`: Represents a single meal, with a "Regenerate" option.
    -   `RecipeDetailModal`: A dialog showing the full recipe details, opened on `MealCard` click.
-   **UX, Accessibility & Security Considerations**:
    -   **UX**: The form state is persisted in `localStorage` for a better return experience. Clear loading indicators are used for all async operations (initial generation, regeneration). Errors are communicated via non-blocking toast notifications.
    -   **A11y**: All form fields have corresponding labels. The meal grid supports keyboard navigation. Modal dialogs trap focus correctly.
    -   **Security**: This view is accessible only to authenticated users (for the form part). The global authentication context handles unauthorized access attempts.

### View 2: Authentication
-   **View Path**: `/login`, `/signup`
-   **Primary Purpose**: To handle user registration and login.
-   **Key Information to Display**:
    -   Email and password input fields.
    -   Submission buttons ("Login", "Sign Up").
    -   Links to toggle between login and registration forms.
-   **Key View Components**:
    -   `AuthForm`: A reusable form component for both login and registration.
-   **UX, Accessibility & Security Considerations**:
    -   **UX**: Clear validation feedback and error messages (e.g., "Invalid credentials", "Email already in use").
    -   **A11y**: Forms are structured semantically with proper labels and input types.
    -   **Security**: All authentication is handled via secure API calls. No sensitive information is stored client-side.

### View 3: Plan History
-   **View Path**: `/app`
-   **Primary Purpose**: To display a list of all the user's saved meal plans, serving as the main dashboard for returning users.
-   **Key Information to Display**:
    -   A paginated list of saved meal plans, with summary details (e.g., creation date, duration).
    -   An "empty state" message with a call-to-action if no plans have been saved.
-   **Key View Components**:
    -   `Header`: Main application navigation.
    -   `PlanHistoryList`: Renders the list of plan summary cards.
    -   `PlanHistoryItemCard`: A single card representing a saved plan, linking to its detail view.
    -   `EmptyState`: A component shown to users with no saved plans.
    -   `PaginationControls`: Buttons for navigating between pages of results.
-   **UX, Accessibility & Security Considerations**:
    -   **UX**: The view provides a clear, at-a-glance overview of past activity. Pagination is handled via URL query parameters (`?page=2`) for shareability.
    -   **A11y**: The list is semantically structured. Pagination controls provide ARIA attributes for screen readers.
    -   **Security**: The API ensures that only the plans belonging to the authenticated user are fetched and displayed.

### View 4: Plan Detail
-   **View Path**: `/app/plans/[planId]`
-   **Primary Purpose**: To display the full details of a single, saved meal plan and its corresponding shopping list.
-   **Key Information to Display**:
    -   A summary of the inputs used to generate the plan.
    -   A static, non-editable grid of all meals in the plan.
    -   The generated, categorized shopping list.
-   **Key View Components**:
    -   `Header`: Main application navigation.
    -   `PlanInputSummary`: Displays the original criteria of the saved plan.
    -   `MealPlanGrid`: A static version of the grid component.
    -   `ShoppingList`: Displays the categorized list or a button to generate it if not yet created.
    -   `RecipeDetailModal`: Shows recipe details when a meal is clicked.
-   **UX, Accessibility & Security Considerations**:
    -   **UX**: The shopping list generation is a non-blocking background task with a clear loading state. The UI prevents duplicate generation attempts.
    -   **A11y**: The shopping list uses proper headings for categories. The static meal grid is readable and navigable.
    -   **Security**: The API ensures the plan being viewed belongs to the authenticated user. A "Not Found" state is handled if an invalid or unauthorized `planId` is accessed.

## 3. User Journey Map

The primary user journey follows a logical progression from creation to consumption:

1.  **Authentication**: A new user signs up or a returning user logs in via the **Authentication View**.
2.  **Generation**: Upon successful login, the user is directed to the **Home & Plan Generation View (`/`)**. They fill out the form and generate a "working" plan.
3.  **Refinement**: The user reviews the generated plan. If a meal is unsatisfactory, they use the "Regenerate" feature to get a new suggestion. This step is iterative and happens entirely on the client side.
4.  **Saving**: Once satisfied, the user saves the plan. The application persists the data via an API call and automatically redirects them to the **Plan Detail View** for the newly created plan.
5.  **Utilization**: In the **Plan Detail View**, the user generates the shopping list and can click on any meal to view the detailed recipe in a modal.
6.  **Recall**: At any time, the user can navigate to the **Plan History View (`/app`)** to see all their saved plans and re-enter the **Plan Detail View** for any of them.

## 4. Layout & Navigation Structure

Navigation is managed through a persistent `Header` component and a clear URL structure.

-   **Unauthenticated Layout**:
    -   `Header`: Contains the app logo and links to "Login" and "Sign Up".
    -   `Main Content`: Renders the landing page or the active authentication form.
-   **Authenticated Layout**:
    -   `Header`: Contains the app logo (linking to `/` for new plan generation), a link to "My Plans" (`/app`), and a user dropdown with a "Logout" option.
    -   `Main Content`: Renders the active view (`/`, `/app`, or `/app/plans/[planId]`).
-   **URL Structure**:
    -   `/`: Home / New Plan Generation
    -   `/login`, `/signup`: Authentication
    -   `/app`: User's Plan History (Dashboard)
    -   `/app/plans/[planId]`: Detail view of a specific plan

This structure is intuitive and allows users to easily move between creating new plans and reviewing existing ones.

## 5. Key Components

These are the core, reusable components that form the building blocks of the UI.

-   `PlanGenerationForm`: A React component managing the state and validation of the plan creation form using React Hook Form and Zod.
-   `MealPlanGrid`: A responsive grid that displays meals. It can be interactive (with regeneration buttons) or static (for saved plans). On mobile, it adapts to an accordion layout.
-   `MealCard`: A presentational component for a single meal, displaying its name and providing interaction points (view details, regenerate).
-   `ShoppingList`: A component that handles the logic for fetching and displaying the categorized shopping list. It manages its own loading and empty/generated states.
-   `RecipeDetailModal`: A `Shadcn/ui Dialog` component that displays detailed recipe information, including name, ingredients, instructions, and per-person portion sizes.
-   `Header`: The main navigation component, which renders differently based on the user's authentication status.
-   `Toast`: A notification component used for providing system feedback (e.g., success messages, API errors).
