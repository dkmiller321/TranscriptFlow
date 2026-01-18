'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { isValidYouTubeUrl, isChannelUrl } from '@/lib/youtube/parser';
import { CHANNEL_LIMITS } from '@/lib/utils/constants';
import type { ChannelOutputFormat } from '@/lib/youtube/types';
import styles from './Features.module.css';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  onChannelSubmit?: (url: string, limit: number, format: ChannelOutputFormat) => void;
  isLoading?: boolean;
}

export function UrlInput({ onSubmit, onChannelSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isChannel, setIsChannel] = useState(false);
  const [videoLimit, setVideoLimit] = useState<number>(CHANNEL_LIMITS.DEFAULT_VIDEOS);
  const [outputFormat, setOutputFormat] = useState<ChannelOutputFormat>('combined');

  useEffect(() => {
    const trimmedUrl = url.trim();
    setIsChannel(trimmedUrl.length > 0 && isChannelUrl(trimmedUrl));
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (isChannel) {
      if (!isChannelUrl(trimmedUrl)) {
        setError('Please enter a valid YouTube channel URL');
        return;
      }
      if (onChannelSubmit) {
        onChannelSubmit(trimmedUrl, videoLimit, outputFormat);
      } else {
        setError('Channel extraction is not available');
      }
    } else {
      if (!isValidYouTubeUrl(trimmedUrl)) {
        setError('Please enter a valid YouTube URL');
        return;
      }
      onSubmit(trimmedUrl);
    }
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
          placeholder="Paste a YouTube video or channel URL"
          className={styles.urlInput}
          disabled={isLoading}
        />
        <Button type="submit" isLoading={isLoading} disabled={!url.trim()}>
          {isChannel ? 'Extract Channel' : 'Extract'}
        </Button>
      </div>

      {isChannel && (
        <div className={styles.channelOptions}>
          <div className={styles.channelOptionGroup}>
            <label className={styles.channelOptionLabel}>
              Videos to extract: {videoLimit}
            </label>
            <input
              type="range"
              min={CHANNEL_LIMITS.MIN_VIDEOS}
              max={CHANNEL_LIMITS.MAX_VIDEOS}
              step={10}
              value={videoLimit}
              onChange={(e) => setVideoLimit(Number(e.target.value))}
              className={styles.channelSlider}
              disabled={isLoading}
            />
            <div className={styles.channelSliderLabels}>
              <span>{CHANNEL_LIMITS.MIN_VIDEOS}</span>
              <span>{CHANNEL_LIMITS.MAX_VIDEOS}</span>
            </div>
          </div>

          <div className={styles.channelOptionGroup}>
            <label className={styles.channelOptionLabel}>Output format:</label>
            <div className={styles.channelFormatToggle}>
              <button
                type="button"
                className={`${styles.formatButton} ${outputFormat === 'combined' ? styles.active : ''}`}
                onClick={() => setOutputFormat('combined')}
                disabled={isLoading}
              >
                Combined File
              </button>
              <button
                type="button"
                className={`${styles.formatButton} ${outputFormat === 'individual' ? styles.active : ''}`}
                onClick={() => setOutputFormat('individual')}
                disabled={isLoading}
              >
                Individual Files (ZIP)
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className={styles.urlError}>{error}</p>}
    </form>
  );
}
