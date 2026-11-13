import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import questionBank from '../data/quiz.json';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { radii, spacing } from '../theme/spacing';
import { buildQuiz, QUIZ_LENGTH } from '../utils/quizBuilder';
import PrimaryButton from '../components/PrimaryButton';
import ProgressBar from '../components/ProgressBar';
import { hapticError, hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';

const MODES = [
  {
    value: 'meaning',
    title: 'Find the meaning',
    description: 'Choose the definition that matches a word.',
    icon: 'book-outline',
    color: '#7C5CFC',
  },
  {
    value: 'synonym',
    title: 'Match a synonym',
    description: 'Find a word with a similar meaning.',
    icon: 'git-compare-outline',
    color: '#FF7AA8',
  },
  {
    value: 'fill',
    title: 'Fill in the blank',
    description: 'Complete a definition with the right word.',
    icon: 'pencil-outline',
    color: '#2EC4A6',
  },
];

const MODE_LABELS = {
  meaning: 'Meaning',
  synonym: 'Synonym match',
  fill: 'Fill in the blank',
};

function ModeCard({ item, selected, count, onPress }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${item.title}, ${count} questions`}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.modeCard,
        {
          backgroundColor: theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.modeIcon, { backgroundColor: `${item.color}20` }]}>
        <Ionicons name={item.icon} size={23} color={item.color} />
      </View>
      <View style={styles.modeCopy}>
        <Text style={[styles.modeTitle, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.modeDescription, { color: theme.muted }]}>{item.description}</Text>
      </View>
      <Text style={[styles.modeCount, { color: theme.muted }]}>{count}</Text>
    </Pressable>
  );
}

export default function QuizScreen({ navigation }) {
  const { theme } = useTheme();
  const { recordQuizResult, loading, error: storageError, refresh } = useWords();
  const [mode, setMode] = useState('meaning');
  const [questions, setQuestions] = useState([]);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizError, setQuizError] = useState('');
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);

  const questionCounts = useMemo(
    () => Object.fromEntries(MODES.map((item) => [
      item.value,
      questionBank.filter((question) => question.type === item.value).length,
    ])),
    [],
  );
  const currentQuestion = questions[questionIndex];
  const isCorrect = currentQuestion && selectedAnswer === currentQuestion.answerIndex;

  const startQuiz = () => {
    hapticMedium();
    try {
      const nextQuestions = buildQuiz(questionBank, mode);
      setQuestions(nextQuestions);
      setAnswerHistory([]);
      setQuestionIndex(0);
      setSelectedAnswer(null);
      setQuizError('');
      setFinishing(false);
      finishingRef.current = false;
    } catch (startError) {
      setQuizError(startError.message || 'This quiz is not available yet.');
    }
  };

  const finishQuiz = async (finalAnswer) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    hapticSuccess();
    const answers = questions.map((question, index) => {
      const answerIndex = index === questionIndex ? finalAnswer : answerHistory[index];
      return {
        questionId: question.id,
        wordId: question.wordId,
        word: question.word,
        question: question.question,
        options: question.options,
        selectedAnswer: answerIndex,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
        isCorrect: answerIndex === question.answerIndex,
      };
    });
    const finalScore = answers.filter((answer) => answer.isCorrect).length;
    let historyError = '';
    try {
      await recordQuizResult({ mode, score: finalScore, total: questions.length });
    } catch (saveError) {
      historyError = saveError.message || 'Your result could not be saved to quiz history.';
    }
    navigation.replace('QuizResult', {
      mode,
      score: finalScore,
      total: questions.length,
      answers,
      historyError,
    });
  };

  const handleSelectAnswer = (index) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === currentQuestion.answerIndex) {
      hapticSuccess();
    } else {
      hapticError();
    }
  };

  const continueQuiz = () => {
    if (selectedAnswer === null || finishing) return;
    hapticLight();
    if (questionIndex === questions.length - 1) {
      finishQuiz(selectedAnswer);
      return;
    }
    setAnswerHistory((current) => [...current, selectedAnswer]);
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.muted }]}>Preparing your quiz…</Text>
      </SafeAreaView>
    );
  }

  if (storageError) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={36} color={theme.danger} />
        <Text style={[styles.storageError, { color: theme.text }]}>{storageError}</Text>
        <PrimaryButton title="Try again" onPress={refresh} />
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    const selectedMode = MODES.find((item) => item.value === mode);
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.setupContent} showsVerticalScrollIndicator={false}>
          {navigation.canGoBack() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons name="arrow-back" size={21} color={theme.text} />
            </Pressable>
          ) : null}
          <View style={styles.setupHeading}>
            <Text style={[styles.title, { color: theme.text }]}>Quick Quiz</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Pick a practice style. Every quiz has {QUIZ_LENGTH} questions.
            </Text>
          </View>
          <View style={styles.modeList}>
            {MODES.map((item) => (
              <ModeCard
                key={item.value}
                item={item}
                selected={mode === item.value}
                count={questionCounts[item.value]}
                onPress={() => setMode(item.value)}
              />
            ))}
          </View>
          <View style={[styles.quizNote, { backgroundColor: `${theme.primary}12` }]}>
            <Ionicons name="cloud-offline-outline" size={19} color={theme.primary} />
            <Text style={[styles.noteText, { color: theme.text }]}>
              Questions and scores stay on this device. No internet is needed.
            </Text>
          </View>
          {quizError ? <Text style={[styles.errorText, { color: theme.danger }]}>{quizError}</Text> : null}
          <PrimaryButton title={`Start ${selectedMode?.title ?? 'quiz'}`} onPress={startQuiz} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.quizContent} showsVerticalScrollIndicator={false}>
        <View style={styles.quizTopRow}>
          <View style={styles.quizTopCopy}>
            <Text style={[styles.quizMode, { color: theme.primary }]}>{MODE_LABELS[mode]}</Text>
            <Text style={[styles.questionCounter, { color: theme.muted }]}>
              Question {questionIndex + 1} of {questions.length}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit quiz"
            onPress={() => {
              hapticLight();
              setQuestions([]);
              setAnswerHistory([]);
              setQuestionIndex(0);
              setSelectedAnswer(null);
              setQuizError('');
              finishingRef.current = false;
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="close" size={21} color={theme.text} />
          </Pressable>
        </View>
        <ProgressBar progress={(questionIndex + (selectedAnswer === null ? 0 : 1)) / questions.length} />

        <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.questionNumber, { color: theme.primary }]}>QUESTION {questionIndex + 1}</Text>
          <Text style={[styles.questionText, { color: theme.text }]}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsList}>
          {currentQuestion.options.map((option, index) => {
            const selected = index === selectedAnswer;
            const correct = index === currentQuestion.answerIndex;
            let borderColor = theme.border;
            let backgroundColor = theme.surface;
            let icon = null;
            let iconColor = theme.muted;
            if (selectedAnswer !== null && correct) {
              borderColor = theme.success;
              backgroundColor = `${theme.success}17`;
              icon = 'checkmark-circle';
              iconColor = theme.success;
            } else if (selectedAnswer !== null && selected) {
              borderColor = theme.danger;
              backgroundColor = `${theme.danger}14`;
              icon = 'close-circle';
              iconColor = theme.danger;
            }
            return (
              <Pressable
                key={`${currentQuestion.id}-${index}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                disabled={selectedAnswer !== null}
                onPress={() => handleSelectAnswer(index)}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor, borderColor, opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <View style={[
                  styles.optionLetter,
                  { backgroundColor: selectedAnswer !== null && correct ? `${theme.success}26` : `${theme.primary}15` },
                ]}>
                  <Text style={[styles.optionLetterText, { color: selectedAnswer !== null && correct ? theme.success : theme.primary }]}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
                {icon ? <Ionicons name={icon} size={21} color={iconColor} /> : null}
              </Pressable>
            );
          })}
        </View>

        {selectedAnswer !== null ? (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedbackCard,
              {
                backgroundColor: isCorrect ? `${theme.success}15` : `${theme.danger}12`,
                borderColor: isCorrect ? `${theme.success}55` : `${theme.danger}55`,
              },
            ]}
          >
            <View style={styles.feedbackHeading}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'information-circle'}
                size={21}
                color={isCorrect ? theme.success : theme.danger}
              />
              <Text style={[styles.feedbackTitle, { color: theme.text }]}>
                {isCorrect ? 'That’s right!' : `Not quite. The answer is “${currentQuestion.options[currentQuestion.answerIndex]}”.`}
              </Text>
            </View>
            <Text style={[styles.feedbackText, { color: theme.text }]}>{currentQuestion.explanation}</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={finishing ? 'Saving your score…' : questionIndex === questions.length - 1 ? 'See my score' : 'Next question'}
          onPress={continueQuiz}
          disabled={selectedAnswer === null || finishing}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  loadingText: { fontSize: 14 },
  storageError: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  setupContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  backButton: { width: 44, height: 44, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  setupHeading: { gap: spacing.xs },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  modeList: { gap: spacing.sm },
  modeCard: { minHeight: 92, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  modeIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  modeCopy: { flex: 1, gap: 5 },
  modeTitle: { fontSize: 15, fontWeight: '700' },
  modeDescription: { fontSize: 12, lineHeight: 17 },
  modeCount: { fontSize: 13, fontWeight: '700' },
  quizNote: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radii.small, padding: spacing.md, gap: spacing.sm },
  noteText: { flex: 1, fontSize: 13, lineHeight: 20 },
  errorText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  quizContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  quizTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quizTopCopy: { gap: 4 },
  quizMode: { fontSize: 14, fontWeight: '700' },
  questionCounter: { fontSize: 13 },
  questionCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  questionNumber: { fontSize: 12, fontWeight: '700', letterSpacing: 0.7 },
  questionText: { fontSize: 21, lineHeight: 30, fontWeight: '600' },
  optionsList: { gap: spacing.sm },
  option: { minHeight: 64, borderWidth: 1, borderRadius: radii.card, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionLetter: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 14, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  feedbackCard: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  feedbackHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  feedbackTitle: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  feedbackText: { fontSize: 14, lineHeight: 21 },
});
