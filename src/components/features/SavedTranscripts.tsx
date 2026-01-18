'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime, formatWordCount, truncate } from '@/lib/utils/formatters';
import styles from './Features.module.css';

interface SavedTranscript {
  id: string;
  video_id: string;
  video_title: string;
  content: string;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface SavedTranscriptsProps {
  items: SavedTranscript[];
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onDelete?: (id: string) => void;
}

export function SavedTranscripts({ items, onToggleFavorite, onDelete }: SavedTranscriptsProps) {
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No saved transcripts</h3>
        <p className={styles.emptyDescription}>
          Save transcripts to your library for quick access.
        </p>
        <Link href="/" style={{ marginTop: 'var(--spacing-md)', display: 'inline-block' }}>
          <Button>Extract a Transcript</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.savedTranscripts}>
      {items.map((item) => (
        <div key={item.id} className={styles.savedCard}>
          <div className={styles.savedHeader}>
            <h3 className={styles.savedTitle} title={item.video_title}>
              {item.video_title}
            </h3>
            {onToggleFavorite && (
              <button
                className={`${styles.favoriteButton} ${item.is_favorite ? styles.active : ''}`}
                onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
                aria-label={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {item.is_favorite ? '\u2605' : '\u2606'}
              </button>
            )}
          </div>

          <p className={styles.savedPreview}>
            {truncate(item.content, 150)}
          </p>

          <div className={styles.savedMeta}>
            <span>{formatWordCount(item.content.split(/\s+/).length)}</span>
            <span>{formatRelativeTime(item.created_at)}</span>
          </div>

          {item.tags.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 'var(--text-xs)',
                    padding: '2px 6px',
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {onDelete && (
            <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
