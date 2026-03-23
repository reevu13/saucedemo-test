import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

test.describe('Cart', () => {

  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page, getUser }) => {
    const user = getUser('standard');
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);

    await loginPage.navigate();
    await loginPage.login(user.username, user.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test.describe('Adding & Removing Items', () => {
    test('can add a single item and see it in the cart', async ({ logger }) => {
      logger.info('Adding Sauce Labs Backpack to cart');
      await inventoryPage.addItemToCart('sauce-labs-backpack');

      logger.info('Verifying cart badge shows 1');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      logger.info('Navigating to cart');
      await inventoryPage.goToCart();

      const count = await cartPage.getItemCount();
      expect(count).toBe(1);
      await expect(cartPage.itemName(0)).toHaveText('Sauce Labs Backpack');
    });

    test('can add multiple items to the cart', async ({ logger }) => {
      logger.info('Adding two items to cart');
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');

      await expect(inventoryPage.cartBadge).toHaveText('2');

      await inventoryPage.goToCart();
      const count = await cartPage.getItemCount();
      expect(count).toBe(2);
    });

    test('can remove an item from the cart page', async ({ logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');
      await inventoryPage.goToCart();

      logger.info('Removing Sauce Labs Backpack from cart');
      await cartPage.removeItem('sauce-labs-backpack');

      const count = await cartPage.getItemCount();
      expect(count).toBe(1);
      await expect(cartPage.itemName(0)).toHaveText('Sauce Labs Bike Light');
    });

    test('can remove an item from the inventory page', async ({ logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      logger.info('Removing item directly from inventory page');
      await inventoryPage.removeItemFromCart('sauce-labs-backpack');

      await expect(inventoryPage.cartBadge).toBeHidden();
    });
  });

  test.describe('Cart Badge Updates', () => {
    test('badge appears when first item is added', async ({ logger }) => {
      logger.info('Verifying badge is hidden when cart is empty');
      await expect(inventoryPage.cartBadge).toBeHidden();

      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toBeVisible();
      await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('badge increments correctly', async () => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      await inventoryPage.addItemToCart('sauce-labs-bike-light');
      await expect(inventoryPage.cartBadge).toHaveText('2');

      await inventoryPage.addItemToCart('sauce-labs-bolt-t-shirt');
      await expect(inventoryPage.cartBadge).toHaveText('3');
    });

    test('badge decrements when items are removed', async () => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');
      await expect(inventoryPage.cartBadge).toHaveText('2');

      await inventoryPage.removeItemFromCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');
    });

    test('badge disappears when last item is removed', async () => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      await inventoryPage.removeItemFromCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toBeHidden();
    });
  });

  test.describe('Cart Persistence', () => {
    test('cart contents persist after navigating to cart and back', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');

      logger.info('Navigating to cart');
      await inventoryPage.goToCart();
      expect(await cartPage.getItemCount()).toBe(2);

      logger.info('Navigating back via Continue Shopping');
      await cartPage.continueShopping();
      await expect(page).toHaveURL(/inventory\.html/);

      logger.info('Verifying badge still shows 2');
      await expect(inventoryPage.cartBadge).toHaveText('2');
    });

    test('cart contents persist after page reload', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      logger.info('Reloading the page');
      await page.reload();

      logger.info('Verifying cart badge still shows 1 after reload');
      await expect(inventoryPage.cartBadge).toHaveText('1');

      await inventoryPage.goToCart();
      expect(await cartPage.getItemCount()).toBe(1);
      await expect(cartPage.itemName(0)).toHaveText('Sauce Labs Backpack');
    });

    test('cart contents persist when navigating directly to inventory URL', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');

      logger.info('Navigating directly to inventory URL');
      await page.goto('/inventory.html');

      await expect(inventoryPage.cartBadge).toHaveText('2');
    });
  });
});
