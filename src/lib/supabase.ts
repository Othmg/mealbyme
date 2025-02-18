import { createClient } from '@supabase/supabase-js';

// Validate URL format
const isValidUrl = (urlString: string): boolean => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// Initialize Supabase client with required configuration
const initSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validate Supabase URL and key
  if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
    console.error('Invalid or missing Supabase URL. Please check your environment configuration.');
    throw new Error('Invalid Supabase URL configuration');
  }

  if (!supabaseAnonKey) {
    console.error('Missing Supabase Anon Key. Please check your environment configuration.');
    throw new Error('Missing Supabase authentication configuration');
  }

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
};

export const supabase = initSupabaseClient();

interface DatabaseError {
  error: string;
  data: any;
}

export const handleDatabaseError = (error: any, fallback: any = null): DatabaseError => {
  if (error?.message?.includes('Invalid Supabase URL')) {
    return {
      error: 'Database configuration error. Please contact support.',
      data: fallback
    };
  }

  if (error?.message?.includes('Missing Supabase authentication')) {
    return {
      error: 'Authentication configuration error. Please contact support.',
      data: fallback
    };
  }

  if (error?.message?.includes('Failed to fetch')) {
    return {
      error: 'Unable to connect to the database. Please check your internet connection or try again later.',
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