'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  BatchProgress,
  ChannelInfo,
  ChannelVideoItem,
  VideoTranscriptResult,
  ChannelOutputFormat,
} from '@/lib/youtube/types';

interface ChannelExtractionState {
  isLoading: boolean;
  error: string | null;
  jobId: string | null;
  channelInfo: ChannelInfo | null;
  progress: BatchProgress;
  results: Array<{
    video: ChannelVideoItem;
    transcript: VideoTranscriptResult | null;
  }>;
  outputFormat: ChannelOutputFormat;
}

const initialProgress: BatchProgress = {
  status: 'idle',
  currentVideoIndex: 0,
  totalVideos: 0,
  successCount: 0,
  failedCount: 0,
};

const initialState: ChannelExtractionState = {
  isLoading: false,
  error: null,
  jobId: null,
  channelInfo: null,
  progress: initialProgress,
  results: [],
  outputFormat: 'combined',
};

export function useChannelExtraction() {
  const [state, setState] = useState<ChannelExtractionState>(initialState);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/extract/channel/${jobId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get job status');
      }

      const { data } = result;

      setState((prev) => ({
        ...prev,
        channelInfo: data.channelInfo || prev.channelInfo,
        progress: data.progress,
        results: data.results || prev.results,
      }));

      // Stop polling if job is complete
      if (
        data.status === 'completed' ||
        data.status === 'cancelled' ||
        data.status === 'error'
      ) {
        stopPolling();
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.progress?.error || null,
        }));
      }
    } catch (error) {
      stopPolling();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get job status',
      }));
    }
  }, [stopPolling]);

  const extract = useCallback(
    async (url: string, limit: number, format: ChannelOutputFormat) => {
      stopPolling();
      setState({
        ...initialState,
        isLoading: true,
        outputFormat: format,
      });

      try {
        const response = await fetch('/api/extract/channel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, limit, format }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to start channel extraction');
        }

        const { jobId } = result.data;
        setState((prev) => ({ ...prev, jobId }));

        // Start polling for job status
        pollingRef.current = setInterval(() => {
          pollJobStatus(jobId);
        }, 1000);

        // Initial poll
        pollJobStatus(jobId);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to extract channel',
        }));
      }
    },
    [pollJobStatus, stopPolling]
  );

  const cancel = useCallback(async () => {
    if (!state.jobId) return;

    try {
      await fetch(`/api/extract/channel/${state.jobId}?action=cancel`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  }, [state.jobId]);

  const reset = useCallback(() => {
    stopPolling();
    setState(initialState);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    extract,
    cancel,
    reset,
  };
}
