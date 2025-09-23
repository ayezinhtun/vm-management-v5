import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  return {
    success: false,
    error: error.message || `Failed to ${operation}`,
    data: null
  };
};

// Helper function for successful responses
export const handleSupabaseSuccess = (data: any, operation: string) => {
  return {
    success: true,
    error: null,
    data
  };
};