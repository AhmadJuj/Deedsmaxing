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
import { View, Image, StyleSheet } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { profile, isLoaded, supabaseUserId, authReady, profileRestoreCompleted } = useApp();
  const [splashVisible, setSplashVisible] = React.useState(true);
  const [appReady, setAppReady] = React.useState(false);

  // Enforce a minimum 2-second splash screen
  useEffect(() => {
    const timer = setTimeout(() => setAppReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!appReady || !isLoaded || !authReady) return;

    if (!supabaseUserId) {
      router.replace('/auth');
      setSplashVisible(false);
      SplashScreen.hideAsync();
      return;
    }

    if (!profileRestoreCompleted) return;

    if (!profile.hasCompletedOnboarding) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)');
    }
    setSplashVisible(false);
    SplashScreen.hideAsync();
  }, [appReady, isLoaded, authReady, supabaseUserId, profile.hasCompletedOnboarding, profileRestoreCompleted]);

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
      {splashVisible && (
        <View style={splashStyles.overlay}>
          <Image
            source={require('@/assets/images/chad1.png')}
            style={splashStyles.image}
            resizeMode="contain"
          />
        </View>
      )}
    </>
  );
}

const splashStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A1F14',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  image: {
    width: '80%',
    height: '80%',
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Splash is hidden in RootLayoutNav once auth + routing is ready.
  // Fonts must load first before we render anything.
  useEffect(() => {
    if (fontError) {
      // Hide splash on font error so the app isn't stuck
      SplashScreen.hideAsync();
    }
  }, [fontError]);

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
