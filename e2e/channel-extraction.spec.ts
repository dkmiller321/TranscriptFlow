import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import {
  TEST_CHANNELS,
  MOCK_CHANNEL_JOB_RESPONSE,
  MOCK_CHANNEL_COMPLETED_RESPONSE,
  MOCK_CHANNEL_TIER_RESTRICTION,
} from './fixtures/test-data';
import { mockAuthentication } from './fixtures/auth-helpers';

test.describe('Channel URL Detection', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('channel handle URL shows channel extraction button', async ({ page }) => {
    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);

    // Should show "Extract channel" button instead of "Get transcript"
    await expect(page.locator('button[type="submit"]:has-text("Extract channel")')).toBeVisible({ timeout: 5000 });
  });

  test('channel ID URL shows channel extraction button', async ({ page }) => {
    await homePage.urlInput.fill(TEST_CHANNELS.valid.channelId);

    await expect(page.locator('button[type="submit"]:has-text("Extract channel")')).toBeVisible({ timeout: 5000 });
  });

  test('channel options panel appears for channel URLs', async ({ page }) => {
    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);

    // Wait for channel options panel to appear
    await expect(page.locator('text=/videos to extract/i')).toBeVisible({ timeout: 5000 });
  });

  test('channel options include video limit slider', async ({ page }) => {
    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);

    // Slider should be present
    await expect(page.locator('input[type="range"]')).toBeVisible({ timeout: 5000 });
  });

  test('channel options include output format toggle', async ({ page }) => {
    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);

    // Combined and ZIP format options should be visible
    await expect(page.locator('text=/output format/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Combined")')).toBeVisible();
    await expect(page.locator('button:has-text("ZIP")')).toBeVisible();
  });

  test('switching to video URL hides channel options', async ({ page }) => {
    // First enter a channel URL
    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);
    await expect(page.locator('text=/videos to extract/i')).toBeVisible({ timeout: 5000 });

    // Then switch to a video URL
    await homePage.urlInput.clear();
    await homePage.urlInput.fill('https://www.youtube.com/watch?v=Gc2en3nHxA4');

    // Channel options should disappear
    await expect(page.locator('text=/videos to extract/i')).not.toBeVisible({ timeout: 5000 });
    // Should show regular extract button
    await expect(page.locator('button[type="submit"]:has-text("Get transcript")')).toBeVisible();
  });
});

test.describe('Channel Extraction Flow (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated user with pro tier
    await mockAuthentication(page, 'pro');
  });

  test('channel extraction submits and shows progress', async ({ page }) => {
    // Mock the channel extraction API
    await page.route('**/api/extract/channel', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_CHANNEL_JOB_RESPONSE),
        });
      }
    });

    // Mock the job status polling to return completed
    await page.route('**/api/extract/channel/job-test-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHANNEL_COMPLETED_RESPONSE),
      });
    });

    const homePage = new HomePage(page);
    await homePage.goto();

    // Enter channel URL
    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);

    // Wait for channel mode
    await expect(page.locator('button[type="submit"]:has-text("Extract channel")')).toBeVisible({ timeout: 5000 });

    // Submit
    await page.locator('button[type="submit"]:has-text("Extract channel")').click();

    // Should show progress or results
    await expect(
      page.locator('text=/processing|extracting|complete|99Bitcoins/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('completed channel extraction shows results with video list', async ({ page }) => {
    // Mock channel extraction to return completed immediately
    await page.route('**/api/extract/channel', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_CHANNEL_JOB_RESPONSE,
            data: { ...MOCK_CHANNEL_JOB_RESPONSE.data, status: 'completed' },
          }),
        });
      }
    });

    await page.route('**/api/extract/channel/job-test-001', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHANNEL_COMPLETED_RESPONSE),
      });
    });

    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);
    await expect(page.locator('button[type="submit"]:has-text("Extract channel")')).toBeVisible({ timeout: 5000 });
    await page.locator('button[type="submit"]:has-text("Extract channel")').click();

    // Should eventually show completed results
    await expect(
      page.locator('text=/videos extracted|Processed Videos|Download/i').first()
    ).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Channel Extraction - Tier Restrictions', () => {
  test('free tier user sees upgrade nudge on channel options', async ({ page }) => {
    // Unauthenticated / free tier user
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);

    // Should see the upgrade nudge or tier info
    await expect(
      page.locator('text=/upgrade|pro|business/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('free tier channel extraction shows tier restriction error', async ({ page }) => {
    // Mock the channel extraction API to return tier restriction
    await page.route('**/api/extract/channel', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CHANNEL_TIER_RESTRICTION),
      });
    });

    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.urlInput.fill(TEST_CHANNELS.valid.handle);
    await expect(page.locator('button[type="submit"]:has-text("Extract channel")')).toBeVisible({ timeout: 5000 });
    await page.locator('button[type="submit"]:has-text("Extract channel")').click();

    // Should show tier restriction error
    await expect(
      page.locator('text=/not available|free tier|upgrade/i').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
