import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUsageStats, checkRateLimit, getSubscriptionInfo } from '@/lib/usage/tracking';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const userId = user?.id || null;
    const [stats, subscription, videoRateLimit, channelRateLimit] = await Promise.all([
      getUsageStats(supabase, userId),
      getSubscriptionInfo(supabase, userId),
      checkRateLimit(supabase, userId, 'video_extraction'),
      checkRateLimit(supabase, userId, 'channel_extraction'),
    ]);

    // Return simplified format for settings page
    return NextResponse.json({
      today: stats.today,
      month: stats.thisMonth,
      subscription: {
        tier: subscription.tier,
        stripe_customer_id: subscription.stripe_customer_id,
        stripe_subscription_id: subscription.stripe_subscription_id,
        current_period_end: subscription.current_period_end,
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
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}
