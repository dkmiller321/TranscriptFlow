export type TierName = 'free' | 'pro' | 'business';

export interface TierLimits {
  videosPerDay: number;
  channelExtraction: boolean;
  maxChannelVideos: number;
  formats: ('txt' | 'srt' | 'json')[];
  apiAccess: boolean;
  bulkImport: boolean;
  prioritySupport: boolean;
}

export interface TierPricing {
  monthly: number;
  yearly: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface TierInfo {
  name: string;
  description: string;
  limits: TierLimits;
  pricing: TierPricing;
  features: string[];
}

export const TIERS: Record<TierName, TierInfo> = {
  free: {
    name: 'Free',
    description: 'Perfect for trying out TranscriptFlow',
    limits: {
      videosPerDay: 3,
      channelExtraction: false,
      maxChannelVideos: 0,
      formats: ['txt'],
      apiAccess: false,
      bulkImport: false,
      prioritySupport: false,
    },
    pricing: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      '3 videos per day',
      'TXT format only',
      'Basic video extraction',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For content creators and researchers',
    limits: {
      videosPerDay: 50,
      channelExtraction: true,
      maxChannelVideos: 25,
      formats: ['txt', 'srt', 'json'],
      apiAccess: false,
      bulkImport: false,
      prioritySupport: false,
    },
    pricing: {
      monthly: 9,
      yearly: 79,
      stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    },
    features: [
      '50 videos per day',
      'All formats (TXT, SRT, JSON)',
      'Channel extraction (25 videos)',
      'No watermarks',
    ],
  },
  business: {
    name: 'Business',
    description: 'For teams and power users',
    limits: {
      videosPerDay: Infinity,
      channelExtraction: true,
      maxChannelVideos: 500,
      formats: ['txt', 'srt', 'json'],
      apiAccess: true,
      bulkImport: true,
      prioritySupport: true,
    },
    pricing: {
      monthly: 29,
      yearly: 290,
      stripePriceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
      stripePriceIdYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID,
    },
    features: [
      'Unlimited extractions',
      'All formats (TXT, SRT, JSON)',
      'Channel extraction (500 videos)',
      'API access',
      'Bulk URL import',
      'Priority support',
    ],
  },
};

// Legacy export for backwards compatibility
export const TIER_LIMITS: Record<TierName, TierLimits> = {
  free: TIERS.free.limits,
  pro: TIERS.pro.limits,
  business: TIERS.business.limits,
};

export function getTierLimits(tier: TierName): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function isValidTier(tier: string): tier is TierName {
  return tier === 'free' || tier === 'pro' || tier === 'business';
}
