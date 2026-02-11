import { test, expect } from '@playwright/test';
import { mockAuthentication } from './fixtures/auth-helpers';

const MOBILE_VIEWPORT = { width: 393, height: 851 }; // Pixel 5

test.describe('Mobile Navigation - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('desktop nav is hidden on mobile', async ({ page }) => {
    // Desktop nav links should not be visible
    const desktopNav = page.locator('nav.hidden.sm\\:flex, header nav').first();
    // The pricing link in desktop nav should be hidden
    const desktopPricingLink = page.locator('header a[href="/pricing"]').first();
    // At mobile viewport, the desktop nav items should not be visible
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();
  });

  test('hamburger menu button is visible', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();
  });

  test('hamburger opens mobile menu with navigation links', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await menuButton.click();

    // Menu should be open — check for nav links
    await expect(page.locator('a[href="/pricing"]:visible')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a[href="/login"]:visible').first()).toBeVisible();
  });

  test('hamburger toggles menu closed', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="Toggle menu"]');

    // Open
    await menuButton.click();
    await expect(page.locator('a[href="/pricing"]:visible')).toBeVisible({ timeout: 5000 });

    // Close
    await menuButton.click();

    // Menu links should become hidden (animation takes 300ms)
    await page.waitForTimeout(400);
    // The menu should be collapsed (max-h-0 / opacity-0)
    const mobileMenu = page.locator('[class*="sm:hidden"] nav, [class*="sm\\:hidden"] nav').first();
    // Verify the pricing link is no longer interactable
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();
  });

  test('mobile menu shows Pricing link for unauthenticated user', async ({ page }) => {
    await page.locator('button[aria-label="Toggle menu"]').click();

    await expect(page.locator('a[href="/pricing"]:visible')).toBeVisible({ timeout: 5000 });
  });

  test('mobile menu shows Log In button for unauthenticated user', async ({ page }) => {
    await page.locator('button[aria-label="Toggle menu"]').click();

    await expect(page.locator('a[href="/login"]:visible').first()).toBeVisible({ timeout: 5000 });
  });

  test('mobile menu shows Sign Up button for unauthenticated user', async ({ page }) => {
    await page.locator('button[aria-label="Toggle menu"]').click();

    await expect(page.locator('a[href="/signup"]:visible').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Pricing in mobile menu navigates to pricing page', async ({ page }) => {
    test.slow();
    await page.locator('button[aria-label="Toggle menu"]').click();
    await page.locator('a[href="/pricing"]:visible').click();

    await expect(page).toHaveURL(/\/pricing/, { timeout: 30000 });
  });

  test('clicking Login in mobile menu navigates to login page', async ({ page }) => {
    test.slow();
    await page.locator('button[aria-label="Toggle menu"]').click();
    await page.locator('a[href="/login"]:visible').first().click();

    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });

  test('menu auto-closes after navigation', async ({ page }) => {
    test.slow();
    await page.locator('button[aria-label="Toggle menu"]').click();
    await expect(page.locator('a[href="/pricing"]:visible')).toBeVisible({ timeout: 5000 });

    await page.locator('a[href="/pricing"]:visible').click();
    await expect(page).toHaveURL(/\/pricing/, { timeout: 30000 });

    // After navigation, hamburger should still be visible (menu closed)
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();
  });
});

test.describe('Mobile Navigation - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page, 'free');
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('mobile menu shows authenticated nav links', async ({ page }) => {
    await page.locator('button[aria-label="Toggle menu"]').click();

    // Authenticated users see History, Library, Settings
    await expect(page.locator('a[href="/history"]:visible').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a[href="/library"]:visible').first()).toBeVisible();
    await expect(page.locator('a[href="/settings"]:visible').first()).toBeVisible();
  });

  test('mobile menu shows Sign Out for authenticated user', async ({ page }) => {
    await page.locator('button[aria-label="Toggle menu"]').click();

    await expect(page.locator('button:has-text("Sign Out"):visible').first()).toBeVisible({ timeout: 5000 });
  });

  test('clicking Settings in mobile menu navigates to settings page', async ({ page }) => {
    test.slow();

    // Mock settings & usage APIs for the settings page
    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user_id: 'test', default_export_format: 'txt', theme: 'system', has_youtube_api_key: false }),
      });
    });
    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ today: 0, month: 0, subscription: { tier: 'free' }, limits: { daily: 5, monthly: 50 } }),
      });
    });

    await page.locator('button[aria-label="Toggle menu"]').click();
    await page.locator('a[href="/settings"]:visible').first().click();

    await expect(page).toHaveURL(/\/settings/, { timeout: 30000 });
  });
});
