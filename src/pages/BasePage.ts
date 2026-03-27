import { Page, Locator } from '@playwright/test';

/**
 * Base class for all Page Objects.
 *
 * Contains shared navigation helpers and common locators
 * (e.g. the cart icon, burger menu) that are present across
 * multiple pages.
 */
export abstract class BasePage {
  /** The Playwright `Page` instance for this POM. */
  protected readonly page: Page;

  // ── Shared / global selectors ──────────────────────────────────────────────
  readonly cartIcon: Locator;
  readonly cartBadge: Locator;
  readonly burgerMenuBtn: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartIcon = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.burgerMenuBtn = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  /** Navigate directly to a relative path on the Sauce Demo base URL. */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(path);
  }

  /** Returns the current page URL. */
  url(): string {
    return this.page.url();
  }

  /** Clicks the cart icon to navigate to the cart page. */
  async goToCart(): Promise<void> {
    await this.cartIcon.click();
  }

  /** Opens the side navigation menu. */
  async openMenu(): Promise<void> {
    await this.burgerMenuBtn.click();
  }

  /**
   * Clicks the logout link in the sidebar.
   * Note: The menu must be open for this link to be visible/interactable.
   */
  async logout(): Promise<void> {
    await this.logoutLink.click();
  }
}
