import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Sort option values accepted by the inventory sort dropdown. */
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/**
 * Page Object for the Sauce Demo Inventory (Products) screen.
 * URL: https://www.saucedemo.com/inventory.html
 */
export class InventoryPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────
  readonly pageTitle: Locator;
  readonly inventoryItems: Locator;
  readonly sortDropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle      = page.locator('[data-test="title"]');
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
    this.sortDropdown   = page.locator('[data-test="product-sort-container"]');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /** Navigate directly to the inventory page (requires an active session). */
  async navigate(): Promise<void> {
    await this.goto('/inventory.html');
  }

  // ── Item-level locators ────────────────────────────────────────────────────

  /**
   * Returns the name locator for an item scoped to the given item index (0-based).
   * Use this when you need to read the name of a particular card.
   */
  itemName(index: number): Locator {
    return this.inventoryItems.nth(index).locator('[data-test="inventory-item-name"]');
  }

  /**
   * Returns the price locator for an item scoped to the given item index (0-based).
   */
  itemPrice(index: number): Locator {
    return this.inventoryItems.nth(index).locator('[data-test="inventory-item-price"]');
  }

  /**
   * Returns the "Add to cart" button for a specific item by its URL-slug name,
   * e.g. `'sauce-labs-backpack'`.
   */
  addToCartBtn(itemSlug: string): Locator {
    return this.page.locator(`[data-test="add-to-cart-${itemSlug}"]`);
  }

  /**
   * Returns the "Remove" button for a specific item by its URL-slug name,
   * e.g. `'sauce-labs-backpack'`.
   */
  removeBtn(itemSlug: string): Locator {
    return this.page.locator(`[data-test="remove-${itemSlug}"]`);
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  /** Click "Add to cart" for an item identified by its slug. */
  async addItemToCart(itemSlug: string): Promise<void> {
    await this.addToCartBtn(itemSlug).click();
  }

  /** Click "Remove" for an item identified by its slug. */
  async removeItemFromCart(itemSlug: string): Promise<void> {
    await this.removeBtn(itemSlug).click();
  }

  /** Select a sort option from the dropdown. */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  /** Returns the count of inventory item cards currently visible. */
  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  /** Returns the text content of the cart badge, or null if the badge is hidden. */
  async getCartBadgeCount(): Promise<string | null> {
    const visible = await this.cartBadge.isVisible();
    return visible ? this.cartBadge.innerText() : null;
  }
}
