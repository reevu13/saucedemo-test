import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Authentication', () => {

  test.describe('Valid Login', () => {
    test('standard_user can login and reach the inventory page', async ({ page, getUser, logger }) => {
      const user = getUser('standard');
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      logger.info('Navigating to login page');
      await loginPage.navigate();

      logger.info('Logging in as standard_user');
      await loginPage.login(user.username, user.password);

      logger.info('Verifying redirect to inventory page');
      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.pageTitle).toHaveText('Products');
    });
  });

  test.describe('Invalid Credentials', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.navigate();
    });

    test('shows error for wrong password', async ({ getUser, logger }) => {
      const user = getUser('standard');
      logger.info('Attempting login with wrong password');
      await loginPage.login(user.username, 'wrong_password');

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Username and password do not match any user in this service');
    });

    test('shows error when username is empty', async ({ getUser, logger }) => {
      const user = getUser('standard');
      logger.info('Attempting login with empty username');
      await loginPage.login('', user.password);

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Username is required');
    });

    test('shows error when password is empty', async ({ getUser, logger }) => {
      const user = getUser('standard');
      logger.info('Attempting login with empty password');
      await loginPage.login(user.username, '');

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Password is required');
    });

    test('shows error when both fields are empty', async ({ logger }) => {
      logger.info('Attempting login with both fields empty');
      await loginPage.clickLogin();

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Username is required');
    });

    test('rejects SQL injection attempt', async ({ logger }) => {
      logger.info('Attempting SQL injection via username field');
      await loginPage.login("' OR 1=1 --", 'anything');

      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Username and password do not match any user in this service');
    });
  });

  test.describe('Locked-Out User', () => {
    test('locked_out_user sees a lockout error message', async ({ page, getUser, logger }) => {
      const user = getUser('locked_out');
      const loginPage = new LoginPage(page);

      logger.info('Navigating to login page');
      await loginPage.navigate();

      logger.info('Logging in as locked_out_user');
      await loginPage.login(user.username, user.password);

      logger.info('Verifying lockout error is displayed');
      const error = await loginPage.getErrorMessage();
      expect(error).toContain('Sorry, this user has been locked out');

      // Should remain on the login page
      await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    });
  });

  test.describe('Session Persistence', () => {
    test('session survives a page reload', async ({ page, getUser, logger }) => {
      const user = getUser('standard');
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      await expect(page).toHaveURL(/inventory\.html/);

      logger.info('Reloading the page');
      await page.reload();

      logger.info('Verifying session persists after reload');
      await expect(page).toHaveURL(/inventory\.html/);
      await expect(inventoryPage.pageTitle).toHaveText('Products');
    });

    test('user can logout and session is destroyed', async ({ page, getUser, logger }) => {
      const user = getUser('standard');
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await loginPage.navigate();
      await loginPage.login(user.username, user.password);
      await expect(page).toHaveURL(/inventory\.html/);

      logger.info('Opening the burger menu');
      await inventoryPage.openMenu();

      logger.info('Clicking logout');
      await inventoryPage.logout();

      logger.info('Verifying redirect back to login page');
      await expect(page).toHaveURL(/saucedemo\.com\/?$/);

      logger.info('Verifying session is destroyed: cannot go back to inventory');
      await page.goto('/inventory.html');
      const error = await loginPage.getErrorMessage();
      expect(error).toContain("You can only access '/inventory.html' when you are logged in");
    });
  });
});
