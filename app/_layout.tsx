import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { profile, isLoaded, supabaseUserId, authReady, profileRestoreCompleted } = useApp();

  useEffect(() => {
    if (!isLoaded || !authReady) return;

    if (!supabaseUserId) {
      // Not logged in — show auth screen
      router.replace('/auth');
      return;
    }

    // Wait for Supabase profile restore to finish before deciding
    if (!profileRestoreCompleted) return;

    if (!profile.hasCompletedOnboarding) {
      // Logged in but genuinely new user
      router.replace('/onboarding');
    } else {
      // Logged in and onboarded — go to main app
      router.replace('/(tabs)');
    }
  }, [isLoaded, authReady, supabaseUserId, profile.hasCompletedOnboarding, profileRestoreCompleted]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A1F14' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="dua" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="nights" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="badges" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
