/**
 * Dynamics 365 OAuth2 Authentication Module
 * Handles token acquisition using Client Credentials flow
 */

import http from 'k6/http';
import { check } from 'k6';
import { dynamics365Config } from '@config/index';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AuthState {
  token: string | null;
  expiresAt: number;
}

// In-memory token cache (per VU)
const authState: AuthState = {
  token: null,
  expiresAt: 0,
};

/**
 * Acquire OAuth2 access token using Client Credentials flow
 * Implements token caching to minimize auth requests
 */
export function getAccessToken(): string {
  const now = Date.now();
  const bufferMs = 60000; // Refresh 1 minute before expiry

  // Return cached token if still valid
  if (authState.token && authState.expiresAt > now + bufferMs) {
    return authState.token;
  }

  const { clientId, clientSecret, tenantId, scope, tokenUrl } = dynamics365Config.auth;

  // Validate configuration
  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      'Missing Dynamics 365 authentication configuration. ' +
        'Please set D365_CLIENT_ID, D365_CLIENT_SECRET, and D365_TENANT_ID environment variables.'
    );
  }

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

  // Cache the token
  authState.token = tokenData.access_token;
  authState.expiresAt = now + tokenData.expires_in * 1000;

  return tokenData.access_token;
}

/**
 * Get authorization headers for API requests
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
 * Clear cached token (useful for testing auth failures)
 */
export function clearTokenCache(): void {
  authState.token = null;
  authState.expiresAt = 0;
}

export default {
  getAccessToken,
  getAuthHeaders,
  clearTokenCache,
};
