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
import { useApp, BADGE_DEFS, getRamadanDay } from '@/contexts/AppContext';

function StatBox({ label, value, icon, color }: { label: string; value: string | number; icon: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={18} color={color || Colors.gold} />
      <Text style={styles.statBoxVal}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, totalPoints, streak, badges, quranProgress,
    getDayCompletion, getEffectivePoints,
  } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const completion = getDayCompletion(today);
  const earnedBadges = BADGE_DEFS.filter(b => badges[b.id]?.earned);
  const ramadanDay = getRamadanDay();
  const effectivePoints = getEffectivePoints();
  const isLastTen = ramadanDay >= 20;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/badges'); }} style={styles.badgesBtn}>
            <Ionicons name="ribbon-outline" size={16} color={Colors.gold} />
            <Text style={styles.badgesBtnText}>Badges</Text>
          </Pressable>
        </View>

        <LinearGradient
          colors={['#1A3526', '#0A1F14']}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatar}>{profile.emoji}</Text>
          </View>
          <Text style={styles.name}>{profile.username}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textSub} />
            <Text style={styles.location}>{profile.city}</Text>
          </View>
          <View style={styles.statsGrid}>
            <StatBox label="Total Pts" value={effectivePoints.toLocaleString()} icon="star" color={Colors.gold} />
            <StatBox label="Streak" value={streak.current} icon="flame" color="#FF6B35" />
            <StatBox label="Best Streak" value={streak.best} icon="trophy" color={Colors.greenAccent} />
            <StatBox label="Badges" value={earnedBadges.length} icon="ribbon" color="#B87FE0" />
          </View>
          {isLastTen && (
            <View style={styles.multiplierBanner}>
              <Ionicons name="star" size={14} color={Colors.gold} />
              <Text style={styles.multiplierText}>2x Points Active — Last 10 Nights Bonus</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ramadan Summary</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{ramadanDay}</Text>
              <Text style={styles.summaryLabel}>Day of Ramadan</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{quranProgress.totalJuz}</Text>
              <Text style={styles.summaryLabel}>Juz Completed</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{completion}%</Text>
              <Text style={styles.summaryLabel}>Today's Tasks</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryVal}>{streak.freezesAvailable}</Text>
              <Text style={styles.summaryLabel}>Streak Freezes</Text>
            </View>
          </View>
        </View>

        <View style={styles.badgesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Badges</Text>
            <Pressable onPress={() => router.push('/badges')}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          {earnedBadges.length === 0 ? (
            <View style={styles.emptyBadges}>
              <Ionicons name="ribbon-outline" size={36} color={Colors.textDim} />
              <Text style={styles.emptyBadgesText}>Complete tasks to earn badges</Text>
            </View>
          ) : (
            <View style={styles.badgesList}>
              {earnedBadges.slice(0, 4).map(b => (
                <View key={b.id} style={styles.badgeCard}>
                  <View style={styles.badgeIconCircle}>
                    <Ionicons name={b.icon as any} size={22} color={Colors.gold} />
                  </View>
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeName}>{b.name}</Text>
                    <Text style={styles.badgeDesc}>{b.desc}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.greenAccent} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: Platform.OS === 'web' ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  badgesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  badgesBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
  profileCard: {
    marginHorizontal: 20, marginBottom: 20, borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.card, borderWidth: 2, borderColor: Colors.gold + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { fontSize: 44 },
  name: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  statBox: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  statBoxVal: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  statBoxLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: Colors.textSub, textAlign: 'center' },
  multiplierBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold + '20', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  multiplierText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
  statsSection: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  viewAll: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.gold },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48%', backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', gap: 4,
  },
  summaryVal: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.gold },
  summaryLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSub, textAlign: 'center' },
  badgesSection: { marginHorizontal: 20, marginBottom: 20 },
  emptyBadges: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 32,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  emptyBadgesText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  badgesList: { gap: 8 },
  badgeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  badgeIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.green, borderWidth: 1, borderColor: Colors.gold + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeInfo: { flex: 1, gap: 2 },
  badgeName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  badgeDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSub },
});
