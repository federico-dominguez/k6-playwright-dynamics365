/**
 * Centralized Configuration for k6 Performance Tests
 * 
 * Manages Dynamics 365 CE testing framework configuration including:
 * - OAuth2 authentication settings
 * - API endpoints and versioning
 * - Performance thresholds (SLOs)
 * - Test scenario configurations
 * - Environment-specific settings
 * 
 * @module config
 */

/** Environment variables with fallback defaults */
const env = {
  D365_ORG_URL: __ENV.D365_ORG_URL || 'https://your-org.crm.dynamics.com',
  D365_CLIENT_ID: __ENV.D365_CLIENT_ID || '',
  D365_CLIENT_SECRET: __ENV.D365_CLIENT_SECRET || '',
  D365_TENANT_ID: __ENV.D365_TENANT_ID || '',
  TEST_ENVIRONMENT: __ENV.TEST_ENVIRONMENT || 'dev',
  K6_BROWSER_ENABLED: __ENV.K6_BROWSER_ENABLED === 'true',
};

/**
 * Dynamics 365 API and Authentication Configuration
 * 
 * Provides centralized access to:
 * - Organization URL and API endpoints
 * - OAuth2 client credentials
 * - Token endpoint URLs
 * 
 * @example
 * import { dynamics365Config } from '@config/index';
 * const apiUrl = dynamics365Config.apiUrl; // https://org.crm.dynamics.com/api/data/v9.2
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
 * Performance Thresholds (Service Level Objectives)
 * 
 * Defines acceptable performance boundaries for API and browser tests.
 * Based on Dynamics 365 best practices and web vitals standards.
 * 
 * Thresholds:
 * - API: 95th percentile < 2s, 99th < 5s, error rate < 1%
 * - Browser: LCP/FCP < 4s, CLS < 0.1
 * 
 * @see https://grafana.com/docs/k6/latest/using-k6/thresholds/
 */
export const thresholds = {
  /** API Response Times and Error Rates */
  api: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
  },
  /** Browser Performance Metrics (Web Vitals) */
  browser: {
    browser_web_vital_lcp: ['p(95)<4000'], // Largest Contentful Paint < 4s
    browser_web_vital_fcp: ['p(95)<4000'], // First Contentful Paint < 4s
    browser_web_vital_cls: ['p(95)<0.1'], // Cumulative Layout Shift < 0.1
  },
};

/**
 * Pre-configured Test Scenario Options
 * 
 * Ready-to-use k6 options for common testing scenarios:
 * - Smoke: Quick validation with 1 VU
 * - Load: Sustained load with 10 VUs
 * - Stress: Progressive load increase to find breaking point
 * 
 * @see https://grafana.com/docs/k6/latest/using-k6/k6-options/
 */
export const defaultOptions = {
  /** Smoke test: Validate basic functionality */
  smoke: {
    vus: 1,
    duration: '1m',
    thresholds: thresholds.api,
  },
  /** Load test: Sustained performance under normal load */
  load: {
    stages: [
      { duration: '2m', target: 10 }, // Ramp up
      { duration: '5m', target: 10 }, // Steady state
      { duration: '2m', target: 0 }, // Ramp down
    ],
    thresholds: thresholds.api,
  },
  /** Stress test: Find system breaking points */
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
 * Environment-specific Settings
 * 
 * Configure timeouts and retry behavior per environment:
 * - dev: Longer timeouts, more retries (development/debugging)
 * - staging: Moderate settings (pre-production validation)
 * - prod: Strict timeouts, no retries (production monitoring)
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
 * Get configuration for the current test environment.
 * Reads from TEST_ENVIRONMENT env variable (defaults to 'dev').
 * 
 * @returns {object} Environment-specific configuration object
 * 
 * @example
 * const config = getEnvironmentConfig();
 * console.log(`Timeout: ${config.timeout}ms`);
 */
export function getEnvironmentConfig() {
  const envName = env.TEST_ENVIRONMENT as keyof typeof environments;
  return environments[envName] || environments.dev;
}

/** Configuration module exports */
export default {
  dynamics365Config,
  thresholds,
  defaultOptions,
  environments,
  getEnvironmentConfig,
};
