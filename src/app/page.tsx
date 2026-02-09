'use client';

import { Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { UrlInput } from '@/components/features/UrlInput';
import { VideoPreview } from '@/components/features/VideoPreview';
import { TranscriptViewer } from '@/components/features/TranscriptViewer';
import { ExportOptions } from '@/components/features/ExportOptions';
import { ChannelProgress } from '@/components/features/ChannelProgress';
import { ChannelResults } from '@/components/features/ChannelResults';
import { TranscriptSkeleton } from '@/components/features/TranscriptSkeleton';
import { SocialProof } from '@/components/features/SocialProof';
import { useExtraction } from '@/hooks/useExtraction';
import { useChannelExtraction } from '@/hooks/useChannelExtraction';
import { useUserTier } from '@/hooks/useUserTier';
import { Spinner } from '@/components/ui/Spinner';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { cn } from '@/lib/utils';
import type { ChannelOutputFormat } from '@/lib/youtube/types';

function HomeContent() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const {
    isLoading: isVideoLoading,
    error: videoError,
    videoInfo,
    segments,
    plainText,
    srtContent,
    wordCount,
    extract: extractVideo,
    reset: resetVideo,
  } = useExtraction();

  const {
    isLoading: isChannelLoading,
    error: channelError,
    channelInfo,
    progress,
    results,
    outputFormat,
    isRetrying,
    extract: extractChannel,
    cancel: cancelChannel,
    reset: resetChannel,
  } = useChannelExtraction();

  const { tier, limits } = useUserTier();

  const isLoading = isVideoLoading || isChannelLoading;
  const error = videoError || (channelError && !isRetrying ? channelError : null);

  useEffect(() => {
    const videoId = searchParams.get('v');
    if (videoId && !isLoading && !videoInfo) {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      extractVideo(videoUrl);
    }
  }, [searchParams, isLoading, videoInfo, extractVideo]);

  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleVideoExtract = async (url: string) => {
    resetChannel();
    try {
      await extractVideo(url);
      scrollToResults();
    } catch {
      // Error handled in hook
    }
  };

  const handleChannelExtract = async (
    url: string,
    limit: number,
    format: ChannelOutputFormat
  ) => {
    resetVideo();
    await extractChannel(url, limit, format);
    scrollToResults();
  };

  const handleReset = () => {
    resetVideo();
    resetChannel();
  };

  const isChannelMode = isChannelLoading || (channelInfo && results.length > 0);
  const showChannelProgress = isChannelLoading && progress.status !== 'idle';
  const showChannelResults =
    !isChannelLoading && channelInfo && results.length > 0 && progress.status === 'completed';
  const hasResults = videoInfo || showChannelProgress || showChannelResults;

  return (
    <>
      <Header />
      <AnimatedBackground />
      <main className="min-h-[calc(100vh-64px)] relative">
        {/* ==================== HERO ==================== */}
        <section className="px-4 py-20 md:py-28 lg:py-32 md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            {/* Animated headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6">
              <span className="block mb-2 gradient-text animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
                Get the transcript
              </span>
              <span className="block text-foreground opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                from any YouTube video
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in"
              style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
            >
              Paste a link, get clean text with timestamps. Works with single videos or entire channels. Export as TXT, JSON, or SRT.
            </p>

            {/* Main input card */}
            <div
              className="opacity-0 animate-scale-in"
              style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
            >
              <GlassCard className="max-w-2xl mx-auto mb-4 p-6" glow glowColor="multi" noise>
                <UrlInput
                  onSubmit={handleVideoExtract}
                  onChannelSubmit={handleChannelExtract}
                  isLoading={isLoading}
                  ctaText="Get transcript"
                  placeholder="Paste a YouTube URL here..."
                  maxChannelVideos={limits.maxChannelVideos}
                  tierName={tier}
                />
              </GlassCard>
            </div>

            <p
              className="text-sm text-muted-foreground opacity-0 animate-fade-in"
              style={{ animationDelay: '1.2s', animationFillMode: 'forwards' }}
            >
              Free for single videos. No account needed.
            </p>

            {/* Error display */}
            {error && (
              <GlassCard className="mt-6 p-4 max-w-2xl mx-auto border-destructive/30 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-destructive text-sm font-medium">{error}</p>
                </div>
              </GlassCard>
            )}

            {/* Loading states */}
            {isVideoLoading && (
              <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in">
                <Spinner size="lg" variant="gradient" />
                <p className="text-muted-foreground text-sm">Extracting transcript...</p>
              </div>
            )}

            {isRetrying && isChannelLoading && (
              <div className="flex flex-col items-center gap-4 py-12 animate-in fade-in">
                <Spinner size="lg" variant="dots" />
                <p className="text-muted-foreground text-sm">Connecting to server...</p>
              </div>
            )}
          </div>
        </section>

        {/* ==================== RESULTS ==================== */}
        {hasResults && (
          <section
            ref={resultsRef}
            className="px-4 py-12 md:px-8 lg:px-12 border-t border-border/50"
          >
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {showChannelProgress && (
                <ChannelProgress
                  progress={progress}
                  channelInfo={channelInfo}
                  onCancel={cancelChannel}
                />
              )}

              {showChannelResults && (
                <ChannelResults
                  channelInfo={channelInfo!}
                  results={results}
                  outputFormat={outputFormat}
                  onReset={handleReset}
                />
              )}

              {videoInfo && !isVideoLoading && !isChannelMode && (
                <div className="flex flex-col gap-6">
                  <VideoPreview videoInfo={videoInfo} wordCount={wordCount} />
                  <ExportOptions
                    segments={segments}
                    plainText={plainText}
                    srtContent={srtContent}
                    videoTitle={videoInfo.title}
                    videoId={videoInfo.videoId}
                  />
                  <TranscriptViewer segments={segments} plainText={plainText} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================== WHO IT'S FOR ==================== */}
        <section className="px-4 py-20 md:py-24 md:px-8 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
              <span className="gradient-text">Built for people</span>
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              who work with video content
            </p>

            <div className="grid md:grid-cols-3 gap-6 stagger-children">
              <FeatureCard
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                }
                title="Building with AI"
                description="Need to feed YouTube content into GPT or Claude? Get structured transcripts you can paste directly into any prompt."
              />
              <FeatureCard
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                }
                title="Repurposing content"
                description="Turn videos into blog posts, tweet threads, or newsletters. The transcript is the hard part—we handle that."
              />
              <FeatureCard
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                }
                title="Research"
                description="Pull transcripts from lectures, interviews, or conference talks. Search and cite without rewatching hours of video."
              />
            </div>
          </div>
        </section>

        {/* ==================== SOCIAL PROOF ==================== */}
        <SocialProof />

        {/* ==================== WHY THIS TOOL ==================== */}
        <section className="px-4 py-20 md:py-24 md:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
              <span className="text-foreground">Why not just use a</span>{' '}
              <span className="gradient-text">free transcript grabber?</span>
            </h2>

            <GlassCard className="p-8 space-y-6" noise>
              <p className="text-foreground leading-relaxed">
                Most free tools give you a wall of text with no timestamps, weird formatting, and no way to export properly.
                Fine if you just need to skim something. Not fine if you&apos;re actually trying to use the content.
              </p>

              <p className="text-foreground leading-relaxed">
                TranscriptFlow gives you <strong className="gradient-text font-semibold">structured data</strong>—timestamps, proper formatting, and exports
                that work (TXT, JSON, SRT). You can also pull transcripts from <strong className="gradient-text font-semibold">entire channels</strong> at once,
                not just one video at a time.
              </p>

              <p className="text-muted-foreground text-sm pt-2 border-t border-border/50">
                The free tier handles single videos. If you need channel extraction or want to save your transcript history,
                there&apos;s a paid plan for that.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* ==================== PRICING ==================== */}
        <section className="px-4 py-20 md:py-24 md:px-8 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
              <span className="gradient-text">Simple pricing</span>
            </h2>
            <p className="text-muted-foreground text-center mb-12 text-lg">
              Start free. Upgrade when you need more.
            </p>

            <div className="grid md:grid-cols-3 gap-6 stagger-children">
              {/* Free Tier */}
              <PricingCard
                name="Free"
                description="Perfect for trying out"
                price="$0"
                features={[
                  '3 videos per day',
                  'TXT export format',
                  'Basic video extraction',
                ]}
              />

              {/* Pro Tier */}
              <PricingCard
                name="Pro"
                description="For creators & researchers"
                price="$9.99"
                priceNote="/mo"
                isPopular
                features={[
                  '50 videos per day',
                  'All formats (TXT, SRT, JSON)',
                  'Channel extraction (25 videos)',
                  'No watermarks',
                ]}
              />

              {/* Business Tier */}
              <PricingCard
                name="Business"
                description="For teams & power users"
                price="$29.99"
                priceNote="/mo"
                features={[
                  'Unlimited extractions',
                  'Channel extraction (500 videos)',
                  'API access',
                  'Priority support',
                ]}
              />
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA ==================== */}
        <section className="px-4 py-20 md:py-24 md:px-8 lg:px-12">
          <GlassCard className="max-w-xl mx-auto text-center p-10" glow glowColor="multi">
            <p className="text-xl md:text-2xl text-foreground mb-8 font-medium">
              Try it out—paste a YouTube link above.
            </p>
            <GradientButton
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="shadow-lg shadow-primary/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Back to top
            </GradientButton>
          </GlassCard>
        </section>
      </main>
    </>
  );
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <GlassCard hover glow className="p-6 group">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </GlassCard>
  );
}

// Pricing card component
function PricingCard({
  name,
  description,
  price,
  priceNote,
  features,
  isPopular = false,
}: {
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  features: string[];
  isPopular?: boolean;
}) {
  return (
    <GlassCard
      variant={isPopular ? 'strong' : 'default'}
      hover
      glow={isPopular}
      glowColor={isPopular ? 'multi' : 'primary'}
      className={cn(
        'relative p-6 transition-all duration-300',
        isPopular && 'scale-[1.02] z-10'
      )}
    >
      {/* Gradient border for popular */}
      {isPopular && (
        <>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 pointer-events-none" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <span className="gradient-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full shadow-lg shadow-primary/30">
              Most Popular
            </span>
          </div>
        </>
      )}

      <div className="relative">
        <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <div className="mb-6">
          <span className={cn(
            'text-4xl font-bold',
            isPopular ? 'gradient-text' : 'text-foreground'
          )}>
            {price}
          </span>
          {priceNote && (
            <span className="text-muted-foreground text-sm">{priceNote}</span>
          )}
        </div>

        <ul className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        <GradientButton
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
          onClick={() => window.location.href = '/pricing'}
        >
          {name === 'Free' ? 'Get Started' : `Upgrade to ${name}`}
        </GradientButton>
      </div>
    </GlassCard>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" variant="gradient" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
