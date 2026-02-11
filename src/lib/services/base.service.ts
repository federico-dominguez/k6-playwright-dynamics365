/**
 * Base Service Class for Dynamics 365 Entity Operations
 *
 * Provides common CRUD operations for Dynamics 365 Web API.
 * Extend this class to create entity-specific services.
 *
 * @module lib/services/base
 */

import http, { RefinedResponse, ResponseType } from 'k6/http';
import { check } from 'k6';
import { dynamics365Config } from '@config/index';
import { getAuthHeaders } from '@lib/auth';
import { ODataQueryOptions, ODataBuilder } from '@lib/helpers/odata-builder';

/** Standard API response with parsed data */
export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T | null;
  headers: Record<string, string>;
  error?: string;
}

/** OData collection response structure */
export interface ODataCollectionResponse<T> {
  '@odata.context': string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

/** Options for service operations */
export interface ServiceOptions {
  /** Custom tags for k6 metrics */
  tags?: Record<string, string>;
  /** Suppress k6 check assertions */
  suppressChecks?: boolean;
}

/**
 * Abstract Base Service implementing common CRUD operations.
 * Extend this class to create entity-specific services.
 *
 * @abstract
 * @example
 * class ContactService extends BaseService<Contact> {
 *   constructor() {
 *     super('contacts');
 *   }
 * }
 */
export abstract class BaseService<T extends Record<string, unknown> = Record<string, unknown>> {
  /** Dynamics 365 entity logical name (plural) */
  protected readonly entityName: string;

  /** Base API URL */
  protected readonly apiUrl: string;

  /**
   * Creates a new BaseService instance
   * @param {string} entityName - Dynamics 365 entity logical name (plural, e.g., 'contacts')
   */
  constructor(entityName: string) {
    this.entityName = entityName;
    this.apiUrl = dynamics365Config.apiUrl;
  }

  /**
   * Get the full entity set URL
   * @returns {string} Full URL to entity set
   */
  protected getEntityUrl(): string {
    return `${this.apiUrl}/${this.entityName}`;
  }

  /**
   * Get URL for a specific entity record
   * @param {string} id - Entity record GUID
   * @returns {string} Full URL to entity record
   */
  protected getRecordUrl(id: string): string {
    return `${this.getEntityUrl()}(${id})`;
  }

  /**
   * Parse response and extract entity ID from OData-EntityId header
   * @param {RefinedResponse<ResponseType>} response - HTTP response
   * @returns {string | null} Entity GUID or null
   */
  protected extractEntityId(response: RefinedResponse<ResponseType>): string | null {
    const entityIdHeader = response.headers['Odata-Entityid'] || response.headers['odata-entityid'];
    if (entityIdHeader) {
      const match = entityIdHeader.match(/\(([0-9a-f-]+)\)/i);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Create a new entity record
   *
   * @param {Partial<T>} data - Entity data to create
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<{ id: string }>} Response with created entity ID
   *
   * @example
   * const result = contactService.create({
   *   firstname: 'John',
   *   lastname: 'Doe',
   *   emailaddress1: 'john.doe@example.com'
   * });
   */
  create(data: Partial<T>, options: ServiceOptions = {}): ApiResponse<{ id: string }> {
    const headers = getAuthHeaders();
    const url = this.getEntityUrl();

    const response = http.post(url, JSON.stringify(data), {
      headers,
      tags: { entity: this.entityName, operation: 'create', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: create status is 204`]: r => r.status === 204,
    });

    const entityId = this.extractEntityId(response);

    return {
      success,
      status: response.status,
      data: entityId ? { id: entityId } : null,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Retrieve a single entity record by ID
   *
   * @param {string} id - Entity record GUID
   * @param {string[]} select - Fields to retrieve (optional)
   * @param {string[]} expand - Related entities to expand (optional)
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<T>} Response with entity data
   *
   * @example
   * const contact = contactService.getById('00000000-0000-0000-0000-000000000001');
   * const contactWithAccount = contactService.getById(id, ['firstname', 'lastname'], ['parentcustomerid_account']);
   */
  getById(
    id: string,
    select?: string[],
    expand?: string[],
    options: ServiceOptions = {}
  ): ApiResponse<T> {
    const headers = getAuthHeaders();
    let url = this.getRecordUrl(id);

    // Build query string
    const queryParams: string[] = [];
    if (select?.length) {
      queryParams.push(`$select=${select.join(',')}`);
    }
    if (expand?.length) {
      queryParams.push(`$expand=${expand.join(',')}`);
    }
    if (queryParams.length) {
      url += `?${queryParams.join('&')}`;
    }

    const response = http.get(url, {
      headers,
      tags: { entity: this.entityName, operation: 'getById', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: getById status is 200`]: r => r.status === 200,
    });

    let data: T | null = null;
    if (success && response.body) {
      try {
        data = JSON.parse(response.body as string) as T;
      } catch {
        // Parse error - leave data as null
      }
    }

    return {
      success,
      status: response.status,
      data,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Query entity records with OData options
   *
   * @param {ODataQueryOptions} queryOptions - OData query parameters
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<ODataCollectionResponse<T>>} Response with collection of entities
   *
   * @example
   * const activeContacts = contactService.query({
   *   select: ['firstname', 'lastname', 'emailaddress1'],
   *   filter: "statecode eq 0",
   *   orderBy: 'lastname asc',
   *   top: 50
   * });
   */
  query(
    queryOptions: ODataQueryOptions = {},
    options: ServiceOptions = {}
  ): ApiResponse<ODataCollectionResponse<T>> {
    const headers = getAuthHeaders();
    const queryString = ODataBuilder.build(queryOptions);
    const url = queryString ? `${this.getEntityUrl()}?${queryString}` : this.getEntityUrl();

    const response = http.get(url, {
      headers,
      tags: { entity: this.entityName, operation: 'query', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: query status is 200`]: r => r.status === 200,
    });

    let data: ODataCollectionResponse<T> | null = null;
    if (success && response.body) {
      try {
        data = JSON.parse(response.body as string) as ODataCollectionResponse<T>;
      } catch {
        // Parse error - leave data as null
      }
    }

    return {
      success,
      status: response.status,
      data,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Update an existing entity record (PATCH)
   *
   * @param {string} id - Entity record GUID
   * @param {Partial<T>} data - Fields to update
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<void>} Response indicating success/failure
   *
   * @example
   * contactService.update('00000000-0000-0000-0000-000000000001', {
   *   jobtitle: 'Senior Developer'
   * });
   */
  update(id: string, data: Partial<T>, options: ServiceOptions = {}): ApiResponse<void> {
    const headers = getAuthHeaders();
    const url = this.getRecordUrl(id);

    const response = http.patch(url, JSON.stringify(data), {
      headers,
      tags: { entity: this.entityName, operation: 'update', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: update status is 204`]: r => r.status === 204,
    });

    return {
      success,
      status: response.status,
      data: null,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Delete an entity record
   *
   * @param {string} id - Entity record GUID
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<void>} Response indicating success/failure
   *
   * @example
   * contactService.delete('00000000-0000-0000-0000-000000000001');
   */
  delete(id: string, options: ServiceOptions = {}): ApiResponse<void> {
    const headers = getAuthHeaders();
    const url = this.getRecordUrl(id);

    const response = http.del(url, null, {
      headers,
      tags: { entity: this.entityName, operation: 'delete', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: delete status is 204`]: r => r.status === 204,
    });

    return {
      success,
      status: response.status,
      data: null,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Upsert (create or update) an entity record using alternate key
   *
   * @param {string} alternateKey - Alternate key in format: keyName='keyValue'
   * @param {Partial<T>} data - Entity data
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<{ id: string; created: boolean }>} Response with entity ID and creation status
   *
   * @example
   * contactService.upsert("emailaddress1='john@example.com'", {
   *   firstname: 'John',
   *   lastname: 'Doe'
   * });
   */
  upsert(
    alternateKey: string,
    data: Partial<T>,
    options: ServiceOptions = {}
  ): ApiResponse<{ id: string; created: boolean }> {
    const headers = getAuthHeaders();
    const url = `${this.getEntityUrl()}(${alternateKey})`;

    const response = http.patch(url, JSON.stringify(data), {
      headers,
      tags: { entity: this.entityName, operation: 'upsert', ...options.tags },
    });

    // 204 = updated, 201 = created
    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: upsert status is 204 or 201`]: r => r.status === 204 || r.status === 201,
    });

    const entityId = this.extractEntityId(response);
    const created = response.status === 201;

    return {
      success,
      status: response.status,
      data: entityId ? { id: entityId, created } : null,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Associate two entity records (N:1 or N:N relationship)
   *
   * @param {string} id - Source entity record GUID
   * @param {string} navigationProperty - Relationship navigation property name
   * @param {string} targetEntitySet - Target entity set name (e.g., 'accounts')
   * @param {string} targetId - Target entity record GUID
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<void>} Response indicating success/failure
   *
   * @example
   * contactService.associate(contactId, 'parentcustomerid_account', 'accounts', accountId);
   */
  associate(
    id: string,
    navigationProperty: string,
    targetEntitySet: string,
    targetId: string,
    options: ServiceOptions = {}
  ): ApiResponse<void> {
    const headers = getAuthHeaders();
    const url = `${this.getRecordUrl(id)}/${navigationProperty}/$ref`;

    const body = {
      '@odata.id': `${this.apiUrl}/${targetEntitySet}(${targetId})`,
    };

    const response = http.put(url, JSON.stringify(body), {
      headers,
      tags: { entity: this.entityName, operation: 'associate', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: associate status is 204`]: r => r.status === 204,
    });

    return {
      success,
      status: response.status,
      data: null,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Disassociate two entity records
   *
   * @param {string} id - Source entity record GUID
   * @param {string} navigationProperty - Relationship navigation property name
   * @param {string} targetId - Target entity record GUID (only for N:N relationships)
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<void>} Response indicating success/failure
   *
   * @example
   * // Single-valued navigation property (N:1)
   * contactService.disassociate(contactId, 'parentcustomerid_account');
   *
   * // Collection-valued navigation property (N:N)
   * contactService.disassociate(contactId, 'contact_customer_accounts', targetAccountId);
   */
  disassociate(
    id: string,
    navigationProperty: string,
    targetId?: string,
    options: ServiceOptions = {}
  ): ApiResponse<void> {
    const headers = getAuthHeaders();
    let url = `${this.getRecordUrl(id)}/${navigationProperty}/$ref`;

    // For collection-valued navigation properties, append target ID
    if (targetId) {
      url += `?$id=${this.apiUrl}/${navigationProperty}(${targetId})`;
    }

    const response = http.del(url, null, {
      headers,
      tags: { entity: this.entityName, operation: 'disassociate', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: disassociate status is 204`]: r => r.status === 204,
    });

    return {
      success,
      status: response.status,
      data: null,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }

  /**
   * Count entity records matching optional filter
   *
   * @param {string} filter - OData filter expression (optional)
   * @param {ServiceOptions} options - Operation options
   * @returns {ApiResponse<number>} Response with record count
   *
   * @example
   * const totalContacts = contactService.count();
   * const activeContacts = contactService.count("statecode eq 0");
   */
  count(filter?: string, options: ServiceOptions = {}): ApiResponse<number> {
    const headers = getAuthHeaders();

    // D365 Web API: Use $count=true with query for filtered counts
    // Use $select with minimal field and $top=1 to minimize data transfer
    let url: string;
    if (filter) {
      // Query with $count=true to get @odata.count in response
      const primaryKey = this.entityName.endsWith('s')
        ? this.entityName.slice(0, -1) + 'id'
        : this.entityName + 'id';
      url = `${this.getEntityUrl()}?$select=${primaryKey}&$filter=${encodeURIComponent(filter)}&$count=true&$top=1`;
    } else {
      // Simple count without filter - /$count suffix works
      url = `${this.getEntityUrl()}/$count`;
    }

    const response = http.get(url, {
      headers,
      tags: { entity: this.entityName, operation: 'count', ...options.tags },
    });

    const success = options.suppressChecks || check(response, {
      [`${this.entityName}: count status is 200`]: r => r.status === 200,
    });

    let count: number | null = null;
    if (success && response.body) {
      if (filter) {
        // Parse @odata.count from response
        try {
          const data = JSON.parse(response.body as string);
          count = data['@odata.count'] ?? null;
        } catch {
          // Parse error
        }
      } else {
        // Direct count response (plain number)
        count = parseInt(response.body as string, 10);
      }
    }

    return {
      success,
      status: response.status,
      data: count,
      headers: response.headers as Record<string, string>,
      error: !success ? (response.body as string) : undefined,
    };
  }
}
