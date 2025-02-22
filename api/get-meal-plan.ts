import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Polyfill global for edge functions
declare global {
  var global: any;
}

if (typeof global === 'undefined') {
  (globalThis as any).global = globalThis;
}

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
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
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

    // Get query parameters
    const url = new URL(request.url);
    const mealPlanId = url.searchParams.get('mealPlanId');

    if (!mealPlanId) {
      throw new Error('Missing required parameters');
    }

    // Return the complete meal plan
    const { data: completeMealPlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        meal_plan_items (
          meal_type,
          day_number,
          meal_plan_recipes (*)
        ),
        meal_plan_groceries (
          items
        )
      `)
      .eq('id', mealPlanId)
      .single();

    if (fetchError) throw fetchError;

    return new Response(
      JSON.stringify(completeMealPlan),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    console.error('Error retrieving meal plan:', err);
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