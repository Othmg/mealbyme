/*
  # Add meal planning tables

  1. New Tables
    - `meal_plans`
      - Stores user meal plans with metadata
    - `meal_plan_items`
      - Stores individual meals within a plan
    - `meal_plan_recipes`
      - Stores recipes associated with meal plan items
    - `meal_plan_groceries`
      - Stores generated grocery lists for meal plans

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  servings integer NOT NULL,
  dietary_needs text[] DEFAULT '{}',
  fitness_goal text,
  disliked_ingredients text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal_plan_items table
CREATE TABLE IF NOT EXISTS meal_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans ON DELETE CASCADE NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  day_number integer NOT NULL CHECK (day_number BETWEEN 1 AND 3),
  recipe_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(meal_plan_id, meal_type, day_number)
);

-- Create meal_plan_recipes table
CREATE TABLE IF NOT EXISTS meal_plan_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  ingredients jsonb NOT NULL,
  steps jsonb NOT NULL,
  cooking_time jsonb NOT NULL,
  servings integer NOT NULL,
  difficulty text NOT NULL,
  dietary_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal_plan_groceries table
CREATE TABLE IF NOT EXISTS meal_plan_groceries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid REFERENCES meal_plans ON DELETE CASCADE NOT NULL,
  items jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(meal_plan_id)
);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_groceries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own meal plans"
  ON meal_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans"
  ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON meal_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for meal_plan_items
CREATE POLICY "Users can view their meal plan items"
  ON meal_plan_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their meal plan items"
  ON meal_plan_items
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_items.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

-- Policies for meal_plan_recipes
CREATE POLICY "Users can view meal plan recipes"
  ON meal_plan_recipes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for meal_plan_groceries
CREATE POLICY "Users can view their meal plan groceries"
  ON meal_plan_groceries
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_groceries.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their meal plan groceries"
  ON meal_plan_groceries
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_plans
    WHERE meal_plans.id = meal_plan_groceries.meal_plan_id
    AND meal_plans.user_id = auth.uid()
  ));

-- Add triggers for updated_at
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_items_updated_at
  BEFORE UPDATE ON meal_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_recipes_updated_at
  BEFORE UPDATE ON meal_plan_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_groceries_updated_at
  BEFORE UPDATE ON meal_plan_groceries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();