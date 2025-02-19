import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with required configuration
const initSupabaseClient = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase configuration. Please connect to Supabase to enable all features.');
    return createClient(
      'https://placeholder-url.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'mealbyme-auth-token'
        }
      }
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'mealbyme-auth-token'
    }
  });
};

export const supabase = initSupabaseClient();

interface DatabaseError {
  error: string;
  data: any;
  isConfigError?: boolean;
  isAuthError?: boolean;
}

export const handleDatabaseError = (error: any, fallback: any = null): DatabaseError => {
  // Handle configuration errors first
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return {
      error: 'Please connect to Supabase to enable this feature.',
      data: fallback,
      isConfigError: true
    };
  }

  // Handle empty or undefined errors
  if (!error) {
    return {
      error: 'An unexpected error occurred. Please try again.',
      data: fallback
    };
  }

  // Handle authentication errors
  if (
    error?.code === 'session_not_found' ||
    error?.message?.includes('JWT expired') ||
    error?.message?.includes('Invalid JWT') ||
    error?.status === 401
  ) {
    // Clear the invalid session
    supabase.auth.signOut().catch(console.error);
    
    return {
      error: 'Your session has expired. Please sign in again.',
      data: fallback,
      isAuthError: true
    };
  }

  // Handle connection errors
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
    return { 
      error: 'Unable to connect to the database. Please check your internet connection.',
      data: fallback 
    };
  }

  // Handle specific database errors
  if (error?.code === 'PGRST116') {
    return { 
      error: 'No data found.',
      data: fallback 
    };
  }

  if (error?.code === '42P01') {
    return { 
      error: 'Database table not found. Please ensure the database is properly set up.',
      data: fallback 
    };
  }

  // Handle any other error with a proper message
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
      
      // Don't retry on auth errors or configuration errors
      if (error?.code === 'session_not_found' || 
          error?.message?.includes('JWT expired') ||
          error?.status === 401 ||
          !import.meta.env.VITE_SUPABASE_URL ||
          !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw error;
      }
      
      if (i === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError;
};