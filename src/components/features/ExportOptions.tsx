'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { TranscriptSegment } from '@/lib/youtube/types';
import { generateExportContent } from '@/lib/youtube/export';
import styles from './Features.module.css';

interface ExportOptionsProps {
  segments: TranscriptSegment[];
  plainText: string;
  srtContent: string;
  videoTitle: string;
}

type ExportFormat = 'txt' | 'srt' | 'json';

export function ExportOptions({
  segments,
  plainText,
  srtContent,
  videoTitle,
}: ExportOptionsProps) {
  const [copiedFormat, setCopiedFormat] = useState<ExportFormat | 'clipboard' | null>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopiedFormat('clipboard');
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  const downloadFile = (format: ExportFormat) => {
    const content = format === 'txt'
      ? plainText
      : format === 'srt'
        ? srtContent
        : generateExportContent(segments, format, videoTitle);

    const mimeTypes = {
      txt: 'text/plain',
      srt: 'text/plain',
      json: 'application/json',
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeTitle = videoTitle
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .slice(0, 50);

    link.href = url;
    link.download = `${safeTitle}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className={styles.exportOptions}>
      <Button variant="primary" onClick={copyToClipboard}>
        {copiedFormat === 'clipboard' ? 'Copied!' : 'Copy to Clipboard'}
      </Button>

      <div className={styles.exportDivider} />

      <span className={styles.exportLabel}>Download:</span>

      <Button variant="secondary" size="sm" onClick={() => downloadFile('txt')}>
        {copiedFormat === 'txt' ? 'Downloaded!' : '.TXT'}
      </Button>

      <Button variant="secondary" size="sm" onClick={() => downloadFile('srt')}>
        {copiedFormat === 'srt' ? 'Downloaded!' : '.SRT'}
      </Button>

      <Button variant="secondary" size="sm" onClick={() => downloadFile('json')}>
        {copiedFormat === 'json' ? 'Downloaded!' : '.JSON'}
      </Button>
    </div>
  );
}
