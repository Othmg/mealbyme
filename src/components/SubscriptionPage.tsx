import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Check, ArrowLeft } from 'lucide-react';

export function SubscriptionPage() {
  const handleSubscribe = () => {
    window.location.href = 'https://buy.stripe.com/eVag2Nez88e9bFmbII';
  };

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
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Upgrade to Premium</h1>
            <p className="text-gray-600">Get unlimited access to all premium features</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4">Premium Features</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span>Unlimited recipe generations</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span>Save unlimited favorite recipes</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span>Advanced dietary preferences</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[#FF6B6B] rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span>Weekly meal planning</span>
              </li>
            </ul>
          </div>

          <div className="text-center mb-8">
            <div className="mb-2">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="text-sm text-gray-500">Cancel anytime</p>
          </div>

          <button
            onClick={handleSubscribe}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B]"
          >
            <Crown className="w-5 h-5" />
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}