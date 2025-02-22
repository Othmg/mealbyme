import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error('No active session found. Please sign in again.');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Error initiating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to start subscription process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
          <p className="text-gray-600">Get unlimited access to all premium features</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-lg mb-4">Premium Features</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FF6B6B]" />
              <span>Unlimited recipe generations</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FF6B6B]" />
              <span>Save your favorite recipes</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FF6B6B]" />
              <span>Advanced nutritional information</span>
            </li>

          </ul>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <div className="mb-2">
            <span className="text-3xl font-bold">$9.99</span>
            <span className="text-gray-600">/month</span>
          </div>
          <p className="text-sm text-gray-500">Cancel anytime</p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Please wait...</span>
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              <span>Subscribe Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}