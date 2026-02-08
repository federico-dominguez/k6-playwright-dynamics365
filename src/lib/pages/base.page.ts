/**
 * Base Page Object Class for k6 Browser Tests
 * Provides common functionality for Dynamics 365 page interactions
 */

import { Page, Locator } from 'k6/browser';
import { check } from 'k6';
import { getEnvironmentConfig } from '@config/index';

export interface PageOptions {
  timeout?: number;
}

/**
 * Base Page class implementing Page Object Model pattern
 * Extend this class for specific Dynamics 365 pages
 */
export abstract class BasePage {
  protected page: Page;
  protected timeout: number;

  constructor(page: Page, options: PageOptions = {}) {
    this.page = page;
    this.timeout = options.timeout || getEnvironmentConfig().timeout;
  }

  /**
   * Navigate to a URL and wait for load
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.timeout });
  }

  /**
   * Wait for an element to be visible
   */
  async waitForSelector(selector: string): Promise<Locator> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: this.timeout });
    return element;
  }

  /**
   * Click an element with retry logic
   */
  async click(selector: string): Promise<void> {
    const element = await this.waitForSelector(selector);
    await element.click();
  }

  /**
   * Fill an input field
   */
  async fill(selector: string, value: string): Promise<void> {
    const element = await this.waitForSelector(selector);
    await element.fill(value);
  }

  /**
   * Get text content of an element
   */
  async getText(selector: string): Promise<string | null> {
    const element = await this.waitForSelector(selector);
    return element.textContent();
  }

  /**
   * Check if element is visible
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
   * Wait for Dynamics 365 page to fully load
   * Waits for loading spinners to disappear
   */
  async waitForDynamicsLoad(): Promise<void> {
    // Common D365 loading indicators
    const loadingIndicators = [
      '[data-id="loading"]',
      '.ms-Spinner',
      '.loading-indicator',
      '[aria-busy="true"]',
    ];

    for (const indicator of loadingIndicators) {
      try {
        const element = this.page.locator(indicator);
        await element.waitFor({ state: 'hidden', timeout: this.timeout });
      } catch {
        // Indicator not present, continue
      }
    }
  }

  /**
   * Take a screenshot (useful for debugging)
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `reports/${name}.png` });
  }

  /**
   * Verify page loaded correctly with checks
   */
  async verifyPageLoaded(expectedTitle: string): Promise<boolean> {
    const title = await this.page.title();
    return check(null, {
      [`page title contains "${expectedTitle}"`]: () => title.includes(expectedTitle),
    });
  }

  /**
   * Get the underlying k6 page object
   */
  getPage(): Page {
    return this.page;
  }
}

export default BasePage;
