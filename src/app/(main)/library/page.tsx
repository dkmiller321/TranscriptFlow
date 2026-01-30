'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SavedTranscripts } from '@/components/features/SavedTranscripts';
import { TranscriptDetailModal } from '@/components/features/TranscriptDetailModal';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/utils/constants';
import styles from './library.module.css';

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

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transcripts, setTranscripts] = useState<SavedTranscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<SavedTranscript | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Collect all unique tags from transcripts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    transcripts.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [transcripts]);

  // Filter transcripts by selected tags
  const filteredTranscripts = useMemo(() => {
    if (selectedTags.length === 0) return transcripts;
    return transcripts.filter((t) =>
      selectedTags.every((tag) => t.tags?.includes(tag))
    );
  }, [transcripts, selectedTags]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchTranscripts = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const params = filter === 'favorites' ? '?favorites=true' : '';
        const response = await fetch(`/api/transcripts${params}`);
        const result = await response.json();

        if (result.success) {
          setTranscripts(result.data);
        } else {
          setError(result.error);
        }
      } catch {
        setError('Failed to load transcripts');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTranscripts();
    }
  }, [user, filter]);

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const response = await fetch('/api/transcripts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFavorite }),
      });

      const result = await response.json();

      if (result.success) {
        setTranscripts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_favorite: isFavorite } : t))
        );
      }
    } catch {
      // Silent failure
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transcript?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transcripts?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setTranscripts((prev) => prev.filter((t) => t.id !== id));
        if (selectedTranscript?.id === id) {
          setModalOpen(false);
          setSelectedTranscript(null);
        }
      }
    } catch {
      // Silent failure
    }
  };

  const handleViewTranscript = (transcript: SavedTranscript) => {
    setSelectedTranscript(transcript);
    setModalOpen(true);
  };

  const handleExport = async (id: string, format: 'txt' | 'srt' | 'json') => {
    try {
      const response = await fetch(`/api/export?id=${id}&format=${format}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `transcript.${format}`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error('Export failed');
    }
  };

  const handleTagsUpdate = async (id: string, tags: string[]) => {
    try {
      const response = await fetch('/api/transcripts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tags }),
      });

      const result = await response.json();

      if (result.success) {
        setTranscripts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, tags } : t))
        );
        if (selectedTranscript?.id === id) {
          setSelectedTranscript({ ...selectedTranscript, tags });
        }
      }
    } catch {
      // Silent failure
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Library</h1>
          <p className={styles.subtitle}>
            Your saved transcripts for quick access
          </p>
        </div>

        <div className={styles.filters}>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'favorites' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('favorites')}
          >
            Favorites
          </Button>
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className={styles.tagFilters}>
          <span className={styles.tagFiltersLabel}>Filter by tag:</span>
          <div className={styles.tagFiltersList}>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`${styles.tagFilterButton} ${
                  selectedTags.includes(tag) ? styles.tagFilterActive : ''
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={clearTagFilters}
                className={styles.clearTagFilters}
                title="Clear all tag filters"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <SavedTranscripts
        items={filteredTranscripts}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        onViewTranscript={handleViewTranscript}
        onExport={handleExport}
      />

      <TranscriptDetailModal
        transcript={selectedTranscript}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onExport={handleExport}
        onTagsUpdate={handleTagsUpdate}
      />
    </div>
  );
}
