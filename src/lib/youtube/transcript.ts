import 'server-only';
import type { TranscriptSegment, TranscriptResult, VideoInfo } from './types';
import { extractVideoId, getThumbnailUrl } from './parser';
import { formatTimestamp } from '@/lib/utils/formatters';

interface PythonTranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

async function fetchTranscriptFromAPI(videoId: string): Promise<TranscriptSegment[]> {
  // Construct absolute URL for server-side fetches
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const apiUrl = `${baseUrl}/api/transcript?videoId=${encodeURIComponent(videoId)}`;

  console.log('[Transcript] Fetching from:', apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch transcript');
    }

    if (!result.segments || result.segments.length === 0) {
      throw new Error('No transcript segments returned');
    }

    return result.segments.map((seg: PythonTranscriptSegment) => ({
      text: seg.text,
      offset: Math.round(seg.start * 1000), // Convert to milliseconds
      duration: Math.round(seg.duration * 1000),
    }));
  } catch (error) {
    console.error('[Transcript] Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch transcript');
  }
}

export async function fetchTranscript(videoIdOrUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(videoIdOrUrl);

  if (!videoId) {
    throw new Error('Invalid YouTube URL or video ID');
  }

  // Fetch transcript using Node.js API endpoint
  const segments = await fetchTranscriptFromAPI(videoId);

  // Generate plain text
  const plainText = segments.map((s) => s.text).join(' ');

  // Generate SRT content
  const srtContent = generateSrt(segments);

  // Count words
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // Try to get video info from YouTube API or use defaults
  const videoInfo = await fetchVideoInfo(videoId);

  return {
    videoInfo,
    segments,
    plainText,
    srtContent,
    wordCount,
  };
}

function generateSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((segment, index) => {
      const startMs = segment.offset;
      const endMs = segment.offset + segment.duration;
      const startTime = formatTimestamp(startMs);
      const endTime = formatTimestamp(endMs);

      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    })
    .join('\n');
}

async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          const duration = parseDuration(video.contentDetails.duration);

          return {
            videoId,
            title: video.snippet.title,
            channelName: video.snippet.channelTitle,
            thumbnailUrl: video.snippet.thumbnails.high?.url || getThumbnailUrl(videoId),
            durationSeconds: duration,
          };
        }
      }
    } catch {
      // Fall through to default
    }
  }

  // Return default info if API fails or no key
  return {
    videoId,
    title: `YouTube Video (${videoId})`,
    channelName: 'Unknown Channel',
    thumbnailUrl: getThumbnailUrl(videoId),
    durationSeconds: 0,
  };
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (PT1H2M3S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
