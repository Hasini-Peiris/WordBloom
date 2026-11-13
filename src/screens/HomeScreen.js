import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import categories from '../data/categories.json';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { getLocalDateKey, getGreeting, getWordOfTheDay } from '../utils/date';
import { getCurrentStreak } from '../utils/streak';
import { radii, spacing } from '../theme/spacing';
import ProgressBar from '../components/ProgressBar';
import PrimaryButton from '../components/PrimaryButton';
import { hapticLight, hapticMedium } from '../utils/haptics';

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const {
    words,
    favoriteWordIds,
    learnedWordIds,
    learningDates,
    dailyGoal,
    speechRate,
    loading,
    error,
    refresh,
  } = useWords();

  const [speaking, setSpeaking] = useState(false);

  const wordOfTheDay = useMemo(() => getWordOfTheDay(words), [words]);
  const nextWord = useMemo(
    () => words.find((word) => !learnedWordIds.includes(word.id)),
    [learnedWordIds, words],
  );
  const todayCount = learningDates[getLocalDateKey()] ?? 0;
  const progress = Math.min(todayCount / dailyGoal, 1);
  const streak = getCurrentStreak(learningDates);

  const openLibrary = (category) => {
    hapticLight();
    navigation.navigate('Library', {
      screen: 'WordLibrary',
      params: { category: category ?? 'All' },
    });
  };

  const openDetails = (wordId) => {
    hapticLight();
    navigation.navigate('Library', {
      screen: 'WordDetails',
      params: { wordId },
    });
  };

  const openSavedWords = (initialTab = 'favorites') => {
    hapticLight();
    navigation.navigate('SavedWords', { initialTab });
  };

  const openSettings = () => {
    hapticLight();
    navigation.navigate('Settings');
  };

  const handleSpeakWordOfTheDay = async () => {
    if (!wordOfTheDay) return;
    hapticLight();
    try {
      if (speaking) {
        await Speech.stop();
        setSpeaking(false);
        return;
      }
      await Speech.stop();
      Speech.speak(wordOfTheDay.word, {
        language: 'en-US',
        rate: speechRate || 0.85,
        onStart: () => setSpeaking(true),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  };

  if (loading && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.muted }]}>Opening your word garden…</Text>
      </SafeAreaView>
    );
  }

  if (error && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="cloud-offline-outline" size={36} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <PrimaryButton title="Try again" onPress={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header with Greeting & Quick Header Actions */}
        <View style={styles.headingRow}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]}>WORD BLOOM</Text>
            <Text style={[styles.greeting, { color: theme.primary }]}>
              {getGreeting()}, Learner! 👋
            </Text>
            <Text style={[styles.subGreeting, { color: theme.muted }]}>
              {"Let's grow your vocabulary today."}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Saved words, ${favoriteWordIds.length} favourites`}
              onPress={() => openSavedWords('favorites')}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="heart" size={20} color={theme.secondary} />
              {favoriteWordIds.length > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                  <Text style={styles.badgeText}>{favoriteWordIds.length}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={openSettings}
              style={({ pressed }) => [
                styles.iconButton,
                { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Ionicons name="settings-outline" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {/* Offline Ready Pill */}
        <View style={[styles.offlineBadge, { backgroundColor: `${theme.success}1A` }]}>
          <Ionicons name="cloud-offline" size={15} color={theme.success} />
          <Text style={[styles.offlineText, { color: theme.text }]}>
            100% Offline · Complete Built-in Vocabulary & Quizzes
          </Text>
        </View>

        {/* Word of the Day Card */}
        <View
          style={[
            styles.wordCard,
            { backgroundColor: theme.primary },
          ]}
        >
          <View style={styles.wordCardHeader}>
            <View style={styles.wordCardLabel}>
              <Ionicons name="sparkles" size={17} color={theme.primaryText} />
              <Text style={[styles.wordCardEyebrow, { color: theme.primaryText }]}>WORD OF THE DAY</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={speaking ? 'Stop speech' : 'Listen to word of the day'}
              onPress={handleSpeakWordOfTheDay}
              style={({ pressed }) => [
                styles.audioPill,
                { backgroundColor: 'rgba(255,255,255,0.2)', opacity: pressed ? 0.75 : 1 },
              ]}
              hitSlop={8}
            >
              <Ionicons name={speaking ? 'stop' : 'volume-high'} size={18} color="#FFFFFF" />
              <Text style={styles.audioLabel}>{speaking ? 'Stop' : 'Listen'}</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Word of the day: ${wordOfTheDay?.word ?? 'none'}. Tap to view details.`}
            onPress={() => wordOfTheDay && openDetails(wordOfTheDay.id)}
            style={({ pressed }) => [
              styles.wordCardClickable,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={[styles.wordOfDay, { color: theme.primaryText }]}>
              {wordOfTheDay?.word ?? 'Your next word'}
            </Text>
            {wordOfTheDay?.phonetic ? (
              <Text style={[styles.wordPhonetic, { color: 'rgba(255,255,255,0.85)' }]}>
                {wordOfTheDay.phonetic}
              </Text>
            ) : null}
            <Text style={[styles.wordMeaning, { color: theme.primaryText }]} numberOfLines={2}>
              {wordOfTheDay?.meaning ?? 'Your word collection will appear here.'}
            </Text>
            <View style={styles.wordCardFooter}>
              <View style={[styles.categoryTag, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                <Text style={styles.categoryTagText}>{wordOfTheDay?.category ?? 'WordBloom'}</Text>
              </View>
              <View style={styles.tapToView}>
                <Text style={styles.tapToViewText}>Explore word</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Daily Goal Progress */}
        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your daily goal</Text>
          <Text style={[styles.goalCount, { color: theme.primary }]}>
            {todayCount} / {dailyGoal} words
          </Text>
        </View>
        <View style={[styles.goalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.goalSummary}>
            <View style={[styles.goalIcon, { backgroundColor: `${theme.accent}20` }]}>
              <Ionicons name="leaf-outline" size={22} color={theme.accent} />
            </View>
            <View style={styles.goalCopy}>
              <Text style={[styles.goalTitle, { color: theme.text }]}>
                {todayCount >= dailyGoal ? 'Goal complete — lovely work! 🌸' : 'Small steps add up'}
              </Text>
              <Text style={[styles.goalSubtext, { color: theme.muted }]}>
                {Math.max(dailyGoal - todayCount, 0)} more to reach today’s goal
              </Text>
            </View>
          </View>
          <ProgressBar progress={progress} color={theme.accent} />
        </View>

        {/* Learning Streak */}
        <View style={[styles.streakCard, { backgroundColor: `${theme.secondary}18` }]}>
          <View style={[styles.streakIcon, { backgroundColor: `${theme.secondary}30` }]}>
            <Ionicons name="flame" size={22} color={theme.secondary} />
          </View>
          <View style={styles.streakCopy}>
            <Text style={[styles.streakTitle, { color: theme.text }]}>
              {streak} day{streak === 1 ? '' : 's'} in a row
            </Text>
            <Text style={[styles.streakSubtitle, { color: theme.muted }]}>
              {streak ? 'Your learning habit is blooming!' : 'Learn a word today to start your streak.'}
            </Text>
          </View>
          <Text style={styles.streakEmoji}>🌱</Text>
        </View>

        {/* Action Button */}
        <PrimaryButton
          title={nextWord ? 'Continue learning' : 'Explore the library'}
          onPress={() => {
            hapticMedium();
            if (nextWord) openDetails(nextWord.id);
            else openLibrary();
          }}
        />

        {/* Explore by Category */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Explore by category</Text>
            <Text style={[styles.sectionCaption, { color: theme.muted }]}>Curated vocabulary for every context</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse all words in library"
            onPress={() => openLibrary()}
            hitSlop={8}
          >
            <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const count = words.filter((word) => word.category === category.name).length;
            return (
              <Pressable
                key={category.name}
                accessibilityRole="button"
                accessibilityLabel={`${category.name}, ${count} words`}
                onPress={() => openLibrary(category.name)}
                style={({ pressed }) => [
                  styles.categoryCard,
                  { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${category.colour}20` }]}>
                  <Ionicons name={category.icon} size={20} color={category.colour} />
                </View>
                <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1}>
                  {category.name}
                </Text>
                <Text style={[styles.categoryCount, { color: theme.muted }]}>{count} words</Text>
              </Pressable>
            );
          })}
        </View>
        {error ? <Text style={[styles.inlineError, { color: theme.danger }]}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heading: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  greeting: { fontSize: 16, fontWeight: '700', marginTop: 3 },
  subGreeting: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    marginTop: -spacing.xs,
  },
  offlineText: { fontSize: 12, fontWeight: '700' },
  wordCard: {
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: 200,
    elevation: 3,
    shadowColor: '#171323',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  wordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  wordCardLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  wordCardEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  audioLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  wordCardClickable: {
    flex: 1,
    justifyContent: 'space-between',
  },
  wordOfDay: { fontSize: 34, fontWeight: '800', marginTop: spacing.xs },
  wordPhonetic: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  wordMeaning: { fontSize: 15, lineHeight: 22, marginTop: spacing.xs },
  wordCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  categoryTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  categoryTagText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  tapToView: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapToViewText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: -spacing.sm,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  sectionCaption: { fontSize: 13, marginTop: 4 },
  goalCount: { fontSize: 14, fontWeight: '700' },
  goalCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, gap: spacing.md },
  goalSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goalIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  goalCopy: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '700' },
  goalSubtext: { fontSize: 13, marginTop: 3 },
  streakCard: {
    borderRadius: radii.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  streakCopy: { flex: 1 },
  streakTitle: { fontSize: 16, fontWeight: '700' },
  streakSubtitle: { fontSize: 12, marginTop: 3 },
  streakEmoji: { fontSize: 24 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  categoryCard: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    minHeight: 120,
    justifyContent: 'center',
    gap: 6,
  },
  categoryIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  categoryName: { fontSize: 14, fontWeight: '700' },
  categoryCount: { fontSize: 12 },
  seeAll: { fontSize: 14, fontWeight: '700' },
  loadingText: { fontSize: 14 },
  errorText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  inlineError: { fontSize: 13, lineHeight: 20 },
});
