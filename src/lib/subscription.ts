import { supabase, handleDatabaseError, retryOperation } from './supabase';

export async function checkSubscriptionStatus(userId: string | undefined) {
  if (!userId) return false;
  
  try {
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
    const { error } = handleDatabaseError(err);
    console.error('Error checking subscription:', error);
    return false;
  }
}

export function isFeatureAvailable(feature: 'recipeGeneration' | 'mealPlanning' | 'favorites', isSubscribed: boolean) {
  const FREE_TIER_LIMITS = {
    recipeGeneration: 5, // 5 recipes per day
    mealPlanning: false, // Not available in free tier
    favorites: 3, // 3 saved recipes
  };

  switch (feature) {
    case 'recipeGeneration':
      return isSubscribed || FREE_TIER_LIMITS.recipeGeneration > 0;
    case 'mealPlanning':
      return isSubscribed;
    case 'favorites':
      return isSubscribed || FREE_TIER_LIMITS.favorites > 0;
    default:
      return false;
  }
}