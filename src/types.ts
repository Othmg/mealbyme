export interface Recipe {
  id?: string;
  title: string;
  ingredients: {
    name: string;
    amount: string;
    unit?: string;
  }[];
  steps: {
    number: number;
    instruction: string;
  }[];
  cookingTime: {
    prep: string;
    cook: string;
    total: string;
  };
  servings: number;
  difficulty: string;
  dietaryInfo?: {
    calories: number;
    protein: string;
    carbs: string;
    fats: string;
    fiber: string;
    sodium: string;
    dietaryTags: string[];
    allergens: string[];
  };
  fitnessGoal?: string;
  mealType?: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  servings: number;
  dietary_needs: string[];
  fitness_goal: string | null;
  disliked_ingredients: string[];
  created_at: string;
  updated_at: string;
  meal_plan_items: MealPlanItem[];
  meal_plan_groceries: MealPlanGrocery[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  day_number: number;
  recipe_id: string;
  meal_plan_recipes: Recipe;
}

export interface MealPlanGrocery {
  id: string;
  meal_plan_id: string;
  items: {
    categories: {
      name: string;
      items: {
        name: string;
        amount: string;
        unit: string;
        usedIn: string[];
      }[];
    }[];
  };
}