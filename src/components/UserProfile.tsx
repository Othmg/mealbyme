import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Crown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsSubscribed(subscription?.status === 'active');
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Recipe Generator
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          {isSubscribed ? (
            <div className="bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">Premium Member</span>
                </div>
                <button
                  onClick={() => window.location.href = 'https://billing.stripe.com/p/login/cN201l98Iadzg12aEE'}
                  className="px-3 py-1 bg-white text-[#FF6B6B] rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Free Plan</span>
                </div>
                <Link
                  to="/subscription"
                  className="px-3 py-1 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-md text-sm font-medium hover:from-[#FF5555] hover:to-[#E6A300] transition-colors"
                >
                  Upgrade to Premium
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 flex items-center gap-2 text-gray-900">
                <Mail className="w-5 h-5 text-gray-400" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}