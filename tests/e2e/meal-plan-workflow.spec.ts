import { test, expect } from "@playwright/test";
import { LoginPage, MealPlanHistoryPage, PlanGenerationPage, MealPlanDetailPage } from "./page-objects";

/**
 * Complete Meal Plan Workflow Tests
 *
 * Tests the full user journey from login to plan generation and saving.
 * Scenario:
 * 1. User logs in
 * 2. Clicks button to add new plan
 * 3. Navigates to plan generation page
 * 4. Fills in plan data
 * 5. Clicks generate plan button
 * 6. Waits for plan generation (can take up to 5 minutes)
 * 7. Saves the generated plan
 * 8. Generated plan appears in the plans list
 */

test.describe("Complete Meal Plan Workflow", () => {
  let loginPage: LoginPage;
  let historyPage: MealPlanHistoryPage;
  let generationPage: PlanGenerationPage;
  let detailPage: MealPlanDetailPage;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize all page objects
    loginPage = new LoginPage(page);
    historyPage = new MealPlanHistoryPage(page);
    generationPage = new PlanGenerationPage(page);
    detailPage = new MealPlanDetailPage(page);
  });

  test("should complete full workflow: login → create plan → generate → save → verify", async ({ page }) => {
    // Test timeout extended to 6 minutes (plan generation can take up to 5 minutes)
    test.setTimeout(360000);

    // ========================================
    // STEP 1: User logs in
    // ========================================
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState("networkidle");
    await loginPage.waitForFormVisible();

    // Act: Perform login
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
    }

    await loginPage.login(testEmail, testPassword);
    await page.waitForLoadState("networkidle");

    // Assert: Should redirect to homepage
    await expect(page).toHaveURL("/");
    await expect(historyPage.historyView).toBeVisible();

    // ========================================
    // STEP 2 & 3: Click to add new plan and navigate to generation page
    // ========================================
    // Act: Navigate to plan generation
    await historyPage.navigateToCreatePlan();

    // Assert: Should be on generation page
    await expect(page).toHaveURL("/generate");
    await expect(generationPage.planGenerationForm).toBeVisible();
    await page.waitForTimeout(3000);

    // ========================================
    // STEP 4: Fill in plan data
    // ========================================
    // Arrange: Define plan parameters
    const planData = {
      peopleCount: 2,
      daysCount: 7,
      cuisine: "Polska",
      mealTypes: ["śniadanie", "obiad", "kolacja"],
      calorieTargets: [2000, 1800],
      excludedIngredients: ["mleko", "orzechy"],
    };

    // Act: Fill form with plan data
    await generationPage.fillPeopleCount(planData.peopleCount);
    await generationPage.fillDaysCount(planData.daysCount);
    await generationPage.selectCuisine(planData.cuisine);

    await page.waitForTimeout(1000);

    // Select meal types
    for (const mealType of planData.mealTypes) {
      await generationPage.checkMealType(mealType);
    }

    await page.waitForTimeout(1000);

    // Fill calorie targets
    for (let i = 0; i < planData.calorieTargets.length; i++) {
      await generationPage.fillCalorieTarget(i, planData.calorieTargets[i]);
    }

    await page.waitForTimeout(1000);

    // Add excluded ingredients
    for (const ingredient of planData.excludedIngredients) {
      await generationPage.addExcludedIngredient(ingredient);
    }

    await page.waitForTimeout(1000);

    // Assert: Form should be filled correctly
    await expect(generationPage.peopleCountInput).toHaveValue(planData.peopleCount.toString());
    await expect(generationPage.daysCountInput).toHaveValue(planData.daysCount.toString());
    await expect(generationPage.cuisineSelect).toHaveValue(planData.cuisine);

    // Verify excluded ingredients were added
    const excludedCount = await generationPage.getExcludedIngredientsCount();
    expect(excludedCount).toBe(planData.excludedIngredients.length);

    // ========================================
    // STEP 5: Click generate plan button
    // ========================================
    // Act: Submit the form to generate plan
    await generationPage.clickGeneratePlan();

    // Assert: Loading state should appear
    await expect(generationPage.loadingState).toBeVisible({ timeout: 5000 });

    // ========================================
    // STEP 6: Wait for plan generation (up to 5 minutes)
    // ========================================
    // Act: Wait for plan to be generated
    await generationPage.waitForPlanGeneration(300000); // 5 minutes timeout

    // Assert: Save button should be visible (plan generated successfully)
    await expect(generationPage.savePlanButton).toBeVisible();

    // Assert: Loading state should be hidden
    await expect(generationPage.loadingState).not.toBeVisible();

    // ========================================
    // STEP 7: Save the generated plan
    // ========================================
    // Act: Click save plan button
    await generationPage.clickSavePlan();

    // Assert: Should redirect to plan detail page
    await page.waitForURL(/\/plans\/.+/, { timeout: 10000 });
    expect(detailPage.isOnDetailPage()).toBeTruthy();

    // Assert: Plan detail view should be visible
    await expect(detailPage.detailView).toBeVisible();

    // Get the plan ID from URL
    const planId = detailPage.getPlanIdFromUrl();
    expect(planId).not.toBeNull();

    // ========================================
    // STEP 8: Verify plan appears in the plans list
    // ========================================
    // Act: Navigate back to plans list
    await detailPage.navigateBackToPlans();

    // Assert: Should be on homepage
    await expect(page).toHaveURL("/");

    // Assert: Plans grid should be visible (no longer empty state)
    await historyPage.waitForPlansGridLoaded();
    await expect(historyPage.plansGrid).toBeVisible();

    // Assert: The newly created plan should exist in the list
    if (!planId) {
      throw new Error("Plan ID is null");
    }

    const hasPlan = await historyPage.hasMealPlanCard(planId);
    expect(hasPlan).toBeTruthy();

    // Assert: Should be able to click on the plan card
    const planCard = historyPage.getMealPlanCard(planId);
    await expect(planCard).toBeVisible();
  });

  test("should allow adding and removing excluded ingredients", async ({ page }) => {
    // Arrange: Login and navigate to generation page
    await loginPage.goto();
    await page.waitForLoadState("networkidle");
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
    }

    await loginPage.loginAndWaitForNavigation(testEmail, testPassword);
    await page.waitForLoadState("networkidle");
    await historyPage.navigateToCreatePlan();
    await expect(generationPage.planGenerationForm).toBeVisible();

    // Act: Add first ingredient
    await generationPage.addExcludedIngredient("gluten");

    // Assert: Should have 1 ingredient
    let count = await generationPage.getExcludedIngredientsCount();
    expect(count).toBe(1);

    // Act: Add second ingredient using Enter key
    await generationPage.addExcludedIngredient("laktoza");

    // Assert: Should have 2 ingredients
    count = await generationPage.getExcludedIngredientsCount();
    expect(count).toBe(2);

    // Assert: Both ingredients should be visible
    await expect(generationPage.getExcludedIngredient(0)).toBeVisible();
    await expect(generationPage.getExcludedIngredient(1)).toBeVisible();

    // Act: Remove first ingredient
    await generationPage.removeExcludedIngredient(0);

    // Assert: Should have 1 ingredient left
    count = await generationPage.getExcludedIngredientsCount();
    expect(count).toBe(1);
  });

  test("should update calorie inputs when people count changes", async ({ page }) => {
    // Arrange: Login and navigate to generation page
    await loginPage.goto();
    await page.waitForLoadState("networkidle");
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
    }

    await loginPage.loginAndWaitForNavigation(testEmail, testPassword);
    await page.waitForLoadState("networkidle");
    await historyPage.navigateToCreatePlan();
    await expect(generationPage.planGenerationForm).toBeVisible();

    // Act: Set people count to 1
    await generationPage.fillPeopleCount(1);

    await page.waitForTimeout(1000);

    // Assert: Should have 1 calorie input
    await expect(page.getByTestId("calorie-target-input-0")).toBeVisible();

    // Act: Change people count to 3
    await generationPage.fillPeopleCount(3);

    // Wait for React to update the DOM
    await page.waitForTimeout(1000);

    // Assert: Should have 3 calorie inputs
    await expect(page.getByTestId("calorie-target-input-0")).toBeVisible();
    await expect(page.getByTestId("calorie-target-input-1")).toBeVisible();
    await expect(page.getByTestId("calorie-target-input-2")).toBeVisible();
  });

  test("should check and uncheck meal types", async ({ page }) => {
    // Arrange: Login and navigate to generation page
    await loginPage.goto();
    await page.waitForLoadState("networkidle");
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
    }

    await loginPage.loginAndWaitForNavigation(testEmail, testPassword);
    await page.waitForLoadState("networkidle");
    await historyPage.navigateToCreatePlan();
    await expect(generationPage.planGenerationForm).toBeVisible();

    // Act: Check breakfast
    await generationPage.checkMealType("śniadanie");

    // Assert: Breakfast should be checked
    let isChecked = await generationPage.isMealTypeChecked("śniadanie");
    expect(isChecked).toBeTruthy();

    // Act: Check lunch
    await generationPage.checkMealType("obiad");

    // Assert: Lunch should be checked
    isChecked = await generationPage.isMealTypeChecked("obiad");
    expect(isChecked).toBeTruthy();

    // Act: Uncheck breakfast
    await generationPage.uncheckMealType("śniadanie");

    // Assert: Breakfast should be unchecked
    isChecked = await generationPage.isMealTypeChecked("śniadanie");
    expect(isChecked).toBeFalsy();

    // Assert: Lunch should still be checked
    isChecked = await generationPage.isMealTypeChecked("obiad");
    expect(isChecked).toBeTruthy();
  });

  test("should navigate back to plans list from generation page", async ({ page }) => {
    // Arrange: Login and navigate to generation page
    await loginPage.goto();
    await page.waitForLoadState("networkidle");
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required");
    }

    await loginPage.loginAndWaitForNavigation(testEmail, testPassword);
    await page.waitForLoadState("networkidle");
    await historyPage.navigateToCreatePlan();
    await expect(generationPage.planGenerationForm).toBeVisible();

    // Act: Navigate back using browser back button
    await page.goBack();

    // Assert: Should be back on homepage
    await expect(page).toHaveURL("/");
    await expect(historyPage.historyView).toBeVisible();
  });
});
