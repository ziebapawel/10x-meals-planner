# Meals Planner

An intelligent meal planning assistant designed to simplify and automate the creation of meal plans and shopping lists for multi-person households. This web application leverages an AI engine to generate personalized recipes based on user-specific criteria such as the number of people, dietary preferences, and caloric needs, with user account management powered by Supabase.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend
- **Framework**: [Astro 5](https://astro.build/)
- **UI Library**: [React 19](https://react.dev/) for interactive components
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind 4](https://tailwindcss.com/)
- **Component Library**: [Shadcn/ui](https://ui.shadcn.com/)

### Backend
- **Platform**: [Supabase](https://supabase.io/)
  - **Database**: PostgreSQL
  - **Authentication**: Supabase Auth
  - **Backend-as-a-Service**: Supabase SDK

### AI
- **Service**: [Openrouter.ai](https://openrouter.ai/) for access to various AI models

### CI/CD & Hosting
- **CI/CD**: GitHub Actions
- **Hosting**: DigitalOcean (Docker)

## Getting Started Locally

### Prerequisites
- Node.js `v22.14.0` (as specified in `.nvmrc`)
- npm (included with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd 10x-meals-planner
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add the necessary API keys for Supabase and Openrouter.ai.

    ```env
    # Supabase
    PUBLIC_SUPABASE_URL=your_supabase_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

    # Openrouter.ai
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:4321`.

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Previews the production build locally.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run lint:fix`: Automatically fixes ESLint errors.
-   `npm run format`: Formats code using Prettier.

## Project Scope

### Key Features (MVP)
- **User Authentication**: Registration, login, and logout functionality using Supabase.
- **Meal Plan Generation**: A form to define requirements for the meal plan, including the number of people, days, cuisine type, excluded ingredients, and individual calorie targets.
- **AI-Powered Recipes**: Integration with Openrouter.ai to generate personalized recipes. The AI calculates portion sizes in grams to match caloric goals.
- **Interactive Plan Viewer**: A grid-based interface to view the generated meal plan.
- **Meal Regeneration**: Ability to regenerate a single meal within the plan without affecting others.
- **Save & History**: Save generated plans to a user's account and access a history of all saved plans.
- **Aggregated Shopping List**: Automatically generate a shopping list from a saved plan, with ingredients aggregated and categorized by store department.

### Out of Scope (for MVP)
- Manual creation, addition, or editing of meals.
- Rating system for meals or plans.
- Sharing plans or shopping lists with other users.
- Dedicated mobile applications (iOS/Android).
- Exporting meal plans or shopping lists to external files (e.g., PDF).
- Checking off items on the shopping list.
- Manual editing of the generated shopping list.

## Project Status
The project is currently in the **development phase**. The focus is on delivering the Minimum Viable Product (MVP) as outlined in the project scope.

## License
This project is licensed under the **MIT License**.
