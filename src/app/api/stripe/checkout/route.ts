import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import type { TierName } from '@/lib/usage/tiers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('sb-jqyawimrdxgjovvaifzt-auth-token');

    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the auth token to get user
    const tokenData = JSON.parse(authCookie.value);
    const accessToken = tokenData[0];

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier, interval } = body as { tier: TierName; interval: 'monthly' | 'yearly' };

    if (!tier || !interval) {
      return NextResponse.json({ error: 'Missing tier or interval' }, { status: 400 });
    }

    if (tier === 'free') {
      return NextResponse.json({ error: 'Cannot checkout for free tier' }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId: string;

    // Check if user already has a Stripe customer ID
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          tier: 'free',
        });
    }

    // Get price ID based on tier and interval
    const priceId = tier === 'pro'
      ? (interval === 'monthly' ? STRIPE_CONFIG.prices.pro.monthly : STRIPE_CONFIG.prices.pro.yearly)
      : (interval === 'monthly' ? STRIPE_CONFIG.prices.business.monthly : STRIPE_CONFIG.prices.business.yearly);

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/settings?checkout=success`,
      cancel_url: `${request.nextUrl.origin}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
        tier,
        interval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
