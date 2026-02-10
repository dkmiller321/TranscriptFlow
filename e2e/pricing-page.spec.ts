import { test, expect } from '@playwright/test';
import { PricingPage } from './pages/pricing.page';

test.describe('Pricing Page', () => {
  let pricingPage: PricingPage;

  test.beforeEach(async ({ page }) => {
    test.slow(); // Next.js compiles pages on first visit
    pricingPage = new PricingPage(page);
    await pricingPage.goto();
  });

  test('renders page heading and subtitle', async ({ page }) => {
    await expect(pricingPage.heading).toBeVisible({ timeout: 15000 });
    // Heading contains "Pricing" text (split across animated spans)
    await expect(page.locator('text=Pricing').first()).toBeVisible({ timeout: 15000 });
    await expect(pricingPage.subtitle).toBeVisible();
  });

  test('displays all three pricing tiers', async ({ page }) => {
    await expect(pricingPage.freeCard).toBeVisible({ timeout: 10000 });
    await expect(pricingPage.proCard).toBeVisible();
    await expect(pricingPage.businessCard).toBeVisible();
  });

  test('shows monthly prices by default', async ({ page }) => {
    await expect(page.locator('text=$0').first()).toBeVisible();
    await expect(page.locator('text=$9.99').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=$29.99').first()).toBeVisible({ timeout: 5000 });
  });

  test('billing toggle switches between monthly and yearly', async ({ page }) => {
    // Default is monthly
    await expect(pricingPage.monthlyToggle).toBeVisible();
    await expect(pricingPage.yearlyToggle).toBeVisible();

    // Switch to yearly
    await pricingPage.yearlyToggle.click();

    // Yearly prices should appear (different from monthly)
    // $0 stays the same for free tier
    await expect(page.locator('text=$0').first()).toBeVisible();
    // Pro yearly: look for the yearly price or /yr indicator
    await expect(page.locator('text=/\\/yr|yearly|annual/i').first()).toBeVisible({ timeout: 5000 });

    // Switch back to monthly
    await pricingPage.monthlyToggle.click();
    await expect(page.locator('text=$9.99').first()).toBeVisible({ timeout: 5000 });
  });

  test('yearly toggle shows Save 27% badge', async () => {
    await expect(pricingPage.yearlySaveBadge).toBeVisible();
  });

  test('Pro card is marked as Most Popular', async ({ page }) => {
    await expect(page.locator('text=Most Popular')).toBeVisible();
  });

  test('each tier has a CTA button', async ({ page }) => {
    await expect(page.locator('button:has-text("Get Started Free")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Upgrade to Pro")')).toBeVisible();
    await expect(page.locator('button:has-text("Upgrade to Business")')).toBeVisible();
  });

  test('free tier CTA navigates to home page', async ({ page }) => {
    await page.locator('button:has-text("Get Started Free")').click();
    await expect(page).toHaveURL('/', { timeout: 30000 });
  });

  test('paid tier CTA redirects to login when unauthenticated', async ({ page }) => {
    // Mock the checkout API to return 401
    await page.route('**/api/stripe/checkout', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Authentication required' }),
      });
    });

    await page.locator('button:has-text("Upgrade to Pro")').click();

    // Should redirect to login with redirect param
    await expect(page).toHaveURL(/\/login.*redirect/i, { timeout: 15000 });
  });

  test('displays security info in footer', async () => {
    await expect(pricingPage.securityInfo).toBeVisible();
  });

  test('checkout cancelled shows notification', async ({ page }) => {
    await page.goto('/pricing?checkout=cancelled');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=/cancelled|no charges/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('each tier lists features', async ({ page }) => {
    // Each card should have feature checkmarks
    const checkmarks = page.locator('[class*="card"] svg, [class*="card"] [class*="check"]');
    // At least a few features should be listed across all cards
    await expect(checkmarks.first()).toBeVisible({ timeout: 10000 });
  });

  test('contact support link is present', async ({ page }) => {
    const contactLink = page.locator('a[href*="mailto:support"]');
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute('href', /mailto:support@transcriptflow\.com/);
  });
});
