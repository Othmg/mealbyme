/*
  # Add saved recipes functionality

  1. New Tables
    - `saved_recipes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `ingredients` (jsonb array)
      - `steps` (jsonb array)
      - `cooking_time` (jsonb)
      - `servings` (integer)
      - `difficulty` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `saved_recipes` table
    - Add policies for authenticated users to:
      - Insert their own recipes
      - Select their own recipes
      - Delete their own recipes
*/

CREATE TABLE IF NOT EXISTS saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  ingredients jsonb NOT NULL,
  steps jsonb NOT NULL,
  cooking_time jsonb NOT NULL,
  servings integer NOT NULL,
  difficulty text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own recipes"
  ON saved_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recipes"
  ON saved_recipes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
  ON saved_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE TRIGGER update_saved_recipes_updated_at
  BEFORE UPDATE ON saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();