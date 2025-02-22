import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' }
];

const SERVING_SIZE_OPTIONS = [
  { value: 1, label: 'Single serving (1 person)' },
  { value: 2, label: 'Couple (2 people)' },
  { value: 4, label: 'Family (4 people)' },
  { value: 6, label: 'Party (6 people)' }
];

const DIETARY_NEEDS = ['Diabetic-friendly', 'gluten-free', 'digestive health'];

export function NewMealPlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    servings: 2,
    dietaryNeeds: [] as string[],
    fitnessGoal: null as string | null,
    dislikedIngredients: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  const pollMealPlanStatus = async (threadId: string, runId: string, mealPlanId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(`/get-meal-plan?threadId=${threadId}&runId=${runId}&mealPlanId=${mealPlanId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check meal plan status');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (response.status === 200) {
        // Meal plan is ready
        navigate(`/meal-planner/plans/${mealPlanId}`);
        return;
      }

      // Continue polling
      setTimeout(() => pollMealPlanStatus(threadId, runId, mealPlanId), 2000);
    } catch (err) {
      console.error('Error polling meal plan status:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/create-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          servings: formData.servings,
          dietaryNeeds: formData.dietaryNeeds,
          fitnessGoal: formData.fitnessGoal,
          dislikedIngredients: formData.dislikedIngredients.split(',').map(i => i.trim()).filter(Boolean),
          startDate: formData.startDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // Start polling for completion
      pollMealPlanStatus(data.threadId, data.runId, data.mealPlanId);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate meal plan');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Meal Plan</h1>
          </div>

          {error && (
            <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serving Size
              </label>
              <select
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {SERVING_SIZE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients to Avoid
              </label>
              <input
                type="text"
                value={formData.dislikedIngredients}
                onChange={(e) => setFormData(prev => ({ ...prev, dislikedIngredients: e.target.value }))}
                placeholder="E.g., mushrooms, cilantro (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium">Advanced Customization</span>
              {showAdvanced ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fitness Goal
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {FITNESS_GOALS.map(goal => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          fitnessGoal: prev.fitnessGoal === goal.value ? null : goal.value
                        }))}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          formData.fitnessGoal === goal.value
                            ? 'bg-[#FF6B6B] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {goal.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Needs
                  </label>
                  <div className="space-y-2">
                    {DIETARY_NEEDS.map(need => (
                      <button
                        key={need}
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          dietaryNeeds: prev.dietaryNeeds.includes(need)
                            ? prev.dietaryNeeds.filter(n => n !== need)
                            : [...prev.dietaryNeeds, need]
                        }))}
                        className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${
                          formData.dietaryNeeds.includes(need)
                            ? 'bg-[#FF6B6B] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {need}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateMealPlan}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating your meal plan...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  <span>Generate Meal Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}