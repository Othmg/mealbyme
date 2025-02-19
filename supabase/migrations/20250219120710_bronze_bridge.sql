/*
  # Add dietary information to saved recipes

  1. Changes
    - Add dietary_info column to saved_recipes table to store nutritional information
    - Column type is JSONB to store structured dietary information including:
      - Calories
      - Macronutrients (protein, carbs, fats)
      - Fiber
      - Sodium
      - Dietary tags
      - Allergens

  2. Notes
    - Using JSONB for flexibility in dietary information structure
    - Maintains existing data by adding column as nullable
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'saved_recipes' 
    AND column_name = 'dietary_info'
  ) THEN
    ALTER TABLE saved_recipes 
    ADD COLUMN dietary_info JSONB;
  END IF;
END $$;