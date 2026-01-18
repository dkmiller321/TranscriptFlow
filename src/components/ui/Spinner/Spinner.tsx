import { cn } from '@/lib/utils/cn';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn(styles.spinner, styles[size], className)} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}
