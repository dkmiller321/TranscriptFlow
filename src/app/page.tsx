'use client';

import { Header } from '@/components/layout/Header';
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
import styles from './page.module.css';

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
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>TranscriptFlow</h1>
          <p className={styles.subtitle}>
            Extract YouTube transcripts instantly. Supports videos and entire channels.
          </p>
        </div>

        <div className={styles.inputSection}>
          <UrlInput
            onSubmit={handleVideoExtract}
            onChannelSubmit={handleChannelExtract}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {isVideoLoading && (
          <div className={styles.loadingState}>
            <Spinner size="lg" />
            <p>Extracting transcript...</p>
          </div>
        )}

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
          <div className={styles.results}>
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
