export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export interface TranscriptResult {
  videoInfo: VideoInfo;
  segments: TranscriptSegment[];
  plainText: string;
  srtContent: string;
  wordCount: number;
}

export type ChannelUrlType = 'handle' | 'channel_id' | 'custom_url' | 'user';

export interface ChannelInfo {
  id: string;
  name: string;
  handle?: string;
  thumbnailUrl: string;
  videoCount: number;
  subscriberCount?: string;
  description?: string;
}

export interface ChannelVideoItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds?: number;
}

export interface VideoTranscriptResult extends TranscriptResult {
  status: 'success' | 'error' | 'no_transcript';
  error?: string;
}

export interface ChannelTranscriptResult {
  channelInfo: ChannelInfo;
  videos: Array<{
    video: ChannelVideoItem;
    transcript: VideoTranscriptResult | null;
  }>;
  totalVideos: number;
  processedVideos: number;
  successCount: number;
  failedCount: number;
}

export interface BatchProgress {
  status: 'idle' | 'fetching_videos' | 'processing' | 'completed' | 'cancelled' | 'error';
  currentVideoIndex: number;
  totalVideos: number;
  currentVideoTitle?: string;
  successCount: number;
  failedCount: number;
  error?: string;
}

export type ChannelOutputFormat = 'combined' | 'individual';
