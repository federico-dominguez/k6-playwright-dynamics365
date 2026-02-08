/**
 * Example Protocol-Level (API) Test
 * Tests Dynamics 365 Web API endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { dynamics365Config, defaultOptions } from '@config/index';
import { getAuthHeaders } from '@lib/auth';

// Custom metrics
const errorRate = new Rate('d365_errors');
const apiLatency = new Trend('d365_api_latency');

// Test configuration
export const options = {
  ...defaultOptions.smoke,
  tags: {
    testType: 'protocol',
    module: 'example',
  },
};

/**
 * Setup function - runs once before test
 */
export function setup() {
  console.log(`Testing against: ${dynamics365Config.orgUrl}`);
  console.log(`API Version: ${dynamics365Config.apiVersion}`);

  // Verify authentication works
  try {
    const headers = getAuthHeaders();
    console.log('Authentication successful');
    return { headers };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

/**
 * Default function - runs for each VU iteration
 */
export default function (data: { headers: Record<string, string> }) {
  const { headers } = data;
  const apiUrl = dynamics365Config.apiUrl;

  // Example: Get WhoAmI (basic connectivity test)
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

  // Example: Get accounts (list query)
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
