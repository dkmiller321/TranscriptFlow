import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';
import {
  TEST_VIDEOS,
  TEST_CHANNELS,
  MOCK_TRANSCRIPT_RESPONSE,
  MOCK_SAVED_TRANSCRIPTS,
  MOCK_HISTORY,
} from './fixtures/test-data';
import { mockAuthentication, getMockUsageResponse, MOCK_SETTINGS } from './fixtures/auth-helpers';

const MOBILE_VIEWPORT = { width: 393, height: 851 }; // Pixel 5

test.describe('Mobile - Homepage & Hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('hero heading and URL input are visible', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('extract button is disabled when input is empty', async ({ page }) => {
    await expect(page.locator('button[type="submit"]').first()).toBeDisabled();
  });

  test('features section is visible on mobile', async ({ page }) => {
    await page.locator('text=Building with AI').scrollIntoViewIfNeeded();
    await expect(page.locator('text=Building with AI')).toBeVisible();
  });
});

test.describe('Mobile - URL Submission & Transcript Display', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Mock extract API
    await page.route('**/api/extract/video', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TRANSCRIPT_RESPONSE),
      });
    });

    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('can submit URL and see transcript on mobile', async ({ page }) => {
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    // Video title should be visible
    const { title } = MOCK_TRANSCRIPT_RESPONSE.data.videoInfo;
    await expect(page.locator(`text=${title}`)).toBeVisible();
  });

  test('video preview stacks vertically on mobile', async ({ page }) => {
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    // Video preview container uses flex-col on mobile
    const preview = page.locator('[class*="flex"][class*="flex-col"]').filter({
      hasText: MOCK_TRANSCRIPT_RESPONSE.data.videoInfo.title,
    }).first();
    await expect(preview).toBeVisible();
  });

  test('export buttons are visible on mobile', async ({ page }) => {
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    // Scroll to export section
    await homePage.copyButton.scrollIntoViewIfNeeded();
    await expect(homePage.copyButton).toBeVisible();
    await expect(homePage.downloadTxtButton).toBeVisible();
  });

  test('copy to clipboard works on mobile', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    await homePage.copyButton.scrollIntoViewIfNeeded();
    await homePage.copyButton.click();

    await expect(page.locator('button:has-text("Copied!")')).toBeVisible({ timeout: 5000 });
  });

  test('transcript view tabs work on mobile', async ({ page }) => {
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    // Scroll to transcript viewer
    await homePage.plainTextTab.scrollIntoViewIfNeeded();
    await expect(homePage.plainTextTab).toBeVisible();
    await expect(homePage.timestampedTab).toBeVisible();

    // Switch to timestamped view
    await homePage.timestampedTab.click();
    await expect(page.locator('text=/\\d{1,2}:\\d{2}/').first()).toBeVisible({ timeout: 5000 });
  });

  test('transcript search works on mobile', async ({ page }) => {
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    await homePage.searchInput.scrollIntoViewIfNeeded();
    await homePage.searchInput.fill('Bitcoin');

    await expect(page.locator('text=/\\d+\\s*match/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('word count displays on mobile', async () => {
    await homePage.submitUrl(TEST_VIDEOS.valid.url);
    await homePage.waitForTranscriptResult();

    await homePage.wordCount.scrollIntoViewIfNeeded();
    await expect(homePage.wordCount).toBeVisible();
    await expect(homePage.wordCount).toContainText('words');
  });

  test('validation error shows on mobile for invalid URL', async ({ page }) => {
    await homePage.urlInput.fill('not-a-url');
    await expect(homePage.extractButton).toBeEnabled();
    await homePage.extractButton.click();

    await expect(page.locator('text=/valid YouTube URL/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile - Channel Extraction', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('channel URL shows channel options on mobile', async ({ page }) => {
    await page.locator('input[type="text"]').first().fill(TEST_CHANNELS.valid.handle);

    // Channel options panel should appear
    await expect(page.locator('text=/videos to extract/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });

  test('channel format toggle is visible on mobile', async ({ page }) => {
    await page.locator('input[type="text"]').first().fill(TEST_CHANNELS.valid.handle);

    await expect(page.locator('text=/output format/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Combined")')).toBeVisible();
    await expect(page.locator('button:has-text("ZIP")')).toBeVisible();
  });

  test('extract channel button shows on mobile', async ({ page }) => {
    await page.locator('input[type="text"]').first().fill(TEST_CHANNELS.valid.handle);

    await expect(
      page.locator('button[type="submit"]:has-text("Extract channel")')
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Mobile - Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
  });

  test('pricing page renders with all tiers on mobile', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // All three tier prices should be visible (may need scrolling)
    await expect(page.locator('text=$0').first()).toBeVisible();

    await page.locator('text=$9.99').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=$9.99').first()).toBeVisible();

    await page.locator('text=$29.99').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=$29.99').first()).toBeVisible();
  });

  test('billing toggle works on mobile', async ({ page }) => {
    await expect(page.locator('button:has-text("Monthly")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Yearly")')).toBeVisible();

    await page.locator('button:has-text("Yearly")').click();

    // Should show yearly indicator
    await expect(page.locator('text=/\\/yr|yearly|annual/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('CTA buttons are tappable on mobile', async ({ page }) => {
    const freeButton = page.locator('button:has-text("Get Started Free")');
    await freeButton.scrollIntoViewIfNeeded();
    await expect(freeButton).toBeVisible({ timeout: 15000 });
    await expect(freeButton).toBeEnabled();
  });

  test('Most Popular badge is visible on mobile', async ({ page }) => {
    const badge = page.locator('text=Most Popular');
    await badge.scrollIntoViewIfNeeded();
    await expect(badge).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Mobile - Login Page', () => {
  test('login form renders correctly on mobile', async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('can fill and submit login form on mobile', async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Mock auth to return error (just testing form interaction)
    await page.route('**/auth/v1/token**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Error should show
    await expect(page.locator('[class*="destructive"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mobile - Signup Page', () => {
  test('signup form renders correctly on mobile', async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1:has-text("Create account")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

test.describe('Mobile - Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);
    await mockAuthentication(page, 'free');

    await page.route('**/api/settings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SETTINGS),
      });
    });

    await page.route('**/api/usage', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(getMockUsageResponse('free')),
      });
    });

    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
  });

  test('settings page renders with tabs on mobile', async ({ page }) => {
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('tab', { name: 'Account' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Usage' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Preferences' })).toBeVisible();
  });

  test('can switch tabs on mobile', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Account' })).toBeVisible({ timeout: 15000 });

    // Switch to Usage tab
    await page.getByRole('tab', { name: 'Usage' }).click();
    await expect(page.getByText('Current Plan', { exact: true })).toBeVisible({ timeout: 10000 });

    // Switch to Preferences tab
    await page.getByRole('tab', { name: 'Preferences' }).click();
    await expect(page.locator('text=Appearance')).toBeVisible({ timeout: 10000 });
  });

  test('account info scrolls correctly on mobile', async ({ page }) => {
    await expect(page.locator('text=Account Information')).toBeVisible({ timeout: 15000 });

    // Scroll to Danger Zone
    const dangerZone = page.locator('text=Danger Zone');
    await dangerZone.scrollIntoViewIfNeeded();
    await expect(dangerZone).toBeVisible();
  });
});

test.describe('Mobile - Library Page', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);
    await mockAuthentication(page, 'free');

    await page.route('**/api/transcripts**', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_SAVED_TRANSCRIPTS),
        });
      }
    });

    await page.goto('/library');
    await page.waitForLoadState('domcontentloaded');
  });

  test('library page renders on mobile', async ({ page }) => {
    await expect(page.locator('text=My Library')).toBeVisible({ timeout: 15000 });
  });

  test('transcript cards display in single column on mobile', async ({ page }) => {
    // Wait for library to fully render before scrolling
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const mlCard = page.locator('text=Introduction to Machine Learning').first();
    await mlCard.waitFor({ state: 'attached', timeout: 10000 });
    await mlCard.scrollIntoViewIfNeeded();
    await expect(mlCard).toBeVisible();

    const webDevCard = page.locator('text=Web Development in 2024').first();
    await webDevCard.waitFor({ state: 'attached', timeout: 10000 });
    await webDevCard.scrollIntoViewIfNeeded();
    await expect(webDevCard).toBeVisible();
  });

  test('filter buttons work on mobile', async ({ page }) => {
    await expect(page.locator('button:has-text("All")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Favorites")')).toBeVisible();

    await page.locator('button:has-text("Favorites")').click();
    // Should still show favorited items
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Mobile - History Page', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.setViewportSize(MOBILE_VIEWPORT);
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
  });

  test('history page renders on mobile', async ({ page }) => {
    await expect(page.locator('h1:has-text("Extraction History")')).toBeVisible({ timeout: 15000 });
  });

  test('history items display on mobile', async ({ page }) => {
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    await page.locator('text=Introduction to Machine Learning').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Introduction to Machine Learning').first()).toBeVisible();
  });

  test('failed items visible on mobile', async ({ page }) => {
    await expect(page.locator('text=What is Bitcoin?').first()).toBeVisible({ timeout: 15000 });

    await page.locator('text=Unavailable Video').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Unavailable Video').first()).toBeVisible();
  });
});
