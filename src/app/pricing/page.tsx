'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { TIERS, type TierName } from '@/lib/usage/tiers';
import { cn } from '@/lib/utils';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<TierName | null>(null);

  const cancelled = searchParams.get('checkout') === 'cancelled';

  const handleUpgrade = async (tier: TierName) => {
    if (tier === 'free') return;

    setLoading(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: billingInterval }),
      });

      const data = await response.json();

      if (data.error) {
        if (response.status === 401) {
          // Not logged in, redirect to login
          router.push('/login?redirect=/pricing');
          return;
        }
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const tiers = Object.entries(TIERS) as [TierName, typeof TIERS[TierName]][];

  return (
    <>
      <Header />
      <AnimatedBackground />
      <main className="min-h-[calc(100vh-64px)] px-4 py-12 md:px-8 lg:px-12 max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Simple, Transparent</span>
            <br />
            <span className="text-foreground">Pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Cancelled notice */}
        {cancelled && (
          <GlassCard className="max-w-md mx-auto mb-8 p-4 text-center border-yellow-500/30 animate-scale-in">
            <p className="text-yellow-500 text-sm">
              Checkout was cancelled. No charges were made.
            </p>
          </GlassCard>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <GlassCard className="inline-flex items-center gap-2 p-1.5">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                billingInterval === 'monthly'
                  ? "gradient-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                billingInterval === 'yearly'
                  ? "gradient-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <Badge variant="secondary" className="bg-forest-500/20 text-forest-400 border-forest-500/30">
                Save 27%
              </Badge>
            </button>
          </GlassCard>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto stagger-children">
          {tiers.map(([tierKey, tier], index) => {
            const price = billingInterval === 'monthly' ? tier.pricing.monthly : tier.pricing.yearly;
            const isPopular = tierKey === 'pro';

            return (
              <GlassCard
                key={tierKey}
                variant={isPopular ? "strong" : "default"}
                hover
                glow={isPopular}
                className={cn(
                  "relative p-6 transition-all duration-300",
                  isPopular && "scale-[1.02] gradient-border"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-primary text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg shadow-forest-500/25">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center pb-4">
                  <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                </div>

                <div className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <span className={cn(
                      "text-4xl font-bold",
                      isPopular ? "gradient-text" : "text-foreground"
                    )}>
                      ${price}
                    </span>
                    {tierKey !== 'free' && (
                      <span className="text-muted-foreground">
                        /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                    {billingInterval === 'yearly' && tierKey !== 'free' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${Math.round(price / 12)}/month billed yearly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-forest-400 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <GradientButton
                    onClick={() => handleUpgrade(tierKey)}
                    disabled={loading !== null}
                    variant={isPopular ? 'primary' : 'outline'}
                    className="w-full"
                    loading={loading === tierKey}
                  >
                    {loading === tierKey ? (
                      'Processing...'
                    ) : tierKey === 'free' ? (
                      'Get Started'
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </GradientButton>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <GlassCard variant="subtle" className="inline-block px-8 py-4">
            <p className="text-muted-foreground text-sm">
              All plans include SSL encryption and 99.9% uptime guarantee.
              <br />
              Questions? <a href="mailto:support@transcriptflow.com" className="text-forest-400 hover:text-forest-500 hover:underline transition-colors">Contact us</a>
            </p>
          </GlassCard>
        </div>
      </main>
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
