'use client';

import { Button } from '@/components/ui/Button';
import type { BatchProgress, ChannelInfo } from '@/lib/youtube/types';
import styles from './Features.module.css';

interface ChannelProgressProps {
  progress: BatchProgress;
  channelInfo: ChannelInfo | null;
  onCancel: () => void;
}

export function ChannelProgress({ progress, channelInfo, onCancel }: ChannelProgressProps) {
  const { status, currentVideoIndex, totalVideos, currentVideoTitle, successCount, failedCount } =
    progress;

  const percentage =
    totalVideos > 0 ? Math.round((currentVideoIndex / totalVideos) * 100) : 0;

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Starting...';
      case 'fetching_videos':
        return 'Fetching video list from channel...';
      case 'processing':
        return `Processing video ${currentVideoIndex + 1} of ${totalVideos}`;
      case 'completed':
        return 'Extraction complete!';
      case 'cancelled':
        return 'Extraction cancelled';
      case 'error':
        return 'Extraction failed';
      default:
        return 'Processing...';
    }
  };

  const isActive = status === 'idle' || status === 'fetching_videos' || status === 'processing';

  return (
    <div className={styles.channelProgress}>
      {channelInfo && (
        <div className={styles.channelInfoHeader}>
          <img
            src={channelInfo.thumbnailUrl}
            alt={channelInfo.name}
            className={styles.channelThumbnail}
          />
          <div className={styles.channelDetails}>
            <h3 className={styles.channelName}>{channelInfo.name}</h3>
            {channelInfo.handle && (
              <p className={styles.channelHandle}>@{channelInfo.handle}</p>
            )}
            <p className={styles.channelVideoCount}>
              {totalVideos > 0 ? `Extracting ${totalVideos} videos` : 'Loading...'}
            </p>
          </div>
        </div>
      )}

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressStatus}>{getStatusText()}</span>
          <span className={styles.progressPercentage}>{percentage}%</span>
        </div>

        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {currentVideoTitle && status === 'processing' && (
          <p className={styles.currentVideo}>
            Current: {currentVideoTitle}
          </p>
        )}

        <div className={styles.progressStats}>
          <span className={styles.progressSuccess}>
            {successCount} successful
          </span>
          <span className={styles.progressFailed}>
            {failedCount} failed
          </span>
        </div>
      </div>

      {isActive && (
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
