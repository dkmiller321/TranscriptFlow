import { YOUTUBE_URL_PATTERNS, YOUTUBE_CHANNEL_PATTERNS } from '@/lib/utils/constants';
import type { ChannelUrlType } from './types';

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Check if it's already just a video ID (11 characters, alphanumeric with _ and -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Try each pattern to extract video ID from URL
  for (const pattern of YOUTUBE_URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isValidYouTubeUrl(input: string): boolean {
  return extractVideoId(input) !== null;
}

export function getThumbnailUrl(videoId: string, quality: 'default' | 'mq' | 'hq' | 'sd' | 'maxres' = 'hq'): string {
  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

export function getVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function isChannelUrl(input: string): boolean {
  const trimmed = input.trim();
  return Object.values(YOUTUBE_CHANNEL_PATTERNS).some((pattern) => pattern.test(trimmed));
}

export function getChannelType(input: string): ChannelUrlType | null {
  const trimmed = input.trim();

  if (YOUTUBE_CHANNEL_PATTERNS.HANDLE.test(trimmed)) {
    return 'handle';
  }
  if (YOUTUBE_CHANNEL_PATTERNS.CHANNEL_ID.test(trimmed)) {
    return 'channel_id';
  }
  if (YOUTUBE_CHANNEL_PATTERNS.CUSTOM_URL.test(trimmed)) {
    return 'custom_url';
  }
  if (YOUTUBE_CHANNEL_PATTERNS.USER.test(trimmed)) {
    return 'user';
  }

  return null;
}

export interface ExtractedChannelInfo {
  type: ChannelUrlType;
  value: string;
}

export function extractChannelId(input: string): ExtractedChannelInfo | null {
  const trimmed = input.trim();

  // Check handle format (@username)
  const handleMatch = trimmed.match(YOUTUBE_CHANNEL_PATTERNS.HANDLE);
  if (handleMatch && handleMatch[1]) {
    return { type: 'handle', value: handleMatch[1] };
  }

  // Check channel ID format (UC...)
  const channelIdMatch = trimmed.match(YOUTUBE_CHANNEL_PATTERNS.CHANNEL_ID);
  if (channelIdMatch && channelIdMatch[1]) {
    return { type: 'channel_id', value: channelIdMatch[1] };
  }

  // Check custom URL format (/c/name)
  const customUrlMatch = trimmed.match(YOUTUBE_CHANNEL_PATTERNS.CUSTOM_URL);
  if (customUrlMatch && customUrlMatch[1]) {
    return { type: 'custom_url', value: customUrlMatch[1] };
  }

  // Check user format (/user/name)
  const userMatch = trimmed.match(YOUTUBE_CHANNEL_PATTERNS.USER);
  if (userMatch && userMatch[1]) {
    return { type: 'user', value: userMatch[1] };
  }

  return null;
}

export function getChannelUrl(channelId: string): string {
  return `https://www.youtube.com/channel/${channelId}`;
}
