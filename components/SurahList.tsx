import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAllJuzList } from '@/lib/quran-api';
import Colors from '@/constants/colors';

interface JuzListProps {
  onJuzSelect: (juzNumber: number) => void;
}

export default function JuzList({ onJuzSelect }: JuzListProps) {
  const [juzList, setJuzList] = useState<any[]>([]);
  const [filteredJuzList, setFilteredJuzList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadJuzList();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredJuzList(juzList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = juzList.filter(
        (j) =>
          j.name.toLowerCase().includes(query) ||
          j.number.toString().includes(query)
      );
      setFilteredJuzList(filtered);
    }
  }, [searchQuery, juzList]);

  const loadJuzList = async () => {
    try {
      const data = getAllJuzList();
      setJuzList(data);
      setFilteredJuzList(data);
    } catch (error) {
      console.error('Failed to load Juz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJuzPress = (juzNumber: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onJuzSelect(juzNumber);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text style={styles.loadingText}>Loading Quran...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textDim} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Juz..."
          placeholderTextColor={Colors.textDim}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textDim} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredJuzList}
        keyExtractor={(item) => item.number.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleJuzPress(item.number)}
            style={({ pressed }) => [
              styles.juzCard,
              pressed && styles.juzCardPressed,
            ]}
          >
            <View style={styles.juzNumber}>
              <Text style={styles.juzNumberText}>{item.number}</Text>
            </View>

            <View style={styles.juzInfo}>
              <Text style={styles.juzName}>Juz {item.number}</Text>
              <Text style={styles.juzTranslation}>
                {item.name}
              </Text>
            </View>

            <View style={styles.juzArabic}>
              <Text style={styles.juzArabicName}>{item.arabic}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textDim}
            />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  juzCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  juzCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  juzNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  juzNumberText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
  },
  juzInfo: {
    flex: 1,
    gap: 4,
  },
  juzName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  juzTranslation: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSub,
  },
  juzArabic: {
    marginLeft: 8,
  },
  juzArabicName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.gold,
  },
});
