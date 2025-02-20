import React, { useState, useEffect } from 'react';
import { supabase, handleDatabaseError } from '../lib/supabase';
import { Save, X, Crown, Loader2 } from 'lucide-react';

interface UserPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface Preferences {
  dietary_restrictions: string[];
  favorite_ingredients: string[];
  disliked_ingredients: string[];
}

export function UserPreferences({ isOpen, onClose, onUpdate }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    dietary_restrictions: [],
    favorite_ingredients: [],
    disliked_ingredients: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      loadSubscriptionStatus();
    }
  }, [isOpen]);

  const loadSubscriptionStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsSubscribed(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, stripe_customer_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      // Verify Stripe customer ID exists
      if (!data?.stripe_customer_id && data?.status === 'active') {
        console.error('Active subscription found but no Stripe customer ID');
        setIsSubscribed(false);
        return;
      }

      setIsSubscribed(data?.status === 'active');
    } catch (err) {
      const { error } = handleDatabaseError(err);
      console.error('Error loading subscription status:', error);
    }
  };

  const loadPreferences = async () => {
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to access your preferences');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        const { error: errorMessage } = handleDatabaseError(error);
        setError(errorMessage);
        return;
      }

      if (data) {
        setPreferences({
          dietary_restrictions: data.dietary_restrictions || [],
          favorite_ingredients: data.favorite_ingredients || [],
          disliked_ingredients: data.disliked_ingredients || [],
        });
      }
    } catch (err) {
      const { error: errorMessage } = handleDatabaseError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to save preferences');
        return;
      }

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: session.user.id,
            dietary_restrictions: preferences.dietary_restrictions,
            favorite_ingredients: preferences.favorite_ingredients,
            disliked_ingredients: preferences.disliked_ingredients,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) throw error;

      onUpdate();
      onClose();
    } catch (err) {
      const { error: errorMessage } = handleDatabaseError(err);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof Preferences,
    value: string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value.split(',').map(item => item.trim()).filter(Boolean)
    }));
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Verify Stripe customer ID exists
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!subscription?.stripe_customer_id) {
        throw new Error('No Stripe customer ID found. Please contact support.');
      }

      const origin = window.location.origin;
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Origin': origin
        },
        body: JSON.stringify({ returnUrl: `${origin}/profile` })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create portal session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('No portal URL received');
      }

      window.location.href = url;
    } catch (err) {
      console.error('Error accessing customer portal:', err);
      setError(err instanceof Error ? err.message : 'Failed to access customer portal');
    } finally {
      setPortalLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Your Preferences</h2>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <div className="space-y-4">
            {isSubscribed && (
              <div className="bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    <span className="font-semibold">Premium Member</span>
                  </div>
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="px-3 py-1 bg-white text-[#FF6B6B] rounded-md text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      'Manage Subscription'
                    )}
                  </button>
                </div>
                <p className="text-sm opacity-90">
                  Thank you for being a premium member! You have access to unlimited recipe generations and all premium features.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Restrictions
              </label>
              <input
                type="text"
                value={preferences.dietary_restrictions.join(', ')}
                onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                placeholder="E.g., vegetarian, gluten-free, dairy-free"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Favorite Ingredients
              </label>
              <input
                type="text"
                value={preferences.favorite_ingredients.join(', ')}
                onChange={(e) => handleInputChange('favorite_ingredients', e.target.value)}
                placeholder="E.g., garlic, olive oil, tomatoes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disliked Ingredients
              </label>
              <input
                type="text"
                value={preferences.disliked_ingredients.join(', ')}
                onChange={(e) => handleInputChange('disliked_ingredients', e.target.value)}
                placeholder="E.g., mushrooms, cilantro"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}