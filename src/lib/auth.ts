/**
 * Dynamics 365 OAuth2 Authentication Module
 * 
 * Handles token acquisition using OAuth2 Client Credentials flow.
 * Implements token caching to minimize authentication requests and
 * improve test performance.
 * 
 * @module lib/auth
 */

import http from 'k6/http';
import { check } from 'k6';
import { dynamics365Config } from '@config/index';

/** OAuth2 token response structure */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/** Internal authentication state */
interface AuthState {
  token: string | null;
  expiresAt: number;
}

/** In-memory token cache (per Virtual User) */
const authState: AuthState = {
  token: null,
  expiresAt: 0,
};

/**
 * Acquire OAuth2 access token using Client Credentials flow.
 * Implements automatic token caching and refresh logic.
 * 
 * @returns {string} Valid OAuth2 access token
 * @throws {Error} If authentication configuration is missing or token acquisition fails
 * 
 * @example
 * const token = getAccessToken();
 * const headers = { 'Authorization': `Bearer ${token}` };
 */
export function getAccessToken(): string {
  const now = Date.now();
  const bufferMs = 60000; // Refresh token 1 minute before expiry

  // Return cached token if still valid
  if (authState.token && authState.expiresAt > now + bufferMs) {
    return authState.token;
  }

  const { clientId, clientSecret, tenantId, scope, tokenUrl } = dynamics365Config.auth;

  // Validate required configuration
  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      'Missing Dynamics 365 authentication configuration. ' +
      'Please set D365_CLIENT_ID, D365_CLIENT_SECRET, and D365_TENANT_ID in your .env file.'
    );
  }

  // Prepare token request
  const payload = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope,
  };

  const response = http.post(tokenUrl, payload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    tags: { name: 'auth' },
  });

  // Validate authentication response
  const success = check(response, {
    'auth: status is 200': r => r.status === 200,
    'auth: has access_token': r => {
      try {
        const body = JSON.parse(r.body as string);
        return !!body.access_token;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    throw new Error(`Authentication failed: ${response.status} - ${response.body}`);
  }

  const tokenData: TokenResponse = JSON.parse(response.body as string);

  // Update cache with new token and expiration time
  authState.token = tokenData.access_token;
  authState.expiresAt = now + tokenData.expires_in * 1000;

  return tokenData.access_token;
}

/**
 * Build standard authorization headers for Dynamics 365 Web API requests.
 * Automatically acquires and includes a valid OAuth2 access token.
 * 
 * @returns {Record<string, string>} Headers object with Bearer token and OData metadata
 * 
 * @example
 * const headers = getAuthHeaders();
 * const response = http.get(`${baseUrl}/api/data/v9.2/accounts`, { headers });
 */
export function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

/**
 * Clear cached authentication token.
 * Forces fresh token acquisition on next request.
 * Useful for testing token refresh behavior or simulating auth failures.
 * 
 * @example
 * clearTokenCache();
 * // Next API call will acquire a new token
 */
export function clearTokenCache(): void {
  authState.token = null;
  authState.expiresAt = 0;
}

/** Authentication module exports */
export default {
  getAccessToken,
  getAuthHeaders,
  clearTokenCache,
};
