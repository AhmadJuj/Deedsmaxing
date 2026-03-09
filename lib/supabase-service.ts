import { supabase, Database } from './supabase';

type User = Database['public']['Tables']['users']['Row'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
type DailyStat = Database['public']['Tables']['daily_stats']['Insert'];

/**
 * Create (upsert) a user profile row keyed to the auth user's id
 */
export async function upsertUserProfile(authUserId: string, data: {
  username: string;
  emoji: string;
  city: string;
}): Promise<User | null> {
  try {
    // Try insert first (new user — needs default stats)
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUserId,
        username: data.username,
        emoji: data.emoji,
        city: data.city,
        total_points: 0,
        current_streak: 0,
        best_streak: 0,
      })
      .select()
      .single();

    if (!insertError) return inserted;

    // User already exists (conflict) — update profile fields only, don't reset stats
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        username: data.username,
        emoji: data.emoji,
        city: data.city,
      })
      .eq('id', authUserId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return null;
    }
    return updated;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // PGRST116 = no rows found — not a real error for new users
      if (error.code !== 'PGRST116') {
        console.error('Error fetching user:', error);
      }
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
}

/**
 * Update user stats (points, streak) and full app state (tasks, quran progress, etc.)
 * Storing the full state in Supabase prevents progress loss on logout and points abuse.
 */
export async function updateUserStats(
  userId: string,
  updates: {
    totalPoints?: number;
    currentStreak?: number;
    bestStreak?: number;
    dailyTasks?: Record<string, any>;
    quranProgress?: Record<string, any>;
    lastNights?: Record<string, any>;
    badges?: Record<string, any>;
    reflections?: Record<string, any>;
    niyyah?: Record<string, any>;
  }
): Promise<User | null> {
  try {
    const updateData: UserUpdate = { updated_at: new Date().toISOString() };
    if (updates.totalPoints !== undefined) updateData.total_points = updates.totalPoints;
    if (updates.currentStreak !== undefined) updateData.current_streak = updates.currentStreak;
    if (updates.bestStreak !== undefined) updateData.best_streak = updates.bestStreak;
    if (updates.dailyTasks !== undefined) updateData.daily_tasks = updates.dailyTasks;
    if (updates.quranProgress !== undefined) updateData.quran_progress = updates.quranProgress;
    if (updates.lastNights !== undefined) updateData.last_nights = updates.lastNights;
    if (updates.badges !== undefined) updateData.badges = updates.badges;
    if (updates.reflections !== undefined) updateData.reflections = updates.reflections;
    if (updates.niyyah !== undefined) updateData.niyyah = updates.niyyah;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user stats:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in updateUserStats:', error);
    return null;
  }
}

/**
 * Sync daily stats to Supabase
 */
export async function syncDailyStats(
  userId: string,
  date: string,
  pointsEarned: number,
  tasksCompleted: number,
  totalTasks: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('daily_stats')
      .upsert({
        user_id: userId,
        date,
        points_earned: pointsEarned,
        tasks_completed: tasksCompleted,
        total_tasks: totalTasks,
      }, { onConflict: 'user_id,date' });

    if (error) {
      console.error('Error syncing daily stats:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in syncDailyStats:', error);
    return false;
  }
}

/**
 * Fetch global leaderboard
 */
export async function fetchLeaderboard(limit: number = 100): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false })
      .order('current_streak', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in fetchLeaderboard:', error);
    return [];
  }
}

/**
 * Fetch leaderboard by city/region
 */
export async function fetchLeaderboardByCity(city: string, limit: number = 50): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('city', city)
      .order('total_points', { ascending: false })
      .order('current_streak', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching city leaderboard:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchLeaderboardByCity:', error);
    return [];
  }
}

/**
 * Get user's rank in global leaderboard
 */
export async function getUserRank(userId: string): Promise<number | null> {
  try {
    const user = await getUser(userId);
    if (!user) return null;

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('total_points', user.total_points);

    if (error) {
      console.error('Error getting user rank:', error);
      return null;
    }

    return (count || 0) + 1;
  } catch (error) {
    console.error('Error in getUserRank:', error);
    return null;
  }
}

/**
 * Search users by username
 */
export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}
