import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { AuthModal } from './components/AuthModal';
import { UserPreferences } from './components/UserPreferences';
import { SubscriptionModal } from './components/SubscriptionModal';
import { Logo } from './components/Logo';
import { RecipeForm } from './components/RecipeForm';
import { RecipeDisplay } from './components/RecipeDisplay';
import type { Recipe } from './types';
import { supabase } from './lib/supabase';

function App() {
  const { user, isSubscribed, dailyGenerations, incrementDailyGenerations } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);

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
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError('Failed to load preferences');
    }
  };

  const handleSaveSuccess = () => {
    // You could show a success message or update UI state here
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 sm:mb-12">
        <Logo />
        <p className="text-base sm:text-lg text-gray-600">
          Your personal AI chef for delicious, customized recipes
        </p>
      </div>

      <RecipeForm
        user={user}
        isSubscribed={isSubscribed}
        dailyGenerations={dailyGenerations}
        dietaryRestrictions={dietaryRestrictions}
        onRecipeGenerated={setRecipe}
        onError={setError}
        onShowSubscriptionModal={() => setShowSubscriptionModal(true)}
        onShowAuthModal={() => setShowAuthModal(true)}
        onIncrementGenerations={incrementDailyGenerations}
      />

      {error && (
        <div className="mb-6 sm:mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      )}

      {recipe && (
        <RecipeDisplay
          recipe={recipe}
          user={user}
          isSubscribed={isSubscribed}
          onShowSubscriptionModal={() => setShowSubscriptionModal(true)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {!recipe && !error && (
        <div className="text-center text-gray-500 flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm sm:text-base">
            Your personalized recipe will appear here
          </span>
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
  );
}

export default App;