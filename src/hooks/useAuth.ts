'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Check if there's likely a session stored (fast, synchronous check)
function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false;

  // Supabase stores session in localStorage with a key pattern
  const storageKey = Object.keys(localStorage).find(key =>
    key.startsWith('sb-') && key.endsWith('-auth-token')
  );

  return !!storageKey && !!localStorage.getItem(storageKey);
}

export function useAuth() {
  // Start with loading only if there might be a session to check
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => hasStoredSession());
  const supabase = createClient();

  useEffect(() => {
    // Only verify with server if there might be a session
    const getUser = async () => {
      if (hasStoredSession()) {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      }
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase]);

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
