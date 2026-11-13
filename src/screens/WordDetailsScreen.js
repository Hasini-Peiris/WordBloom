import { useCallback, useMemo, useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { radii, spacing } from '../theme/spacing';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LevelBadge from '../components/LevelBadge';
import PrimaryButton from '../components/PrimaryButton';
import Toast from '../components/Toast';
import { hapticLight, hapticSuccess, hapticError } from '../utils/haptics';

function IconAction({ icon, label, active, onPress, color }) {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconAction,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Ionicons name={icon} size={21} color={color ?? theme.text} />
    </Pressable>
  );
}

function Section({ title, children }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export default function WordDetailsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const {
    words,
    speechRate,
    favoriteWordIds,
    learnedWordIds,
    toggleFavorite,
    markLearned,
    unmarkLearned,
    deleteUserWord,
    loading,
    error,
  } = useWords();
  const { wordId } = route.params ?? {};
  const word = words.find((item) => item.id === wordId);
  const [speaking, setSpeaking] = useState(false);
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const isFavorite = word ? favoriteWordIds.includes(word.id) : false;
  const isLearned = word ? learnedWordIds.includes(word.id) : false;

  const showToast = useCallback((message, type = 'success') => {
    setToastType(type);
    setToast(message);
  }, [setToast, setToastType]);

  const relatedWords = useMemo(() => {
    if (!word) return [];
    const linkedIds = new Set(
      [...(word.synonyms ?? []), ...(word.antonyms ?? [])]
        .map((related) => words.find(
          (item) => item.word.toLocaleLowerCase() === related.toLocaleLowerCase(),
        ))
        .filter(Boolean)
        .map((item) => item.id),
    );
    const linked = words.filter((item) => linkedIds.has(item.id));
    const sameCategory = words.filter(
      (item) => item.id !== word.id && item.category === word.category && !linkedIds.has(item.id),
    );
    return [...linked, ...sameCategory].filter((item) => item.id !== word.id).slice(0, 4);
  }, [word, words]);

  const handleSpeech = async () => {
    if (!word || working) return;
    hapticLight();
    try {
      if (speaking) {
        await Speech.stop();
        setSpeaking(false);
        return;
      }
      await Speech.stop();
      Speech.speak(word.word, {
        language: 'en-US',
        rate: speechRate,
        onStart: () => setSpeaking(true),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: (speechError) => {
          setSpeaking(false);
          hapticError();
          showToast(speechError.message || 'Pronunciation is unavailable on this device.', 'error');
        },
      });
    } catch (speechError) {
      setSpeaking(false);
      hapticError();
      showToast(speechError.message || 'Pronunciation could not be played.', 'error');
    }
  };

  const handleCopy = async () => {
    if (!word) return;
    try {
      const copied = await Clipboard.setStringAsync(word.word);
      if (!copied) throw new Error('Your device could not copy the word.');
      hapticSuccess();
      showToast(`Copied “${word.word}”`);
    } catch (copyError) {
      hapticError();
      showToast(copyError.message || 'Could not copy this word.', 'error');
    }
  };

  const handleFavorite = async () => {
    if (!word || working) return;
    setWorking(true);
    try {
      const added = await toggleFavorite(word.id);
      hapticSuccess();
      showToast(added ? 'Added to your favourites' : 'Removed from your favourites');
    } catch (actionError) {
      hapticError();
      showToast(actionError.message || 'Could not update favourites.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const handleLearned = async () => {
    if (!word || working) return;
    setWorking(true);
    try {
      if (isLearned) {
        await unmarkLearned(word.id);
        hapticLight();
        showToast('Moved back to words to learn');
      } else {
        await markLearned(word.id);
        hapticSuccess();
        showToast('Lovely work — marked as learned!');
      }
    } catch (actionError) {
      hapticError();
      showToast(actionError.message || 'Could not update your learning progress.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!word || working) return;
    setWorking(true);
    try {
      await deleteUserWord(word.id);
      hapticLight();
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (actionError) {
      setDeleteDialogVisible(false);
      hapticError();
      showToast(actionError.message || 'Could not delete this word.', 'error');
      setWorking(false);
    }
  };

  if (!word && loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.stateText, { color: theme.muted }]}>Opening word details…</Text>
      </SafeAreaView>
    );
  }

  if (!word) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]} edges={['top']}>
        <EmptyState
          icon="search-outline"
          title="Word not found"
          message={error || 'This word may have been removed from your library.'}
        />
        <PrimaryButton title="Go back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <IconAction icon="arrow-back" label="Go back" onPress={() => navigation.goBack()} />
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Word details</Text>
        <View style={styles.topActions}>
          <IconAction
            icon="copy-outline"
            label={`Copy ${word.word}`}
            onPress={handleCopy}
          />
          <IconAction
            icon="create-outline"
            label={`Edit ${word.word}`}
            onPress={() => navigation.navigate('AddEditWord', { wordId: word.id })}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.heroLabels}>
            <View style={styles.badgeGroup}>
              <LevelBadge level={word.level} />
              {word.isUserWord && (
                <View style={[styles.userBadge, { backgroundColor: `${theme.primary}18` }]}>
                  <Ionicons name="sparkles" size={12} color={theme.primary} />
                  <Text style={[styles.userBadgeText, { color: theme.primary }]}>Your custom word</Text>
                </View>
              )}
            </View>
            <Text style={[styles.partOfSpeech, { color: theme.primary }]}>
              {word.partOfSpeech}
            </Text>
          </View>
          <Text style={[styles.word, { color: theme.text }]}>{word.word}</Text>
          <View style={styles.pronunciation}>
            <Text style={[styles.phonetic, { color: theme.muted }]}>
              {word.phonetic || 'Pronunciation available with audio'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={speaking ? `Stop ${word.word} pronunciation` : `Hear ${word.word} pronounced`}
              onPress={handleSpeech}
              style={({ pressed }) => [
                styles.speakButton,
                { backgroundColor: `${theme.primary}18`, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Ionicons name={speaking ? 'stop' : 'volume-high'} size={20} color={theme.primary} />
              <Text style={[styles.speakLabel, { color: theme.primary }]}>
                {speaking ? 'Stop' : 'Listen'}
              </Text>
            </Pressable>
          </View>
          <View style={[styles.categoryPill, { backgroundColor: `${theme.accent}18` }]}>
            <Text style={[styles.categoryText, { color: theme.text }]}>{word.category}</Text>
          </View>
          <Text style={[styles.meaning, { color: theme.text }]}>{word.meaning}</Text>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              accessibilityState={{ selected: isFavorite }}
              disabled={working}
              onPress={handleFavorite}
              style={({ pressed }) => [
                styles.favoriteButton,
                {
                  backgroundColor: isFavorite ? `${theme.secondary}22` : theme.surface,
                  borderColor: isFavorite ? theme.secondary : theme.border,
                  opacity: pressed ? 0.76 : 1,
                },
              ]}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={theme.secondary}
              />
              <Text style={[styles.favoriteLabel, { color: theme.text }]}>
                {isFavorite ? 'Favourited' : 'Add favourite'}
              </Text>
            </Pressable>
            <PrimaryButton
              title={isLearned ? 'Learned ✓' : 'Mark learned'}
              onPress={handleLearned}
              variant={isLearned ? 'secondary' : 'primary'}
            />
          </View>
        </View>

        <Section title="Examples">
          {(word.examples ?? []).map((example, index) => (
            <View
              key={`${word.id}-example-${index}`}
              style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.exampleNumber, { color: theme.primary }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.exampleText, { color: theme.text }]}>{example}</Text>
            </View>
          ))}
        </Section>

        <View style={styles.wordListGrid}>
          {[
            { title: 'Synonyms', values: word.synonyms ?? [], color: theme.accent },
            { title: 'Antonyms', values: word.antonyms ?? [], color: theme.secondary },
          ].map((group) => (
            <Section key={group.title} title={group.title}>
              <View style={styles.termList}>
                {group.values.length ? group.values.map((term) => (
                  <View
                    key={`${group.title}-${term}`}
                    style={[styles.termChip, { backgroundColor: `${group.color}1B` }]}
                  >
                    <Text style={[styles.termText, { color: theme.text }]}>{term}</Text>
                  </View>
                )) : (
                  <Text style={[styles.supportingText, { color: theme.muted }]}>
                    No {group.title.toLocaleLowerCase()} listed yet.
                  </Text>
                )}
              </View>
            </Section>
          ))}
        </View>

        <Section title="Memory tip">
          <View style={[styles.memoryCard, { backgroundColor: `${theme.primary}12` }]}>
            <Ionicons name="bulb-outline" size={23} color={theme.primary} />
            <Text style={[styles.memoryText, { color: theme.text }]}>
              {word.memoryTip || `Try using “${word.word}” in a sentence you make up.`}
            </Text>
          </View>
        </Section>

        {relatedWords.length ? (
          <Section title="Related words">
            {relatedWords.map((related) => (
              <Pressable
                key={related.id}
                accessibilityRole="button"
                accessibilityLabel={`View ${related.word}`}
                onPress={() => {
                  hapticLight();
                  navigation.push('WordDetails', { wordId: related.id });
                }}
                style={({ pressed }) => [
                  styles.relatedCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.76 : 1,
                  },
                ]}
              >
                <View style={styles.relatedCopy}>
                  <Text style={[styles.relatedWord, { color: theme.text }]}>{related.word}</Text>
                  <Text style={[styles.relatedMeaning, { color: theme.muted }]} numberOfLines={1}>
                    {related.meaning}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color={theme.muted} />
              </Pressable>
            ))}
          </Section>
        ) : null}

        {word.isUserWord ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.deleteLink}
          >
            <Ionicons name="trash-outline" size={17} color={theme.danger} />
            <Text style={[styles.deleteText, { color: theme.danger }]}>Delete my word</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Toast message={toast} type={toastType} onDismiss={() => setToast('')} />
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete this word?"
        message={`“${word.word}” will be removed from your word library and saved lists. This cannot be undone.`}
        confirmLabel="Delete word"
        destructive
        busy={working}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  stateText: { fontSize: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm },
  topBarTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  topActions: { flexDirection: 'row', gap: spacing.xs },
  iconAction: { width: 44, height: 44, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { borderWidth: 1, borderRadius: radii.card, padding: spacing.lg, gap: spacing.md },
  heroLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill },
  userBadgeText: { fontSize: 11, fontWeight: '700' },
  partOfSpeech: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  word: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
  pronunciation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  phonetic: { fontSize: 16, flex: 1 },
  speakButton: { minHeight: 44, borderRadius: radii.pill, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  speakLabel: { fontSize: 14, fontWeight: '700' },
  categoryPill: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  categoryText: { fontSize: 13, fontWeight: '600' },
  meaning: { fontSize: 18, lineHeight: 27 },
  heroActions: { gap: spacing.sm },
  favoriteButton: { minHeight: 48, borderWidth: 1, borderRadius: radii.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  favoriteLabel: { fontSize: 15, fontWeight: '700' },
  section: { gap: spacing.sm, flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  exampleCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderWidth: 1, borderRadius: radii.card, padding: spacing.md },
  exampleNumber: { fontSize: 13, fontWeight: '700', paddingTop: 2 },
  exampleText: { flex: 1, fontSize: 15, lineHeight: 23 },
  wordListGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  termList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  termChip: { borderRadius: radii.pill, minHeight: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  termText: { fontSize: 13, fontWeight: '600' },
  supportingText: { fontSize: 13, lineHeight: 20 },
  memoryCard: { borderRadius: radii.card, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  memoryText: { flex: 1, fontSize: 15, lineHeight: 23 },
  relatedCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.card, paddingHorizontal: spacing.md, gap: spacing.sm },
  relatedCopy: { flex: 1, gap: 4 },
  relatedWord: { fontSize: 16, fontWeight: '700' },
  relatedMeaning: { fontSize: 13 },
  deleteLink: { minHeight: 44, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  deleteText: { fontSize: 14, fontWeight: '700' },
});
