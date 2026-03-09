// Quran API service using Al-Quran Cloud API
// Documentation: https://alquran.cloud/api

const BASE_URL = 'https://api.alquran.cloud/v1';

export interface Verse {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surahNumber?: number;
  surahName?: string;
  surahNameArabic?: string;
  translation?: string;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  verses?: Verse[];
}

export interface SurahListResponse {
  code: number;
  status: string;
  data: Surah[];
}

export interface SurahDetailResponse {
  code: number;
  status: string;
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
    ayahs: Verse[];
  };
}

// Cache for API responses
const cache: { [key: string]: any } = {};

/**
 * Fetch all Surahs (list view)
 */
export async function fetchSurahList(): Promise<Surah[]> {
  const cacheKey = 'surah_list';
  
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}/surah`);
    const data: SurahListResponse = await response.json();
    
    if (data.code === 200) {
      cache[cacheKey] = data.data;
      return data.data;
    }
    throw new Error('Failed to fetch Surah list');
  } catch (error) {
    console.error('Error fetching Surah list:', error);
    throw error;
  }
}

/**
 * Fetch a specific Surah with Arabic text and English translation
 * @param surahNumber Surah number (1-114)
 * @param edition Edition identifier (e.g., 'ar.alafasy' for Arabic, 'en.sahih' for English)
 */
export async function fetchSurah(
  surahNumber: number,
  edition: string = 'quran-uthmani'
): Promise<Surah> {
  const cacheKey = `surah_${surahNumber}_${edition}`;
  
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/${edition}`);
    const data: SurahDetailResponse = await response.json();
    
    if (data.code === 200) {
      const surah: Surah = {
        number: data.data.number,
        name: data.data.name,
        englishName: data.data.englishName,
        englishNameTranslation: data.data.englishNameTranslation,
        numberOfAyahs: data.data.numberOfAyahs,
        revelationType: data.data.revelationType,
        verses: data.data.ayahs.map(ayah => ({
          number: ayah.number,
          text: ayah.text,
          numberInSurah: ayah.numberInSurah,
          juz: ayah.juz,
          page: ayah.page,
        })),
      };
      
      cache[cacheKey] = surah;
      return surah;
    }
    throw new Error('Failed to fetch Surah');
  } catch (error) {
    console.error(`Error fetching Surah ${surahNumber}:`, error);
    throw error;
  }
}

/**
 * Fetch both Arabic and translation for a Surah
 */
export async function fetchSurahWithTranslation(
  surahNumber: number
): Promise<{ arabic: Surah; translation: Surah }> {
  const cacheKey = `surah_dual_${surahNumber}`;
  
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const [arabic, translation] = await Promise.all([
      fetchSurah(surahNumber, 'quran-uthmani'),
      fetchSurah(surahNumber, 'en.sahih'),
    ]);
    
    const result = { arabic, translation };
    cache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error(`Error fetching Surah ${surahNumber} with translation:`, error);
    throw error;
  }
}

/**
 * Get Juz number for a specific Surah (approximate)
 */
export function getJuzForSurah(surahNumber: number): number {
  const juzMap: { [key: number]: number } = {
    1: 1, 2: 1, 3: 3, 4: 4, 5: 6, 6: 7, 7: 9, 8: 9, 9: 11, 10: 11,
    11: 12, 12: 13, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 16, 19: 16, 20: 16,
    21: 17, 22: 17, 23: 18, 24: 18, 25: 19, 26: 19, 27: 20, 28: 20, 29: 21, 30: 21,
    31: 21, 32: 21, 33: 22, 34: 22, 35: 22, 36: 23, 37: 23, 38: 23, 39: 24, 40: 24,
    41: 25, 42: 25, 43: 25, 44: 25, 45: 26, 46: 26, 47: 26, 48: 26, 49: 26, 50: 26,
    51: 27, 52: 27, 53: 27, 54: 27, 55: 27, 56: 27, 57: 27, 58: 28, 59: 28, 60: 28,
    61: 28, 62: 28, 63: 28, 64: 28, 65: 28, 66: 28, 67: 29, 68: 29, 69: 29, 70: 29,
    71: 29, 72: 29, 73: 29, 74: 29, 75: 29, 76: 29, 77: 29, 78: 30, 79: 30, 80: 30,
    81: 30, 82: 30, 83: 30, 84: 30, 85: 30, 86: 30, 87: 30, 88: 30, 89: 30, 90: 30,
    91: 30, 92: 30, 93: 30, 94: 30, 95: 30, 96: 30, 97: 30, 98: 30, 99: 30, 100: 30,
    101: 30, 102: 30, 103: 30, 104: 30, 105: 30, 106: 30, 107: 30, 108: 30, 109: 30, 110: 30,
    111: 30, 112: 30, 113: 30, 114: 30,
  };
  return juzMap[surahNumber] || 1;
}

export interface JuzData {
  number: number;
  name: string;
  arabicName: string;
  verses: Verse[];
}

/**
 * Juz names in Arabic transliteration
 */
const JUZ_NAMES = [
  { number: 1, name: 'Alif Lam Mim', arabic: 'الم' },
  { number: 2, name: 'Sayaqul', arabic: 'سَيَقُولُ' },
  { number: 3, name: 'Tilka al-Rusul', arabic: 'تِلْكَ الرُّسُلُ' },
  { number: 4, name: 'Lan Tanalu', arabic: 'لَن تَنَالُوا' },
  { number: 5, name: 'Wal Muhsanat', arabic: 'وَالْمُحْصَنَاتُ' },
  { number: 6, name: 'La Yuhibbullah', arabic: 'لَا يُحِبُّ اللَّهُ' },
  { number: 7, name: 'Wa Iza Samiu', arabic: 'وَإِذَا سَمِعُوا' },
  { number: 8, name: 'Wa Lau Annana', arabic: 'وَلَوْ أَنَّنَا' },
  { number: 9, name: 'Qal al-Mala', arabic: 'قَالَ الْمَلَأُ' },
  { number: 10, name: "Wa A'lamu", arabic: 'وَاعْلَمُوا' },
  { number: 11, name: 'Yataziruna', arabic: 'يَعْتَذِرُونَ' },
  { number: 12, name: 'Wa Ma Min Dabbah', arabic: 'وَمَا مِنْ دَابَّةٍ' },
  { number: 13, name: "Wa Ma Ubarri'u", arabic: 'وَمَا أُبَرِّئُ' },
  { number: 14, name: 'Rubama', arabic: 'رُبَمَا' },
  { number: 15, name: 'Subhanallazi', arabic: 'سُبْحَانَ الَّذِي' },
  { number: 16, name: 'Qala Alam', arabic: 'قَالَ أَلَمْ' },
  { number: 17, name: 'Iqtaraba', arabic: 'اقْتَرَبَ' },
  { number: 18, name: 'Qad Aflaha', arabic: 'قَدْ أَفْلَحَ' },
  { number: 19, name: 'Wa Qalallazina', arabic: 'وَقَالَ الَّذِينَ' },
  { number: 20, name: 'Amman Khalaq', arabic: 'أَمَّنْ خَلَقَ' },
  { number: 21, name: 'Utlu Ma Uhiya', arabic: 'اتْلُ مَا أُوحِيَ' },
  { number: 22, name: 'Wa Manyaqnut', arabic: 'وَمَنْ يَقْنُتْ' },
  { number: 23, name: 'Wa Mali', arabic: 'وَمَا لِي' },
  { number: 24, name: 'Faman Azlamu', arabic: 'فَمَنْ أَظْلَمُ' },
  { number: 25, name: 'Ilayhi Yuraddu', arabic: 'إِلَيْهِ يُرَدُّ' },
  { number: 26, name: 'Ha Mim', arabic: 'حم' },
  { number: 27, name: 'Qala Fama Khatbukum', arabic: 'قَالَ فَمَا خَطْبُكُمْ' },
  { number: 28, name: 'Qad Sami Allah', arabic: 'قَدْ سَمِعَ اللَّهُ' },
  { number: 29, name: 'Tabaraka', arabic: 'تَبَارَكَ' },
  { number: 30, name: 'Amma Yatasa\'alun', arabic: 'عَمَّ يَتَسَاءَلُونَ' },
];

/**
 * Get Juz information
 */
export function getJuzInfo(juzNumber: number) {
  return JUZ_NAMES[juzNumber - 1] || { number: juzNumber, name: `Juz ${juzNumber}`, arabic: '' };
}

/**
 * Fetch a complete Juz with Arabic and translation
 */
export async function fetchJuz(juzNumber: number): Promise<JuzData> {
  const cacheKey = `juz_${juzNumber}`;
  
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const [arabicResponse, translationResponse] = await Promise.all([
      fetch(`${BASE_URL}/juz/${juzNumber}/quran-uthmani`),
      fetch(`${BASE_URL}/juz/${juzNumber}/en.sahih`),
    ]);

    const arabicData = await arabicResponse.json();
    const translationData = await translationResponse.json();

    if (arabicData.code === 200 && translationData.code === 200) {
      const juzInfo = getJuzInfo(juzNumber);
      const verses: Verse[] = arabicData.data.ayahs.map((ayah: any, index: number) => ({
        number: ayah.number,
        text: ayah.text,
        numberInSurah: ayah.numberInSurah,
        juz: ayah.juz,
        page: ayah.page,
        surahNumber: ayah.surah.number,
        surahName: ayah.surah.englishName,
        surahNameArabic: ayah.surah.name,
        translation: translationData.data.ayahs[index]?.text || '',
      }));

      const result: JuzData = {
        number: juzNumber,
        name: juzInfo.name,
        arabicName: juzInfo.arabic,
        verses,
      };

      cache[cacheKey] = result;
      return result;
    }
    throw new Error('Failed to fetch Juz');
  } catch (error) {
    console.error(`Error fetching Juz ${juzNumber}:`, error);
    throw error;
  }
}

/**
 * Get list of all 30 Juz
 */
export function getAllJuzList() {
  return JUZ_NAMES;
}
