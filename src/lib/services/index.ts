/**
 * Services Module Barrel Export
 *
 * Provides centralized access to all service classes for Dynamics 365 entity operations.
 *
 * @module lib/services
 */

// Base service and types
export {
  BaseService,
  ApiResponse,
  ODataCollectionResponse,
  ServiceOptions,
} from './base.service';

// Contact service
export { ContactService, contactService } from './contact.service';

// Entity-specific services will be exported here as they are implemented
// export { AccountService, accountService } from './account.service';
