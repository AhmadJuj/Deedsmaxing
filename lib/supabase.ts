import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
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

// Required for Supabase OAuth to work properly on mobile
WebBrowser.maybeCompleteAuthSession();

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

export async function signInWithGoogle() {
  try {
    // Use Linking.createURL which works correctly in both Expo Go and standalone builds
    // Expo Go: exp://192.168.x.x:8081/--/auth/callback
    // Standalone: deedsmaxing://auth/callback
    const redirectUrl = Linking.createURL('auth/callback');

    console.log('🔑 Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('❌ OAuth error:', error);
      throw error;
    }
    
    if (!data?.url) {
      throw new Error('No OAuth URL returned from Supabase');
    }

    console.log('🌐 Opening OAuth browser...');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    
    console.log('📱 Browser result:', result.type);

    if (result.type === 'success' && result.url) {
      console.log('✅ OAuth callback received');
      
      // Parse tokens from callback URL (format: deedsmaxing://auth/callback#access_token=xxx&refresh_token=yyy)
      const url = new URL(result.url);
      
      // Tokens can be in hash or search params depending on OAuth flow
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const searchParams = new URLSearchParams(url.search);
      
      const access_token = hashParams.get('access_token') || searchParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      
      if (access_token && refresh_token) {
        console.log('🔐 Setting session with tokens');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }
        
        console.log('✅ Google Sign-In successful');
      } else {
        console.warn('⚠️ No tokens found in callback URL');
        // Session might already be set by Supabase client
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          throw new Error('Authentication completed but no session found');
        }
      }
    } else if (result.type === 'cancel') {
      console.log('❌ User cancelled OAuth');
      throw new Error('Google Sign-In cancelled');
    } else {
      console.log('❌ OAuth failed:', result.type);
      throw new Error('Google Sign-In failed');
    }
    
    return data;
  } catch (err) {
    console.error('❌ signInWithGoogle error:', err);
    throw err;
  }
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
