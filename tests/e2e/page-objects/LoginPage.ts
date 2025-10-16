import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * Represents the login page at /login
 */
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators using data-test-id attributes
    this.loginForm = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByTestId('login-error-message');
    this.forgotPasswordLink = page.getByTestId('login-forgot-password-link');
    this.registerLink = page.getByTestId('login-register-link');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Fill the email input field
   * @param email - Email address to fill
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill the password input field
   * @param password - Password to fill
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click the submit button to login
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Perform complete login flow
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Check if error message is visible
   * @returns true if error message is displayed
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   * @returns Error message text
   */
  async getErrorMessageText(): Promise<string | null> {
    if (await this.isErrorMessageVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Click the "Forgot Password" link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click the "Register" link
   */
  async clickRegister() {
    await this.registerLink.click();
  }

  /**
   * Check if submit button is disabled
   * @returns true if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for the form to be visible
   */
  async waitForFormVisible() {
    await this.loginForm.waitFor({ state: 'visible' });
  }

  /**
   * Complete login and wait for navigation
   * @param email - User email
   * @param password - User password
   */
  async loginAndWaitForNavigation(email: string, password: string) {
    await this.login(email, password);
    // Wait for navigation to complete (redirect to homepage)
    await this.page.waitForURL('/');
  }
}
