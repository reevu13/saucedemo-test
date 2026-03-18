import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Sauce Demo Cart screen.
 * URL: https://www.saucedemo.com/cart.html
 */
export class CartPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────
  readonly cartItems: Locator;
  readonly continueShoppingBtn: Locator;
  readonly checkoutBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems           = page.locator('[data-test="inventory-item"]');
    this.continueShoppingBtn = page.locator('[data-test="continue-shopping"]');
    this.checkoutBtn         = page.locator('[data-test="checkout"]');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /** Navigate directly to the cart page (requires an active session). */
  async navigate(): Promise<void> {
    await this.goto('/cart.html');
  }

  // ── Item-level locators ────────────────────────────────────────────────────

  /** Returns the name locator for a cart item scoped by index (0-based). */
  itemName(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="inventory-item-name"]');
  }

  /** Returns the quantity locator for a cart item scoped by index (0-based). */
  itemQuantity(index: number): Locator {
    return this.cartItems.nth(index).locator('[data-test="item-quantity"]');
  }

  /**
   * Returns the "Remove" button for a cart item identified by its URL-slug,
   * e.g. `'sauce-labs-backpack'`.
   */
  removeBtn(itemSlug: string): Locator {
    return this.page.locator(`[data-test="remove-${itemSlug}"]`);
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  /** Click the "Remove" button for a specific cart item. */
  async removeItem(itemSlug: string): Promise<void> {
    await this.removeBtn(itemSlug).click();
  }

  /** Click "Continue Shopping" to return to the inventory page. */
  async continueShopping(): Promise<void> {
    await this.continueShoppingBtn.click();
  }

  /** Click "Checkout" to proceed to the checkout flow. */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutBtn.click();
  }

  /** Returns the total number of items currently in the cart. */
  async getItemCount(): Promise<number> {
    return this.cartItems.count();
  }
}
