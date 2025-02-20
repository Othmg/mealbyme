import React, { useState } from 'react';
import OpenAI from 'openai';
import { Lock, Crown } from 'lucide-react';
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
    servingSize: 2
  });
  const [loading, setLoading] = useState(false);

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

      const prompt = `Create a recipe based on these preferences:
Desired dish: ${formData.desiredDish}${dietaryRestrictionsText}
Liked ingredients: ${formData.likedIngredients}
Disliked ingredients: ${formData.dislikedIngredients}
Serving size: ${formData.servingSize} ${formData.servingSize === 1 ? 'person' : 'people'}

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
  }
}

IMPORTANT: 
- Adjust all ingredient amounts to exactly match the specified serving size of ${formData.servingSize} ${formData.servingSize === 1 ? 'person' : 'people'}
- Respond with ONLY the JSON object, no additional text.
- ALWAYS include detailed nutritional information in the dietaryInfo object.`;

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

      <button
        type="submit"
        disabled={loading || !formData.desiredDish.trim() || (!isSubscribed && dailyGenerations >= 5)}
        className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B6B] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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