# Google OAuth Setup Instructions

## ✅ What's Already Done
- expo-auth-session and expo-web-browser installed
- Code refactored to use Supabase OAuth flow with deep linking
- Native Google SDK removed
- Deep link scheme configured: `deedsmaxing://`
- Environment variables added to app.json (for Expo Go testing)
- Environment variables added to eas.json (for EAS builds)

## ⚠️ CRITICAL: Supabase Dashboard Setup Required

### 1. Configure Google Provider in Supabase
1. Go to https://obwrwabxuxdhpyfpmcao.supabase.co
2. Navigate to **Authentication** → **Providers** → **Google**
3. **Enable** the Google provider (toggle ON)
4. Paste your **Client ID**: `738334648353-esaa9ma7p7eng61rfpvocvtl0kcvm792.apps.googleusercontent.com`
5. Paste your **Client Secret** (from Google Cloud Console - Web client)
6. **IMPORTANT**: Check "Skip nonce checks" (required for mobile)
7. Click **Save**

### 2. Add Redirect URL to Supabase
1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Scroll to **Redirect URLs** section
3. Click **Add URL** and paste:
   ```
   deedsmaxing://auth/callback
   ```
4. Click **Save**

### 3. Get Client Secret from Google Cloud Console
If you don't have the Client Secret yet:
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your **Web application** OAuth client
3. Click on it to view details
4. Copy the **Client Secret**
5. Go back to Supabase and paste it in step 1

## 🧪 Testing in Expo Go

After completing Supabase setup above:

```bash
# Restart Expo to pick up new env vars
npx expo start -c
```

Then press `i` for iOS or `a` for Android.

## 🔧 Additional Steps (Already Complete)

### ✓ Environment Variables
- ✅ Web Client ID added to app.json (for local testing)
- ✅ Web Client ID added to eas.json (for builds)

### ✓ Code Setup
- ✅ OAuth flow implemented with deep linking
- ✅ WebBrowser configured for mobile auth

---

## 🔄 How It Works
1. User taps "Continue with Google" button
2. Opens browser with Google OAuth page
3. User signs in with Google
4. Browser redirects to `deedsmaxing://auth/callback` with tokens
5. App extracts tokens and creates Supabase session
6. User is authenticated!

--- 🐛 Troubleshooting

### Infinite Loading on Google Consent Screen
If the browser stays on "Will allow Supabase to access information..." and never redirects:

1. **Check Supabase Redirect URLs**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Make sure `deedsmaxing://auth/callback` is in the **Redirect URLs** list
   - If missing, add it and save

2. **Verify Web Client ID in Supabase**
   - Go to Authentication → Providers → Google
   - Make sure your **Web Client ID** and **Client Secret** are pasted correctly
   - Enable "Skip nonce checks"
   - Click Save

3. **Check eas.json**
   - Make sure `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` has your actual Web Client ID (not placeholder)

4. **Check Expo Go Logs**
   - Run `npx expo start`
   - Watch console for logs like:
     - `🔑 Redirect URL: deedsmaxing://auth/callback`
     - `🌐 Opening OAuth browser...`
     - `📱 Browser result: success` or `cancel`
   - If you see errors, they'll tell you what's wrong

5. **Restart Expo After Config Changes**
   ```bash
   # Stop current Expo dev server (Ctrl+C)
   # Restart with cache clear
   npx expo start -c
   ```

### Other Common Issues
- If "Invalid client" error: Double-check Web Client ID and Secret in Supabase
- If "redirect_uri_mismatch" error: Redirect URL in Supabase must exactly match `deedsmaxing://auth/callback`
- If browser doesn't close after success: Clear app data and try again
- If "nonce" error: Enable "Skip nonce checks" in Supabase Google provider settings
