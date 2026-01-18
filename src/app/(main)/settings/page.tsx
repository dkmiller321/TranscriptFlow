'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/lib/utils/constants';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, authLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push(ROUTES.HOME);
  };

  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <p className={styles.value}>{user.email}</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.label}>Theme</label>
            <div className={styles.themeButtons}>
              <button
                className={`${styles.themeButton} ${theme === 'light' ? styles.active : ''}`}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
              <button
                className={`${styles.themeButton} ${theme === 'dark' ? styles.active : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
              <button
                className={`${styles.themeButton} ${theme === 'system' ? styles.active : ''}`}
                onClick={() => setTheme('system')}
              >
                System
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Danger Zone</h2>
        <div className={styles.card}>
          <div className={styles.dangerItem}>
            <div>
              <p className={styles.dangerTitle}>Sign out</p>
              <p className={styles.dangerDescription}>
                Sign out of your account on this device.
              </p>
            </div>
            <Button variant="danger" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
