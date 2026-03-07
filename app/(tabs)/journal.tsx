import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useApp, Mood } from '@/contexts/AppContext';

const MOODS: { id: Mood; icon: string; label: string; color: string }[] = [
  { id: 'peaceful', icon: 'leaf', label: 'Peaceful', color: '#52B788' },
  { id: 'motivated', icon: 'flash', label: 'Motivated', color: '#D4AF37' },
  { id: 'grateful', icon: 'heart', label: 'Grateful', color: '#E070A0' },
  { id: 'struggling', icon: 'cloud', label: 'Struggling', color: '#7090D0' },
];

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { reflections, saveReflection } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const todayReflection = reflections[today];

  const [note, setNote] = useState(todayReflection?.note || '');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(todayReflection?.mood || null);
  const [saved, setSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'diary'>('today');

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveReflection(today, note, selectedMood);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sortedEntries = Object.entries(reflections)
    .sort(([a], [b]) => b.localeCompare(a));

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Reflection</Text>
          <View style={styles.tabRow}>
            {(['today', 'diary'] as const).map(t => (
              <Pressable
                key={t}
                onPress={() => { setViewMode(t); Haptics.selectionAsync(); }}
                style={[styles.tabBtn, viewMode === t && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, viewMode === t && styles.tabTextActive]}>
                  {t === 'today' ? 'Today' : 'Diary'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {viewMode === 'today' ? (
          <View style={styles.todaySection}>
            <View style={styles.dateCard}>
              <Ionicons name="calendar-outline" size={14} color={Colors.gold} />
              <Text style={styles.dateText}>{formatDateDisplay(today)}</Text>
            </View>

            <View style={styles.moodSection}>
              <Text style={styles.moodTitle}>How are you feeling today?</Text>
              <View style={styles.moodGrid}>
                {MOODS.map(m => (
                  <Pressable
                    key={m.id}
                    onPress={() => { setSelectedMood(selectedMood === m.id ? null : m.id); Haptics.selectionAsync(); }}
                    style={[styles.moodCard, selectedMood === m.id && { borderColor: m.color, backgroundColor: m.color + '20' }]}
                  >
                    <Ionicons name={m.icon as any} size={22} color={selectedMood === m.id ? m.color : Colors.textDim} />
                    <Text style={[styles.moodLabel, selectedMood === m.id && { color: m.color }]}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.noteSection}>
              <Text style={styles.noteTitle}>Your reflection</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Write your thoughts, gratitude, or reflections for today..."
                placeholderTextColor={Colors.textDim}
                style={styles.noteInput}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
              <View style={styles.noteFooter}>
                <Text style={styles.charCount}>{note.length}/200</Text>
              </View>
            </View>

            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <LinearGradient
                colors={saved ? ['#52B788', '#2D6A4F'] : ['#D4AF37', '#B8941E']}
                style={styles.saveBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={18} color="#0A1F14" />
                <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Reflection'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.diarySection}>
            {sortedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="journal-outline" size={52} color={Colors.textDim} />
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyText}>Start writing your Ramadan diary today</Text>
              </View>
            ) : (
              sortedEntries.map(([date, reflection]) => {
                const mood = MOODS.find(m => m.id === reflection.mood);
                return (
                  <View key={date} style={styles.diaryCard}>
                    <View style={styles.diaryCardHeader}>
                      <Text style={styles.diaryDate}>{formatDateDisplay(date)}</Text>
                      {mood && (
                        <View style={[styles.moodChip, { borderColor: mood.color + '60', backgroundColor: mood.color + '15' }]}>
                          <Ionicons name={mood.icon as any} size={12} color={mood.color} />
                          <Text style={[styles.moodChipText, { color: mood.color }]}>{mood.label}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.diaryNote}>{reflection.note || <Text style={{ color: Colors.textDim, fontStyle: 'italic' }}>No note written</Text>}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: Platform.OS === 'web' ? 100 : 90 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8, gap: 12,
  },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text },
  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12,
    padding: 4, borderWidth: 1, borderColor: Colors.cardBorder, alignSelf: 'flex-start',
  },
  tabBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 10 },
  tabBtnActive: { backgroundColor: Colors.gold },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSub },
  tabTextActive: { color: '#0A1F14' },
  todaySection: { paddingHorizontal: 20, gap: 16 },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.cardBorder, alignSelf: 'flex-start',
  },
  dateText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text },
  moodSection: { gap: 12 },
  moodTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  moodGrid: { flexDirection: 'row', gap: 10 },
  moodCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  moodLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textSub },
  noteSection: { gap: 8 },
  noteTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  noteInput: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text,
    minHeight: 130, textAlignVertical: 'top', lineHeight: 22,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  noteFooter: { alignItems: 'flex-end' },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textDim },
  saveBtn: { borderRadius: 14, overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 8,
  },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A1F14' },
  diarySection: { paddingHorizontal: 20, gap: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSub },
  diaryCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 10,
  },
  diaryCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  diaryDate: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
  moodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  moodChipText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  diaryNote: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 21 },
});
