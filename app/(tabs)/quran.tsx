import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp, getToday } from '@/contexts/AppContext';
import JuzList from '@/components/SurahList';
import JuzReader from '@/components/SurahReader';

const QUICK_AMOUNTS = [0.25, 0.5, 1, 1.5, 2, 3];

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

type TabType = 'progress' | 'read';

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { quranProgress, addQuranJuz, badges } = useApp();
  const [inputJuz, setInputJuz] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [inputError, setInputError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  
  const today = getToday();
  const todayJuz = quranProgress.dailyJuz[today] || 0;
  const totalJuz = quranProgress.totalJuz;
  const progress = totalJuz / 30;

  const handleAdd = () => {
    const val = selectedAmount ?? parseFloat(inputJuz);
    if (isNaN(val) || val <= 0) return;
    if (val > 5) {
      setInputError('Maximum 5 juz per entry.');
      return;
    }
    const remaining = 30 - totalJuz;
    if (remaining <= 0) {
      setInputError('You have already completed the full Quran (30 juz).');
      return;
    }
    if (todayJuz >= 5) {
      setInputError('Daily limit reached (5 juz per day). Keep it up tomorrow!');
      return;
    }
    setInputError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addQuranJuz(today, val);
    setInputJuz('');
    setSelectedAmount(null);
  };

  const handleQuickPick = (amount: number) => {
    Haptics.selectionAsync();
    setSelectedAmount(amount);
    setInputJuz('');
    setInputError('');
  };

  const handleTabChange = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    if (tab === 'progress') {
      setSelectedJuz(null);
    }
  };

  const handleJuzSelect = (juzNumber: number) => {
    setSelectedJuz(juzNumber);
  };

  const handleBackToList = () => {
    setSelectedJuz(null);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      {/* Header with Tabs */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Quran</Text>
          <Text style={styles.subtitle}>Ramadan 1447 AH</Text>
        </View>
        
        <View style={styles.tabsContainer}>
          <Pressable
            onPress={() => handleTabChange('progress')}
            style={[styles.tab, activeTab === 'progress' && styles.tabActive]}
          >
            <Ionicons
              name={activeTab === 'progress' ? 'stats-chart' : 'stats-chart-outline'}
              size={20}
              color={activeTab === 'progress' ? Colors.gold : Colors.textDim}
            />
            <Text style={[styles.tabText, activeTab === 'progress' && styles.tabTextActive]}>
              Progress
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleTabChange('read')}
            style={[styles.tab, activeTab === 'read' && styles.tabActive]}
          >
            <Ionicons
              name={activeTab === 'read' ? 'book' : 'book-outline'}
              size={20}
              color={activeTab === 'read' ? Colors.gold : Colors.textDim}
            />
            <Text style={[styles.tabText, activeTab === 'read' && styles.tabTextActive]}>
              Read
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'progress' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
          <View style={styles.progressContent}>
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
              <View style={styles.inputHeaderRow}>
                <Text style={styles.inputTitle}>Log Today's Reading</Text>
                <View style={styles.todayBadge}>
                  <Ionicons name="book-outline" size={13} color={Colors.gold} />
                  <Text style={styles.todayBadgeText}>{todayJuz} juz today</Text>
                </View>
              </View>

              {/* Quick-pick chips */}
              <View style={styles.chipsRow}>
                {QUICK_AMOUNTS.filter(amt => amt <= Math.max(30 - totalJuz, 0.25)).map(amt => {
                  const isSelected = selectedAmount === amt;
                  return (
                    <Pressable
                      key={amt}
                      onPress={() => handleQuickPick(amt)}
                      style={({ pressed }) => [
                        styles.chip,
                        isSelected && styles.chipSelected,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {amt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Custom amount input */}
              <View style={styles.customRow}>
                <TextInput
                  value={inputJuz}
                  onChangeText={t => {
                    // Only allow numeric input, strip non-numeric except decimal point
                    const clean = t.replace(/[^0-9.]/g, '');
                    setInputJuz(clean);
                    setSelectedAmount(null);
                    setInputError('');
                  }}
                  placeholder="Custom amount (max 5 juz)"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="decimal-pad"
                  style={[styles.input, !!inputError && styles.inputError]}
                  maxLength={4}
                />
              </View>
              {!!inputError && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color="#E57373" />
                  <Text style={styles.errorText}>{inputError}</Text>
                </View>
              )}

              {/* Log button */}
              <Pressable
                onPress={handleAdd}
                disabled={selectedAmount === null && !inputJuz.trim()}
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={selectedAmount !== null || inputJuz.trim() ? ['#D4AF37', '#B8941E'] : ['#3a3a3a', '#2a2a2a']}
                  style={styles.addBtnFull}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={selectedAmount !== null || inputJuz.trim() ? '#0A1F14' : Colors.textDim} />
                  <Text style={[styles.addBtnText, !(selectedAmount !== null || inputJuz.trim()) && { color: Colors.textDim }]}>
                    {selectedAmount !== null ? `Log ${selectedAmount} Juz` : inputJuz.trim() ? `Log ${inputJuz} Juz` : 'Log Juz'}
                  </Text>
                </LinearGradient>
              </Pressable>
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
          </View>
        </ScrollView>
      ) : selectedJuz ? (
        <JuzReader juzNumber={selectedJuz} onBack={handleBackToList} />
      ) : (
        <JuzList onJuzSelect={handleJuzSelect} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  headerContainer: { backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  header: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub, marginTop: 2 },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  tabActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.gold + '40',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textDim,
  },
  tabTextActive: {
    color: Colors.gold,
  },
  progressContent: {
    paddingTop: 16,
  },
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
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 14,
  },
  inputHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  todayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.gold + '20', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  todayBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flex: 1, minWidth: 48,
    paddingVertical: 10, paddingHorizontal: 6,
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  chipSelected: { backgroundColor: Colors.green, borderColor: Colors.gold + '80' },
  chipText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textSub },
  chipTextSelected: { color: Colors.gold },
  customRow: {},
  input: {
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  inputError: { borderColor: '#E57373' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#E57373', flex: 1 },
  addBtnFull: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 15,
  },
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
