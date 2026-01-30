"use client";

import GlassCard from "@/components/ui/GlassCard";
import { Progress } from "@/components/ui/progress";
import { X, Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  currentItem?: string;
  successCount?: number;
  failedCount?: number;
  onCancel?: () => void;
  status?: 'processing' | 'completed' | 'cancelled' | 'error';
}

const ProgressCard = ({
  title,
  current,
  total,
  currentItem,
  successCount = 0,
  failedCount = 0,
  onCancel,
  status = 'processing'
}: ProgressCardProps) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const isActive = status === 'processing';

  return (
    <GlassCard className={cn(
      "p-6 transition-all duration-300",
      isActive && "glow-multi"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {currentItem && isActive && (
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-xs">
              Processing: {currentItem}
            </p>
          )}
        </div>

        {isActive && onCancel && (
          <button
            onClick={onCancel}
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar with glow effect */}
      <div className="relative">
        <Progress
          value={percentage}
          className={cn(
            "h-3 bg-secondary/50",
            isActive && "[&>div]:bg-gradient-to-r [&>div]:from-sage-500 [&>div]:via-forest-500 [&>div]:to-stone-500"
          )}
        />
        {isActive && (
          <div
            className="absolute top-0 left-0 h-3 rounded-full progress-glow transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            {isActive ? (
              <Loader2 className="w-4 h-4 animate-spin text-forest-400" />
            ) : status === 'completed' ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-muted-foreground">
              {current} / {total}
            </span>
          </div>

          {successCount > 0 && (
            <div className="flex items-center gap-1.5 text-green-500">
              <Check className="w-4 h-4" />
              <span>{successCount}</span>
            </div>
          )}

          {failedCount > 0 && (
            <div className="flex items-center gap-1.5 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{failedCount}</span>
            </div>
          )}
        </div>

        <span className="text-2xl font-bold gradient-text">
          {percentage}%
        </span>
      </div>

      {/* Status message */}
      {status !== 'processing' && (
        <p className={cn(
          "text-sm mt-3 font-medium",
          status === 'completed' && "text-green-500",
          status === 'cancelled' && "text-yellow-500",
          status === 'error' && "text-destructive"
        )}>
          {status === 'completed' && 'Extraction completed successfully!'}
          {status === 'cancelled' && 'Extraction was cancelled'}
          {status === 'error' && 'An error occurred during extraction'}
        </p>
      )}
    </GlassCard>
  );
};

export default ProgressCard;
