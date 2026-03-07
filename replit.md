# DeedsMaxing — Ramadan Habit Tracker

## Overview
A full-featured Ramadan habit tracker built with Expo React Native (Expo Router). Dark theme with deep green and gold accents inspired by Islamic aesthetics.

## Architecture

### Frontend (Expo)
- **Framework**: Expo Router (file-based routing)
- **State**: React Context + AsyncStorage for persistence
- **UI**: Dark theme (#0A1F14 background, #D4AF37 gold accents)
- **Navigation**: Tab-based with 5 main tabs + stack modals

### Backend (Express)
- Minimal Express server serving landing page and API routes
- All app data stored in AsyncStorage (client-side)

## File Structure

```
app/
  _layout.tsx          # Root layout with providers, onboarding redirect
  onboarding.tsx       # First-launch onboarding (username, city, niyyah)
  dua.tsx              # Sehri/Iftar timers and duas (modal)
  nights.tsx           # Last 10 nights tracker (modal)
  badges.tsx           # Badges & achievements (modal)
  (tabs)/
    _layout.tsx        # Tab navigation (NativeTabs + ClassicTabs)
    index.tsx          # Home screen - deed checklists
    quran.tsx          # Quran progress tracker
    leaderboard.tsx    # Leaderboard with rank badges
    journal.tsx        # Reflection journal with mood tracker
    profile.tsx        # Profile, stats, badges

contexts/
  AppContext.tsx        # Global state management

constants/
  colors.ts            # Theme colors (dark green + gold)

server/
  index.ts             # Express server
  routes.ts            # API routes (minimal)
```

## Key Features

1. **Onboarding** - Username, city, Niyyah setup, prayer times
2. **Home Screen** - Hijri date, Niyyah card, deed categories with checklists
   - Salah (7 prayers), Quran, Charity, Fasting, Dhikr, Family
   - Points: 10 regular, 25 bonus tasks
3. **Quran Tracker** - Daily juz input, cumulative progress, juz grid
4. **Last 10 Nights** - Unlocks on 20th Ramadan, special checklists
5. **Streaks** - Daily streak, streak freezes (1/week), 2x last-10-nights bonus
6. **Leaderboard** - Local leaderboard + sample data, rank badges
7. **Badges** - 9 unlockable achievements
8. **Dua & Timers** - Sehri/Iftar countdown, duas, daily hadith
9. **Journal** - Daily reflection with mood tracker, Ramadan diary view
10. **Profile** - Stats overview, badges, Ramadan summary

## Ramadan Dates
- Ramadan 1447 AH: February 18 – March 19, 2026
- Current date context: March 7, 2026 = Day 17 of Ramadan

## Design
- Dark theme: bg #0A1F14, surface #112219, card #1A3526
- Gold: #D4AF37 (primary accent)
- Typography: Inter (all weights)
- Tab bar: NativeTabs (liquid glass on iOS 26+) / BlurView fallback

## Dependencies Added
- @react-native-async-storage/async-storage (pre-installed)
- expo-linear-gradient (pre-installed)
- expo-haptics (pre-installed)
