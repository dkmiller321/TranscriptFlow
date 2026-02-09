import 'server-only';
import { fetchTranscript as fetchYouTubeTranscript } from 'youtube-transcript-plus';
import { Innertube } from 'youtubei.js';
import type { TranscriptSegment, TranscriptResult, VideoInfo } from './types';
import { extractVideoId, getThumbnailUrl } from './parser';
import { formatTimestamp } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/server';
import { createProxiedFetch, isProxyConfigured } from '@/lib/proxy';

/**
 * Check if transcript exists in cache
 */
async function getCachedTranscript(videoId: string): Promise<TranscriptSegment[] | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('transcript_cache')
      .select('segments')
      .eq('video_id', videoId)
      .single();

    if (error || !data) {
      return null;
    }

    console.log(`[Transcript Cache] Cache HIT for video: ${videoId}`);
    return data.segments as TranscriptSegment[];
  } catch {
    console.log(`[Transcript Cache] Cache MISS for video: ${videoId}`);
    return null;
  }
}

/**
 * Save transcript to cache
 */
async function saveCachedTranscript(videoId: string, segments: TranscriptSegment[]): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('transcript_cache')
      .upsert({
        video_id: videoId,
        segments,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'video_id'
      });

    if (error) {
      console.error(`[Transcript Cache] Failed to cache transcript for ${videoId}:`, error);
    } else {
      console.log(`[Transcript Cache] Cached transcript for video: ${videoId}`);
    }
  } catch (error) {
    console.error(`[Transcript Cache] Error caching transcript:`, error);
  }
}

/**
 * Primary method: youtube-transcript-plus with proxy support
 */
async function fetchWithYoutubeTranscriptPlus(videoId: string): Promise<TranscriptSegment[]> {
  // Create proxied fetch if proxy is configured
  const proxiedFetch = isProxyConfigured() ? createProxiedFetch() : undefined;

  if (proxiedFetch) {
    console.log(`[Transcript] Trying youtube-transcript-plus for ${videoId} via proxy`);
  } else {
    console.log(`[Transcript] Trying youtube-transcript-plus for ${videoId} (no proxy)`);
  }

  const transcriptItems = await fetchYouTubeTranscript(videoId, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    videoFetch: proxiedFetch,
    transcriptFetch: proxiedFetch,
    playerFetch: proxiedFetch,
  });

  if (!transcriptItems || transcriptItems.length === 0) {
    throw new Error('No transcript segments returned');
  }

  console.log(`[Transcript] youtube-transcript-plus succeeded: ${transcriptItems.length} segments`);

  return transcriptItems.map((item) => ({
    text: item.text,
    offset: item.offset,
    duration: item.duration,
  }));
}

/**
 * Fallback method: youtubei.js (Innertube API - no proxy needed)
 */
async function fetchWithYoutubei(videoId: string): Promise<TranscriptSegment[]> {
  console.log(`[Transcript] Trying youtubei.js (Innertube) for ${videoId}`);

  const youtube = await Innertube.create({
    retrieve_player: false,
  });

  const info = await youtube.getInfo(videoId);
  const transcriptInfo = await info.getTranscript();

  if (!transcriptInfo?.transcript?.content?.body?.initial_segments) {
    throw new Error('No transcript available via Innertube');
  }

  const segments = transcriptInfo.transcript.content.body.initial_segments;

  console.log(`[Transcript] youtubei.js succeeded: ${segments.length} segments`);

  // Filter to only transcript segments (not section headers) and map to our format
  const result: TranscriptSegment[] = [];
  for (const segment of segments) {
    // Skip section headers - they don't have start_ms
    if (!('start_ms' in segment)) continue;

    const seg = segment as { snippet?: { text?: string }; start_ms: string; end_ms: string };
    result.push({
      text: seg.snippet?.text || '',
      offset: parseInt(seg.start_ms || '0', 10),
      duration: parseInt(seg.end_ms || '0', 10) - parseInt(seg.start_ms || '0', 10),
    });
  }

  return result;
}

/**
 * Fetch transcript with fallback strategy
 */
async function fetchTranscriptFromYouTube(videoId: string): Promise<TranscriptSegment[]> {
  const errors: string[] = [];

  // Try primary method first
  try {
    return await fetchWithYoutubeTranscriptPlus(videoId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[Transcript] youtube-transcript-plus failed: ${message}`);
    errors.push(`youtube-transcript-plus: ${message}`);
  }

  // Try fallback method
  try {
    return await fetchWithYoutubei(videoId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[Transcript] youtubei.js failed: ${message}`);
    errors.push(`youtubei.js: ${message}`);
  }

  // All methods failed - analyze errors and throw appropriate message
  const allErrors = errors.join('; ');

  if (allErrors.includes('too many requests') || allErrors.includes('TooManyRequest')) {
    throw new Error('YouTube is temporarily limiting requests. Please wait a moment and try again.');
  }

  if (allErrors.includes('disabled') || allErrors.includes('No transcript')) {
    throw new Error('No transcript available for this video. The video may have captions disabled or restricted.');
  }

  if (allErrors.includes('unavailable') || allErrors.includes('removed')) {
    throw new Error('This video is unavailable or may be region-restricted.');
  }

  throw new Error('Failed to fetch transcript. Please try again later.');
}

export async function fetchTranscript(videoIdOrUrl: string): Promise<TranscriptResult> {
  const videoId = extractVideoId(videoIdOrUrl);

  if (!videoId) {
    throw new Error('Invalid YouTube URL or video ID');
  }

  // Check cache first
  let segments = await getCachedTranscript(videoId);

  // If not in cache, fetch from YouTube and cache it
  if (!segments) {
    segments = await fetchTranscriptFromYouTube(videoId);
    // Save to cache asynchronously (don't wait for it)
    saveCachedTranscript(videoId, segments).catch((err) => {
      console.error('[Transcript] Failed to save to cache:', err);
    });
  }

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
