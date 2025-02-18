export interface Recipe {
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
}