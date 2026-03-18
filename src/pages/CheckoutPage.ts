import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/**
 * Page Object covering both Checkout steps on the Sauce Demo app:
 *
 *  - **Step One** (`/checkout-step-one.html`) — Shipping information form
 *  - **Step Two** (`/checkout-step-two.html`) — Order summary / overview
 *
 * The class exposes distinct groups of locators for each step an named helper
 * methods so that tests read as a clean high-level narrative.
 */
export class CheckoutPage extends BasePage {
  // ── Step 1: Your Information ───────────────────────────────────────────────
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueBtn: Locator;
  readonly cancelBtnStepOne: Locator;
  readonly errorMessage: Locator;

  // ── Step 2: Overview ───────────────────────────────────────────────────────
  readonly summaryItems: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishBtn: Locator;
  readonly cancelBtnStepTwo: Locator;

  // ── Confirmation ───────────────────────────────────────────────────────────
  readonly confirmationHeader: Locator;

  constructor(page: Page) {
    super(page);

    // Step 1 locators
    this.firstNameInput  = page.locator('[data-test="firstName"]');
    this.lastNameInput   = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueBtn     = page.locator('[data-test="continue"]');
    this.cancelBtnStepOne = page.locator('[data-test="cancel"]');
    this.errorMessage    = page.locator('[data-test="error"]');

    // Step 2 locators
    this.summaryItems    = page.locator('[data-test="inventory-item"]');
    this.subtotalLabel   = page.locator('[data-test="subtotal-label"]');
    this.taxLabel        = page.locator('[data-test="tax-label"]');
    this.totalLabel      = page.locator('[data-test="total-label"]');
    this.finishBtn       = page.locator('[data-test="finish"]');
    this.cancelBtnStepTwo = page.locator('[data-test="cancel"]');

    // Confirmation
    this.confirmationHeader = page.locator('[data-test="complete-header"]');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async navigateToStepOne(): Promise<void> {
    await this.goto('/checkout-step-one.html');
  }

  async navigateToStepTwo(): Promise<void> {
    await this.goto('/checkout-step-two.html');
  }

  // ── Step 1 Interactions ────────────────────────────────────────────────────

  /** Fill the shipping information form fields individually. */
  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastNameInput.fill(value);
  }

  async fillPostalCode(value: string): Promise<void> {
    await this.postalCodeInput.fill(value);
  }

  /**
   * Convenience method: fill all shipping info fields and click Continue.
   * Accepts a {@link ShippingInfo} object — no raw strings in test code.
   */
  async fillShippingInfo(info: ShippingInfo): Promise<void> {
    await this.fillFirstName(info.firstName);
    await this.fillLastName(info.lastName);
    await this.fillPostalCode(info.postalCode);
  }

  /** Click the "Continue" button on Step 1. */
  async clickContinue(): Promise<void> {
    await this.continueBtn.click();
  }

  /** Click "Cancel" on Step 1 to go back to the cart. */
  async cancelStepOne(): Promise<void> {
    await this.cancelBtnStepOne.click();
  }

  /** Returns the Step 1 error message text, or null if no error is shown. */
  async getErrorMessage(): Promise<string | null> {
    const visible = await this.errorMessage.isVisible();
    return visible ? this.errorMessage.innerText() : null;
  }

  // ── Step 2 Interactions ────────────────────────────────────────────────────

  /** Click "Finish" to place the order. */
  async clickFinish(): Promise<void> {
    await this.finishBtn.click();
  }

  /** Click "Cancel" on Step 2 to go back to the inventory. */
  async cancelStepTwo(): Promise<void> {
    await this.cancelBtnStepTwo.click();
  }

  /** Returns the subtotal text (e.g. "Item total: $29.99"). */
  async getSubtotal(): Promise<string> {
    return this.subtotalLabel.innerText();
  }

  /** Returns the tax text (e.g. "Tax: $2.40"). */
  async getTax(): Promise<string> {
    return this.taxLabel.innerText();
  }

  /** Returns the total text (e.g. "Total: $32.39"). */
  async getTotal(): Promise<string> {
    return this.totalLabel.innerText();
  }

  /** Returns the number of summary items on the overview page. */
  async getSummaryItemCount(): Promise<number> {
    return this.summaryItems.count();
  }
}
