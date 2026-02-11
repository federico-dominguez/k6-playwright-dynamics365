/**
 * Dynamics 365 Contact Entity Type Definitions
 *
 * Provides TypeScript interfaces for Contact entity operations.
 * Based on Dynamics 365 CE Contact entity schema.
 *
 * @module lib/types/contact
 * @see https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/contact
 */

/**
 * Contact entity - represents a person with whom a business unit has a relationship
 *
 * @example
 * const contact: Contact = {
 *   firstname: 'John',
 *   lastname: 'Doe',
 *   emailaddress1: 'john.doe@example.com'
 * };
 */
export interface Contact {
  /** Unique identifier for the contact (GUID) */
  contactid?: string;

  // ============================================
  // Name fields
  // ============================================
  /** First name */
  firstname?: string;
  /** Middle name */
  middlename?: string;
  /** Last name */
  lastname?: string;
  /** Full name (read-only, computed) */
  fullname?: string;
  /** Nickname */
  nickname?: string;
  /** Suffix (e.g., Jr., Sr., III) */
  suffix?: string;
  /** Salutation (e.g., Mr., Ms., Dr.) */
  salutation?: string;

  // ============================================
  // Contact information
  // ============================================
  /** Primary email address */
  emailaddress1?: string;
  /** Secondary email address */
  emailaddress2?: string;
  /** Third email address */
  emailaddress3?: string;
  /** Business phone */
  telephone1?: string;
  /** Home phone */
  telephone2?: string;
  /** Other phone */
  telephone3?: string;
  /** Mobile phone */
  mobilephone?: string;
  /** Fax number */
  fax?: string;
  /** Pager number */
  pager?: string;

  // ============================================
  // Professional information
  // ============================================
  /** Job title */
  jobtitle?: string;
  /** Department */
  department?: string;
  /** Manager's name */
  managername?: string;
  /** Manager's phone */
  managerphone?: string;
  /** Assistant's name */
  assistantname?: string;
  /** Assistant's phone */
  assistantphone?: string;
  /** Company name (text field, not lookup) */
  company?: string;

  // ============================================
  // Primary address (address1)
  // ============================================
  /** Address line 1 */
  address1_line1?: string;
  /** Address line 2 */
  address1_line2?: string;
  /** Address line 3 */
  address1_line3?: string;
  /** City */
  address1_city?: string;
  /** State or province */
  address1_stateorprovince?: string;
  /** ZIP or postal code */
  address1_postalcode?: string;
  /** Country/Region */
  address1_country?: string;
  /** County */
  address1_county?: string;
  /** Address name */
  address1_name?: string;
  /** Latitude */
  address1_latitude?: number;
  /** Longitude */
  address1_longitude?: number;
  /** Address type (1=Bill To, 2=Ship To, 3=Primary, 4=Other) */
  address1_addresstypecode?: number;
  /** Freight terms */
  address1_freighttermscode?: number;
  /** Shipping method */
  address1_shippingmethodcode?: number;

  // ============================================
  // Secondary address (address2)
  // ============================================
  /** Address line 1 */
  address2_line1?: string;
  /** Address line 2 */
  address2_line2?: string;
  /** Address line 3 */
  address2_line3?: string;
  /** City */
  address2_city?: string;
  /** State or province */
  address2_stateorprovince?: string;
  /** ZIP or postal code */
  address2_postalcode?: string;
  /** Country/Region */
  address2_country?: string;

  // ============================================
  // Personal information
  // ============================================
  /** Birthday */
  birthdate?: string;
  /** Anniversary date */
  anniversary?: string;
  /** Gender (1=Male, 2=Female) */
  gendercode?: number;
  /** Family status (1=Single, 2=Married, 3=Divorced, 4=Widowed) */
  familystatuscode?: number;
  /** Spouse/Partner name */
  spousesname?: string;
  /** Number of children */
  numberofchildren?: number;

  // ============================================
  // Business information
  // ============================================
  /** Annual income */
  annualincome?: number;
  /** Credit limit */
  creditlimit?: number;
  /** Credit on hold flag */
  creditonhold?: boolean;
  /** Do not allow bulk emails */
  donotbulkemail?: boolean;
  /** Do not allow bulk postal mail */
  donotbulkpostalmail?: boolean;
  /** Do not allow emails */
  donotemail?: boolean;
  /** Do not allow faxes */
  donotfax?: boolean;
  /** Do not allow phone calls */
  donotphone?: boolean;
  /** Do not allow postal mail */
  donotpostalmail?: boolean;
  /** Do not send marketing materials */
  donotsendmm?: boolean;

  // ============================================
  // Social profiles
  // ============================================
  /** Website URL */
  websiteurl?: string;
  /** FTP site URL */
  ftpsiteurl?: string;

  // ============================================
  // Description/Notes
  // ============================================
  /** Description/Notes */
  description?: string;

  // ============================================
  // Status fields
  // ============================================
  /** State code (0=Active, 1=Inactive) */
  statecode?: number;
  /** Status reason code */
  statuscode?: number;

  // ============================================
  // Lookup fields (single-valued navigation properties)
  // ============================================
  /** Parent customer account ID (lookup) */
  _parentcustomerid_value?: string;
  /** Owning user ID */
  _owninguser_value?: string;
  /** Owning team ID */
  _owningteam_value?: string;
  /** Owning business unit ID */
  _owningbusinessunit_value?: string;
  /** Originating lead ID */
  _originatingleadid_value?: string;
  /** Preferred system user ID */
  _preferredsystemuserid_value?: string;
  /** Transaction currency ID */
  _transactioncurrencyid_value?: string;

  // ============================================
  // Preference fields
  // ============================================
  /** Preferred contact method (1=Any, 2=Email, 3=Phone, 4=Fax, 5=Mail) */
  preferredcontactmethodcode?: number;
  /** Preferred appointment day (0=Sunday, 1=Monday, ..., 6=Saturday) */
  preferredappointmentdaycode?: number;
  /** Preferred appointment time (1=Morning, 2=Afternoon, 3=Evening) */
  preferredappointmenttimecode?: number;

  // ============================================
  // System fields (read-only)
  // ============================================
  /** Created on date */
  createdon?: string;
  /** Modified on date */
  modifiedon?: string;
  /** Version number */
  versionnumber?: number;

  // ============================================
  // Expanded navigation properties
  // ============================================
  /** Parent account (expanded) */
  parentcustomerid_account?: {
    accountid?: string;
    name?: string;
    [key: string]: unknown;
  };

  /** Allow additional/custom fields */
  [key: string]: unknown;
}

/**
 * Contact creation payload - fields typically set when creating a new contact
 */
export interface ContactCreatePayload {
  firstname: string;
  lastname: string;
  emailaddress1?: string;
  telephone1?: string;
  mobilephone?: string;
  jobtitle?: string;
  department?: string;
  address1_line1?: string;
  address1_city?: string;
  address1_stateorprovince?: string;
  address1_postalcode?: string;
  address1_country?: string;
  description?: string;
  /** OData bind to parent account */
  'parentcustomerid_account@odata.bind'?: string;
  /** Allow additional fields */
  [key: string]: unknown;
}

/**
 * Contact update payload - partial contact fields for updates
 */
export type ContactUpdatePayload = Partial<Omit<Contact, 'contactid' | 'createdon' | 'modifiedon' | 'versionnumber' | 'fullname'>>;

/**
 * Contact query result with commonly selected fields
 */
export interface ContactSummary {
  contactid: string;
  fullname: string;
  firstname?: string;
  lastname?: string;
  emailaddress1?: string;
  telephone1?: string;
  jobtitle?: string;
  statecode: number;
}

/**
 * Contact state codes
 */
export const ContactState = {
  Active: 0,
  Inactive: 1,
} as const;

/**
 * Contact status reason codes (for Active state)
 */
export const ContactStatusActive = {
  Active: 1,
} as const;

/**
 * Contact status reason codes (for Inactive state)
 */
export const ContactStatusInactive = {
  Inactive: 2,
} as const;

/**
 * Preferred contact method options
 */
export const PreferredContactMethod = {
  Any: 1,
  Email: 2,
  Phone: 3,
  Fax: 4,
  Mail: 5,
} as const;

/**
 * Gender options
 */
export const Gender = {
  Male: 1,
  Female: 2,
} as const;

/**
 * Family status options
 */
export const FamilyStatus = {
  Single: 1,
  Married: 2,
  Divorced: 3,
  Widowed: 4,
} as const;

/**
 * Common field sets for Contact queries
 */
export const ContactFields = {
  /** Minimal fields for lists */
  minimal: ['contactid', 'fullname', 'emailaddress1', 'statecode'],
  
  /** Summary fields for grids */
  summary: [
    'contactid', 'fullname', 'firstname', 'lastname',
    'emailaddress1', 'telephone1', 'jobtitle', 'statecode',
  ],
  
  /** Detail fields for forms */
  detail: [
    'contactid', 'fullname', 'firstname', 'middlename', 'lastname',
    'emailaddress1', 'emailaddress2', 'telephone1', 'mobilephone',
    'jobtitle', 'department', 'address1_line1', 'address1_city',
    'address1_stateorprovince', 'address1_postalcode', 'address1_country',
    'description', 'statecode', 'statuscode', 'createdon', 'modifiedon',
    '_parentcustomerid_value',
  ],
  
  /** All common fields */
  all: [
    'contactid', 'fullname', 'firstname', 'middlename', 'lastname', 'nickname',
    'suffix', 'salutation', 'emailaddress1', 'emailaddress2', 'emailaddress3',
    'telephone1', 'telephone2', 'telephone3', 'mobilephone', 'fax',
    'jobtitle', 'department', 'managername', 'managerphone',
    'assistantname', 'assistantphone', 'company',
    'address1_line1', 'address1_line2', 'address1_line3', 'address1_city',
    'address1_stateorprovince', 'address1_postalcode', 'address1_country',
    'address2_line1', 'address2_city', 'address2_stateorprovince',
    'address2_postalcode', 'address2_country',
    'birthdate', 'anniversary', 'gendercode', 'familystatuscode', 'spousesname',
    'annualincome', 'creditlimit', 'creditonhold',
    'websiteurl', 'description',
    'statecode', 'statuscode', 'createdon', 'modifiedon',
    '_parentcustomerid_value', '_owninguser_value',
    'donotbulkemail', 'donotemail', 'donotphone', 'donotpostalmail',
  ],
} as const;
