import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { TEST_VIDEOS, MOCK_TRANSCRIPT_RESPONSE } from './fixtures/test-data';

test.describe('Transcript Display & Interaction', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);

    // Mock the extract API for all tests in this suite
    await page.route('**/api/extract/video', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSCRIPT_RESPONSE),
      });
    });

    await homePage.goto();
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();
  });

  test('transcript text renders correctly', async ({ page }) => {
    // Transcript heading should be visible
    await expect(page.locator('text=Transcript').first()).toBeVisible();

    // Content from mock transcript should appear
    await expect(page.locator('text=/Bitcoin/i').first()).toBeVisible();
  });

  test('copy-to-clipboard shows success feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await expect(homePage.copyButton).toBeVisible();
    await homePage.copyButton.click();

    // Should show "Copied!" feedback
    await expect(page.locator('button:has-text("Copied!")')).toBeVisible({ timeout: 5000 });
  });

  test('download TXT button is functional', async ({ page }) => {
    await expect(homePage.downloadTxtButton).toBeVisible();
    await homePage.downloadTxtButton.click();

    // Button should show "Done!" feedback
    await expect(page.locator('button:has-text("Done!")').first()).toBeVisible({ timeout: 5000 });
  });

  test('download SRT button is functional', async ({ page }) => {
    await expect(homePage.downloadSrtButton).toBeVisible();
    await homePage.downloadSrtButton.click();

    await expect(page.locator('button:has-text("Done!")').first()).toBeVisible({ timeout: 5000 });
  });

  test('download JSON button is functional', async ({ page }) => {
    await expect(homePage.downloadJsonButton).toBeVisible();
    await homePage.downloadJsonButton.click();

    await expect(page.locator('button:has-text("Done!")').first()).toBeVisible({ timeout: 5000 });
  });

  test('plain text and timestamped view modes toggle', async ({ page }) => {
    await expect(homePage.plainTextTab).toBeVisible();
    await expect(homePage.timestampedTab).toBeVisible();

    // Click timestamped tab
    await homePage.timestampedTab.click();
    // Should show timestamp badges (formatted time like 0:00)
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/').first()).toBeVisible({ timeout: 5000 });

    // Click back to plain text
    await homePage.plainTextTab.click();
  });

  test('transcript search filters content', async ({ page }) => {
    await expect(homePage.searchInput).toBeVisible();

    // Search for a term from the mock transcript
    await homePage.searchInput.fill('Bitcoin');

    // Should show match count
    await expect(page.locator('text=/\\d+\\s*match/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('transcript search shows zero matches for non-existent term', async ({ page }) => {
    await homePage.searchInput.fill('xyznonexistent12345');

    await expect(
      page.locator('text=/0\\s*match|no match/i').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('word count is displayed', async () => {
    await expect(homePage.wordCount).toBeVisible();
    await expect(homePage.wordCount).toContainText('words');
  });

  test('video preview shows title and channel name', async ({ page }) => {
    const { title, channelName } = MOCK_TRANSCRIPT_RESPONSE.data.videoInfo;
    await expect(page.locator(`text=${title}`)).toBeVisible();
    await expect(page.locator(`text=${channelName}`)).toBeVisible();
  });

  test('unauthenticated user sees sign-in or save prompt', async () => {
    await expect(homePage.saveToLibraryButton).toBeVisible();
  });
});
