import { Page, expect } from '@playwright/test';
import { Logger } from './logger';

/**
 * Collection of domain-specific custom assertions that wrap Playwright's
 * built-in expect() with descriptive error messages and optional logging.
 */
export class Assertions {
  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
  ) {}

  /** Assert that the page is navigated to the expected URL fragment. */
  async urlContains(fragment: string): Promise<void> {
    this.logger.debug(`Asserting URL contains: "${fragment}"`);
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  /** Assert that a CSS selector is visible on the page. */
  async elementIsVisible(selector: string, description?: string): Promise<void> {
    const label = description ?? selector;
    this.logger.debug(`Asserting element is visible: ${label}`);
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /** Assert that a CSS selector is hidden / not present. */
  async elementIsHidden(selector: string, description?: string): Promise<void> {
    const label = description ?? selector;
    this.logger.debug(`Asserting element is hidden: ${label}`);
    await expect(this.page.locator(selector)).toBeHidden();
  }

  /** Assert that a locator's text content matches the expected value. */
  async textEquals(selector: string, expected: string): Promise<void> {
    this.logger.debug(`Asserting text of "${selector}" equals "${expected}"`);
    await expect(this.page.locator(selector)).toHaveText(expected);
  }

  /** Assert that a locator's text content contains the expected substring. */
  async textContains(selector: string, expected: string): Promise<void> {
    this.logger.debug(`Asserting text of "${selector}" contains "${expected}"`);
    await expect(this.page.locator(selector)).toContainText(expected);
  }

  /** Assert the page title. */
  async pageTitle(expected: string): Promise<void> {
    this.logger.debug(`Asserting page title is "${expected}"`);
    await expect(this.page).toHaveTitle(expected);
  }

  /** Assert that the number of items matching a selector equals the expected count. */
  async countEquals(selector: string, expected: number): Promise<void> {
    this.logger.debug(`Asserting count of "${selector}" equals ${expected}`);
    await expect(this.page.locator(selector)).toHaveCount(expected);
  }
}
