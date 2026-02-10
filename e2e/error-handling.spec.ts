import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { TEST_VIDEOS, MOCK_ERROR_RESPONSES, MOCK_TRANSCRIPT_RESPONSE } from './fixtures/test-data';

test.describe('Error Handling', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('private/unavailable video shows user-friendly error', async ({ page }) => {
    await page.route('**/api/extract/video', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ERROR_RESPONSES.invalidVideo),
      });
    });

    await homePage.submitUrl(TEST_VIDEOS.valid.url);

    // Error message should appear
    await expect(
      page.locator('.text-destructive').first()
    ).toBeVisible({ timeout: 15000 });

    // Should NOT show transcript results
    await expect(homePage.wordCount).not.toBeVisible();
  });

  test('rate limit exceeded shows appropriate messaging', async ({ page }) => {
    await page.route('**/api/extract/video', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ERROR_RESPONSES.rateLimited),
      });
    });

    await homePage.submitUrl(TEST_VIDEOS.valid.url);

    await expect(
      page.locator('text=/rate limit|upgrade|wait/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('network failure shows error state', async ({ page }) => {
    await page.route('**/api/extract/video', async (route) => {
      await route.abort('connectionrefused');
    });

    await homePage.submitUrl(TEST_VIDEOS.valid.url);

    // Should show some error state
    await expect(
      page.locator('.text-destructive').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('server error shows error message', async ({ page }) => {
    await page.route('**/api/extract/video', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal server error' }),
      });
    });

    await homePage.submitUrl(TEST_VIDEOS.valid.url);

    await expect(
      page.locator('.text-destructive').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('404 page renders without crashing', async ({ page }) => {
    test.slow(); // Next.js 404 page compiles on first visit
    const response = await page.goto('/nonexistent-page-xyz', { timeout: 60000 });
    // Next.js returns 404 status
    expect(response?.status()).toBe(404);
  });

  test('client validation error clears on new input', async ({ page }) => {
    // Trigger client-side validation error
    await homePage.urlInput.fill(TEST_VIDEOS.invalid.malformed);
    await homePage.extractButton.click();
    await expect(page.locator('text=/valid YouTube URL/i')).toBeVisible({ timeout: 5000 });

    // Clear and type a new URL - the UrlInput component clears error on onChange
    await homePage.urlInput.clear();
    await homePage.urlInput.fill(TEST_VIDEOS.valid.url);

    // Error should be gone (UrlInput sets error to '' on input change)
    await expect(page.locator('#url-error')).not.toBeVisible({ timeout: 3000 });
  });
});
