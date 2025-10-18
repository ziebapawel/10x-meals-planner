import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Meal Plan Detail Page
 * Represents the meal plan detail page at /plans/[planId]
 */
export class MealPlanDetailPage {
  readonly page: Page;

  // Main container locator
  readonly detailView: Locator;

  // Header action locators
  readonly backToPlansButton: Locator;
  readonly deletePlanButton: Locator;

  // Shopping list locators
  readonly generateShoppingListButton: Locator;
  readonly shoppingListCard: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize main locators
    this.detailView = page.getByTestId("meal-plan-detail-view");
    this.backToPlansButton = page.getByTestId("back-to-plans-button");
    this.deletePlanButton = page.getByTestId("delete-plan-button");
    this.generateShoppingListButton = page.getByTestId("generate-shopping-list-button");
    this.shoppingListCard = page.getByTestId("shopping-list-card");
  }

  /**
   * Navigate to a specific meal plan detail page
   * @param planId - The plan ID
   */
  async goto(planId: string) {
    await this.page.goto(`/plans/${planId}`);
  }

  /**
   * Check if the detail view is visible
   * @returns true if the detail view is displayed
   */
  async isDetailViewVisible(): Promise<boolean> {
    return await this.detailView.isVisible();
  }

  /**
   * Click the back to plans button
   */
  async clickBackToPlans() {
    await this.backToPlansButton.click();
  }

  /**
   * Click the delete plan button
   * Note: This will trigger a confirmation dialog
   */
  async clickDeletePlan() {
    await this.deletePlanButton.click();
  }

  /**
   * Delete the plan and confirm the dialog
   * @param confirm - Whether to confirm deletion (default: true)
   */
  async deletePlan(confirm = true) {
    // Set up dialog handler before clicking
    this.page.once("dialog", async (dialog) => {
      if (confirm) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });

    await this.clickDeletePlan();

    // If confirmed, wait for navigation to homepage
    if (confirm) {
      await this.page.waitForURL("/");
    }
  }

  /**
   * Check if delete button is disabled
   * @returns true if delete button is disabled
   */
  async isDeleteButtonDisabled(): Promise<boolean> {
    return await this.deletePlanButton.isDisabled();
  }

  /**
   * Check if generate shopping list button is visible
   * @returns true if button is visible
   */
  async isGenerateShoppingListButtonVisible(): Promise<boolean> {
    try {
      return await this.generateShoppingListButton.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Click the generate shopping list button
   */
  async clickGenerateShoppingList() {
    await this.generateShoppingListButton.click();
  }

  /**
   * Wait for shopping list to be generated
   * @param timeout - Maximum time to wait in milliseconds (default: 60 seconds)
   */
  async waitForShoppingListGenerated(timeout = 60000) {
    await this.shoppingListCard.waitFor({ state: "visible", timeout });
  }

  /**
   * Generate shopping list and wait for completion
   */
  async generateShoppingList() {
    await this.clickGenerateShoppingList();
    await this.waitForShoppingListGenerated();
  }

  /**
   * Check if shopping list is visible
   * @returns true if shopping list card is displayed
   */
  async hasShoppingList(): Promise<boolean> {
    try {
      return await this.shoppingListCard.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Navigate back to plans list
   */
  async navigateBackToPlans() {
    await this.clickBackToPlans();
    await this.page.waitForURL("/");
  }

  /**
   * Wait for the detail view to be loaded
   */
  async waitForDetailViewLoaded() {
    await this.detailView.waitFor({ state: "visible" });
  }

  /**
   * Get the current plan ID from the URL
   * @returns Plan ID or null if not on detail page
   */
  getPlanIdFromUrl(): string | null {
    const match = this.page.url().match(/\/plans\/([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if currently on a plan detail page
   * @returns true if on detail page
   */
  isOnDetailPage(): boolean {
    return /\/plans\/.+/.test(this.page.url());
  }
}
