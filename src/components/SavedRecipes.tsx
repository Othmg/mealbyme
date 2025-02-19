import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowLeft, Clock, Users, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Recipe } from '../types';

export function SavedRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view your saved recipes');
        return;
      }

      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecipes(data || []);
    } catch (err) {
      console.error('Error loading saved recipes:', err);
      setError('Failed to load saved recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId: string) => {
    try {
      setDeleting(recipeId);
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again.');
    } finally {
      setDeleting(null);
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
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Recipe Generator
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Recipes</h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
            {error}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Recipes</h3>
            <p className="text-gray-600 mb-4">
              You haven't saved any recipes yet.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] hover:from-[#FF5555] hover:to-[#E6A300]"
            >
              Generate a Recipe
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{recipe.title}</h2>
                  <button
                    onClick={() => recipe.id && handleDelete(recipe.id)}
                    disabled={deleting === recipe.id}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {deleting === recipe.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Total Time</p>
                      <p className="font-semibold text-sm">{recipe.cooking_time.total}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Servings</p>
                      <p className="font-semibold text-sm">{recipe.servings}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 col-span-2 lg:col-span-1">
                    <ChefHat className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Difficulty</p>
                      <p className="font-semibold text-sm">{recipe.difficulty}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                    <ul className="space-y-1">
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="text-gray-700 text-sm flex items-start">
                          <span className="text-[#FF6B6B] mr-2">•</span>
                          <span>
                            {ingredient.amount} {ingredient.unit} {ingredient.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                    <ol className="space-y-3">
                      {recipe.steps.map((step, index) => (
                        <li key={index} className="text-gray-700 text-sm">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}