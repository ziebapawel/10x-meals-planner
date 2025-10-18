Here is the comprehensive test plan for the software project.

---

# Test Plan: AI Meal Planner

## 1. Introduction and Testing Objectives

This document outlines the comprehensive testing strategy for the AI Meal Planner application. The project is a modern web application built with Astro, React, TypeScript, Supabase, and an external AI service, designed to generate, save, and manage personalized meal plans.

The primary objectives of this test plan are to:

- **Ensure Functionality:** Verify that all application features, from user authentication to AI-driven meal plan generation, work as specified.
- **Guarantee Reliability and Stability:** Identify and rectify defects to ensure the application is stable, reliable, and provides a consistent user experience.
- **Validate Security:** Confirm that user data is secure, and that users can only access their own information and plans.
- **Verify Integration:** Ensure seamless integration between the frontend components, backend APIs, Supabase database, and the external AI service.
- **Confirm Usability:** Validate that the application is intuitive, responsive, and provides clear feedback to the user (e.g., loading states, error messages).
- **Prevent Regressions:** Establish a suite of automated tests to ensure that new changes do not break existing functionality.

## 2. Scope of Testing

### 2.1. In-Scope Features

The following features and components are within the scope of testing:

- **User Authentication:** Registration, Login, Logout, Forgot Password, and Reset Password flows.
- **Session Management:** Middleware-based route protection and session handling.
- **Meal Plan Generation:**
  - Form submission with various user inputs (people, days, cuisine, etc.).
  - Interaction with the `/api/meal-plans/generate` endpoint.
  - Correct display of the generated meal plan grid.
- **Meal Regeneration:**
  - Regenerating a single meal within a plan.
  - Interaction with the `/api/meals/regenerate` endpoint.
  - Updating the UI with the regenerated meal.
- **Meal Plan Management (CRUD):**
  - Saving a generated meal plan.
  - Viewing a paginated history of saved plans.
  - Viewing the detailed page of a specific plan.
  - Deleting a saved plan.
- **Shopping List Generation:**
  - Generating a shopping list for a saved plan.
  - Interaction with the `/api/meal-plans/{planId}/shopping-list` endpoint.
  - Displaying the categorized shopping list.
- **API Endpoints:** All backend endpoints under `/api/`, including validation, authentication checks, business logic, and error handling.
- **User Interface (UI):**
  - Responsiveness and cross-browser compatibility.
  - Correct rendering of all components (modals, forms, cards, etc.).
  - Client-side state management and user interaction logic.
- **Error Handling:** Graceful handling of API errors, validation errors, and network issues on both the client and server.

### 2.2. Out-of-Scope Features

The following are considered out of scope for this test plan:

- Testing the internal logic of the third-party AI model (OpenRouter.ai). We will only test the integration, prompt construction, and response handling.
- Performance and load testing beyond a reasonable number of concurrent users.
- Testing the underlying infrastructure of Supabase or Astro.
- Comprehensive accessibility testing beyond basic checks (e.g., keyboard navigation, semantic HTML).

## 3. Types of Testing

A multi-layered testing approach will be adopted to ensure comprehensive coverage.

| Test Type                      | Description                                                                                                                                                                                                                | Tools                                                               | Responsibility            |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :------------------------ |
| **Unit Testing**               | Testing individual functions, components, and services in isolation. Focus on business logic in services, utility functions, validation schemas, and simple UI components.                                                 | Vitest, React Testing Library                                       | Developers                |
| **Integration Testing**        | Verifying the interaction between different parts of the application, such as frontend components and backend APIs, or services and the database. This includes testing API endpoints and the `useMealPlanGenerator` hook. | Vitest, Supertest, React Testing Library, Mock Service Worker (MSW) | Developers & QA Engineers |
| **End-to-End (E2E) Testing**   | Simulating real user scenarios from start to finish in a browser environment. This covers all major user flows like registration, plan generation, and management.                                                         | Playwright, Cypress                                                 | QA Engineers              |
| **API Testing**                | Directly testing all API endpoints for functionality, security, validation, and error handling using various inputs.                                                                                                       | Postman (Manual), Automated scripts (Playwright/Vitest)             | QA Engineers              |
| **Security Testing**           | Focusing on authentication and authorization vulnerabilities. Ensuring users cannot access or modify data that does not belong to them.                                                                                    | Manual checks, Automated API tests                                  | QA Engineers              |
| **Visual Regression Testing**  | Capturing screenshots of UI components and pages to automatically detect unintended visual changes.                                                                                                                        | Playwright, Percy, Chromatic                                        | QA Engineers              |
| **Manual Exploratory Testing** | Unscripted testing performed to discover defects that are difficult to find with automated tests, focusing on usability and edge cases.                                                                                    | N/A                                                                 | QA Engineers              |

## 4. Test Scenarios

Below are high-level test scenarios for the application's key functionalities.

### 4.1. Authentication and Authorization

| Scenario ID | Description                                                                                                                        | Priority |
| :---------- | :--------------------------------------------------------------------------------------------------------------------------------- | :------- |
| AUTH-01     | A new user successfully registers with a valid email and strong password.                                                          | High     |
| AUTH-02     | A user attempts to register with an email that is already in use.                                                                  | High     |
| AUTH-03     | A user successfully logs in with correct credentials and is redirected.                                                            | High     |
| AUTH-04     | A user fails to log in with incorrect credentials and sees an error message.                                                       | High     |
| AUTH-05     | A logged-in user successfully logs out and their session is terminated.                                                            | High     |
| AUTH-06     | A user successfully requests a password reset link and changes their password.                                                     | High     |
| AUTH-07     | An unauthenticated user attempting to access a protected page (e.g., `/generate`) is redirected to the login page.                 | High     |
| AUTH-08     | A logged-in user (User A) attempts to access the meal plan details of another user (User B) via a direct URL and is denied access. | Critical |
| AUTH-09     | A logged-in user (User A) attempts to fetch/delete data for another user (User B) via direct API calls and is denied.              | Critical |

### 4.2. Meal Plan Generation and Management

| Scenario ID | Description                                                                                                                        | Priority |
| :---------- | :--------------------------------------------------------------------------------------------------------------------------------- | :------- |
| PLAN-01     | A logged-in user fills out the generation form with valid data and successfully generates a meal plan.                             | High     |
| PLAN-02     | The form validation prevents submission and shows appropriate error messages for invalid inputs (e.g., days > 14, calories < 500). | High     |
| PLAN-03     | The UI correctly displays loading indicators during AI plan generation and regeneration.                                           | Medium   |
| PLAN-04     | The application gracefully handles an error from the AI generation API and displays a user-friendly error message.                 | High     |
| PLAN-05     | A user successfully regenerates a single meal within the generated plan.                                                           | Medium   |
| PLAN-06     | A user successfully saves a generated plan and is redirected to the plan details page.                                             | High     |
| PLAN-07     | The user's meal plan history page correctly displays a paginated list of their saved plans.                                        | High     |
| PLAN-08     | A user can successfully delete a meal plan, and it is removed from their history.                                                  | High     |

### 4.3. Shopping List

| Scenario ID | Description                                                                                         | Priority |
| :---------- | :-------------------------------------------------------------------------------------------------- | :------- |
| SHOP-01     | A user successfully generates a categorized shopping list for a saved meal plan.                    | High     |
| SHOP-02     | The UI displays a loading state while the shopping list is being generated.                         | Medium   |
| SHOP-03     | An attempt to generate a shopping list for a plan that already has one results in an error message. | Medium   |
| SHOP-04     | The application gracefully handles an error from the shopping list generation API.                  | High     |

## 5. Test Environment

A dedicated testing/staging environment will be required, mirroring the production setup as closely as possible.

- **Frontend Application:** Deployed instance of the Astro application.
- **Backend & Database:** A separate Supabase project for testing to avoid polluting production data. This includes its own database, authentication, and storage.
- **Environment Variables:** The test environment must be configured with its own `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and a dedicated `OPENROUTER_API_KEY` (or a mocked endpoint for the AI service).
- **Browsers:** Testing will be performed on the latest versions of major browsers: Google Chrome, Mozilla Firefox, and Safari.

## 6. Testing Tools

| Category                    | Tool                    | Purpose                                                                                         |
| :-------------------------- | :---------------------- | :---------------------------------------------------------------------------------------------- |
| **Test Runner / Framework** | Vitest                  | For running unit and integration tests in a Node.js environment.                                |
| **Component Testing**       | React Testing Library   | For rendering and interacting with React components in a test environment.                      |
| **End-to-End Testing**      | Playwright              | For automating browser interactions and testing full user flows.                                |
| **API Testing (Manual)**    | Postman / Insomnia      | For manual API exploration and verification.                                                    |
| **CI/CD**                   | GitHub Actions          | To automate the execution of all test suites on every pull request and push to the main branch. |
| **Code Coverage**           | `v8` (Vitest's default) | To measure the percentage of code covered by unit and integration tests.                        |

## 7. Test Schedule

Testing will be an integral part of the development lifecycle.

- **Sprint-Level Testing:** Developers will write and run unit and integration tests for new features within each sprint. QA will perform exploratory testing on completed features.
- **Regression Testing:** The full suite of automated E2E and API tests will be run via CI/CD on every pull request to the `main` or `develop` branch.
- **Pre-Release Testing:** Before deploying to production, a full manual regression and exploratory testing cycle will be conducted on the staging environment by the QA team.

## 8. Test Acceptance Criteria

### 8.1. Entry Criteria

- The code for the feature to be tested is deployed to the staging environment.
- All related unit and integration tests are passing in the CI pipeline.
- The test environment is stable and accessible.

### 8.2. Exit Criteria (For Production Release)

- 100% of all automated E2E tests for critical paths must pass.
- Code coverage must meet or exceed the target of 80% for critical services.
- There are no open "Critical" or "High" priority bugs.
- All "Medium" priority bugs are documented and have a resolution plan.
- The final QA sign-off has been provided.

## 9. Roles and Responsibilities

| Role                                | Responsibilities                                                                                                                                                                                                                                                  |
| :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Developers**                      | - Writing and maintaining unit and integration tests for their code.<br>- Fixing bugs identified during the testing process.<br>- Ensuring CI pipeline passes for their pull requests.                                                                            |
| **QA Engineer(s)**                  | - Designing and writing the overall Test Plan.<br>- Developing and maintaining automated E2E and API test suites.<br>- Performing manual exploratory and regression testing.<br>- Reporting bugs and verifying fixes.<br>- Providing final sign-off for releases. |
| **Project Manager / Product Owner** | - Prioritizing bug fixes based on business impact.<br>- Reviewing test results and making release decisions.                                                                                                                                                      |

## 10. Bug Reporting Procedure

All defects found during testing will be reported in a designated issue tracking system (e.g., Jira, GitHub Issues). Each bug report must contain the following information:

- **Title:** A clear and concise summary of the defect.
- **Environment:** The environment where the bug was found (e.g., Staging, Browser Version).
- **Steps to Reproduce:** A detailed, numbered list of steps to trigger the bug.
- **Expected Result:** What the application should have done.
- **Actual Result:** What the application actually did.
- **Priority/Severity:** An assessment of the bug's impact (e.g., Critical, High, Medium, Low).
- **Attachments:** Relevant screenshots, videos, or console logs to help diagnose the issue.
