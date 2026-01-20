'use client';

import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BatchProgress, ChannelInfo } from '@/lib/youtube/types';

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

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const isActive = status === 'idle' || status === 'fetching_videos' || status === 'processing';

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
      <CardContent className="p-6 space-y-6">
        {/* Channel info header */}
        {channelInfo && (
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={channelInfo.thumbnailUrl}
                alt={channelInfo.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 shadow-lg"
              />
              {isActive && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {channelInfo.name}
              </h3>
              {channelInfo.handle && (
                <p className="text-sm text-muted-foreground">
                  @{channelInfo.handle}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalVideos > 0 ? `Extracting ${totalVideos} videos` : 'Loading...'}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant()} className="shrink-0">
              {status === 'processing' ? 'In Progress' : status.replace('_', ' ')}
            </Badge>
          </div>
        )}

        {/* Progress section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {getStatusText()}
            </span>
            <span className="text-sm font-bold text-primary tabular-nums">
              {percentage}%
            </span>
          </div>

          {/* Progress bar with glow effect */}
          <div className="relative">
            <Progress
              value={percentage}
              className="h-3 bg-secondary/50"
            />
            {isActive && percentage > 0 && (
              <div
                className="absolute top-0 left-0 h-3 bg-primary/30 blur-sm rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            )}
          </div>

          {/* Current video title */}
          {currentVideoTitle && status === 'processing' && (
            <p className="text-xs text-muted-foreground truncate px-1">
              Current: {currentVideoTitle}
            </p>
          )}

          {/* Stats badges */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-500">
                {successCount} successful
              </span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-sm font-medium text-destructive">
                  {failedCount} failed
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Cancel button */}
        {isActive && (
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
            >
              Cancel Extraction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
