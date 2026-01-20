'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TIERS, type TierName } from '@/lib/usage/tiers';
import { cn } from '@/lib/utils';

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
      <main className="min-h-[calc(100vh-64px)] px-4 py-12 md:px-8 lg:px-12 max-w-6xl mx-auto">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Cancelled notice */}
        {cancelled && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center animate-in fade-in duration-300">
            <p className="text-yellow-500 text-sm">
              Checkout was cancelled. No charges were made.
            </p>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <div className="inline-flex items-center gap-2 p-1 bg-secondary/50 rounded-lg">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                billingInterval === 'monthly'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                billingInterval === 'yearly'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                Save 27%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {tiers.map(([tierKey, tier], index) => {
            const price = billingInterval === 'monthly' ? tier.pricing.monthly : tier.pricing.yearly;
            const isPopular = tierKey === 'pro';

            return (
              <Card
                key={tierKey}
                className={cn(
                  "relative bg-card/50 backdrop-blur-sm border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl",
                  isPopular && "border-primary/50 shadow-primary/10 scale-[1.02]"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <span className="text-4xl font-bold text-foreground">
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
                          className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
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
                  <Button
                    onClick={() => handleUpgrade(tierKey)}
                    disabled={loading !== null}
                    variant={isPopular ? 'default' : 'outline'}
                    className={cn(
                      "w-full",
                      isPopular && "shadow-lg shadow-primary/25"
                    )}
                  >
                    {loading === tierKey ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : tierKey === 'free' ? (
                      'Get Started'
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <p className="text-muted-foreground text-sm">
            All plans include SSL encryption and 99.9% uptime guarantee.
            <br />
            Questions? <a href="mailto:support@transcriptflow.com" className="text-primary hover:underline">Contact us</a>
          </p>
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
