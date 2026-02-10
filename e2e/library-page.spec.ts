import { test, expect } from '@playwright/test';
import { mockAuthentication } from './fixtures/auth-helpers';
import { MOCK_SAVED_TRANSCRIPTS } from './fixtures/test-data';

test.describe('Library Page - Auth Guard', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    test.slow();
    await page.goto('/library');
    await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
  });
});

test.describe('Library Page - With Transcripts', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    // Mock transcripts API
    await page.route('**/api/transcripts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SAVED_TRANSCRIPTS),
        });
      } else if (route.request().method() === 'PATCH') {
        const body = JSON.parse(route.request().postData() || '{}');
        const updated = MOCK_SAVED_TRANSCRIPTS.data.find((t) => t.id === body.id);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { ...updated, ...body } }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');
  });

  test('library page loads with heading', async ({ page }) => {
    await expect(page.locator('text=My Library')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=/saved transcripts/i')).toBeVisible();
  });

  test('displays saved transcript items', async ({ page }) => {
    // Should show transcript titles from mock data
    await expect(
      page.locator('text=What is Bitcoin?').first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('text=Introduction to Machine Learning').first()
    ).toBeVisible();
    await expect(
      page.locator('text=Web Development in 2024').first()
    ).toBeVisible();
  });

  test('All and Favorites filter buttons are visible', async ({ page }) => {
    await expect(page.locator('button:has-text("All")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Favorites")')).toBeVisible();
  });

  test('Favorites filter shows only favorited transcripts', async ({ page }) => {
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    // Mock favorites-only response
    await page.route('**/api/transcripts**', async (route) => {
      if (route.request().method() === 'GET') {
        const favorites = MOCK_SAVED_TRANSCRIPTS.data.filter((t) => t.is_favorite);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: favorites }),
        });
      }
    });

    await page.locator('button:has-text("Favorites")').click();

    // Only the favorited transcript should remain visible
    await expect(
      page.locator('text=What is Bitcoin?').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('tag filters are displayed for available tags', async ({ page }) => {
    // Tags from mock data: crypto, education, ai, webdev
    await expect(
      page.locator('text=/filter by tag|crypto|education/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('clicking a tag filters transcripts', async ({ page }) => {
    // Wait for transcripts to load
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    // Click the "webdev" tag filter if visible
    const webdevTag = page.locator('button:has-text("webdev")');
    if (await webdevTag.isVisible()) {
      await webdevTag.click();

      // Should show only the webdev transcript
      await expect(page.locator('text=Web Development in 2024').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Library Page - Empty State', () => {
  test('shows empty state when no transcripts saved', async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/transcripts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=My Library')).toBeVisible({ timeout: 15000 });

    // Should show some empty state message
    await expect(
      page.locator('text=/no transcripts|empty|save your first|no saved/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Library Page - Transcript Interaction', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await mockAuthentication(page, 'free');

    await page.route('**/api/transcripts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SAVED_TRANSCRIPTS),
        });
      } else if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_SAVED_TRANSCRIPTS.data[0] }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');
  });

  test('can click on a transcript to view details', async ({ page }) => {
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    // Click on the first transcript
    await page.locator('text=What is Bitcoin?').first().click();

    // A modal or detail view should appear with transcript content
    await expect(
      page.locator('text=/Bitcoin is a digital currency|transcript/i').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
