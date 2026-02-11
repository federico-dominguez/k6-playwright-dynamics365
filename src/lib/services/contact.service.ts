/**
 * Contact Service for Dynamics 365 Web API
 *
 * Provides CRUD operations and business logic specific to Contact entity.
 * Extends BaseService with contact-specific functionality.
 *
 * @module lib/services/contact
 */

import { BaseService, ApiResponse, ODataCollectionResponse } from './base.service';
import { ODataQueryOptions, ODataFilters } from '@lib/helpers/odata-builder';
import {
  Contact,
  ContactCreatePayload,
  ContactUpdatePayload,
  ContactState,
  ContactFields,
} from '@lib/types/contact.types';

/**
 * Contact Service - handles all Contact entity operations
 *
 * @example
 * // Using singleton instance
 * import { contactService } from '@lib/services';
 * const result = contactService.create({ firstname: 'John', lastname: 'Doe' });
 *
 * // Or create new instance
 * const service = new ContactService();
 */
export class ContactService extends BaseService<Contact> {
  constructor() {
    super('contacts');
  }

  /**
   * Create a new contact
   *
   * @param {ContactCreatePayload} data - Contact data
   * @returns {ApiResponse<{ id: string }>} Response with created contact ID
   *
   * @example
   * const result = contactService.create({
   *   firstname: 'John',
   *   lastname: 'Doe',
   *   emailaddress1: 'john.doe@example.com',
   *   jobtitle: 'Developer'
   * });
   */
  createContact(data: ContactCreatePayload): ApiResponse<{ id: string }> {
    return this.create(data);
  }

  /**
   * Create a contact linked to a parent account
   *
   * @param {ContactCreatePayload} data - Contact data
   * @param {string} accountId - Parent account GUID
   * @returns {ApiResponse<{ id: string }>} Response with created contact ID
   *
   * @example
   * const result = contactService.createWithAccount(
   *   { firstname: 'John', lastname: 'Doe' },
   *   '00000000-0000-0000-0000-000000000001'
   * );
   */
  createWithAccount(
    data: ContactCreatePayload,
    accountId: string
  ): ApiResponse<{ id: string }> {
    const payload: ContactCreatePayload = {
      ...data,
      'parentcustomerid_account@odata.bind': `/accounts(${accountId})`,
    };
    return this.create(payload);
  }

  /**
   * Get contact by ID with optional field selection
   *
   * @param {string} id - Contact GUID
   * @param {keyof typeof ContactFields | string[]} fields - Field set name or array of fields
   * @returns {ApiResponse<Contact>} Response with contact data
   *
   * @example
   * // Using predefined field set
   * const contact = contactService.getContact(id, 'summary');
   *
   * // Using custom fields
   * const contact = contactService.getContact(id, ['firstname', 'lastname', 'emailaddress1']);
   */
  getContact(
    id: string,
    fields: keyof typeof ContactFields | string[] = 'detail'
  ): ApiResponse<Contact> {
    const select = Array.isArray(fields)
      ? fields
      : ContactFields[fields] as unknown as string[];
    return this.getById(id, select);
  }

  /**
   * Get contact with parent account expanded
   *
   * @param {string} id - Contact GUID
   * @returns {ApiResponse<Contact>} Response with contact and account data
   */
  getContactWithAccount(id: string): ApiResponse<Contact> {
    return this.getById(
      id,
      [...ContactFields.detail],
      ['parentcustomerid_account($select=accountid,name)']
    );
  }

  /**
   * Update contact fields
   *
   * @param {string} id - Contact GUID
   * @param {ContactUpdatePayload} data - Fields to update
   * @returns {ApiResponse<void>} Response indicating success/failure
   *
   * @example
   * contactService.updateContact(id, {
   *   jobtitle: 'Senior Developer',
   *   department: 'Engineering'
   * });
   */
  updateContact(id: string, data: ContactUpdatePayload): ApiResponse<void> {
    return this.update(id, data);
  }

  /**
   * Delete a contact
   *
   * @param {string} id - Contact GUID
   * @returns {ApiResponse<void>} Response indicating success/failure
   */
  deleteContact(id: string): ApiResponse<void> {
    return this.delete(id);
  }

  /**
   * Query contacts with OData options
   *
   * @param {ODataQueryOptions} queryOptions - OData query parameters
   * @returns {ApiResponse<ODataCollectionResponse<Contact>>} Response with contacts
   *
   * @example
   * const result = contactService.queryContacts({
   *   select: ContactFields.summary,
   *   filter: "statecode eq 0",
   *   orderBy: "lastname asc",
   *   top: 50
   * });
   */
  queryContacts(
    queryOptions: ODataQueryOptions = {}
  ): ApiResponse<ODataCollectionResponse<Contact>> {
    return this.query(queryOptions);
  }

  /**
   * Get all active contacts
   *
   * @param {number} top - Maximum records to return (default: 100)
   * @returns {ApiResponse<ODataCollectionResponse<Contact>>} Response with active contacts
   */
  getActiveContacts(top: number = 100): ApiResponse<ODataCollectionResponse<Contact>> {
    return this.query({
      select: ContactFields.summary as unknown as string[],
      filter: ODataFilters.active(),
      orderBy: 'lastname asc, firstname asc',
      top,
    });
  }

  /**
   * Search contacts by name or email
   *
   * @param {string} searchTerm - Search term
   * @param {number} top - Maximum records to return (default: 25)
   * @returns {ApiResponse<ODataCollectionResponse<Contact>>} Response with matching contacts
   *
   * @example
   * const result = contactService.searchContacts('john');
   * const result = contactService.searchContacts('example.com');
   */
  searchContacts(
    searchTerm: string,
    top: number = 25
  ): ApiResponse<ODataCollectionResponse<Contact>> {
    // Note: fullname is a computed field and cannot be used with contains()
    // Search in firstname, lastname, and email
    const filter = ODataFilters.and(
      ODataFilters.active(),
      ODataFilters.or(
        ODataFilters.contains('firstname', searchTerm),
        ODataFilters.contains('lastname', searchTerm),
        ODataFilters.contains('emailaddress1', searchTerm)
      )
    );

    return this.query({
      select: ContactFields.summary as unknown as string[],
      filter,
      orderBy: 'lastname asc, firstname asc',
      top,
    });
  }

  /**
   * Get contacts by parent account
   *
   * @param {string} accountId - Parent account GUID
   * @param {number} top - Maximum records to return (default: 50)
   * @returns {ApiResponse<ODataCollectionResponse<Contact>>} Response with contacts
   */
  getContactsByAccount(
    accountId: string,
    top: number = 50
  ): ApiResponse<ODataCollectionResponse<Contact>> {
    return this.query({
      select: ContactFields.summary as unknown as string[],
      filter: ODataFilters.and(
        ODataFilters.active(),
        ODataFilters.eq('_parentcustomerid_value', accountId)
      ),
      orderBy: 'lastname asc',
      top,
    });
  }

  /**
   * Link contact to parent account
   *
   * @param {string} contactId - Contact GUID
   * @param {string} accountId - Account GUID
   * @returns {ApiResponse<void>} Response indicating success/failure
   */
  linkToAccount(contactId: string, accountId: string): ApiResponse<void> {
    return this.associate(contactId, 'parentcustomerid_account', 'accounts', accountId);
  }

  /**
   * Unlink contact from parent account
   *
   * @param {string} contactId - Contact GUID
   * @returns {ApiResponse<void>} Response indicating success/failure
   */
  unlinkFromAccount(contactId: string): ApiResponse<void> {
    return this.disassociate(contactId, 'parentcustomerid_account');
  }

  /**
   * Deactivate a contact (set to inactive state)
   *
   * @param {string} id - Contact GUID
   * @returns {ApiResponse<void>} Response indicating success/failure
   */
  deactivate(id: string): ApiResponse<void> {
    return this.update(id, {
      statecode: ContactState.Inactive,
      statuscode: 2, // Inactive status
    });
  }

  /**
   * Reactivate a contact (set to active state)
   *
   * @param {string} id - Contact GUID
   * @returns {ApiResponse<void>} Response indicating success/failure
   */
  reactivate(id: string): ApiResponse<void> {
    return this.update(id, {
      statecode: ContactState.Active,
      statuscode: 1, // Active status
    });
  }

  /**
   * Count contacts with optional filter
   *
   * @param {string} filter - OData filter expression
   * @returns {ApiResponse<number>} Response with count
   *
   * @example
   * const total = contactService.countContacts();
   * const active = contactService.countContacts("statecode eq 0");
   */
  countContacts(filter?: string): ApiResponse<number> {
    return this.count(filter);
  }

  /**
   * Count active contacts
   *
   * @returns {ApiResponse<number>} Response with count of active contacts
   */
  countActiveContacts(): ApiResponse<number> {
    return this.count(ODataFilters.active());
  }

  /**
   * Upsert contact by email address (using alternate key if configured)
   *
   * @param {string} email - Email address as alternate key
   * @param {ContactCreatePayload} data - Contact data
   * @returns {ApiResponse<{ id: string; created: boolean }>} Response with ID and creation status
   *
   * @example
   * const result = contactService.upsertByEmail('john@example.com', {
   *   firstname: 'John',
   *   lastname: 'Doe'
   * });
   */
  upsertByEmail(
    email: string,
    data: ContactCreatePayload
  ): ApiResponse<{ id: string; created: boolean }> {
    return this.upsert(`emailaddress1='${email}'`, data);
  }

  /**
   * Get recently modified contacts
   *
   * @param {number} days - Number of days to look back (default: 7)
   * @param {number} top - Maximum records to return (default: 50)
   * @returns {ApiResponse<ODataCollectionResponse<Contact>>} Response with contacts
   */
  getRecentlyModified(
    days: number = 7,
    top: number = 50
  ): ApiResponse<ODataCollectionResponse<Contact>> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const isoDate = date.toISOString();

    return this.query({
      select: ContactFields.summary as unknown as string[],
      filter: `modifiedon ge ${isoDate}`,
      orderBy: 'modifiedon desc',
      top,
    });
  }

  /**
   * Get contacts with upcoming birthdays
   *
   * @param {number} top - Maximum records to return (default: 50)
   * @returns {ApiResponse<ODataCollectionResponse<Contact>>} Response with contacts
   */
  getUpcomingBirthdays(
    top: number = 50
  ): ApiResponse<ODataCollectionResponse<Contact>> {
    // This is simplified - a real implementation would need more complex date logic
    return this.query({
      select: [...ContactFields.summary as unknown as string[], 'birthdate'],
      filter: ODataFilters.and(
        ODataFilters.active(),
        ODataFilters.isNotNull('birthdate')
      ),
      orderBy: 'birthdate asc',
      top,
    });
  }
}

/** Singleton instance for convenience */
export const contactService = new ContactService();

export default ContactService;
