import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { shouldShowPremiumFeature } from '../lib/subscription';
import type { Recipe } from '../types';

interface SaveRecipeButtonProps {
  recipe: Recipe;
  isSubscribed: boolean;
  onSaved?: () => void;
}

export function SaveRecipeButton({ recipe, isSubscribed, onSaved }: SaveRecipeButtonProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to save recipes');

      // Always save dietary info, but only show it for subscribed users
      const recipeData = {
        user_id: user.id,
        title: recipe.title,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        cooking_time: recipe.cookingTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        dietary_info: recipe.dietaryInfo || null
      };

      const { error } = await supabase
        .from('saved_recipes')
        .insert(recipeData);

      if (error) throw error;

      setSaved(true);
      setShowSuccessMessage(true);
      onSaved?.();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
      console.error('Error saving recipe:', err);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="text-red-600 text-sm flex items-center gap-2">
        <span>{error}</span>
      </div>
    );
  }

  if (showSuccessMessage) {
    return (
      <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2">
        <BookmarkCheck className="w-5 h-5" />
        Recipe saved! <Link to="/saved-recipes" className="underline">View saved recipes</Link>
      </div>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className="flex items-center gap-2 text-gray-600 hover:text-[#FF6B6B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {saving ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="w-5 h-5 text-[#FF6B6B]" />
      ) : (
        <BookmarkPlus className="w-5 h-5" />
      )}
      <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Recipe'}</span>
    </button>
  );
}