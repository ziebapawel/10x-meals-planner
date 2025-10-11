# REST API Plan

This document outlines the REST API for the Meals Planner application. The API is designed to handle meal plan generation, storage, and shopping list creation, with a focus on business logic involving AI integration.

## 1. Resources

-   **Meal Plan**: Represents a user's saved meal plan, including the initial input and associated meals.
    -   *Database Table*: `meal_plans`
-   **Meal**: Represents a single meal within a meal plan.
    -   *Database Table*: `meals`
-   **Shopping List**: Represents the aggregated shopping list for a specific meal plan.
    -   *Database Table*: `shopping_lists`

## 2. Endpoints

### Meal Plan Endpoints

These endpoints handle the generation, creation, and retrieval of meal plans.

---

#### **Generate Meal Plan (AI)**

-   **Method**: `POST`
-   **URL**: `/api/meal-plans/generate`
-   **Description**: Takes user input, calls the AI service to generate a new meal plan, and returns the full plan to the client without persisting it to the database.
-   **Request Body**:
    ```json
    {
      "peopleCount": 2,
      "daysCount": 3,
      "cuisine": "Italian",
      "excludedIngredients": ["pork", "nuts"],
      "calorieTargets": [
        { "person": 1, "calories": 2200 },
        { "person": 2, "calories": 1800 }
      ],
      "mealsToPlan": ["breakfast", "lunch", "dinner"]
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
      "plan": {
        "days": [
          {
            "day": 1,
            "meals": [
              {
                "type": "breakfast",
                "recipe": {
                  "name": "Scrambled Eggs with Spinach",
                  "ingredients": [...],
                  "instructions": [...],
                  "portions": [
                    { "person": 1, "grams": 250 },
                    { "person": 2, "grams": 210 }
                  ]
                }
              }
              // ... other meals
            ]
          }
          // ... other days
        ]
      }
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input data.
    -   `500 Internal Server Error`: AI service failed or an unexpected error occurred.

---

#### **Create Meal Plan**

-   **Method**: `POST`
-   **URL**: `/api/meal-plans`
-   **Description**: Saves a user-accepted meal plan (generated client-side) to the database. Creates a `meal_plans` record and all associated `meals` records in a single transaction.
-   **Request Body**:
    ```json
    {
      "planInput": {
        "peopleCount": 2,
        // ... same as generate input
      },
      "meals": [
        {
          "day": 1,
          "type": "breakfast",
          "recipeData": {
            "name": "Scrambled Eggs with Spinach",
            // ... full recipe details
          }
        }
        // ... all other meals
      ]
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "userId": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
      "createdAt": "2025-10-11T10:00:00Z",
      // ... other meal plan fields
    }
    ```
-   **Success Code**: `201 Created`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid payload structure.
    -   `401 Unauthorized`: User is not authenticated.

---

#### **List Meal Plans**

-   **Method**: `GET`
-   **URL**: `/api/meal-plans`
-   **Description**: Retrieves a paginated list of the authenticated user's saved meal plans.
-   **Query Parameters**:
    -   `page` (integer, optional, default: 1): The page number for pagination.
    -   `pageSize` (integer, optional, default: 10): The number of items per page.
-   **Response Body (Success)**:
    ```json
    {
      "data": [
        {
          "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "createdAt": "2025-10-11T10:00:00Z",
          "planInput": { ... }
        }
      ],
      "pagination": {
        "currentPage": 1,
        "pageSize": 10,
        "totalPages": 5
      }
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

---

#### **Get Meal Plan**

-   **Method**: `GET`
-   **URL**: `/api/meal-plans/{planId}`
-   **Description**: Retrieves a single meal plan by its ID, including all its meals and the associated shopping list if it exists.
-   **Response Body (Success)**:
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "createdAt": "2025-10-11T10:00:00Z",
      "planInput": { ... },
      "meals": [
        { "id": "uuid-meal-1", "day": 1, "type": "breakfast", "recipeData": { ... } }
      ],
      "shoppingList": {
        "id": "uuid-list-1",
        "listContent": { ... }
      }
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: No meal plan found with the given ID for this user.

---

#### **Delete Meal Plan**

-   **Method**: `DELETE`
-   **URL**: `/api/meal-plans/{planId}`
-   **Description**: Deletes a user's meal plan and all associated meals and shopping lists.
-   **Response Body (Success)**: (No content)
-   **Success Code**: `204 No Content`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: No meal plan found with the given ID for this user.

### Meal Endpoints

---

#### **Regenerate Single Meal (AI)**

-   **Method**: `POST`
-   **URL**: `/api/meals/regenerate`
-   **Description**: Generates a new recipe for a single meal within a plan without affecting other meals. The regenerated meal is created based on the existing meals for that day to maintain appropriate calorie distribution.
-   **Request Body**:
    ```json
    {
      "planInput": {
        // ... original plan input used for context
      },
      "mealToRegenerate": {
        "day": 1,
        "type": "dinner"
      },
      "existingMealsForDay": [
        {
          "type": "breakfast",
          "recipe": {
            "name": "Scrambled Eggs with Spinach",
            "portions": [
              { "person": 1, "grams": 250 },
              { "person": 2, "grams": 210 }
            ]
          }
        },
        {
          "type": "lunch",
          "recipe": {
            "name": "Chicken Salad",
            "portions": [
              { "person": 1, "grams": 300 },
              { "person": 2, "grams": 250 }
            ]
          }
        }
      ]
    }
    ```
-   **Response Body (Success)**:
    ```json
    {
      "day": 1,
      "type": "dinner",
      "recipe": {
        "name": "New Chicken Alfredo",
        // ... full new recipe
      }
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input data.
    -   `500 Internal Server Error`: AI service failed.

### Shopping List Endpoints

---

#### **Generate Shopping List (AI)**

-   **Method**: `POST`
-   **URL**: `/api/meal-plans/{planId}/shopping-list`
-   **Description**: Creates a shopping list for an existing meal plan. It fetches all meals for the plan, sends them to the AI for aggregation and categorization, saves the result to the database, and returns it.
-   **Request Body**: (No body, `planId` from URL)
-   **Response Body (Success)**:
    ```json
    {
      "id": "uuid-shopping-list",
      "planId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "listContent": {
        "Vegetables": [
          { "item": "Onion", "quantity": "2 large" }
        ],
        "Dairy": [
          { "item": "Milk", "quantity": "1 liter" }
        ]
        // ... other categories
      }
    }
    ```
-   **Success Code**: `201 Created`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: The specified `planId` does not exist for the user.
    -   `409 Conflict`: A shopping list for this plan already exists.
    -   `500 Internal Server Error`: AI service failed.

## 3. Validation and Business Logic

-   **Validation**:
    -   API endpoints validate incoming request bodies to ensure all `NOT NULL` fields (e.g., `plan_input`, `recipe_data`, `list_content`) are present and correctly structured before processing.
    -   Input data for AI generation (e.g., calorie targets, counts) will be validated for sensible ranges.
-   **Business Logic**:
    -   **AI Interaction**: Endpoints suffixed with `(AI)` (e.g., `/api/meal-plans/generate`) encapsulate all communication with the `openrouter.ai` service. They are responsible for formatting the prompts and parsing the AI's response.
    -   **Transactional Integrity**: The `POST /api/meal-plans` endpoint must use a database transaction to ensure that the `meal_plans` record and all its associated `meals` records are created atomically. If any part of the insertion fails, the entire transaction should be rolled back.
    -   **State Management**: The API is designed to be stateless. The client is responsible for holding the state of a generated-but-not-yet-saved meal plan.
