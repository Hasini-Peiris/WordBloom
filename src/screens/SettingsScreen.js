import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { radii, spacing } from '../theme/spacing';
import ConfirmDialog from '../components/ConfirmDialog';
import FilterChips from '../components/FilterChips';
import ScreenHeader from '../components/ScreenHeader';
import Toast from '../components/Toast';
import { hapticLight, hapticSuccess, hapticError, hapticMedium } from '../utils/haptics';

const THEME_OPTIONS = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];
const GOAL_OPTIONS = [
  { label: '5 words', value: '5' },
  { label: '10 words', value: '10' },
  { label: '20 words', value: '20' },
];
const SPEECH_OPTIONS = [
  { label: 'Slow', value: '0.7' },
  { label: 'Relaxed', value: '0.85' },
  { label: 'Natural', value: '1' },
  { label: 'Quick', value: '1.15' },
];

function SettingsSection({ title, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );
}

function PreferenceRow({ title, description, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        {description ? <Text style={[styles.rowDescription, { color: theme.muted }]}>{description}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const CONFIRMATIONS = {
  favorites: {
    title: 'Clear all favourites?',
    message: 'This removes every saved favourite. Your words and learning progress will stay safe.',
    confirmLabel: 'Clear favourites',
    run: 'clearFavorites',
  },
  progress: {
    title: 'Reset your progress?',
    message: 'This clears learned words, daily learning activity, and quiz scores. Your word library and favourites will stay safe.',
    confirmLabel: 'Reset progress',
    run: 'resetProgress',
  },
  words: {
    title: 'Remove your added words?',
    message: 'All words you created will be removed. Built-in words and quiz history will stay safe.',
    confirmLabel: 'Remove words',
    run: 'resetUserWords',
  },
};

export default function SettingsScreen({ navigation }) {
  const { theme, themeMode, setThemeMode, error: themeError, refreshTheme } = useTheme();
  const {
    words,
    dailyGoal,
    setDailyGoal,
    speechRate,
    setSpeechRate,
    clearFavorites,
    resetProgress,
    resetUserWords,
    userWords,
    favoriteWordIds,
    learnedWordIds,
    wordsError,
    refresh,
  } = useWords();
  const [working, setWorking] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const dismissToast = useCallback(() => setToast(''), []);
  const showToast = useCallback((message, type = 'success') => {
    setToastType(type);
    setToast(message);
  }, []);

  useEffect(() => () => {
    Speech.stop();
  }, []);

  const updatePreference = async (label, action) => {
    setWorking(true);
    hapticLight();
    try {
      await action();
      hapticSuccess();
      showToast(`${label} saved.`);
    } catch (saveError) {
      hapticError();
      showToast(saveError.message || `Could not save ${label.toLocaleLowerCase()}.`, 'error');
    } finally {
      setWorking(false);
    }
  };

  const speakPreview = async () => {
    hapticLight();
    try {
      await Speech.stop();
      Speech.speak('Hello! WordBloom helps you grow your English vocabulary, completely offline.', {
        language: 'en-US',
        rate: speechRate,
        onError: (speechError) => {
          hapticError();
          showToast(
            speechError.message || 'Pronunciation is unavailable on this device.',
            'error',
          );
        },
      });
    } catch (speechError) {
      hapticError();
      showToast(speechError.message || 'Pronunciation could not be played.', 'error');
    }
  };

  const handleConfirmedReset = async () => {
    if (!confirmAction || working) return;
    setWorking(true);
    hapticMedium();
    try {
      if (confirmAction === 'favorites') await clearFavorites();
      if (confirmAction === 'progress') await resetProgress();
      if (confirmAction === 'words') await resetUserWords();
      setConfirmAction('');
      hapticSuccess();
      showToast('Your changes have been saved.');
    } catch (actionError) {
      setConfirmAction('');
      hapticError();
      showToast(actionError.message || 'Could not update your saved data.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const selectedConfirmation = confirmAction ? CONFIRMATIONS[confirmAction] : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      {navigation?.canGoBack() && (
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => {
              hapticLight();
              navigation.goBack();
            }}
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={21} color={theme.text} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: theme.text }]}>Settings</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!navigation?.canGoBack() && (
          <ScreenHeader title="Settings" subtitle="A learning routine that feels like yours." />
        )}

        {wordsError ? (
          <Pressable
            accessibilityRole="button"
            onPress={refresh}
            style={[styles.errorBanner, { backgroundColor: `${theme.danger}12`, borderColor: `${theme.danger}44` }]}
          >
            <Ionicons name="alert-circle-outline" size={20} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{wordsError} Tap to retry.</Text>
          </Pressable>
        ) : null}

        <SettingsSection title="Look and feel">
          <PreferenceRow title="App theme" description="Choose a look or follow your device.">
            <FilterChips
              options={THEME_OPTIONS}
              value={themeMode}
              onChange={(mode) => updatePreference('Theme', () => setThemeMode(mode))}
              accessibilityLabel="Choose app theme"
            />
          </PreferenceRow>
          {themeError ? (
            <Pressable accessibilityRole="button" onPress={refreshTheme} style={styles.inlineError}>
              <Text style={[styles.rowDescription, { color: theme.danger }]}>{themeError} Tap to retry.</Text>
            </Pressable>
          ) : null}
        </SettingsSection>

        <SettingsSection title="Learning routine">
          <PreferenceRow title="Daily word goal" description="Pick a small goal that works for you.">
            <FilterChips
              options={GOAL_OPTIONS}
              value={String(dailyGoal)}
              onChange={(goal) => updatePreference(
                'Daily goal',
                () => setDailyGoal(Number(goal)),
              )}
              accessibilityLabel="Choose daily word goal"
            />
          </PreferenceRow>
        </SettingsSection>

        <SettingsSection title="Audio and speech">
          <PreferenceRow title="Speech speed" description="Set how quickly English words are pronounced.">
            <FilterChips
              options={SPEECH_OPTIONS}
              value={String(speechRate)}
              onChange={(rate) => updatePreference(
                'Speech speed',
                () => setSpeechRate(Number(rate)),
              )}
              accessibilityLabel="Choose pronunciation speed"
            />
          </PreferenceRow>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Listen to speech preview"
            onPress={speakPreview}
            style={({ pressed }) => [
              styles.previewButton,
              { backgroundColor: `${theme.primary}18`, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Ionicons name="volume-high-outline" size={19} color={theme.primary} />
            <Text style={[styles.previewLabel, { color: theme.primary }]}>Listen to preview voice</Text>
          </Pressable>
        </SettingsSection>

        <SettingsSection title="App & dataset details">
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.muted }]}>Project Title</Text>
            <Text style={[styles.detailsValue, { color: theme.text }]}>WordBloom – Offline Vocabulary</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.muted }]}>Built-in Vocabulary</Text>
            <Text style={[styles.detailsValue, { color: theme.text }]}>{words.length - userWords.length} words (bundled JSON)</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.muted }]}>Custom User Words</Text>
            <Text style={[styles.detailsValue, { color: theme.text }]}>{userWords.length} created</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.muted }]}>Saved Favourites</Text>
            <Text style={[styles.detailsValue, { color: theme.text }]}>{favoriteWordIds.length} words</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.muted }]}>Words Learned</Text>
            <Text style={[styles.detailsValue, { color: theme.text }]}>{learnedWordIds.length} words</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={[styles.detailsLabel, { color: theme.muted }]}>Storage Mode</Text>
            <Text style={[styles.detailsValue, { color: theme.success }]}>100% Offline (AsyncStorage)</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Reset and cleanup">
          <PreferenceRow title="Clear favourites" description="Remove every saved favourite word.">
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmAction('favorites')}
              style={[styles.resetButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.resetButtonText, { color: theme.danger }]}>Clear favourites</Text>
            </Pressable>
          </PreferenceRow>
          <PreferenceRow title="Reset learning progress" description="Clear learned words, streak, and quiz scores.">
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmAction('progress')}
              style={[styles.resetButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.resetButtonText, { color: theme.danger }]}>Reset progress</Text>
            </Pressable>
          </PreferenceRow>
          <PreferenceRow title="Remove custom words" description="Delete all vocabulary you personally added.">
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmAction('words')}
              style={[styles.resetButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.resetButtonText, { color: theme.danger }]}>Remove {userWords.length} words</Text>
            </Pressable>
          </PreferenceRow>
        </SettingsSection>
      </ScrollView>

      <Toast message={toast} type={toastType} onDismiss={dismissToast} />
      <ConfirmDialog
        visible={Boolean(selectedConfirmation)}
        title={selectedConfirmation?.title ?? ''}
        message={selectedConfirmation?.message ?? ''}
        confirmLabel={selectedConfirmation?.confirmLabel ?? 'Confirm'}
        destructive
        busy={working}
        onCancel={() => setConfirmAction('')}
        onConfirm={handleConfirmedReset}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { fontSize: 18, fontWeight: '700' },
  section: { gap: spacing.xs },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionBody: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, gap: spacing.md },
  preferenceRow: { gap: spacing.sm },
  preferenceCopy: { gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowDescription: { fontSize: 13, lineHeight: 18 },
  previewButton: { minHeight: 44, borderRadius: radii.pill, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  previewLabel: { fontSize: 14, fontWeight: '700' },
  resetButton: { minHeight: 44, borderWidth: 1, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  resetButtonText: { fontSize: 14, fontWeight: '700' },
  errorBanner: { borderWidth: 1, borderRadius: radii.card, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  inlineError: { paddingVertical: spacing.xs },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailsLabel: { fontSize: 13, fontWeight: '600' },
  detailsValue: { fontSize: 13, fontWeight: '700' },
});
