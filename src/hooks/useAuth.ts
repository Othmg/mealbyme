import { useState, useEffect } from 'react';
import { supabase, handleDatabaseError, retryOperation } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [dailyGenerations, setDailyGenerations] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        const { error, isAuthError } = handleDatabaseError(err);
        if (isAuthError) {
          setUser(null);
        }
        console.error('Auth initialization error:', error);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsSubscribed(false);
        setDailyGenerations(0);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadSubscriptionStatus();
      loadDailyGenerations();
    }
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSubscribed(data?.status === 'active');
    } catch (err) {
      const { error, isConfigError, isAuthError } = handleDatabaseError(err);
      if (!isConfigError) {
        console.error('Error checking subscription:', error);
      }
      setIsSubscribed(false);
    }
  };

  const loadDailyGenerations = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('recipe_generations')
          .select('count')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (error) throw error;
        return data;
      });

      setDailyGenerations(result?.count || 0);
    } catch (err) {
      const { error, isConfigError } = handleDatabaseError(err);
      if (!isConfigError) {
        console.error('Error loading daily generations:', error);
      }
      setDailyGenerations(0);
    }
  };

  const incrementDailyGenerations = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('recipe_generations')
        .upsert(
          {
            user_id: user.id,
            date: today,
            count: dailyGenerations + 1
          },
          {
            onConflict: 'user_id,date',
            update: {
              count: dailyGenerations + 1
            }
          }
        );

      if (error) {
        console.error('Error updating daily generations:', error);
        return;
      }

      setDailyGenerations(prev => prev + 1);
    } catch (err) {
      console.error('Error incrementing daily generations:', err);
    }
  };

  return {
    user,
    isSubscribed,
    dailyGenerations,
    incrementDailyGenerations
  };
}