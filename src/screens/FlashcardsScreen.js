import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import categories from '../data/categories.json';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { radii, spacing } from '../theme/spacing';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import FlipCard from '../components/FlipCard';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import ScreenHeader from '../components/ScreenHeader';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const LEVEL_OPTIONS = [
  { label: 'All levels', value: 'All' },
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced', value: 'Advanced' },
];

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export default function FlashcardsScreen({ navigation }) {
  const { theme } = useTheme();
  const { words, learnedWordIds, markLearned, loading, error } = useWords();
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [session, setSession] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState([]);
  const [savingRating, setSavingRating] = useState(false);
  const [actionError, setActionError] = useState('');
  const isComplete = session !== null && cardIndex >= session.length;
  const currentWord = session && cardIndex < session.length ? session[cardIndex] : null;

  const matchingCount = useMemo(
    () => words.filter((word) => (
      (category === 'All' || word.category === category)
      && (level === 'All' || word.level === level)
    )).length,
    [category, level, words],
  );
  const alreadyLearnedCount = useMemo(
    () => words.filter((word) => (
      (category === 'All' || word.category === category)
      && (level === 'All' || word.level === level)
      && learnedWordIds.includes(word.id)
    )).length,
    [category, learnedWordIds, level, words],
  );
  const missedWords = useMemo(
    () => (session ?? []).filter((word) => !knownIds.includes(word.id)),
    [knownIds, session],
  );

  const startSession = () => {
    hapticMedium();
    const deck = shuffle(words.filter((word) => (
      (category === 'All' || word.category === category)
      && (level === 'All' || word.level === level)
    ))).slice(0, 10);
    if (!deck.length) {
      setActionError('There are no words for this selection yet.');
      return;
    }
    setActionError('');
    setKnownIds([]);
    setCardIndex(0);
    setFlipped(false);
    setSession(deck);
  };

  const rateCard = async (knowIt) => {
    if (!currentWord || savingRating) return;
    setSavingRating(true);
    setActionError('');
    try {
      if (knowIt) {
        hapticSuccess();
        await markLearned(currentWord.id);
        setKnownIds((current) => [...current, currentWord.id]);
      } else {
        hapticLight();
      }
      setFlipped(false);
      setCardIndex((current) => current + 1);
    } catch (ratingError) {
      setActionError(ratingError.message || 'Could not save your learning progress. Try again.');
    } finally {
      setSavingRating(false);
    }
  };

  const endSession = () => {
    hapticLight();
    setSession(null);
    setCardIndex(0);
    setFlipped(false);
    setKnownIds([]);
    setActionError('');
  };

  if (loading && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.stateText, { color: theme.muted }]}>Preparing your word cards…</Text>
      </SafeAreaView>
    );
  }

  if (error && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <EmptyState icon="alert-circle-outline" title="Cards are unavailable" message={error} />
        <PrimaryButton title="Try again" onPress={() => navigation.navigate('Home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {session === null ? (
          <>
            <ScreenHeader
              title="Flashcards"
              subtitle="Flip a card, test your memory, and learn at your own pace."
            />
            <View style={[styles.introCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.introIcon, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name="albums-outline" size={27} color={theme.primary} />
              </View>
              <View style={styles.introCopy}>
                <Text style={[styles.introTitle, { color: theme.text }]}>Interactive Practice</Text>
                <Text style={[styles.introText, { color: theme.muted }]}>
                  Tap to flip the card, or swipe right if you know it, left to practise again later.
                </Text>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.text }]}>Choose a category</Text>
              <FilterChips
                options={[
                  { label: 'All categories', value: 'All' },
                  ...categories.map(({ name }) => ({ label: name, value: name })),
                ]}
                value={category}
                onChange={(val) => {
                  hapticLight();
                  setCategory(val);
                }}
                accessibilityLabel="Choose a flashcard category"
              />
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.text }]}>Choose a level</Text>
              <FilterChips
                options={LEVEL_OPTIONS}
                value={level}
                onChange={(val) => {
                  hapticLight();
                  setLevel(val);
                }}
                accessibilityLabel="Choose a flashcard level"
              />
            </View>

            <View style={[styles.deckCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.deckIcon, { backgroundColor: `${theme.accent}18` }]}>
                <Ionicons name="copy-outline" size={20} color={theme.accent} />
              </View>
              <View style={styles.deckCopy}>
                <Text style={[styles.deckTitle, { color: theme.text }]}>Your deck</Text>
                <Text style={[styles.deckSubtext, { color: theme.muted }]}>
                  {matchingCount} {matchingCount === 1 ? 'word' : 'words'} match · {alreadyLearnedCount} learned
                </Text>
              </View>
              <Text style={[styles.deckCount, { color: theme.primary }]}>{Math.min(10, matchingCount)}</Text>
            </View>
            {actionError ? <Text style={[styles.errorText, { color: theme.danger }]}>{actionError}</Text> : null}
            <PrimaryButton
              title={matchingCount ? 'Start flashcards' : 'No cards available'}
              onPress={startSession}
            />
          </>
        ) : isComplete ? (
          <>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.summaryIcon, { backgroundColor: `${theme.success}1B` }]}>
                <Ionicons name="checkmark-circle" size={34} color={theme.success} />
              </View>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Session complete!</Text>
              <Text style={[styles.summaryText, { color: theme.muted }]}>
                You knew {knownIds.length} of {session.length} {session.length === 1 ? 'word' : 'words'}.
              </Text>
              <Text style={[styles.summaryScore, { color: theme.primary }]}>
                {Math.round((knownIds.length / session.length) * 100)}%
              </Text>
              <ProgressBar progress={knownIds.length / session.length} color={theme.success} />
            </View>

            {missedWords.length ? (
              <View style={styles.reviewSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Words to practise ({missedWords.length})
                </Text>
                {missedWords.map((word) => (
                  <Pressable
                    key={word.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Review ${word.word}`}
                    onPress={() => {
                      hapticLight();
                      navigation.navigate('WordDetails', { wordId: word.id });
                    }}
                    style={({ pressed }) => [
                      styles.reviewWord,
                      { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.78 : 1 },
                    ]}
                  >
                    <View style={styles.reviewCopy}>
                      <Text style={[styles.reviewName, { color: theme.text }]}>{word.word}</Text>
                      <Text style={[styles.reviewMeaning, { color: theme.muted }]} numberOfLines={2}>
                        {word.meaning}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={19} color={theme.muted} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="sparkles-outline"
                title="You knew every word!"
                message="Lovely work. Choose a new category or level to keep learning."
              />
            )}
            <PrimaryButton title="Start another session" onPress={endSession} />
          </>
        ) : currentWord ? (
          <>
            <View style={styles.sessionHeader}>
              <View style={styles.sessionTitle}>
                <Text style={[styles.sessionTitleText, { color: theme.text }]}>Flashcards</Text>
                <Text style={[styles.sessionCaption, { color: theme.muted }]}>
                  Card {cardIndex + 1} of {session.length}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="End flashcard session"
                onPress={endSession}
                style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="close" size={21} color={theme.text} />
              </Pressable>
            </View>
            <ProgressBar progress={cardIndex / session.length} />
            <FlipCard
              key={currentWord.id}
              word={currentWord}
              flipped={flipped}
              onFlip={() => setFlipped((current) => !current)}
              onSwipe={(direction) => rateCard(direction === 'right')}
            />
            <View style={styles.ratingButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Still learning this word"
                disabled={savingRating}
                onPress={() => rateCard(false)}
                style={({ pressed }) => [
                  styles.ratingButton,
                  { backgroundColor: `${theme.secondary}18`, borderColor: `${theme.secondary}55`, opacity: pressed || savingRating ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="refresh-outline" size={20} color={theme.secondary} />
                <Text style={[styles.ratingLabel, { color: theme.text }]}>Still learning</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="I know this word"
                disabled={savingRating}
                onPress={() => rateCard(true)}
                style={({ pressed }) => [
                  styles.ratingButton,
                  { backgroundColor: `${theme.success}1A`, borderColor: `${theme.success}55`, opacity: pressed || savingRating ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={theme.success} />
                <Text style={[styles.ratingLabel, { color: theme.text }]}>Know it</Text>
              </Pressable>
            </View>
            <Text style={[styles.swipeHint, { color: theme.muted }]}>
              Tap card to flip · Swipe or tap buttons below to rate
            </Text>
            {actionError ? <Text style={[styles.errorText, { color: theme.danger }]}>{actionError}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  stateText: { fontSize: 15 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  introCard: { borderWidth: 1, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  introIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1, gap: 5 },
  introTitle: { fontSize: 16, fontWeight: '700' },
  introText: { fontSize: 13, lineHeight: 19 },
  filterGroup: { gap: spacing.sm },
  filterLabel: { fontSize: 15, fontWeight: '700' },
  deckCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deckIcon: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  deckCopy: { flex: 1, gap: 3 },
  deckTitle: { fontSize: 15, fontWeight: '700' },
  deckSubtext: { fontSize: 13 },
  deckCount: { fontSize: 20, fontWeight: '700' },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sessionTitle: { gap: 3 },
  sessionTitleText: { fontSize: 23, fontWeight: '700' },
  sessionCaption: { fontSize: 13 },
  closeButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ratingButtons: { flexDirection: 'row', gap: spacing.sm },
  ratingButton: { minHeight: 54, flex: 1, borderWidth: 1, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.xs },
  ratingLabel: { fontSize: 14, fontWeight: '700' },
  swipeHint: { fontSize: 13, textAlign: 'center', marginTop: -spacing.md },
  summaryCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, alignItems: 'center', gap: spacing.md },
  summaryIcon: { width: 64, height: 64, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  summaryTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  summaryText: { fontSize: 15, textAlign: 'center' },
  summaryScore: { fontSize: 36, fontWeight: '700' },
  reviewSection: { gap: spacing.sm },
  sectionTitle: { fontSize: 19, fontWeight: '700' },
  reviewWord: { minHeight: 68, borderWidth: 1, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  reviewCopy: { flex: 1, gap: 4 },
  reviewName: { fontSize: 16, fontWeight: '700' },
  reviewMeaning: { fontSize: 13, lineHeight: 19 },
  errorText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
