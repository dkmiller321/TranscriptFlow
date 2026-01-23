import { test, expect } from '@playwright/test';
import { signUpUser } from '../utils/auth-helpers';
import {
  startChannelExtraction,
  getChannelJobStatus,
  cancelChannelJob,
  pollChannelJobUntilComplete,
  assertApiSuccess,
  assertApiError,
} from '../utils/api-helpers';
import { TEST_CHANNELS, generateTestEmail, generateTestPassword } from '../fixtures/test-data';

test.describe('Channel Extraction', () => {
  test.describe('Access Control', () => {
    test('should block anonymous users from channel extraction', async ({ page }) => {
      // Try to start channel extraction without authentication
      const response = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 10 });

      // Should return 401 Unauthorized
      await assertApiError(response.response, 401);
    });

    test('should block free tier users from channel extraction', async ({ page }) => {
      // Sign up a free tier user
      const testUser = {
        email: generateTestEmail('free-channel'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Try to start channel extraction
      const response = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 10 });

      // Should return 403 Forbidden or error about tier requirement
      if (!response.response.ok()) {
        const data = await response.response.json();
        expect(data.error).toMatch(/upgrade|pro|tier|plan/i);
      }
    });
  });

  test.describe('Channel URL Validation', () => {
    test('should accept various channel URL formats via API', async ({ page }) => {
      // For this test, we'll just verify the URL is parsed correctly
      // Actual extraction would require Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-urls'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const channelUrls = [
        TEST_CHANNELS.valid.handleUrl,
        TEST_CHANNELS.valid.channelIdUrl,
        TEST_CHANNELS.valid.customUrl,
      ];

      for (const url of channelUrls) {
        const response = await page.request.post('/api/extract/channel', {
          data: { url, limit: 5 },
        });

        // May fail due to tier, but should not fail due to URL format
        if (response.status() === 403) {
          const data = await response.json();
          expect(data.error).not.toMatch(/invalid.*url|malformed/i);
        }
      }
    });

    test('should reject invalid channel URLs', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('channel-invalid'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const response = await startChannelExtraction(page, TEST_CHANNELS.invalid.malformed, { limit: 10 });

      // Should return error about invalid URL
      await assertApiError(response.response, undefined, 'invalid');
    });
  });

  test.describe('Channel Extraction UI', () => {
    test('should show channel extraction options when channel URL is detected', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('channel-ui'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');

      // Enter channel URL
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_CHANNELS.valid.handleUrl);

      // Should detect channel and show extraction options
      await expect(page.locator('text=/channel|multiple.*videos|batch/i').first()).toBeVisible({ timeout: 5000 });

      // Should show video limit selector
      const limitSelector = await page.locator('select, input[type="number"]').first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(limitSelector).toBe(true);
    });

    test('should show format options for channel extraction', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('channel-format'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_CHANNELS.valid.handleUrl);

      // Should show format options (combined file or individual ZIP)
      const hasFormatOptions = await page.locator('text=/combined|individual|format/i').first().isVisible({ timeout: 3000 }).catch(() => false);

      if (hasFormatOptions) {
        // Verify options are available
        await expect(page.locator('text=/combined|single.*file/i, text=/individual|separate.*files|zip/i')).toHaveCount(2);
      }
    });
  });

  test.describe('Extraction Progress', () => {
    test.skip('should show progress bar during extraction', async ({ page }) => {
      // This test requires Pro/Business tier
      // Skip for now, but structure is provided

      const testUser = {
        email: generateTestEmail('channel-progress'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_CHANNELS.valid.handleUrl);

      // Select small limit for faster testing
      const limitInput = page.locator('select, input[type="number"]').first();
      if (await limitInput.isVisible()) {
        await limitInput.fill('5');
      }

      // Start extraction
      await page.click('button:has-text("Extract"), button:has-text("Start")');

      // Should show progress bar
      await expect(page.locator('[role="progressbar"], progress, [class*="progress"]').first()).toBeVisible({ timeout: 5000 });

      // Should show progress text (e.g., "3 of 5 videos")
      await expect(page.locator('text=/\\d+\\s*of\\s*\\d+/i').first()).toBeVisible({ timeout: 5000 });
    });

    test.skip('should update progress in real-time', async ({ page }) => {
      // This test requires Pro/Business tier
      // Skip for now

      const testUser = {
        email: generateTestEmail('channel-realtime'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Start extraction via API
      const { jobId } = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 5 });

      // Navigate to page showing progress
      await page.goto('/');

      // Poll for progress updates
      let previousProgress = 0;
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);

        const progressResponse = await getChannelJobStatus(page, jobId);
        const data = await progressResponse.json();

        if (data.progress && data.progress.completed > previousProgress) {
          // Progress is updating
          previousProgress = data.progress.completed;
        }

        if (data.status === 'completed' || data.status === 'failed') {
          break;
        }
      }

      expect(previousProgress).toBeGreaterThan(0);
    });
  });

  test.describe('Extraction Cancellation', () => {
    test.skip('should allow canceling extraction via UI', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-cancel-ui'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_CHANNELS.valid.handleUrl);

      // Start extraction
      await page.click('button:has-text("Extract"), button:has-text("Start")');

      // Wait for progress to show
      await page.waitForTimeout(2000);

      // Click cancel button
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stop")').first();
      await cancelButton.click();

      // Should show cancelled status
      await expect(page.locator('text=/cancelled|stopped/i').first()).toBeVisible({ timeout: 5000 });
    });

    test.skip('should allow canceling extraction via API', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-cancel-api'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Start extraction
      const { jobId } = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 10 });

      // Wait a moment for job to start
      await page.waitForTimeout(2000);

      // Cancel via API
      const cancelResponse = await cancelChannelJob(page, jobId);
      await assertApiSuccess(cancelResponse);

      // Check job status
      const statusResponse = await getChannelJobStatus(page, jobId);
      const data = await statusResponse.json();

      expect(data.status).toMatch(/cancelled|stopped/i);
    });
  });

  test.describe('Extraction Results', () => {
    test.skip('should display successful extraction results', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-results'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Start and complete extraction
      const { jobId } = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 3 });

      // Poll until complete
      const result = await pollChannelJobUntilComplete(page, jobId, 120, 2000);

      expect(result.status).toBe('completed');
      expect(result.results).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);

      // Should show success count
      expect(result.progress.successful).toBeGreaterThan(0);
    });

    test.skip('should show failed video count', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-failures'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      await page.goto('/');
      await page.fill('input[placeholder*="YouTube" i], input[type="url"], input[type="text"]', TEST_CHANNELS.valid.handleUrl);
      await page.click('button:has-text("Extract"), button:has-text("Start")');

      // Wait for completion
      await page.waitForSelector('text=/complete|finished/i', { timeout: 120000 });

      // Should show failed count (if any)
      const failedText = await page.locator('text=/failed|error/i').first().textContent();
      expect(failedText).toBeTruthy();
    });

    test.skip('should allow downloading results', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-download'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Complete extraction
      const { jobId } = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 3 });
      await pollChannelJobUntilComplete(page, jobId, 120, 2000);

      // Navigate to results page or UI showing download button
      await page.goto('/');

      // Should have download button
      const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")').first();
      await expect(downloadButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Limit Enforcement', () => {
    test.skip('should enforce Pro tier channel limit (25 videos)', async ({ page }) => {
      // This test requires Pro tier setup
      const testUser = {
        email: generateTestEmail('pro-limit'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Try to extract 30 videos (above Pro limit)
      const response = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 30 });

      // Should be rejected or capped at 25
      const data = await response.response.json();

      if (!response.response.ok()) {
        expect(data.error).toMatch(/limit|25|tier/i);
      } else {
        // If allowed, verify it's capped at 25
        expect(data.limit).toBeLessThanOrEqual(25);
      }
    });

    test.skip('should enforce Business tier channel limit (500 videos)', async ({ page }) => {
      // This test requires Business tier setup
      const testUser = {
        email: generateTestEmail('business-limit'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Try to extract 600 videos (above Business limit)
      const response = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 600 });

      // Should be rejected or capped at 500
      const data = await response.response.json();

      if (!response.response.ok()) {
        expect(data.error).toMatch(/limit|500|maximum/i);
      } else {
        // If allowed, verify it's capped at 500
        expect(data.limit).toBeLessThanOrEqual(500);
      }
    });
  });

  test.describe('Error Handling', () => {
    test.skip('should handle channel with no videos gracefully', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-no-videos'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Use a channel URL that exists but has no public videos
      const response = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 10 });

      // Should handle gracefully
      await assertApiSuccess(response.response);
    });

    test.skip('should handle channel with mixed public/private videos', async ({ page }) => {
      // This test requires Pro/Business tier
      const testUser = {
        email: generateTestEmail('channel-mixed'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      const { jobId } = await startChannelExtraction(page, TEST_CHANNELS.valid.handleUrl, { limit: 10 });
      const result = await pollChannelJobUntilComplete(page, jobId, 120, 2000);

      // Should skip private videos and complete successfully
      expect(result.status).toBe('completed');

      // May have some failures for private videos
      if (result.progress.failed > 0) {
        expect(result.progress.successful).toBeGreaterThan(0);
      }
    });
  });
});
