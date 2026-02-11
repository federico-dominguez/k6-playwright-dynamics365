/**
 * Contact Page Object for Dynamics 365
 *
 * Provides UI interaction methods for Contact entity forms and grids.
 * Implements the Page Object Model pattern for Dynamics 365 Model-Driven Apps.
 *
 * @module lib/pages/contact
 */

import { Page } from 'k6/browser';
import { check } from 'k6';
import BasePage, { PageOptions } from './base.page';
import { dynamics365Config } from '@config/index';
import { Contact } from '@lib/types/contact.types';

/**
 * Contact form field data for creating/editing contacts
 */
export interface ContactFormData {
  firstname?: string;
  lastname?: string;
  emailaddress1?: string;
  telephone1?: string;
  mobilephone?: string;
  jobtitle?: string;
  department?: string;
  address1_line1?: string;
  address1_city?: string;
  address1_stateorprovince?: string;
  address1_postalcode?: string;
  parentAccount?: string;
}

/**
 * Contact Page Object - handles Contact form and grid interactions
 *
 * @example
 * const contactPage = new ContactPage(page);
 * await contactPage.navigateToContactList();
 * await contactPage.clickNewContact();
 * await contactPage.fillContactForm({ firstname: 'John', lastname: 'Doe' });
 * await contactPage.saveContact();
 */
export class ContactPage extends BasePage {
  /** Current contact ID (if viewing/editing) */
  private currentContactId: string | null = null;

  /**
   * D365 UCI (Unified Client Interface) selectors for Contact entity
   * @private
   */
  private selectors = {
    // Navigation and commands
    newButton: 'button[aria-label="New"]',
    saveButton: 'button[aria-label="Save (CTRL+S)"]',
    saveAndCloseButton: 'button[aria-label="Save & Close"]',
    deleteButton: 'button[aria-label="Delete"]',
    deactivateButton: 'button[aria-label="Deactivate"]',
    activateButton: 'button[aria-label="Activate"]',
    refreshButton: 'button[aria-label="Refresh"]',

    // Form header
    formHeader: '[data-id="form-header"]',
    formTitle: '[data-id="header_title"]',
    recordStatus: '[data-id="header_statuscode"]',

    // Contact form fields (UCI data-id pattern)
    firstnameField: '[data-id="firstname.fieldControl-text-box-text"]',
    lastnameField: '[data-id="lastname.fieldControl-text-box-text"]',
    fullnameHeader: '[data-id="header_fullname"]',
    emailField: '[data-id="emailaddress1.fieldControl-text-box-text"]',
    businessPhoneField: '[data-id="telephone1.fieldControl-text-box-text"]',
    mobilePhoneField: '[data-id="mobilephone.fieldControl-text-box-text"]',
    jobTitleField: '[data-id="jobtitle.fieldControl-text-box-text"]',
    departmentField: '[data-id="department.fieldControl-text-box-text"]',

    // Address fields
    street1Field: '[data-id="address1_line1.fieldControl-text-box-text"]',
    cityField: '[data-id="address1_city.fieldControl-text-box-text"]',
    stateField: '[data-id="address1_stateorprovince.fieldControl-text-box-text"]',
    postalCodeField: '[data-id="address1_postalcode.fieldControl-text-box-text"]',

    // Lookup fields
    parentAccountLookup: '[data-id="parentcustomerid.fieldControl-LookupResultsDropdown_parentcustomerid_textInputBox_with_filter_new"]',
    parentAccountValue: '[data-id="parentcustomerid.fieldControl-LookupResultsDropdown_parentcustomerid_selected_tag_text"]',

    // Grid/List view selectors
    gridContainer: '[data-id="entity_control-pcf_grid_control_container"]',
    gridRows: '[data-id="entity_control"] div[data-lp-id*="contact"]',
    gridRowCheckbox: 'input[type="checkbox"]',
    gridSearchBox: '[data-id="entity_control-pcf_grid_control-search_box"]',
    gridSearchButton: '[data-id="entity_control-pcf_grid_control-search_icon"]',
    gridNoRecords: '[data-id="entity_control-pcf_grid_control-no_records_message"]',

    // Quick Create form
    quickCreateForm: '[data-id="quickCreate"]',
    quickCreateSave: '[data-id="quickCreateSaveBtn"]',
    quickCreateSaveAndNew: '[data-id="quickCreateSaveAndNewBtn"]',

    // Notifications and dialogs
    saveSuccessNotification: '[data-id="notificationWrapper"]',
    confirmDialog: '[data-id="confirmDialog"]',
    confirmDialogOk: '[data-id="ok_id"]',
    confirmDialogCancel: '[data-id="cancel_id"]',
    errorDialog: '[data-id="errorDialog"]',

    // Loading indicators
    loadingIndicator: '[data-id="loading"]',
    formLoadingOverlay: '[data-id="form-loading-overlay"]',

    // Tab navigation (common in D365 forms)
    summaryTab: '[data-id="tablist-SUMMARY_TAB"]',
    detailsTab: '[data-id="tablist-DETAILS_TAB"]',
  };

  constructor(page: Page, options: PageOptions = {}) {
    super(page, options);
  }

  /**
   * Get current contact ID
   * @returns {string | null} Contact GUID or null
   */
  getCurrentContactId(): string | null {
    return this.currentContactId;
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to Contact list view (grid)
   * @returns {Promise<void>}
   */
  async navigateToContactList(): Promise<void> {
    const url = `${dynamics365Config.orgUrl}/main.aspx?appid=&pagetype=entitylist&etn=contact`;
    await this.goto(url);
    await this.waitForGridLoad();
  }

  /**
   * Navigate to a specific contact record
   * @param {string} contactId - Contact GUID
   * @returns {Promise<void>}
   */
  async navigateToContact(contactId: string): Promise<void> {
    const url = `${dynamics365Config.orgUrl}/main.aspx?appid=&pagetype=entityrecord&etn=contact&id=${contactId}`;
    await this.goto(url);
    await this.waitForFormLoad();
    this.currentContactId = contactId;
  }

  /**
   * Navigate to create new contact form
   * @returns {Promise<void>}
   */
  async navigateToNewContact(): Promise<void> {
    const url = `${dynamics365Config.orgUrl}/main.aspx?appid=&pagetype=entityrecord&etn=contact`;
    await this.goto(url);
    await this.waitForFormLoad();
    this.currentContactId = null;
  }

  // ============================================
  // Form Interaction Methods
  // ============================================

  /**
   * Click New button to create a new contact (from list view)
   * @returns {Promise<void>}
   */
  async clickNewContact(): Promise<void> {
    await this.click(this.selectors.newButton);
    await this.waitForFormLoad();
    this.currentContactId = null;
  }

  /**
   * Fill contact form with provided data
   * @param {ContactFormData} data - Contact data to fill
   * @returns {Promise<void>}
   */
  async fillContactForm(data: ContactFormData): Promise<void> {
    if (data.firstname) {
      await this.fillField(this.selectors.firstnameField, data.firstname);
    }
    if (data.lastname) {
      await this.fillField(this.selectors.lastnameField, data.lastname);
    }
    if (data.emailaddress1) {
      await this.fillField(this.selectors.emailField, data.emailaddress1);
    }
    if (data.telephone1) {
      await this.fillField(this.selectors.businessPhoneField, data.telephone1);
    }
    if (data.mobilephone) {
      await this.fillField(this.selectors.mobilePhoneField, data.mobilephone);
    }
    if (data.jobtitle) {
      await this.fillField(this.selectors.jobTitleField, data.jobtitle);
    }
    if (data.department) {
      await this.fillField(this.selectors.departmentField, data.department);
    }
    if (data.address1_line1) {
      await this.fillField(this.selectors.street1Field, data.address1_line1);
    }
    if (data.address1_city) {
      await this.fillField(this.selectors.cityField, data.address1_city);
    }
    if (data.address1_stateorprovince) {
      await this.fillField(this.selectors.stateField, data.address1_stateorprovince);
    }
    if (data.address1_postalcode) {
      await this.fillField(this.selectors.postalCodeField, data.address1_postalcode);
    }
    if (data.parentAccount) {
      await this.setParentAccount(data.parentAccount);
    }
  }

  /**
   * Fill a specific form field with UCI handling
   * @param {string} selector - Field selector
   * @param {string} value - Value to enter
   * @private
   */
  private async fillField(selector: string, value: string): Promise<void> {
    try {
      const field = this.page.locator(selector);
      await field.waitFor({ state: 'visible', timeout: this.timeout });
      await field.click();
      await field.fill(''); // Clear existing value
      await field.fill(value);
      // Click elsewhere to trigger change event
      await this.page.locator(this.selectors.formHeader).click();
    } catch (error) {
      console.log(`Warning: Could not fill field ${selector}: ${error}`);
    }
  }

  /**
   * Set parent account lookup field
   * @param {string} accountName - Account name to search and select
   * @returns {Promise<void>}
   */
  async setParentAccount(accountName: string): Promise<void> {
    const lookupInput = this.page.locator(this.selectors.parentAccountLookup);
    await lookupInput.waitFor({ state: 'visible', timeout: this.timeout });
    await lookupInput.click();
    await lookupInput.fill(accountName);
    await this.page.waitForTimeout(1000);

    // Select first result from lookup dropdown
    const lookupResult = this.page.locator(`[data-id*="parentcustomerid"][aria-label*="${accountName}"]`);
    try {
      await lookupResult.waitFor({ state: 'visible', timeout: 5000 });
      await lookupResult.click();
    } catch {
      console.log(`Warning: Could not find account "${accountName}" in lookup`);
    }
  }

  /**
   * Save the contact record
   * @returns {Promise<boolean>} True if save was successful
   */
  async saveContact(): Promise<boolean> {
    await this.click(this.selectors.saveButton);
    await this.waitForSave();

    // Try to extract contact ID from URL after save
    const url = this.page.url();
    const idMatch = url.match(/id=([0-9a-f-]+)/i);
    if (idMatch) {
      this.currentContactId = idMatch[1];
    }

    return await this.isSaveSuccessful();
  }

  /**
   * Save and close the contact record
   * @returns {Promise<boolean>} True if save was successful
   */
  async saveAndCloseContact(): Promise<boolean> {
    await this.click(this.selectors.saveAndCloseButton);
    await this.waitForSave();
    return await this.isSaveSuccessful();
  }

  /**
   * Delete the current contact
   * @returns {Promise<void>}
   */
  async deleteContact(): Promise<void> {
    await this.click(this.selectors.deleteButton);
    await this.confirmDialog();
    this.currentContactId = null;
  }

  /**
   * Deactivate the current contact
   * @returns {Promise<void>}
   */
  async deactivateContact(): Promise<void> {
    await this.click(this.selectors.deactivateButton);
    await this.confirmDialog();
  }

  /**
   * Activate an inactive contact
   * @returns {Promise<void>}
   */
  async activateContact(): Promise<void> {
    await this.click(this.selectors.activateButton);
    await this.confirmDialog();
  }

  // ============================================
  // Form Reading Methods
  // ============================================

  /**
   * Get the full name displayed in form header
   * @returns {Promise<string | null>} Full name or null
   */
  async getContactFullName(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.fullnameHeader);
    } catch {
      return null;
    }
  }

  /**
   * Get current form field values
   * @returns {Promise<Partial<Contact>>} Contact data from form
   */
  async getFormValues(): Promise<Partial<Contact>> {
    const getValue = async (selector: string): Promise<string | undefined> => {
      try {
        const field = this.page.locator(selector);
        const value = await field.inputValue();
        return value || undefined;
      } catch {
        return undefined;
      }
    };

    return {
      firstname: await getValue(this.selectors.firstnameField),
      lastname: await getValue(this.selectors.lastnameField),
      emailaddress1: await getValue(this.selectors.emailField),
      telephone1: await getValue(this.selectors.businessPhoneField),
      mobilephone: await getValue(this.selectors.mobilePhoneField),
      jobtitle: await getValue(this.selectors.jobTitleField),
      department: await getValue(this.selectors.departmentField),
    };
  }

  /**
   * Get linked parent account name
   * @returns {Promise<string | null>} Account name or null
   */
  async getLinkedAccountName(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.parentAccountValue);
    } catch {
      return null;
    }
  }

  /**
   * Get record status (Active/Inactive)
   * @returns {Promise<string | null>} Status text or null
   */
  async getRecordStatus(): Promise<string | null> {
    try {
      return await this.getText(this.selectors.recordStatus);
    } catch {
      return null;
    }
  }

  // ============================================
  // Grid/List Methods
  // ============================================

  /**
   * Search for contacts in grid view
   * @param {string} searchText - Text to search
   * @returns {Promise<void>}
   */
  async searchContacts(searchText: string): Promise<void> {
    const searchBox = this.page.locator(this.selectors.gridSearchBox);
    await searchBox.waitFor({ state: 'visible', timeout: this.timeout });
    await searchBox.fill(searchText);
    await this.click(this.selectors.gridSearchButton);
    await this.waitForGridLoad();
  }

  /**
   * Get number of contacts displayed in grid
   * @returns {Promise<number>} Row count
   */
  async getGridRowCount(): Promise<number> {
    try {
      // Use page.$$ to get all matching elements
      const rows = await this.page.$$(this.selectors.gridRows);
      return rows.length;
    } catch {
      return 0;
    }
  }

  /**
   * Check if grid shows no records message
   * @returns {Promise<boolean>} True if no records found
   */
  async isGridEmpty(): Promise<boolean> {
    return await this.isVisible(this.selectors.gridNoRecords);
  }

  /**
   * Click on a specific row in the grid by index
   * @param {number} index - Row index (0-based)
   * @returns {Promise<void>}
   */
  async clickGridRow(index: number): Promise<void> {
    const rows = await this.page.$$(this.selectors.gridRows);
    if (rows.length > index) {
      await rows[index].click();
      await this.waitForFormLoad();
    } else {
      throw new Error(`Row index ${index} out of bounds (${rows.length} rows)`);
    }
  }

  /**
   * Select a row in the grid using checkbox
   * @param {number} index - Row index (0-based)
   * @returns {Promise<void>}
   */
  async selectGridRow(index: number): Promise<void> {
    const rows = await this.page.$$(this.selectors.gridRows);
    if (rows.length > index) {
      const checkbox = await rows[index].$(this.selectors.gridRowCheckbox);
      if (checkbox) {
        await checkbox.click();
      }
    } else {
      throw new Error(`Row index ${index} out of bounds (${rows.length} rows)`);
    }
  }

  // ============================================
  // Wait/Helper Methods
  // ============================================

  /**
   * Wait for form to fully load
   * @returns {Promise<void>}
   */
  async waitForFormLoad(): Promise<void> {
    // Wait for loading overlay to disappear
    try {
      const overlay = this.page.locator(this.selectors.formLoadingOverlay);
      await overlay.waitFor({ state: 'hidden', timeout: this.timeout });
    } catch {
      // Overlay may not appear for quick loads
    }

    // Wait for form header to be visible
    try {
      const header = this.page.locator(this.selectors.formHeader);
      await header.waitFor({ state: 'visible', timeout: this.timeout });
    } catch {
      // Form header might have different structure
    }

    // Additional wait for D365 async operations
    await this.waitForDynamicsLoad();
  }

  /**
   * Wait for grid to fully load
   * @returns {Promise<void>}
   */
  async waitForGridLoad(): Promise<void> {
    try {
      const grid = this.page.locator(this.selectors.gridContainer);
      await grid.waitFor({ state: 'visible', timeout: this.timeout });
    } catch {
      // Grid container might have different structure
    }
    await this.waitForDynamicsLoad();
  }

  /**
   * Wait for save operation to complete
   * @returns {Promise<void>}
   */
  async waitForSave(): Promise<void> {
    // Wait for loading to complete
    await this.waitForDynamicsLoad();
    // Additional wait for D365 save operation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if save was successful
   * @returns {Promise<boolean>} True if successful
   */
  async isSaveSuccessful(): Promise<boolean> {
    // Check for error dialog
    const hasError = await this.isVisible(this.selectors.errorDialog);
    if (hasError) {
      return false;
    }

    // Check URL has ID (indicating record was saved)
    const url = this.page.url();
    return url.includes('id=');
  }

  /**
   * Confirm a dialog (OK button)
   * @returns {Promise<void>}
   */
  async confirmDialog(): Promise<void> {
    try {
      const dialog = this.page.locator(this.selectors.confirmDialog);
      await dialog.waitFor({ state: 'visible', timeout: 5000 });
      await this.click(this.selectors.confirmDialogOk);
      await this.page.waitForTimeout(1000);
    } catch {
      // Dialog may not appear
    }
  }

  /**
   * Cancel a dialog
   * @returns {Promise<void>}
   */
  async cancelDialog(): Promise<void> {
    try {
      await this.click(this.selectors.confirmDialogCancel);
    } catch {
      // Dialog may not appear
    }
  }

  // ============================================
  // Verification Methods
  // ============================================

  /**
   * Verify contact was created successfully with k6 checks
   * @param {ContactFormData} expectedData - Expected contact data
   * @returns {Promise<boolean>} Check result
   */
  async verifyContactCreated(expectedData: ContactFormData): Promise<boolean> {
    const formValues = await this.getFormValues();
    const fullName = await this.getContactFullName();

    return check(null, {
      'contact form shows correct firstname': () =>
        formValues.firstname === expectedData.firstname,
      'contact form shows correct lastname': () =>
        formValues.lastname === expectedData.lastname,
      'contact full name displayed': () =>
        fullName !== null && fullName.includes(expectedData.firstname || ''),
      'contact has ID in URL': () => this.currentContactId !== null,
    });
  }

  /**
   * Verify contact list view is displayed
   * @returns {Promise<boolean>} Check result
   */
  async verifyOnContactList(): Promise<boolean> {
    const title = await this.page.title();
    return check(null, {
      'on contacts list page': () => title.toLowerCase().includes('contact'),
    });
  }

  // ============================================
  // Tab Navigation
  // ============================================

  /**
   * Switch to Summary tab
   * @returns {Promise<void>}
   */
  async switchToSummaryTab(): Promise<void> {
    await this.click(this.selectors.summaryTab);
    await this.page.waitForTimeout(500);
  }

  /**
   * Switch to Details tab
   * @returns {Promise<void>}
   */
  async switchToDetailsTab(): Promise<void> {
    await this.click(this.selectors.detailsTab);
    await this.page.waitForTimeout(500);
  }
}

export default ContactPage;
