'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, FileText, FileJson, Captions, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime, formatWordCount } from '@/lib/utils/formatters';
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
  onViewTranscript?: (transcript: SavedTranscript) => void;
  onExport?: (id: string, format: 'txt' | 'srt' | 'json') => void;
  onCopy?: (content: string) => void;
}

export function SavedTranscripts({
  items,
  onToggleFavorite,
  onDelete,
  onViewTranscript,
  onExport,
  onCopy,
}: SavedTranscriptsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (item: SavedTranscript, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      onCopy?.(item.content);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

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
          {/* Thumbnail */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 'var(--spacing-sm)',
              cursor: onViewTranscript ? 'pointer' : 'default',
              backgroundColor: 'var(--color-bg-tertiary)',
            }}
            onClick={() => onViewTranscript?.(item)}
          >
            <Image
              src={`https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`}
              alt={item.video_title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          </div>

          <div
            className={styles.savedHeader}
            style={{ cursor: onViewTranscript ? 'pointer' : 'default' }}
            onClick={() => onViewTranscript?.(item)}
          >
            <h3 className={styles.savedTitle} title={item.video_title}>
              {item.video_title}
            </h3>
            {onToggleFavorite && (
              <button
                className={`${styles.favoriteButton} ${item.is_favorite ? styles.active : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id, !item.is_favorite);
                }}
                aria-label={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {item.is_favorite ? '\u2605' : '\u2606'}
              </button>
            )}
          </div>

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

          <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`https://www.youtube.com/watch?v=${item.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-error)',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              YouTube
            </a>

            <span style={{ color: 'var(--color-border)', fontSize: 'var(--text-xs)' }}>|</span>

            {/* Copy button */}
            <button
              onClick={(e) => handleCopy(item, e)}
              title="Copy transcript"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                fontSize: 'var(--text-xs)',
                color: copiedId === item.id ? 'var(--color-success)' : 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              {copiedId === item.id ? (
                <>
                  <Check size={12} style={{ marginRight: '2px' }} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} style={{ marginRight: '2px' }} />
                  Copy
                </>
              )}
            </button>

            {onExport && (
              <>
                <span style={{ color: 'var(--color-border)', fontSize: 'var(--text-xs)' }}>|</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(item.id, 'txt');
                    }}
                    title="Export as TXT"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <FileText size={12} style={{ marginRight: '2px' }} />
                    TXT
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(item.id, 'srt');
                    }}
                    title="Export as SRT"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <Captions size={12} style={{ marginRight: '2px' }} />
                    SRT
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExport(item.id, 'json');
                    }}
                    title="Export as JSON"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-secondary)',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
                  >
                    <FileJson size={12} style={{ marginRight: '2px' }} />
                    JSON
                  </button>
                </div>
              </>
            )}

            {onDelete && (
              <>
                <span style={{ color: 'var(--color-border)', fontSize: 'var(--text-xs)' }}>|</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  style={{ padding: '2px 6px', fontSize: 'var(--text-xs)' }}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
