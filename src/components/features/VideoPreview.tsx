'use client';

import Image from 'next/image';
import type { VideoInfo } from '@/lib/youtube/types';
import { formatDuration, formatWordCount } from '@/lib/utils/formatters';
import { getVideoUrl } from '@/lib/youtube/parser';
import styles from './Features.module.css';

interface VideoPreviewProps {
  videoInfo: VideoInfo;
  wordCount: number;
}

export function VideoPreview({ videoInfo, wordCount }: VideoPreviewProps) {
  return (
    <div className={styles.videoPreview}>
      <a
        href={getVideoUrl(videoInfo.videoId)}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.thumbnailLink}
      >
        <div className={styles.thumbnailWrapper}>
          <Image
            src={videoInfo.thumbnailUrl}
            alt={videoInfo.title}
            fill
            className={styles.thumbnail}
            unoptimized
          />
          {videoInfo.durationSeconds > 0 && (
            <span className={styles.duration}>
              {formatDuration(videoInfo.durationSeconds)}
            </span>
          )}
        </div>
      </a>

      <div className={styles.videoInfo}>
        <h2 className={styles.videoTitle}>
          <a
            href={getVideoUrl(videoInfo.videoId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {videoInfo.title}
          </a>
        </h2>
        <p className={styles.channelName}>{videoInfo.channelName}</p>
        <div className={styles.videoMeta}>
          <span>{formatWordCount(wordCount)}</span>
        </div>
      </div>
    </div>
  );
}
