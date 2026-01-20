import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // If webhook secret is configured, verify the signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(body) as Stripe.Event;
      console.warn('Webhook signature verification skipped (no STRIPE_WEBHOOK_SECRET)');
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session');
    return;
  }

  // Get subscription details for period end
  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);
  // In newer API versions, current_period_end is on the subscription items
  const periodEnd = subscriptionData.items?.data?.[0]?.current_period_end ?? null;

  // Update user subscription in database
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.log(`Subscription activated for user ${userId}: ${tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user by Stripe customer ID
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userSub) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Get tier from price metadata
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const price = await stripe.prices.retrieve(priceId);
  const tier = price.metadata?.tier || 'pro';
  const periodEnd = subscriptionItem?.current_period_end ?? null;

  // Update subscription details
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      tier,
      stripe_subscription_id: subscription.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userSub.user_id);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.log(`Subscription updated for user ${userSub.user_id}: ${tier}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user by Stripe customer ID
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userSub) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Downgrade to free tier
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      tier: 'free',
      stripe_subscription_id: null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userSub.user_id);

  if (error) {
    console.error('Failed to downgrade subscription:', error);
    throw error;
  }

  console.log(`Subscription cancelled for user ${userSub.user_id}, downgraded to free`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Get user by Stripe customer ID
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userSub) {
    return;
  }

  // You could send an email notification here
  console.log(`Payment failed for user ${userSub.user_id}`);
}
