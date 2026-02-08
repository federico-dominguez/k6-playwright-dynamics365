/**
 * Example Browser Test
 * 
 * Demonstrates browser-based UI testing against Dynamics 365 using k6's browser module.
 * Tests page load performance and basic navigation visibility.
 * 
 * Run with: npm run test:browser
 * Note: Ensure K6_BROWSER_HEADLESS environment variable is set appropriately.
 * 
 * @module tests/browser/example
 */

import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { dynamics365Config, thresholds } from '@config/index';

/** Custom metric: D365 page load time */
const pageLoadTime = new Trend('d365_page_load_time');

/** Test configuration */
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
 * Main browser test function.
 * Navigates to Dynamics 365 homepage and validates basic elements.
 */
export default async function () {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const startTime = Date.now();

    // Navigate to Dynamics 365 organization URL
    await page.goto(dynamics365Config.orgUrl, {
      waitUntil: 'networkidle',
    });

    const loadTime = Date.now() - startTime;
    pageLoadTime.add(loadTime);

    console.log(`✓ Page loaded in ${loadTime}ms`);

    // Validate successful page load
    check(page, {
      'page loaded successfully': p => 
        p.url().includes('dynamics.com') || p.url().includes('crm'),
    });

    // Wait for Dynamics 365 navigation bar
    const navigationVisible = await page.locator('#topBar').isVisible();
    check(null, {
      'navigation bar is visible': () => navigationVisible,
    });

    sleep(1);
  } catch (error) {
    console.error('✗ Browser test error:', error);
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
}
