export const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

export const YOUTUBE_CHANNEL_PATTERNS = {
  // @username format: youtube.com/@username
  HANDLE: /youtube\.com\/@([a-zA-Z0-9_-]+)/,
  // Channel ID format: youtube.com/channel/UC...
  CHANNEL_ID: /youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/,
  // Custom URL format: youtube.com/c/channelname
  CUSTOM_URL: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
  // User format (legacy): youtube.com/user/username
  USER: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
};

export const CHANNEL_LIMITS = {
  MIN_VIDEOS: 10,
  MAX_VIDEOS: 500,
  DEFAULT_VIDEOS: 50,
  BATCH_SIZE: 10,
} as const;

export const RATE_LIMITS = {
  ANONYMOUS: {
    EXTRACTIONS_PER_HOUR: 5,
    EXTRACTIONS_PER_DAY: 20,
  },
  AUTHENTICATED: {
    EXTRACTIONS_PER_HOUR: 20,
    EXTRACTIONS_PER_DAY: 100,
  },
};

export const EXPORT_FORMATS = ['txt', 'srt', 'json'] as const;

export const APP_NAME = 'TranscriptFlow';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  HISTORY: '/history',
  LIBRARY: '/library',
  SETTINGS: '/settings',
  PRICING: '/pricing',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;
