import { supabase, handleDatabaseError, retryOperation } from './supabase';

export async function checkSubscriptionStatus(userId: string | undefined) {
  if (!userId) return false;
  
  try {
    // First check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, defaulting to free tier');
      return false;
    }

    const result = await retryOperation(async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    });

    return result?.status === 'active';
  } catch (err) {
    const { error, isConfigError } = handleDatabaseError(err);
    if (!isConfigError) {
      console.error('Error checking subscription:', error);
    }
    return false;
  }
}

export function isFeatureAvailable(feature: 'recipeGeneration' | 'mealPlanning' | 'favorites' | 'nutritionalInfo', isSubscribed: boolean) {
  const FREE_TIER_LIMITS = {
    recipeGeneration: 5, // 5 recipes per day
    mealPlanning: false, // Not available in free tier
    favorites: 3, // 3 saved recipes
    nutritionalInfo: false, // Premium only
  };

  switch (feature) {
    case 'recipeGeneration':
      return isSubscribed || FREE_TIER_LIMITS.recipeGeneration > 0;
    case 'mealPlanning':
    case 'nutritionalInfo':
      return isSubscribed;
    case 'favorites':
      return isSubscribed || FREE_TIER_LIMITS.favorites > 0;
    default:
      return false;
  }
}

export function shouldShowPremiumFeature(feature: 'nutritionalInfo', isSubscribed: boolean): boolean {
  if (!isSubscribed) return false;
  return isFeatureAvailable(feature, isSubscribed);
}