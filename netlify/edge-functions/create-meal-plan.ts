# Copy content from api/create-meal-plan.ts
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
});

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(request: Request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Method not allowed',
          type: 'invalid_request_error',
        },
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { 
      servings,
      dietaryNeeds,
      fitnessGoal,
      dislikedIngredients,
      startDate,
      swapMeal
    } = await request.json();

    // Create the meal plan request
    const thread = await openai.beta.threads.create();
    
    const prompt = `Create a 3-day meal plan with the following requirements:

Preferences:
- Servings: ${servings}
- Dietary needs: ${dietaryNeeds.join(', ')}
- Fitness goal: ${fitnessGoal}
- Disliked ingredients: ${dislikedIngredients.join(', ')}
${swapMeal ? `- Only generate a new recipe for Day ${swapMeal.day} ${swapMeal.mealType}` : ''}

Requirements:
- Create meals for breakfast, lunch, dinner, and one snack for each day
- Suggest meals that use overlapping ingredients to reduce food waste
- Include detailed recipes for each meal
- Include nutritional information and dietary tags
- Generate a consolidated grocery list

Please provide the meal plan in JSON format with the following structure:
{
  "days": [
    {
      "dayNumber": 1,
      "meals": {
        "breakfast": {
          "title": "Recipe name",
          "ingredients": [{"name": "ingredient", "amount": "amount", "unit": "unit"}],
          "steps": [{"number": 1, "instruction": "step instruction"}],
          "cookingTime": {"prep": "time", "cook": "time", "total": "time"},
          "servings": number,
          "difficulty": "Easy/Medium/Hard",
          "dietaryInfo": {
            "calories": number,
            "protein": "amount in grams",
            "carbs": "amount in grams",
            "fats": "amount in grams",
            "fiber": "amount in grams",
            "sodium": "amount in mg",
            "dietaryTags": [],
            "allergens": []
          }
        },
        "lunch": { ... },
        "dinner": { ... },
        "snack": { ... }
      }
    }
  ],
  "groceryList": {
    "categories": [
      {
        "name": "Produce",
        "items": [
          {
            "name": "ingredient",
            "amount": "total amount",
            "unit": "unit",
            "usedIn": ["Day 1 Breakfast", "Day 2 Lunch"]
          }
        ]
      }
    ]
  }
}

IMPORTANT:
- Ensure all recipes align with the dietary needs and fitness goal
- Adjust all ingredient amounts to match the specified serving size
- Group similar ingredients in the grocery list
- Note which meals use shared ingredients
- Include only the JSON response, no additional text`;

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_ibEMjWkHPWvppwWqe6mWjLo0",
    });

    // Store the run ID and thread ID for later retrieval
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        start_date: startDate,
        end_date: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 2)).toISOString().split('T')[0],
        servings,
        dietary_needs: dietaryNeeds,
        fitness_goal: fitnessGoal,
        disliked_ingredients: dislikedIngredients
      })
      .select()
      .single();

    if (mealPlanError) throw mealPlanError;

    return new Response(
      JSON.stringify({
        mealPlanId: mealPlan.id,
        threadId: thread.id,
        runId: run.id,
        status: 'processing'
      }),
      {
        status: 202,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Error creating meal plan:', err);
    return new Response(
      JSON.stringify({
        error: {
          message: err instanceof Error ? err.message : 'An error occurred',
          type: 'api_error',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}