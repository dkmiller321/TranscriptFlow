import 'server-only';
import { fetchTranscript as fetchYouTubeTranscript } from 'youtube-transcript-plus';
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

async function fetchTranscriptFromYouTube(videoId: string): Promise<TranscriptSegment[]> {
  try {
    // Create proxied fetch if proxy is configured
    const proxiedFetch = isProxyConfigured() ? createProxiedFetch() : undefined;

    if (proxiedFetch) {
      console.log(`[Transcript] Fetching transcript for ${videoId} via proxy`);
    } else {
      console.log(`[Transcript] Fetching transcript for ${videoId} (no proxy)`);
    }

    const transcriptItems = await fetchYouTubeTranscript(videoId, {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Use proxied fetch for all YouTube requests if configured
      videoFetch: proxiedFetch,
      transcriptFetch: proxiedFetch,
      playerFetch: proxiedFetch,
    });

    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('No transcript segments returned');
    }

    console.log(`[Transcript] Successfully fetched ${transcriptItems.length} segments for ${videoId}`);

    // Map the youtube-transcript-plus format to our TranscriptSegment format
    return transcriptItems.map((item) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration,
    }));
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Transcript] Error fetching transcript for ${videoId}:`, error.message);
      // Check for common YouTube transcript errors
      if (error.message.includes('disabled') || error.message.includes('Transcript is disabled') || error.message.includes('No transcript')) {
        throw new Error(
          'No transcript available for this video. The video may have captions disabled or restricted.'
        );
      }
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
