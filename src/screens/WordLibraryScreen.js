import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import categories from '../data/categories.json';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { spacing, radii } from '../theme/spacing';
import EmptyState from '../components/EmptyState';
import LevelBadge from '../components/LevelBadge';
import PrimaryButton from '../components/PrimaryButton';
import { hapticLight } from '../utils/haptics';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const LEVEL_OPTIONS = [
  { label: 'All levels', value: 'All' },
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced', value: 'Advanced' },
];
const CATEGORY_OPTIONS = [
  { label: 'All categories', value: 'All' },
  ...categories.map(({ name }) => ({ label: name, value: name })),
];
const POS_OPTIONS = [
  { label: 'All types', value: 'All' },
  { label: 'Adjective', value: 'adjective' },
  { label: 'Noun', value: 'noun' },
  { label: 'Verb', value: 'verb' },
  { label: 'Adverb', value: 'adverb' },
];
const LEARNED_OPTIONS = [
  { label: 'All words', value: 'all' },
  { label: 'Learned', value: 'learned' },
  { label: 'Not learned', value: 'not-learned' },
];
const SORT_OPTIONS = [
  { label: 'A–Z', value: 'az' },
  { label: 'Z–A', value: 'za' },
  { label: 'Level', value: 'level' },
  { label: 'Newest', value: 'recent' },
];
const LEVEL_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };

function matchesSearch(word, query) {
  if (!query) return true;
  const q = query.trim().toLocaleLowerCase();
  return Boolean(
    word.word?.toLocaleLowerCase().includes(q) ||
    word.meaning?.toLocaleLowerCase().includes(q) ||
    word.synonyms?.some((s) => s.toLocaleLowerCase().includes(q))
  );
}

function getLevel(word) {
  if (word.level) return word.level;
  if (word.difficulty) {
    return word.difficulty.charAt(0).toUpperCase() + word.difficulty.slice(1).toLowerCase();
  }
  return 'Beginner';
}

/* ── Inline filter-chip row for the modal ── */
function ModalChips({ options, value, onChange }) {
  const { theme } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : 'transparent',
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: selected ? theme.primaryText : theme.text }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ── Compact word card matching the screenshot ── */
function LibraryWordCard({ word, isFavorite, learned, onPress }) {
  const { theme } = useTheme();
  const level = getLevel(word);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${word.word}, ${word.meaning}`}
      style={({ pressed }) => [
        styles.wordCard,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.wordCardTop}>
        <Text style={[styles.wordName, { color: theme.text }]}>{word.word}</Text>
        <LevelBadge level={level} />
      </View>
      <Text style={[styles.wordMeaning, { color: theme.muted }]} numberOfLines={2}>
        {word.meaning}
      </Text>
      <View style={styles.wordCardBottom}>
        <View style={[styles.categoryPill, { backgroundColor: `${theme.primary}20` }]}>
          <Text style={[styles.categoryPillText, { color: theme.primary }]}>{word.category}</Text>
        </View>
        <Text style={[styles.posText, { color: theme.muted }]}>{word.partOfSpeech}</Text>
        {isFavorite ? <Ionicons name="heart" size={14} color={theme.secondary} /> : null}
        {learned ? <Ionicons name="checkmark-circle" size={14} color={theme.success} /> : null}
      </View>
    </Pressable>
  );
}

export default function WordLibraryScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { words, favoriteWordIds, learnedWordIds, loading, error, refresh } = useWords();

  /* search */
  const [query, setQuery] = useState('');

  /* letter filter */
  const [letterFilter, setLetterFilter] = useState('');

  /* filter modal state */
  const [filterVisible, setFilterVisible] = useState(false);
  const [pendingLevel, setPendingLevel] = useState('All');
  const [pendingCategory, setPendingCategory] = useState(() => route.params?.category ?? 'All');
  const [pendingPos, setPendingPos] = useState('All');
  const [pendingLearned, setPendingLearned] = useState('all');
  const [pendingSort, setPendingSort] = useState('az');

  /* applied filters */
  const [appliedLevel, setAppliedLevel] = useState('All');
  const [appliedCategory, setAppliedCategory] = useState(() => route.params?.category ?? 'All');
  const [appliedPos, setAppliedPos] = useState('All');
  const [appliedLearned, setAppliedLearned] = useState('all');
  const [appliedSort, setAppliedSort] = useState('az');

  const activeFilterCount = [
    appliedLevel !== 'All',
    appliedCategory !== 'All',
    appliedPos !== 'All',
    appliedLearned !== 'all',
    appliedSort !== 'az',
  ].filter(Boolean).length;

  const openFilters = () => {
    /* sync pending with applied when opening */
    setPendingLevel(appliedLevel);
    setPendingCategory(appliedCategory);
    setPendingPos(appliedPos);
    setPendingLearned(appliedLearned);
    setPendingSort(appliedSort);
    setFilterVisible(true);
  };

  const applyFilters = () => {
    setAppliedLevel(pendingLevel);
    setAppliedCategory(pendingCategory);
    setAppliedPos(pendingPos);
    setAppliedLearned(pendingLearned);
    setAppliedSort(pendingSort);
    setFilterVisible(false);
    hapticLight();
  };

  const resetFilters = () => {
    setPendingLevel('All');
    setPendingCategory('All');
    setPendingPos('All');
    setPendingLearned('all');
    setPendingSort('az');
  };

  /* pending visible words for the Apply button count */
  const pendingWords = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return words.filter((word) => {
      if (!matchesSearch(word, q)) return false;
      if (letterFilter && !word.word?.toLocaleUpperCase().startsWith(letterFilter)) return false;
      if (pendingLevel !== 'All' && getLevel(word) !== pendingLevel) return false;
      if (pendingCategory !== 'All' && word.category !== pendingCategory) return false;
      if (pendingPos !== 'All' && word.partOfSpeech !== pendingPos) return false;
      const isLearned = learnedWordIds.includes(word.id);
      if (pendingLearned === 'learned' && !isLearned) return false;
      if (pendingLearned === 'not-learned' && isLearned) return false;
      return true;
    });
  }, [learnedWordIds, letterFilter, pendingCategory, pendingLearned, pendingLevel, pendingPos, query, words]);

  const visibleWords = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const filtered = words.filter((word) => {
      if (!matchesSearch(word, q)) return false;
      if (letterFilter && !word.word?.toLocaleUpperCase().startsWith(letterFilter)) return false;
      if (appliedLevel !== 'All' && getLevel(word) !== appliedLevel) return false;
      if (appliedCategory !== 'All' && word.category !== appliedCategory) return false;
      if (appliedPos !== 'All' && word.partOfSpeech !== appliedPos) return false;
      const isLearned = learnedWordIds.includes(word.id);
      if (appliedLearned === 'learned' && !isLearned) return false;
      if (appliedLearned === 'not-learned' && isLearned) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (appliedSort === 'za') return b.word.localeCompare(a.word);
      if (appliedSort === 'level') {
        return (LEVEL_ORDER[getLevel(a)] ?? 4) - (LEVEL_ORDER[getLevel(b)] ?? 4) || a.word.localeCompare(b.word);
      }
      if (appliedSort === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.word.localeCompare(b.word);
    });
  }, [appliedCategory, appliedLearned, appliedLevel, appliedPos, appliedSort, learnedWordIds, letterFilter, query, words]);

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.titleText, { color: theme.text }]}>Word Library</Text>
          <Text style={[styles.subtitleText, { color: theme.muted }]}>
            {words.length} curated &amp; custom vocabulary words
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add word to library"
          onPress={() => { hapticLight(); navigation.navigate('AddEditWord'); }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: theme.primary, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <Ionicons name="add" size={28} color={theme.primaryText} />
        </Pressable>
      </View>

      {/* Search bar with filter icon */}
      <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={20} color={theme.muted} />
        <TextInput
          accessibilityLabel="Search vocabulary"
          value={query}
          onChangeText={setQuery}
          placeholder="Search words, meanings, or synonyms…"
          placeholderTextColor={theme.muted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.searchInput, { color: theme.text }]}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={theme.muted} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={openFilters}
          hitSlop={8}
          style={[
            styles.filterIconBtn,
            { borderColor: activeFilterCount > 0 ? theme.primary : theme.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? theme.primary : theme.muted}
          />
          {activeFilterCount > 0 ? (
            <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.filterBadgeText, { color: theme.primaryText }]}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {/* Alphabet scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.alphabetRow}
      >
        {ALPHABET.map((letter) => {
          const active = letterFilter === letter;
          return (
            <Pressable
              key={letter}
              onPress={() => { hapticLight(); setLetterFilter(active ? '' : letter); }}
              style={[
                styles.letterBtn,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={[styles.letterText, { color: active ? theme.primaryText : theme.muted }]}>
                {letter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Result count */}
      <Text style={[styles.resultCount, { color: theme.muted }]}>
        Showing {visibleWords.length} of {words.length} words
      </Text>

      {error ? <Text style={[styles.inlineError, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );

  if (loading && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.stateText, { color: theme.muted }]}>Loading your word library…</Text>
      </SafeAreaView>
    );
  }

  if (error && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={36} color={theme.danger} />
        <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        <PrimaryButton title="Try again" onPress={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={visibleWords}
        keyExtractor={(word) => word.id}
        renderItem={({ item }) => (
          <LibraryWordCard
            word={item}
            learned={learnedWordIds.includes(item.id)}
            isFavorite={favoriteWordIds.includes(item.id)}
            onPress={() => { hapticLight(); navigation.navigate('WordDetails', { wordId: item.id }); }}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            image={require('../../assets/images/empty-search.png')}
            title="No words found"
            message="Try a different search or adjust your filters."
          />
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      {/* ── Filter Modal ── */}
      <Modal
        visible={filterVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Filter &amp; Sort Vocabulary</Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {[pendingLevel !== 'All', pendingCategory !== 'All', pendingPos !== 'All', pendingLearned !== 'all', pendingSort !== 'az'].filter(Boolean).length} active filters
              </Text>
            </View>
            <Pressable
              onPress={() => setFilterVisible(false)}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
            {/* Difficulty Level */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.text }]}>Difficulty Level</Text>
              <ModalChips options={LEVEL_OPTIONS} value={pendingLevel} onChange={setPendingLevel} />
            </View>

            {/* Category */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.text }]}>Category</Text>
              <ModalChips options={CATEGORY_OPTIONS} value={pendingCategory} onChange={setPendingCategory} />
            </View>

            {/* Part of Speech */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.text }]}>Part of Speech</Text>
              <ModalChips options={POS_OPTIONS} value={pendingPos} onChange={setPendingPos} />
            </View>

            {/* Learning Status */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.text }]}>Learning Status</Text>
              <ModalChips options={LEARNED_OPTIONS} value={pendingLearned} onChange={setPendingLearned} />
            </View>

            {/* Sort Order */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionLabel, { color: theme.text }]}>Sort Order</Text>
              <ModalChips options={SORT_OPTIONS} value={pendingSort} onChange={setPendingSort} />
            </View>

            {/* Reset link */}
            <Pressable onPress={resetFilters} style={styles.resetRow} hitSlop={8}>
              <Text style={[styles.resetText, { color: theme.muted }]}>Reset all filters</Text>
            </Pressable>
          </ScrollView>

          {/* Apply button */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Pressable
              onPress={applyFilters}
              style={({ pressed }) => [
                styles.applyBtn,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="checkmark" size={18} color={theme.primaryText} />
              <Text style={[styles.applyBtnText, { color: theme.primaryText }]}>
                Apply ({pendingWords.length} {pendingWords.length === 1 ? 'word' : 'words'})
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  stateText: { fontSize: 14 },
  errorText: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  inlineError: { fontSize: 13 },
  listContent: { paddingBottom: spacing.xxl, flexGrow: 1 },

  /* header */
  headerWrap: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleBlock: { flex: 1 },
  titleText: { fontSize: 26, fontWeight: '800' },
  subtitleText: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* search bar */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: spacing.sm },
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 9, fontWeight: '800' },

  /* alphabet row */
  alphabetRow: { gap: 6, paddingRight: spacing.sm },
  letterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  letterText: { fontSize: 12, fontWeight: '700' },

  /* result count */
  resultCount: { fontSize: 13, fontWeight: '600' },

  /* word card */
  wordCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 6,
  },
  wordCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  wordName: { fontSize: 20, fontWeight: '700', flexShrink: 1 },
  wordMeaning: { fontSize: 14, lineHeight: 20 },
  wordCardBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryPillText: { fontSize: 12, fontWeight: '700' },
  posText: { fontSize: 12 },

  /* chip row in modal */
  chipRow: { gap: 8, paddingRight: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 4,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  filterSection: { gap: spacing.xs, marginBottom: spacing.md },
  filterSectionLabel: { fontSize: 14, fontWeight: '700' },
  resetRow: { alignItems: 'center', paddingVertical: spacing.sm },
  resetText: { fontSize: 13 },
  modalFooter: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: radii.card,
  },
  applyBtnText: { fontSize: 16, fontWeight: '700' },
});
