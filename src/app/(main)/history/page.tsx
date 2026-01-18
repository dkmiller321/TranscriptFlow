'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { HistoryList } from '@/components/features/HistoryList';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/lib/utils/constants';
import styles from './history.module.css';

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

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/history');
        const result = await response.json();

        if (result.success) {
          setHistory(result.data);
        } else {
          setError(result.error);
        }
      } catch {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  const handleReExtract = (videoId: string) => {
    router.push(`/?v=${videoId}`);
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
        <h1 className={styles.title}>Extraction History</h1>
        <p className={styles.subtitle}>
          View your recent transcript extractions
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <HistoryList items={history} onReExtract={handleReExtract} />
    </div>
  );
}
