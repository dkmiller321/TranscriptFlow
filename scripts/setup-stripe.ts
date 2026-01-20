/**
 * Setup script to create Stripe products and prices
 * Run with: npx tsx scripts/setup-stripe.ts
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is not set');
  console.error('Set it with: export STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

interface PriceIds {
  proMonthly: string;
  proYearly: string;
  businessMonthly: string;
  businessYearly: string;
}

async function setupStripeProducts(): Promise<PriceIds> {
  console.log('Setting up Stripe products and prices...\n');

  // Create Pro product
  console.log('Creating Pro product...');
  const proProduct = await stripe.products.create({
    name: 'TranscriptFlow Pro',
    description: 'For content creators and researchers. 50 videos/day, all formats, channel extraction.',
    metadata: {
      tier: 'pro',
    },
  });
  console.log(`  Created product: ${proProduct.id}`);

  // Create Pro monthly price
  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 900, // $9.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      tier: 'pro',
      interval: 'monthly',
    },
  });
  console.log(`  Created monthly price: ${proMonthly.id} ($9/month)`);

  // Create Pro yearly price
  const proYearly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 7900, // $79.00
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    metadata: {
      tier: 'pro',
      interval: 'yearly',
    },
  });
  console.log(`  Created yearly price: ${proYearly.id} ($79/year)\n`);

  // Create Business product
  console.log('Creating Business product...');
  const businessProduct = await stripe.products.create({
    name: 'TranscriptFlow Business',
    description: 'For teams and power users. Unlimited extractions, API access, priority support.',
    metadata: {
      tier: 'business',
    },
  });
  console.log(`  Created product: ${businessProduct.id}`);

  // Create Business monthly price
  const businessMonthly = await stripe.prices.create({
    product: businessProduct.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
    metadata: {
      tier: 'business',
      interval: 'monthly',
    },
  });
  console.log(`  Created monthly price: ${businessMonthly.id} ($29/month)`);

  // Create Business yearly price
  const businessYearly = await stripe.prices.create({
    product: businessProduct.id,
    unit_amount: 29000, // $290.00
    currency: 'usd',
    recurring: {
      interval: 'year',
    },
    metadata: {
      tier: 'business',
      interval: 'yearly',
    },
  });
  console.log(`  Created yearly price: ${businessYearly.id} ($290/year)\n`);

  return {
    proMonthly: proMonthly.id,
    proYearly: proYearly.id,
    businessMonthly: businessMonthly.id,
    businessYearly: businessYearly.id,
  };
}

function updateEnvFile(priceIds: PriceIds): void {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('.env.local file not found');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Update price IDs
  envContent = envContent.replace(
    /STRIPE_PRO_MONTHLY_PRICE_ID=.*/,
    `STRIPE_PRO_MONTHLY_PRICE_ID=${priceIds.proMonthly}`
  );
  envContent = envContent.replace(
    /STRIPE_PRO_YEARLY_PRICE_ID=.*/,
    `STRIPE_PRO_YEARLY_PRICE_ID=${priceIds.proYearly}`
  );
  envContent = envContent.replace(
    /STRIPE_BUSINESS_MONTHLY_PRICE_ID=.*/,
    `STRIPE_BUSINESS_MONTHLY_PRICE_ID=${priceIds.businessMonthly}`
  );
  envContent = envContent.replace(
    /STRIPE_BUSINESS_YEARLY_PRICE_ID=.*/,
    `STRIPE_BUSINESS_YEARLY_PRICE_ID=${priceIds.businessYearly}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env.local with price IDs');
}

async function main() {
  try {
    const priceIds = await setupStripeProducts();

    console.log('\n=== Price IDs ===');
    console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${priceIds.proMonthly}`);
    console.log(`STRIPE_PRO_YEARLY_PRICE_ID=${priceIds.proYearly}`);
    console.log(`STRIPE_BUSINESS_MONTHLY_PRICE_ID=${priceIds.businessMonthly}`);
    console.log(`STRIPE_BUSINESS_YEARLY_PRICE_ID=${priceIds.businessYearly}`);

    updateEnvFile(priceIds);

    console.log('\nStripe setup complete!');
    console.log('\nNext steps:');
    console.log('1. Set up webhook endpoint in Stripe Dashboard');
    console.log('   URL: https://your-domain.com/api/stripe/webhook');
    console.log('   Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted');
    console.log('2. Add STRIPE_WEBHOOK_SECRET to .env.local');
  } catch (error) {
    console.error('Error setting up Stripe:', error);
    process.exit(1);
  }
}

main();
