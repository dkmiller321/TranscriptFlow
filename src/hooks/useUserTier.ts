'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import { getTierLimits, type TierName, type TierLimits, isValidTier } from '@/lib/usage/tiers';

export function useUserTier() {
  const { user, loading: authLoading } = useAuth();
  const [tier, setTier] = useState<TierName>('free');
  const [limits, setLimits] = useState<TierLimits>(getTierLimits('free'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setTier('free');
      setLimits(getTierLimits('free'));
      setLoading(false);
      return;
    }

    const fetchTier = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setTier('free');
        setLimits(getTierLimits('free'));
      } else {
        const userTier = isValidTier(data.tier) ? data.tier : 'free';
        setTier(userTier);
        setLimits(getTierLimits(userTier));
      }
      setLoading(false);
    };

    fetchTier();
  }, [user, authLoading]);

  return { tier, limits, loading };
}
