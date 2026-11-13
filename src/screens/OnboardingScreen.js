import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { spacing } from '../theme/spacing';
import FilterChips from '../components/FilterChips';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import { hapticLight, hapticSuccess } from '../utils/haptics';

const SLIDES = [
  {
    accent: '#7C5CFC',
    eyebrow: 'DISCOVER WORDS',
    title: 'Find a fresh word every day',
    description: 'Explore a friendly English word garden with clear meanings, examples, and helpful tips.',
    image: require('../../assets/images/onboarding-1.png'),
  },
  {
    accent: '#FF7AA8',
    eyebrow: 'PRACTISE A LITTLE',
    title: 'Make new words stick',
    description: 'Flip a flashcard, try a quick quiz, and practise at your own pace—right on your device.',
    image: require('../../assets/images/onboarding-2.png'),
  },
  {
    accent: '#2EC4A6',
    eyebrow: 'GROW YOUR WAY',
    title: 'Celebrate every step',
    description: 'Set a small daily goal and see your learning habit grow, one word at a time.',
    image: require('../../assets/images/onboarding-3.png'),
  },
];

const LEVELS = [
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced', value: 'Advanced' },
];
const GOALS = [
  { label: '5 words', value: '5' },
  { label: '10 words', value: '10' },
  { label: '20 words', value: '20' },
];

export default function OnboardingScreen({ navigation }) {
  const { theme } = useTheme();
  const { completeOnboarding } = useWords();
  const [slide, setSlide] = useState(0);
  const [level, setLevel] = useState('Beginner');
  const [goal, setGoal] = useState('5');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const content = SLIDES[slide];
  const isLastSlide = slide === SLIDES.length - 1;

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await completeOnboarding(level, Number(goal));
      hapticSuccess();
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (saveError) {
      setError(saveError.message || 'Your preferences could not be saved. Please try again.');
      setSaving(false);
    }
  };

  const handleNext = () => {
    hapticLight();
    if (isLastSlide) {
      finish();
    } else {
      setSlide((current) => Math.min(current + 1, SLIDES.length - 1));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: `${theme.primary}18` }]}>
              <Ionicons name="leaf" size={20} color={theme.primary} />
            </View>
            <Text style={[styles.brandName, { color: theme.text }]}>WordBloom</Text>
          </View>
          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                hapticLight();
                finish();
              }}
              disabled={saving}
              style={styles.skipButton}
            >
              <Text style={[styles.skipText, { color: theme.muted }]}>Skip</Text>
            </Pressable>
          ) : null}
        </View>

        <ProgressBar progress={(slide + 1) / SLIDES.length} />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.center}>
            <View
              style={[
                styles.illustration,
                { backgroundColor: `${content.accent}18`, borderColor: `${content.accent}30` },
              ]}
            >
              <View style={[styles.illustrationOrb, { backgroundColor: `${content.accent}24` }]} />
              <Image source={content.image} style={styles.illustrationImage} resizeMode="contain" />
            </View>

            <View style={styles.copy}>
              <Text style={[styles.eyebrow, { color: content.accent }]}>{content.eyebrow}</Text>
              <Text style={[styles.title, { color: theme.text }]}>{content.title}</Text>
              <Text style={[styles.description, { color: theme.muted }]}>{content.description}</Text>
            </View>
          </View>

          {isLastSlide ? (
            <View style={styles.preferences}>
              <View style={styles.preferenceGroup}>
                <Text style={[styles.preferenceTitle, { color: theme.text }]}>Your learning level</Text>
                <FilterChips
                  options={LEVELS}
                  value={level}
                  onChange={(val) => {
                    hapticLight();
                    setLevel(val);
                  }}
                  accessibilityLabel="Choose your learning level"
                />
              </View>
              <View style={styles.preferenceGroup}>
                <Text style={[styles.preferenceTitle, { color: theme.text }]}>Your daily goal</Text>
                <FilterChips
                  options={GOALS}
                  value={goal}
                  onChange={(val) => {
                    hapticLight();
                    setGoal(val);
                  }}
                  accessibilityLabel="Choose your daily word goal"
                />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots} accessibilityLabel={`Slide ${slide + 1} of ${SLIDES.length}`}>
            {SLIDES.map((item, index) => (
              <View
                key={item.eyebrow}
                style={[
                  styles.dot,
                  { backgroundColor: index === slide ? theme.primary : theme.border },
                  index === slide && styles.activeDot,
                ]}
              />
            ))}
          </View>
          {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
          <PrimaryButton
            title={saving ? 'Getting things ready…' : isLastSlide ? 'Start learning' : 'Continue'}
            onPress={handleNext}
            disabled={saving}
          />
          {saving ? <ActivityIndicator color={theme.primary} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', gap: spacing.md },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  brandIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: '700' },
  skipButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  skipText: { fontSize: 14, fontWeight: '600' },
  scrollArea: { flex: 1 },
  scrollContent: { paddingVertical: spacing.sm, gap: spacing.md, flexGrow: 1, justifyContent: 'center' },
  center: { alignItems: 'center', gap: spacing.lg },
  illustration: { width: '100%', height: 210, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  illustrationOrb: { position: 'absolute', width: 170, height: 170, borderRadius: 85 },
  illustrationImage: { width: 160, height: 160 },
  copy: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  preferences: { gap: spacing.md },
  preferenceGroup: { gap: spacing.xs },
  preferenceTitle: { fontSize: 14, fontWeight: '700' },
  footer: { gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  activeDot: { width: 22 },
  error: { fontSize: 13, textAlign: 'center' },
});
