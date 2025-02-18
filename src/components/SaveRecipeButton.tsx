import React from 'react';
import { BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Recipe } from '../types';

interface SaveRecipeButtonProps {
  recipe: Recipe;
  onSaved?: () => void;
}

export function SaveRecipeButton({ recipe, onSaved }: SaveRecipeButtonProps) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to save recipes');

      const { error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          title: recipe.title,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          cooking_time: recipe.cookingTime,
          servings: recipe.servings,
          difficulty: recipe.difficulty
        });

      if (error) throw error;

      setSaved(true);
      onSaved?.();
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