/**
 * Centralized Configuration for k6 Performance Tests
 * Dynamics 365 CE Testing Framework
 */

// Environment variables with defaults
const env = {
  D365_ORG_URL: __ENV.D365_ORG_URL || 'https://your-org.crm.dynamics.com',
  D365_CLIENT_ID: __ENV.D365_CLIENT_ID || '',
  D365_CLIENT_SECRET: __ENV.D365_CLIENT_SECRET || '',
  D365_TENANT_ID: __ENV.D365_TENANT_ID || '',
  TEST_ENVIRONMENT: __ENV.TEST_ENVIRONMENT || 'dev',
  K6_BROWSER_ENABLED: __ENV.K6_BROWSER_ENABLED === 'true',
};

/**
 * Dynamics 365 API Configuration
 */
export const dynamics365Config = {
  orgUrl: env.D365_ORG_URL,
  apiVersion: 'v9.2',
  get apiUrl() {
    return `${this.orgUrl}/api/data/${this.apiVersion}`;
  },
  auth: {
    clientId: env.D365_CLIENT_ID,
    clientSecret: env.D365_CLIENT_SECRET,
    tenantId: env.D365_TENANT_ID,
    get tokenUrl() {
      return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    },
    scope: `${env.D365_ORG_URL}/.default`,
  },
};

/**
 * Performance Thresholds (SLOs)
 * Based on Dynamics 365 best practices
 */
export const thresholds = {
  // API Response Times
  api: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
  // Browser Performance
  browser: {
    browser_web_vital_lcp: ['p(95)<4000'], // Largest Contentful Paint < 4s
    browser_web_vital_fcp: ['p(95)<3000'], // First Contentful Paint < 3s
    browser_web_vital_cls: ['p(95)<0.1'], // Cumulative Layout Shift < 0.1
  },
};

/**
 * Default Test Options
 */
export const defaultOptions = {
  // Smoke test configuration
  smoke: {
    vus: 1,
    duration: '1m',
    thresholds: thresholds.api,
  },
  // Load test configuration
  load: {
    stages: [
      { duration: '2m', target: 10 }, // Ramp up
      { duration: '5m', target: 10 }, // Stay at 10 VUs
      { duration: '2m', target: 0 }, // Ramp down
    ],
    thresholds: thresholds.api,
  },
  // Stress test configuration
  stress: {
    stages: [
      { duration: '2m', target: 10 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '5m', target: 0 },
    ],
    thresholds: thresholds.api,
  },
};

/**
 * Environment-specific settings
 */
export const environments = {
  dev: {
    baseUrl: env.D365_ORG_URL,
    timeout: 60000,
    retries: 2,
  },
  staging: {
    baseUrl: env.D365_ORG_URL,
    timeout: 45000,
    retries: 1,
  },
  prod: {
    baseUrl: env.D365_ORG_URL,
    timeout: 30000,
    retries: 0,
  },
};

/**
 * Get current environment configuration
 */
export function getEnvironmentConfig() {
  const envName = env.TEST_ENVIRONMENT as keyof typeof environments;
  return environments[envName] || environments.dev;
}

export default {
  dynamics365Config,
  thresholds,
  defaultOptions,
  environments,
  getEnvironmentConfig,
};
