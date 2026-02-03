'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { TIERS, type TierName } from '@/lib/usage/tiers';
import { cn } from '@/lib/utils';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Spinner } from '@/components/ui/Spinner';
function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<TierName | null>(null);

  const cancelled = searchParams.get('checkout') === 'cancelled';

  const handleUpgrade = async (tier: TierName) => {
    if (tier === 'free') {
      router.push('/');
      return;
    }

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
      <main className="min-h-[calc(100vh-64px)] px-4 py-16 md:py-20 md:px-8 lg:px-12 max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="block mb-2 gradient-text animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              Simple, Transparent
            </span>
            <span className="block text-foreground opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              Pricing
            </span>
          </h1>
          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto opacity-0 animate-fade-in"
            style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}
          >
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Cancelled notice */}
        {cancelled && (
          <GlassCard className="max-w-md mx-auto mb-8 p-4 text-center animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-500 text-sm font-medium">
                Checkout was cancelled. No charges were made.
              </p>
            </div>
          </GlassCard>
        )}

        {/* Billing toggle */}
        <div
          className="flex justify-center mb-12 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}
        >
          <GlassCard className="inline-flex items-center gap-2 p-1.5">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                "relative px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                billingInterval === 'monthly'
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {billingInterval === 'monthly' && (
                <span className="absolute inset-0 gradient-primary rounded-lg shadow-md" />
              )}
              <span className="relative">Monthly</span>
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                "relative px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2",
                billingInterval === 'yearly'
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {billingInterval === 'yearly' && (
                <span className="absolute inset-0 gradient-primary rounded-lg shadow-md" />
              )}
              <span className="relative flex items-center gap-2">
                Yearly
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    billingInterval === 'yearly'
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  Save 27%
                </Badge>
              </span>
            </button>
          </GlassCard>
        </div>

        {/* Pricing cards */}
        <div
          className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto opacity-0 animate-fade-in"
          style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}
        >
          {tiers.map(([tierKey, tier]) => {
            const price = billingInterval === 'monthly' ? tier.pricing.monthly : tier.pricing.yearly;
            const isPopular = tierKey === 'pro';

            return (
              <GlassCard
                key={tierKey}
                variant={isPopular ? 'strong' : 'default'}
                hover
                glow={isPopular}
                glowColor={isPopular ? 'multi' : 'primary'}
                noise
                className={cn(
                  'relative p-6 lg:p-8 transition-all duration-300',
                  isPopular && 'scale-[1.02] z-10'
                )}
              >
                {/* Gradient border for popular */}
                {isPopular && (
                  <>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 pointer-events-none" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                      <span className="gradient-primary text-primary-foreground text-xs font-medium px-4 py-1.5 rounded-full shadow-lg shadow-primary/30 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Most Popular
                      </span>
                    </div>
                  </>
                )}

                <div className="relative pt-2">
                  <div className="text-center pb-6 border-b border-border/50">
                    <h3 className="text-2xl font-bold text-foreground mb-1">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="py-6 text-center">
                    <span
                      className={cn(
                        'text-5xl font-bold tracking-tight',
                        isPopular ? 'gradient-text' : 'text-foreground'
                      )}
                    >
                      ${price}
                    </span>
                    {tierKey !== 'free' && (
                      <span className="text-muted-foreground ml-1">
                        /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                    {billingInterval === 'yearly' && tierKey !== 'free' && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="text-primary font-medium">${Math.round(price / 12)}</span>/month billed yearly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 pb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <svg
                            className="w-3 h-3 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-muted-foreground leading-tight">
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
                      'Get Started Free'
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
        <div
          className="mt-16 text-center opacity-0 animate-fade-in"
          style={{ animationDelay: '1.3s', animationFillMode: 'forwards' }}
        >
          <GlassCard variant="subtle" className="inline-block px-8 py-5">
            <div className="flex items-center justify-center gap-3 text-muted-foreground text-sm">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>
                All plans include SSL encryption and 99.9% uptime guarantee.
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-3">
              Questions?{' '}
              <a
                href="mailto:support@transcriptflow.com"
                className="text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
              >
                Contact us
              </a>
            </p>
          </GlassCard>
        </div>
      </main>
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" variant="gradient" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
