import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { getLocalDateKey } from '../utils/date';
import { getCurrentStreak } from '../utils/streak';
import { radii, spacing } from '../theme/spacing';
import ProgressBar from '../components/ProgressBar';
import { hapticLight } from '../utils/haptics';

const LEVELS = [
  { name: 'Beginner', color: 'beginner' },
  { name: 'Intermediate', color: 'intermediate' },
  { name: 'Advanced', color: 'advanced' },
];

const MODE_TITLES = {
  meaning: 'Meaning Quiz',
  synonym: 'Synonyms Match',
  fill: 'Fill in Blank',
};

function StatTile({ icon, label, value, note, tint, onPress }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      onPress={() => {
        if (onPress) {
          hapticLight();
          onPress();
        }
      }}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.statTile,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed && onPress ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: `${tint}1A` }]}>
        <Ionicons name={icon} size={19} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <View style={styles.statLabelRow}>
        <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
        {onPress && <Ionicons name="chevron-forward" size={13} color={theme.muted} />}
      </View>
      {note ? <Text style={[styles.statNote, { color: theme.muted }]}>{note}</Text> : null}
    </Pressable>
  );
}

function SectionCard({ title, subtitle, children }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function getWeekActivity(learningDates) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    date.setDate(date.getDate() - (6 - index));
    const key = getLocalDateKey(date);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2),
      count: Number.isFinite(learningDates[key]) ? learningDates[key] : 0,
      isToday: index === 6,
    };
  });
}

export default function ProgressScreen({ navigation }) {
  const { theme } = useTheme();
  const {
    words,
    favoriteWordIds,
    learnedWordIds,
    learningDates,
    dailyGoal,
    quizHistory,
    loading,
    error,
    refresh,
  } = useWords();

  if (loading || error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.mainTitle, { color: theme.text }]}>Your progress</Text>
            <Text style={[styles.mainSubtitle, { color: theme.muted }]}>Every word is a little win.</Text>
          </View>
        </View>
        <View style={styles.stateWrap}>
          <Text style={[styles.stateMessage, { color: error ? theme.danger : theme.muted }]}>
            {error || 'Loading your learning garden…'}
          </Text>
          {error ? (
            <Text accessibilityRole="button" onPress={refresh} style={[styles.retry, { color: theme.primary }]}>
              Tap to try again
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  const todayCount = learningDates[getLocalDateKey()] ?? 0;
  const streak = getCurrentStreak(learningDates);
  const quizAverage = quizHistory.length
    ? Math.round(quizHistory.reduce((sum, quiz) => sum + quiz.percentage, 0) / quizHistory.length)
    : null;
  const bestScore = quizHistory.length
    ? Math.max(...quizHistory.map((quiz) => quiz.percentage))
    : null;
  const week = getWeekActivity(learningDates);
  const maxActivity = Math.max(1, ...week.map((day) => day.count));
  const progress = words.length ? Math.min(1, learnedWordIds.length / words.length) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Row with Settings Icon */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.mainTitle, { color: theme.text }]}>Your progress</Text>
            <Text style={[styles.mainSubtitle, { color: theme.muted }]}>Every word is a little win.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {
              hapticLight();
              navigation.navigate('Settings');
            }}
            style={({ pressed }) => [
              styles.settingsBtn,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        </View>

        {/* 4 Interactive Key Stat Tiles */}
        <View style={styles.statsGrid}>
          <StatTile
            icon="checkmark-circle-outline"
            label="Words learned"
            value={learnedWordIds.length}
            note={`of ${words.length} words`}
            tint={theme.success}
            onPress={() => navigation.navigate('SavedWords', { initialTab: 'learned' })}
          />
          <StatTile
            icon="heart-outline"
            label="Favourites"
            value={favoriteWordIds.length}
            note="Saved collection"
            tint={theme.secondary}
            onPress={() => navigation.navigate('SavedWords', { initialTab: 'favorites' })}
          />
          <StatTile
            icon="flame-outline"
            label="Day streak"
            value={streak}
            note={streak === 1 ? 'day in a row' : 'days in a row'}
            tint={theme.intermediate}
          />
          <StatTile
            icon="trophy-outline"
            label="Quiz average"
            value={quizAverage === null ? '—' : `${quizAverage}%`}
            note={quizHistory.length ? `${quizHistory.length} taken` : 'Tap to start'}
            tint={theme.primary}
            onPress={() => navigation.navigate('Quiz')}
          />
        </View>

        {/* Daily Goal Card */}
        <SectionCard title="Daily goal" subtitle={`${todayCount} of ${dailyGoal} words today`}>
          <View style={styles.goalRow}>
            <View style={styles.goalTrack}>
              <ProgressBar progress={dailyGoal ? todayCount / dailyGoal : 0} color={theme.success} />
            </View>
            <Text style={[styles.goalPercentage, { color: theme.text }]}>
              {dailyGoal ? `${Math.min(100, Math.round((todayCount / dailyGoal) * 100))}%` : '0%'}
            </Text>
          </View>
          <Text style={[styles.helperText, { color: theme.muted }]}>
            {todayCount >= dailyGoal
              ? 'You reached your goal today. Wonderful work!'
              : 'A short practice session can move you closer.'}
          </Text>
        </SectionCard>

        {/* Quiz Performance Card */}
        <View style={styles.twoCards}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Best quiz score"
            onPress={() => {
              hapticLight();
              navigation.navigate('Quiz');
            }}
            style={({ pressed }) => [
              styles.miniCard,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: `${theme.intermediate}1A` }]}>
              <Ionicons name="ribbon-outline" size={19} color={theme.intermediate} />
            </View>
            <Text style={[styles.miniValue, { color: theme.text }]}>
              {bestScore === null ? '—' : `${bestScore}%`}
            </Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Best quiz score</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quizzes taken"
            onPress={() => {
              hapticLight();
              navigation.navigate('Quiz');
            }}
            style={({ pressed }) => [
              styles.miniCard,
              { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: `${theme.primary}1A` }]}>
              <Ionicons name="bar-chart-outline" size={19} color={theme.primary} />
            </View>
            <Text style={[styles.miniValue, { color: theme.text }]}>{quizHistory.length}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Quizzes completed</Text>
          </Pressable>
        </View>

        {/* 7-Day Activity Chart */}
        <SectionCard title="Last 7 days" subtitle="Words marked as learned each day">
          <View style={styles.chart} accessibilityLabel="Words learned during the last seven days">
            {week.map((day) => {
              const height = day.count ? Math.max(10, (day.count / maxActivity) * 92) : 4;
              return (
                <View key={day.key} style={styles.chartColumn}>
                  <Text style={[styles.chartCount, { color: theme.muted }]}>{day.count || ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: day.isToday ? theme.primary : theme.accent,
                          opacity: day.count ? 1 : 0.32,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDay, { color: day.isToday ? theme.primary : theme.muted }]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </SectionCard>

        {/* Level Mastery Breakdown */}
        <SectionCard title="Level mastery" subtitle={`${learnedWordIds.length} words learned so far`}>
          <View style={styles.levelList}>
            {LEVELS.map((level) => {
              const levelWords = words.filter((word) => word.level === level.name);
              const learnedCount = levelWords.filter((word) => learnedWordIds.includes(word.id)).length;
              const color = theme[level.color];
              return (
                <View key={level.name} style={styles.levelRow}>
                  <View style={styles.levelTitleRow}>
                    <View style={[styles.levelDot, { backgroundColor: color }]} />
                    <Text style={[styles.levelName, { color: theme.text }]}>{level.name}</Text>
                    <Text style={[styles.levelCount, { color: theme.muted }]}>
                      {learnedCount} / {levelWords.length}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={levelWords.length ? learnedCount / levelWords.length : 0}
                    color={color}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.overall}>
            <Text style={[styles.overallLabel, { color: theme.muted }]}>Overall library mastery</Text>
            <Text style={[styles.overallValue, { color: theme.text }]}>{Math.round(progress * 100)}%</Text>
          </View>
          <ProgressBar progress={progress} />
        </SectionCard>

        {/* Recent Quiz History */}
        {quizHistory.length > 0 && (
          <SectionCard title="Recent quizzes" subtitle="Your latest test results">
            <View style={styles.historyList}>
              {quizHistory.slice(0, 5).map((quiz) => (
                <View
                  key={quiz.id}
                  style={[styles.historyItem, { backgroundColor: `${theme.primary}0D`, borderColor: theme.border }]}
                >
                  <View style={styles.historyCopy}>
                    <Text style={[styles.historyMode, { color: theme.text }]}>
                      {MODE_TITLES[quiz.mode] ?? 'Quiz'}
                    </Text>
                    <Text style={[styles.historyDate, { color: theme.muted }]}>
                      {new Date(quiz.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {quiz.score}/{quiz.total} correct
                    </Text>
                  </View>
                  <View style={[styles.historyScorePill, { backgroundColor: quiz.percentage >= 70 ? `${theme.success}22` : `${theme.intermediate}22` }]}>
                    <Text style={[styles.historyScoreText, { color: quiz.percentage >= 70 ? theme.success : theme.intermediate }]}>
                      {quiz.percentage}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  mainTitle: { fontSize: 28, fontWeight: '800' },
  mainSubtitle: { fontSize: 14, marginTop: 2 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statTile: { width: '47%', flexGrow: 1, minHeight: 140, borderRadius: radii.card, borderWidth: 1, padding: spacing.md, gap: 5 },
  statIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  statValue: { fontSize: 24, lineHeight: 29, fontWeight: '700' },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statNote: { fontSize: 11 },
  card: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, gap: spacing.md },
  sectionHeading: { gap: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionSubtitle: { fontSize: 13, lineHeight: 19 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goalTrack: { flex: 1 },
  goalPercentage: { minWidth: 42, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  helperText: { fontSize: 13, lineHeight: 19 },
  twoCards: { flexDirection: 'row', gap: spacing.sm },
  miniCard: { flex: 1, minHeight: 122, borderRadius: radii.card, borderWidth: 1, padding: spacing.md, gap: 5 },
  miniValue: { fontSize: 22, fontWeight: '700' },
  chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: spacing.xs },
  chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  chartCount: { minHeight: 15, fontSize: 11, fontWeight: '600' },
  barTrack: { height: 96, justifyContent: 'flex-end', width: '52%', maxWidth: 28 },
  bar: { width: '100%', borderRadius: 8 },
  chartDay: { fontSize: 11, fontWeight: '600' },
  levelList: { gap: spacing.md },
  levelRow: { gap: spacing.xs },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  levelDot: { width: 9, height: 9, borderRadius: 5 },
  levelName: { flex: 1, fontSize: 14, fontWeight: '600' },
  levelCount: { fontSize: 12, fontWeight: '600' },
  overall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overallLabel: { fontSize: 13, fontWeight: '600' },
  overallValue: { fontSize: 14, fontWeight: '700' },
  historyList: { gap: spacing.xs },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radii.small,
    borderWidth: 1,
  },
  historyCopy: { gap: 2 },
  historyMode: { fontSize: 14, fontWeight: '700' },
  historyDate: { fontSize: 12 },
  historyScorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  historyScoreText: { fontSize: 13, fontWeight: '800' },
  stateWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  stateMessage: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  retry: { minHeight: 44, textAlignVertical: 'center', fontSize: 15, fontWeight: '700' },
});
