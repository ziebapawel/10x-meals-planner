import { z } from "zod";

/**
 * Validation Schemas
 * Contains all Zod schemas for validating API requests
 */

/**
 * Schema for generating a meal plan
 */
export const GenerateMealPlanCommandSchema = z.object({
  peopleCount: z.number().int().min(1).max(20),
  daysCount: z.number().int().min(1).max(14),
  cuisine: z.string().min(1).max(100),
  excludedIngredients: z.array(z.string()).default([]),
  calorieTargets: z.array(
    z.object({
      person: z.number().int().min(1),
      calories: z.number().int().min(500).max(5000),
    })
  ),
  mealsToPlan: z.array(z.string().min(1)).min(1),
});

/**
 * Schema for creating a meal plan
 */
export const CreateMealPlanCommandSchema = z.object({
  planInput: GenerateMealPlanCommandSchema,
  meals: z
    .array(
      z.object({
        day: z.number().int().min(1),
        type: z.string().min(1),
        recipeData: z.object({
          name: z.string().min(1),
          ingredients: z.array(
            z.object({
              item: z.string(),
              quantity: z.string(),
            })
          ),
          instructions: z.array(z.string()),
          portions: z.array(
            z.object({
              person: z.number().int().min(1),
              grams: z.number().int().min(1),
            })
          ),
        }),
      })
    )
    .min(1),
});

/**
 * Schema for regenerating a single meal
 */
export const RegenerateMealCommandSchema = z.object({
  planInput: GenerateMealPlanCommandSchema,
  mealToRegenerate: z.object({
    day: z.number().int().min(1),
    type: z.string().min(1),
  }),
  existingMealsForDay: z.array(
    z.object({
      type: z.string(),
      recipe: z.object({
        name: z.string(),
        portions: z.array(
          z.object({
            person: z.number().int(),
            grams: z.number().int(),
          })
        ),
      }),
    })
  ),
});

/**
 * Schema for pagination query parameters
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Schema for UUID parameter validation
 */
export const UUIDParamSchema = z.string().uuid();
