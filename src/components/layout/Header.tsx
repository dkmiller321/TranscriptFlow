'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ROUTES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.push(ROUTES.HOME);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        "transition-all duration-300 ease-out",
        scrolled
          ? "bg-background/80 dark:bg-background/70 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/5 dark:shadow-black/20"
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* Subtle glow line at bottom when scrolled */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-px",
          "bg-gradient-to-r from-transparent via-primary/30 to-transparent",
          "transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          <Link
            href={ROUTES.HOME}
            className="flex items-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1">
            <NavLink href={ROUTES.PRICING}>Pricing</NavLink>

            {loading ? (
              <div className="flex items-center gap-2 ml-2">
                <div className="h-8 w-16 bg-muted/30 rounded-lg animate-pulse" />
                <div className="h-8 w-20 bg-muted/30 rounded-lg animate-pulse" />
              </div>
            ) : user ? (
              <>
                <NavLink href={ROUTES.HISTORY}>History</NavLink>
                <NavLink href={ROUTES.LIBRARY}>Library</NavLink>
                <NavLink href={ROUTES.SETTINGS}>Settings</NavLink>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link href={ROUTES.LOGIN}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href={ROUTES.SIGNUP}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <div className="ml-2 pl-2 border-l border-border/50">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile Navigation Controls */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                "hover:bg-muted/50 active:scale-95",
                mobileMenuOpen && "bg-muted/50"
              )}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
                <span
                  className={cn(
                    "block h-0.5 w-5 bg-current transition-all duration-300",
                    mobileMenuOpen && "rotate-45 translate-y-1.5"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-5 bg-current transition-all duration-300",
                    mobileMenuOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "block h-0.5 w-5 bg-current transition-all duration-300",
                    mobileMenuOpen && "-rotate-45 -translate-y-1.5"
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "sm:hidden overflow-hidden transition-all duration-300 ease-out",
          mobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-4 py-4 bg-background/95 dark:bg-background/90 backdrop-blur-xl border-t border-border/50">
          <div className="flex flex-col gap-1">
            <MobileNavLink href={ROUTES.PRICING} onClick={closeMobileMenu}>
              Pricing
            </MobileNavLink>

            {loading ? (
              <div className="flex flex-col gap-2 py-2">
                <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
                <div className="h-10 w-full bg-muted/30 rounded-lg animate-pulse" />
              </div>
            ) : user ? (
              <>
                <MobileNavLink href={ROUTES.HISTORY} onClick={closeMobileMenu}>
                  History
                </MobileNavLink>
                <MobileNavLink href={ROUTES.LIBRARY} onClick={closeMobileMenu}>
                  Library
                </MobileNavLink>
                <MobileNavLink href={ROUTES.SETTINGS} onClick={closeMobileMenu}>
                  Settings
                </MobileNavLink>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors mt-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border/50">
                <Link href={ROUTES.LOGIN} onClick={closeMobileMenu}>
                  <Button variant="ghost" size="sm" className="w-full justify-center">
                    Log In
                  </Button>
                </Link>
                <Link href={ROUTES.SIGNUP} onClick={closeMobileMenu}>
                  <Button variant="primary" size="sm" className="w-full justify-center shadow-lg shadow-primary/20">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-lg",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/50 transition-colors duration-200"
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-sm font-medium rounded-lg",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/50 transition-colors duration-200"
      )}
    >
      {children}
    </Link>
  );
}
