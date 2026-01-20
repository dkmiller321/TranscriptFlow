import 'server-only';
import { Innertube } from 'youtubei.js';
import type { TranscriptSegment, TranscriptResult, VideoInfo } from './types';
import { extractVideoId, getThumbnailUrl } from './parser';
import { formatTimestamp } from '@/lib/utils/formatters';

let innertubeInstance: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      lang: 'en',
      location: 'US',
      retrieve_player: false,
    });
  }
  return innertubeInstance;
}

async function fetchTranscriptFromYouTube(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const innertube = await getInnertube();
    const info = await innertube.getInfo(videoId);

    // Get transcript
    const transcriptInfo = await info.getTranscript();

    if (!transcriptInfo || !transcriptInfo.transcript) {
      throw new Error('No transcript available for this video');
    }

    const transcript = transcriptInfo.transcript;
    const content = transcript.content;

    if (!content || !content.body || !content.body.initial_segments) {
      throw new Error('No transcript segments available');
    }

    const segments: TranscriptSegment[] = [];

    for (const segment of content.body.initial_segments) {
      if (segment.type === 'TranscriptSegment') {
        const text = segment.snippet?.text || '';
        const startMs = parseInt(segment.start_ms || '0', 10);
        const endMs = parseInt(segment.end_ms || '0', 10);

        segments.push({
          text,
          offset: startMs,
          duration: endMs - startMs,
        });
      }
    }

    if (segments.length === 0) {
      throw new Error('No transcript segments found');
    }

    return segments;
  } catch (error) {
    if (error instanceof Error) {
      // Provide user-friendly error messages
      const msg = error.message.toLowerCase();
      if (msg.includes('disabled') || msg.includes('not available')) {
        throw new Error('Transcripts are disabled for this video.');
      }
      if (msg.includes('not found') || msg.includes('unavailable')) {
        throw new Error('Video not found or is unavailable.');
      }
      if (msg.includes('no transcript')) {
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

  // Fetch transcript using youtubei.js
  const segments = await fetchTranscriptFromYouTube(videoId);

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
