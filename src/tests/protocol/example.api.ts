/**
 * Example Protocol-Level (API) Test
 * 
 * Demonstrates HTTP/REST API testing against Dynamics 365 Web API.
 * Tests basic connectivity and entity queries using the OData protocol.
 * 
 * Run with: npm run test:protocol
 * 
 * @module tests/protocol/example
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { dynamics365Config, defaultOptions } from '@config/index';
import { getAuthHeaders } from '@lib/auth';

/** Custom metric: D365 API error rate */
const errorRate = new Rate('d365_errors');

/** Custom metric: D365 API response latency */
const apiLatency = new Trend('d365_api_latency');

/** Test configuration */
export const options = {
  ...defaultOptions.smoke,
  tags: {
    testType: 'protocol',
    module: 'example',
  },
};

/**
 * Setup function - runs once before test execution.
 * Validates authentication and prepares test context.
 * 
 * @returns {object} Context object with auth headers
 */
export function setup() {
  console.log(`Testing against: ${dynamics365Config.orgUrl}`);
  console.log(`API Version: ${dynamics365Config.apiVersion}`);

  try {
    const headers = getAuthHeaders();
    console.log('✓ Authentication successful');
    return { headers };
  } catch (error) {
    console.error('✗ Authentication failed:', error);
    throw error;
  }
}

/**
 * Main test function - executes for each Virtual User iteration.
 * Tests WhoAmI endpoint and account list query.
 * 
 * @param {object} data - Context from setup function
 */
export default function (data: { headers: Record<string, string> }) {
  const { headers } = data;
  const apiUrl = dynamics365Config.apiUrl;

  // Test 1: WhoAmI (basic connectivity)
  const whoAmIResponse = http.get(`${apiUrl}/WhoAmI`, {
    headers,
    tags: { endpoint: 'WhoAmI' },
  });

  apiLatency.add(whoAmIResponse.timings.duration);

  const whoAmISuccess = check(whoAmIResponse, {
    'WhoAmI: status is 200': r => r.status === 200,
    'WhoAmI: response has UserId': r => {
      try {
        const body = JSON.parse(r.body as string);
        return !!body.UserId;
      } catch {
        return false;
      }
    },
    'WhoAmI: response time < 2s': r => r.timings.duration < 2000,
  });

  errorRate.add(!whoAmISuccess);

  sleep(1);

  // Test 2: Accounts query (OData list)
  const accountsResponse = http.get(`${apiUrl}/accounts?$select=name,accountid&$top=10`, {
    headers,
    tags: { endpoint: 'accounts' },
  });

  apiLatency.add(accountsResponse.timings.duration);

  const accountsSuccess = check(accountsResponse, {
    'Accounts: status is 200': r => r.status === 200,
    'Accounts: response is array': r => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.value);
      } catch {
        return false;
      }
    },
    'Accounts: response time < 3s': r => r.timings.duration < 3000,
  });

  errorRate.add(!accountsSuccess);

  sleep(1);
}

/**
 * Teardown function - runs once after test
 */
export function teardown() {
  console.log('Protocol test completed');
}
