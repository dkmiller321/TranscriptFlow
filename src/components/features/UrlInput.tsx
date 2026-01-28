'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { isValidYouTubeUrl, isChannelUrl } from '@/lib/youtube/parser';
import { CHANNEL_LIMITS } from '@/lib/utils/constants';
import type { ChannelOutputFormat } from '@/lib/youtube/types';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  onChannelSubmit?: (url: string, limit: number, format: ChannelOutputFormat) => void;
  isLoading?: boolean;
  ctaText?: string;
  placeholder?: string;
}

export function UrlInput({ onSubmit, onChannelSubmit, isLoading, ctaText, placeholder }: UrlInputProps) {
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
    <form onSubmit={handleSubmit} className="w-full">
      {/* Main input wrapper with glassmorphism effect */}
      <div className="relative flex gap-3 p-1.5 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-primary/5 focus-within:shadow-xl">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            setUrl(target.value);
            setError('');
          }}
          placeholder={placeholder || "Paste a YouTube video or channel URL"}
          className="flex-1 h-12 px-4 bg-transparent text-foreground placeholder:text-muted-foreground text-base focus:outline-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          size="lg"
          className="h-12 px-6 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing
            </span>
          ) : isChannel ? (
            'Extract channel'
          ) : (
            ctaText || 'Extract transcript'
          )}
        </Button>
      </div>

      {/* Channel options panel */}
      {isChannel && (
        <div className="mt-4 p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Video limit slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Videos to extract
              </label>
              <span className="text-sm font-semibold text-primary tabular-nums">
                {videoLimit}
              </span>
            </div>
            <input
              type="range"
              min={CHANNEL_LIMITS.MIN_VIDEOS}
              max={CHANNEL_LIMITS.MAX_VIDEOS}
              step={10}
              value={videoLimit}
              onChange={(e) => setVideoLimit(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{CHANNEL_LIMITS.MIN_VIDEOS}</span>
              <span>{CHANNEL_LIMITS.MAX_VIDEOS}</span>
            </div>
          </div>

          {/* Output format toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Output format
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 rounded-lg">
              <button
                type="button"
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  outputFormat === 'combined'
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => setOutputFormat('combined')}
                disabled={isLoading}
              >
                Combined File
              </button>
              <button
                type="button"
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  outputFormat === 'individual'
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => setOutputFormat('individual')}
                disabled={isLoading}
              >
                Individual Files (ZIP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm text-destructive text-center animate-in fade-in duration-200">
          {error}
        </p>
      )}
    </form>
  );
}
