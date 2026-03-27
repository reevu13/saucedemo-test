import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.use({
  serviceWorkers: 'block',
});

test.describe('Network Interception: Simulated Backend Failures', () => {



  async function login(page: Page, username: string, password: string) {
    const lp = new LoginPage(page);
    await lp.navigate();
    await lp.login(username, password);
    await expect(page).toHaveURL(/inventory\.html/);
  }

  // Helper: Wait for all images to settle (either successfully loaded or completely failed)
  // Prevents race conditions where Playwright checks `naturalWidth === 0` while the image is still downloading.
  async function waitForImagesToSettle(images: ReturnType<Page['locator']>) {
    await images.evaluateAll(async (imgs: HTMLImageElement[]) => {
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        });
      }));
    });
  }

  test('aborts product image requests and verifies broken-image fallback', async ({ page, getUser, logger }) => {
    const user = getUser('standard');

    await page.unrouteAll();
    await page.route('**/*.jpg', route => {
      logger.info(`Aborting image request: ${route.request().url()}`);
      route.abort('failed');
    });

    await login(page, user.username, user.password);

    logger.info('Intercepted all .jpg requests — checking image fallback state');

    const inventoryPage = new InventoryPage(page);
    const images = inventoryPage.inventoryItemImages;
    await expect(images).toHaveCount(6);

    await waitForImagesToSettle(images);

    const brokenImages = await images.evaluateAll((imgs: HTMLImageElement[]) =>
      imgs.filter(img => img.naturalWidth === 0).length
    );

    logger.info(`Images with naturalWidth === 0 (broken): ${brokenImages} / 6`);
    expect(brokenImages).toBe(6);
  });

  test('fulfills product image requests with 500 status and verifies broken-image fallback', async ({ page, getUser, logger }) => {
    const user = getUser('standard');
    let intercepted = false;

    await page.unrouteAll();
    await page.route('**/*.jpg', route => {
      logger.info(`Fulfilling with 500: ${route.request().url()}`);
      intercepted = true;
      route.fulfill({
        status: 500,
        body: 'Internal Server Error',
        headers: { 'Content-Type': 'text/plain' },
      });
    });

    await login(page, user.username, user.password);

    logger.info('Asserting that the 500 responses produce broken-image placeholders');

    const inventoryPage = new InventoryPage(page);
    const images = inventoryPage.inventoryItemImages;
    await expect(images).toHaveCount(6);

    await waitForImagesToSettle(images);

    const brokenImages = await images.evaluateAll((imgs: HTMLImageElement[]) =>
      imgs.filter(img => img.naturalWidth === 0).length
    );

    logger.info(`CDN 500 test: broken images = ${brokenImages} / 6`);
    expect(intercepted).toBe(true);
    expect(brokenImages).toBe(6);
  });

  test('selectively aborts one product image while others load normally', async ({ page, getUser, logger }) => {
    const user = getUser('standard');
    let intercepted = false;

    await page.unrouteAll();
    await page.route('**/*.jpg', route => {
      const url = route.request().url();
      if (url.includes('sauce-backpack')) {
        logger.info(`Selectively aborting: ${url}`);
        intercepted = true;
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await login(page, user.username, user.password);

    const inventoryPage = new InventoryPage(page);
    const images = inventoryPage.inventoryItemImages;
    await expect(images).toHaveCount(6);

    await waitForImagesToSettle(images);

    const brokenImages = await images.evaluateAll((imgs: HTMLImageElement[]) =>
      imgs.filter(img => img.naturalWidth === 0).length
    );

    logger.info(`Selectively aborted backpack image. Total broken: ${brokenImages}`);

    expect(intercepted).toBe(true);
    expect(brokenImages).toBe(1);
  });
});
