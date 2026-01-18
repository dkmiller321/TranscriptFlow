export const YOUTUBE_URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

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
} as const;
