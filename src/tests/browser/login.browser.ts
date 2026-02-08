/**
 * Dynamics 365 Login Test
 * Tests browser-based authentication flow using k6 Browser module
 */

import { browser } from 'k6/browser';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { dynamics365Config, thresholds } from '@config/index';
import LoginPage from '@lib/pages/login.page';

// Custom metrics
const loginTime = new Trend('d365_login_time');
const loginSuccess = new Counter('d365_login_success');
const loginFailure = new Counter('d365_login_failure');

// Test user credentials from environment
const TEST_USER_EMAIL = __ENV.D365_TEST_USER_EMAIL || '';
const TEST_USER_PASSWORD = __ENV.D365_TEST_USER_PASSWORD || '';

// Test configuration
export const options = {
  scenarios: {
    ui_login: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
          headless: __ENV.K6_HEADLESS !== 'false', // Run headless unless K6_HEADLESS=false
        },
      },
    },
  },
  thresholds: {
    ...thresholds.browser,
    'd365_login_time': ['p(95)<15000'], // Login should complete in < 15s (p95)
    'd365_login_success': ['count>0'], // At least one successful login
  },
  tags: {
    testType: 'browser',
    module: 'authentication',
  },
};

/**
 * Setup function - validate configuration
 */
export function setup() {
  console.log(`Testing D365 Login: ${dynamics365Config.orgUrl}`);

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    console.error('ERROR: Missing test user credentials!');
    console.error('Please set D365_TEST_USER_EMAIL and D365_TEST_USER_PASSWORD in your .env file');
    throw new Error('Test user credentials not configured');
  }

  console.log(`Test User: ${TEST_USER_EMAIL}`);
  return { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD };
}

/**
 * Main test function
 */
export default async function (data: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const loginPage = new LoginPage(page);

  const startTime = Date.now();

  try {
    console.log('Step 1: Navigate to Dynamics 365');
    await loginPage.navigateToLogin(dynamics365Config.orgUrl);

    // Verify we're on login page
    const onLoginPage = await loginPage.isOnLoginPage();
    check(null, {
      'login page loaded': () => onLoginPage,
    });

    if (!onLoginPage) {
      throw new Error('Failed to load login page');
    }

    console.log('Step 2: Perform login');
    await loginPage.login(data.email, data.password, false);

    const loginDuration = Date.now() - startTime;
    loginTime.add(loginDuration);

    console.log(`Login completed in ${loginDuration}ms`);

    // Verify successful login
    const isLoggedIn = await loginPage.isLoggedIn();
    const success = check(null, {
      'login successful': () => isLoggedIn,
      'login time < 20s': () => loginDuration < 20000,
    });

    if (success) {
      loginSuccess.add(1);
      console.log('✓ Login test PASSED');

      // Optional: Get current user info
      const userName = await loginPage.getCurrentUserName();
      if (userName) {
        console.log(`Logged in as: ${userName}`);
      }
    } else {
      loginFailure.add(1);
      console.error('✗ Login test FAILED');
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'reports/login-complete.png' });
    console.log('Screenshot saved: reports/login-complete.png');
  } catch (error) {
    loginFailure.add(1);
    console.error('Login test error:', error);
    await page.screenshot({ path: 'reports/login-error.png' });
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
}

/**
 * Teardown function
 */
export function teardown() {
  console.log('Login test completed');
}
