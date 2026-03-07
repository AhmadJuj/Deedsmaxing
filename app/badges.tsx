import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp, BADGE_DEFS } from '@/contexts/AppContext';

export default function BadgesScreen() {
  const insets = useSafeAreaInsets();
  const { badges } = useApp();
  const earnedCount = BADGE_DEFS.filter(b => badges[b.id]?.earned).length;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.topTitle}>Badges</Text>
          <Text style={styles.topSub}>{earnedCount}/{BADGE_DEFS.length} earned</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(earnedCount / BADGE_DEFS.length) * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {BADGE_DEFS.map(badge => {
            const badgeData = badges[badge.id];
            const earned = badgeData?.earned;
            return (
              <View key={badge.id} style={[styles.badgeCard, earned && styles.badgeCardEarned]}>
                <LinearGradient
                  colors={earned ? ['#1A3526', '#2D6A4F'] : ['#112219', '#0A1F14']}
                  style={styles.badgeGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.iconCircle, earned && styles.iconCircleEarned]}>
                    <Ionicons
                      name={badge.icon as any}
                      size={28}
                      color={earned ? Colors.gold : Colors.textDim}
                    />
                  </View>
                  <Text style={[styles.badgeName, earned && styles.badgeNameEarned]}>
                    {badge.name}
                  </Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                  {earned ? (
                    <View style={styles.earnedChip}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.greenAccent} />
                      <Text style={styles.earnedText}>Earned</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedChip}>
                      <Ionicons name="lock-closed" size={11} color={Colors.textDim} />
                      <Text style={styles.lockedText}>Locked</Text>
                    </View>
                  )}
                </LinearGradient>
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
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  topTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  topSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  progressBar: {
    marginHorizontal: 20, height: 4, backgroundColor: Colors.card,
    borderRadius: 2, marginBottom: 20, overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: Colors.gold, borderRadius: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  badgeCard: {
    width: '47%', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  badgeCardEarned: { borderColor: Colors.gold + '60' },
  badgeGrad: { padding: 20, alignItems: 'center', gap: 10, minHeight: 160 },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCircleEarned: {
    backgroundColor: Colors.green, borderColor: Colors.gold + '60',
  },
  badgeName: {
    fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textSub,
    textAlign: 'center',
  },
  badgeNameEarned: { color: Colors.text },
  badgeDesc: {
    fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textDim,
    textAlign: 'center', lineHeight: 16,
  },
  earnedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.greenAccent + '20', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.greenAccent + '40',
  },
  earnedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.greenAccent },
  lockedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  lockedText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textDim },
});
