import { createClient } from '@supabase/supabase-js';

// Get environment variables at runtime
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

// Initialize Supabase client with required configuration
const initSupabaseClient = () => {
  try {
    const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
    const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

    return createClient(supabaseUrl, supabaseAnonKey, {
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
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
};

export const supabase = initSupabaseClient();

interface DatabaseError {
  error: string;
  data: any;
}

export const handleDatabaseError = (error: any, fallback: any = null): DatabaseError => {
  if (error?.message?.includes('Failed to fetch')) {
    return {
      error: 'Unable to connect to the database. Please check your internet connection.',
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
    error: error?.message || 'An unexpected error occurred. Please try again.',
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