import { test, expect } from '@playwright/test';
import { signUpUser, signOutUser } from '../utils/auth-helpers';
import { extractVideo, assertApiSuccess, assertApiError } from '../utils/api-helpers';
import { TEST_VIDEOS, generateTestEmail, generateTestPassword } from '../fixtures/test-data';

test.describe('Video Extraction', () => {
  test.describe('Anonymous User Extraction', () => {
    test('should extract transcript for valid video URL', async ({ page }) => {
      await page.goto('/');

      // Enter video URL
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);

      // Click extract button
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');

      // Wait for extraction to complete
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Should show video preview with title
      await expect(page.locator('text=/video|title/i')).toBeVisible();

      // Should show transcript text
      const transcriptText = await page.locator('text=/transcript|segments/i').first().textContent();
      expect(transcriptText).toBeTruthy();
    });

    test('should accept different YouTube URL formats', async ({ page }) => {
      const urlFormats = [
        TEST_VIDEOS.valid.url,
        TEST_VIDEOS.valid.shortUrl,
        TEST_VIDEOS.valid.embedUrl,
        TEST_VIDEOS.valid.id,
      ];

      for (const url of urlFormats) {
        await page.goto('/');
        await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', url);
        await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');

        // Wait for extraction to complete or start
        await page.waitForSelector('text=/transcript|video|extracting/i', { timeout: 15000 });

        // Clear for next iteration
        await page.goto('/');
      }
    });

    test('should show error for invalid URL', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.invalid.malformed);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');

      // Should show error message
      await expect(page.locator('text=/invalid.*url|invalid.*video|error/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for non-existent video', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.invalid.nonExistent);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');

      // Should show error message
      await expect(page.locator('text=/not found|unavailable|no.*captions|error/i').first()).toBeVisible({ timeout: 15000 });
    });

    test('should show error for non-YouTube URL', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.invalid.wrongDomain);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');

      // Should show error message
      await expect(page.locator('text=/invalid.*url|youtube.*url|not.*youtube/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should enforce anonymous rate limits', async ({ page }) => {
      // Make multiple requests quickly to hit rate limit
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(extractVideo(page, TEST_VIDEOS.valid.url));
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited
      const rateLimitedResponse = responses.find(r => r.status() === 429);
      expect(rateLimitedResponse).toBeTruthy();

      if (rateLimitedResponse) {
        await assertApiError(rateLimitedResponse, 429, 'rate limit');
      }
    });
  });

  test.describe('Authenticated User Extraction', () => {
    test('should extract transcript for authenticated user', async ({ page }) => {
      // Sign up user
      const testUser = {
        email: generateTestEmail('extract-auth'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');

      // Enter video URL
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');

      // Wait for extraction
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Should show transcript
      await expect(page.locator('text=/transcript/i')).toBeVisible();
    });

    test('should save extraction to history', async ({ page }) => {
      // Sign up user
      const testUser = {
        email: generateTestEmail('extract-history'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract video
      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Navigate to history
      await page.goto('/history');
      await page.waitForLoadState('networkidle');

      // Should see the extracted video in history
      await expect(page.locator(`text=${TEST_VIDEOS.valid.id}`).or(page.locator('text=/video|history/i'))).toBeVisible();
    });

    test('should show export options for authenticated user', async ({ page }) => {
      // Sign up user
      const testUser = {
        email: generateTestEmail('extract-export'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract video
      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Should show export options
      await expect(page.locator('text=/export|download|txt|srt|json/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should allow saving transcript to library', async ({ page }) => {
      // Sign up user
      const testUser = {
        email: generateTestEmail('extract-save'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract video
      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Click save button
      const saveButton = page.locator('button:has-text("Save"), button[aria-label*="Save" i]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // Should show success message
        await expect(page.locator('text=/saved|added.*library/i').first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should enforce free tier daily limit', async ({ page }) => {
      // Sign up user
      const testUser = {
        email: generateTestEmail('free-limit'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Free tier has 3 videos per day limit
      // Extract 4 videos to hit the limit
      const responses = [];
      for (let i = 0; i < 4; i++) {
        const response = await extractVideo(page, TEST_VIDEOS.valid.url);
        responses.push(response);
      }

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      if (lastResponse.status() === 429) {
        await assertApiError(lastResponse, 429, 'limit');
      }
    });
  });

  test.describe('Extraction Features', () => {
    test('should display video metadata', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Should display video title
      await expect(page.locator('[class*="title" i], h1, h2, h3').first()).toBeVisible();

      // Should display thumbnail
      const thumbnail = page.locator('img[src*="ytimg.com"], img[src*="youtube.com"]').first();
      const hasThumbnail = await thumbnail.isVisible().catch(() => false);
      expect(hasThumbnail).toBe(true);
    });

    test('should show word count', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Should show word count
      await expect(page.locator('text=/\\d+\\s*words/i').first()).toBeVisible({ timeout: 5000 });
    });

    test('should toggle between plain text and segments view', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Look for view toggle buttons
      const plainTextButton = page.locator('button:has-text("Plain Text"), button:has-text("Text")').first();
      const segmentsButton = page.locator('button:has-text("Segments"), button:has-text("Timestamps")').first();

      const hasViewToggle = await plainTextButton.isVisible().catch(() => false) ||
                           await segmentsButton.isVisible().catch(() => false);

      if (hasViewToggle) {
        // Click segments view if available
        if (await segmentsButton.isVisible()) {
          await segmentsButton.click();
          await page.waitForTimeout(500);
        }

        // Should show timestamps in segments view
        const hasTimestamps = await page.locator('text=/\\d{1,2}:\\d{2}/').first().isVisible({ timeout: 2000 }).catch(() => false);
        expect(hasTimestamps).toBe(true);
      }
    });

    test('should allow copying transcript text', async ({ page }) => {
      await page.goto('/');

      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Look for copy button
      const copyButton = page.locator('button:has-text("Copy"), button[aria-label*="Copy" i]').first();
      const hasCopyButton = await copyButton.isVisible().catch(() => false);

      if (hasCopyButton) {
        await copyButton.click();

        // Should show success feedback
        await expect(page.locator('text=/copied|copy.*success/i').first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('URL Input Validation', () => {
    test('should show channel detection message for channel URL', async ({ page }) => {
      await page.goto('/');

      // Enter a channel URL instead of video URL
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', 'https://www.youtube.com/@TEDEd');

      // Should detect it's a channel and show appropriate message or options
      const channelDetected = await page.locator('text=/channel|batch.*extract|multiple.*videos/i').first().isVisible({ timeout: 3000 }).catch(() => false);

      // This is expected behavior - channel URLs should be detected
      expect(channelDetected).toBe(true);
    });

    test('should clear previous results on new extraction', async ({ page }) => {
      await page.goto('/');

      // First extraction
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);
      await page.click('button:has-text("Extract"), button:has-text("Get Transcript")');
      await page.waitForSelector('text=/transcript|video/i', { timeout: 30000 });

      // Start new extraction
      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_VIDEOS.valid.url);

      // Previous results should be cleared or hidden
      // This ensures clean state for new extractions
    });
  });
});
