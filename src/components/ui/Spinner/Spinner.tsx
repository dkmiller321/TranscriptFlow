import { cn } from '@/lib/utils/cn';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'dots';
  className?: string;
}

export function Spinner({ size = 'md', variant = 'default', className }: SpinnerProps) {
  if (variant === 'dots') {
    return (
      <div className={cn(styles.dotsContainer, styles[`dots-${size}`], className)} role="status">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={cn(styles.gradientSpinner, styles[size], className)} role="status">
        <div className={styles.gradientRing} />
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn(styles.spinner, styles[size], className)} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

// Skeleton loader component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        styles.skeleton,
        variant === 'circular' && styles.skeletonCircular,
        variant === 'text' && styles.skeletonText,
        className
      )}
      style={{ width, height }}
    />
  );
}

// Success checkmark animation
interface SuccessCheckProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SuccessCheck({ size = 'md', className }: SuccessCheckProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn(styles.successCheck, sizes[size], className)}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle
          className={styles.successCircle}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          className={styles.successPath}
          d="M8 12l3 3 5-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
