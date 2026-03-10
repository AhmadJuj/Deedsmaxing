import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, signOut } from '@/lib/supabase';
import {
  upsertUserProfile,
  updateUserStats,
  fetchLeaderboard,
  syncDailyStats,
  getUser,
} from '@/lib/supabase-service';
import { scheduleDailyStreakReminder } from '@/lib/notifications';

export type Mood = 'peaceful' | 'struggling' | 'motivated' | 'grateful';

export interface UserProfile {
  username: string;
  city: string;
  emoji: string;
  hasCompletedOnboarding: boolean;
  sehriTime: string;
  iftarTime: string;
}

export interface DailyTasks {
  salah: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean; taraweeh: boolean; tahajjud: boolean };
  quran: { pagesRead: number; juzCompleted: number };
  charity: { sadaqah: boolean; helpedSomeone: boolean; sharedFood: boolean };
  fasting: { keptFast: boolean; madeSehri: boolean; duaAtIftar: boolean };
  dhikr: { morningAdhkar: boolean; eveningAdhkar: boolean; subhanallah100: boolean; istighfar: boolean };
  family: { calledRelative: boolean; duaForParents: boolean; avoidedArgument: boolean };
}

export interface Streak {
  current: number;
  best: number;
  lastActiveDate: string;
  freezesAvailable: number;
  totalDaysActive: number;
}

export interface QuranProgress {
  totalJuz: number;
  dailyJuz: Record<string, number>;
}

export interface Reflection {
  note: string;
  mood: Mood | null;
}

export interface LastNights {
  [night: string]: { checklist: Record<string, boolean>; completed: boolean };
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  points: number;
  streak: number;
  emoji: string;
}

export interface Badge {
  earned: boolean;
  earnedDate?: string;
}

export interface AppState {
  profile: UserProfile;
  dailyTasks: Record<string, DailyTasks>;
  totalPoints: number;
  streak: Streak;
  quranProgress: QuranProgress;
  lastNights: LastNights;
  reflections: Record<string, Reflection>;
  niyyah: Record<string, string>;
  leaderboard: LeaderboardEntry[];
  badges: Record<string, Badge>;
  supabaseUserId: string | null;
  isLoaded: boolean;
}

interface AppContextValue extends AppState {
  updateProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (profile: UserProfile) => void;
  toggleTask: (category: keyof DailyTasks, task: string, value?: boolean | number) => void;
  setNiyyah: (date: string, niyyah: string) => void;
  addQuranJuz: (date: string, juz: number) => void;
  saveReflection: (date: string, note: string, mood: Mood | null) => void;
  toggleLastNightTask: (night: number, task: string) => void;
  getDayTasks: (date: string) => DailyTasks;
  getDayCompletion: (date: string) => number;
  getTodayPoints: () => number;
  getEffectivePoints: () => number;
  supabaseUserId: string | null;
  authReady: boolean;
  profileRestoreCompleted: boolean;
  syncToSupabase: () => Promise<void>;
  refreshLeaderboardFromSupabase: () => Promise<void>;
  resetAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

const TASKS_PER_DAY = 20;

const defaultTasks = (): DailyTasks => ({
  salah: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false, taraweeh: false, tahajjud: false },
  quran: { pagesRead: 0, juzCompleted: 0 },
  charity: { sadaqah: false, helpedSomeone: false, sharedFood: false },
  fasting: { keptFast: false, madeSehri: false, duaAtIftar: false },
  dhikr: { morningAdhkar: false, eveningAdhkar: false, subhanallah100: false, istighfar: false },
  family: { calledRelative: false, duaForParents: false, avoidedArgument: false },
});

const TASK_POINTS: Record<string, number> = {
  taraweeh: 25, tahajjud: 25, subhanallah100: 25, istighfar: 25,
};

function getTaskPoints(task: string): number {
  return TASK_POINTS[task] || 10;
}

function countTasksDone(tasks: DailyTasks): number {
  let count = 0;
  const s = tasks.salah;
  if (s.fajr) count++; if (s.dhuhr) count++; if (s.asr) count++;
  if (s.maghrib) count++; if (s.isha) count++; if (s.taraweeh) count++; if (s.tahajjud) count++;
  const c = tasks.charity;
  if (c.sadaqah) count++; if (c.helpedSomeone) count++; if (c.sharedFood) count++;
  const f = tasks.fasting;
  if (f.keptFast) count++; if (f.madeSehri) count++; if (f.duaAtIftar) count++;
  const d = tasks.dhikr;
  if (d.morningAdhkar) count++; if (d.eveningAdhkar) count++; if (d.subhanallah100) count++; if (d.istighfar) count++;
  const fam = tasks.family;
  if (fam.calledRelative) count++; if (fam.duaForParents) count++; if (fam.avoidedArgument) count++;
  if (tasks.quran.pagesRead > 0) count++;
  return count;
}

function calculateDayPoints(tasks: DailyTasks): number {
  let points = 0;
  const s = tasks.salah;
  if (s.fajr) points += 10; if (s.dhuhr) points += 10; if (s.asr) points += 10;
  if (s.maghrib) points += 10; if (s.isha) points += 10;
  if (s.taraweeh) points += 25; if (s.tahajjud) points += 25;
  const c = tasks.charity;
  if (c.sadaqah) points += 10; if (c.helpedSomeone) points += 10; if (c.sharedFood) points += 10;
  const f = tasks.fasting;
  if (f.keptFast) points += 10; if (f.madeSehri) points += 10; if (f.duaAtIftar) points += 10;
  const d = tasks.dhikr;
  if (d.morningAdhkar) points += 10; if (d.eveningAdhkar) points += 10;
  if (d.subhanallah100) points += 25; if (d.istighfar) points += 25;
  const fam = tasks.family;
  if (fam.calledRelative) points += 10; if (fam.duaForParents) points += 10; if (fam.avoidedArgument) points += 10;
  if (tasks.quran.pagesRead > 0) points += 10;
  if (tasks.quran.juzCompleted > 0) points += tasks.quran.juzCompleted * 20;
  return points;
}

// TEMPORARY: set a date string like '2026-03-10' to simulate a different day, or null for real date
// REMOVE before release!
const DEBUG_DATE_OVERRIDE: string | null = null;

function formatDate(d: Date): string {
  return DEBUG_DATE_OVERRIDE || d.toISOString().split('T')[0];
}

/** Returns today's date string — respects DEBUG_DATE_OVERRIDE for testing */
export function getToday(): string {
  return formatDate(new Date());
}

const RAMADAN_START = new Date('2026-02-18');

export function getRamadanDay(): number {
  const today = new Date();
  const diff = Math.floor((today.getTime() - RAMADAN_START.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(30, diff + 1));
}

export function getHijriDate(): string {
  const day = getRamadanDay();
  return `${day} Ramadan 1447 AH`;
}

function isLastTenNights(): boolean {
  return getRamadanDay() >= 20;
}

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', username: 'AbuBakr', points: 4250, streak: 17, emoji: '🌙' },
  { id: '2', username: 'FatimaZ', points: 3900, streak: 14, emoji: '⭐' },
  { id: '3', username: 'UmarF', points: 3650, streak: 13, emoji: '🕌' },
  { id: '4', username: 'Khadijah', points: 3400, streak: 12, emoji: '📿' },
  { id: '5', username: 'AliIbn', points: 3100, streak: 11, emoji: '🤲' },
  { id: '6', username: 'HassanM', points: 2800, streak: 10, emoji: '🌟' },
  { id: '7', username: 'ZainabS', points: 2500, streak: 9, emoji: '💫' },
  { id: '8', username: 'IbrahimA', points: 2200, streak: 7, emoji: '🌙' },
];

const BADGE_DEFS = [
  { id: 'first_deed', name: 'First Deed', desc: 'Complete your first task', icon: 'star' },
  { id: 'full_day', name: 'Full Day', desc: '100% tasks in a day', icon: 'checkmark-circle' },
  { id: 'night_warrior', name: 'Night Warrior', desc: 'Tahajjud 5 nights in a row', icon: 'moon' },
  { id: 'generous_soul', name: 'Generous Soul', desc: 'Sadaqah 7 days in a row', icon: 'heart' },
  { id: 'quran_keeper', name: 'Quran Keeper', desc: 'Read Quran 10 days in a row', icon: 'book' },
  { id: 'qadr_seeker', name: 'Laylatul Qadr Seeker', desc: 'Active all last 10 nights', icon: 'sparkles' },
  { id: 'khatam', name: 'Khatam', desc: 'Completed 30 juz', icon: 'trophy' },
  { id: 'iron_streak', name: 'Iron Streak', desc: '20 day streak', icon: 'flame' },
  { id: 'champion', name: 'Ramadan Champion', desc: 'Top 10 on leaderboard', icon: 'medal' },
];

export { BADGE_DEFS };

const defaultState: AppState = {
  profile: {
    username: '',
    city: '',
    emoji: '🌙',
    hasCompletedOnboarding: false,
    sehriTime: '05:00',
    iftarTime: '18:30',
  },
  dailyTasks: {},
  totalPoints: 0,
  streak: { current: 0, best: 0, lastActiveDate: '', freezesAvailable: 0, totalDaysActive: 0 },
  quranProgress: { totalJuz: 0, dailyJuz: {} },
  lastNights: {},
  reflections: {},
  niyyah: {},
  leaderboard: [],
  badges: Object.fromEntries(BADGE_DEFS.map(b => [b.id, { earned: false }])),
  supabaseUserId: null,
  isLoaded: false,
};

const STORAGE_KEY = '@deedsmaxing_state_v2';

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [authReady, setAuthReady] = useState(false);
  const [profileRestoreCompleted, setProfileRestoreCompleted] = useState(false);

  // Always-current ref to avoid stale closures in async sync functions
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, supabaseUserId: session?.user?.id ?? null }));
      setAuthReady(true);
    });
    // Also check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, supabaseUserId: session?.user?.id ?? null }));
      setAuthReady(true);
    }).catch(() => {
      // Network or config error — still mark auth as ready so routing can proceed
      setAuthReady(true);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          setState(prev => ({ ...prev, ...saved, isLoaded: true }));
        } catch {
          setState(prev => ({ ...prev, isLoaded: true }));
        }
      } else {
        setState(prev => ({ ...prev, isLoaded: true }));
      }
    });
  }, []);

  const persist = useCallback((newState: AppState) => {
    const { isLoaded, ...toSave } = newState;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  // Restore profile + stats from Supabase when user logs in
  // IMPORTANT: Always check Supabase DB even if local state says onboarding is complete
  // to handle OAuth users who may have stale local data from a different account
  useEffect(() => {
    if (!state.supabaseUserId || !state.isLoaded) {
      setProfileRestoreCompleted(false);
      return;
    }

    const userId = state.supabaseUserId;
    setProfileRestoreCompleted(false);
    getUser(userId).then(user => {
      if (user && user.username) {
        console.log('🔄 Restoring from Supabase:', {
          hasDaily: !!(user.daily_tasks && Object.keys(user.daily_tasks).length > 0),
          hasQuran: !!(user.quran_progress && typeof (user.quran_progress as any).totalJuz === 'number'),
          hasBadges: !!user.badges,
          hasReflections: !!(user.reflections && Object.keys(user.reflections).length > 0),
          hasNiyyah: !!(user.niyyah && Object.keys(user.niyyah).length > 0),
          points: user.total_points,
          streak: user.current_streak,
        });
        updateState(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            username: user.username,
            emoji: user.emoji || '\ud83c\udf19',
            city: user.city || '',
            hasCompletedOnboarding: true,
            sehriTime: prev.profile.sehriTime || '05:00',
            iftarTime: prev.profile.iftarTime || '18:30',
          },
          totalPoints: Math.max(user.total_points ?? 0, prev.totalPoints),
          streak: {
            ...prev.streak,
            current: Math.max(user.current_streak ?? 0, prev.streak.current),
            best: Math.max(user.best_streak ?? 0, prev.streak.best),
          },
          // Restore full app state from Supabase — prevents progress loss on logout/login
          // and prevents the exploit where resetting local state allows re-earning points
          dailyTasks: (user.daily_tasks && Object.keys(user.daily_tasks).length > 0)
            ? user.daily_tasks as Record<string, DailyTasks>
            : prev.dailyTasks,
          quranProgress: (user.quran_progress && typeof (user.quran_progress as any).totalJuz === 'number')
            ? user.quran_progress as QuranProgress
            : prev.quranProgress,
          lastNights: (user.last_nights && Object.keys(user.last_nights).length > 0)
            ? user.last_nights as LastNights
            : prev.lastNights,
          badges: user.badges
            ? { ...prev.badges, ...(user.badges as Record<string, Badge>) }
            : prev.badges,
          reflections: (user.reflections && Object.keys(user.reflections).length > 0)
            ? user.reflections as Record<string, Reflection>
            : prev.reflections,
          niyyah: (user.niyyah && Object.keys(user.niyyah).length > 0)
            ? user.niyyah as Record<string, string>
            : prev.niyyah,
        }));
      } else {
        // User doesn't exist in DB yet (new OAuth user)
        // Reset local state to force onboarding even if there's stale AsyncStorage data
        console.log('🆕 New user detected - resetting to onboarding');
        updateState(prev => ({
          ...defaultState,
          supabaseUserId: userId,
          isLoaded: true,
          profile: {
            ...defaultState.profile,
            hasCompletedOnboarding: false,
          },
        }));
      }
    }).catch(e => console.error('Failed to restore profile from Supabase:', e))
      .finally(() => setProfileRestoreCompleted(true));
  }, [state.supabaseUserId, state.isLoaded, updateState]);

  const updateProfile = useCallback((profile: Partial<UserProfile>) => {
    updateState(prev => ({ ...prev, profile: { ...prev.profile, ...profile } }));
  }, [updateState]);

  const completeOnboarding = useCallback((profile: UserProfile) => {
    updateState(prev => ({ ...prev, profile }));
  }, [updateState]);

  const getDayTasks = useCallback((date: string): DailyTasks => {
    return state.dailyTasks[date] || defaultTasks();
  }, [state.dailyTasks]);

  const getDayCompletion = useCallback((date: string): number => {
    const tasks = state.dailyTasks[date];
    if (!tasks) return 0;
    return Math.round((countTasksDone(tasks) / TASKS_PER_DAY) * 100);
  }, [state.dailyTasks]);

  const getTodayPoints = useCallback((): number => {
    const today = formatDate(new Date());
    const tasks = state.dailyTasks[today];
    if (!tasks) return 0;
    return calculateDayPoints(tasks);
  }, [state.dailyTasks]);

  const getEffectivePoints = useCallback((): number => {
    const ramadanDay = getRamadanDay();
    if (ramadanDay >= 20) return Math.round(state.totalPoints * 1.5);
    return state.totalPoints;
  }, [state.totalPoints]);

  const checkAndUpdateBadges = useCallback((newState: AppState): AppState => {
    const badges = { ...newState.badges };
    const today = formatDate(new Date());
    const tasks = newState.dailyTasks[today];

    if (tasks && countTasksDone(tasks) >= 1 && !badges.first_deed?.earned) {
      badges.first_deed = { earned: true, earnedDate: today };
    }
    if (tasks && getDayCompletion(today) >= 100 && !badges.full_day?.earned) {
      badges.full_day = { earned: true, earnedDate: today };
    }
    if (newState.quranProgress.totalJuz >= 30 && !badges.khatam?.earned) {
      badges.khatam = { earned: true, earnedDate: today };
    }
    if (newState.streak.current >= 20 && !badges.iron_streak?.earned) {
      badges.iron_streak = { earned: true, earnedDate: today };
    }
    return { ...newState, badges };
  }, [getDayCompletion]);

  const toggleTask = useCallback((category: keyof DailyTasks, task: string, value?: boolean | number) => {
    const today = formatDate(new Date());
    updateState(prev => {
      const existing = prev.dailyTasks[today] || defaultTasks();
      let updatedCategory: any;

      if (category === 'quran') {
        updatedCategory = { ...existing.quran, [task]: value ?? 0 };
      } else {
        const cat = existing[category] as any;
        updatedCategory = { ...cat, [task]: value !== undefined ? value : !cat[task] };
      }

      const updatedTasks: DailyTasks = { ...existing, [category]: updatedCategory };
      const dayPoints = calculateDayPoints(updatedTasks);
      const prevDayPoints = calculateDayPoints(existing);
      const pointsDiff = dayPoints - prevDayPoints;

      const newTotalPoints = Math.max(0, prev.totalPoints + pointsDiff);

      const allDailyTasks = { ...prev.dailyTasks, [today]: updatedTasks };
      const completion = Math.round((countTasksDone(updatedTasks) / TASKS_PER_DAY) * 100);

      let streak = { ...prev.streak };
      if (completion >= 50) {
        const lastDate = streak.lastActiveDate;
        if (lastDate !== today) {
          const yesterday = formatDate(new Date(Date.now() - 86400000));
          if (lastDate === yesterday || lastDate === '') {
            streak = { ...streak, current: streak.current + 1, lastActiveDate: today, totalDaysActive: streak.totalDaysActive + 1 };
          } else {
            streak = { ...streak, current: 1, lastActiveDate: today, totalDaysActive: streak.totalDaysActive + 1 };
          }
          if (streak.current > streak.best) streak.best = streak.current;
        }
      }

      const freezesEarned = Math.floor(streak.totalDaysActive / 7);
      streak.freezesAvailable = freezesEarned;

      const leaderboard = prev.leaderboard.map(e =>
        (prev.supabaseUserId && e.id === prev.supabaseUserId) ? { ...e, points: newTotalPoints, streak: streak.current } : e
      );

      const nextState = checkAndUpdateBadges({
        ...prev,
        dailyTasks: allDailyTasks,
        totalPoints: newTotalPoints,
        streak,
        leaderboard,
      });

      return nextState;
    });
  }, [updateState, checkAndUpdateBadges]);

  const setNiyyah = useCallback((date: string, niyyah: string) => {
    const safe = niyyah.slice(0, 200);
    updateState(prev => ({ ...prev, niyyah: { ...prev.niyyah, [date]: safe } }));
  }, [updateState]);

  const addQuranJuz = useCallback((date: string, juz: number) => {
    // Hard limits: max 5 juz per single log entry, max 5 juz per day total to prevent abuse
    const clamped = Math.min(Math.max(0, juz), 5);
    updateState(prev => {
      const prevJuz = prev.quranProgress.dailyJuz[date] || 0;
      const newDayTotal = Math.min(prevJuz + clamped, 5); // cap at 5 juz per day
      const diff = newDayTotal - prevJuz;
      if (diff <= 0) return prev; // nothing changed (daily cap reached)
      const totalJuz = Math.max(0, Math.min(30, prev.quranProgress.totalJuz + diff));
      const nextState = {
        ...prev,
        quranProgress: {
          totalJuz,
          dailyJuz: { ...prev.quranProgress.dailyJuz, [date]: newDayTotal },
        },
      };
      return checkAndUpdateBadges(nextState);
    });
  }, [updateState, checkAndUpdateBadges]);

  const saveReflection = useCallback((date: string, note: string, mood: Mood | null) => {
    const safe = note.slice(0, 200);
    updateState(prev => ({ ...prev, reflections: { ...prev.reflections, [date]: { note: safe, mood } } }));
  }, [updateState]);

  const toggleLastNightTask = useCallback((night: number, task: string) => {
    const key = `night_${night}`;
    updateState(prev => {
      const existing = prev.lastNights[key] || { checklist: {}, completed: false };
      const checklist = { ...existing.checklist, [task]: !existing.checklist[task] };
      const allDone = Object.values(checklist).every(Boolean);
      const lastNights = { ...prev.lastNights, [key]: { checklist, completed: allDone } };

      const oddNights = [21, 23, 25, 27, 29];
      const allOddDone = oddNights.every(n => prev.lastNights[`night_${n}`]?.completed);
      const badges = { ...prev.badges };
      if (allOddDone && !badges.qadr_seeker?.earned) {
        badges.qadr_seeker = { earned: true, earnedDate: formatDate(new Date()) };
      }

      return { ...prev, lastNights, badges };
    });
  }, [updateState]);

  const setAnonymousMode = useCallback((val: boolean) => {
    // no-op: anonymous mode removed
  }, []);

  // Supabase sync — reads from stateRef so it always has the latest data,
  // regardless of when the async call actually executes.
  const syncToSupabase = useCallback(async () => {
    const s = stateRef.current;
    if (!s.profile.hasCompletedOnboarding || !s.supabaseUserId) return;

    try {
      const userId = s.supabaseUserId;

      // Upsert user profile row (keyed to auth uid)
      await upsertUserProfile(userId, {
        username: s.profile.username,
        emoji: s.profile.emoji,
        city: s.profile.city,
      });

      // Update user stats + full app state (tasks, quran progress, badges, etc.)
      const result = await updateUserStats(userId, {
        totalPoints: s.totalPoints,
        currentStreak: s.streak.current,
        bestStreak: s.streak.best,
        dailyTasks: s.dailyTasks,
        quranProgress: s.quranProgress,
        lastNights: s.lastNights,
        badges: s.badges,
        reflections: s.reflections,
        niyyah: s.niyyah,
      });

      if (!result) {
        console.error('❌ updateUserStats returned null — JSONB columns may be missing. Run the ALTER TABLE migration.');
      }

      // Sync today's stats
      const today = formatDate(new Date());
      const tasks = s.dailyTasks[today];
      if (tasks) {
        const tasksCompleted = countTasksDone(tasks);
        const pointsEarned = calculateDayPoints(tasks);
        await syncDailyStats(userId, today, pointsEarned, tasksCompleted, TASKS_PER_DAY);
      }

      console.log('✅ Synced to Supabase');
    } catch (error) {
      console.error('❌ Error syncing to Supabase:', error);
    }
  }, []);

  const refreshLeaderboardFromSupabase = useCallback(async () => {
    try {
      const users = await fetchLeaderboard(100);
      
      if (users.length > 0) {
        const leaderboardEntries: LeaderboardEntry[] = users.map(user => ({
          id: user.id,
          username: user.username,
          points: user.total_points,
          streak: user.current_streak,
          emoji: user.emoji,
        }));

        // Add current user if not in list
        const userId = state.supabaseUserId;
        const userInList = userId && leaderboardEntries.some(e => e.id === userId);
        
        if (!userInList && state.profile.hasCompletedOnboarding) {
          leaderboardEntries.push({
            id: userId || 'me',
            username: state.profile.username,
            points: state.totalPoints,
            streak: state.streak.current,
            emoji: state.profile.emoji,
          });
        }

        // Sort by points
        leaderboardEntries.sort((a, b) => b.points - a.points || b.streak - a.streak);

        updateState(prev => ({ ...prev, leaderboard: leaderboardEntries }));
        console.log('✅ Leaderboard refreshed from Supabase');
      }
    } catch (error) {
      console.error('❌ Error refreshing leaderboard:', error);
    }
  }, [state.profile, state.totalPoints, state.streak, updateState]);

  // Auto-sync to Supabase when any tracked state changes (with debounce)
  // syncToSupabase reads from stateRef so it always has the latest data.
  useEffect(() => {
    if (!state.isLoaded || !state.profile.hasCompletedOnboarding) return;

    const timer = setTimeout(async () => {
      await syncToSupabase();
      refreshLeaderboardFromSupabase();
    }, 2000); // Debounce 2 seconds

    return () => clearTimeout(timer);
  }, [state.totalPoints, state.streak.current, state.quranProgress, state.dailyTasks, state.reflections, state.lastNights, state.niyyah, state.badges, state.isLoaded, state.profile.hasCompletedOnboarding, syncToSupabase, refreshLeaderboardFromSupabase]);

  // Refresh leaderboard periodically
  useEffect(() => {
    if (!state.isLoaded || !state.profile.hasCompletedOnboarding) return;

    // Refresh on mount
    refreshLeaderboardFromSupabase();

    // Refresh every 5 minutes
    const interval = setInterval(refreshLeaderboardFromSupabase, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isLoaded, state.profile.hasCompletedOnboarding]);

  // Schedule daily streak reminder notification
  useEffect(() => {
    if (!state.isLoaded || !state.profile.hasCompletedOnboarding) return;

    scheduleDailyStreakReminder(state.streak.current).catch(e =>
      console.warn('Failed to schedule streak notification:', e)
    );
  }, [state.isLoaded, state.profile.hasCompletedOnboarding, state.streak.current]);

  const resetAccount = useCallback(async () => {
    // Clear all app state
    await AsyncStorage.removeItem(STORAGE_KEY);
    // Reset to default state
    setState({ ...defaultState, isLoaded: true });
  }, []);

  const logout = useCallback(async () => {
    // Force a final sync before clearing state so nothing is lost
    // syncToSupabase reads from stateRef, so it has current data
    try {
      await syncToSupabase();
    } catch (e) {
      console.error('Final sync before logout failed:', e);
    }
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ ...defaultState, isLoaded: true, supabaseUserId: null });
  }, [syncToSupabase]);

  const value = useMemo<AppContextValue>(() => ({
    ...state,
    authReady,
    profileRestoreCompleted,
    updateProfile,
    completeOnboarding,
    toggleTask,
    setNiyyah,
    addQuranJuz,
    saveReflection,
    toggleLastNightTask,
    getDayTasks,
    getDayCompletion,
    getTodayPoints,
    getEffectivePoints,
    syncToSupabase,
    refreshLeaderboardFromSupabase,
    resetAccount,
    logout,
  }), [state, authReady, profileRestoreCompleted, updateProfile, completeOnboarding, toggleTask, setNiyyah, addQuranJuz, saveReflection, toggleLastNightTask, getDayTasks, getDayCompletion, getTodayPoints, getEffectivePoints, syncToSupabase, refreshLeaderboardFromSupabase, resetAccount, logout]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
