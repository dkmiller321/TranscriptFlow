'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { APP_NAME, ROUTES } from '@/lib/utils/constants';
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
          {APP_NAME}
        </Link>

        <nav className={styles.nav}>
          {!loading && (
            <>
              {user ? (
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
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
