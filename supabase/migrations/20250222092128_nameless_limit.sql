/*
  # Add Advanced Customization Options

  1. Changes
    - Add new columns to user_preferences table:
      - fitness_goal (text)
      - dietary_needs (text[])
      - preferred_meal_types (text[])

  2. Security
    - Existing RLS policies will cover the new columns
*/

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS fitness_goal text CHECK (fitness_goal IN ('weight_loss', 'muscle_gain', 'maintenance')),
ADD COLUMN IF NOT EXISTS dietary_needs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_meal_types text[] DEFAULT '{}';