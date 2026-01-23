/**
 * Test data fixtures for E2E tests
 */

export const TEST_USERS = {
  free: {
    email: 'test-free@example.com',
    password: 'TestPassword123!',
  },
  pro: {
    email: 'test-pro@example.com',
    password: 'TestPassword123!',
  },
  business: {
    email: 'test-business@example.com',
    password: 'TestPassword123!',
  },
};

export const TEST_VIDEOS = {
  // Known working video IDs for testing (short public videos with captions)
  valid: {
    // Example: "What is Bitcoin?" by 99Bitcoins - known to have auto-generated captions
    id: 'Gc2en3nHxA4',
    url: 'https://www.youtube.com/watch?v=Gc2en3nHxA4',
    shortUrl: 'https://youtu.be/Gc2en3nHxA4',
    embedUrl: 'https://www.youtube.com/embed/Gc2en3nHxA4',
    shareUrl: 'https://www.youtube.com/watch?v=Gc2en3nHxA4&feature=share',
  },
  withTimestamp: {
    url: 'https://www.youtube.com/watch?v=Gc2en3nHxA4&t=30s',
  },
  invalid: {
    malformed: 'not-a-url',
    nonExistent: 'https://www.youtube.com/watch?v=INVALIDVID',
    wrongDomain: 'https://vimeo.com/123456789',
  },
};

export const TEST_CHANNELS = {
  valid: {
    // Example channel with public videos
    handle: '@TEDEd',
    handleUrl: 'https://www.youtube.com/@TEDEd',
    channelIdUrl: 'https://www.youtube.com/channel/UCsooa4yRKGN_zEE8iknghZA',
    customUrl: 'https://www.youtube.com/c/TEDEd',
  },
  invalid: {
    malformed: 'not-a-channel-url',
    nonExistent: 'https://www.youtube.com/@NonExistentChannel12345',
  },
};

export const RATE_LIMITS = {
  anonymous: {
    perHour: 5,
    perDay: 20,
  },
  free: {
    perDay: 3,
  },
  pro: {
    perDay: 50,
    channelLimit: 25,
  },
  business: {
    perDay: -1, // unlimited
    channelLimit: 500,
  },
};

export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    features: ['3 videos per day', 'TXT export only'],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: ['50 videos per day', 'All export formats', 'Channel extraction (up to 25 videos)'],
  },
  business: {
    name: 'Business',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: ['Unlimited videos', 'All export formats', 'Channel extraction (up to 500 videos)'],
  },
};

export const EXPORT_FORMATS = ['txt', 'srt', 'json'] as const;

/**
 * Generate a unique email for testing to avoid conflicts
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}@test.example.com`;
}

/**
 * Generate a strong password for testing
 */
export function generateTestPassword(): string {
  return `TestPass${Math.random().toString(36).substring(7)}!`;
}
