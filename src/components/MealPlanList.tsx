import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MealPlan } from '../types';

export function MealPlanList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_items (
            meal_type,
            day_number,
            meal_plan_recipes (*)
          ),
          meal_plan_groceries (
            items
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMealPlans(data || []);
    } catch (err) {
      console.error('Error loading meal plans:', err);
      setError('Failed to load meal plans');
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meal Plans</h1>
          <Link
            to="/meal-planner/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-lg hover:from-[#FF5555] hover:to-[#E6A300] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Plan
          </Link>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
            {error}
          </div>
        ) : mealPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Meal Plans Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first meal plan to get started.
            </p>
            <Link
              to="/meal-planner/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-lg hover:from-[#FF5555] hover:to-[#E6A300] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Plan
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mealPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => navigate(`/meal-planner/plans/${plan.id}`)}
                className="w-full bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#FF6B6B]" />
                    <h3 className="font-medium text-gray-900">
                      {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF6B6B] transition-colors" />
                </div>
                <div className="text-sm text-gray-600">
                  <p>{plan.servings} servings</p>
                  {plan.dietary_needs.length > 0 && (
                    <p>Dietary needs: {plan.dietary_needs.join(', ')}</p>
                  )}
                  {plan.fitness_goal && (
                    <p>Fitness goal: {plan.fitness_goal.replace('_', ' ')}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}