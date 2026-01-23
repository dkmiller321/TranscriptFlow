import { Page, APIResponse, expect } from '@playwright/test';

/**
 * Extract a video transcript via API
 */
export async function extractVideo(page: Page, url: string): Promise<APIResponse> {
  return await page.request.post('/api/extract/video', {
    data: { url },
  });
}

/**
 * Start a channel extraction job via API
 */
export async function startChannelExtraction(
  page: Page,
  url: string,
  options?: { limit?: number; format?: 'combined' | 'individual' }
): Promise<{ jobId: string; response: APIResponse }> {
  const response = await page.request.post('/api/extract/channel', {
    data: {
      url,
      limit: options?.limit,
      format: options?.format,
    },
  });

  const data = await response.json();
  return {
    jobId: data.jobId,
    response,
  };
}

/**
 * Get channel extraction job status via API
 */
export async function getChannelJobStatus(page: Page, jobId: string): Promise<APIResponse> {
  return await page.request.get(`/api/extract/channel/${jobId}`);
}

/**
 * Cancel channel extraction job via API
 */
export async function cancelChannelJob(page: Page, jobId: string): Promise<APIResponse> {
  return await page.request.delete(`/api/extract/channel/${jobId}?action=cancel`);
}

/**
 * Poll channel job until completion or failure
 */
export async function pollChannelJobUntilComplete(
  page: Page,
  jobId: string,
  maxAttempts: number = 60,
  intervalMs: number = 1000
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await getChannelJobStatus(page, jobId);
    const data = await response.json();

    if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
      return data;
    }

    await page.waitForTimeout(intervalMs);
  }

  throw new Error(`Job ${jobId} did not complete within ${maxAttempts * intervalMs}ms`);
}

/**
 * Save a transcript via API
 */
export async function saveTranscript(
  page: Page,
  transcript: {
    videoId: string;
    title: string;
    plainText: string;
    segments?: any[];
    srtContent?: string;
  }
): Promise<APIResponse> {
  return await page.request.post('/api/transcripts', {
    data: transcript,
  });
}

/**
 * Get saved transcripts via API
 */
export async function getSavedTranscripts(
  page: Page,
  options?: { page?: number; limit?: number; favorites?: boolean }
): Promise<APIResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.favorites) params.set('favorites', 'true');

  return await page.request.get(`/api/transcripts?${params.toString()}`);
}

/**
 * Update a transcript via API
 */
export async function updateTranscript(
  page: Page,
  id: string,
  updates: { isFavorite?: boolean; tags?: string[]; notes?: string }
): Promise<APIResponse> {
  return await page.request.patch('/api/transcripts', {
    data: { id, ...updates },
  });
}

/**
 * Delete a transcript via API
 */
export async function deleteTranscript(page: Page, id: string): Promise<APIResponse> {
  return await page.request.delete(`/api/transcripts?id=${id}`);
}

/**
 * Get extraction history via API
 */
export async function getHistory(
  page: Page,
  options?: { page?: number; limit?: number }
): Promise<APIResponse> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.limit) params.set('limit', options.limit.toString());

  return await page.request.get(`/api/history?${params.toString()}`);
}

/**
 * Delete a history item via API
 */
export async function deleteHistoryItem(page: Page, id: string): Promise<APIResponse> {
  return await page.request.delete(`/api/history?id=${id}`);
}

/**
 * Export a transcript in a specific format via API
 */
export async function exportTranscript(
  page: Page,
  id: string,
  format: 'txt' | 'srt' | 'json'
): Promise<APIResponse> {
  return await page.request.get(`/api/export?id=${id}&format=${format}`);
}

/**
 * Get usage statistics via API
 */
export async function getUsage(page: Page): Promise<APIResponse> {
  return await page.request.get('/api/usage');
}

/**
 * Get user settings via API
 */
export async function getSettings(page: Page): Promise<APIResponse> {
  return await page.request.get('/api/settings');
}

/**
 * Update user settings via API
 */
export async function updateSettings(
  page: Page,
  settings: { defaultExportFormat?: string; youtubeApiKey?: string }
): Promise<APIResponse> {
  return await page.request.patch('/api/settings', {
    data: settings,
  });
}

/**
 * Create a Stripe checkout session via API
 */
export async function createCheckoutSession(
  page: Page,
  tier: 'pro' | 'business',
  interval: 'monthly' | 'yearly' = 'monthly'
): Promise<APIResponse> {
  return await page.request.post('/api/stripe/checkout', {
    data: { tier, interval },
  });
}

/**
 * Create a Stripe billing portal session via API
 */
export async function createBillingPortalSession(page: Page): Promise<APIResponse> {
  return await page.request.post('/api/stripe/portal');
}

/**
 * Wait for a specific number of milliseconds
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that an API response is successful
 */
export async function assertApiSuccess(response: APIResponse): Promise<void> {
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.success).not.toBe(false);
}

/**
 * Assert that an API response failed with expected error
 */
export async function assertApiError(
  response: APIResponse,
  expectedStatus?: number,
  errorMessageContains?: string
): Promise<void> {
  if (expectedStatus) {
    expect(response.status()).toBe(expectedStatus);
  }

  const data = await response.json();
  expect(data.success).toBe(false);

  if (errorMessageContains && data.error) {
    expect(data.error.toLowerCase()).toContain(errorMessageContains.toLowerCase());
  }
}
