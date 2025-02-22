import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Leaf, AlertTriangle, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { MealPlan } from '../types';

export function MealPlanView() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [swappingMeal, setSwappingMeal] = useState<string | null>(null);

  useEffect(() => {
    if (planId) {
      loadMealPlan();
    }
  }, [planId]);

  const loadMealPlan = async () => {
    try {
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
        .eq('id', planId)
        .single();

      if (error) throw error;
      setMealPlan(data);
    } catch (err) {
      console.error('Error loading meal plan:', err);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async (day: number, mealType: string) => {
    if (!mealPlan) return;

    const swapId = `${day}-${mealType}`;
    setSwappingMeal(swapId);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/create-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          servings: mealPlan.servings,
          dietaryNeeds: mealPlan.dietary_needs,
          fitnessGoal: mealPlan.fitness_goal,
          dislikedIngredients: mealPlan.disliked_ingredients,
          startDate: mealPlan.start_date,
          swapMeal: { day, mealType }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to swap meal');
      }

      await loadMealPlan();
    } catch (err) {
      console.error('Error swapping meal:', err);
      setError(err instanceof Error ? err.message : 'Failed to swap meal');
    } finally {
      setSwappingMeal(null);
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

  if (!mealPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/meal-planner"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Meal Plans
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">Meal plan not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            to="/meal-planner"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Meal Plans
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your 3-Day Meal Plan</h1>
              <p className="text-gray-600">
                {new Date(mealPlan.start_date).toLocaleDateString()} - {new Date(mealPlan.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Plan Settings</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Servings</p>
                <p className="text-sm font-medium">{mealPlan.servings} people</p>
              </div>
              {mealPlan.fitness_goal && (
                <div>
                  <p className="text-xs text-gray-500">Fitness Goal</p>
                  <p className="text-sm font-medium capitalize">
                    {mealPlan.fitness_goal.replace('_', ' ')}
                  </p>
                </div>
              )}
              {mealPlan.dietary_needs.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Dietary Needs</p>
                  <div className="flex flex-wrap gap-1">
                    {mealPlan.dietary_needs.map((need, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs"
                      >
                        <Leaf className="w-3 h-3" />
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {mealPlan.disliked_ingredients.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Avoiding</p>
                  <div className="flex flex-wrap gap-1">
                    {mealPlan.disliked_ingredients.map((ingredient, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {[1, 2, 3].map(day => {
            const dayItems = mealPlan.meal_plan_items.filter(item => item.day_number === day);
            return (
              <div key={day} className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Day {day}
                </h3>
                <div className="space-y-4">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                    const meal = dayItems.find(item => item.meal_type === mealType);
                    const swapId = `${day}-${mealType}`;
                    return (
                      <div key={mealType} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-medium text-gray-900 capitalize">
                            {mealType}
                          </h4>
                          <button
                            onClick={() => handleSwapMeal(day, mealType)}
                            disabled={swappingMeal === swapId}
                            className="text-gray-500 hover:text-[#FF6B6B] disabled:opacity-50"
                          >
                            {swappingMeal === swapId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {meal && (
                          <button
                            onClick={() => navigate(`/recipe/${meal.recipe_id}`, {
                              state: { recipe: meal.meal_plan_recipes }
                            })}
                            className="w-full text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-900 font-medium group-hover:text-[#FF6B6B] transition-colors">
                                  {meal.meal_plan_recipes.title}
                                </p>
                                <div className="text-sm text-gray-600 mt-1">
                                  <p>Prep: {meal.meal_plan_recipes.cooking_time.prep}</p>
                                  <p>Calories: {meal.meal_plan_recipes.dietary_info?.calories} kcal</p>
                                </div>
                                {meal.meal_plan_recipes.dietary_info?.dietaryTags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {meal.meal_plan_recipes.dietary_info.dietaryTags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs"
                                      >
                                        <Leaf className="w-3 h-3" />
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#FF6B6B] transition-colors" />
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {mealPlan.meal_plan_groceries?.[0]?.items && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grocery List</h3>
              {mealPlan.meal_plan_groceries[0].items.categories.map((category, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{category.name}</h4>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-gray-700">
                        <span className="text-[#FF6B6B]">•</span>
                        <div>
                          <p>{item.amount} {item.unit} {item.name}</p>
                          <p className="text-sm text-gray-500">Used in: {item.usedIn.join(', ')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}