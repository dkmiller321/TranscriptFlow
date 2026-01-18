'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { Button } from '@/components/ui/Button';
import type { ChannelInfo, VideoTranscriptResult, ChannelVideoItem, ChannelOutputFormat } from '@/lib/youtube/types';
import { generateCombinedTranscript, generateIndividualTranscripts } from '@/lib/youtube/export';
import styles from './Features.module.css';

interface ChannelResultsProps {
  channelInfo: ChannelInfo;
  results: Array<{
    video: ChannelVideoItem;
    transcript: VideoTranscriptResult | null;
  }>;
  outputFormat: ChannelOutputFormat;
  onReset: () => void;
}

type ExportFormat = 'txt' | 'srt' | 'json';

export function ChannelResults({
  channelInfo,
  results,
  outputFormat,
  onReset,
}: ChannelResultsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const successfulResults = results.filter((r) => r.transcript?.status === 'success');
  const failedResults = results.filter((r) => r.transcript?.status !== 'success');

  const totalWordCount = successfulResults.reduce(
    (sum, r) => sum + (r.transcript?.wordCount || 0),
    0
  );

  const handleDownload = async (format: ExportFormat) => {
    setIsExporting(true);

    try {
      if (outputFormat === 'combined') {
        const content = generateCombinedTranscript(results, format, channelInfo.name);
        const filename = `${sanitizeFilename(channelInfo.name)}_transcripts.${format}`;
        downloadFile(content, filename, getMimeType(format));
      } else {
        const files = generateIndividualTranscripts(results, format);
        const zip = new JSZip();

        for (const file of files) {
          zip.file(file.filename, file.content);
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const filename = `${sanitizeFilename(channelInfo.name)}_transcripts.zip`;
        downloadBlob(blob, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.channelResults}>
      <div className={styles.channelResultsHeader}>
        <img
          src={channelInfo.thumbnailUrl}
          alt={channelInfo.name}
          className={styles.channelThumbnail}
        />
        <div className={styles.channelResultsInfo}>
          <h2 className={styles.channelResultsTitle}>{channelInfo.name}</h2>
          <div className={styles.channelResultsStats}>
            <span className={styles.statItem}>
              {successfulResults.length} videos extracted
            </span>
            <span className={styles.statItem}>
              {totalWordCount.toLocaleString()} words total
            </span>
            {failedResults.length > 0 && (
              <span className={styles.statItemFailed}>
                {failedResults.length} failed
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={onReset}>
          New Extraction
        </Button>
      </div>

      <div className={styles.channelExportSection}>
        <h3 className={styles.exportSectionTitle}>Download Transcripts</h3>
        <p className={styles.exportSectionDesc}>
          {outputFormat === 'combined'
            ? 'All transcripts combined into a single file'
            : 'Individual transcript files in a ZIP archive'}
        </p>
        <div className={styles.exportButtons}>
          <Button
            variant="secondary"
            onClick={() => handleDownload('txt')}
            disabled={isExporting || successfulResults.length === 0}
          >
            {outputFormat === 'individual' ? 'Download TXT (ZIP)' : 'Download TXT'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleDownload('srt')}
            disabled={isExporting || successfulResults.length === 0}
          >
            {outputFormat === 'individual' ? 'Download SRT (ZIP)' : 'Download SRT'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleDownload('json')}
            disabled={isExporting || successfulResults.length === 0}
          >
            {outputFormat === 'individual' ? 'Download JSON (ZIP)' : 'Download JSON'}
          </Button>
        </div>
      </div>

      <div className={styles.channelVideoList}>
        <h3 className={styles.videoListTitle}>
          Processed Videos ({results.length})
        </h3>
        <div className={styles.videoListContainer}>
          {results.map(({ video, transcript }) => (
            <div key={video.videoId} className={styles.videoListItem}>
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className={styles.videoListThumbnail}
              />
              <div className={styles.videoListInfo}>
                <p className={styles.videoListTitle}>{video.title}</p>
                <div className={styles.videoListMeta}>
                  {transcript?.status === 'success' ? (
                    <span className={styles.videoListSuccess}>
                      {transcript.wordCount.toLocaleString()} words
                    </span>
                  ) : (
                    <span className={styles.videoListError}>
                      {transcript?.error || 'Failed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'txt':
      return 'text/plain';
    case 'srt':
      return 'text/srt';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
