import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const JUZ_NAMES = [
  'Alif Lam Mim', 'Sayaqul', 'Tilka', 'Lan Tana Lu', 'Wal Muhsanat',
  'La Yuhibbullah', 'Wa Iza Samiu', 'Wa Lau Annana', 'Qalal Mala', 'Wa Alamu',
  'Yaʼtadhiruna', 'Wa Ma Min Dabbah', 'Wa Ma Ubarri\'u', 'Rubama', 'Subhanallazi',
  'Qala Alam', 'Iqtaraba', 'Qad Aflaha', 'Wa Qalallazina', 'Aman Khalaq',
  'Utlu Ma Uhiya', 'Wa Manyaqnut', 'Wa Mali', 'Faman Azlamu', 'Ilayhi Yuraddu',
  'Ha Mim', 'Qala Fama Khatbukum', 'Qad Sami Allah', 'Tabaraka', 'Amma',
];

const MILESTONES = [
  { juz: 1, name: 'First Juz', icon: 'star', badge: 'first_juz' },
  { juz: 15, name: 'Halfway', icon: 'trophy', badge: 'halfway' },
  { juz: 30, name: 'Khatam', icon: 'checkmark-circle', badge: 'khatam' },
];

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const { quranProgress, addQuranJuz, badges } = useApp();
  const [inputJuz, setInputJuz] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const todayJuz = quranProgress.dailyJuz[today] || 0;
  const totalJuz = quranProgress.totalJuz;
  const progress = totalJuz / 30;

  const handleAdd = () => {
    const val = parseFloat(inputJuz);
    if (!isNaN(val) && val > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addQuranJuz(today, val);
      setInputJuz('');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Quran Progress</Text>
          <Text style={styles.subtitle}>Ramadan 1447 AH</Text>
        </View>

        <View style={styles.progressCard}>
          <LinearGradient
            colors={['#1A3526', '#112219']}
            style={styles.progressGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressJuz}>{totalJuz}<Text style={styles.progressJuzMax}>/30</Text></Text>
                <Text style={styles.progressLabel}>Juz Completed</Text>
              </View>
              <View style={styles.circleProg}>
                <Text style={styles.circlePercent}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
            <Text style={styles.barLabel}>{30 - totalJuz} juz remaining to complete the Quran</Text>
          </LinearGradient>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Log Today's Reading</Text>
          <Text style={styles.inputSub}>Today: {todayJuz} juz logged</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={inputJuz}
              onChangeText={setInputJuz}
              placeholder="0.5"
              placeholderTextColor={Colors.textDim}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Pressable onPress={handleAdd} style={styles.addBtn}>
              <LinearGradient
                colors={['#D4AF37', '#B8941E']}
                style={styles.addBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.addBtnText}>Log Juz</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View style={styles.milestonesSection}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestonesRow}>
            {MILESTONES.map(m => {
              const earned = totalJuz >= m.juz;
              return (
                <View key={m.juz} style={[styles.milestoneCard, earned && styles.milestoneEarned]}>
                  <Ionicons
                    name={m.icon as any}
                    size={24}
                    color={earned ? Colors.gold : Colors.textDim}
                  />
                  <Text style={[styles.milestoneName, earned && styles.milestoneNameEarned]}>
                    {m.name}
                  </Text>
                  <Text style={[styles.milestoneJuz, earned && styles.milestoneJuzEarned]}>
                    {m.juz} juz
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.juzSection}>
          <Text style={styles.sectionTitle}>Juz Tracker</Text>
          <View style={styles.juzGrid}>
            {JUZ_NAMES.map((name, i) => {
              const juzNum = i + 1;
              const done = totalJuz >= juzNum;
              return (
                <View key={juzNum} style={[styles.juzCell, done && styles.juzCellDone]}>
                  <Text style={[styles.juzNum, done && styles.juzNumDone]}>{juzNum}</Text>
                  {done && (
                    <Ionicons name="checkmark" size={10} color={Colors.gold} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub, marginTop: 2 },
  progressCard: { marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  progressGrad: { padding: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  progressJuz: { fontSize: 48, fontFamily: 'Inter_700Bold', color: Colors.gold },
  progressJuzMax: { fontSize: 24, color: Colors.textSub },
  progressLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  circleProg: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  circlePercent: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.gold },
  barContainer: { height: 8, backgroundColor: Colors.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  barFill: { height: 8, backgroundColor: Colors.gold, borderRadius: 4 },
  barLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  inputCard: {
    marginHorizontal: 20, marginBottom: 20,
    backgroundColor: Colors.card, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 12,
  },
  inputTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  inputSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  inputRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text,
    textAlign: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  addBtn: { borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { paddingHorizontal: 20, paddingVertical: 14 },
  addBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0A1F14' },
  milestonesSection: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 12 },
  milestonesRow: { flexDirection: 'row', gap: 10 },
  milestoneCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  milestoneEarned: { borderColor: Colors.gold + '80' },
  milestoneName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSub, textAlign: 'center' },
  milestoneNameEarned: { color: Colors.text },
  milestoneJuz: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textDim },
  milestoneJuzEarned: { color: Colors.gold },
  juzSection: { marginHorizontal: 20, marginBottom: 20 },
  juzGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  juzCell: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  juzCellDone: { backgroundColor: Colors.green, borderColor: Colors.gold + '40' },
  juzNum: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textSub },
  juzNumDone: { color: Colors.gold },
});
