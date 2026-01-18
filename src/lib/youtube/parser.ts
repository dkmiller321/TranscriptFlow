import { YOUTUBE_URL_PATTERNS } from '@/lib/utils/constants';

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
