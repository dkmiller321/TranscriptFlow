import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';

test.describe('Landing Page & Navigation', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('homepage loads with hero section visible', async ({ page }) => {
    await expect(homePage.heroHeading).toBeVisible();
    await expect(page.locator('text=Get the transcript')).toBeVisible();
    await expect(homePage.urlInput).toBeVisible();
    await expect(homePage.extractButton).toBeVisible();
    await expect(page.locator('text=Free for single videos')).toBeVisible();
  });

  test('header displays logo and navigation links', async () => {
    await expect(homePage.header).toBeVisible();
    await expect(homePage.logo).toBeVisible();
    await expect(homePage.pricingLink).toBeVisible();
    await expect(homePage.loginButton).toBeVisible();
    await expect(homePage.signupButton).toBeVisible();
  });

  test('pricing link navigates to pricing page', async ({ page }) => {
    test.slow(); // Next.js compiles pages on first visit
    await page.locator('header a[href="/pricing"]').first().click();
    await expect(page).toHaveURL(/\/pricing/, { timeout: 30000 });
  });

  test('login button navigates to login page', async ({ page }) => {
    test.slow();
    await page.locator('header a[href="/login"]').first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('sign up button navigates to signup page', async ({ page }) => {
    test.slow();
    await page.locator('header a[href="/signup"]').first().click();
    await expect(page).toHaveURL(/\/signup/, { timeout: 30000 });
    await expect(page.locator('text=Create account').first()).toBeVisible();
  });

  test('footer displays copyright and legal links', async ({ page }) => {
    await homePage.footer.scrollIntoViewIfNeeded();
    await expect(homePage.footer).toBeVisible();
    // "TranscriptFlow" appears in both logo and copyright - check copyright specifically
    await expect(page.getByText(/© \d{4} TranscriptFlow/)).toBeVisible();
    await expect(homePage.footer.locator('a:has-text("Terms")')).toBeVisible();
    await expect(homePage.footer.locator('a:has-text("Privacy")')).toBeVisible();
  });

  test('terms page loads from footer link', async ({ page }) => {
    test.slow(); // Next.js compiles pages on first visit
    const href = await homePage.footer.locator('a:has-text("Terms")').getAttribute('href');
    expect(href).toBe('/terms');
    await page.goto('/terms', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/terms/);
  });

  test('privacy page loads from footer link', async ({ page }) => {
    test.slow();
    const href = await homePage.footer.locator('a:has-text("Privacy")').getAttribute('href');
    expect(href).toBe('/privacy');
    await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('features section displays three use-case cards', async ({ page }) => {
    await expect(page.locator('h3:has-text("Building with AI")')).toBeVisible();
    await expect(page.locator('h3:has-text("Repurposing content")')).toBeVisible();
    await expect(page.locator('h3:has-text("Research")')).toBeVisible();
  });

  test('pricing section displays three tiers on homepage', async ({ page }) => {
    await page.locator('text=Simple pricing').scrollIntoViewIfNeeded();
    await expect(page.locator('text=$0').first()).toBeVisible();
    await expect(page.locator('text=$9.99').first()).toBeVisible();
    await expect(page.locator('text=$29.99').first()).toBeVisible();
  });

  test('extract button is disabled when input is empty', async () => {
    await expect(homePage.extractButton).toBeDisabled();
  });
});

test.describe('Responsive Layout', () => {
  test('mobile layout shows hamburger menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();
  });

  test('tablet layout renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('desktop layout shows full navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log In' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' }).first()).toBeVisible();
  });
});
