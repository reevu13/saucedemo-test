import { test as base, Page } from '@playwright/test';
import { Logger } from '../utils/logger';
import { Waits } from '../utils/waits';
import { Assertions } from '../utils/assertions';
import { User, UserRole, getUser } from './users';

/**
 * Shape of the utility objects injected into every test via our custom fixture.
 */
export interface TestFixtures {
  /** Structured logger scoped to the current test title. */
  logger: Logger;
  /** Custom wait helpers bound to the current page. */
  waits: Waits;
  /** Custom assertion helpers bound to the current page. */
  assertions: Assertions;
  /**
   * A factory that returns a {@link User} by role.
   * All credentials come exclusively from environment variables.
   */
  getUser: (role: UserRole) => User;
}

export const test = base.extend<TestFixtures>({
  // Scoped to 'test' by default, so each spec gets a fresh logger instance.
  logger: async ({}, use, testInfo) => {
    const logger = new Logger(testInfo.title);
    logger.info('Test started');
    await use(logger);
    logger.info('Test finished', { status: testInfo.status });
  },

  waits: async ({ page, logger }: { page: Page; logger: Logger }, use) => {
    await use(new Waits(page, logger));
  },

  assertions: async ({ page, logger }: { page: Page; logger: Logger }, use) => {
    await use(new Assertions(page, logger));
  },

  getUser: async ({}, use) => {
    // Expose the factory directly — consumers call getUser('standard') etc.
    await use(getUser);
  },
});

export { expect } from '@playwright/test';
