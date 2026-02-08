/**
 * Example Browser Test
 * Tests Dynamics 365 UI using k6 Browser module
 */

import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { dynamics365Config, thresholds } from '@config/index';

// Custom metrics
const pageLoadTime = new Trend('d365_page_load_time');

// Test configuration
export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    ...thresholds.browser,
    'd365_page_load_time': ['p(95)<5000'],
  },
  tags: {
    testType: 'browser',
    module: 'example',
  },
};

/**
 * Default function - runs browser test
 */
export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const startTime = Date.now();

    // Navigate to Dynamics 365 login page
    // Note: In real tests, you'd use your actual D365 URL
    await page.goto(dynamics365Config.orgUrl, {
      waitUntil: 'networkidle',
    });

    const loadTime = Date.now() - startTime;
    pageLoadTime.add(loadTime);

    console.log(`Page loaded in ${loadTime}ms`);

    // Example checks
    check(page, {
      'page loaded': p => p.url().includes('dynamics.com') || p.url().includes('crm'),
    });

    // Wait for any loading indicators to disappear
    // Dynamics 365 specific selectors
    try {
      await page.locator('[data-id="loading"]').waitFor({
        state: 'hidden',
        timeout: 30000,
      });
    } catch {
      // Loading indicator may not be present
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'reports/d365-homepage.png' });

    // Example: Check for main navigation
    const hasNavigation = await page.locator('[data-id="navbar-container"]').isVisible();
    check(null, {
      'navigation is visible': () => hasNavigation,
    });

    sleep(2);
  } catch (error) {
    console.error('Browser test error:', error);
    await page.screenshot({ path: 'reports/error-screenshot.png' });
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
}
