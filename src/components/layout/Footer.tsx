import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[var(--max-content-width)] px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <Logo size="sm" />
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-1">
            <span>&copy; {currentYear} TranscriptFlow</span>
            <span className="hidden sm:inline">&middot;</span>
            <nav className="flex items-center gap-1">
              <Link
                href="/terms"
                className="px-2 py-1 transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <span>&middot;</span>
              <Link
                href="/privacy"
                className="px-2 py-1 transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
