'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { isValidYouTubeUrl } from '@/lib/youtube/parser';
import styles from './Features.module.css';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!isValidYouTubeUrl(trimmedUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    onSubmit(trimmedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.urlInputForm}>
      <div className={styles.urlInputWrapper}>
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          placeholder="Paste a YouTube URL (e.g., https://youtube.com/watch?v=...)"
          className={styles.urlInput}
          disabled={isLoading}
        />
        <Button type="submit" isLoading={isLoading} disabled={!url.trim()}>
          Extract
        </Button>
      </div>
      {error && <p className={styles.urlError}>{error}</p>}
    </form>
  );
}
