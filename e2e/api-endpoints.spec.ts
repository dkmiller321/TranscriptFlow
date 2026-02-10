import { test, expect } from '@playwright/test';

test.describe('API Endpoint Tests', () => {
  test.describe('POST /api/extract/video', () => {
    test('returns JSON content-type', async ({ request }) => {
      const response = await request.post('/api/extract/video', {
        data: { url: 'https://www.youtube.com/watch?v=Gc2en3nHxA4' },
      });

      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('returns 400 for missing URL', async ({ request }) => {
      const response = await request.post('/api/extract/video', {
        data: {},
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('URL is required');
    });

    test('returns 400 for invalid URL format', async ({ request }) => {
      const response = await request.post('/api/extract/video', {
        data: { url: 'not-a-valid-url' },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid YouTube URL');
    });

    test('returns 400 for non-YouTube URL', async ({ request }) => {
      const response = await request.post('/api/extract/video', {
        data: { url: 'https://vimeo.com/123456' },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('returns 400 for empty string URL', async ({ request }) => {
      const response = await request.post('/api/extract/video', {
        data: { url: '' },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('GET /api/usage', () => {
    test('returns JSON response', async ({ request }) => {
      const response = await request.get('/api/usage');

      // Usage endpoint works for both authenticated and anonymous users
      expect(response.headers()['content-type']).toContain('application/json');
      const body = await response.json();
      // Should have usage-related fields
      expect(body).toHaveProperty('limits');
    });
  });

  test.describe('GET /api/history', () => {
    test('returns 401 for unauthenticated users', async ({ request }) => {
      const response = await request.get('/api/history');

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('POST /api/transcripts', () => {
    test('returns 401 for unauthenticated users', async ({ request }) => {
      const response = await request.post('/api/transcripts', {
        data: {
          videoId: 'test',
          videoTitle: 'Test',
          content: 'Test content',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('GET /api/settings', () => {
    test('returns 401 for unauthenticated users', async ({ request }) => {
      const response = await request.get('/api/settings');

      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/stripe/checkout', () => {
    test('rejects unauthenticated requests', async ({ request }) => {
      const response = await request.post('/api/stripe/checkout', {
        data: { tier: 'pro', interval: 'monthly' },
      });

      // Should be 401 or 403
      expect(response.ok()).toBe(false);
    });
  });
});
