# Sauce Demo Playwright Framework

[![Playwright Tests](https://github.com/reevu13/saucedemo-test/actions/workflows/ci.yml/badge.svg)](https://github.com/reevu13/saucedemo-test/actions/workflows/ci.yml)

A robust, enterprise-grade automated testing framework using [Playwright](https://playwright.dev/) and TypeScript, built exclusively for [Sauce Demo](https://www.saucedemo.com/).

## Framework Justification

**Why Playwright over Cypress, Selenium, or WebdriverIO?**

When designing this enterprise-grade testing architecture, **Playwright** was explicitly chosen over legacy and peer frameworks for several critical advantages:

1. **vs. Cypress (Architectural Limitations)**: 
   - Cypress executes *inside* the browser loop, restricting its ability to handle multi-tab flows, cross-origin domain navigations, or deeply intercept network traffic without workarounds. Playwright operates out-of-process via the DevTools protocol, offering total environment control.
   - Playwright provides native, lightweight parallelization using independent browser contexts (taking mere milliseconds to spin up), whereas Cypress struggles with heavy, slow context creation for multi-threaded execution.

2. **vs. Selenium WebDriver (WebSocket vs. HTTP Protocol & Flakiness)**: 
   - Selenium relies on the traditional WebDriver protocol, which translates every single command into a discrete HTTP request. This high-overhead REST approach is inherently slower and more brittle. Playwright operates via an active WebSocket connection directly communicating over the Chrome DevTools Protocol (CDP), resulting in lightning-fast execution and bidirectional, event-driven awareness (enabling seamless network interception).
   - Because of this bidirectional connection, Playwright uses advanced **auto-waiting** pipelines—forcing the engine to automatically pause until an element is attached, visible, stable, and ready to receive events *before* interacting. Selenium traditionally relies on explicit developer algorithms or fragile polling, leading to test flakiness (perfectly demonstrated when handling the `performance_glitch_user` persona).

3. **vs. WebdriverIO (Modern Tooling & API integration)**: 
   - While WebdriverIO acts as a great wrapper around the WebDriver protocol, Playwright's API is undeniably more modern, offering first-class TypeScript support natively with zero complex Babel/transpilation configurations out of the box.
   - Furthermore, Playwright has vastly superior built-in tooling: The Playwright Inspector, Trace Viewer (for time-travel debugging), Interactive UI Mode, and HTML reporters are maintained natively by the Microsoft core team, eliminating the need to stitch together the dozens of third-party ecosystem plugins common in WDIO setups.

**Bottom Line**: Playwright provides the ultimate combination of speed, zero-flake auto-waiting, built-in timeline debugging, and deep architectural control required for a resilient, highly maintainable UI automation suite.

## Architecture

The framework is structured to enforce strong separation of concerns prioritizing maintainability and clean DSL.

### 1. Page Object Model (POM) — `src/pages/`
All UI interactions and locators are segregated into dedicated page classes. 
- **Rule**: POM classes contain **zero test assertions**. They operate purely to expose locators (`[data-test="..."]`) and actionable methods (e.g., `checkoutPage.fillShippingInfo(data)`).
- **Inheritance**: A `BasePage.ts` manages cross-page elements (like the cart badge and burger menu).

### 2. Custom Fixture & Test Injection — `src/fixtures/index.ts`
Tests never import `@playwright/test` directly. They import from our custom fixture file, which automatically injects:
- `logger`: A structured JSON/text logger scoped by test title.
- `waits`: Explicit domain-level sync utilities (e.g. `forNetworkIdle`).
- `assertions`: Domain-specific `expect` wrappers for readability.
- `getUser`: A test-data factory reading `.env` credentials dynamically (no hardcoded credentials).

### 3. Test Specs — `src/tests/`
The actual execution logic. Organized by domain:
- `auth.spec.ts`: Login permutations, SQL injection, lockout, session persistence.
- `products.spec.ts`: Core display validations and multi-directional sorting (A-Z, Z-A, Lo-Hi, Hi-Lo).
- `cart.spec.ts`: Adding/removing items, badge math, state retention over reloads.
- `checkout.spec.ts`: E2E checkout journey, missing data blocks, mathematical sum verification.
- `resilience.spec.ts`: Validation against explicitly broken personas (`performance_glitch_user` smart waits, `error_user` bugs).
- `visual-regression.spec.ts`: Mathematical image tracking across parallel contexts to isolate visual regressions without pixel overhead.

---

## Test Coverage Overview

The framework provides comprehensive, mathematically precise verification across 5 distinct domains:

### 1. Authentication (`auth.spec.ts`)
- **Valid Login**: `standard_user` successfully accessing the inventory.
- **Invalid Credentials**: Granular checks for wrong passwords, empty usernames, empty passwords, and empty dual-fields.
- **Security Check**: Verifies the UI securely rejects SQL injection attempts (`' OR 1=1 --`).
- **Locked-Out User**: Asserts the exact string match for the `"Sorry, this user has been locked out."` error.
- **Session Persistence**: Validates that authenticated cookies survive hard page reloads, and that clicking "Logout" correctly flushes the session and prevents back-button navigation.

### 2. Product Catalog (`products.spec.ts`)
- **Grid Rendering**: Asserts exactly 6 items render natively, each actively containing a title and a valid pricing format (`$X.XX`).
- **Sorting Algorithms**: Strictly validates 4 distinct sorting outcomes mechanically (A→Z, Z→A, Price Low→High, Price High→Low) against dynamically calculated Javascript arrays.

### 3. Shopping Cart (`cart.spec.ts`)
- **State Management**: Adds/removes items directly from the inventory and verifies the UI header badge increments/decrements dynamically.
- **Persistence**: Adds an item, navigates away, and verifies the shopping cart retains the item globally.

### 4. Checkout Flow (`checkout.spec.ts`)
- **End-to-End E-commerce**: Completes a full checkout flow navigating through 3 distinct pages (Cart → Information Form → Overview Summary → Complete).
- **Mathematical Integrity**: Dynamically captures all unit prices, calculates the cumulative Subtotal, computes the exact 8% Tax modifier natively, and asserts the Final Total calculation is perfectly accurate.
- **Form Validation**: Asserts users are actively blocked from continuing their order if their First Name, Last Name, or Postal Code goes missing.

### 5. Resilience & Bug Detection (`resilience.spec.ts` & `visual-regression.spec.ts`)
- **Smart Waits**: Successfully logs in and interacts as the `performance_glitch_user` (which intentionally lags the server response) without utilizing brittle `Thread.sleep` hacks.
- **Defect Localization (error_user)**: Confirms the frontend `alert()` warning appears when sorting breaks, and simultaneously proves that checkout inputs silently clear `.inputValue()` state due to intentional React application bugs.
- **Visual Regression (problem_user)**: Mathematically reads every DOM image `src` URL across multiple browser contexts and correctly flags identical placeholder garbage URLs (the "Dog in a Sauce jacket" bug) without downloading heavy, brittle pixel datasets.

---

## Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/reevu13/saucedemo-test.git
cd saucedemo-test
```

### 2. Install Dependencies & Browsers
You need Node.js installed (LTS recommended).
```bash
# Install core package dependencies
npm ci

# Download the required Playwright browser binaries
npx playwright install --with-deps
```

### 3. Configure Local Credentials
Do **not** hardcode credentials. Create a local `.env` file based on the example:
```bash
cp .env.example .env
```
Open `.env` and configure the mandated usernames and universal password from the assessment (you can find these public testing credentials listed on the saucedemo.com homepage):
```env
BASE_URL=https://www.saucedemo.com/
TIMEOUT=30000

STANDARD_USER=<insert_standard_username_here>
LOCKED_OUT_USER=<insert_locked_out_username_here>
PROBLEM_USER=<insert_problem_username_here>
PERFORMANCE_GLITCH_USER=<insert_performance_glitch_username_here>
ERROR_USER=<insert_error_username_here>
PASSWORD=<insert_password_here>
```

### 4. Running the Test Suite

**Run all tests completely headlessly** (fastest, standard CI mode):
```bash
npm test
```

**Run a specific test file**:
```bash
npx playwright test src/tests/auth.spec.ts
```

**Run a single test by its name (grep)**:
```bash
npx playwright test -g "standard_user can login"
```

**Run specific tests on a specific browser**:
Playwright natively accepts `--project` to isolate execution cleanly.
```bash
npx playwright test src/tests/checkout.spec.ts --project=chromium
npx playwright test src/tests/resilience.spec.ts --project=firefox
```

**Run all tests visually (headed)**:
```bash
npx playwright test --headed
```

**Run with UI Mode** (Visual debugger, timeline tracing, DOM snapshot inspector):
```bash
npx playwright test --ui
```

**Watching Tests with custom speed**:
To slow down the test execution so you can actively watch the interactions (e.g. 1000ms delay per step):
```bash
SLOW_MO=1000 npx playwright test --workers=1 --headed
```

### 5. Viewing the HTML Report
After execution, a detailed HTML report is generated inside `reports/html/`. Playwright will automatically serve it if tests fail. To manually serve the report:
```bash
npx playwright show-report reports/html
```

### 6. Docker Execution
To guarantee perfect environment parity with CI execution, you can run the test suite inside an isolated `mcr.microsoft.com/playwright:v1.58.2-jammy` container.

**1. Build the Docker Image**:
```bash
# --network=host bypasses veth restriction
docker build --network=host -t saucedemo-test .
```

**2. Run tests inside the Container**:
```bash
# Injects local .env file securely at run-time
docker run --rm --network=host --env-file .env saucedemo-test
```

> **Note on CI/CD Security**: The GitHub Actions CI/CD pipeline does **not** rely on checking in `.env` files. Execution is entirely secured by injecting native GitHub Actions Secrets directly into the runtime context to reliably prevent credential leakage.