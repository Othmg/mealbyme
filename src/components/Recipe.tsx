import React from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Users, ChefHat as DifficultyIcon, Leaf, AlertTriangle } from 'lucide-react';
import type { Recipe as RecipeType } from '../types';

interface RecipeProps {
  recipe?: RecipeType;
  standalone?: boolean;
}

export function Recipe({ recipe: propRecipe, standalone = true }: RecipeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  // Get recipe from either props or location state
  const recipe = propRecipe || location.state?.recipe;

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/meal-planner"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Meal Plan
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">Recipe not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle both cookingTime and cooking_time formats
  const cookingTime = recipe.cookingTime || recipe.cooking_time;
  const dietaryInfo = recipe.dietaryInfo || recipe.dietary_info;

  if (!cookingTime) {
    console.error('Recipe is missing cooking time information:', recipe);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              to="/meal-planner"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Meal Plan
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-gray-600">Invalid recipe format</p>
          </div>
        </div>
      </div>
    );
  }

  const RecipeContent = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>{cookingTime.total}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DifficultyIcon className="w-5 h-5" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </div>

      {dietaryInfo && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Calories</p>
              <p className="font-medium">{dietaryInfo.calories} kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Protein</p>
              <p className="font-medium">{dietaryInfo.protein}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Carbs</p>
              <p className="font-medium">{dietaryInfo.carbs}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fats</p>
              <p className="font-medium">{dietaryInfo.fats}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fiber</p>
              <p className="font-medium">{dietaryInfo.fiber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sodium</p>
              <p className="font-medium">{dietaryInfo.sodium}</p>
            </div>
          </div>

          {dietaryInfo.dietaryTags?.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Dietary Tags</p>
              <div className="flex flex-wrap gap-2">
                {dietaryInfo.dietaryTags.map((tag, index) => (
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

          {dietaryInfo.allergens?.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Allergens</p>
              <div className="flex flex-wrap gap-2">
                {dietaryInfo.allergens.map((allergen, index) => (
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

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="text-gray-700 flex items-start">
                <span className="text-[#FF6B6B] mr-2">•</span>
                <span>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.number} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#FF6B6B] to-[#FFB400] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {step.number}
                </span>
                <span className="text-gray-700">{step.instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );

  if (!standalone) {
    return <RecipeContent />;
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
            Back to Meal Plan
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <RecipeContent />
        </div>
      </div>
    </div>
  );
}