import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsageStats, checkRateLimit } from '@/lib/usage/tracking';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || null;
    const stats = await getUsageStats(supabase, userId);
    const videoRateLimit = await checkRateLimit(supabase, userId, 'video_extraction');
    const channelRateLimit = await checkRateLimit(supabase, userId, 'channel_extraction');

    return NextResponse.json({
      success: true,
      data: {
        authenticated: !!user,
        usage: {
          today: stats.today,
          thisMonth: stats.thisMonth,
        },
        subscription: {
          tier: stats.tier,
        },
        limits: {
          videosPerDay: stats.limits.videosPerDay,
          channelExtraction: stats.limits.channelExtraction,
          maxChannelVideos: stats.limits.maxChannelVideos,
        },
        rateLimit: {
          video: {
            allowed: videoRateLimit.allowed,
            remaining: videoRateLimit.remaining,
            resetAt: videoRateLimit.resetAt.toISOString(),
          },
          channel: {
            allowed: channelRateLimit.allowed,
            remaining: channelRateLimit.remaining,
            resetAt: channelRateLimit.resetAt.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get usage stats',
      },
      { status: 500 }
    );
  }
}
