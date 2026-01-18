export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

export interface ExtractionResult {
  metadata: VideoMetadata;
  transcript: TranscriptSegment[];
  plainText: string;
  srtContent: string;
  wordCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ExportFormat = 'txt' | 'srt' | 'json';
