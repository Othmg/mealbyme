import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crown, Calendar } from 'lucide-react';

export function MealPlanner() {
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

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meal Planner</h1>
          <p className="text-gray-600 mb-6">Coming Soon!</p>
          <p className="text-sm text-gray-500">
            We're working hard to bring you an amazing meal planning experience.
            Check back soon!
          </p>
        </div>
      </div>
    </div>
  );
}