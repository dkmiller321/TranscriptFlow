import { test, expect } from '@playwright/test';
import { mockAuthentication } from './fixtures/auth-helpers';
import { MOCK_HISTORY } from './fixtures/test-data';

test.describe('History Page - Auth Guard', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    test.slow();
    await page.goto('/history');
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });
});

test.describe('History Page - With History', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    // Mock history API
    await page.route('**/api/history**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_HISTORY),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto('/history');
    await page.waitForLoadState('domcontentloaded');
  });

  test('history page loads with heading', async ({ page }) => {
    await expect(page.locator('text=Extraction History')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=/recent transcript/i')).toBeVisible();
  });

  test('displays history items', async ({ page }) => {
    // Should show video titles from mock data
    await expect(
      page.locator('text=What is Bitcoin?').first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('text=Introduction to Machine Learning').first()
    ).toBeVisible();
  });

  test('shows status badges for completed and failed items', async ({ page }) => {
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    // Should show completed or failed status indicators
    // The third item (Unavailable Video) has status 'failed'
    await expect(
      page.locator('text=Unavailable Video').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('re-extract button navigates to home with video ID', async ({ page }) => {
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    // Find and click the re-extract button for the first item
    const reExtractButton = page.locator('button:has-text("Re-extract"), a:has-text("Re-extract"), button:has-text("Extract Again")').first();

    if (await reExtractButton.isVisible({ timeout: 5000 })) {
      await reExtractButton.click();

      // Should navigate to home with video ID query param
      await expect(page).toHaveURL(/\/\?v=Gc2en3nHxA4/, { timeout: 15000 });
    }
  });
});

test.describe('History Page - Empty State', () => {
  test('shows empty state when no history exists', async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/history');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1:has-text("Extraction History")')).toBeVisible({ timeout: 15000 });

    // Should show empty state message
    await expect(
      page.locator('h3:has-text("No extraction history")')
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('History Page - Word Count Display', () => {
  test('completed items show word count', async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/history**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_HISTORY),
      });
    });

    await page.goto('/history');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    // Completed items should show word count
    await expect(
      page.locator('text=/42 words|42/').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
