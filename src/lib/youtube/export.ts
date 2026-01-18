import type { TranscriptSegment, VideoTranscriptResult, ChannelVideoItem } from './types';
import { formatTimestamp } from '@/lib/utils/formatters';

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

export function generateExportContent(
  segments: TranscriptSegment[],
  format: 'txt' | 'srt' | 'json',
  title?: string
): string {
  switch (format) {
    case 'txt':
      return segments.map((s) => s.text).join(' ');
    case 'srt':
      return generateSrt(segments);
    case 'json':
      return JSON.stringify({ title, segments }, null, 2);
    default:
      return segments.map((s) => s.text).join(' ');
  }
}

export interface ChannelVideoWithTranscript {
  video: ChannelVideoItem;
  transcript: VideoTranscriptResult | null;
}

export function generateCombinedTranscript(
  videos: ChannelVideoWithTranscript[],
  format: 'txt' | 'srt' | 'json',
  channelName?: string
): string {
  const successfulVideos = videos.filter(
    (v) => v.transcript?.status === 'success' && v.transcript.segments.length > 0
  );

  switch (format) {
    case 'txt': {
      return successfulVideos
        .map((v) => {
          const header = `=== ${v.video.title} ===\n`;
          const content = v.transcript!.plainText;
          return header + content;
        })
        .join('\n\n');
    }

    case 'srt': {
      let srtIndex = 1;
      const srtParts: string[] = [];

      for (const v of successfulVideos) {
        srtParts.push(`\n=== ${v.video.title} ===\n`);

        for (const segment of v.transcript!.segments) {
          const startMs = segment.offset;
          const endMs = segment.offset + segment.duration;
          const startTime = formatTimestamp(startMs);
          const endTime = formatTimestamp(endMs);

          srtParts.push(`${srtIndex}\n${startTime} --> ${endTime}\n${segment.text}\n`);
          srtIndex++;
        }
      }

      return srtParts.join('\n');
    }

    case 'json': {
      return JSON.stringify(
        {
          channelName,
          videoCount: successfulVideos.length,
          videos: successfulVideos.map((v) => ({
            videoId: v.video.videoId,
            title: v.video.title,
            publishedAt: v.video.publishedAt,
            wordCount: v.transcript!.wordCount,
            segments: v.transcript!.segments,
          })),
        },
        null,
        2
      );
    }

    default:
      return successfulVideos
        .map((v) => `=== ${v.video.title} ===\n${v.transcript!.plainText}`)
        .join('\n\n');
  }
}

export interface TranscriptFileContent {
  filename: string;
  content: string;
}

export function generateIndividualTranscripts(
  videos: ChannelVideoWithTranscript[],
  format: 'txt' | 'srt' | 'json'
): TranscriptFileContent[] {
  const successfulVideos = videos.filter(
    (v) => v.transcript?.status === 'success' && v.transcript.segments.length > 0
  );

  const extension = format;

  return successfulVideos.map((v) => {
    const safeTitle = sanitizeFilename(v.video.title);
    const filename = `${safeTitle}.${extension}`;
    const content = generateExportContent(
      v.transcript!.segments,
      format,
      v.video.title
    );

    return { filename, content };
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}
