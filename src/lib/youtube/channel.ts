import 'server-only';
import type {
  ChannelInfo,
  ChannelVideoItem,
  VideoTranscriptResult,
  BatchProgress,
} from './types';
import { extractChannelId, getThumbnailUrl } from './parser';
import { fetchTranscript } from './transcript';
import { CHANNEL_LIMITS } from '@/lib/utils/constants';

interface YouTubeChannelResponse {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      thumbnails: {
        high?: { url: string };
        default?: { url: string };
      };
    };
    statistics?: {
      videoCount: string;
      subscriberCount: string;
    };
    contentDetails?: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

interface YouTubePlaylistItemsResponse {
  items?: Array<{
    snippet: {
      title: string;
      publishedAt: string;
      resourceId: {
        videoId: string;
      };
      thumbnails: {
        high?: { url: string };
        default?: { url: string };
      };
    };
    contentDetails?: {
      videoId: string;
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeSearchResponse {
  items?: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails: {
        high?: { url: string };
        default?: { url: string };
      };
    };
  }>;
  nextPageToken?: string;
}

export async function resolveChannelId(input: string): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key is required for channel operations');
  }

  const extracted = extractChannelId(input);
  if (!extracted) {
    return null;
  }

  // If it's already a channel ID (UC...), return it directly
  if (extracted.type === 'channel_id') {
    return extracted.value;
  }

  // For handle, custom_url, or user, we need to resolve via API
  let searchParam = '';

  if (extracted.type === 'handle') {
    // Use forHandle parameter for @username format
    searchParam = `forHandle=${encodeURIComponent(extracted.value)}`;
  } else if (extracted.type === 'custom_url' || extracted.type === 'user') {
    // Use forUsername parameter
    searchParam = `forUsername=${encodeURIComponent(extracted.value)}`;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${searchParam}&part=id&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('YouTube API error:', JSON.stringify(errorData, null, 2));

      // Check for specific API errors
      if (errorData?.error?.status === 'PERMISSION_DENIED') {
        throw new Error('YouTube Data API is not enabled. Please enable it in the Google Cloud Console.');
      }
      if (response.status === 403) {
        throw new Error('YouTube API access denied. Check your API key configuration.');
      }
      throw new Error('Failed to resolve channel ID from YouTube API');
    }

    const data: YouTubeChannelResponse = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }

    // If forHandle or forUsername didn't work, try a search
    if (extracted.type === 'handle') {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent('@' + extracted.value)}&type=channel&part=id&maxResults=1&key=${apiKey}`
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.items && searchData.items.length > 0) {
          return searchData.items[0].id.channelId;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error resolving channel ID:', error);
    throw error;
  }
}

export async function fetchChannelInfo(channelId: string): Promise<ChannelInfo> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key is required for channel operations');
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=snippet,statistics,contentDetails&key=${apiKey}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    if (errorData?.error?.status === 'PERMISSION_DENIED') {
      throw new Error('YouTube Data API is not enabled. Please enable it in the Google Cloud Console.');
    }
    throw new Error('Failed to fetch channel info');
  }

  const data: YouTubeChannelResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found');
  }

  const channel = data.items[0];

  return {
    id: channel.id,
    name: channel.snippet.title,
    handle: channel.snippet.customUrl,
    thumbnailUrl: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url || '',
    videoCount: parseInt(channel.statistics?.videoCount || '0', 10),
    subscriberCount: channel.statistics?.subscriberCount,
    description: channel.snippet.description,
  };
}

export async function fetchChannelVideos(
  channelId: string,
  limit: number = CHANNEL_LIMITS.DEFAULT_VIDEOS
): Promise<ChannelVideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key is required for channel operations');
  }

  // First, get the uploads playlist ID
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=contentDetails&key=${apiKey}`
  );

  if (!channelResponse.ok) {
    const errorData = await channelResponse.json().catch(() => null);
    if (errorData?.error?.status === 'PERMISSION_DENIED') {
      throw new Error('YouTube Data API is not enabled. Please enable it in the Google Cloud Console.');
    }
    throw new Error('Failed to fetch channel details');
  }

  const channelData: YouTubeChannelResponse = await channelResponse.json();

  if (!channelData.items || channelData.items.length === 0) {
    throw new Error('Channel not found');
  }

  const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists.uploads;

  if (!uploadsPlaylistId) {
    throw new Error('Could not find uploads playlist');
  }

  const videos: ChannelVideoItem[] = [];
  let nextPageToken: string | undefined;
  const effectiveLimit = Math.min(limit, CHANNEL_LIMITS.MAX_VIDEOS);

  // Fetch videos from uploads playlist with pagination
  while (videos.length < effectiveLimit) {
    const maxResults = Math.min(50, effectiveLimit - videos.length);
    let url = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=${maxResults}&key=${apiKey}`;

    if (nextPageToken) {
      url += `&pageToken=${nextPageToken}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch channel videos');
    }

    const data: YouTubePlaylistItemsResponse = await response.json();

    if (!data.items || data.items.length === 0) {
      break;
    }

    for (const item of data.items) {
      if (videos.length >= effectiveLimit) break;

      const videoId = item.contentDetails?.videoId || item.snippet.resourceId.videoId;

      videos.push({
        videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high?.url ||
                      item.snippet.thumbnails.default?.url ||
                      getThumbnailUrl(videoId),
        publishedAt: item.snippet.publishedAt,
      });
    }

    nextPageToken = data.nextPageToken;

    if (!nextPageToken) {
      break;
    }
  }

  return videos;
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
