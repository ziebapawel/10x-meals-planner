import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Plan Generation Page
 * Represents the meal plan generation page at /generate
 */
export class PlanGenerationPage {
  readonly page: Page;

  // Form locators
  readonly planGenerationForm: Locator;
  readonly peopleCountInput: Locator;
  readonly daysCountInput: Locator;
  readonly cuisineSelect: Locator;
  readonly mealsToPlancheckboxes: Locator;
  readonly calorieTargetsInputs: Locator;
  readonly excludedIngredientInput: Locator;
  readonly addExcludedIngredientButton: Locator;
  readonly excludedIngredientsList: Locator;
  readonly generatePlanSubmitButton: Locator;

  // State locators
  readonly loadingState: Locator;
  readonly emptyState: Locator;
  readonly savePlanButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize form locators
    this.planGenerationForm = page.getByTestId('plan-generation-form');
    this.peopleCountInput = page.getByTestId('people-count-input');
    this.daysCountInput = page.getByTestId('days-count-input');
    this.cuisineSelect = page.getByTestId('cuisine-select');
    this.mealsToPlancheckboxes = page.getByTestId('meals-to-plan-checkboxes');
    this.calorieTargetsInputs = page.getByTestId('calorie-targets-inputs');
    this.excludedIngredientInput = page.getByTestId('excluded-ingredient-input');
    this.addExcludedIngredientButton = page.getByTestId('add-excluded-ingredient-button');
    this.excludedIngredientsList = page.getByTestId('excluded-ingredients-list');
    this.generatePlanSubmitButton = page.getByTestId('generate-plan-submit-button');

    // Initialize state locators
    this.loadingState = page.getByTestId('plan-generation-loading-state');
    this.emptyState = page.getByTestId('plan-generation-empty-state');
    this.savePlanButton = page.getByTestId('save-plan-button');
  }

  /**
   * Navigate to the plan generation page
   */
  async goto() {
    await this.page.goto('/generate');
  }

  /**
   * Check if the form is visible
   * @returns true if form is displayed
   */
  async isFormVisible(): Promise<boolean> {
    return await this.planGenerationForm.isVisible();
  }

  /**
   * Fill the people count input
   * @param count - Number of people (1-20)
   */
  async fillPeopleCount(count: number) {
    await this.peopleCountInput.fill(count.toString());
  }

  /**
   * Fill the days count input
   * @param days - Number of days (1-14)
   */
  async fillDaysCount(days: number) {
    await this.daysCountInput.fill(days.toString());
  }

  /**
   * Select a cuisine from the dropdown
   * @param cuisine - Cuisine name (e.g., "Polska", "Włoska")
   */
  async selectCuisine(cuisine: string) {
    await this.cuisineSelect.selectOption(cuisine);
  }

  /**
   * Toggle a meal type checkbox
   * @param mealId - Meal ID (e.g., "śniadanie", "obiad", "kolacja", "przekąska")
   */
  async toggleMealType(mealId: string) {
    const checkbox = this.page.getByTestId(`meal-checkbox-${mealId}`);
    await checkbox.click();
  }

  /**
   * Check a specific meal type
   * @param mealId - Meal ID to check
   */
  async checkMealType(mealId: string) {
    const checkbox = this.page.getByTestId(`meal-checkbox-${mealId}`);
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      await checkbox.click();
    }
  }

  /**
   * Uncheck a specific meal type
   * @param mealId - Meal ID to uncheck
   */
  async uncheckMealType(mealId: string) {
    const checkbox = this.page.getByTestId(`meal-checkbox-${mealId}`);
    const isChecked = await checkbox.isChecked();
    if (isChecked) {
      await checkbox.click();
    }
  }

  /**
   * Check if a meal type is checked
   * @param mealId - Meal ID to check
   * @returns true if the meal checkbox is checked
   */
  async isMealTypeChecked(mealId: string): Promise<boolean> {
    const checkbox = this.page.getByTestId(`meal-checkbox-${mealId}`);
    return await checkbox.isChecked();
  }

  /**
   * Fill calorie target for a specific person
   * @param personIndex - Person index (0-based)
   * @param calories - Calorie target (500-5000)
   */
  async fillCalorieTarget(personIndex: number, calories: number) {
    const input = this.page.getByTestId(`calorie-target-input-${personIndex}`);
    await input.fill(calories.toString());
  }

  /**
   * Add an excluded ingredient
   * @param ingredient - Ingredient name to exclude
   */
  async addExcludedIngredient(ingredient: string) {
    await this.excludedIngredientInput.fill(ingredient);
    await this.addExcludedIngredientButton.click();
  }

  /**
   * Add an excluded ingredient by pressing Enter
   * @param ingredient - Ingredient name to exclude
   */
  async addExcludedIngredientWithEnter(ingredient: string) {
    await this.excludedIngredientInput.fill(ingredient);
    await this.excludedIngredientInput.press('Enter');
  }

  /**
   * Remove an excluded ingredient by index
   * @param index - Index of the ingredient to remove (0-based)
   */
  async removeExcludedIngredient(index: number) {
    const removeButton = this.page.getByTestId(`remove-excluded-ingredient-${index}`);
    await removeButton.click();
  }

  /**
   * Get an excluded ingredient element by index
   * @param index - Index of the ingredient (0-based)
   * @returns Locator for the ingredient element
   */
  getExcludedIngredient(index: number): Locator {
    return this.page.getByTestId(`excluded-ingredient-${index}`);
  }

  /**
   * Check if excluded ingredients list is visible
   * @returns true if the list is visible
   */
  async hasExcludedIngredients(): Promise<boolean> {
    try {
      return await this.excludedIngredientsList.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Get the count of excluded ingredients
   * @returns Number of excluded ingredients
   */
  async getExcludedIngredientsCount(): Promise<number> {
    if (!(await this.hasExcludedIngredients())) {
      return 0;
    }
    const ingredients = await this.page.getByTestId(/^excluded-ingredient-\d+$/).all();
    return ingredients.length;
  }

  /**
   * Click the generate plan submit button
   */
  async clickGeneratePlan() {
    await this.generatePlanSubmitButton.click();
  }

  /**
   * Check if submit button is disabled
   * @returns true if submit button is disabled
   */
  async isGenerateButtonDisabled(): Promise<boolean> {
    return await this.generatePlanSubmitButton.isDisabled();
  }

  /**
   * Check if the loading state is visible
   * @returns true if loading state is displayed
   */
  async isLoadingStateVisible(): Promise<boolean> {
    try {
      return await this.loadingState.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the empty state is visible
   * @returns true if empty state is displayed
   */
  async isEmptyStateVisible(): Promise<boolean> {
    try {
      return await this.emptyState.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if the save plan button is visible
   * @returns true if save button is displayed
   */
  async isSavePlanButtonVisible(): Promise<boolean> {
    try {
      return await this.savePlanButton.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Click the save plan button
   */
  async clickSavePlan() {
    await this.savePlanButton.click();
  }

  /**
   * Wait for plan generation to complete
   * @param timeout - Maximum time to wait in milliseconds (default: 5 minutes)
   */
  async waitForPlanGeneration(timeout: number = 300000) {
    // Wait for loading state to appear
    await this.loadingState.waitFor({ state: 'visible', timeout: 5000 });

    // Wait for save button to appear (plan generated)
    await this.savePlanButton.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for form to be visible
   */
  async waitForFormVisible() {
    await this.planGenerationForm.waitFor({ state: 'visible' });
  }

  /**
   * Fill complete form with basic plan data
   * @param options - Plan generation options
   */
  async fillBasicPlanForm(options: {
    peopleCount: number;
    daysCount: number;
    cuisine: string;
    mealTypes: string[];
    calorieTargets?: number[];
    excludedIngredients?: string[];
  }) {
    // Fill basic inputs
    await this.fillPeopleCount(options.peopleCount);
    await this.fillDaysCount(options.daysCount);
    await this.selectCuisine(options.cuisine);

    // Select meal types
    for (const mealType of options.mealTypes) {
      await this.checkMealType(mealType);
    }

    // Fill calorie targets if provided
    if (options.calorieTargets) {
      for (let i = 0; i < options.calorieTargets.length; i++) {
        await this.fillCalorieTarget(i, options.calorieTargets[i]);
      }
    }

    // Add excluded ingredients if provided
    if (options.excludedIngredients) {
      for (const ingredient of options.excludedIngredients) {
        await this.addExcludedIngredient(ingredient);
      }
    }
  }

  /**
   * Complete workflow: fill form, generate plan, and wait for completion
   * @param options - Plan generation options
   */
  async generatePlan(options: {
    peopleCount: number;
    daysCount: number;
    cuisine: string;
    mealTypes: string[];
    calorieTargets?: number[];
    excludedIngredients?: string[];
  }) {
    await this.fillBasicPlanForm(options);
    await this.clickGeneratePlan();
    await this.waitForPlanGeneration();
  }

  /**
   * Complete workflow: generate plan and save it
   * @param options - Plan generation options
   * @returns Promise that resolves when redirected to plan detail page
   */
  async generateAndSavePlan(options: {
    peopleCount: number;
    daysCount: number;
    cuisine: string;
    mealTypes: string[];
    calorieTargets?: number[];
    excludedIngredients?: string[];
  }) {
    await this.generatePlan(options);
    await this.clickSavePlan();

    // Wait for redirect to plan detail page
    await this.page.waitForURL(/\/plans\/.+/);
  }
}
