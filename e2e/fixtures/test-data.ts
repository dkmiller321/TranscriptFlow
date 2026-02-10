/**
 * Test data fixtures for E2E tests
 */

export const TEST_VIDEOS = {
  valid: {
    id: 'Gc2en3nHxA4',
    url: 'https://www.youtube.com/watch?v=Gc2en3nHxA4',
    shortUrl: 'https://youtu.be/Gc2en3nHxA4',
    embedUrl: 'https://www.youtube.com/embed/Gc2en3nHxA4',
    shareUrl: 'https://www.youtube.com/watch?v=Gc2en3nHxA4&feature=share',
  },
  invalid: {
    malformed: 'not-a-url',
    nonExistent: 'https://www.youtube.com/watch?v=INVALIDVID',
    wrongDomain: 'https://vimeo.com/123456789',
    empty: '',
  },
};

export const TEST_USERS = {
  free: {
    email: 'test-free@example.com',
    password: 'TestPassword123!',
  },
};

export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}@test.example.com`;
}

/**
 * Mock transcript response matching the actual API response shape.
 * The hook reads: result.data.videoInfo, result.data.segments, etc.
 */
export const MOCK_TRANSCRIPT_RESPONSE = {
  success: true,
  data: {
    historyId: null,
    videoInfo: {
      videoId: 'Gc2en3nHxA4',
      title: 'What is Bitcoin? Bitcoin Explained Simply',
      channelName: '99Bitcoins',
      thumbnailUrl: 'https://i.ytimg.com/vi/Gc2en3nHxA4/hqdefault.jpg',
      durationSeconds: 227,
      duration: '3:47',
    },
    segments: [
      { start: 0, end: 5.2, text: 'Bitcoin is a digital currency that was created in January 2009.' },
      { start: 5.2, end: 12.8, text: 'It follows the ideas set out in a whitepaper by the mysterious Satoshi Nakamoto.' },
      { start: 12.8, end: 22.1, text: 'Bitcoin offers the promise of lower transaction fees than traditional online payment mechanisms.' },
    ],
    plainText: 'Bitcoin is a digital currency that was created in January 2009. It follows the ideas set out in a whitepaper by the mysterious Satoshi Nakamoto. Bitcoin offers the promise of lower transaction fees than traditional online payment mechanisms.',
    srtContent: `1\n00:00:00,000 --> 00:00:05,200\nBitcoin is a digital currency that was created in January 2009.\n\n2\n00:00:05,200 --> 00:00:12,800\nIt follows the ideas set out in a whitepaper by the mysterious Satoshi Nakamoto.\n`,
    wordCount: 42,
  },
  rateLimit: {
    remaining: 4,
    resetAt: new Date(Date.now() + 86400000).toISOString(),
  },
};

/**
 * Mock error responses
 */
export const MOCK_ERROR_RESPONSES = {
  invalidVideo: {
    success: false,
    error: 'Could not find a valid transcript for this video.',
  },
  rateLimited: {
    success: false,
    error: 'Rate limit exceeded. Please upgrade your plan or wait until the limit resets.',
  },
  networkError: {
    success: false,
    error: 'Network error: Unable to reach YouTube servers.',
  },
};
