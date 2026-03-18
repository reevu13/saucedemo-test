import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Sauce Demo Login screen.
 * URL: https://www.saucedemo.com/
 */
export class LoginPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton   = page.locator('[data-test="login-button"]');
    this.errorMessage  = page.locator('[data-test="error"]');
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /** Navigate directly to the login page. */
  async navigate(): Promise<void> {
    await this.goto('/');
  }

  // ── Interactions ───────────────────────────────────────────────────────────

  /** Fill the username field. */
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /** Fill the password field. */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Click the Login button. */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Convenience method: fill credentials and submit the login form.
   * Returns void — callers decide what to assert after login.
   */
  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  /** Returns the visible error message text, or null if no error is shown. */
  async getErrorMessage(): Promise<string | null> {
    const visible = await this.errorMessage.isVisible();
    return visible ? this.errorMessage.innerText() : null;
  }
}
