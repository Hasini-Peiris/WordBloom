import { useEffect, useState } from 'react';
import {
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
import { radii, spacing } from '../theme/spacing';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const MODE_LABELS = {
  meaning: 'Meaning',
  synonym: 'Synonym match',
  fill: 'Fill in the blank',
};

function ReviewCard({ answer, onReviewWord }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.reviewHeading}>
        <Ionicons name="close-circle" size={20} color={theme.danger} />
        <Text style={[styles.reviewQuestion, { color: theme.text }]}>{answer.question}</Text>
      </View>
      <View style={[styles.answerLine, { backgroundColor: `${theme.danger}12` }]}>
        <Text style={[styles.answerLabel, { color: theme.muted }]}>Your answer</Text>
        <Text style={[styles.wrongAnswer, { color: theme.danger }]}>
          {answer.options[answer.selectedAnswer] ?? 'No answer'}
        </Text>
      </View>
      <View style={[styles.answerLine, { backgroundColor: `${theme.success}14` }]}>
        <Text style={[styles.answerLabel, { color: theme.muted }]}>Correct answer</Text>
        <Text style={[styles.correctAnswer, { color: theme.success }]}>
          {answer.options[answer.answerIndex]}
        </Text>
      </View>
      <Text style={[styles.explanation, { color: theme.muted }]}>{answer.explanation}</Text>
      {answer.wordId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Study word ${answer.word || ''} in dictionary`}
          onPress={() => onReviewWord?.(answer.wordId)}
          style={({ pressed }) => [
            styles.studyWordBtn,
            { backgroundColor: `${theme.primary}12`, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="book-outline" size={16} color={theme.primary} />
          <Text style={[styles.studyWordText, { color: theme.primary }]}>
            Study “{answer.word}” in Dictionary
          </Text>
          <Ionicons name="arrow-forward" size={15} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function QuizResultScreen({ navigation, route }) {
  const { theme } = useTheme();
  const result = route.params;
  const [reviewing, setReviewing] = useState(false);

  const percentage = result && result.total > 0
    ? Math.round((result.score / result.total) * 100)
    : 0;

  useEffect(() => {
    if (percentage >= 70) {
      hapticSuccess();
    } else {
      hapticMedium();
    }
  }, [percentage]);

  if (!result || !Array.isArray(result.answers) || result.total < 1) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.emptyResult}>
          <EmptyState
            icon="clipboard-outline"
            title="No quiz results yet"
            message="Finish a quick quiz and your score will appear here."
          />
          <PrimaryButton
            title="Start a quiz"
            onPress={() => {
              hapticLight();
              navigation.replace('QuizMain');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const wrongAnswers = result.answers.filter((answer) => !answer.isCorrect);

  const resultBadge = percentage === 100
    ? 'Word Master 🏆'
    : percentage >= 80
      ? 'Brilliant Bloom 🌸'
      : percentage >= 60
        ? 'Growing Strong 🌱'
        : 'Keep Practising ✨';

  const resultMessage = percentage === 100
    ? 'A perfect score — outstanding vocabulary mastery!'
    : percentage >= 70
      ? 'Lovely progress. Your word garden is growing beautifully!'
      : 'Every try helps your vocabulary take root and grow.';

  const handleReviewWord = (wordId) => {
    hapticLight();
    navigation.navigate('WordDetails', { wordId });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.scoreCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Image
            source={require('../../assets/images/quiz-result.png')}
            style={styles.resultImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View
            style={[
              styles.scoreIcon,
              { backgroundColor: percentage >= 70 ? `${theme.success}1B` : `${theme.primary}18` },
            ]}
          >
            <Ionicons
              name={percentage >= 70 ? 'sparkles' : 'leaf-outline'}
              size={32}
              color={percentage >= 70 ? theme.success : theme.primary}
            />
          </View>
          <View style={[styles.badgePill, { backgroundColor: `${theme.primary}18` }]}>
            <Text style={[styles.badgePillText, { color: theme.primary }]}>{resultBadge}</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Quiz complete!</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {MODE_LABELS[result.mode] ?? 'Vocabulary quiz'}
          </Text>
          <Text style={[styles.score, { color: theme.primary }]}>{result.score}/{result.total}</Text>
          <Text style={[styles.percentage, { color: theme.text }]}>{percentage}% correct</Text>
          <ProgressBar progress={percentage / 100} color={percentage >= 70 ? theme.success : theme.primary} />
          <Text style={[styles.resultMessage, { color: theme.muted }]}>{resultMessage}</Text>
        </View>

        {result.historyError ? (
          <View style={[styles.saveWarning, { backgroundColor: `${theme.danger}12` }]}>
            <Ionicons name="alert-circle-outline" size={19} color={theme.danger} />
            <Text style={[styles.warningText, { color: theme.text }]}>
              Your score is shown, but could not be saved: {result.historyError}
            </Text>
          </View>
        ) : null}

        {wrongAnswers.length ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: reviewing }}
            onPress={() => {
              hapticLight();
              setReviewing((current) => !current);
            }}
            style={({ pressed }) => [
              styles.reviewToggle,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.reviewIcon, { backgroundColor: `${theme.secondary}20` }]}>
              <Ionicons name="refresh-outline" size={19} color={theme.secondary} />
            </View>
            <Text style={[styles.reviewToggleLabel, { color: theme.text }]}>
              {reviewing ? 'Hide answer review' : `Review wrong answers (${wrongAnswers.length})`}
            </Text>
            <Ionicons name={reviewing ? 'chevron-up' : 'chevron-down'} size={19} color={theme.muted} />
          </Pressable>
        ) : (
          <View style={[styles.perfectNote, { backgroundColor: `${theme.success}15` }]}>
            <Ionicons name="checkmark-circle" size={21} color={theme.success} />
            <Text style={[styles.perfectText, { color: theme.text }]}>
              You got every answer right! Try another quiz mode for a fresh challenge.
            </Text>
          </View>
        )}

        {reviewing ? wrongAnswers.map((answer) => (
          <ReviewCard key={answer.questionId} answer={answer} onReviewWord={handleReviewWord} />
        )) : null}

        <PrimaryButton
          title="Try another quiz"
          onPress={() => {
            hapticMedium();
            navigation.replace('QuizMain');
          }}
        />
        <PrimaryButton
          title="Back to home"
          variant="secondary"
          onPress={() => {
            hapticLight();
            navigation.navigate('MainTabs', { screen: 'Home' });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  emptyResult: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  scoreCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  resultImage: { width: 152, height: 110 },
  scoreIcon: { width: 64, height: 64, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  badgePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.pill },
  badgePillText: { fontSize: 13, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 14, fontWeight: '600' },
  score: { fontSize: 52, fontWeight: '700', marginTop: spacing.sm },
  percentage: { fontSize: 16, fontWeight: '700' },
  resultMessage: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: spacing.xs },
  saveWarning: { borderRadius: radii.small, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  warningText: { flex: 1, fontSize: 13, lineHeight: 20 },
  reviewToggle: { minHeight: 60, borderWidth: 1, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  reviewIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reviewToggleLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  reviewCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  reviewHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  reviewQuestion: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  answerLine: { borderRadius: radii.small, padding: spacing.sm, gap: 4 },
  answerLabel: { fontSize: 12, fontWeight: '600' },
  wrongAnswer: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  correctAnswer: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  explanation: { fontSize: 13, lineHeight: 20 },
  studyWordBtn: {
    minHeight: 40,
    borderRadius: radii.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  studyWordText: { fontSize: 13, fontWeight: '700' },
  perfectNote: { borderRadius: radii.small, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  perfectText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
