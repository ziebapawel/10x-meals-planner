import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Meal Plan History Page
 * Represents the homepage with meal plans list (visible after login)
 */
export class MealPlanHistoryPage {
  readonly page: Page;

  // Main container locators
  readonly historyView: Locator;
  readonly historyTitle: Locator;
  readonly createNewPlanButton: Locator;
  readonly plansGrid: Locator;

  // Empty state locators
  readonly emptyStateTitle: Locator;
  readonly createFirstPlanButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize main locators
    this.historyView = page.getByTestId("meal-plan-history-view");
    this.historyTitle = page.getByTestId("meal-plan-history-title");
    this.createNewPlanButton = page.getByTestId("create-new-plan-button");
    this.plansGrid = page.getByTestId("meal-plans-grid");

    // Initialize empty state locators
    this.emptyStateTitle = page.getByTestId("empty-state-title");
    this.createFirstPlanButton = page.getByTestId("create-first-plan-button");
  }

  /**
   * Navigate to the meal plan history page (homepage)
   */
  async goto() {
    await this.page.goto("/");
  }

  /**
   * Check if the history view is visible
   * @returns true if the history view is displayed
   */
  async isHistoryViewVisible(): Promise<boolean> {
    return await this.historyView.isVisible();
  }

  /**
   * Check if the page is in empty state (no plans)
   * @returns true if empty state is displayed
   */
  async isEmptyState(): Promise<boolean> {
    try {
      return await this.emptyStateTitle.isVisible({ timeout: 30000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if plans grid is visible (has plans)
   * @returns true if plans grid is displayed
   */
  async hasPlans(): Promise<boolean> {
    try {
      return await this.plansGrid.isVisible({ timeout: 30000 });
    } catch {
      return false;
    }
  }

  /**
   * Get the title text
   * @returns Title text or null if not visible
   */
  async getTitleText(): Promise<string | null> {
    if (await this.historyTitle.isVisible()) {
      return await this.historyTitle.textContent();
    }
    return null;
  }

  /**
   * Get the empty state title text
   * @returns Empty state title text or null if not visible
   */
  async getEmptyStateTitleText(): Promise<string | null> {
    if (await this.emptyStateTitle.isVisible()) {
      return await this.emptyStateTitle.textContent();
    }
    return null;
  }

  /**
   * Click the "Create New Plan" button (when plans exist)
   */
  async clickCreateNewPlan() {
    await this.createNewPlanButton.click();
  }

  /**
   * Click the "Create First Plan" button (when no plans exist)
   */
  async clickCreateFirstPlan() {
    await this.createFirstPlanButton.click();
  }

  /**
   * Get a meal plan card by its ID
   * @param planId - The plan ID
   * @returns Locator for the specific plan card
   */
  getMealPlanCard(planId: string): Locator {
    return this.page.getByTestId(`meal-plan-card-${planId}`);
  }

  /**
   * Click on a specific meal plan card
   * @param planId - The plan ID to click
   */
  async clickMealPlanCard(planId: string) {
    await this.getMealPlanCard(planId).click();
  }

  /**
   * Get all visible meal plan cards
   * @returns Array of all meal plan card locators
   */
  async getAllMealPlanCards(): Promise<Locator[]> {
    const cards = await this.page.getByTestId(/^meal-plan-card-/).all();
    return cards;
  }

  /**
   * Get the count of visible meal plan cards
   * @returns Number of meal plan cards
   */
  async getMealPlanCardsCount(): Promise<number> {
    const cards = await this.getAllMealPlanCards();
    return cards.length;
  }

  /**
   * Wait for the history view to be loaded
   */
  async waitForHistoryViewLoaded() {
    await this.historyView.waitFor({ state: "visible" });
  }

  /**
   * Wait for plans grid to be loaded
   */
  async waitForPlansGridLoaded() {
    await this.plansGrid.waitFor({ state: "visible" });
  }

  /**
   * Check if a specific meal plan card exists
   * @param planId - The plan ID to check
   * @returns true if the card exists
   */
  async hasMealPlanCard(planId: string): Promise<boolean> {
    try {
      return await this.getMealPlanCard(planId).isVisible({ timeout: 30000 });
    } catch {
      return false;
    }
  }

  /**
   * Navigate to create new plan page
   * Handles both empty state and regular state
   */
  async navigateToCreatePlan() {
    const isEmpty = await this.isEmptyState();
    if (isEmpty) {
      await this.clickCreateFirstPlan();
    } else {
      await this.clickCreateNewPlan();
    }
    // Wait for navigation to /generate
    await this.page.waitForURL("/generate");
  }
}
