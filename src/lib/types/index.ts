/**
 * Types Module Barrel Export
 *
 * Provides centralized access to all TypeScript type definitions.
 *
 * @module lib/types
 */

// Contact entity types
export {
  Contact,
  ContactCreatePayload,
  ContactUpdatePayload,
  ContactSummary,
  ContactState,
  ContactStatusActive,
  ContactStatusInactive,
  PreferredContactMethod,
  Gender,
  FamilyStatus,
  ContactFields,
} from './contact.types';
