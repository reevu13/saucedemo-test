import { Page } from '@playwright/test';
import { Logger } from './logger';

/** Default polling interval used by custom waits (ms). */
const POLL_INTERVAL = 500;

/**
 * Custom waiting helpers that go beyond Playwright's built-in auto-waiting
 * (e.g. waiting for network silence, a condition predicate, etc.).
 */
export class Waits {
  constructor(
    private readonly page: Page,
    private readonly logger: Logger,
  ) {}

  /**
   * Waits until a CSS selector is visible, polling every {@link POLL_INTERVAL}ms.
   * Wraps Playwright's built-in waitForSelector with a descriptive log line.
   */
  async forSelector(
    selector: string,
    options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' | 'detached' } = {},
  ): Promise<void> {
    const { timeout = 30_000, state = 'visible' } = options;
    this.logger.debug(`Waiting for selector "${selector}" to be ${state}`);
    await this.page.waitForSelector(selector, { state, timeout });
  }

  /**
   * Waits until the network is idle (no more than 0 pending requests for 500ms).
   */
  async forNetworkIdle(timeout = 30_000): Promise<void> {
    this.logger.debug('Waiting for network idle');
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Waits for navigation to complete after performing an action such as a click.
   */
  async forNavigation(timeout = 30_000): Promise<void> {
    this.logger.debug('Waiting for navigation');
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  /**
   * Polls until the provided async predicate returns true, or the timeout elapses.
   * @param predicate - An async function that resolves to a boolean.
   * @param description - Human-readable description of what is being waited for.
   * @param timeout - Maximum time to wait in milliseconds (default: 30 000).
   */
  async forCondition(
    predicate: () => Promise<boolean>,
    description: string,
    timeout = 30_000,
  ): Promise<void> {
    this.logger.debug(`Waiting for condition: "${description}"`);
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await predicate()) return;
      await this.page.waitForTimeout(POLL_INTERVAL);
    }
    throw new Error(`Timed out waiting for condition: "${description}" (${timeout}ms)`);
  }
}
