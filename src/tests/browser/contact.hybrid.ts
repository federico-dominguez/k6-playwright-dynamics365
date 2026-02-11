/**
 * Contact Hybrid Test (API + Browser)
 *
 * Demonstrates the hybrid testing pattern:
 * - Use API for fast data setup (no browser overhead)
 * - Use browser for realistic UI validation
 * - Use API for fast verification
 *
 * This pattern is ideal for realistic end-to-end scenarios while
 * maintaining good test performance.
 *
 * Run with: npm run test:browser -- --env TEST_FILE=contact.hybrid
 *
 * @module tests/browser/contact.hybrid
 */

import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { dynamics365Config, thresholds } from '@config/index';
import { LoginPage, ContactPage } from '@lib/pages';
import { contactService } from '@lib/services';
import { DataGenerator, setSeed } from '@lib/helpers';

// ============================================
// Custom Metrics
// ============================================

/** API data setup time */
const apiSetupTime = new Trend('hybrid_api_setup_time');

/** UI validation time */
const uiValidationTime = new Trend('hybrid_ui_validation_time');

/** API verification time */
const apiVerifyTime = new Trend('hybrid_api_verify_time');

/** Total hybrid test time */
const totalHybridTime = new Trend('hybrid_total_time');

/** Successful operations */
const hybridSuccess = new Counter('hybrid_success');

/** Failed operations */
const hybridFailure = new Counter('hybrid_failure');

/** Error rate */
const hybridErrorRate = new Rate('hybrid_error_rate');

// ============================================
// Test Configuration
// ============================================

const TEST_USER_EMAIL = __ENV.D365_TEST_USER_EMAIL || '';
const TEST_USER_PASSWORD = __ENV.D365_TEST_USER_PASSWORD || '';

export const options = {
  scenarios: {
    hybrid_test: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
          headless: __ENV.K6_BROWSER_HEADLESS !== 'false',
          timeout: '120s',
        },
      },
    },
  },
  thresholds: {
    ...thresholds.browser,
    hybrid_api_setup_time: ['p(95)<5000'], // API setup < 5s
    hybrid_ui_validation_time: ['p(95)<15000'], // UI validation < 15s
    hybrid_api_verify_time: ['p(95)<3000'], // API verify < 3s
    hybrid_error_rate: ['rate<0.1'], // Less than 10% errors
  },
  tags: {
    testType: 'hybrid',
    module: 'contact',
    pattern: 'api-ui-api',
  },
};

// ============================================
// Setup
// ============================================

export function setup() {
  console.log('='.repeat(60));
  console.log('Contact Hybrid Test (API Setup + UI Validation + API Verify)');
  console.log('='.repeat(60));
  console.log(`Target: ${dynamics365Config.orgUrl}`);

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    throw new Error(
      'Test user credentials not configured. ' +
        'Please set D365_TEST_USER_EMAIL and D365_TEST_USER_PASSWORD'
    );
  }

  // Verify API connectivity
  const countResult = contactService.countActiveContacts();
  if (!countResult.success) {
    throw new Error('Cannot connect to D365 API');
  }
  console.log(`✓ API connected - ${countResult.data} active contacts`);

  setSeed(Date.now());

  return {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    startTime: Date.now(),
  };
}

// ============================================
// Main Test Function
// ============================================

export default async function (data: {
  email: string;
  password: string;
  startTime: number;
}) {
  const totalStart = Date.now();
  let contactId: string | null = null;
  let context = null;
  let page = null;

  try {
    // ========================================
    // PHASE 1: API Data Setup (Fast)
    // ========================================
    console.log('\n--- PHASE 1: API Data Setup ---');

    const apiSetupStart = Date.now();

    // Generate test contact
    const testContact = DataGenerator.contact({
      description: `Hybrid test contact - ${new Date().toISOString()}`,
    });

    // Create contact via API (fast, no browser)
    const createResult = contactService.createContact({
      firstname: testContact.firstname as string,
      lastname: testContact.lastname as string,
      emailaddress1: testContact.emailaddress1 as string,
      telephone1: testContact.telephone1 as string,
      jobtitle: testContact.jobtitle as string,
      department: testContact.department as string,
      address1_city: testContact.address1_city as string,
      description: testContact.description as string,
    });

    apiSetupTime.add(Date.now() - apiSetupStart);

    const apiCreateSuccess = check(createResult, {
      'API: contact created': r => r.success,
      'API: has contact ID': r => !!r.data?.id,
    });

    if (!apiCreateSuccess || !createResult.data?.id) {
      hybridFailure.add(1);
      hybridErrorRate.add(1);
      throw new Error(`API setup failed: ${createResult.error}`);
    }

    contactId = createResult.data.id;
    hybridSuccess.add(1);
    hybridErrorRate.add(0);
    console.log(`✓ Contact created via API: ${testContact.firstname} ${testContact.lastname}`);
    console.log(`  ID: ${contactId}`);

    sleep(1);

    // ========================================
    // PHASE 2: Browser UI Validation
    // ========================================
    console.log('\n--- PHASE 2: Browser UI Validation ---');

    const uiValidationStart = Date.now();

    // Launch browser
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();

    const loginPage = new LoginPage(page);
    const contactPage = new ContactPage(page);

    // Login to D365
    console.log('Logging in to D365...');
    await loginPage.navigateToLogin(dynamics365Config.orgUrl);
    await loginPage.login(data.email, data.password);

    const isLoggedIn = await loginPage.isLoggedIn();
    check(null, { 'UI: logged in': () => isLoggedIn });

    if (!isLoggedIn) {
      hybridFailure.add(1);
      hybridErrorRate.add(1);
      throw new Error('Login failed');
    }

    console.log('✓ Logged in');

    // Navigate to the contact created via API
    console.log(`Navigating to contact: ${contactId}`);
    await contactPage.navigateToContact(contactId);

    // Validate UI shows correct data
    const fullName = await contactPage.getContactFullName();
    const formValues = await contactPage.getFormValues();

    uiValidationTime.add(Date.now() - uiValidationStart);

    const uiValidationSuccess = check(null, {
      'UI: contact page loaded': () => fullName !== null,
      'UI: firstname displayed': () => formValues.firstname === testContact.firstname,
      'UI: lastname displayed': () => formValues.lastname === testContact.lastname,
      'UI: email displayed': () => formValues.emailaddress1 === testContact.emailaddress1,
      'UI: job title displayed': () => formValues.jobtitle === testContact.jobtitle,
    });

    if (uiValidationSuccess) {
      hybridSuccess.add(1);
      hybridErrorRate.add(0);
      console.log(`✓ UI validation passed: ${fullName}`);
    } else {
      hybridFailure.add(1);
      hybridErrorRate.add(1);
      console.log('✗ UI validation failed');
      console.log(`  Expected firstname: ${testContact.firstname}, Got: ${formValues.firstname}`);
      console.log(`  Expected lastname: ${testContact.lastname}, Got: ${formValues.lastname}`);
    }

    // Take screenshot for evidence
    await contactPage.screenshot('hybrid-ui-validation');

    // Update contact via UI
    console.log('Updating contact via UI...');
    const newJobTitle = 'Senior ' + testContact.jobtitle;
    await contactPage.fillContactForm({
      jobtitle: newJobTitle,
    });
    await contactPage.saveContact();

    console.log(`✓ Updated job title to: ${newJobTitle}`);

    // Close browser (we're done with UI)
    await page.close();
    await context.close();
    page = null;
    context = null;

    sleep(1);

    // ========================================
    // PHASE 3: API Verification (Fast)
    // ========================================
    console.log('\n--- PHASE 3: API Verification ---');

    const apiVerifyStart = Date.now();

    // Verify update via API (fast validation)
    const verifyResult = contactService.getContact(contactId, ['contactid', 'fullname', 'jobtitle', 'modifiedon']);

    apiVerifyTime.add(Date.now() - apiVerifyStart);

    const apiVerifySuccess = check(verifyResult, {
      'API verify: request successful': r => r.success,
      'API verify: job title updated': r => r.data?.jobtitle === newJobTitle,
      'API verify: has modified date': r => !!r.data?.modifiedon,
    });

    if (apiVerifySuccess) {
      hybridSuccess.add(1);
      hybridErrorRate.add(0);
      console.log(`✓ API verification passed`);
      console.log(`  Job Title: ${verifyResult.data?.jobtitle}`);
      console.log(`  Modified: ${verifyResult.data?.modifiedon}`);
    } else {
      hybridFailure.add(1);
      hybridErrorRate.add(1);
      console.log('✗ API verification failed');
      console.log(`  Expected: ${newJobTitle}`);
      console.log(`  Got: ${verifyResult.data?.jobtitle}`);
    }

    // ========================================
    // Cleanup
    // ========================================
    console.log('\n--- Cleanup ---');

    const deleteResult = contactService.deleteContact(contactId);
    if (deleteResult.success) {
      console.log(`✓ Cleaned up contact: ${contactId}`);
      contactId = null; // Clear so teardown doesn't try again
    }

  } catch (error) {
    console.error(`\nTest error: ${error}`);
    hybridFailure.add(1);
    hybridErrorRate.add(1);
  } finally {
    // Ensure browser cleanup
    if (page) {
      try {
        await page.close();
      } catch { /* ignore */ }
    }
    if (context) {
      try {
        await context.close();
      } catch { /* ignore */ }
    }

    // Ensure contact cleanup
    if (contactId) {
      try {
        contactService.deleteContact(contactId);
        console.log(`✓ Cleanup: deleted contact ${contactId}`);
      } catch { /* ignore */ }
    }

    totalHybridTime.add(Date.now() - totalStart);
  }
}

// ============================================
// Teardown
// ============================================

export function teardown(data: { startTime: number }) {
  const duration = ((Date.now() - data.startTime) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  console.log('Hybrid Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Duration: ${duration}s`);
  console.log('\nPattern Benefits:');
  console.log('  • API setup is ~10x faster than UI creation');
  console.log('  • UI validation catches rendering/display issues');
  console.log('  • API verification is instant and reliable');
  console.log('='.repeat(60));
}
