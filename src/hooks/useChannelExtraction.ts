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
  isRetrying: boolean;
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
  isRetrying: false,
};

export function useChannelExtraction() {
  const [state, setState] = useState<ChannelExtractionState>(initialState);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 10; // Increased to handle serverless cold starts

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    retryCountRef.current = 0;
    setState((prev) => ({ ...prev, isRetrying: false }));
  }, []);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/extract/channel/${jobId}`);
      const result = await response.json();

      if (!result.success) {
        // If job not found, retry a few times before giving up
        // This handles serverless cold starts where different instances have separate memory
        if (result.error === 'Job not found' && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Job not found, retrying... (${retryCountRef.current}/${maxRetries})`);
          // Show retrying state to user instead of error
          setState((prev) => ({ ...prev, isRetrying: true }));
          return; // Don't throw, just wait for next poll
        }
        throw new Error(result.error || 'Failed to get job status');
      }

      // Reset retry count and retrying state on successful poll
      retryCountRef.current = 0;
      setState((prev) => ({ ...prev, isRetrying: false }));

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

        const { jobId, progress: jobProgress, channelInfo: jobChannelInfo, results: jobResults } = result.data;
        setState((prev) => ({
          ...prev,
          jobId,
          progress: jobProgress || prev.progress,
          channelInfo: jobChannelInfo || null,
          results: jobResults || [],
        }));

        // Start polling for job status after a brief delay
        // This gives the server time to fully initialize the job
        // Note: In serverless environments, different instances may have separate memory,
        // so we use longer delays and retries to handle this
        setTimeout(() => {
          // Initial poll
          pollJobStatus(jobId);

          // Continue polling every second
          pollingRef.current = setInterval(() => {
            pollJobStatus(jobId);
          }, 1000);
        }, 500);
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
