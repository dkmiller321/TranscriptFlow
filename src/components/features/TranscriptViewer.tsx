'use client';

import { useState, useMemo } from 'react';
import type { TranscriptSegment } from '@/lib/youtube/types';
import { formatDuration } from '@/lib/utils/formatters';
import styles from './Features.module.css';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  plainText: string;
}

type ViewMode = 'plain' | 'timestamped';

export function TranscriptViewer({ segments, plainText }: TranscriptViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('plain');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const query = searchQuery.toLowerCase();
    return segments.filter((segment) =>
      segment.text.toLowerCase().includes(query)
    );
  }, [segments, searchQuery]);

  const highlightedPlainText = useMemo(() => {
    if (!searchQuery.trim()) return plainText;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return plainText.replace(regex, '<mark>$1</mark>');
  }, [plainText, searchQuery]);

  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (plainText.match(regex) || []).length;
  }, [plainText, searchQuery]);

  return (
    <div className={styles.transcriptViewer}>
      <div className={styles.transcriptHeader}>
        <div className={styles.viewModeToggle}>
          <button
            className={`${styles.viewModeButton} ${viewMode === 'plain' ? styles.active : ''}`}
            onClick={() => setViewMode('plain')}
          >
            Plain Text
          </button>
          <button
            className={`${styles.viewModeButton} ${viewMode === 'timestamped' ? styles.active : ''}`}
            onClick={() => setViewMode('timestamped')}
          >
            Timestamped
          </button>
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className={styles.searchInput}
          />
          {searchQuery && (
            <span className={styles.matchCount}>
              {matchCount} match{matchCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>

      <div className={styles.transcriptContent}>
        {viewMode === 'plain' ? (
          <div
            className={styles.plainTextContent}
            dangerouslySetInnerHTML={{ __html: highlightedPlainText }}
          />
        ) : (
          <div className={styles.timestampedContent}>
            {filteredSegments.map((segment, index) => (
              <div key={index} className={styles.transcriptSegment}>
                <span className={styles.timestamp}>
                  {formatDuration(Math.floor(segment.offset / 1000))}
                </span>
                <span className={styles.segmentText}>{segment.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
