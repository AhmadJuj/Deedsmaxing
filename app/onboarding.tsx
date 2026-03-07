import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  Dimensions, Platform, KeyboardAvoidingView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const { width, height } = Dimensions.get('window');

const EMOJIS = ['🌙', '⭐', '🕌', '📿', '🤲', '🌟', '💫', '✨'];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌙');
  const [niyyah, setNiyyah] = useState('');
  const [sehriTime, setSehriTime] = useState('05:00');
  const [iftarTime, setIftarTime] = useState('18:30');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const steps = ['welcome', 'username', 'city', 'niyyah'];

  const nextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    if (step < steps.length - 1) {
      setTimeout(() => setStep(s => s + 1), 200);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const today = new Date().toISOString().split('T')[0];
    completeOnboarding({
      username: username.trim() || 'Believer',
      city: city.trim() || 'Mecca',
      emoji: selectedEmoji,
      hasCompletedOnboarding: true,
      sehriTime,
      iftarTime,
    });
    router.replace('/(tabs)');
  };

  const canContinue = () => {
    if (step === 1) return username.trim().length > 0;
    if (step === 2) return city.trim().length > 0;
    return true;
  };

  return (
    <LinearGradient colors={['#071510', '#0A1F14', '#112219']} style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dotsRow}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === step ? Colors.gold : Colors.textDim }
              ]}
            />
          ))}
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {step === 0 && <WelcomeStep />}
          {step === 1 && (
            <UsernameStep
              username={username}
              setUsername={setUsername}
              selectedEmoji={selectedEmoji}
              setSelectedEmoji={setSelectedEmoji}
            />
          )}
          {step === 2 && (
            <CityStep
              city={city}
              setCity={setCity}
              sehriTime={sehriTime}
              setSehriTime={setSehriTime}
              iftarTime={iftarTime}
              setIftarTime={setIftarTime}
            />
          )}
          {step === 3 && (
            <NiyyahStep niyyah={niyyah} setNiyyah={setNiyyah} />
          )}
        </Animated.View>

        <Pressable
          onPress={nextStep}
          disabled={!canContinue()}
          style={({ pressed }) => [
            styles.btn,
            !canContinue() && styles.btnDisabled,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={canContinue() ? ['#D4AF37', '#B8941E'] : ['#3A3A3A', '#2A2A2A']}
            style={styles.btnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>
              {step === steps.length - 1 ? 'Begin Ramadan' : 'Continue'}
            </Text>
            <Ionicons
              name={step === steps.length - 1 ? 'checkmark' : 'arrow-forward'}
              size={18}
              color="#0A1F14"
            />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function WelcomeStep() {
  return (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="moon" size={52} color={Colors.gold} />
      </View>
      <Text style={styles.title}>DeedsMaxing</Text>
      <Text style={styles.subtitle}>Your Ramadan companion for tracking deeds, building habits, and maximizing every blessed moment.</Text>
      <View style={styles.featureList}>
        {[
          { icon: 'checkbox-outline', text: 'Daily deed checklists' },
          { icon: 'flame-outline', text: 'Streaks & points system' },
          { icon: 'trophy-outline', text: 'Compete with others' },
          { icon: 'star-outline', text: 'Last 10 nights tracker' },
        ].map(f => (
          <View key={f.icon} style={styles.featureItem}>
            <Ionicons name={f.icon as any} size={18} color={Colors.gold} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function UsernameStep({ username, setUsername, selectedEmoji, setSelectedEmoji }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Who are you?</Text>
      <Text style={styles.subtitle}>Choose your avatar and enter your name for the leaderboard.</Text>
      <View style={styles.emojiGrid}>
        {['🌙', '⭐', '🕌', '📿', '🤲', '🌟', '💫', '✨'].map(e => (
          <Pressable
            key={e}
            onPress={() => setSelectedEmoji(e)}
            style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnSelected]}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Enter your name..."
          placeholderTextColor={Colors.textDim}
          style={styles.input}
          maxLength={20}
          autoCapitalize="words"
        />
      </View>
    </View>
  );
}

function CityStep({ city, setCity, sehriTime, setSehriTime, iftarTime, setIftarTime }: any) {
  return (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="location" size={36} color={Colors.gold} />
      </View>
      <Text style={styles.title}>Your City</Text>
      <Text style={styles.subtitle}>Set your city and prayer times for accurate sehri & iftar countdowns.</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="e.g. London, Dubai, Karachi..."
          placeholderTextColor={Colors.textDim}
          style={styles.input}
          maxLength={30}
        />
      </View>
      <View style={styles.timeRow}>
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Sehri Time</Text>
          <TextInput
            value={sehriTime}
            onChangeText={setSehriTime}
            placeholder="05:00"
            placeholderTextColor={Colors.textDim}
            style={styles.input}
            maxLength={5}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Iftar Time</Text>
          <TextInput
            value={iftarTime}
            onChangeText={setIftarTime}
            placeholder="18:30"
            placeholderTextColor={Colors.textDim}
            style={styles.input}
            maxLength={5}
          />
        </View>
      </View>
    </View>
  );
}

function NiyyahStep({ niyyah, setNiyyah }: any) {
  return (
    <View style={styles.stepContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="heart" size={36} color={Colors.gold} />
      </View>
      <Text style={styles.title}>Set Your Niyyah</Text>
      <Text style={styles.subtitle}>What is your intention for this Ramadan? This will be shown as your daily reminder.</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Your Niyyah (Intention)</Text>
        <TextInput
          value={niyyah}
          onChangeText={setNiyyah}
          placeholder="e.g. To strengthen my connection with Allah and complete the Quran..."
          placeholderTextColor={Colors.textDim}
          style={[styles.input, styles.inputMultiline]}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{niyyah.length}/200</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1, justifyContent: 'center' },
  stepContent: { gap: 20 },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  title: {
    fontSize: 32, fontFamily: 'Inter_700Bold',
    color: Colors.text, textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, fontFamily: 'Inter_400Regular',
    color: Colors.textSub, textAlign: 'center', lineHeight: 22,
  },
  featureList: { gap: 12, marginTop: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  featureText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text },
  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10,
  },
  emojiBtn: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBtnSelected: { borderColor: Colors.gold, backgroundColor: Colors.green },
  emojiText: { fontSize: 28 },
  inputContainer: { gap: 8 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSub },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.text,
  },
  inputMultiline: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
  charCount: { fontSize: 12, color: Colors.textDim, alignSelf: 'flex-end' },
  timeRow: { flexDirection: 'row' },
  btn: { borderRadius: 16, overflow: 'hidden' },
  btnDisabled: { opacity: 0.5 },
  btnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  btnText: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0A1F14' },
});
