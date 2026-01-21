import 'server-only';
import type { TranscriptSegment, TranscriptResult, VideoInfo } from './types';
import { extractVideoId, getThumbnailUrl } from './parser';
import { formatTimestamp } from '@/lib/utils/formatters';

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  name?: { simpleText?: string };
  kind?: string;
}

async function fetchTranscriptFromYouTube(videoId: string): Promise<TranscriptSegment[]> {
  try {
    // Fetch the video page to get caption track info
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!videoPageResponse.ok) {
      throw new Error('Failed to fetch video page');
    }

    const html = await videoPageResponse.text();

    // Extract captions data from the page
    // Look for the captionTracks array in the player response
    const captionsMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);

    if (!captionsMatch) {
      // Check if video has captions disabled message
      if (html.includes('"playabilityStatus"') && html.includes('"reason"')) {
        throw new Error('Video is not available or has restricted access');
      }
      throw new Error('No captions available for this video');
    }

    // Parse with unicode handling - replace escaped unicode for ampersand
    const jsonStr = captionsMatch[1].replace(/\\u0026/g, '&');
    const captionTracks: CaptionTrack[] = JSON.parse(jsonStr);
    return await fetchFromCaptionTrack(captionTracks);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch transcript');
  }
}

async function fetchFromCaptionTrack(captionTracks: CaptionTrack[]): Promise<TranscriptSegment[]> {
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('No caption tracks available');
  }

  // Prefer English, then any available track
  let selectedTrack = captionTracks.find(
    (track) => track.languageCode === 'en' || track.languageCode?.startsWith('en')
  );

  if (!selectedTrack) {
    // Try to find auto-generated English
    selectedTrack = captionTracks.find(
      (track) => track.kind === 'asr' && (track.languageCode === 'en' || track.languageCode?.startsWith('en'))
    );
  }

  if (!selectedTrack) {
    // Fall back to first available track
    selectedTrack = captionTracks[0];
  }

  if (!selectedTrack?.baseUrl) {
    throw new Error('No valid caption track URL found');
  }

  // Fetch the transcript XML
  const transcriptUrl = selectedTrack.baseUrl + '&fmt=json3';
  const transcriptResponse = await fetch(transcriptUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!transcriptResponse.ok) {
    throw new Error('Failed to fetch transcript data');
  }

  const transcriptData = await transcriptResponse.json();

  if (!transcriptData.events) {
    throw new Error('No transcript events found');
  }

  const segments: TranscriptSegment[] = [];

  for (const event of transcriptData.events) {
    // Skip events without text segments
    if (!event.segs) continue;

    const text = event.segs
      .map((seg: { utf8?: string }) => seg.utf8 || '')
      .join('')
      .trim();

    if (!text || text === '\n') continue;

    segments.push({
      text: decodeHTMLEntities(text),
      offset: event.tStartMs || 0,
      duration: event.dDurationMs || 0,
    });
  }

  if (segments.length === 0) {
    throw new Error('No transcript segments found');
  }

  return segments;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\\n/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

export async function fetchTranscript(videoIdOrUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(videoIdOrUrl);

  if (!videoId) {
    throw new Error('Invalid YouTube URL or video ID');
  }

  // Fetch transcript directly from YouTube
  const segments = await fetchTranscriptFromYouTube(videoId);

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
