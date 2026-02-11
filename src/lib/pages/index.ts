/**
 * Pages Module Barrel Export
 *
 * Provides centralized access to all Page Object classes.
 *
 * @module lib/pages
 */

// Base page
export { BasePage, PageOptions } from './base.page';

// Entity pages
export { LoginPage } from './login.page';
export { ContactPage, ContactFormData } from './contact.page';

// Future pages will be exported here
// export { AccountPage } from './account.page';
