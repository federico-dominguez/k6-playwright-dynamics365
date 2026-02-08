/**
 * Login Page Object for Dynamics 365
 * Handles Microsoft authentication flow
 */

import BasePage from './base.page';

export class LoginPage extends BasePage {
  // Microsoft OAuth login selectors
  private selectors = {
    emailInput: 'input[type="email"][name="loginfmt"]',
    nextButton: 'input[type="submit"][value="Next"]',
    passwordInput: 'input[type="password"][name="passwd"]',
    signInButton: 'input[type="submit"][value="Sign in"]',
    staySignedInYes: 'input[type="submit"][value="Yes"]',
    staySignedInNo: 'input[type="submit"][value="No"]',
    // D365 specific selectors
    d365AppTile: '[data-id="navbar-container"]',
    loadingSpinner: '[data-id="loading"]',
  };

  /**
   * Complete Microsoft OAuth login flow for Dynamics 365
   * @param email User email address
   * @param password User password
   * @param staySignedIn Whether to stay signed in (default: false for testing)
   */
  async login(email: string, password: string, staySignedIn: boolean = false): Promise<void> {
    console.log(`Logging in as: ${email}`);

    // Step 1: Enter email
    await this.waitForSelector(this.selectors.emailInput);
    await this.fill(this.selectors.emailInput, email);
    await this.click(this.selectors.nextButton);

    // Wait a bit for page transition
    await this.page.waitForTimeout(2000);

    // Step 2: Enter password
    await this.waitForSelector(this.selectors.passwordInput);
    await this.fill(this.selectors.passwordInput, password);
    await this.click(this.selectors.signInButton);

    // Wait for potential redirect
    await this.page.waitForTimeout(2000);

    // Step 3: Handle "Stay signed in?" prompt (may not always appear)
    try {
      if (staySignedIn) {
        await this.click(this.selectors.staySignedInYes);
      } else {
        await this.click(this.selectors.staySignedInNo);
      }
      console.log('Handled "Stay signed in" prompt');
    } catch (error) {
      console.log('"Stay signed in" prompt did not appear (this is normal)');
    }

    // Step 4: Wait for Dynamics 365 to load
    await this.waitForDynamicsLoad();
    console.log('Successfully logged into Dynamics 365');
  }

  /**
   * Navigate to Dynamics 365 login page
   */
  async navigateToLogin(orgUrl: string): Promise<void> {
    await this.goto(orgUrl);
  }

  /**
   * Verify we're on the login page
   */
  async isOnLoginPage(): Promise<boolean> {
    try {
      return await this.isVisible(this.selectors.emailInput);
    } catch {
      return false;
    }
  }

  /**
   * Verify we successfully logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if D365 navigation is visible
      return await this.isVisible(this.selectors.d365AppTile);
    } catch {
      return false;
    }
  }

  /**
   * Get current user's display name from D365 header
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
