import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';
import { LoginPage } from '../pages/LoginPage';

test.describe('Accessibility: WCAG Compliance Scans', () => {

  function logViolations(violations: Result[]) {
    if (violations.length === 0) return;

    console.warn(`\n⚠️  ${violations.length} axe violation(s) found:\n`);
    violations.forEach((v, i) => {
      console.warn(`  [${i + 1}] ${v.id} — ${v.impact?.toUpperCase()} — ${v.description}`);
      console.warn(`       Help: ${v.helpUrl}`);
      v.nodes.forEach(node => {
        console.warn(`       ↳ ${node.html}`);
      });
      console.warn('');
    });
  }

  test('login page has zero WCAG violations', async ({ page, logger }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    logger.info('Running axe accessibility scan on the Login page');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations(results.violations);
    expect(results.violations).toHaveLength(0);
  });

  test('inventory page has zero WCAG violations', async ({ page, getUser, logger }) => {
    test.fail(true, 'Known defect: sort <select> element is missing an accessible <label> (WCAG 4.1.2 / select-name)');

    const user = getUser('standard');
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(user.username, user.password);
    await expect(page).toHaveURL(/inventory\.html/);

    logger.info('Running axe accessibility scan on the Inventory page');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations(results.violations);
    expect(results.violations).toHaveLength(0);
  });

  test('product grid region has zero WCAG violations', async ({ page, getUser, logger }) => {
    const user = getUser('standard');
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(user.username, user.password);
    await expect(page).toHaveURL(/inventory\.html/);

    logger.info('Running targeted axe scan on the .inventory_list component only');
    const results = await new AxeBuilder({ page })
      .include('.inventory_list')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    logViolations(results.violations);
    expect(results.violations).toHaveLength(0);
  });
});
