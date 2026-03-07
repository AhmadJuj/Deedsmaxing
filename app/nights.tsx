import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp, getRamadanDay } from '@/contexts/AppContext';

const ODD_NIGHTS = [21, 23, 25, 27, 29];
const ALL_NIGHTS = [20, 21, 22, 23, 24, 25, 26, 27, 28, 29];

const NIGHT_TASKS = [
  { id: 'tahajjud', label: 'Prayed Tahajjud', icon: 'moon', points: 50 },
  { id: 'quran', label: 'Read Quran', icon: 'book', points: 30 },
  { id: 'dua', label: 'Made long dua', icon: 'hand-left', points: 30 },
  { id: 'dhikr', label: 'Extended Dhikr', icon: 'radio-button-on', points: 20 },
  { id: 'itikaf', label: "Stayed in I'tikaf", icon: 'home', points: 100 },
];

export default function NightsScreen() {
  const insets = useSafeAreaInsets();
  const { lastNights, toggleLastNightTask, badges } = useApp();
  const ramadanDay = getRamadanDay();
  const isUnlocked = ramadanDay >= 20;

  const qadrBadgeEarned = badges['qadr_seeker']?.earned;
  const allOddDone = ODD_NIGHTS.every(n => lastNights[`night_${n}`]?.completed);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <LinearGradient
        colors={['#071510', '#0A1F14']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.topTitle}>Last 10 Nights</Text>
          <Text style={styles.topSub}>Seeking Laylatul Qadr</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
      </View>

      {!isUnlocked && (
        <View style={styles.lockBanner}>
          <Ionicons name="lock-closed" size={18} color={Colors.gold} />
          <Text style={styles.lockText}>
            Unlocks on 20th Ramadan — {20 - ramadanDay} days remaining
          </Text>
        </View>
      )}

      {qadrBadgeEarned && (
        <View style={styles.qadrBanner}>
          <Ionicons name="star" size={16} color={Colors.gold} />
          <Text style={styles.qadrBannerText}>Laylatul Qadr Achieved!</Text>
          <Ionicons name="star" size={16} color={Colors.gold} />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.nightsGrid}>
          {ALL_NIGHTS.map(night => {
            const key = `night_${night}`;
            const nightData = lastNights[key];
            const isOdd = ODD_NIGHTS.includes(night);
            const isActive = ramadanDay >= night;
            const isCurrent = ramadanDay === night;
            const completed = nightData?.completed;
            const checklist = nightData?.checklist || {};
            const doneCount = Object.values(checklist).filter(Boolean).length;

            return (
              <View
                key={night}
                style={[
                  styles.nightCard,
                  isOdd && styles.nightCardOdd,
                  isCurrent && styles.nightCardCurrent,
                  !isActive && styles.nightCardLocked,
                ]}
              >
                <View style={styles.nightHeader}>
                  <View style={styles.nightNumRow}>
                    {isOdd && <Ionicons name="star" size={12} color={Colors.gold} />}
                    <Text style={[styles.nightNum, isOdd && styles.nightNumOdd]}>Night {night}</Text>
                  </View>
                  {isOdd && <Text style={styles.qadrChance}>Possible Qadr</Text>}
                  {!isActive && <Ionicons name="lock-closed" size={14} color={Colors.textDim} />}
                  {completed && <Ionicons name="checkmark-circle" size={18} color={Colors.greenAccent} />}
                </View>

                {isActive && (
                  <>
                    <View style={styles.miniProgress}>
                      <View style={[styles.miniProgressFill, { width: `${(doneCount / NIGHT_TASKS.length) * 100}%` }]} />
                    </View>
                    <View style={styles.nightTasks}>
                      {NIGHT_TASKS.map(task => {
                        const done = !!checklist[task.id];
                        return (
                          <Pressable
                            key={task.id}
                            onPress={() => {
                              if (!isActive) return;
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              toggleLastNightTask(night, task.id);
                            }}
                            style={[styles.nightTask, done && styles.nightTaskDone]}
                          >
                            <View style={[styles.nightCheckbox, done && styles.nightCheckboxDone]}>
                              {done && <Ionicons name="checkmark" size={11} color="#0A1F14" />}
                            </View>
                            <Ionicons name={task.icon as any} size={13} color={done ? Colors.gold : Colors.textSub} />
                            <Text style={[styles.nightTaskLabel, done && styles.nightTaskLabelDone]}>
                              {task.label}
                            </Text>
                            <Text style={[styles.nightTaskPts, done && styles.nightTaskPtsEarned]}>
                              +{task.points}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                {!isActive && (
                  <Text style={styles.nightLockedText}>
                    {isOdd ? 'Seek Laylatul Qadr' : 'Coming soon'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  topTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text },
  topSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  lockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  lockText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textSub, flex: 1 },
  qadrBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.gold + '20', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  qadrBannerText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.gold },
  nightsGrid: { paddingHorizontal: 20, gap: 12 },
  nightCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 10,
  },
  nightCardOdd: { borderColor: Colors.gold + '50', backgroundColor: Colors.green },
  nightCardCurrent: { borderColor: Colors.gold, borderWidth: 2 },
  nightCardLocked: { opacity: 0.5 },
  nightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nightNumRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  nightNum: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text },
  nightNumOdd: { color: Colors.gold },
  qadrChance: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.gold },
  miniProgress: {
    height: 3, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden',
  },
  miniProgressFill: { height: 3, backgroundColor: Colors.gold, borderRadius: 2 },
  nightTasks: { gap: 6 },
  nightTask: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, paddingHorizontal: 4,
  },
  nightTaskDone: { opacity: 0.7 },
  nightCheckbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.textDim,
    alignItems: 'center', justifyContent: 'center',
  },
  nightCheckboxDone: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  nightTaskLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text },
  nightTaskLabelDone: { color: Colors.textDim, textDecorationLine: 'line-through' },
  nightTaskPts: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textDim },
  nightTaskPtsEarned: { color: Colors.gold },
  nightLockedText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textDim, fontStyle: 'italic' },
});
