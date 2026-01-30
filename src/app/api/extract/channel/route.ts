import { NextRequest, NextResponse } from 'next/server';
import { extractChannelId } from '@/lib/youtube/parser';
import { resolveChannelId, fetchChannelInfo, fetchChannelVideos, fetchChannelTranscripts } from '@/lib/youtube/channel';
import { createJob, updateJob, updateJobProgress, setJobAbortController, getJob, clearJobAbortController } from '@/lib/jobs/store';
import { CHANNEL_LIMITS } from '@/lib/utils/constants';
import type { ChannelOutputFormat, BatchProgress } from '@/lib/youtube/types';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, trackUsage, getUserTier } from '@/lib/usage/tracking';
import { getTierLimits } from '@/lib/usage/tiers';

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

    // Get user if authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Channel extraction requires authentication
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to use channel extraction.',
        },
        { status: 401 }
      );
    }

    // Check if channel extraction is allowed for user's tier
    const rateLimitResult = await checkRateLimit(supabase, user.id, 'channel_extraction');

    // Get user's tier and limits
    const tier = await getUserTier(supabase, user.id);
    const tierLimits = getTierLimits(tier);

    // Check if channel extraction feature is allowed for this tier
    if (!tierLimits.channelExtraction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Channel extraction is not available on the free tier. Please upgrade to Pro or Business to access this feature.',
          tierRestriction: true,
        },
        { status: 403 }
      );
    }

    // Check rate limit (daily video extraction limit)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please upgrade your plan or wait until the limit resets.',
          rateLimit: {
            remaining: rateLimitResult.remaining,
            resetAt: rateLimitResult.resetAt.toISOString(),
          },
        },
        { status: 429 }
      );
    }

    // Cap the limit to the user's tier maximum
    const effectiveLimit = Math.min(
      Math.max(limit, CHANNEL_LIMITS.MIN_VIDEOS),
      Math.min(CHANNEL_LIMITS.MAX_VIDEOS, tierLimits.maxChannelVideos)
    );

    // Create a job for tracking (now stored in Supabase)
    const job = await createJob(url, effectiveLimit, format, user.id);

    // Start processing in the background with user context for tracking
    processChannelExtraction(job.id, url, effectiveLimit, user.id).catch(async (error) => {
      console.error('Channel extraction failed:', error);
      await updateJob(job.id, {
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
        // Include initial job state so client doesn't need immediate poll
        progress: job.progress,
        channelInfo: null,
        results: [],
      },
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt.toISOString(),
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
  limit: number,
  userId: string
) {
  const abortController = new AbortController();
  setJobAbortController(jobId, abortController);

  try {
    // Update status to fetching videos
    await updateJobProgress(jobId, {
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
    await updateJob(jobId, { channelInfo });

    // Fetch video list
    const videos = await fetchChannelVideos(channelId, limit);
    await updateJob(jobId, { videos });

    await updateJobProgress(jobId, {
      status: 'processing',
      currentVideoIndex: 0,
      totalVideos: videos.length,
      successCount: 0,
      failedCount: 0,
    });

    // Fetch transcripts with progress updates
    const results = await fetchChannelTranscripts(
      videos,
      async (progress: BatchProgress) => {
        await updateJobProgress(jobId, progress);
      },
      abortController.signal
    );

    const successCount = results.filter((r) => r.transcript?.status === 'success').length;
    const failedCount = results.filter((r) => r.transcript?.status !== 'success').length;

    // Update final results
    await updateJob(jobId, {
      results,
      progress: {
        status: 'completed',
        currentVideoIndex: videos.length,
        totalVideos: videos.length,
        successCount,
        failedCount,
      },
    });

    // Track successful usage (count total videos extracted)
    if (successCount > 0) {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();
      await trackUsage(supabase, userId, 'channel_extraction', successCount);
    }
  } catch (error) {
    if (abortController.signal.aborted) {
      // Job was cancelled, status already set
      return;
    }

    const job = await getJob(jobId);
    await updateJob(jobId, {
      progress: {
        status: 'error',
        currentVideoIndex: job?.progress.currentVideoIndex || 0,
        totalVideos: job?.progress.totalVideos || 0,
        successCount: job?.progress.successCount || 0,
        failedCount: job?.progress.failedCount || 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  } finally {
    // Clean up the abort controller from memory
    clearJobAbortController(jobId);
  }
}
