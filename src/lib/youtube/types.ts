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
