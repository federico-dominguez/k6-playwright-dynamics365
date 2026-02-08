/**
 * Login Page Object for Dynamics 365
 *
 * Handles Microsoft OAuth authentication flow for Dynamics 365.
 * Implements the Page Object Model pattern for maintainable browser testing.
 *
 * @module lib/pages/login
 */

import BasePage from './base.page';

export class LoginPage extends BasePage {
  /**
   * Microsoft OAuth and D365 UI selectors
   * @private
   */
  private selectors = {
    // Microsoft OAuth login selectors
    emailInput: 'input[type="email"][name="loginfmt"]',
    nextButton: 'input[type="submit"][value="Next"]',
    passwordInput: 'input[type="password"][name="passwd"]',
    signInButton: 'input[type="submit"][value="Sign in"]',
    staySignedInYes: '#idSIButton9',
    staySignedInNo: '#idBtn_Back',
    // D365 application selectors
    d365AppTile: '#topBar',
    loadingSpinner: '[data-id="loading"]',
  };

  /**
   * Complete Microsoft OAuth login flow for Dynamics 365
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {boolean} staySignedIn - Whether to stay signed in (default: false)
   * @returns {Promise<void>}
   */
  async login(email: string, password: string, staySignedIn: boolean = false): Promise<void> {
    // Step 1: Enter email
    await this.waitForSelector(this.selectors.emailInput);
    await this.fill(this.selectors.emailInput, email);
    await this.click(this.selectors.nextButton);
    await this.page.waitForTimeout(2000);

    // Step 2: Enter password
    await this.waitForSelector(this.selectors.passwordInput);
    await this.fill(this.selectors.passwordInput, password);
    await this.click(this.selectors.signInButton);
    await this.page.waitForTimeout(2000);

    // Step 3: Handle "Stay signed in?" prompt (optional)
    try {
      const staySignedInPrompt = this.page.locator(this.selectors.staySignedInNo);
      await staySignedInPrompt.waitFor({ state: 'visible', timeout: 10000 });

      const buttonSelector = staySignedIn
        ? this.selectors.staySignedInYes
        : this.selectors.staySignedInNo;
      await this.click(buttonSelector);
      await this.page.waitForTimeout(2000);
    } catch (error) {
      // Prompt did not appear - this is normal in some scenarios
    }

    // Step 4: Wait for Dynamics 365 navigation to appear
    const topBar = this.page.locator(this.selectors.d365AppTile);
    await topBar.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(2000);
  }

  /**
   * Navigate to Dynamics 365 login page
   * @param {string} orgUrl - Dynamics 365 organization URL
   * @returns {Promise<void>}
   */
  async navigateToLogin(orgUrl: string): Promise<void> {
    await this.goto(orgUrl);
  }

  /**
   * Verify we're on the Microsoft login page
   * @returns {Promise<boolean>} True if on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    try {
      return await this.isVisible(this.selectors.emailInput);
    } catch {
      return false;
    }
  }

  /**
   * Verify successful login to Dynamics 365
   * @returns {Promise<boolean>} True if logged in successfully
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const topBar = this.page.locator(this.selectors.d365AppTile);
      return await topBar.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get current user's display name from D365 header
   * @returns {Promise<string | null>} User display name or null
   */
  async getCurrentUserName(): Promise<string | null> {
    try {
      const userNameSelector = '[data-id="user-name"]';
      return await this.getText(userNameSelector);
    } catch {
      return null;
    }
  }
}

export default LoginPage;
