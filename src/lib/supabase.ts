import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing Supabase URL environment variable');
}

// Create a function to get the client that will be called on each request
// This ensures we always have fresh credentials
export function getSupabaseClient() {
  // In production, we'll get the key from the server
  const key = window.localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: { 'x-application-name': 'mealbyme' }
    }
  });
}

// Export a default client for convenience
export const supabase = getSupabaseClient();

interface DatabaseError {
  error: string;
  data: any;
}

export const handleDatabaseError = (error: any, fallback: any = null): DatabaseError => {
  if (error?.message?.includes('Failed to fetch')) {
    return {
      error: 'Unable to connect. Please check your internet connection.',
      data: fallback
    };
  }

  if (error?.code === 'PGRST116') {
    return {
      error: 'No data found.',
      data: fallback
    };
  }

  if (error?.code === '42P01') {
    return {
      error: 'System error. Please try again later.',
      data: fallback
    };
  }

  return {
    error: 'An unexpected error occurred. Please try again.',
    data: fallback
  };
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError;
};