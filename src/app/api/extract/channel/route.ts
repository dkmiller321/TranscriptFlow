import { NextRequest, NextResponse } from 'next/server';
import { extractChannelId } from '@/lib/youtube/parser';
import { resolveChannelId, fetchChannelInfo, fetchChannelVideos, fetchChannelTranscripts } from '@/lib/youtube/channel';
import { createJob, updateJob, updateJobProgress, setJobAbortController, getJob } from '@/lib/jobs/store';
import { CHANNEL_LIMITS } from '@/lib/utils/constants';
import type { ChannelOutputFormat, BatchProgress } from '@/lib/youtube/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, limit = CHANNEL_LIMITS.DEFAULT_VIDEOS, format = 'combined' } = body as {
      url?: string;
      limit?: number;
      format?: ChannelOutputFormat;
    };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Channel URL is required' },
        { status: 400 }
      );
    }

    // Validate that it's a channel URL
    const extracted = extractChannelId(url);
    if (!extracted) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube channel URL' },
        { status: 400 }
      );
    }

    // Validate limit
    const effectiveLimit = Math.min(
      Math.max(limit, CHANNEL_LIMITS.MIN_VIDEOS),
      CHANNEL_LIMITS.MAX_VIDEOS
    );

    // Create a job for tracking
    const job = createJob(url, effectiveLimit, format);

    // Start processing in the background
    processChannelExtraction(job.id, url, effectiveLimit).catch((error) => {
      console.error('Channel extraction failed:', error);
      updateJob(job.id, {
        progress: {
          status: 'error',
          currentVideoIndex: 0,
          totalVideos: 0,
          successCount: 0,
          failedCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: 'started',
      },
    });
  } catch (error) {
    console.error('Channel extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start channel extraction',
      },
      { status: 500 }
    );
  }
}

async function processChannelExtraction(
  jobId: string,
  url: string,
  limit: number
) {
  const abortController = new AbortController();
  setJobAbortController(jobId, abortController);

  try {
    // Update status to fetching videos
    updateJobProgress(jobId, {
      status: 'fetching_videos',
      currentVideoIndex: 0,
      totalVideos: 0,
      successCount: 0,
      failedCount: 0,
    });

    // Resolve channel ID
    const channelId = await resolveChannelId(url);
    if (!channelId) {
      throw new Error('Could not resolve channel ID from URL');
    }

    // Fetch channel info
    const channelInfo = await fetchChannelInfo(channelId);
    updateJob(jobId, { channelInfo });

    // Fetch video list
    const videos = await fetchChannelVideos(channelId, limit);
    updateJob(jobId, { videos });

    updateJobProgress(jobId, {
      status: 'processing',
      currentVideoIndex: 0,
      totalVideos: videos.length,
      successCount: 0,
      failedCount: 0,
    });

    // Fetch transcripts with progress updates
    const results = await fetchChannelTranscripts(
      videos,
      (progress: BatchProgress) => {
        updateJobProgress(jobId, progress);
      },
      abortController.signal
    );

    // Update final results
    updateJob(jobId, {
      results,
      progress: {
        status: 'completed',
        currentVideoIndex: videos.length,
        totalVideos: videos.length,
        successCount: results.filter((r) => r.transcript?.status === 'success').length,
        failedCount: results.filter((r) => r.transcript?.status !== 'success').length,
      },
    });
  } catch (error) {
    if (abortController.signal.aborted) {
      // Job was cancelled, status already set
      return;
    }

    const job = getJob(jobId);
    updateJob(jobId, {
      progress: {
        status: 'error',
        currentVideoIndex: job?.progress.currentVideoIndex || 0,
        totalVideos: job?.progress.totalVideos || 0,
        successCount: job?.progress.successCount || 0,
        failedCount: job?.progress.failedCount || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}
