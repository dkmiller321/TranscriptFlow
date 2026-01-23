'use client';

import { useState, useCallback } from 'react';
import type { TranscriptSegment, VideoInfo } from '@/lib/youtube/types';

interface ExtractionState {
  isLoading: boolean;
  error: string | null;
  videoInfo: VideoInfo | null;
  segments: TranscriptSegment[];
  plainText: string;
  srtContent: string;
  wordCount: number;
  historyId: string | null;
}

const initialState: ExtractionState = {
  isLoading: false,
  error: null,
  videoInfo: null,
  segments: [],
  plainText: '',
  srtContent: '',
  wordCount: 0,
  historyId: null,
};

// Simplify IP blocking error messages for users
function simplifyErrorMessage(errorMessage: string): string {
  if (errorMessage.includes('blocking requests from your IP') ||
      errorMessage.includes('cloud provider')) {
    return 'YouTube is temporarily blocking transcript requests from our servers. Please try again in a few minutes, or try a different video.';
  }
  return errorMessage;
}

export function useExtraction() {
  const [state, setState] = useState<ExtractionState>(initialState);

  const extract = useCallback(async (url: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/extract/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed');
      }

      setState({
        isLoading: false,
        error: null,
        videoInfo: result.data.videoInfo,
        segments: result.data.segments,
        plainText: result.data.plainText,
        srtContent: result.data.srtContent,
        wordCount: result.data.wordCount,
        historyId: result.data.historyId,
      });

      return result.data;
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Extraction failed';
      const errorMessage = simplifyErrorMessage(rawMessage);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    extract,
    reset,
  };
}
