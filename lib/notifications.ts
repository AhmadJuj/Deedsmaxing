import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STREAK_CHANNEL_ID = 'streak-reminder';

const STREAK_MESSAGES = {
  start: [
    "🌙 Bismillah! Start your streak today — every deed counts!",
    "🌟 A new day, a fresh chance to earn rewards. Start your streak!",
    "📿 Don't miss out — begin your daily deeds and start a streak!",
    "🕌 The best deed is the one done consistently. Start today!",
  ],
  continue: [
    "🔥 Keep your {streak}-day streak alive! Don't break the chain!",
    "💪 MashaAllah, {streak} days strong! Log your deeds to keep going!",
    "⭐ Your {streak}-day streak is waiting — don't let it slip!",
    "🤲 {streak} days of consistency! Keep the momentum going today!",
    "🌙 Day {streak} of your streak — make it count!",
  ],
};

function getRandomMessage(messages: string[], streakDays?: number): string {
  const msg = messages[Math.floor(Math.random() * messages.length)];
  return streakDays != null ? msg.replace(/\{streak\}/g, String(streakDays)) : msg;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Sets up the Android notification channel (no-op on iOS) */
async function ensureChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(STREAK_CHANNEL_ID, {
      name: 'Streak Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/**
 * Schedules a daily streak reminder notification.
 * Cancels any existing streak notifications first to avoid duplicates.
 *
 * @param currentStreak - The user's current streak count
 * @param hour - Hour to send the notification (0-23), defaults to 20 (8 PM)
 * @param minute - Minute to send the notification (0-59), defaults to 0
 */
export async function scheduleDailyStreakReminder(
  currentStreak: number,
  hour: number = 20,
  minute: number = 0,
): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureChannel();

  // Cancel previous streak reminders
  await cancelStreakReminders();

  const messages = currentStreak > 0 ? STREAK_MESSAGES.continue : STREAK_MESSAGES.start;
  const body = getRandomMessage(messages, currentStreak > 0 ? currentStreak : undefined);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: currentStreak > 0 ? '🔥 Keep Your Streak!' : '🌙 Start Your Streak!',
      body,
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: STREAK_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** Cancels all scheduled streak reminder notifications */
export async function cancelStreakReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// TODO: Remove before release — test notification that fires in 5 seconds
export async function sendTestNotification(): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔥 Streak Reminder Test',
      body: 'If you see this, notifications are working! Keep your streak alive!',
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: STREAK_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}
