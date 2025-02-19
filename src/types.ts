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
}