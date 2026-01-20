'use client';

import { Header } from '@/components/layout/Header';
import { Logo } from '@/components/ui/Logo';
import { UrlInput } from '@/components/features/UrlInput';
import { VideoPreview } from '@/components/features/VideoPreview';
import { TranscriptViewer } from '@/components/features/TranscriptViewer';
import { ExportOptions } from '@/components/features/ExportOptions';
import { ChannelProgress } from '@/components/features/ChannelProgress';
import { ChannelResults } from '@/components/features/ChannelResults';
import { useExtraction } from '@/hooks/useExtraction';
import { useChannelExtraction } from '@/hooks/useChannelExtraction';
import { Spinner } from '@/components/ui/Spinner';
import type { ChannelOutputFormat } from '@/lib/youtube/types';

export default function Home() {
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

  const handleVideoExtract = async (url: string) => {
    resetChannel();
    try {
      await extractVideo(url);
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
  };

  const handleReset = () => {
    resetVideo();
    resetChannel();
  };

  const isChannelMode = isChannelLoading || (channelInfo && results.length > 0);
  const showChannelProgress = isChannelLoading && progress.status !== 'idle';
  const showChannelResults =
    !isChannelLoading && channelInfo && results.length > 0 && progress.status === 'completed';

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px)] flex flex-col items-center px-4 py-12 md:px-8 lg:px-12 max-w-6xl mx-auto relative">
        {/* Background gradient effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Hero section */}
        <div className="text-center max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-center mb-6">
            <Logo size="xl" />
          </div>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Extract YouTube transcripts instantly. Supports videos and entire channels.
          </p>
        </div>

        {/* Input section */}
        <div className="w-full max-w-2xl mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <UrlInput
            onSubmit={handleVideoExtract}
            onChannelSubmit={handleChannelExtract}
            isLoading={isLoading}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-2xl mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-destructive text-sm text-center font-medium">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isVideoLoading && (
          <div className="flex flex-col items-center gap-4 py-12 animate-in fade-in duration-300">
            <Spinner size="lg" />
            <p className="text-muted-foreground text-sm">Extracting transcript...</p>
          </div>
        )}

        {/* Channel progress */}
        {showChannelProgress && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChannelProgress
              progress={progress}
              channelInfo={channelInfo}
              onCancel={cancelChannel}
            />
          </div>
        )}

        {/* Channel results */}
        {showChannelResults && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChannelResults
              channelInfo={channelInfo!}
              results={results}
              outputFormat={outputFormat}
              onReset={handleReset}
            />
          </div>
        )}

        {/* Video results */}
        {videoInfo && !isVideoLoading && !isChannelMode && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VideoPreview videoInfo={videoInfo} wordCount={wordCount} />

            <ExportOptions
              segments={segments}
              plainText={plainText}
              srtContent={srtContent}
              videoTitle={videoInfo.title}
            />

            <TranscriptViewer segments={segments} plainText={plainText} />
          </div>
        )}
      </main>
    </>
  );
}
