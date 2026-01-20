export type TierName = 'free' | 'pro' | 'business';

export interface TierLimits {
  videosPerDay: number;
  channelExtraction: boolean;
  maxChannelVideos: number;
}

export const TIER_LIMITS: Record<TierName, TierLimits> = {
  free: {
    videosPerDay: 5,
    channelExtraction: false,
    maxChannelVideos: 0,
  },
  pro: {
    videosPerDay: 100,
    channelExtraction: true,
    maxChannelVideos: 50,
  },
  business: {
    videosPerDay: Infinity,
    channelExtraction: true,
    maxChannelVideos: 500,
  },
};

export function getTierLimits(tier: TierName): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function isValidTier(tier: string): tier is TierName {
  return tier === 'free' || tier === 'pro' || tier === 'business';
}
