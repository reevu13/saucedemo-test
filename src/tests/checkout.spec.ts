import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage, ShippingInfo } from '../pages/CheckoutPage';

const VALID_SHIPPING: ShippingInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};

test.describe('Checkout', () => {

  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page, getUser }) => {
    const user = getUser('standard');
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    await loginPage.navigate();
    await loginPage.login(user.username, user.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test.describe('End-to-End Flow', () => {
    test('can complete a full checkout with one item', async ({ page, logger }) => {
      logger.info('Adding Sauce Labs Backpack and heading to cart');
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.goToCart();

      logger.info('Proceeding to checkout');
      await cartPage.proceedToCheckout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);

      logger.info('Filling shipping information');
      await checkoutPage.fillShippingInfo(VALID_SHIPPING);
      await checkoutPage.clickContinue();
      await expect(page).toHaveURL(/checkout-step-two\.html/);

      logger.info('Verifying summary shows 1 item');
      expect(await checkoutPage.getSummaryItemCount()).toBe(1);

      logger.info('Finishing checkout');
      await checkoutPage.clickFinish();
      await expect(checkoutPage.confirmationHeader).toHaveText('Thank you for your order!');
    });

    test('can complete a full checkout with multiple items', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');
      await inventoryPage.addItemToCart('sauce-labs-bolt-t-shirt');
      await inventoryPage.goToCart();

      await cartPage.proceedToCheckout();
      await checkoutPage.fillShippingInfo(VALID_SHIPPING);
      await checkoutPage.clickContinue();

      logger.info('Verifying summary shows 3 items');
      expect(await checkoutPage.getSummaryItemCount()).toBe(3);

      await checkoutPage.clickFinish();
      await expect(checkoutPage.confirmationHeader).toHaveText('Thank you for your order!');
    });
  });

  test.describe('Order Summary Math Verification', () => {
    /**
     * Parses a dollar amount from label text like "Item total: $29.99"
     * or "Total: $32.39".
     */
    function parseDollar(text: string): number {
      const match = text.match(/\$(\d+\.?\d*)/);
      if (!match) throw new Error(`Could not parse dollar amount from: "${text}"`);
      return parseFloat(match[1]);
    }

    test('item total + tax equals the final total', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
      await checkoutPage.fillShippingInfo(VALID_SHIPPING);
      await checkoutPage.clickContinue();

      const subtotalText = await checkoutPage.getSubtotal();
      const taxText = await checkoutPage.getTax();
      const totalText = await checkoutPage.getTotal();

      const subtotal = parseDollar(subtotalText);
      const tax = parseDollar(taxText);
      const total = parseDollar(totalText);

      logger.info(`Subtotal: $${subtotal}, Tax: $${tax}, Total: $${total}`);

      // Verify the math: subtotal + tax should equal total (within rounding)
      const computedTotal = parseFloat((subtotal + tax).toFixed(2));
      expect(computedTotal).toBe(total);
    });

    test('order summary math is correct with multiple items', async ({ page, logger }) => {
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.addItemToCart('sauce-labs-bike-light');
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
      await checkoutPage.fillShippingInfo(VALID_SHIPPING);
      await checkoutPage.clickContinue();

      const subtotal = parseDollar(await checkoutPage.getSubtotal());
      const tax = parseDollar(await checkoutPage.getTax());
      const total = parseDollar(await checkoutPage.getTotal());

      logger.info(`Subtotal: $${subtotal}, Tax: $${tax}, Total: $${total}`);

      const computedTotal = parseFloat((subtotal + tax).toFixed(2));
      expect(computedTotal).toBe(total);
    });
  });

  test.describe('Missing Fields Validation', () => {
    test.beforeEach(async ({ page }) => {
      // Add an item and navigate to checkout step 1
      await inventoryPage.addItemToCart('sauce-labs-backpack');
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
      await expect(page).toHaveURL(/checkout-step-one\.html/);
    });

    test('checkout is blocked when all fields are empty', async ({ logger }) => {
      logger.info('Clicking Continue with all fields empty');
      await checkoutPage.clickContinue();

      const error = await checkoutPage.getErrorMessage();
      expect(error).toContain('First Name is required');
    });

    test('checkout is blocked when last name is missing', async ({ logger }) => {
      logger.info('Filling only first name');
      await checkoutPage.fillFirstName('John');
      await checkoutPage.clickContinue();

      const error = await checkoutPage.getErrorMessage();
      expect(error).toContain('Last Name is required');
    });

    test('checkout is blocked when postal code is missing', async ({ logger }) => {
      logger.info('Filling first name and last name only');
      await checkoutPage.fillFirstName('John');
      await checkoutPage.fillLastName('Doe');
      await checkoutPage.clickContinue();

      const error = await checkoutPage.getErrorMessage();
      expect(error).toContain('Postal Code is required');
    });
  });
});
