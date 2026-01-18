'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime, formatWordCount } from '@/lib/utils/formatters';
import { getVideoUrl } from '@/lib/youtube/parser';
import styles from './Features.module.css';

interface HistoryItem {
  id: string;
  video_id: string;
  video_title: string;
  channel_name: string | null;
  thumbnail_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  word_count: number | null;
  created_at: string;
}

interface HistoryListProps {
  items: HistoryItem[];
  onReExtract?: (videoId: string) => void;
}

export function HistoryList({ items, onReExtract }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No extraction history</h3>
        <p className={styles.emptyDescription}>
          Your extracted transcripts will appear here.
        </p>
        <Link href="/" style={{ marginTop: 'var(--spacing-md)', display: 'inline-block' }}>
          <Button>Extract a Transcript</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.historyList}>
      {items.map((item) => (
        <div key={item.id} className={styles.historyItem}>
          <a
            href={getVideoUrl(item.video_id)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.historyThumbnail}
          >
            {item.thumbnail_url && (
              <Image
                src={item.thumbnail_url}
                alt={item.video_title}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            )}
          </a>

          <div className={styles.historyInfo}>
            <h3 className={styles.historyTitle}>{item.video_title}</h3>
            <div className={styles.historyMeta}>
              {item.channel_name && <span>{item.channel_name}</span>}
              {item.word_count && <span>{formatWordCount(item.word_count)}</span>}
              <span>{formatRelativeTime(item.created_at)}</span>
              <span
                style={{
                  color:
                    item.status === 'completed'
                      ? 'var(--color-success)'
                      : item.status === 'failed'
                        ? 'var(--color-error)'
                        : 'var(--color-warning)',
                }}
              >
                {item.status}
              </span>
            </div>
          </div>

          <div className={styles.historyActions}>
            {onReExtract && item.status === 'completed' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReExtract(item.video_id)}
              >
                Re-extract
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
