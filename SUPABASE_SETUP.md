# DeedsMaxing Supabase Setup

## 📋 Prerequisites

- A Supabase project at [supabase.com](https://supabase.com)
- **Email Auth** enabled (it's on by default)

## 📋 Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID npx expo start --clear
```

### Enable Realtime (optional, for live leaderboard)

Go to **Database > Replication** in your Supabase dashboard and enable replication for the `users` table.

## 🚀 Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup to complete

### 2. Run SQL Schema
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the SQL above
3. Click "Run" to create tables

### 3. Auth Settings
1. Go to **Authentication > Providers** in dashboard
2. Make sure **Email** provider is enabled
3. (Optional) Disable "Confirm email" under Email provider settings for faster testing

### 4. Get API Credentials
1. Go to Project Settings > API
2. Copy your **Project URL**
3. Copy your **anon/public key**

### 5. Configure Your App
1. Copy `.env.example` to `.env`
2. Add your Supabase URL and anon key
3. Restart your app

```bash
cp .env.example .env
# Edit .env with your credentials
npm start
```

### 6. Update app.json (Optional)
You can also add Supabase config to `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your-project-url.supabase.co",
      "supabaseAnonKey": "your-anon-key"
    }
  }
}
```

## ✅ How It Works

1. **Sign Up / Sign In** — email + password via Supabase Auth
2. **Onboarding** — user picks username, emoji, city (saved to `users` table keyed by `auth.uid()`)
3. **Auto-sync** — points, streaks, and daily stats sync to Supabase every 2 seconds
4. **Leaderboard** — fetches all rows from `users` ordered by `total_points DESC`
5. **Real-time** — postgres_changes subscription pushes live updates
6. **Sign Out** — clears session and local state, returns to auth screen

## 🔒 Security

- The **anon key** is safe to expose in client-side code
- RLS policies ensure users can only INSERT/UPDATE their own row (`auth.uid() = id`)
- Leaderboard data (SELECT) is public by design
- Passwords are handled entirely by Supabase Auth (never stored in app)

## 📊 Optional: Add Real-Time Subscriptions

For live leaderboard updates, add this to any component:

```typescript
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

// Subscribe to user changes
useEffect(() => {
  const channel = supabase
    .channel('users-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'users' },
      (payload) => {
        console.log('User updated:', payload);
        refreshLeaderboard();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## 🛠️ Troubleshooting

**"Failed to fetch leaderboard"**
- Check your Supabase URL and anon key
- Verify tables were created successfully
- Check RLS policies are enabled

**"User not syncing"**
- Make sure you completed onboarding
- Check console for error messages
- Verify internet connection

**Leaderboard not updating**
- App automatically syncs every 2 seconds after task changes
- Leaderboard refreshes every 5 minutes
- You can manually refresh by pulling down on leaderboard screen

---

Need help? Check [Supabase Documentation](https://supabase.com/docs)
