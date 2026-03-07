import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp, LeaderboardEntry } from '@/contexts/AppContext';

type RankBadge = { label: string; color: string; minPoints: number };

const RANKS: RankBadge[] = [
  { label: 'Diamond', color: '#88CCEE', minPoints: 4000 },
  { label: 'Gold', color: '#D4AF37', minPoints: 2500 },
  { label: 'Silver', color: '#A8A8A8', minPoints: 1500 },
  { label: 'Bronze', color: '#CD7F32', minPoints: 0 },
];

function getRank(points: number): RankBadge {
  return RANKS.find(r => points >= r.minPoints) || RANKS[3];
}

function LeaderRow({ entry, rank, isMe, isAnonymous }: {
  entry: LeaderboardEntry; rank: number; isMe: boolean; isAnonymous: boolean;
}) {
  const { label, color } = getRank(entry.points);
  const displayName = (isMe && isAnonymous) ? 'Anonymous' : entry.username;

  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rankCol}>
        {rank <= 3 ? (
          <View style={[styles.topRank, { backgroundColor: ['#D4AF37', '#A8A8A8', '#CD7F32'][rank - 1] + '33' }]}>
            <Text style={[styles.topRankNum, { color: ['#D4AF37', '#A8A8A8', '#CD7F32'][rank - 1] }]}>
              {rank}
            </Text>
          </View>
        ) : (
          <Text style={styles.rankNum}>{rank}</Text>
        )}
      </View>
      <Text style={styles.avatar}>{entry.emoji}</Text>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.username, isMe && styles.usernameMe]}>{displayName}</Text>
          {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>You</Text></View>}
        </View>
        <View style={styles.streakRow}>
          <Ionicons name="flame" size={12} color={Colors.gold} />
          <Text style={styles.streakText}>{entry.streak} day streak</Text>
        </View>
      </View>
      <View style={styles.pointsCol}>
        <Text style={[styles.points, isMe && styles.pointsMe]}>{entry.points.toLocaleString()}</Text>
        <View style={[styles.rankBadge, { borderColor: color + '60', backgroundColor: color + '15' }]}>
          <Text style={[styles.rankLabel, { color }]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { leaderboard, profile, anonymousMode, setAnonymousMode, totalPoints, streak } = useApp();
  const [tab, setTab] = useState<'global' | 'friends'>('global');

  const sorted = [...leaderboard]
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const myRank = sorted.find(e => e.id === 'me')?.rank ?? sorted.length + 1;
  const { label: myRankLabel, color: myRankColor } = getRank(totalPoints);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.anonRow}>
            <Ionicons name="eye-off-outline" size={14} color={Colors.textSub} />
            <Text style={styles.anonLabel}>Anonymous</Text>
            <Switch
              value={anonymousMode}
              onValueChange={v => { Haptics.selectionAsync(); setAnonymousMode(v); }}
              trackColor={{ false: Colors.card, true: Colors.goldDim }}
              thumbColor={anonymousMode ? Colors.gold : Colors.textDim}
            />
          </View>
        </View>

        <LinearGradient
          colors={['#1A3526', '#112219']}
          style={styles.myCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.myEmoji}>{profile.emoji}</Text>
          <View style={styles.myInfo}>
            <Text style={styles.myName}>{anonymousMode ? 'Anonymous' : profile.username}</Text>
            <Text style={styles.myCity}>{profile.city}</Text>
          </View>
          <View style={styles.myStats}>
            <View style={styles.myStat}>
              <Text style={styles.myStatVal}>#{myRank}</Text>
              <Text style={styles.myStatLabel}>Rank</Text>
            </View>
            <View style={styles.myStatDivider} />
            <View style={styles.myStat}>
              <Text style={styles.myStatVal}>{totalPoints.toLocaleString()}</Text>
              <Text style={styles.myStatLabel}>Points</Text>
            </View>
            <View style={styles.myStatDivider} />
            <View style={styles.myStat}>
              <View style={styles.streakInline}>
                <Ionicons name="flame" size={14} color={Colors.gold} />
                <Text style={styles.myStatVal}>{streak.current}</Text>
              </View>
              <Text style={styles.myStatLabel}>Streak</Text>
            </View>
          </View>
          <View style={[styles.rankChip, { borderColor: myRankColor + '80', backgroundColor: myRankColor + '20' }]}>
            <Text style={[styles.rankChipText, { color: myRankColor }]}>{myRankLabel}</Text>
          </View>
        </LinearGradient>

        <View style={styles.tabRow}>
          {(['global', 'friends'] as const).map(t => (
            <Pressable
              key={t}
              onPress={() => { setTab(t); Haptics.selectionAsync(); }}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'global' ? 'Global' : 'Friends'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.listSection}>
          {tab === 'friends' ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.textDim} />
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyText}>Share your invite code to compete with friends</Text>
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Your invite code</Text>
                <Text style={styles.codeValue}>{profile.username?.toUpperCase().slice(0, 6) || 'RAM001'}</Text>
              </View>
            </View>
          ) : (
            sorted.map(entry => (
              <LeaderRow
                key={entry.id}
                entry={entry}
                rank={entry.rank}
                isMe={entry.id === 'me'}
                isAnonymous={anonymousMode}
              />
            ))
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
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  anonLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  myCard: {
    marginHorizontal: 20, marginBottom: 16, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', gap: 12,
  },
  myEmoji: { fontSize: 40 },
  myInfo: { alignItems: 'center', gap: 4 },
  myName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  myCity: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  myStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  myStat: { alignItems: 'center', gap: 2 },
  myStatVal: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.gold },
  myStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  myStatDivider: { width: 1, height: 32, backgroundColor: Colors.cardBorder },
  streakInline: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rankChip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  rankChipText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.gold },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSub },
  tabTextActive: { color: '#0A1F14' },
  listSection: { marginHorizontal: 20, gap: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 12, backgroundColor: Colors.card, borderRadius: 14,
    marginBottom: 6, borderWidth: 1, borderColor: Colors.cardBorder, gap: 10,
  },
  rowMe: { borderColor: Colors.gold + '60', backgroundColor: Colors.green },
  rankCol: { width: 32, alignItems: 'center' },
  topRank: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  topRankNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  rankNum: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textSub, textAlign: 'center' },
  avatar: { fontSize: 28 },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  usernameMe: { color: Colors.gold },
  meBadge: {
    backgroundColor: Colors.gold + '30', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1,
    borderWidth: 1, borderColor: Colors.gold + '60',
  },
  meBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.gold },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  pointsCol: { alignItems: 'flex-end', gap: 4 },
  points: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text },
  pointsMe: { color: Colors.gold },
  rankBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rankLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSub, textAlign: 'center' },
  codeCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.gold + '40', alignItems: 'center', gap: 8,
    marginTop: 8,
  },
  codeLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  codeValue: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.gold, letterSpacing: 4 },
});
