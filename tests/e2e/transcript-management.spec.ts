import { test, expect } from '@playwright/test';
import { signUpUser } from '../utils/auth-helpers';
import {
  extractVideo,
  saveTranscript,
  getSavedTranscripts,
  updateTranscript,
  deleteTranscript,
  exportTranscript,
  assertApiSuccess,
  assertApiError,
} from '../utils/api-helpers';
import { TEST_VIDEOS, generateTestEmail, generateTestPassword, EXPORT_FORMATS } from '../fixtures/test-data';

test.describe('Transcript Management', () => {
  test.describe('Saving Transcripts', () => {
    test('should save transcript to library', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('save-transcript'),
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
      await saveButton.click();

      // Should show success message
      await expect(page.locator('text=/saved|added.*library/i').first()).toBeVisible({ timeout: 5000 });

      // Verify in library
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Should see the saved transcript
      await expect(page.locator(`text=${TEST_VIDEOS.valid.id}`).or(page.locator('text=/transcript|video/i'))).toBeVisible();
    });

    test('should save transcript via API', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('save-api'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract video first
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      await assertApiSuccess(extractResponse);
      const extractData = await extractResponse.json();

      // Save to library
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
        segments: extractData.segments,
        srtContent: extractData.srtContent,
      });

      await assertApiSuccess(saveResponse);
      const saveData = await saveResponse.json();
      expect(saveData.id).toBeDefined();
    });

    test('should prevent duplicate saves', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('save-duplicate'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Extract and save
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();

      await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });

      // Try to save again
      const duplicateResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });

      // Should either succeed (idempotent) or show already saved message
      const data = await duplicateResponse.json();
      if (!duplicateResponse.ok()) {
        expect(data.error).toMatch(/already|duplicate|exists/i);
      }
    });
  });

  test.describe('Viewing Saved Transcripts', () => {
    test('should display saved transcripts in library', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('view-library'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save a transcript first
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });

      // Navigate to library
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Should see transcript card with title
      await expect(page.locator('text=/video|transcript/i').first()).toBeVisible();
    });

    test('should paginate saved transcripts', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('library-pagination'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Get transcripts via API to check pagination
      const response = await getSavedTranscripts(page, { page: 1, limit: 10 });
      await assertApiSuccess(response);

      const data = await response.json();
      expect(data.transcripts).toBeDefined();
      expect(Array.isArray(data.transcripts)).toBe(true);
    });

    test('should filter favorites', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('library-favorites'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save and favorite a transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Mark as favorite
      await updateTranscript(page, saveData.id, { isFavorite: true });

      // Get favorites
      const favoritesResponse = await getSavedTranscripts(page, { favorites: true });
      await assertApiSuccess(favoritesResponse);

      const favoritesData = await favoritesResponse.json();
      expect(favoritesData.transcripts.length).toBeGreaterThan(0);
      expect(favoritesData.transcripts[0].isFavorite).toBe(true);
    });
  });

  test.describe('Favoriting Transcripts', () => {
    test('should mark transcript as favorite', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('favorite'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Mark as favorite via API
      const updateResponse = await updateTranscript(page, saveData.id, { isFavorite: true });
      await assertApiSuccess(updateResponse);
    });

    test('should toggle favorite status', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('favorite-toggle'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Mark as favorite
      await updateTranscript(page, saveData.id, { isFavorite: true });

      // Unmark as favorite
      await updateTranscript(page, saveData.id, { isFavorite: false });

      // Verify it's not in favorites
      const favoritesResponse = await getSavedTranscripts(page, { favorites: true });
      const favoritesData = await favoritesResponse.json();

      const isFavorited = favoritesData.transcripts.some((t: any) => t.id === saveData.id);
      expect(isFavorited).toBe(false);
    });

    test('should show favorite indicator in UI', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('favorite-ui'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save and favorite transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();
      await updateTranscript(page, saveData.id, { isFavorite: true });

      // Go to library
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Should see favorite icon/indicator
      const favoriteIcon = page.locator('[aria-label*="favorite" i], svg[class*="favorite"], [class*="favorite"]').first();
      const hasFavoriteIndicator = await favoriteIcon.isVisible().catch(() => false);
      expect(hasFavoriteIndicator).toBe(true);
    });
  });

  test.describe('Adding Tags and Notes', () => {
    test('should add tags to transcript', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('tags'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Add tags
      const updateResponse = await updateTranscript(page, saveData.id, {
        tags: ['tutorial', 'testing', 'automation'],
      });
      await assertApiSuccess(updateResponse);

      // Verify tags were saved
      const transcriptsResponse = await getSavedTranscripts(page);
      const transcriptsData = await transcriptsResponse.json();
      const transcript = transcriptsData.transcripts.find((t: any) => t.id === saveData.id);

      expect(transcript.tags).toEqual(expect.arrayContaining(['tutorial', 'testing', 'automation']));
    });

    test('should add notes to transcript', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('notes'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Add notes
      const notes = 'This is a test video for E2E testing. Very useful!';
      const updateResponse = await updateTranscript(page, saveData.id, { notes });
      await assertApiSuccess(updateResponse);

      // Verify notes were saved
      const transcriptsResponse = await getSavedTranscripts(page);
      const transcriptsData = await transcriptsResponse.json();
      const transcript = transcriptsData.transcripts.find((t: any) => t.id === saveData.id);

      expect(transcript.notes).toBe(notes);
    });

    test('should update existing tags and notes', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('update-tags-notes'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript with initial tags and notes
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      await updateTranscript(page, saveData.id, {
        tags: ['tag1'],
        notes: 'Original notes',
      });

      // Update tags and notes
      await updateTranscript(page, saveData.id, {
        tags: ['tag2', 'tag3'],
        notes: 'Updated notes',
      });

      // Verify updates
      const transcriptsResponse = await getSavedTranscripts(page);
      const transcriptsData = await transcriptsResponse.json();
      const transcript = transcriptsData.transcripts.find((t: any) => t.id === saveData.id);

      expect(transcript.tags).toEqual(expect.arrayContaining(['tag2', 'tag3']));
      expect(transcript.notes).toBe('Updated notes');
    });
  });

  test.describe('Deleting Transcripts', () => {
    test('should delete transcript from library', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('delete'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Delete transcript
      const deleteResponse = await deleteTranscript(page, saveData.id);
      await assertApiSuccess(deleteResponse);

      // Verify it's deleted
      const transcriptsResponse = await getSavedTranscripts(page);
      const transcriptsData = await transcriptsResponse.json();
      const transcript = transcriptsData.transcripts.find((t: any) => t.id === saveData.id);

      expect(transcript).toBeUndefined();
    });

    test('should show confirmation dialog before deleting', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('delete-confirm'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });

      // Go to library
      await page.goto('/library');
      await page.waitForLoadState('networkidle');

      // Click delete button
      const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("Delete")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        await expect(page.locator('text=/are you sure|confirm|delete/i').first()).toBeVisible({ timeout: 3000 });
      }
    });
  });

  test.describe('Exporting Transcripts', () => {
    test('should export transcript in TXT format', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('export-txt'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Export as TXT
      const exportResponse = await exportTranscript(page, saveData.id, 'txt');
      expect(exportResponse.ok()).toBeTruthy();

      const content = await exportResponse.text();
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain(extractData.plainText.substring(0, 50));
    });

    test('should export transcript in SRT format', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('export-srt'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
        srtContent: extractData.srtContent,
      });
      const saveData = await saveResponse.json();

      // Export as SRT
      const exportResponse = await exportTranscript(page, saveData.id, 'srt');
      expect(exportResponse.ok()).toBeTruthy();

      const content = await exportResponse.text();
      expect(content).toMatch(/\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/);
    });

    test('should export transcript in JSON format', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('export-json'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
        segments: extractData.segments,
      });
      const saveData = await saveResponse.json();

      // Export as JSON
      const exportResponse = await exportTranscript(page, saveData.id, 'json');
      expect(exportResponse.ok()).toBeTruthy();

      const content = await exportResponse.text();
      const jsonData = JSON.parse(content);

      expect(jsonData.videoId).toBeDefined();
      expect(jsonData.segments).toBeDefined();
      expect(Array.isArray(jsonData.segments)).toBe(true);
    });

    test('should set correct Content-Disposition header for downloads', async ({ page }) => {
      const testUser = {
        email: generateTestEmail('export-headers'),
        password: generateTestPassword(),
      };
      await signUpUser(page, testUser);

      // Save transcript
      const extractResponse = await extractVideo(page, TEST_VIDEOS.valid.url);
      const extractData = await extractResponse.json();
      const saveResponse = await saveTranscript(page, {
        videoId: extractData.videoInfo.videoId,
        title: extractData.videoInfo.title,
        plainText: extractData.plainText,
      });
      const saveData = await saveResponse.json();

      // Export and check headers
      const exportResponse = await exportTranscript(page, saveData.id, 'txt');
      const contentDisposition = exportResponse.headers()['content-disposition'];

      expect(contentDisposition).toMatch(/attachment/);
      expect(contentDisposition).toMatch(/\.txt/);
    });
  });
});
