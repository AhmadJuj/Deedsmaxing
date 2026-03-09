import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, Platform,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { signUp, signIn } from '@/lib/supabase';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isValid = email.trim().includes('@') && password.length >= 8;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error: any) {
      // Map common Supabase error messages to friendlier text
      const msg: string = error?.message || '';
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setErrorMsg('This email is already registered. Try signing in instead.');
      } else if (msg.includes('Invalid login credentials')) {
        setErrorMsg('Incorrect email or password.');
      } else if (msg.includes('Email not confirmed')) {
        setErrorMsg('Please confirm your email before signing in.');
      } else if (msg.includes('Password should be')) {
        setErrorMsg(msg);
      } else {
        setErrorMsg(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#071510', '#0A1F14', '#112219']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="moon" size={44} color={Colors.gold} />
          </View>
          <Text style={styles.title}>DeedsMaxing</Text>
          <Text style={styles.subtitle}>
            {mode === 'signup'
              ? 'Create your account to track deeds & compete on the leaderboard'
              : 'Welcome back! Sign in to continue your Ramadan journey'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={t => { setEmail(t); setErrorMsg(''); }}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textDim}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={t => { setPassword(t); setErrorMsg(''); }}
                placeholder="Min 8 characters"
                placeholderTextColor={Colors.textDim}
                style={styles.input}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSub} />
              </Pressable>
            </View>
          </View>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#E57373" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || loading}
            style={({ pressed }) => [
              styles.submitBtn,
              (!isValid || loading) && styles.submitBtnDisabled,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={isValid && !loading ? ['#D4AF37', '#B8941E'] : ['#3A3A3A', '#2A2A2A']}
              style={styles.submitGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#0A1F14" />
              ) : (
                <>
                  <Text style={styles.submitText}>
                    {mode === 'signup' ? 'Create Account' : 'Sign In'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#0A1F14" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          style={styles.switchRow}
          disabled={loading}
        >
          <Text style={styles.switchText}>
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          </Text>
          <Text style={styles.switchLink}>
            {mode === 'signup' ? 'Sign In' : 'Sign Up'}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 12, marginBottom: 40 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.text },
  subtitle: {
    fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSub,
    textAlign: 'center', lineHeight: 20, maxWidth: 300,
  },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSub },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: 14, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, color: Colors.text, fontFamily: 'Inter_400Regular', fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
  },
  eyeBtn: { padding: 4 },
  submitBtn: { marginTop: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16,
  },
  submitText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A1F14' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 24,
  },
  switchText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  switchLink: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.gold },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#E5737315', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E5737340',
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#E57373', lineHeight: 18 },
});
