import React from 'react';
import { X, Crown, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  if (!isOpen) return null;

  const handleSubscribe = () => {
    window.location.href = 'https://buy.stripe.com/eVag2Nez88e9bFmbII';
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
              <span>Save unlimited favorite recipes</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FF6B6B]" />
              <span>Advanced dietary preferences</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-[#FF6B6B]" />
              <span>Weekly meal planning</span>
            </li>
          </ul>
        </div>

        <div className="text-center mb-6">
          <div className="mb-2">
            <span className="text-3xl font-bold">$9.99</span>
            <span className="text-gray-600">/month</span>
          </div>
          <p className="text-sm text-gray-500">Cancel anytime</p>
        </div>

        <button
          onClick={handleSubscribe}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B]"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );
}