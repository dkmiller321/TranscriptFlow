'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/lib/utils/constants';
import styles from './Layout.module.css';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push(ROUTES.HOME);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href={ROUTES.HOME} className={styles.logo}>
          <Logo size="md" />
        </Link>

        <nav className={styles.nav}>
          <Link href={ROUTES.PRICING} className={styles.navLink}>
            Pricing
          </Link>

          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 bg-muted/50 rounded animate-pulse" />
              <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
            </div>
          ) : user ? (
            <>
              <Link href={ROUTES.HISTORY} className={styles.navLink}>
                History
              </Link>
              <Link href={ROUTES.LIBRARY} className={styles.navLink}>
                Library
              </Link>
              <Link href={ROUTES.SETTINGS} className={styles.navLink}>
                Settings
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href={ROUTES.SIGNUP}>
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
