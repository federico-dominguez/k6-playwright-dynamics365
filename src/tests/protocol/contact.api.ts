/**
 * Contact CRUD Protocol (API) Test
 *
 * Demonstrates service layer pattern for Dynamics 365 Contact entity operations.
 * Tests full CRUD lifecycle using the ContactService.
 *
 * Run with: npm run test:protocol -- --env TEST_FILE=contact.api
 *
 * @module tests/protocol/contact
 */

import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { dynamics365Config, defaultOptions } from '@config/index';
import { contactService } from '@lib/services';
import { DataGenerator, setSeed } from '@lib/helpers';

// ============================================
// Custom Metrics
// ============================================

/** Contact operation error rate */
const errorRate = new Rate('contact_errors');

/** Contact API latency */
const apiLatency = new Trend('contact_api_latency');

/** Contacts created counter */
const contactsCreated = new Counter('contacts_created');

/** Contacts deleted counter */
const contactsDeleted = new Counter('contacts_deleted');

// ============================================
// Test Configuration
// ============================================

export const options = {
  ...defaultOptions.smoke,
  tags: {
    testType: 'protocol',
    module: 'contact',
    pattern: 'crud',
  },
  thresholds: {
    contact_errors: ['rate<0.1'], // Less than 10% errors
    contact_api_latency: ['p(95)<3000'], // 95th percentile under 3s
  },
};

// Store created contact IDs for cleanup
const createdContacts: string[] = [];

// ============================================
// Setup
// ============================================

/**
 * Setup function - runs once before test execution.
 * Validates authentication and prepares test context.
 */
export function setup() {
  console.log('='.repeat(50));
  console.log('Contact CRUD Protocol Test');
  console.log('='.repeat(50));
  console.log(`Target: ${dynamics365Config.orgUrl}`);
  console.log(`API Version: ${dynamics365Config.apiVersion}`);

  // Verify connectivity with a count query
  const countResult = contactService.countActiveContacts();
  if (countResult.success) {
    console.log(`✓ Connected - ${countResult.data} active contacts in system`);
  } else {
    console.error('✗ Connection failed:', countResult.error);
    throw new Error('Setup failed: Cannot connect to Dynamics 365');
  }

  // Set seed for reproducible test data
  setSeed(Date.now());

  return {
    startTime: Date.now(),
  };
}

// ============================================
// Main Test Function
// ============================================

/**
 * Main test function - executes Contact CRUD operations.
 * Each VU iteration performs a complete CRUD cycle.
 */
export default function (_data: { startTime: number }) {
  // Generate unique test data for this iteration
  const testContact = DataGenerator.contact({
    description: `k6 test contact - ${new Date().toISOString()}`,
  });

  let contactId: string | null = null;

  // ----------------------------------------
  // CREATE: Create new contact
  // ----------------------------------------
  const createStart = Date.now();
  const createResult = contactService.createContact({
    firstname: testContact.firstname as string,
    lastname: testContact.lastname as string,
    emailaddress1: testContact.emailaddress1 as string,
    telephone1: testContact.telephone1 as string,
    jobtitle: testContact.jobtitle as string,
    department: testContact.department as string,
    address1_line1: testContact.address1_line1 as string,
    address1_city: testContact.address1_city as string,
    address1_stateorprovince: testContact.address1_stateorprovince as string,
    address1_postalcode: testContact.address1_postalcode as string,
    address1_country: testContact.address1_country as string,
    description: testContact.description as string,
  });

  apiLatency.add(Date.now() - createStart);

  const createSuccess = check(createResult, {
    'CREATE: status is 204': r => r.status === 204,
    'CREATE: contact ID returned': r => !!r.data?.id,
  });

  errorRate.add(!createSuccess);

  if (createSuccess && createResult.data?.id) {
    contactId = createResult.data.id;
    contactsCreated.add(1);
    createdContacts.push(contactId);
    console.log(`✓ Created contact: ${testContact.firstname} ${testContact.lastname} (${contactId})`);
  } else {
    console.error(`✗ Create failed: ${createResult.error}`);
    return; // Skip remaining operations if create failed
  }

  sleep(0.5);

  // ----------------------------------------
  // READ: Retrieve created contact
  // ----------------------------------------
  const readStart = Date.now();
  const readResult = contactService.getContact(contactId, 'detail');

  apiLatency.add(Date.now() - readStart);

  const readSuccess = check(readResult, {
    'READ: status is 200': r => r.status === 200,
    'READ: has contact data': r => !!r.data,
    'READ: firstname matches': r => r.data?.firstname === testContact.firstname,
    'READ: lastname matches': r => r.data?.lastname === testContact.lastname,
    'READ: email matches': r => r.data?.emailaddress1 === testContact.emailaddress1,
  });

  errorRate.add(!readSuccess);

  if (readSuccess) {
    console.log(`✓ Retrieved contact: ${readResult.data?.fullname}`);
  } else {
    console.error(`✗ Read failed: ${readResult.error}`);
  }

  sleep(0.5);

  // ----------------------------------------
  // UPDATE: Modify contact fields
  // ----------------------------------------
  const updatedJobTitle = 'Senior ' + testContact.jobtitle;
  const updateStart = Date.now();
  const updateResult = contactService.updateContact(contactId, {
    jobtitle: updatedJobTitle,
    description: `Updated by k6 at ${new Date().toISOString()}`,
  });

  apiLatency.add(Date.now() - updateStart);

  const updateSuccess = check(updateResult, {
    'UPDATE: status is 204': r => r.status === 204,
  });

  errorRate.add(!updateSuccess);

  if (updateSuccess) {
    console.log(`✓ Updated contact job title to: ${updatedJobTitle}`);
  } else {
    console.error(`✗ Update failed: ${updateResult.error}`);
  }

  sleep(0.5);

  // ----------------------------------------
  // VERIFY: Confirm update was applied
  // ----------------------------------------
  const verifyStart = Date.now();
  const verifyResult = contactService.getContact(contactId, ['contactid', 'jobtitle', 'description']);

  apiLatency.add(Date.now() - verifyStart);

  const verifySuccess = check(verifyResult, {
    'VERIFY: status is 200': r => r.status === 200,
    'VERIFY: job title updated': r => r.data?.jobtitle === updatedJobTitle,
  });

  errorRate.add(!verifySuccess);

  if (verifySuccess) {
    console.log(`✓ Verified update: jobtitle = ${verifyResult.data?.jobtitle}`);
  }

  sleep(0.5);

  // ----------------------------------------
  // QUERY: Search for contacts
  // ----------------------------------------
  const queryStart = Date.now();
  const queryResult = contactService.searchContacts(testContact.lastname as string, 10);

  apiLatency.add(Date.now() - queryStart);

  const querySuccess = check(queryResult, {
    'QUERY: status is 200': r => r.status === 200,
    'QUERY: returned results': r => (r.data?.value?.length ?? 0) > 0,
    'QUERY: includes our contact': r =>
      r.data?.value?.some(c => c.contactid === contactId) ?? false,
  });

  errorRate.add(!querySuccess);

  if (querySuccess) {
    console.log(`✓ Query found ${queryResult.data?.value?.length} contacts matching "${testContact.lastname}"`);
  } else {
    console.error(`✗ Query failed (${queryResult.status}): ${queryResult.error?.substring(0, 200)}`);
  }

  sleep(0.5);

  // ----------------------------------------
  // DELETE: Remove test contact
  // ----------------------------------------
  const deleteStart = Date.now();
  const deleteResult = contactService.deleteContact(contactId);

  apiLatency.add(Date.now() - deleteStart);

  const deleteSuccess = check(deleteResult, {
    'DELETE: status is 204': r => r.status === 204,
  });

  errorRate.add(!deleteSuccess);

  if (deleteSuccess) {
    contactsDeleted.add(1);
    // Remove from cleanup list since already deleted
    const idx = createdContacts.indexOf(contactId);
    if (idx > -1) createdContacts.splice(idx, 1);
    console.log(`✓ Deleted contact: ${contactId}`);
  } else {
    console.error(`✗ Delete failed: ${deleteResult.error}`);
  }

  sleep(0.5);

  // ----------------------------------------
  // VERIFY DELETE: Confirm contact is gone
  // ----------------------------------------
  const verifyDeleteStart = Date.now();
  const verifyDeleteResult = contactService.getContact(contactId, 'minimal');

  apiLatency.add(Date.now() - verifyDeleteStart);

  const verifyDeleteSuccess = check(verifyDeleteResult, {
    'VERIFY DELETE: status is 404': r => r.status === 404,
  });

  // Note: 404 is expected here, so we don't add to error rate
  if (verifyDeleteSuccess) {
    console.log(`✓ Verified deletion: contact ${contactId} not found (404)`);
  }

  console.log('-'.repeat(50));
}

// ============================================
// Teardown
// ============================================

/**
 * Teardown function - runs once after test execution.
 * Cleans up any remaining test contacts.
 */
export function teardown(data: { startTime: number }) {
  console.log('='.repeat(50));
  console.log('Teardown: Cleaning up test contacts');
  console.log('='.repeat(50));

  // Clean up any contacts that weren't deleted during test
  let cleaned = 0;
  for (const contactId of createdContacts) {
    const result = contactService.deleteContact(contactId);
    if (result.success) {
      cleaned++;
      console.log(`✓ Cleaned up contact: ${contactId}`);
    }
  }

  const duration = ((Date.now() - data.startTime) / 1000).toFixed(2);
  console.log(`\nTest completed in ${duration}s`);
  console.log(`Contacts cleaned up: ${cleaned}`);
  console.log('='.repeat(50));
}
