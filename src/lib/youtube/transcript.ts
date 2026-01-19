import 'server-only';
import { execSync } from 'child_process';
import path from 'path';
import type { TranscriptSegment, TranscriptResult, VideoInfo } from './types';
import { extractVideoId, getThumbnailUrl } from './parser';
import { formatTimestamp } from '@/lib/utils/formatters';

interface PythonTranscriptResult {
  segments?: Array<{ text: string; offset: number; duration: number }>;
  error?: string;
}

interface YtDlpVideoResult {
  videoId?: string;
  title?: string;
  channelName?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  error?: string;
}

async function fetchTranscriptWithPython(videoId: string): Promise<TranscriptSegment[]> {
  const scriptPath = path.join(process.cwd(), 'scripts', 'fetch-transcript.py');

  try {
    const result = execSync(`python "${scriptPath}" ${videoId}`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large transcripts
      timeout: 60000, // 60 second timeout
    });

    const parsed: PythonTranscriptResult = JSON.parse(result);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    if (!parsed.segments || parsed.segments.length === 0) {
      throw new Error('No transcript segments returned');
    }

    return parsed.segments;
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a JSON parse error with actual content
      if (error.message.includes('JSON')) {
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

  // Fetch transcript using Python youtube-transcript-api
  const segments = await fetchTranscriptWithPython(videoId);

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
  const scriptPath = path.join(process.cwd(), 'scripts', 'yt-dlp-helper.py');

  try {
    const result = execSync(`python "${scriptPath}" video ${videoId}`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });

    const parsed: YtDlpVideoResult = JSON.parse(result);

    if (parsed.error) {
      throw new Error(parsed.error);
    }

    return {
      videoId,
      title: parsed.title || `YouTube Video (${videoId})`,
      channelName: parsed.channelName || 'Unknown Channel',
      thumbnailUrl: parsed.thumbnailUrl || getThumbnailUrl(videoId),
      durationSeconds: parsed.durationSeconds || 0,
    };
  } catch {
    // Return default info if yt-dlp fails
    return {
      videoId,
      title: `YouTube Video (${videoId})`,
      channelName: 'Unknown Channel',
      thumbnailUrl: getThumbnailUrl(videoId),
      durationSeconds: 0,
    };
  }
}
