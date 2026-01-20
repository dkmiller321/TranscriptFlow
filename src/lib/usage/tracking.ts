import { SupabaseClient } from '@supabase/supabase-js';
import { getTierLimits, TierName, isValidTier } from './tiers';

export type ActionType = 'video_extraction' | 'channel_extraction';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface UsageStats {
  today: number;
  thisMonth: number;
  tier: TierName;
  limits: {
    videosPerDay: number;
    channelExtraction: boolean;
    maxChannelVideos: number;
  };
}

/**
 * Track usage for a user action
 */
export async function trackUsage(
  supabase: SupabaseClient,
  userId: string | null,
  actionType: ActionType,
  videoCount: number = 1
): Promise<void> {
  if (!userId) {
    // For anonymous users, we don't track in database
    // Rate limiting for anonymous users is handled separately
    return;
  }

  const { error } = await supabase.from('usage_tracking').insert({
    user_id: userId,
    action_type: actionType,
    video_count: videoCount,
  });

  if (error) {
    console.error('Failed to track usage:', error);
    // Don't throw - usage tracking failure shouldn't block the main action
  }
}

/**
 * Get usage count for today
 */
export async function getUsageToday(
  supabase: SupabaseClient,
  userId: string | null
): Promise<number> {
  if (!userId) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('video_count')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Failed to get usage today:', error);
    return 0;
  }

  return data?.reduce((sum, row) => sum + (row.video_count || 1), 0) || 0;
}

/**
 * Get usage count for this month
 */
export async function getUsageThisMonth(
  supabase: SupabaseClient,
  userId: string | null
): Promise<number> {
  if (!userId) {
    return 0;
  }

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('video_count')
    .eq('user_id', userId)
    .gte('created_at', firstOfMonth.toISOString());

  if (error) {
    console.error('Failed to get usage this month:', error);
    return 0;
  }

  return data?.reduce((sum, row) => sum + (row.video_count || 1), 0) || 0;
}

/**
 * Get user's subscription tier
 */
export async function getUserTier(
  supabase: SupabaseClient,
  userId: string | null
): Promise<TierName> {
  if (!userId) {
    return 'free';
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // No subscription record means free tier
    return 'free';
  }

  const tier = data.tier as string;
  return isValidTier(tier) ? tier : 'free';
}

/**
 * Check if user can perform an action based on rate limits
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string | null,
  actionType: ActionType
): Promise<RateLimitResult> {
  // Calculate reset time (midnight today or tomorrow)
  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setDate(resetAt.getDate() + 1);
  resetAt.setHours(0, 0, 0, 0);

  // For anonymous users, apply strict limits
  if (!userId) {
    // Anonymous users get very limited access
    // In production, you might want to track by IP or session
    return {
      allowed: true, // Allow but with warning
      remaining: 3, // Give anonymous users 3 extractions per session
      resetAt,
    };
  }

  // Get user's tier
  const tier = await getUserTier(supabase, userId);
  const limits = getTierLimits(tier);

  // Check if action type is allowed for this tier
  if (actionType === 'channel_extraction' && !limits.channelExtraction) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Get today's usage
  const usageToday = await getUsageToday(supabase, userId);

  // Check against daily limit
  const remaining = Math.max(0, limits.videosPerDay - usageToday);
  const allowed = limits.videosPerDay === Infinity || usageToday < limits.videosPerDay;

  return {
    allowed,
    remaining: limits.videosPerDay === Infinity ? Infinity : remaining,
    resetAt,
  };
}

/**
 * Get complete usage stats for a user
 */
export async function getUsageStats(
  supabase: SupabaseClient,
  userId: string | null
): Promise<UsageStats> {
  const tier = await getUserTier(supabase, userId);
  const limits = getTierLimits(tier);

  const [today, thisMonth] = await Promise.all([
    getUsageToday(supabase, userId),
    getUsageThisMonth(supabase, userId),
  ]);

  return {
    today,
    thisMonth,
    tier,
    limits,
  };
}
