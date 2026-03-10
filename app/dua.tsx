import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useApp, getToday } from '@/contexts/AppContext';

const IFTAR_DUA = {
  urdu: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ\n\nپیاس بجھ گئی، رگیں تر ہو گئیں اور اللہ نے چاہا تو اجر بھی ثابت ہو گیا۔\n\n(ابو داؤد ٢٣٥٧)',
  english: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ\n\nThe thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills.\n\n(Abu Dawood 2357)',
};

const LYING_HADITH = {
  arabic: 'إِيَّاكُمْ وَالْكَذِبَ فَإِنَّ الْكَذِبَ يَهْدِي إِلَى الْفُجُورِ وَإِنَّ الْفُجُورَ يَهْدِي إِلَى النَّارِ وَمَا يَزَالُ الرَّجُلُ يَكْذِبُ وَيَتَحَرَّى الْكَذِبَ حَتَّى يُكْتَبَ عِنْدَ اللَّهِ كَذَّابًا',
  urdu: 'جھوٹ سے بچو کیونکہ جھوٹ گناہ کی طرف لے جاتا ہے اور گناہ جہنم کی طرف لے جاتا ہے۔ آدمی جھوٹ بولتا رہتا ہے اور جھوٹ کی تلاش کرتا رہتا ہے یہاں تک کہ اللہ کے ہاں اسے کذّاب (بڑا جھوٹا) لکھ دیا جاتا ہے۔',
  english: 'Beware of lying, for lying leads to wickedness and wickedness leads to the Hellfire. A man continues to lie and seeks out lies until he is written with Allah as a liar.',
  source: { urdu: 'صحیح مسلم ٢٦٠٧', english: 'Sahih Muslim 2607' },
};

const HADITH_OF_DAY = [
  { urdu: 'جو شخص جھوٹی باتیں اور برے کام روزے میں نہیں چھوڑتا، اللہ کو اس کے کھانا پینا چھوڑنے کی کوئی ضرورت نہیں۔', english: 'Whoever does not give up false statements and evil deeds while fasting, Allah does not need his leaving food and drink.', source: { urdu: 'بخاری', english: 'Bukhari' } },
  { urdu: 'جنت میں ایک دروازہ ہے جسے الریّان کہتے ہیں، اس سے صرف روزہ دار داخل ہوں گے۔', english: 'There is a gate in Paradise called Ar-Raiyan, and those who observe fasts will enter through it.', source: { urdu: 'بخاری', english: 'Bukhari' } },
  { urdu: 'جب رمضان آتا ہے تو جنت کے دروازے کھول دیے جاتے ہیں۔', english: 'When Ramadan begins, the gates of Paradise are opened.', source: { urdu: 'بخاری و مسلم', english: 'Bukhari & Muslim' } },
  { urdu: 'سب سے بہترین صدقہ وہ ہے جو رمضان میں دیا جائے۔', english: 'The best charity is that given in Ramadan.', source: { urdu: 'ترمذی', english: 'Tirmidhi' } },
  { urdu: 'تمہارے پاس رمضان کا مہینہ آیا ہے، یہ برکت کا مہینہ ہے جس میں اللہ تمہیں اپنی رحمت سے ڈھانپ لیتا ہے۔', english: 'Ramadan has come to you. It is a month of blessing, in which Allah covers you with blessing.', source: { urdu: 'احمد', english: 'Ahmad' } },
  { urdu: 'ابنِ آدم کا ہر عمل بڑھا کر دیا جاتا ہے، ایک نیکی دس گنا سے سات سو گنا تک بڑھائی جاتی ہے۔', english: 'Every action of the son of Adam is given manifold reward, each good deed receiving ten times its like, up to seven hundred times.', source: { urdu: 'مسلم', english: 'Muslim' } },
  { urdu: 'جو رمضان میں ایمان اور ثواب کی نیت سے رات کو عبادت کرے، اس کے پچھلے گناہ معاف کر دیے جاتے ہیں۔', english: 'He who prays during the night in Ramadan with faith and seeking his reward from Allah will have his past sins forgiven.', source: { urdu: 'بخاری و مسلم', english: 'Bukhari & Muslim' } },
];

function getTimeMs(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60 + m) * 60 * 1000;
}

function msToCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function useCountdown(targetTimeStr: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const nowMs = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000 + now.getSeconds() * 1000;
      const targetMs = getTimeMs(targetTimeStr);
      let diff = targetMs - nowMs;
      if (diff < 0) diff += 24 * 60 * 60 * 1000;
      setRemaining(diff);
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetTimeStr]);

  return remaining;
}

export default function DuaScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useApp();
  const [lang, setLang] = useState<'urdu' | 'english'>('urdu');
  const today = getToday();
  const dayIndex = new Date(today).getDate() % HADITH_OF_DAY.length;
  const hadith = HADITH_OF_DAY[dayIndex];

  const sehriRemaining = useCountdown(profile.sehriTime);
  const iftarRemaining = useCountdown(profile.iftarTime);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.topTitle}>Timings & Duas</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            onPress={() => setLang(l => l === 'urdu' ? 'english' : 'urdu')}
            style={styles.langToggle}
          >
            <Ionicons name="language" size={16} color={Colors.gold} />
            <Text style={styles.langToggleText}>{lang === 'urdu' ? 'EN' : 'اردو'}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.timersRow}>
          <LinearGradient
            colors={['#112219', '#1A3526']}
            style={styles.timerCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="moon-outline" size={24} color="#70B8E0" />
            <Text style={styles.timerLabel}>Sehri in</Text>
            <Text style={styles.timerValue}>{msToCountdown(sehriRemaining)}</Text>
            <Text style={styles.timerTime}>{profile.sehriTime}</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#1A2A12', '#243D1A']}
            style={styles.timerCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sunny-outline" size={24} color={Colors.gold} />
            <Text style={styles.timerLabel}>Iftar in</Text>
            <Text style={[styles.timerValue, { color: Colors.gold }]}>{msToCountdown(iftarRemaining)}</Text>
            <Text style={styles.timerTime}>{profile.iftarTime}</Text>
          </LinearGradient>
        </View>

        <View style={styles.duaSection}>
          <Text style={styles.sectionTitle}>{lang === 'urdu' ? 'جھوٹ کے بارے میں حدیث' : 'Hadith on Lying'}</Text>
          <View style={styles.hadithCard}>
            <View style={styles.quoteMark}>
              <Text style={styles.quoteChar}>"</Text>
            </View>
            <Text style={styles.hadithText}>{LYING_HADITH.arabic}</Text>
            <Text style={[styles.duaText, { marginTop: 12 }]}>{lang === 'urdu' ? LYING_HADITH.urdu : LYING_HADITH.english}</Text>
            <View style={styles.hadithSource}>
              <View style={styles.hadithSourceLine} />
              <Text style={styles.hadithSourceText}>{lang === 'urdu' ? LYING_HADITH.source.urdu : LYING_HADITH.source.english}</Text>
            </View>
          </View>
        </View>

        <View style={styles.duaSection}>
          <Text style={styles.sectionTitle}>{lang === 'urdu' ? 'افطار کی دعا' : 'Iftar Dua'}</Text>
          <View style={styles.duaCard}>
            <View style={styles.duaIconRow}>
              <Ionicons name="sunny" size={18} color={Colors.gold} />
              <Text style={styles.duaTitle}>{lang === 'urdu' ? 'افطار کے وقت' : 'When Breaking Fast'}</Text>
            </View>
            <Text style={styles.duaText}>{IFTAR_DUA[lang]}</Text>
          </View>
        </View>

        <View style={styles.hadithSection}>
          <Text style={styles.sectionTitle}>{lang === 'urdu' ? 'آج کی حدیث' : 'Hadith of the Day'}</Text>
          <View style={styles.hadithCard}>
            <View style={styles.quoteMark}>
              <Text style={styles.quoteChar}>"</Text>
            </View>
            <Text style={styles.hadithText}>{hadith[lang]}</Text>
            <View style={styles.hadithSource}>
              <View style={styles.hadithSourceLine} />
              <Text style={styles.hadithSourceText}>{hadith.source[lang]}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  topTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  langToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  langToggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
  timersRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  timerCard: {
    flex: 1, borderRadius: 20, padding: 20, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  timerLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSub },
  timerValue: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#70B8E0', letterSpacing: 1 },
  timerTime: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textDim },
  duaSection: { marginHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 12 },
  duaCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.cardBorder, gap: 14,
  },
  duaIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  duaTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textSub },
  duaText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 24 },
  hadithSection: { marginHorizontal: 20, marginBottom: 20 },
  hadithCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.gold + '30', gap: 16,
  },
  quoteMark: { alignItems: 'flex-start' },
  quoteChar: { fontSize: 56, fontFamily: 'Inter_700Bold', color: Colors.gold, lineHeight: 50 },
  hadithText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.text, lineHeight: 26, fontStyle: 'italic' },
  hadithSource: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hadithSourceLine: { flex: 1, height: 1, backgroundColor: Colors.gold + '40' },
  hadithSourceText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.gold },
});
