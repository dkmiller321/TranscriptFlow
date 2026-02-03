'use client';

import { cn } from '@/lib/utils';

export function TranscriptSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Video Info Skeleton */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Thumbnail placeholder */}
            <div className="relative shrink-0">
              <div className="w-full sm:w-48 aspect-video rounded-lg bg-secondary/50 animate-pulse overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Info placeholder */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="space-y-3">
                {/* Title lines */}
                <div className="h-6 bg-secondary/50 rounded-lg animate-pulse w-full" />
                <div className="h-6 bg-secondary/50 rounded-lg animate-pulse w-3/4" />
                {/* Channel */}
                <div className="h-4 bg-secondary/40 rounded-lg animate-pulse w-1/3 mt-4" />
              </div>
              {/* Badges */}
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-24 bg-secondary/40 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-secondary/40 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options Skeleton */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg p-6">
        <div className="space-y-4">
          <div className="h-5 bg-secondary/50 rounded-lg animate-pulse w-40" />
          <div className="h-4 bg-secondary/40 rounded-lg animate-pulse w-64" />
          <div className="h-10 bg-secondary/40 rounded-lg animate-pulse w-full mt-4" />
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-secondary/40 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Transcript Skeleton */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-secondary/50 rounded-lg animate-pulse w-28" />
            <div className="h-9 bg-secondary/40 rounded-lg animate-pulse w-48" />
          </div>
          <div className="h-10 bg-secondary/30 rounded-lg animate-pulse w-full" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="rounded-lg bg-secondary/20 border border-border/30 p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-4 bg-secondary/40 rounded animate-pulse",
                  i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-4/5"
                )}
                style={{ animationDelay: `${i * 75}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
