import React, { useState, useEffect } from 'react';
import OpenAI from 'openai';
import { Lock, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Recipe } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

interface RecipeFormData {
  desiredDish: string;
  likedIngredients: string;
  dislikedIngredients: string;
  servingSize: number;
  fitnessGoal: string | null;
  dietaryNeeds: string[];
  mealType: string | null;
}

interface RecipeFormProps {
  user: any;
  isSubscribed: boolean;
  dailyGenerations: number;
  dietaryRestrictions: string[];
  onRecipeGenerated: (recipe: Recipe) => void;
  onError: (error: string) => void;
  onShowSubscriptionModal: () => void;
  onShowAuthModal: () => void;
  onIncrementGenerations: () => void;
}

const SERVING_SIZE_OPTIONS = [
  { value: 1, label: 'Single serving (1 person)' },
  { value: 2, label: 'Couple (2 people)' },
  { value: 4, label: 'Family (4 people)' },
  { value: 6, label: 'Party (6 people)' }
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DIETARY_NEEDS = ['Diabetic-friendly', 'gluten-free', 'digestive health'];
const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' }
];

export function RecipeForm({
  user,
  isSubscribed,
  dailyGenerations,
  dietaryRestrictions,
  onRecipeGenerated,
  onError,
  onShowSubscriptionModal,
  onShowAuthModal,
  onIncrementGenerations
}: RecipeFormProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    desiredDish: '',
    likedIngredients: '',
    dislikedIngredients: '',
    servingSize: 2,
    fitnessGoal: null,
    dietaryNeeds: [],
    mealType: null
  });
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load user preferences when component mounts
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setFormData(prev => ({
          ...prev,
          fitnessGoal: data.fitness_goal || null,
          dietaryNeeds: data.dietary_needs || [],
          mealType: data.preferred_meal_types?.[0] || null, // Use first preferred meal type as default
        }));
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const validateRecipeData = (data: any): data is Recipe => {
    if (!data || typeof data !== 'object') return false;

    const requiredFields = ['title', 'ingredients', 'steps', 'cookingTime', 'servings', 'difficulty'];
    for (const field of requiredFields) {
      if (!(field in data)) return false;
    }

    if (!Array.isArray(data.ingredients)) return false;
    for (const ingredient of data.ingredients) {
      if (!ingredient.name || !ingredient.amount) return false;
    }

    if (!Array.isArray(data.steps)) return false;
    for (const step of data.steps) {
      if (!step.number || !step.instruction) return false;
    }

    if (!data.cookingTime.prep || !data.cookingTime.cook || !data.cookingTime.total) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSubscribed && dailyGenerations >= 5) {
      onShowSubscriptionModal();
      return;
    }

    setLoading(true);

    try {
      const dietaryRestrictionsText = dietaryRestrictions.length > 0
        ? `\nDietary restrictions: ${dietaryRestrictions.join(', ')}`
        : '';

      const dietaryNeedsText = formData.dietaryNeeds.length > 0
        ? `\nDietary needs: ${formData.dietaryNeeds.join(', ')}`
        : '';

      const fitnessGoalText = formData.fitnessGoal
        ? `\nFitness goal: ${formData.fitnessGoal.replace('_', ' ')}`
        : '';

      const mealTypeText = formData.mealType
        ? `\nMeal type: ${formData.mealType}`
        : '';

      const prompt = `Create a recipe based on these preferences:
Desired dish: ${formData.desiredDish}${dietaryRestrictionsText}${dietaryNeedsText}${fitnessGoalText}${mealTypeText}
Liked ingredients: ${formData.likedIngredients}
Disliked ingredients: ${formData.dislikedIngredients}
Serving size: ${formData.servingSize} ${formData.servingSize === 1 ? 'person' : 'people'}

${formData.fitnessGoal ? `Please ensure the recipe aligns with the ${formData.fitnessGoal.replace('_', ' ')} goal by adjusting macronutrients and portion sizes appropriately.` : ''}
${formData.dietaryNeeds.length > 0 ? `The recipe must strictly follow these dietary needs: ${formData.dietaryNeeds.join(', ')}` : ''}
${formData.mealType ? `This recipe should be suitable for ${formData.mealType} and contain appropriate ingredients and portions for this meal type.` : ''}

Please provide a detailed recipe in JSON format with the following structure:
{
  "title": "Recipe name",
  "ingredients": [{"name": "ingredient", "amount": "amount", "unit": "unit"}],
  "steps": [{"number": 1, "instruction": "step instruction"}],
  "cookingTime": {"prep": "time", "cook": "time", "total": "time"},
  "servings": ${formData.servingSize},
  "difficulty": "Easy/Medium/Hard",
  "dietaryInfo": {
    "calories": number,
    "protein": "amount in grams",
    "carbs": "amount in grams",
    "fats": "amount in grams",
    "fiber": "amount in grams",
    "sodium": "amount in mg",
    "dietaryTags": ["vegetarian", "vegan", "gluten-free", etc],
    "allergens": ["dairy", "gluten", "nuts", etc]
  },
  "fitnessGoal": "${formData.fitnessGoal || ''}",
  "mealType": "${formData.mealType || ''}"
}

IMPORTANT: 
- Adjust all ingredient amounts to exactly match the specified serving size of ${formData.servingSize} ${formData.servingSize === 1 ? 'person' : 'people'}
- Respond with ONLY the JSON object, no additional text.
- ALWAYS include detailed nutritional information in the dietaryInfo object.
- Ensure macronutrients align with the specified fitness goal and meal type if provided.`;

      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: "asst_k1fs4UtX2ZFHDIkfwj8PayXa"
      });

      let response;
      while (true) {
        const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        if (runStatus.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(thread.id);
          response = messages.data[0].content[0];
          break;
        } else if (runStatus.status === 'failed') {
          throw new Error('Failed to generate recipe');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (response?.type === 'text' && response.text) {
        try {
          const recipeData = JSON.parse(response.text.value);

          if (!validateRecipeData(recipeData)) {
            throw new Error('Invalid recipe format received from AI');
          }

          onRecipeGenerated(recipeData);
          onIncrementGenerations();
        } catch (parseError) {
          console.error('Parse Error:', parseError);
          throw new Error(`Failed to parse recipe data: ${parseError.message}`);
        }
      } else {
        throw new Error('Unexpected response format from OpenAI');
      }
    } catch (err) {
      console.error('Error:', err);
      onError(err instanceof Error ? err.message : 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'servingSize' ? parseInt(value, 10) : value
    }));
  };

  const getPlaceholderText = () => {
    let placeholder = 'E.g., A healthy pasta dish, A spicy curry...';
    if (dietaryRestrictions.length > 0) {
      placeholder += `\nNote: Your dietary restrictions (${dietaryRestrictions.join(', ')}) will be considered.`;
    }
    return placeholder;
  };

  const getRemainingGenerations = () => {
    if (isSubscribed) return '∞';
    return `${5 - dailyGenerations} of 5`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Recipes remaining today: {getRemainingGenerations()}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <div>
          <label htmlFor="desiredDish" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            What would you like to eat?
            {dietaryRestrictions.length > 0 && (
              <span className="ml-2 text-[#FF6B6B] text-xs">
                (Your dietary restrictions will be considered)
              </span>
            )}
          </label>
          <textarea
            id="desiredDish"
            name="desiredDish"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder={getPlaceholderText()}
            value={formData.desiredDish}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="likedIngredients" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Ingredients you like
              </label>
              <textarea
                id="likedIngredients"
                name="likedIngredients"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                placeholder="E.g., garlic, olive oil, tomatoes..."
                value={formData.likedIngredients}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label htmlFor="dislikedIngredients" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Ingredients you don't like
              </label>
              <textarea
                id="dislikedIngredients"
                name="dislikedIngredients"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
                placeholder="E.g., mushrooms, cilantro..."
                value={formData.dislikedIngredients}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="servingSize" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Serving Size
              {!user && (
                <span className="ml-2 text-[#FF6B6B] text-xs">
                  (Sign in to customize)
                </span>
              )}
            </label>
            {user ? (
              <select
                id="servingSize"
                name="servingSize"
                value={formData.servingSize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              >
                {SERVING_SIZE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <select
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm text-gray-500 cursor-not-allowed text-sm sm:text-base"
                >
                  <option>Couple (2 people)</option>
                </select>
                <button
                  type="button"
                  onClick={onShowAuthModal}
                  className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-80 rounded-md"
                >
                  <div className="flex items-center gap-2 text-[#FF6B6B] hover:text-[#FF5555] font-medium">
                    <Lock className="w-4 h-4" />
                    <span>Sign in to customize</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
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
          <div className="relative mt-4">
            <div className={`space-y-4 ${!user && 'opacity-60'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fitness Goal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FITNESS_GOALS.map(goal => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => user && setFormData(prev => ({
                        ...prev,
                        fitnessGoal: prev.fitnessGoal === goal.value ? null : goal.value
                      }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${formData.fitnessGoal === goal.value
                          ? 'bg-[#FF6B6B] text-white'
                          : 'bg-gray-100 text-gray-700'
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
                      onClick={() => user && setFormData(prev => ({
                        ...prev,
                        dietaryNeeds: prev.dietaryNeeds.includes(need)
                          ? prev.dietaryNeeds.filter(n => n !== need)
                          : [...prev.dietaryNeeds, need]
                      }))}
                      className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors text-left ${formData.dietaryNeeds.includes(need)
                          ? 'bg-[#FF6B6B] text-white'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {need}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => user && setFormData(prev => ({
                        ...prev,
                        mealType: prev.mealType === type ? null : type
                      }))}
                      className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${formData.mealType === type
                          ? 'bg-[#FF6B6B] text-white'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!user && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-20 backdrop-blur-[2px] rounded-md">
                <button
                  type="button"
                  onClick={onShowAuthModal}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-lg hover:from-[#FF5555] hover:to-[#E6A300] transition-colors shadow-md"
                >
                  <Lock className="w-5 h-5" />
                  <span>Sign in to customize</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !formData.desiredDish.trim() || (!isSubscribed && dailyGenerations >= 5)}
        className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? 'Creating Your Recipe...' : 'Create My Recipe'}
      </button>

      {!isSubscribed && dailyGenerations >= 5 && (
        <p className="text-sm text-center text-gray-600">
          You've reached your daily limit.
          <button
            type="button"
            onClick={onShowSubscriptionModal}
            className="ml-1 text-[#FF6B6B] hover:text-[#FF5555] inline-flex items-center gap-1"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </button>
        </p>
      )}
    </form>
  );
}