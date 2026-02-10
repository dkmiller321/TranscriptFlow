import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import { TEST_VIDEOS, MOCK_TRANSCRIPT_RESPONSE } from './fixtures/test-data';

test.describe('YouTube URL Submission', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test.describe('Valid URL submission with mocked API', () => {
    test.beforeEach(async ({ page }) => {
      // Mock the extract API to avoid real YouTube calls
      await page.route('**/api/extract/video', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TRANSCRIPT_RESPONSE),
        });
      });
    });

    test('user can paste a YouTube URL and extract transcript', async () => {
      await homePage.submitUrl(TEST_VIDEOS.valid.url);
      await homePage.waitForTranscriptResult();
    });

    test('short YouTube URL format is accepted', async () => {
      await homePage.submitUrl(TEST_VIDEOS.valid.shortUrl);
      await homePage.waitForTranscriptResult();
    });

    test('embed URL format is accepted', async () => {
      await homePage.submitUrl(TEST_VIDEOS.valid.embedUrl);
      await homePage.waitForTranscriptResult();
    });

    test('share URL format is accepted', async () => {
      await homePage.submitUrl(TEST_VIDEOS.valid.shareUrl);
      await homePage.waitForTranscriptResult();
    });

    test('loading state appears while transcript is fetched', async ({ page }) => {
      // Override route with a slower mock to observe loading
      await page.unrouteAll({ behavior: 'ignoreErrors' });
      await page.route('**/api/extract/video', async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_TRANSCRIPT_RESPONSE),
        });
      });

      await homePage.submitUrl(TEST_VIDEOS.valid.url);

      // Verify loading state is visible
      await expect(page.locator('text=/Extracting transcript/i')).toBeVisible({ timeout: 5000 });

      // Wait for results
      await homePage.waitForTranscriptResult();
    });

    test('results display video info after extraction', async ({ page }) => {
      await homePage.submitUrl(TEST_VIDEOS.valid.url);
      await homePage.waitForTranscriptResult();

      // Video title and channel from mock response should be visible
      const { title, channelName } = MOCK_TRANSCRIPT_RESPONSE.data.videoInfo;
      await expect(page.locator(`text=${title}`)).toBeVisible();
      await expect(page.locator(`text=${channelName}`)).toBeVisible();
    });
  });

  test.describe('Validation', () => {
    test('empty input keeps extract button disabled', async () => {
      await expect(homePage.extractButton).toBeDisabled();
    });

    test('malformed URL shows client-side validation error', async ({ page }) => {
      await homePage.urlInput.fill(TEST_VIDEOS.invalid.malformed);
      await expect(homePage.extractButton).toBeEnabled();
      await homePage.extractButton.click();

      // Client-side validation shows "Please enter a valid YouTube URL"
      await expect(page.locator('text=/valid YouTube URL/i')).toBeVisible({ timeout: 5000 });
    });

    test('non-YouTube URL shows validation error', async ({ page }) => {
      await homePage.urlInput.fill(TEST_VIDEOS.invalid.wrongDomain);
      await homePage.extractButton.click();

      await expect(page.locator('text=/valid YouTube URL/i')).toBeVisible({ timeout: 5000 });
    });

    test('server error is displayed to user', async ({ page }) => {
      await page.route('**/api/extract/video', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Invalid YouTube URL or video ID' }),
        });
      });

      await homePage.submitUrl(TEST_VIDEOS.valid.url);

      await expect(page.locator('text=/Invalid YouTube URL/i')).toBeVisible({ timeout: 10000 });
    });
  });
});
