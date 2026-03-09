import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Supabase credentials from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase URL or Anon Key not found. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your EAS build env or .env file.');
}

// Create Supabase client with AsyncStorage for session persistence
// Use fallback placeholder values so createClient() doesn't throw with empty strings
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

// --- Auth helpers ---

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          emoji: string;
          city: string;
          total_points: number;
          current_streak: number;
          best_streak: number;
          daily_tasks: Record<string, any> | null;
          quran_progress: Record<string, any> | null;
          last_nights: Record<string, any> | null;
          badges: Record<string, any> | null;
          reflections: Record<string, any> | null;
          niyyah: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          emoji: string;
          city: string;
          total_points?: number;
          current_streak?: number;
          best_streak?: number;
          daily_tasks?: Record<string, any> | null;
          quran_progress?: Record<string, any> | null;
          last_nights?: Record<string, any> | null;
          badges?: Record<string, any> | null;
          reflections?: Record<string, any> | null;
          niyyah?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          emoji?: string;
          city?: string;
          total_points?: number;
          current_streak?: number;
          best_streak?: number;
          daily_tasks?: Record<string, any> | null;
          quran_progress?: Record<string, any> | null;
          last_nights?: Record<string, any> | null;
          badges?: Record<string, any> | null;
          reflections?: Record<string, any> | null;
          niyyah?: Record<string, any> | null;
          updated_at?: string;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          points_earned: number;
          tasks_completed: number;
          total_tasks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          points_earned: number;
          tasks_completed: number;
          total_tasks: number;
          created_at?: string;
        };
        Update: {
          points_earned?: number;
          tasks_completed?: number;
          total_tasks?: number;
        };
      };
    };
  };
}
