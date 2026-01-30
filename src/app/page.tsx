'use client';

import { Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { UrlInput } from '@/components/features/UrlInput';
import { VideoPreview } from '@/components/features/VideoPreview';
import { TranscriptViewer } from '@/components/features/TranscriptViewer';
import { ExportOptions } from '@/components/features/ExportOptions';
import { ChannelProgress } from '@/components/features/ChannelProgress';
import { ChannelResults } from '@/components/features/ChannelResults';
import { useExtraction } from '@/hooks/useExtraction';
import { useChannelExtraction } from '@/hooks/useChannelExtraction';
import { Spinner } from '@/components/ui/Spinner';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
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
    extract: extractChannel,
    cancel: cancelChannel,
    reset: resetChannel,
  } = useChannelExtraction();

  const isLoading = isVideoLoading || isChannelLoading;
  const error = videoError || channelError;

  // Handle re-extract from history page (via ?v= query param)
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
      // Error is handled in the hook
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
        <section className="px-4 py-16 md:py-24 md:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-6">
              <span className="gradient-text">Get the transcript</span>
              <br />
              <span className="text-foreground">from any YouTube video</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Paste a link, get clean text with timestamps. Works with single videos or entire channels. Export as TXT, JSON, or SRT.
            </p>

            <GlassCard className="max-w-2xl mx-auto mb-4 p-6" glow>
              <UrlInput
                onSubmit={handleVideoExtract}
                onChannelSubmit={handleChannelExtract}
                isLoading={isLoading}
                ctaText="Get transcript"
                placeholder="Paste a YouTube URL here..."
              />
            </GlassCard>

            <p className="text-sm text-muted-foreground">
              Free for single videos. No account needed.
            </p>

            {error && (
              <GlassCard className="mt-6 p-4 max-w-2xl mx-auto border-destructive/30">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </GlassCard>
            )}

            {isVideoLoading && (
              <div className="flex flex-col items-center gap-4 py-12">
                <Spinner size="lg" />
                <p className="text-muted-foreground text-sm">Pulling transcript...</p>
              </div>
            )}
          </div>
        </section>

        {/* Results */}
        {hasResults && (
          <section ref={resultsRef} className="px-4 py-8 md:px-8 lg:px-12 border-t border-border">
            <div className="max-w-4xl mx-auto">
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
        <section className="px-4 py-16 md:py-20 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-10">
              <span className="gradient-text">Built for people</span>
              <span className="text-foreground"> who work with video content</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-6 stagger-children">
              <GlassCard hover glow className="p-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Building with AI</h3>
                <p className="text-muted-foreground text-sm">
                  Need to feed YouTube content into GPT or Claude? Get structured transcripts you can paste directly into any prompt.
                </p>
              </GlassCard>

              <GlassCard hover glow className="p-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Repurposing content</h3>
                <p className="text-muted-foreground text-sm">
                  Turn videos into blog posts, tweet threads, or newsletters. The transcript is the hard part—we handle that.
                </p>
              </GlassCard>

              <GlassCard hover glow className="p-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Research</h3>
                <p className="text-muted-foreground text-sm">
                  Pull transcripts from lectures, interviews, or conference talks. Search and cite without rewatching hours of video.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ==================== WHY THIS TOOL ==================== */}
        <section className="px-4 py-16 md:py-20 md:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-10">
              <span className="text-foreground">Why not just use a</span>{' '}
              <span className="gradient-text">free transcript grabber?</span>
            </h2>

            <GlassCard className="p-8 space-y-6">
              <p className="text-foreground">
                Most free tools give you a wall of text with no timestamps, weird formatting, and no way to export properly.
                Fine if you just need to skim something. Not fine if you&apos;re actually trying to use the content.
              </p>

              <p className="text-foreground">
                TranscriptFlow gives you <strong className="gradient-text">structured data</strong>—timestamps, proper formatting, and exports
                that work (TXT, JSON, SRT). You can also pull transcripts from <strong className="gradient-text">entire channels</strong> at once,
                not just one video at a time.
              </p>

              <p className="text-muted-foreground text-sm">
                The free tier handles single videos. If you need channel extraction or want to save your transcript history,
                there&apos;s a paid plan for that.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* ==================== PRICING ==================== */}
        <section className="px-4 py-16 md:py-20 md:px-8 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">
              <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-muted-foreground text-center mb-10">
              Start free. Upgrade if you need more.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Free Tier */}
              <GlassCard hover className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">Free</h3>
                <p className="text-sm text-muted-foreground mb-2">Perfect for trying out</p>
                <p className="text-3xl font-bold text-foreground mb-6">$0</p>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">3 videos per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">TXT export format</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">Basic video extraction</span>
                  </li>
                </ul>
              </GlassCard>

              {/* Pro Tier */}
              <GlassCard variant="strong" glow className="p-6 relative gradient-border">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-primary text-white text-xs font-medium px-3 py-1 rounded-full">Most Popular</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Pro</h3>
                <p className="text-sm text-muted-foreground mb-2">For creators & researchers</p>
                <p className="text-3xl font-bold gradient-text mb-6">$9.99<span className="text-sm text-muted-foreground font-normal">/mo</span></p>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">50 videos per day</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">All formats (TXT, SRT, JSON)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">Channel extraction (25 videos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">No watermarks</span>
                  </li>
                </ul>
              </GlassCard>

              {/* Business Tier */}
              <GlassCard hover className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">Business</h3>
                <p className="text-sm text-muted-foreground mb-2">For teams & power users</p>
                <p className="text-3xl font-bold text-foreground mb-6">$29.99<span className="text-sm text-muted-foreground font-normal">/mo</span></p>

                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">Unlimited extractions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">Channel extraction (500 videos)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-forest-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground">Priority support</span>
                  </li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA ==================== */}
        <section className="px-4 py-16 md:py-20 md:px-8 lg:px-12">
          <GlassCard className="max-w-xl mx-auto text-center p-10" glow>
            <p className="text-xl md:text-2xl text-foreground mb-8">
              Try it out—paste a YouTube link above.
            </p>
            <GradientButton
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top
            </GradientButton>
          </GlassCard>
        </section>
      </main>
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-500" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
