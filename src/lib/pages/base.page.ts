/**
 * Base Page Object Class for k6 Browser Tests
 *
 * Provides common functionality for Dynamics 365 page interactions.
 * Implements the Page Object Model pattern to promote code reusability
 * and maintainability in browser-based tests.
 *
 * @module lib/pages/base
 */

import { Page, Locator } from 'k6/browser';
import { check } from 'k6';
import { getEnvironmentConfig } from '@config/index';

export interface PageOptions {
  /** Custom timeout in milliseconds for page operations */
  timeout?: number;
}

/**
 * Base Page class implementing Page Object Model pattern.
 * Extend this class to create page-specific objects.
 *
 * @abstract
 * @example
 * class LoginPage extends BasePage {
 *   async login(email: string, password: string) {
 *     await this.fill('#email', email);
 *     await this.click('#submit');
 *   }
 * }
 */
export abstract class BasePage {
  /** k6 Browser Page instance */
  protected page: Page;
  /** Default timeout for page operations (ms) */
  protected timeout: number;

  /**
   * Creates a new BasePage instance
   * @param {Page} page - k6 Browser Page instance
   * @param {PageOptions} options - Configuration options
   */
  constructor(page: Page, options: PageOptions = {}) {
    this.page = page;
    this.timeout = options.timeout || getEnvironmentConfig().timeout;
  }

  /**
   * Navigate to a URL and wait for network idle
   * @param {string} url - Target URL
   * @returns {Promise<void>}
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.timeout });
  }

  /**
   * Wait for an element to be visible
   * @param {string} selector - CSS selector
   * @returns {Promise<Locator>} Located element
   */
  async waitForSelector(selector: string): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    return element;
  }

  /**
   * Click an element with automatic wait
   * @param {string} selector - CSS selector
   * @returns {Promise<void>}
   */
  async click(selector: string): Promise<void> {
    const element = await this.waitForSelector(selector);
    await element.click();
  }

  /**
   * Fill an input field with text
   * @param {string} selector - CSS selector
   * @param {string} value - Text value to enter
   * @returns {Promise<void>}
   */
  async fill(selector: string, value: string): Promise<void> {
    const element = await this.waitForSelector(selector);
    await element.fill(value);
  }

  /**
   * Get text content of an element
   * @param {string} selector - CSS selector
   * @returns {Promise<string | null>} Text content or null
   */
  async getText(selector: string): Promise<string | null> {
    const element = await this.waitForSelector(selector);
    return element.textContent();
  }

  /**
   * Check if element is visible on the page
   * @param {string} selector - CSS selector
   * @returns {Promise<boolean>} True if visible, false otherwise
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      const element = this.page.locator(selector);
      return await element.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Wait for Dynamics 365 page to fully load.
   * Checks for common D365 loading indicators and waits for them to disappear.
   * @returns {Promise<void>}
   */
  async waitForDynamicsLoad(): Promise<void> {
    const loadingIndicators = [
      '[data-id="loading"]',
      '.ms-Spinner',
      '[aria-busy="true"]',
    ];

    for (const indicator of loadingIndicators) {
      try {
        const element = this.page.locator(indicator);
        const isVisible = await element.isVisible();
        
        if (isVisible) {
          await element.waitFor({ state: 'hidden', timeout: 5000 });
        }
      } catch {
        // Indicator not present or already hidden
      }
    }
  }

  /**
   * Take a screenshot of the current page
   * @param {string} name - Screenshot filename (without extension)
   * @returns {Promise<void>}
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `reports/${name}.png` });
  }

  /**
   * Verify page loaded correctly with k6 checks
   * @param {string} expectedTitle - Expected page title substring
   * @returns {Promise<boolean>} Check result
   */
  async verifyPageLoaded(expectedTitle: string): Promise<boolean> {
    const title = await this.page.title();
    return check(null, {
      [`page title contains "${expectedTitle}"`]: () => title.includes(expectedTitle),
    });
  }

  /**
   * Get the underlying k6 Page object
   * @returns {Page} k6 Browser Page instance
   */
  getPage(): Page {
    return this.page;
  }
}

export default BasePage;
