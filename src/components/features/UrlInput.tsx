'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      {/* Main input wrapper with enhanced glassmorphism */}
      <div
        className={cn(
          "relative flex flex-col sm:flex-row gap-2 sm:gap-3",
          "p-1.5 rounded-2xl",
          "bg-secondary/40 dark:bg-white/[0.03]",
          "border transition-all duration-300",
          isFocused
            ? "border-primary/40 shadow-[0_0_30px_-5px_hsl(152,60%,50%/0.25)] dark:shadow-[0_0_40px_-5px_hsl(152,60%,50%/0.3)]"
            : "border-border/50 dark:border-white/[0.06] shadow-lg dark:shadow-black/20",
          "backdrop-blur-sm"
        )}
      >
        {/* Animated glow ring on focus */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl pointer-events-none",
            "bg-gradient-to-r from-primary/10 via-transparent to-primary/10",
            "transition-opacity duration-500",
            isFocused ? "opacity-100" : "opacity-0"
          )}
        />

        <div className="relative flex-1 flex items-center">
          {/* URL icon */}
          <div className={cn(
            "absolute left-4 transition-colors duration-300",
            isFocused || url ? "text-primary" : "text-muted-foreground"
          )}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || "Paste a YouTube video or channel URL"}
            className={cn(
              "flex-1 h-12 pl-12 pr-4",
              "bg-transparent text-foreground",
              "placeholder:text-muted-foreground/60",
              "text-sm sm:text-base",
              "focus:outline-none",
              "transition-colors duration-200"
            )}
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          size="lg"
          className={cn(
            "h-12 px-6 rounded-xl font-semibold",
            "transition-all duration-300",
            "hover:scale-[1.02] active:scale-[0.98]",
            "w-full sm:w-auto shrink-0",
            "shadow-lg shadow-primary/20 hover:shadow-primary/30",
            !isLoading && url.trim() && "animate-pulse-soft"
          )}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="62.83"
                  strokeDashoffset="20"
                  className="animate-spin origin-center"
                  style={{ transformOrigin: 'center' }}
                />
              </svg>
              <span className="relative">
                Processing
                <span className="inline-flex ml-0.5">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              </span>
            </span>
          ) : isChannel ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Extract channel
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {ctaText || 'Get transcript'}
            </span>
          )}
        </Button>
      </div>

      {/* Channel options panel */}
      {isChannel && (
        <div
          className={cn(
            "mt-4 p-5 rounded-xl space-y-5",
            "bg-card/50 dark:bg-white/[0.02]",
            "border border-border/50 dark:border-white/[0.06]",
            "backdrop-blur-sm",
            "animate-in fade-in slide-in-from-top-2 duration-300"
          )}
        >
          {/* Video limit slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                Videos to extract
              </label>
              <span className="text-sm font-bold text-primary tabular-nums bg-primary/10 px-2 py-0.5 rounded-md">
                {videoLimit}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={CHANNEL_LIMITS.MIN_VIDEOS}
                max={CHANNEL_LIMITS.MAX_VIDEOS}
                step={10}
                value={videoLimit}
                onChange={(e) => setVideoLimit(Number(e.target.value))}
                className={cn(
                  "w-full h-2 rounded-full appearance-none cursor-pointer",
                  "bg-secondary dark:bg-white/10",
                  "[&::-webkit-slider-thumb]:appearance-none",
                  "[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
                  "[&::-webkit-slider-thumb]:rounded-full",
                  "[&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-primary [&::-webkit-slider-thumb]:to-primary/80",
                  "[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30",
                  "[&::-webkit-slider-thumb]:cursor-pointer",
                  "[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200",
                  "[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:shadow-primary/50",
                  "[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5",
                  "[&::-moz-range-thumb]:rounded-full",
                  "[&::-moz-range-thumb]:bg-primary",
                  "[&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
                )}
                disabled={isLoading}
              />
              {/* Progress fill */}
              <div
                className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-primary/60 to-primary pointer-events-none"
                style={{
                  width: `${((videoLimit - CHANNEL_LIMITS.MIN_VIDEOS) / (CHANNEL_LIMITS.MAX_VIDEOS - CHANNEL_LIMITS.MIN_VIDEOS)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{CHANNEL_LIMITS.MIN_VIDEOS}</span>
              <span>{CHANNEL_LIMITS.MAX_VIDEOS}</span>
            </div>
          </div>

          {/* Output format toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Output format
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/50 dark:bg-white/[0.03] rounded-lg border border-border/30 dark:border-white/[0.04]">
              <button
                type="button"
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  outputFormat === 'combined'
                    ? "text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 dark:hover:bg-white/[0.03]"
                )}
                onClick={() => setOutputFormat('combined')}
                disabled={isLoading}
              >
                {outputFormat === 'combined' && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 rounded-md" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Combined
                </span>
              </button>
              <button
                type="button"
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                  outputFormat === 'individual'
                    ? "text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 dark:hover:bg-white/[0.03]"
                )}
                onClick={() => setOutputFormat('individual')}
                disabled={isLoading}
              >
                {outputFormat === 'individual' && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 rounded-md" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  ZIP
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}
    </form>
  );
}
