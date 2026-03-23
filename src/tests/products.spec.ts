import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Product Catalog', () => {

  // Shared setup: login as standard_user before each test.
  test.beforeEach(async ({ page, getUser }) => {
    const user = getUser('standard');
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(user.username, user.password);
    await expect(page).toHaveURL(/inventory\.html/);
  });

  test.describe('Listing', () => {
    test('displays 6 inventory items with visible names and prices', async ({ page, logger }) => {
      const inventoryPage = new InventoryPage(page);
      
      logger.info('Verifying product listing count is exactly 6');
      const count = await inventoryPage.getItemCount();
      expect(count).toBe(6);

      logger.info('Verifying all items have visible names and prices');
      for (let i = 0; i < count; i++) {
        // Assert name is visible and not empty
        const nameLocator = inventoryPage.itemName(i);
        await expect(nameLocator).toBeVisible();
        expect((await nameLocator.innerText()).trim().length).toBeGreaterThan(0);

        // Assert price is visible and contains $
        const priceLocator = inventoryPage.itemPrice(i);
        await expect(priceLocator).toBeVisible();
        expect(await priceLocator.innerText()).toContain('$');
      }
    });
  });

  test.describe('Sorting', () => {
    // Helper: Extracts all product names from the inventory page in listed order.
    async function getAllNames(inventoryPage: InventoryPage): Promise<string[]> {
      const count = await inventoryPage.getItemCount();
      const names: string[] = [];
      for (let i = 0; i < count; i++) {
        names.push(await inventoryPage.itemName(i).innerText());
      }
      return names;
    }

    // Helper: Extracts all product prices (as numbers) in listed order.
    async function getAllPrices(inventoryPage: InventoryPage): Promise<number[]> {
      const count = await inventoryPage.getItemCount();
      const prices: number[] = [];
      for (let i = 0; i < count; i++) {
        const text = await inventoryPage.itemPrice(i).innerText();
        prices.push(parseFloat(text.replace('$', '')));
      }
      return prices;
    }

    test('sorts products A → Z', async ({ page, logger }) => {
      const inventoryPage = new InventoryPage(page);
      logger.info('Sorting by Name (A to Z)');
      await inventoryPage.sortBy('az');

      const names = await getAllNames(inventoryPage);
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });

    test('sorts products Z → A', async ({ page, logger }) => {
      const inventoryPage = new InventoryPage(page);
      logger.info('Sorting by Name (Z to A)');
      await inventoryPage.sortBy('za');

      const names = await getAllNames(inventoryPage);
      const sorted = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).toEqual(sorted);
    });

    test('sorts products Price Low → High', async ({ page, logger }) => {
      const inventoryPage = new InventoryPage(page);
      logger.info('Sorting by Price (low to high)');
      await inventoryPage.sortBy('lohi');

      const prices = await getAllPrices(inventoryPage);
      const sorted = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sorted);
    });

    test('sorts products Price High → Low', async ({ page, logger }) => {
      const inventoryPage = new InventoryPage(page);
      logger.info('Sorting by Price (high to low)');
      await inventoryPage.sortBy('hilo');

      const prices = await getAllPrices(inventoryPage);
      const sorted = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sorted);
    });
  });
});
