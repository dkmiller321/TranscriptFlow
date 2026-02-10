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

/**
 * Test channel URLs
 */
export const TEST_CHANNELS = {
  valid: {
    handle: 'https://www.youtube.com/@99Bitcoins',
    channelId: 'https://www.youtube.com/channel/UCQQ_fGcMDxlKre3SEqEWrLA',
    customUrl: 'https://www.youtube.com/c/99Bitcoins',
  },
  invalid: {
    malformed: 'https://www.youtube.com/@',
  },
};

/**
 * Mock channel extraction API responses
 */
export const MOCK_CHANNEL_JOB_RESPONSE = {
  success: true,
  data: {
    jobId: 'job-test-001',
    status: 'processing',
    progress: {
      status: 'processing' as const,
      currentVideoIndex: 0,
      totalVideos: 3,
      successCount: 0,
      failedCount: 0,
    },
  },
  rateLimit: {
    remaining: 4,
    resetAt: new Date(Date.now() + 86400000).toISOString(),
  },
};

export const MOCK_CHANNEL_PROGRESS_RESPONSE = {
  success: true,
  data: {
    jobId: 'job-test-001',
    status: 'processing',
    progress: {
      status: 'processing' as const,
      currentVideoIndex: 2,
      totalVideos: 3,
      currentVideoTitle: 'What is Ethereum?',
      successCount: 2,
      failedCount: 0,
    },
    channelInfo: {
      channelId: 'UCQQ_fGcMDxlKre3SEqEWrLA',
      channelName: '99Bitcoins',
      handle: '99Bitcoins',
      thumbnailUrl: 'https://yt3.ggpht.com/test-thumbnail',
      subscriberCount: '100K',
    },
    totalVideos: 3,
    results: [
      {
        video: { videoId: 'Gc2en3nHxA4', title: 'What is Bitcoin?', thumbnailUrl: 'https://i.ytimg.com/vi/Gc2en3nHxA4/hqdefault.jpg' },
        transcript: { status: 'success', wordCount: 42, plainText: 'Bitcoin is...', segments: [] },
      },
      {
        video: { videoId: 'abc123', title: 'What is Blockchain?', thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg' },
        transcript: { status: 'success', wordCount: 55, plainText: 'Blockchain is...', segments: [] },
      },
    ],
  },
};

export const MOCK_CHANNEL_COMPLETED_RESPONSE = {
  success: true,
  data: {
    jobId: 'job-test-001',
    status: 'completed',
    progress: {
      status: 'completed' as const,
      currentVideoIndex: 3,
      totalVideos: 3,
      successCount: 3,
      failedCount: 0,
    },
    channelInfo: {
      channelId: 'UCQQ_fGcMDxlKre3SEqEWrLA',
      channelName: '99Bitcoins',
      handle: '99Bitcoins',
      thumbnailUrl: 'https://yt3.ggpht.com/test-thumbnail',
      subscriberCount: '100K',
    },
    totalVideos: 3,
    results: [
      {
        video: { videoId: 'Gc2en3nHxA4', title: 'What is Bitcoin?', thumbnailUrl: 'https://i.ytimg.com/vi/Gc2en3nHxA4/hqdefault.jpg' },
        transcript: { status: 'success', wordCount: 42, plainText: 'Bitcoin is a digital currency.', segments: [], srtContent: '' },
      },
      {
        video: { videoId: 'abc123', title: 'What is Blockchain?', thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg' },
        transcript: { status: 'success', wordCount: 55, plainText: 'Blockchain is a distributed ledger.', segments: [], srtContent: '' },
      },
      {
        video: { videoId: 'def456', title: 'What is Ethereum?', thumbnailUrl: 'https://i.ytimg.com/vi/def456/hqdefault.jpg' },
        transcript: { status: 'success', wordCount: 38, plainText: 'Ethereum is a platform.', segments: [], srtContent: '' },
      },
    ],
  },
};

export const MOCK_CHANNEL_TIER_RESTRICTION = {
  success: false,
  error: 'Channel extraction is not available on the free tier. Upgrade to Pro or Business to extract channel transcripts.',
  tierRestriction: true,
};

/**
 * Mock saved transcripts for library page
 */
export const MOCK_SAVED_TRANSCRIPTS = {
  success: true,
  data: [
    {
      id: 'transcript-001',
      video_id: 'Gc2en3nHxA4',
      video_title: 'What is Bitcoin? Bitcoin Explained Simply',
      content: 'Bitcoin is a digital currency that was created in January 2009.',
      is_favorite: true,
      tags: ['crypto', 'education'],
      created_at: '2024-06-15T10:00:00.000Z',
      updated_at: '2024-06-15T10:00:00.000Z',
    },
    {
      id: 'transcript-002',
      video_id: 'abc123',
      video_title: 'Introduction to Machine Learning',
      content: 'Machine learning is a subset of artificial intelligence.',
      is_favorite: false,
      tags: ['ai', 'education'],
      created_at: '2024-06-14T10:00:00.000Z',
      updated_at: '2024-06-14T10:00:00.000Z',
    },
    {
      id: 'transcript-003',
      video_id: 'def456',
      video_title: 'Web Development in 2024',
      content: 'Web development continues to evolve with new frameworks.',
      is_favorite: false,
      tags: ['webdev'],
      created_at: '2024-06-13T10:00:00.000Z',
      updated_at: '2024-06-13T10:00:00.000Z',
    },
  ],
};

/**
 * Mock history items
 */
export const MOCK_HISTORY = {
  success: true,
  data: [
    {
      id: 'history-001',
      video_id: 'Gc2en3nHxA4',
      video_title: 'What is Bitcoin? Bitcoin Explained Simply',
      channel_name: '99Bitcoins',
      thumbnail_url: 'https://i.ytimg.com/vi/Gc2en3nHxA4/hqdefault.jpg',
      status: 'completed' as const,
      word_count: 42,
      created_at: '2024-06-15T10:00:00.000Z',
    },
    {
      id: 'history-002',
      video_id: 'abc123',
      video_title: 'Introduction to Machine Learning',
      channel_name: 'TechChannel',
      thumbnail_url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      status: 'completed' as const,
      word_count: 55,
      created_at: '2024-06-14T10:00:00.000Z',
    },
    {
      id: 'history-003',
      video_id: 'fail789',
      video_title: 'Unavailable Video',
      channel_name: null,
      thumbnail_url: null,
      status: 'failed' as const,
      word_count: null,
      created_at: '2024-06-13T10:00:00.000Z',
    },
  ],
};
