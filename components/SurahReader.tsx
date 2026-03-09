import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fetchJuz, JuzData, getJuzInfo } from '@/lib/quran-api';
import Colors from '@/constants/colors';

interface JuzReaderProps {
  juzNumber: number;
  onBack: () => void;
}

export default function JuzReader({ juzNumber, onBack }: JuzReaderProps) {
  const [juzData, setJuzData] = useState<JuzData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJuz();
  }, [juzNumber]);

  const loadJuz = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJuz(juzNumber);
      setJuzData(data);
    } catch (err) {
      console.error('Failed to load Juz:', err);
      setError('Failed to load Juz. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTranslation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTranslation(!showTranslation);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading Juz {juzNumber}...</Text>
        </View>
      </View>
    );
  }

  if (error || !juzData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.gold} />
          <Text style={styles.errorText}>{error || 'Failed to load Juz'}</Text>
          <Pressable onPress={loadJuz} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const juzInfo = getJuzInfo(juzNumber);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Juz {juzNumber}</Text>
          <Text style={styles.headerSubtitle}>
            {juzInfo.name} • {juzData.verses.length} verses
          </Text>
        </View>

        <Pressable onPress={toggleTranslation} style={styles.toggleButton}>
          <Ionicons
            name={showTranslation ? 'language' : 'language-outline'}
            size={24}
            color={Colors.gold}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Juz Header */}
        <View style={styles.juzHeader}>
          <Text style={styles.juzArabicName}>{juzInfo.arabic}</Text>
          <View style={styles.juzDivider} />
          <Text style={styles.juzName}>{juzInfo.name.toUpperCase()}</Text>
        </View>

        {/* Verses */}
        {juzData.verses.map((verse, index) => {
          // Check if this is the start of a new Surah
          const isNewSurah = index === 0 || verse.surahNumber !== juzData.verses[index - 1].surahNumber;
          const showBismillah = isNewSurah && verse.numberInSurah === 1 && verse.surahNumber !== 1 && verse.surahNumber !== 9;

          return (
            <View key={verse.number}>
              {/* Surah Header */}
              {isNewSurah && (
                <View style={styles.surahHeaderCard}>
                  <Text style={styles.surahNameArabic}>{verse.surahNameArabic}</Text>
                  <Text style={styles.surahNameEnglish}>{verse.surahName}</Text>
                </View>
              )}

              {/* Bismillah */}
              {showBismillah && (
                <View style={styles.bismillahCard}>
                  <Text style={styles.bismillahText}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </Text>
                </View>
              )}

              {/* Verse */}
              <View style={styles.verseCard}>
                <View style={styles.verseHeader}>
                  <View style={styles.verseInfo}>
                    <View style={styles.verseNumberBadge}>
                      <Text style={styles.verseNumberText}>{verse.numberInSurah}</Text>
                    </View>
                    <Text style={styles.verseSurah}>{verse.surahName}</Text>
                  </View>
                </View>

                <Text style={styles.verseArabic}>{verse.text}</Text>

                {showTranslation && verse.translation && (
                  <Text style={styles.verseTranslation}>{verse.translation}</Text>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSub,
    marginTop: 2,
  },
  toggleButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSub,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSub,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#0A1F14',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  juzHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  juzArabicName: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
    textAlign: 'center',
  },
  juzDivider: {
    width: 60,
    height: 2,
    backgroundColor: Colors.gold + '40',
    borderRadius: 1,
  },
  juzName: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textDim,
    letterSpacing: 1,
  },
  surahHeaderCard: {
    backgroundColor: Colors.green,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    gap: 4,
  },
  surahNameArabic: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
  },
  surahNameEnglish: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSub,
  },
  bismillahCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  bismillahText: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.gold,
    textAlign: 'center',
  },
  verseCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  verseNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
  },
  verseSurah: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textDim,
  },
  verseArabic: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    lineHeight: 40,
    textAlign: 'right',
  },
  verseTranslation: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSub,
    lineHeight: 22,
  },
});
