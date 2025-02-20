import React from 'react';
import { Clock, Users, ChefHat as DifficultyIcon, Crown, Leaf, AlertTriangle } from 'lucide-react';
import { SaveRecipeButton } from './SaveRecipeButton';
import type { Recipe } from '../types';

interface RecipeDisplayProps {
  recipe: Recipe;
  user: any;
  isSubscribed: boolean;
  onShowSubscriptionModal: () => void;
  onSaveSuccess: () => void;
}

export function RecipeDisplay({
  recipe,
  user,
  isSubscribed,
  onShowSubscriptionModal,
  onSaveSuccess
}: RecipeDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{recipe.title}</h2>
        {user && <SaveRecipeButton recipe={recipe} isSubscribed={isSubscribed} onSaved={onSaveSuccess} />}
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

      {recipe.dietaryInfo && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg relative">
          {!isSubscribed && (
            <div className="absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center p-6">
                <Crown className="w-12 h-12 text-[#FFB400] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                <p className="text-gray-600 mb-4">Subscribe to see detailed nutritional information</p>
                <button
                  onClick={onShowSubscriptionModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-lg hover:from-[#FF5555] hover:to-[#E6A300] transition-colors"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nutritional Information</h3>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#FFB400]" />
              <span className="text-sm text-gray-600">Premium Feature</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Calories</p>
              <p className="font-medium">{recipe.dietaryInfo.calories} kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Protein</p>
              <p className="font-medium">{recipe.dietaryInfo.protein}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Carbs</p>
              <p className="font-medium">{recipe.dietaryInfo.carbs}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fats</p>
              <p className="font-medium">{recipe.dietaryInfo.fats}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fiber</p>
              <p className="font-medium">{recipe.dietaryInfo.fiber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sodium</p>
              <p className="font-medium">{recipe.dietaryInfo.sodium}</p>
            </div>
          </div>
          
          {recipe.dietaryInfo.dietaryTags.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Dietary Tags</p>
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryInfo.dietaryTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-sm"
                  >
                    <Leaf className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recipe.dietaryInfo.allergens.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Allergens</p>
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryInfo.allergens.map((allergen, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-sm"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
  );
}