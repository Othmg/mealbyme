import React from 'react';
import { Outlet } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SubscriptionModal } from './SubscriptionModal';

export function MealPlanner() {
  const { isSubscribed } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);

  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h1>
            <p className="text-gray-600 mb-6">
              Upgrade to Premium to access our meal planning feature and create personalized meal plans.
            </p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-lg hover:from-[#FF5555] hover:to-[#E6A300] transition-colors"
            >
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </button>
          </div>

          <SubscriptionModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
          />
        </div>
      </div>
    );
  }

  return <Outlet />;
}