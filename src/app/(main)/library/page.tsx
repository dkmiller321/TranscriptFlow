'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { SavedTranscripts } from '@/components/features/SavedTranscripts';
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
      }
    } catch {
      // Silent failure
    }
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

      {error && <p className={styles.error}>{error}</p>}

      <SavedTranscripts
        items={transcripts}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />
    </div>
  );
}
