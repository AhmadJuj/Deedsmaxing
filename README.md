# DeedsMaxing

DeedsMaxing is a mobile-first Ramadan productivity app built with Expo + React Native.
It helps users track daily deeds, build streaks, monitor Quran progress, write reflections, and compare progress on a live leaderboard.

## Tech Stack

- React Native 0.81 + React 19
- Expo SDK 54
- Expo Router for file-based navigation
- TypeScript
- Supabase (Auth + Postgres)
- React Query
- AsyncStorage for local persistence
- Expo Notifications for daily reminders

## Core Features

- Email/password authentication and Google sign-in
- Onboarding flow (username, city, Sehri/Iftar times)
- Daily deed tracker with points and completion progress
- Niyyah (daily intention) entry
- Streak system and badge unlocking
- Quran progress tracker with juz logging and milestones
- Quran reading mode with Surah/Juz APIs
- Reflection journal with mood tracking
- Dua/timing screen with countdowns
- Live leaderboard synced with Supabase
- Last 10 nights bonus behavior

## Project Structure

```
app/
  _layout.tsx               # Root navigation + auth gating
  auth.tsx                  # Login/signup screen
  onboarding.tsx            # Initial profile setup
  dua.tsx                   # Duas + Sehri/Iftar countdowns
  nights.tsx                # Last 10 nights screen
  badges.tsx                # Badge gallery
  (tabs)/
    index.tsx               # Home dashboard and task tracking
    quran.tsx               # Quran progress + reading tab
    journal.tsx             # Reflection journal
    leaderboard.tsx         # Leaderboard view
    profile.tsx             # User profile + stats

components/
  SurahList.tsx
  SurahReader.tsx
  ErrorBoundary.tsx

contexts/
  AppContext.tsx            # Main app state + business logic

lib/
  supabase.ts               # Supabase client + auth helpers
  supabase-service.ts       # DB read/write helpers
  quran-api.ts              # Al-Quran Cloud API integration
  notifications.ts          # Local notification scheduling

android/
  ...                       # Native Android project (generated/prebuilt)
```

## Requirements

- Node.js 18+
- npm 9+
- Android Studio and Android SDK (for Android device/emulator)
- Xcode (for iOS development on macOS)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill `.env` values:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

4. Configure your Supabase database:

- Follow instructions in `SUPABASE_SETUP.md`
- Ensure required tables, policies, and auth providers are configured

5. Start the app:

```bash
npm run start
```

## Run on Devices

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

## Useful Scripts

- `npm run start` - Start Metro/Expo dev server
- `npm run android` - Build and run on Android
- `npm run ios` - Build and run on iOS
- `npm run lint` - Run lint checks
- `npm run lint:fix` - Auto-fix lint issues

## Data Model Overview

Supabase stores most app progress in a `users` table, including:

- profile fields (`username`, `emoji`, `city`)
- points and streak counters
- serialized progress objects:
  - daily tasks
  - quran progress
  - last-night checklists
  - badges
  - reflections
  - niyyah

There is also a `daily_stats` table for daily snapshots used by sync/analytics flows.

## State and Sync Behavior

- Local-first state lives in AsyncStorage (`@deedsmaxing_state_v2`)
- Supabase auth session is persisted via AsyncStorage
- On login, profile/progress are restored from Supabase
- App periodically syncs progress and stats to Supabase
- Leaderboard subscribes to realtime `users` updates

## Notification Behavior

The app schedules a daily streak reminder notification:

- Requests notification permission
- Creates an Android notification channel
- Schedules one daily reminder
- Clears old reminders before creating a new one

## Build Notes

- `patch-package` runs after install to apply patch fixes from `patches/`
- `android/` is included for native Android builds
- Expo Router typed routes are enabled

## Troubleshooting

### Supabase credentials missing

- Verify `.env` exists and variables are set correctly
- Restart the dev server after editing `.env`

### Auth succeeds but onboarding loops

- Confirm `users` table row is created for the signed-in user
- Check Supabase policies for inserts/updates by authenticated users

### Leaderboard not updating

- Confirm realtime is enabled for `users` table
- Check network connectivity and Supabase project status

### Notifications not showing

- Confirm notification permission is granted on the device
- Test on a physical device for more reliable notification behavior

## Security Notes

- Use the Supabase anon key on client side only
- Keep service-role keys out of the mobile app
- Prefer environment variables over hardcoded keys

## License

No license file is currently defined in this repository.
