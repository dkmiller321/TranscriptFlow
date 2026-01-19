import 'server-only';
import { execSync } from 'child_process';
import path from 'path';
import type {
  ChannelInfo,
  ChannelVideoItem,
  VideoTranscriptResult,
  BatchProgress,
} from './types';
import { extractChannelId, getThumbnailUrl } from './parser';
import { fetchTranscript } from './transcript';
import { CHANNEL_LIMITS } from '@/lib/utils/constants';

interface YtDlpChannelResult {
  id?: string;
  name?: string;
  handle?: string;
  thumbnailUrl?: string;
  description?: string;
  subscriberCount?: string;
  videoCount?: number;
  error?: string;
}

interface YtDlpVideosResult {
  channelInfo?: {
    id: string;
    name: string;
    handle?: string;
    videoCount?: number;
  };
  videos?: Array<{
    videoId: string;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    durationSeconds?: number;
  }>;
  totalFetched?: number;
  error?: string;
}

function runYtDlpCommand(command: string): string {
  const scriptPath = path.join(process.cwd(), 'scripts', 'yt-dlp-helper.py');

  return execSync(`python "${scriptPath}" ${command}`, {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
    timeout: 120000, // 2 minute timeout for channel operations
  });
}

export async function resolveChannelId(input: string): Promise<string | null> {
  const extracted = extractChannelId(input);
  if (!extracted) {
    return null;
  }

  // If it's already a channel ID (UC...), return it directly
  if (extracted.type === 'channel_id') {
    return extracted.value;
  }

  // For handle, custom_url, or user, resolve via yt-dlp
  let channelUrl: string;

  if (extracted.type === 'handle') {
    channelUrl = `@${extracted.value}`;
  } else {
    channelUrl = extracted.value;
  }

  try {
    const result = runYtDlpCommand(`channel "${channelUrl}"`);
    const parsed: YtDlpChannelResult = JSON.parse(result);

    if (parsed.error) {
      console.error('yt-dlp error:', parsed.error);
      return null;
    }

    return parsed.id || null;
  } catch (error) {
    console.error('Error resolving channel ID:', error);
    return null;
  }
}

export async function fetchChannelInfo(channelId: string): Promise<ChannelInfo> {
  try {
    const result = runYtDlpCommand(`channel "${channelId}"`);
    const parsed: YtDlpChannelResult = JSON.parse(result);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    return {
      id: parsed.id || channelId,
      name: parsed.name || 'Unknown Channel',
      handle: parsed.handle,
      thumbnailUrl: parsed.thumbnailUrl || '',
      videoCount: parsed.videoCount || 0,
      subscriberCount: parsed.subscriberCount,
      description: parsed.description,
    };
  } catch (error) {
    console.error('Error fetching channel info:', error);
    throw new Error('Failed to fetch channel info');
  }
}

export async function fetchChannelVideos(
  channelId: string,
  limit: number = CHANNEL_LIMITS.DEFAULT_VIDEOS
): Promise<ChannelVideoItem[]> {
  const effectiveLimit = Math.min(limit, CHANNEL_LIMITS.MAX_VIDEOS);

  try {
    const result = runYtDlpCommand(`videos "${channelId}" --limit ${effectiveLimit}`);
    const parsed: YtDlpVideosResult = JSON.parse(result);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    if (!parsed.videos || parsed.videos.length === 0) {
      return [];
    }

    return parsed.videos.map((video) => ({
      videoId: video.videoId,
      title: video.title,
      thumbnailUrl: video.thumbnailUrl || getThumbnailUrl(video.videoId),
      publishedAt: video.publishedAt || '',
      durationSeconds: video.durationSeconds,
    }));
  } catch (error) {
    console.error('Error fetching channel videos:', error);
    throw new Error('Failed to fetch channel videos');
  }
}

export type ProgressCallback = (progress: BatchProgress) => void;

export async function fetchChannelTranscripts(
  videos: ChannelVideoItem[],
  onProgress?: ProgressCallback,
  signal?: AbortSignal
): Promise<Array<{ video: ChannelVideoItem; transcript: VideoTranscriptResult | null }>> {
  const results: Array<{ video: ChannelVideoItem; transcript: VideoTranscriptResult | null }> = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < videos.length; i++) {
    // Check for cancellation
    if (signal?.aborted) {
      onProgress?.({
        status: 'cancelled',
        currentVideoIndex: i,
        totalVideos: videos.length,
        currentVideoTitle: videos[i].title,
        successCount,
        failedCount,
      });
      break;
    }

    const video = videos[i];

    onProgress?.({
      status: 'processing',
      currentVideoIndex: i,
      totalVideos: videos.length,
      currentVideoTitle: video.title,
      successCount,
      failedCount,
    });

    try {
      const transcriptResult = await fetchTranscript(video.videoId);

      results.push({
        video,
        transcript: {
          ...transcriptResult,
          status: 'success',
        },
      });
      successCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transcript';
      const isNoTranscript = errorMessage.toLowerCase().includes('no transcript') ||
                            errorMessage.toLowerCase().includes('captions disabled');

      results.push({
        video,
        transcript: {
          videoInfo: {
            videoId: video.videoId,
            title: video.title,
            channelName: '',
            thumbnailUrl: video.thumbnailUrl,
            durationSeconds: video.durationSeconds || 0,
          },
          segments: [],
          plainText: '',
          srtContent: '',
          wordCount: 0,
          status: isNoTranscript ? 'no_transcript' : 'error',
          error: errorMessage,
        },
      });
      failedCount++;
    }

    // Small delay between requests to avoid rate limiting
    if (i < videos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  onProgress?.({
    status: signal?.aborted ? 'cancelled' : 'completed',
    currentVideoIndex: videos.length,
    totalVideos: videos.length,
    successCount,
    failedCount,
  });

  return results;
}
