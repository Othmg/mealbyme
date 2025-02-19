import React, { useState } from 'react';
import { X, BookmarkPlus, UtensilsCrossed, ChefHat, Loader2 } from 'lucide-react';
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

  const createStripeCustomer = async (email: string) => {
    try {
      console.log('Creating Stripe customer for:', email);

      const response = await fetch('/api/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error creating Stripe customer:', {
          status: response.status,
          error: errorData
        });
        return null;
      }

      const data = await response.json();
      console.log('Stripe customer created:', data);
      return data.customerId || null;
    } catch (err) {
      console.error('Error creating Stripe customer:', err);
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
        // Proceed with sign up and let Supabase handle the uniqueness check
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });

        if (signUpError) {
          // Handle specific error cases
          if (signUpError.message?.includes('Password should be at least')) {
            throw new Error('Password must be at least 6 characters long');
          }
          if (signUpError.message?.includes('User already registered')) {
            throw new Error('An account with this email already exists. Please sign in instead.');
          }
          throw signUpError;
        }

        if (!data.user) {
          throw new Error('Failed to create account. Please try again.');
        }

        // Create Stripe customer and update user metadata
        console.log('Creating Stripe customer after successful signup');
        const stripeCustomerId = await createStripeCustomer(email);

        if (stripeCustomerId) {
          console.log('Updating user metadata with Stripe ID:', stripeCustomerId);
          const { error: updateError } = await supabase.auth.updateUser({
            data: { stripe_customer_id: stripeCustomerId }
          });

          if (updateError) {
            console.error('Error updating user with Stripe ID:', updateError);
          } else {
            console.log('Successfully updated user metadata with Stripe ID');
          }
        } else {
          console.error('Failed to create Stripe customer - no customer ID returned');
        }

        setSignUpSuccess(true);
      } else {
        // Handle sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message?.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          throw signInError;
        }

        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSignUpSuccess(false);
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
          disabled={loading}
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Created!</h3>
            <p className="text-gray-600 mb-4">
              Please check your email to confirm your account. Once confirmed, you can sign in with your email and password.
            </p>
            <button
              onClick={() => {
                setIsSignUp(false);
                setSignUpSuccess(false);
              }}
              className="text-[#FF6B6B] hover:text-[#FF5555] font-medium"
            >
              Sign in now
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
                disabled={loading}
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
                minLength={6}
                disabled={loading}
              />
              {isSignUp && (
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Please wait...</span>
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
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
                disabled={loading}
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