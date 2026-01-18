import type { TranscriptSegment } from './types';
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
