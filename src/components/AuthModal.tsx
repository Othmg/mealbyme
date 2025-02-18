import React, { useState } from 'react';
import { X, BookmarkPlus, UtensilsCrossed, ChefHat } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  if (!isOpen) return null;

  const checkEmailExists = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (!error) {
        return true;
      }

      if (error.message.includes('Email not confirmed') ||
        error.message.includes('User already registered')) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const createStripeCustomer = async (email: string) => {
    try {
      const response = await fetch('/.netlify/edge-functions/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe customer');
      }

      const { customerId } = await response.json();
      return customerId;
    } catch (err) {
      console.error('Error creating Stripe customer:', err);
      // Don't throw - we still want to complete signup even if Stripe fails
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSignUpSuccess(false);

    try {
      if (isSignUp) {
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setError('An account with this email already exists. Please sign in instead.');
          setLoading(false);
          return;
        }

        // Create Stripe customer first
        const stripeCustomerId = await createStripeCustomer(email);

        // Sign up the user with the Stripe customer ID in metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              stripe_customer_id: stripeCustomerId
            }
          }
        });

        if (error) throw error;
        setSignUpSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {isSignUp && !signUpSuccess && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Benefits of joining:</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-gray-700">
                <BookmarkPlus className="w-5 h-5 text-[#FF6B6B]" />
                <span>Save your favorite recipes</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <UtensilsCrossed className="w-5 h-5 text-[#FF6B6B]" />
                <span>Remember your dietary preferences</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <ChefHat className="w-5 h-5 text-[#FF6B6B]" />
                <span>Get personalized recipe suggestions</span>
              </li>
            </ul>
          </div>
        )}

        {signUpSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h3>
            <p className="text-gray-600 mb-4">
              We've sent you an email with a link to confirm your account.
              Please check your inbox and click the link to complete the sign-up process.
            </p>
            <button
              onClick={onClose}
              className="text-[#FF6B6B] hover:text-[#FF5555] font-medium"
            >
              Close this window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSignUpSuccess(false);
                }}
                className="text-[#FF6B6B] hover:text-[#FF5555]"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}