import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp, getHijriDate, getRamadanDay, getToday, DailyTasks } from '@/contexts/AppContext';

type Category = keyof DailyTasks;

const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'salah', label: 'Salah', icon: 'calendar', color: '#52B788' },
  { id: 'quran', label: 'Quran', icon: 'book', color: '#D4AF37' },
  { id: 'charity', label: 'Charity', icon: 'heart', color: '#E07070' },
  { id: 'fasting', label: 'Fasting', icon: 'water', color: '#70B8E0' },
  { id: 'dhikr', label: 'Dhikr', icon: 'radio-button-on', color: '#B87FE0' },
  { id: 'family', label: 'Family', icon: 'people', color: '#E0A870' },
];

const TASK_DEFS: Record<string, { label: string; points: number; bonus?: boolean }[]> = {
  salah: [
    { label: 'Fajr', points: 10 }, { label: 'Dhuhr', points: 10 }, { label: 'Asr', points: 10 },
    { label: 'Maghrib', points: 10 }, { label: 'Isha', points: 10 },
    { label: 'Taraweeh', points: 25, bonus: true }, { label: 'Tahajjud', points: 25, bonus: true },
  ],
  quran: [],
  charity: [
    { label: 'Gave Sadaqah', points: 10 }, { label: 'Helped Someone', points: 10 }, { label: 'Shared Food', points: 10 },
  ],
  fasting: [
    { label: 'Kept Fast', points: 10 }, { label: 'Made Sehri', points: 10 }, { label: 'Dua at Iftar', points: 10 },
  ],
  dhikr: [
    { label: 'Morning Adhkar', points: 10 }, { label: 'Evening Adhkar', points: 10 },
    { label: '100x Subhanallah', points: 25, bonus: true }, { label: 'Istighfar', points: 25, bonus: true },
  ],
  family: [
    { label: 'Called a Relative', points: 10 }, { label: 'Dua for Parents', points: 10 }, { label: 'Avoided Argument', points: 10 },
  ],
};

const TASK_KEYS: Record<string, string[]> = {
  salah: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'taraweeh', 'tahajjud'],
  charity: ['sadaqah', 'helpedSomeone', 'sharedFood'],
  fasting: ['keptFast', 'madeSehri', 'duaAtIftar'],
  dhikr: ['morningAdhkar', 'eveningAdhkar', 'subhanallah100', 'istighfar'],
  family: ['calledRelative', 'duaForParents', 'avoidedArgument'],
};

function AnimatedCheckbox({ checked, onToggle, label, points, bonus }: {
  checked: boolean; onToggle: () => void; label: string; points: number; bonus?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  return (
    <Pressable onPress={handlePress} style={styles.taskRow}>
      <Animated.View style={[styles.checkbox, checked && styles.checkboxChecked, { transform: [{ scale }] }]}>
        {checked && <Ionicons name="checkmark" size={14} color="#0A1F14" />}
      </Animated.View>
      <Text style={[styles.taskLabel, checked && styles.taskLabelDone]}>{label}</Text>
      {bonus && (
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusText}>BONUS</Text>
        </View>
      )}
      <Text style={[styles.taskPoints, checked && styles.taskPointsEarned]}>+{points}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, getDayTasks, getDayCompletion, getTodayPoints, toggleTask, niyyah, setNiyyah, streak } = useApp();
  const [activeCategory, setActiveCategory] = useState<Category>('salah');
  const [editingNiyyah, setEditingNiyyah] = useState(false);
  const [niyyahInput, setNiyyahInput] = useState('');
  const today = getToday();
  const tasks = getDayTasks(today);
  const completion = getDayCompletion(today);
  const todayPoints = getTodayPoints();
  const currentNiyyah = niyyah[today] || '';
  const ramadanDay = getRamadanDay();
  const isLastTen = ramadanDay >= 20;

  const handleNiyyahSave = () => {
    setNiyyah(today, niyyahInput);
    setEditingNiyyah(false);
  };

  const getTaskValue = (category: Category, key: string) => {
    const cat = tasks[category] as any;
    return cat[key];
  };

  const renderCategoryContent = () => {
    if (activeCategory === 'quran') {
      return <QuranDailyInput tasks={tasks} toggleTask={toggleTask} today={today} />;
    }
    const defs = TASK_DEFS[activeCategory];
    const keys = TASK_KEYS[activeCategory];
    return (
      <View style={styles.taskList}>
        {defs.map((def, i) => (
          <AnimatedCheckbox
            key={keys[i]}
            checked={!!getTaskValue(activeCategory, keys[i])}
            onToggle={() => toggleTask(activeCategory, keys[i])}
            label={def.label}
            points={def.points}
            bonus={def.bonus}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View>
            <Text style={styles.hijriDate}>{getHijriDate()}</Text>
            <Text style={styles.greeting}>Ramadan Mubarak, {profile.username}</Text>
          </View>
          <View style={styles.headerRight}>
            {isLastTen && (
              <Pressable onPress={() => router.push('/nights')} style={styles.nightsBadge}>
                <Ionicons name="star" size={12} color={Colors.gold} />
                <Text style={styles.nightsBadgeText}>Last 10</Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.push('/dua')} style={styles.duaBtn}>
              <Ionicons name="time" size={22} color={Colors.gold} />
            </Pressable>
          </View>
        </View>

        <View style={styles.niyyahCard}>
          <View style={styles.niyyahHeader}>
            <Ionicons name="heart" size={14} color={Colors.gold} />
            <Text style={styles.niyyahTitle}>Today's Niyyah</Text>
            <Pressable onPress={() => { setNiyyahInput(currentNiyyah); setEditingNiyyah(true); }}>
              <Ionicons name="pencil" size={14} color={Colors.textSub} />
            </Pressable>
          </View>
          {editingNiyyah ? (
            <View>
              <TextInput
                value={niyyahInput}
                onChangeText={setNiyyahInput}
                style={styles.niyyahInput}
                placeholder="Set today's intention..."
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={200}
                autoFocus
              />
              <View style={styles.niyyahActions}>
                <Pressable onPress={() => setEditingNiyyah(false)} style={styles.niyyahCancel}>
                  <Text style={styles.niyyahCancelText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleNiyyahSave} style={styles.niyyahSave}>
                  <Text style={styles.niyyahSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.niyyahText}>
              {currentNiyyah || 'Tap to set your intention for today...'}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayPoints}</Text>
            <Text style={styles.statLabel}>pts today</Text>
          </View>
          <View style={styles.statCardMain}>
            <View style={styles.progressRing}>
              <Text style={styles.progressText}>{completion}%</Text>
              <Text style={styles.progressSub}>done</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={16} color={Colors.gold} />
              <Text style={styles.statValue}>{streak.current}</Text>
            </View>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${completion}%` }]} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
          style={styles.categories}
        >
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => { setActiveCategory(cat.id); Haptics.selectionAsync(); }}
              style={[styles.categoryTab, activeCategory === cat.id && styles.categoryTabActive]}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={activeCategory === cat.id ? '#0A1F14' : cat.color}
              />
              <Text style={[styles.categoryLabel, activeCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.taskSection}>
          {renderCategoryContent()}
        </View>

        <View style={{ height: Platform.OS === 'web' ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

function QuranDailyInput({ tasks, toggleTask, today }: { tasks: DailyTasks; toggleTask: any; today: string }) {
  const [pages, setPages] = useState(String(tasks.quran.pagesRead || 0));
  const [juz, setJuz] = useState(String(tasks.quran.juzCompleted || 0));

  const save = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTask('quran', 'pagesRead', parseInt(pages) || 0);
    toggleTask('quran', 'juzCompleted', parseInt(juz) || 0);
  };

  return (
    <View style={styles.quranInput}>
      <View style={styles.quranRow}>
        <View style={styles.quranField}>
          <Text style={styles.quranFieldLabel}>Pages read today</Text>
          <TextInput
            value={pages}
            onChangeText={setPages}
            keyboardType="numeric"
            style={styles.quranTextInput}
            placeholder="0"
            placeholderTextColor={Colors.textDim}
          />
        </View>
        <View style={styles.quranField}>
          <Text style={styles.quranFieldLabel}>Juz completed today</Text>
          <TextInput
            value={juz}
            onChangeText={setJuz}
            keyboardType="numeric"
            style={styles.quranTextInput}
            placeholder="0"
            placeholderTextColor={Colors.textDim}
          />
        </View>
      </View>
      <Pressable onPress={save} style={styles.saveBtn}>
        <LinearGradient
          colors={['#D4AF37', '#B8941E']}
          style={styles.saveBtnGrad}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Text style={styles.saveBtnText}>Save Progress</Text>
          <Ionicons name="checkmark" size={18} color="#0A1F14" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
  },
  hijriDate: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.gold, marginBottom: 4 },
  greeting: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nightsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.gold,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  nightsBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
  duaBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  niyyahCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  niyyahHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  niyyahTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.gold, flex: 1 },
  niyyahText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 20 },
  niyyahInput: {
    backgroundColor: Colors.surface, borderRadius: 8, padding: 12,
    fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text,
    minHeight: 60, textAlignVertical: 'top',
  },
  niyyahActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  niyyahCancel: { paddingHorizontal: 12, paddingVertical: 6 },
  niyyahCancelText: { fontSize: 13, color: Colors.textSub, fontFamily: 'Inter_500Medium' },
  niyyahSave: {
    paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: Colors.gold, borderRadius: 8,
  },
  niyyahSaveText: { fontSize: 13, color: '#0A1F14', fontFamily: 'Inter_700Bold' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12,
    alignItems: 'center',
  },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  statCardMain: {
    flex: 1.2, backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.gold + '40',
  },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSub, marginTop: 2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressRing: { alignItems: 'center' },
  progressText: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.gold },
  progressSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  progressBarContainer: {
    marginHorizontal: 20, height: 4, backgroundColor: Colors.card,
    borderRadius: 2, marginBottom: 20, overflow: 'hidden',
  },
  progressBar: { height: 4, backgroundColor: Colors.gold, borderRadius: 2 },
  categories: { marginBottom: 0 },
  categoriesScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  categoryTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  categoryLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSub },
  categoryLabelActive: { color: '#0A1F14', fontFamily: 'Inter_700Bold' },
  taskSection: {
    marginHorizontal: 20,
    backgroundColor: Colors.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  taskList: { gap: 2 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.textDim,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  taskLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text },
  taskLabelDone: { color: Colors.textDim, textDecorationLine: 'line-through' },
  bonusBadge: {
    backgroundColor: Colors.goldDim + '44', borderWidth: 1, borderColor: Colors.goldDim,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  bonusText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.gold },
  taskPoints: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textDim },
  taskPointsEarned: { color: Colors.gold },
  quranInput: { gap: 16 },
  quranRow: { flexDirection: 'row', gap: 12 },
  quranField: { flex: 1, gap: 8 },
  quranFieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSub },
  quranTextInput: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text,
    textAlign: 'center', borderWidth: 1, borderColor: Colors.cardBorder,
  },
  saveBtn: { borderRadius: 12, overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0A1F14' },
});
