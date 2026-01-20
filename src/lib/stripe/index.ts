import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  prices: {
    pro: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    },
    business: {
      monthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID!,
      yearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID!,
    },
  },
};
