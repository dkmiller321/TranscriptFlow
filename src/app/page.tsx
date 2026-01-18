'use client';

import { Header } from '@/components/layout/Header';
import { UrlInput } from '@/components/features/UrlInput';
import { VideoPreview } from '@/components/features/VideoPreview';
import { TranscriptViewer } from '@/components/features/TranscriptViewer';
import { ExportOptions } from '@/components/features/ExportOptions';
import { useExtraction } from '@/hooks/useExtraction';
import { Spinner } from '@/components/ui/Spinner';
import styles from './page.module.css';

export default function Home() {
  const {
    isLoading,
    error,
    videoInfo,
    segments,
    plainText,
    srtContent,
    wordCount,
    extract,
  } = useExtraction();

  const handleExtract = async (url: string) => {
    try {
      await extract(url);
    } catch {
      // Error is handled in the hook
    }
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>TranscriptFlow</h1>
          <p className={styles.subtitle}>
            Extract YouTube transcripts instantly. Copy, export, or save for later.
          </p>
        </div>

        <div className={styles.inputSection}>
          <UrlInput onSubmit={handleExtract} isLoading={isLoading} />
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className={styles.loadingState}>
            <Spinner size="lg" />
            <p>Extracting transcript...</p>
          </div>
        )}

        {videoInfo && !isLoading && (
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
