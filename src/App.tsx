import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Users, ChefHat as DifficultyIcon, UserCircle2, Settings, Crown, LogOut } from 'lucide-react';
import OpenAI from 'openai';
import { supabase, handleDatabaseError, retryOperation } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { UserPreferences } from './components/UserPreferences';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SaveRecipeButton } from './components/SaveRecipeButton';
import { Logo } from './components/Logo';
import { checkSubscriptionStatus, isFeatureAvailable } from './lib/subscription';
import type { Recipe } from './types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

interface RecipeFormData {
  desiredDish: string;
  likedIngredients: string;
  dislikedIngredients: string;
}

function App() {
  const [formData, setFormData] = useState<RecipeFormData>({
    desiredDish: '',
    likedIngredients: '',
    dislikedIngredients: '',
  });
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [dailyGenerations, setDailyGenerations] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadUserPreferences();
      loadSubscriptionStatus();
      loadDailyGenerations();
    }
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSubscribed(data?.status === 'active');
    } catch (err) {
      const { error, isConfigError } = handleDatabaseError(err);
      if (!isConfigError) {
        console.error('Error checking subscription:', error);
      }
      setIsSubscribed(false); // Fallback to free tier
    }
  };

  const loadDailyGenerations = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await retryOperation(async () => {
        const { data, error } = await supabase
          .from('recipe_generations')
          .select('count')
          .eq('user_id', user.id)
          .eq('date', today)
          .maybeSingle();

        if (error) throw error;
        return data;
      });

      setDailyGenerations(result?.count || 0);
    } catch (err) {
      const { error, isConfigError } = handleDatabaseError(err);
      if (!isConfigError) {
        console.error('Error loading daily generations:', error);
      }
      setDailyGenerations(0); // Fallback to 0 to prevent blocking the user
    }
  };

  const incrementDailyGenerations = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('recipe_generations')
        .upsert(
          {
            user_id: user.id,
            date: today,
            count: dailyGenerations + 1
          },
          {
            onConflict: 'user_id,date',
            update: {
              count: dailyGenerations + 1
            }
          }
        );

      if (error) {
        console.error('Error updating daily generations:', error);
        return;
      }

      setDailyGenerations(prev => prev + 1);
    } catch (err) {
      console.error('Error incrementing daily generations:', err);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        setError('Failed to load preferences');
        return;
      }

      if (data) {
        setDietaryRestrictions(data.dietary_restrictions || []);
        setFormData(prev => ({
          ...prev,
          likedIngredients: data.favorite_ingredients.join(', '),
          dislikedIngredients: data.disliked_ingredients.join(', '),
        }));
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load preferences');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSubscribed && dailyGenerations >= 5) {
      setShowSubscriptionModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const dietaryRestrictionsText = dietaryRestrictions.length > 0 
        ? `\nDietary restrictions: ${dietaryRestrictions.join(', ')}`
        : '';

      const prompt = `Create a recipe based on these preferences:
Desired dish: ${formData.desiredDish}${dietaryRestrictionsText}
Liked ingredients: ${formData.likedIngredients}
Disliked ingredients: ${formData.dislikedIngredients}

Please provide a detailed recipe in JSON format with the following structure:
{
  "title": "Recipe name",
  "ingredients": [{"name": "ingredient", "amount": "amount", "unit": "unit"}],
  "steps": [{"number": 1, "instruction": "step instruction"}],
  "cookingTime": {"prep": "time", "cook": "time", "total": "time"},
  "servings": number,
  "difficulty": "Easy/Medium/Hard"
}

IMPORTANT: Respond with ONLY the JSON object, no additional text.`;

      const thread = await openai.beta.threads.create();
      
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: prompt
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: "asst_174bXh18C91uWqqQx3MRnqus"
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
          
          setRecipe(recipeData);
          await incrementDailyGenerations();
        } catch (parseError) {
          console.error('Parse Error:', parseError);
          throw new Error(`Failed to parse recipe data: ${parseError.message}`);
        }
      } else {
        throw new Error('Unexpected response format from OpenAI');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleSaveSuccess = () => {
    // You could show a success message or update UI state here
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Recipes remaining today: {getRemainingGenerations()}
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {!isSubscribed && (
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="text-[#FF6B6B] hover:text-[#FF5555] flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <Crown className="w-5 h-5" />
                    <span className="hidden sm:inline">Upgrade</span>
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                  
                  {showSettingsMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          setShowPreferences(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Preferences
                      </button>
                      <button
                        onClick={() => {
                          setShowSettingsMenu(false);
                          supabase.auth.signOut();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm"
              >
                <UserCircle2 className="w-5 h-5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <Logo />
          <p className="text-base sm:text-lg text-gray-600">Your personal AI chef for delicious, customized recipes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
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

            <div className="grid sm:grid-cols-2 gap-4">
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
                onClick={() => setShowSubscriptionModal(true)}
                className="ml-1 text-[#FF6B6B] hover:text-[#FF5555]"
              >
                Upgrade to Premium
              </button>
            </p>
          )}
        </form>

        {error && (
          <div className="mb-6 sm:mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        )}

        {recipe && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{recipe.title}</h2>
              {user && <SaveRecipeButton recipe={recipe} onSaved={handleSaveSuccess} />}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Time</p>
                  <p className="font-semibold text-sm sm:text-base">{recipe.cookingTime.total}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Servings</p>
                  <p className="font-semibold text-sm sm:text-base">{recipe.servings}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 col-span-2 lg:col-span-1">
                <DifficultyIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Difficulty</p>
                  <p className="font-semibold text-sm sm:text-base">{recipe.difficulty}</p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-gray-700 text-sm sm:text-base flex items-start">
                      <span className="text-[#FF6B6B] mr-2">•</span>
                      <span>
                        {ingredient.amount} {ingredient.unit} {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Timing</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Prep Time</p>
                    <p className="font-medium">{recipe.cookingTime.prep}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cook Time</p>
                    <p className="font-medium">{recipe.cookingTime.cook}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Time</p>
                    <p className="font-medium">{recipe.cookingTime.total}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
              <ol className="space-y-3">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="text-gray-700 text-sm sm:text-base">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {step.number}
                      </span>
                      <span>{step.instruction}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {!recipe && !loading && !error && (
          <div className="text-center text-gray-500 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm sm:text-base">Your personalized recipe will appear here</span>
          </div>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        <UserPreferences
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          onUpdate={loadUserPreferences}
        />

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      </div>
    </div>
  );
}

export default App;