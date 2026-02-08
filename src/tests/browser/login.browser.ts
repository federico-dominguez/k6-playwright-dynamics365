/**
 * Dynamics 365 Login Test
 *
 * Tests browser-based authentication flow using k6 Browser module.
 * This test validates the complete Microsoft OAuth login process
 * and measures login performance metrics.
 *
 * @module tests/browser/login
 */

import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { dynamics365Config, thresholds } from '@config/index';
import LoginPage from '@lib/pages/login.page';

// Custom metrics for login performance tracking
const loginTime = new Trend('d365_login_time');
const loginSuccess = new Counter('d365_login_success');
const loginFailure = new Counter('d365_login_failure');

// Test user credentials from environment variables
const TEST_USER_EMAIL = __ENV.D365_TEST_USER_EMAIL || '';
const TEST_USER_PASSWORD = __ENV.D365_TEST_USER_PASSWORD || '';

/**
 * Test configuration and scenario definition
 */
export const options = {
  scenarios: {
    ui_login: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
          headless: __ENV.K6_BROWSER_HEADLESS !== 'false',
          timeout: '60s',
        },
      },
    },
  },
  thresholds: {
    ...thresholds.browser,
    d365_login_time: ['p(95)<15000'], // 95th percentile login < 15s
    d365_login_success: ['count>0'], // At least one successful login
  },
  tags: {
    testType: 'browser',
    module: 'authentication',
  },
};

/**
 * Setup function - Validates configuration before test execution
 * @returns {Object} Test data containing user credentials
 * @throws {Error} If credentials are not configured
 */
export function setup() {
  console.log(`Testing D365 Login: ${dynamics365Config.orgUrl}`);

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error(
      'Test user credentials not configured. ' +
        'Please set D365_TEST_USER_EMAIL and D365_TEST_USER_PASSWORD in your .env file'
    );
  }

  console.log(`Test User: ${TEST_USER_EMAIL}`);
  return { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD };
}

/**
 * Main test function - Executes the D365 login flow
 * @param {Object} data - Test data from setup function
 * @param {string} data.email - User email address
 * @param {string} data.password - User password
 */
export default async function (data: { email: string; password: string }) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const loginPage = new LoginPage(page);
  const startTime = Date.now();

  try {
    // Navigate to D365 login page
    await loginPage.navigateToLogin(dynamics365Config.orgUrl);

    // Verify login page loaded correctly
    const onLoginPage = await loginPage.isOnLoginPage();
    check(null, { 'login page loaded': () => onLoginPage });

    if (!onLoginPage) {
      throw new Error('Failed to load D365 login page');
    }

    // Perform login
    await loginPage.login(data.email, data.password, false);

    // Measure login duration
    const loginDuration = Date.now() - startTime;
    loginTime.add(loginDuration);

    // Validate successful login
    const isLoggedIn = await loginPage.isLoggedIn();
    const success = check(null, {
      'login successful': () => isLoggedIn,
      'login time < 20s': () => loginDuration < 20000,
    });

    if (success) {
      loginSuccess.add(1);
      console.log(`✓ Login successful in ${loginDuration}ms`);
    } else {
      loginFailure.add(1);
      console.error('✗ Login validation failed');
    }
  } catch (error) {
    loginFailure.add(1);
    console.error('Login test error:', error);
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
}

/**
 * Teardown function - Cleanup after test execution
 */
export function teardown() {
  console.log('Login test completed');
}
