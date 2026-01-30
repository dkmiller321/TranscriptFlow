'use client';

import { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push(ROUTES.HOME);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link href={ROUTES.HOME} className={styles.logo}>
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className={`${styles.nav} hidden sm:flex`}>
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

        {/* Mobile Navigation Controls */}
        <div className="flex items-center gap-2 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md hover:bg-muted/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-2">
            <Link
              href={ROUTES.PRICING}
              className={styles.navLink}
              onClick={closeMobileMenu}
            >
              Pricing
            </Link>

            {loading ? (
              <div className="flex flex-col gap-2 py-2">
                <div className="h-8 w-full bg-muted/50 rounded animate-pulse" />
                <div className="h-8 w-full bg-muted/50 rounded animate-pulse" />
              </div>
            ) : user ? (
              <>
                <Link
                  href={ROUTES.HISTORY}
                  className={styles.navLink}
                  onClick={closeMobileMenu}
                >
                  History
                </Link>
                <Link
                  href={ROUTES.LIBRARY}
                  className={styles.navLink}
                  onClick={closeMobileMenu}
                >
                  Library
                </Link>
                <Link
                  href={ROUTES.SETTINGS}
                  className={styles.navLink}
                  onClick={closeMobileMenu}
                >
                  Settings
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start">
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link href={ROUTES.LOGIN} onClick={closeMobileMenu}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link href={ROUTES.SIGNUP} onClick={closeMobileMenu}>
                  <Button variant="primary" size="sm" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
