import { test, expect } from '@playwright/test';
import { LoginPage, MealPlanHistoryPage } from './page-objects';

/**
 * Authentication - Login Flow Tests
 *
 * Tests the user login functionality using Page Object Model pattern.
 * Follows the Arrange-Act-Assert structure for clarity.
 */

test.describe('Login Flow', () => {
  let loginPage: LoginPage;
  let historyPage: MealPlanHistoryPage;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page objects
    loginPage = new LoginPage(page);
    historyPage = new MealPlanHistoryPage(page);
  });

  test('should display login form on /login page', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();

    // Wait for React component hydration
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Assert: Login form should be visible
    await expect(loginPage.loginForm).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Act: Fill in login credentials and submit
    const testEmail = process.env.E2E_USERNAME!;
    const testPassword = process.env.E2E_PASSWORD!;

    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.clickSubmit();

    // Assert: Should redirect to homepage (meal plans list)
    await expect(page).toHaveURL('/');
    await expect(historyPage.historyView).toBeVisible();

    // Assert: Should display the meal plan history title
    const titleText = await historyPage.getEmptyStateTitleText();
    expect(titleText).toContain('Brak planów posiłków');
  });

  test('should display error message with invalid credentials', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Act: Fill in invalid credentials and submit
    const invalidEmail = 'invalid@example.com';
    const invalidPassword = 'wrongpassword';

    await loginPage.fillEmail(invalidEmail);
    await loginPage.fillPassword(invalidPassword);

    // Wait for the API response
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login') && response.status() === 401
    );
    await loginPage.clickSubmit();
    await responsePromise;

    // Assert: Error message should be displayed
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10000 });

    // Assert: Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to register page when clicking register link', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Act: Click on the register link
    await loginPage.clickRegister();

    // Assert: Should navigate to register page
    await expect(page).toHaveURL('/register');
  });

  test('should navigate to forgot password page when clicking forgot password link', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Act: Click on the forgot password link
    await loginPage.clickForgotPassword();

    // Assert: Should navigate to forgot password page
    await expect(page).toHaveURL('/forgot-password');
  });

  test('should disable submit button while loading', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Slow down network to catch the loading state
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Act: Fill in credentials
    const testEmail = process.env.E2E_USERNAME!;
    const testPassword = process.env.E2E_PASSWORD!;

    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);

    // Act: Start form submission (don't await to check loading state)
    const submitPromise = loginPage.submitButton.click();

    // Assert: Submit button should be disabled during loading
    await expect(loginPage.submitButton).toBeDisabled();

    // Wait for submission to complete
    await submitPromise;
  });

  test('complete login flow - from login to meal plans view', async ({ page }) => {
    // Arrange: Navigate to login page
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await loginPage.waitForFormVisible();

    // Act: Perform complete login
    const testEmail = process.env.E2E_USERNAME!;
    const testPassword = process.env.E2E_PASSWORD!;

    await loginPage.login(testEmail, testPassword);

    // Assert: Should navigate to homepage
    await expect(page).toHaveURL('/');

    // Assert: Meal plan history view should be loaded
    await historyPage.waitForHistoryViewLoaded();
    await expect(historyPage.historyView).toBeVisible();

    // Assert: Should display either empty state or plans grid
    const isEmpty = await historyPage.isEmptyState();
    const hasPlans = await historyPage.hasPlans();

    expect(isEmpty || hasPlans).toBeTruthy();

    if (isEmpty) {
      // If no plans, verify empty state
      await expect(historyPage.emptyStateTitle).toBeVisible();
      await expect(historyPage.createFirstPlanButton).toBeVisible();
    } else {
      // If has plans, verify plans grid
      await expect(historyPage.plansGrid).toBeVisible();
      await expect(historyPage.createNewPlanButton).toBeVisible();
    }
  });
});
