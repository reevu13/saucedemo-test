import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Resilience', () => {

  test.describe('performance_glitch_user', () => {
    test('can log in despite slow responses using smart waits', async ({ page, getUser, logger }) => {
      const user = getUser('performance_glitch');
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await loginPage.navigate();

      logger.info('Logging in as performance_glitch_user (slow response expected)');
      const startTime = Date.now();

      await loginPage.login(user.username, user.password);

      // Use a generous timeout since the performance glitch user is intentionally slow.
      await expect(page).toHaveURL(/inventory\.html/, { timeout: 15_000 });
      await expect(inventoryPage.pageTitle).toBeVisible({ timeout: 15_000 });

      const elapsed = Date.now() - startTime;
      logger.info(`Login completed in ${elapsed}ms (expected to be slower than standard_user)`);

      await expect(inventoryPage.pageTitle).toHaveText('Products');
    });

    test('can browse inventory after slow login', async ({ page, getUser, logger }) => {
      const user = getUser('performance_glitch');
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      await expect(page).toHaveURL(/inventory\.html/, { timeout: 15_000 });

      logger.info('Verifying all 6 products are visible after slow login');
      const count = await inventoryPage.getItemCount();
      expect(count).toBe(6);
    });
  });

  test.describe('error_user', () => {
    let loginPage: LoginPage;
    let inventoryPage: InventoryPage;
    let cartPage: CartPage;
    let checkoutPage: CheckoutPage;

    test.beforeEach(async ({ page, getUser }) => {
      const user = getUser('error');
      loginPage = new LoginPage(page);
      inventoryPage = new InventoryPage(page);
      cartPage = new CartPage(page);
      checkoutPage = new CheckoutPage(page);

      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      await expect(page).toHaveURL(/inventory\.html/);
    });

    test('can log in successfully', async ({ logger }) => {
      logger.info('error_user login succeeded, verifying inventory page');
      await expect(inventoryPage.pageTitle).toHaveText('Products');
    });

    test('sorting fails or produces incorrect results', async ({ page, logger }) => {
      logger.info('Attempting to sort products by Name (Z to A) as error_user');

      // Capture names before sorting
      const namesBefore: string[] = [];
      const count = await inventoryPage.getItemCount();
      for (let i = 0; i < count; i++) {
        namesBefore.push(await inventoryPage.itemName(i).innerText());
      }

      // Listen for the expected error alert pop-up specifically programmed into error_user
      let alertMessage = '';
      page.on('dialog', dialog => {
        alertMessage = dialog.message();
        // Playwright auto-dismisses alerts natively, but it's best practice to explicitly accept them.
        dialog.accept();
      });

      // Sort Z -> A (This immediately triggers the alert())
      await inventoryPage.sortBy('za');

      // Assert the specific Javascript console alert surfaced to the user
      expect(
        alertMessage,
        'Expected the specific Sauce Demo sorting error alert popup.'
      ).toBe('Sorting is broken! This error has been reported to Backtrace.');

      // Capture names after the broken sorting attempt
      const namesAfter: string[] = [];
      for (let i = 0; i < count; i++) {
        namesAfter.push(await inventoryPage.itemName(i).innerText());
      }

      const expectedZA = [...namesBefore].sort((a, b) => b.localeCompare(a));

      logger.info('Names after Z->A sort', namesAfter);
      logger.info('Expected Z->A order', expectedZA);

      // The error_user's sorting is known to be broken
      expect(
        namesAfter,
        'error_user sort Z->A did not produce the expected order, confirming the sorting bug.'
      ).not.toEqual(expectedZA);
    });

    test('removing an item from cart succeeds (not a failing action)', async ({ logger }) => {
      logger.info('Adding Sauce Labs Backpack to cart');
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      logger.info('Navigating to cart');
      await inventoryPage.goToCart();
      expect(await cartPage.getItemCount()).toBe(1);

      logger.info('Removing item from cart');
      await cartPage.removeItem('sauce-labs-backpack');

      // Cart removal works for error_user — item count drops to 0
      const countAfter = await cartPage.getItemCount();
      logger.info(`Items after remove: ${countAfter}`);
      expect(countAfter).toBe(0);
    });

    test('checkout shipping form silently clears lastName field', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);

      logger.info('Filling shipping info as error_user');
      await checkoutPage.fillShippingInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        postalCode: '99999',
      });

      // The error_user bug: the lastName field gets silently cleared after filling.
      const lastNameValue = await checkoutPage.lastNameInput.inputValue();
      logger.info(`lastName field value after fill: "${lastNameValue}"`);
      expect(
        lastNameValue,
        'error_user bug confirmed: lastName was silently cleared after filling'
      ).toBe('');

      // Despite the cleared lastName, clicking Continue still proceeds to step-two
      // (instead of showing a validation error). This is the second part of the bug.
      await checkoutPage.clickContinue();

      const currentUrl = page.url();
      logger.info(`URL after Continue with cleared lastName: ${currentUrl}`);

      // The app proceeds despite missing data — this is the bug we're asserting
      await expect(page).toHaveURL(/checkout-step-two\.html/);
    });
  });
});
