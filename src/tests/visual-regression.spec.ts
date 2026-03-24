import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

/**
 * Visual regression tests for the `problem_user`.
 *
 * The problem_user sees broken / mismatched product images on the inventory
 * page. This spec logs in as problem_user, collects every product image
 * `src` attribute, and asserts that they are all unique and point to the
 * correct per-product URL — catching the known Sauce Demo bug where
 * problem_user sees a single placeholder image repeated across all items.
 */
test.describe('Visual Regression: problem_user broken images', () => {

  test.beforeEach(async ({ page, getUser }) => {
    const user = getUser('problem');
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(user.username, user.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test.fail('detects mismatched product images for problem_user', async ({ page, logger }) => {
    const inventoryPage = new InventoryPage(page);
    const itemCount = await inventoryPage.getItemCount();

    logger.info(`Found ${itemCount} inventory items, collecting image src attributes`);

    // Collect every product image src
    const imgSrcs: string[] = await page
      .locator('[data-test="inventory-item"] img.inventory_item_img')
      .evaluateAll((imgs: HTMLImageElement[]) => imgs.map(img => img.src));

    logger.info('Image src values collected', imgSrcs);

    // Expect one image per item
    expect(imgSrcs.length).toBe(itemCount);

    // All images should be unique (each product has its own image).
    // The problem_user bug duplicates a single image across all items.
    const uniqueSrcs = new Set(imgSrcs);
    expect(
      uniqueSrcs.size,
      `Expected ${itemCount} unique images but found ${uniqueSrcs.size}. ` +
      `Some products share the same image src, indicating broken/mismatched images.`
    ).toBe(itemCount);
  });

  test.fail('compares problem_user images against standard_user baseline', async ({ page, getUser, logger }) => {
    const inventoryPage = new InventoryPage(page);

    // Collect problem_user image srcs
    const problemSrcs: string[] = await page
      .locator('[data-test="inventory-item"] img.inventory_item_img')
      .evaluateAll((imgs: HTMLImageElement[]) => imgs.map(img => img.src));

    logger.info('problem_user image srcs', problemSrcs);

    // Now login as standard_user in a new context and collect their image srcs
    const standardUser = getUser('standard');
    const browser = page.context().browser()!;
    const stdContext = await browser.newContext();
    const stdPage = await stdContext.newPage();

    const stdLoginPage = new LoginPage(stdPage);
    await stdLoginPage.navigate();
    await stdLoginPage.login(standardUser.username, standardUser.password);
    await expect(stdPage).toHaveURL(/inventory\.html/);

    const standardSrcs: string[] = await stdPage
      .locator('[data-test="inventory-item"] img.inventory_item_img')
      .evaluateAll((imgs: HTMLImageElement[]) => imgs.map(img => img.src));

    logger.info('standard_user image srcs', standardSrcs);

    await stdContext.close();

    // Compare: problem_user should show the SAME images as standard_user.
    // If they differ, the problem_user has mismatched/broken images.
    expect(
      problemSrcs,
      'problem_user image sources do not match standard_user baseline. ' +
      'This confirms the broken images bug for problem_user.'
    ).toEqual(standardSrcs);
  });
});
