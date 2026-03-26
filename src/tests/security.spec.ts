import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

interface AttackPayload {
  name: string;
  value: string;
  type: 'sqli' | 'xss';
}

const ATTACK_PAYLOADS: AttackPayload[] = [
  { name: 'Classic OR bypass',         value: "admin' OR 1=1;--",                   type: 'sqli' },
  { name: 'Single-quote escape',       value: "' OR '1'='1",                        type: 'sqli' },
  { name: 'Double-dash comment',       value: "admin'--",                           type: 'sqli' },
  { name: 'UNION SELECT',             value: "' UNION SELECT * FROM users--",       type: 'sqli' },
  { name: 'Stacked queries',          value: "'; DROP TABLE users;--",              type: 'sqli' },
  { name: 'Boolean-based blind',      value: "' OR 1=1#",                           type: 'sqli' },
  { name: 'Time-based blind',         value: "' OR SLEEP(5)--",                     type: 'sqli' },

  { name: 'Basic script tag',         value: "<script>alert('xss')</script>",       type: 'xss'  },
  { name: 'Image onerror',            value: '<img src=x onerror=alert("xss")>',   type: 'xss'  },
  { name: 'SVG onload',               value: '<svg onload=alert("xss")>',          type: 'xss'  },
  { name: 'Event handler injection',  value: '" onfocus=alert("xss") autofocus="', type: 'xss'  },
  { name: 'JavaScript URI',           value: 'javascript:alert("xss")',             type: 'xss'  },
  { name: 'Encoded script tag',       value: '%3Cscript%3Ealert("xss")%3C/script%3E', type: 'xss' },
];

const dbLeakRegex = /SQL|syntax error|mysql|postgres|sqlite|ORA-|ODBC|unterminated|stack trace|Exception|at com\.|at org\./i;

async function navigateToCheckoutFresh(page: Page, user: { username: string, password: string }) {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);

  await loginPage.navigate();
  await loginPage.login(user.username, user.password);
  await expect(page).toHaveURL(/inventory\.html/);

  await inventoryPage.addItemToCart('sauce-labs-backpack');
  await inventoryPage.goToCart();
  await cartPage.proceedToCheckout();
}

test.describe('Security: Injection Attack Surface Testing', () => {

  test.describe('Login Form — Injection Attacks', () => {

    for (const payload of ATTACK_PAYLOADS) {
      test(`rejects ${payload.type.toUpperCase()} in username: ${payload.name}`, async ({ page, getUser, logger }) => {
        const loginPage = new LoginPage(page);
        const validPassword = getUser('standard').password;
        let xssExecuted = false;

        page.on('dialog', async dialog => {
          logger.error(`XSS EXECUTED! Dialog message: ${dialog.message()}`);
          xssExecuted = true;
          await dialog.dismiss();
        });

        await loginPage.navigate();
        await loginPage.login(payload.value, validPassword);

        const currentURL = page.url();
        expect(currentURL).not.toContain('inventory.html');

        const errorMessage = await loginPage.getErrorMessage();
        expect(errorMessage).toBeTruthy();

        const pageContent = await page.content();
        
        expect(dbLeakRegex.test(pageContent), 'Raw database error string leaked into the UI').toBe(false);

        if (payload.type === 'xss') {
          await page.waitForTimeout(500); 
          expect(xssExecuted, 'XSS payload successfully executed JavaScript!').toBe(false);
        }
      });
    }
  });

  test.describe('Checkout Form — Injection Attacks', () => {
    const CHECKOUT_PAYLOADS = ATTACK_PAYLOADS.filter(p =>
        ['Classic OR bypass', 'Basic script tag', 'Image onerror', 'UNION SELECT'].includes(p.name)
    );

    const fieldsToTest = ['firstName', 'lastName'];

    for (const payload of CHECKOUT_PAYLOADS) {
      for (const field of fieldsToTest) {
        test(`sanitizes ${payload.type.toUpperCase()} in checkout ${field}: ${payload.name}`, async ({ page, getUser }) => {
          const user = getUser('standard');
          const checkoutPage = new CheckoutPage(page);
          
          let xssExecuted = false;
          page.on('dialog', async dialog => {
            xssExecuted = true;
            await dialog.dismiss();
          });

          await navigateToCheckoutFresh(page, user);

          if (field === 'firstName') {
            await checkoutPage.fillFirstName(payload.value);
            await checkoutPage.fillLastName('ValidLast');
          } else {
            await checkoutPage.fillFirstName('ValidFirst');
            await checkoutPage.fillLastName(payload.value);
          }
          
          await checkoutPage.fillPostalCode('12345');
          await checkoutPage.clickContinue();

          const pageContent = await page.content();
          expect(dbLeakRegex.test(pageContent), 'Raw database error string leaked into the UI').toBe(false);

          if (payload.type === 'xss') {
            await page.waitForTimeout(500);
            expect(xssExecuted, 'XSS payload successfully executed JavaScript!').toBe(false);
          }
        });
      }
    }
  });
});
