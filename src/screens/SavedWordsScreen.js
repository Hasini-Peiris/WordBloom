import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { radii, spacing } from '../theme/spacing';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import ScreenHeader from '../components/ScreenHeader';
import WordCard from '../components/WordCard';
import { hapticLight, hapticSuccess } from '../utils/haptics';

const TABS = [
  { label: 'Favourites', value: 'favorites', icon: 'heart-outline' },
  { label: 'Learned', value: 'learned', icon: 'checkmark-circle-outline' },
];

export default function SavedWordsScreen({ navigation, route }) {
  const { theme } = useTheme();
  const {
    words,
    favoriteWordIds,
    learnedWordIds,
    toggleFavorite,
    unmarkLearned,
    loading,
    error,
    refresh,
  } = useWords();
  const [activeTab, setActiveTab] = useState(route.params?.initialTab ?? 'favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const [workingId, setWorkingId] = useState('');

  const savedWords = useMemo(() => {
    const ids = activeTab === 'favorites' ? favoriteWordIds : learnedWordIds;
    const list = ids.map((id) => words.find((word) => word.id === id)).filter(Boolean);
    if (!searchQuery.trim()) return list;
    const query = searchQuery.trim().toLocaleLowerCase();
    return list.filter((word) => (
      word.word.toLocaleLowerCase().includes(query)
      || word.meaning.toLocaleLowerCase().includes(query)
      || word.category.toLocaleLowerCase().includes(query)
    ));
  }, [activeTab, favoriteWordIds, learnedWordIds, searchQuery, words]);

  const handleRemove = async (wordId) => {
    if (workingId) return;
    setWorkingId(wordId);
    setActionError('');
    try {
      if (activeTab === 'favorites') {
        await toggleFavorite(wordId);
      } else {
        await unmarkLearned(wordId);
      }
      hapticSuccess();
    } catch (removeError) {
      setActionError(removeError.message || 'Could not update your saved words.');
    } finally {
      setWorkingId('');
    }
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <ScreenHeader
        title="My Words"
        subtitle={activeTab === 'favorites' ? 'Your hand-picked favourite vocabulary.' : 'Words you have mastered and marked as learned.'}
      />
      <View style={[styles.tabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {TABS.map((tab) => {
          const selected = activeTab === tab.value;
          const count = tab.value === 'favorites' ? favoriteWordIds.length : learnedWordIds.length;
          return (
            <Pressable
              key={tab.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                hapticLight();
                setActiveTab(tab.value);
              }}
              style={[
                styles.tab,
                selected && { backgroundColor: theme.primary },
              ]}
            >
              <Ionicons name={tab.icon} size={17} color={selected ? theme.primaryText : theme.muted} />
              <Text style={[styles.tabLabel, { color: selected ? theme.primaryText : theme.muted }]}>
                {tab.label} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab === 'favorites' ? 'favourites' : 'learned words'}…`}
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={theme.muted} />
          </Pressable>
        ) : null}
      </View>

      {actionError ? <Text style={[styles.errorText, { color: theme.danger }]}>{actionError}</Text> : null}
    </View>
  );

  if (loading && words.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.stateText, { color: theme.muted }]}>Opening your saved words…</Text>
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
      {navigation.canGoBack() && (
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
          <Text style={[styles.topBarTitle, { color: theme.text }]}>My Words</Text>
        </View>
      )}

      <FlatList
        data={savedWords}
        keyExtractor={(word) => word.id}
        renderItem={({ item }) => (
          <View style={styles.wordItem}>
            <WordCard
              word={item}
              learned={learnedWordIds.includes(item.id)}
              isFavorite={favoriteWordIds.includes(item.id)}
              onPress={() => {
                hapticLight();
                navigation.navigate('WordDetails', { wordId: item.id });
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={activeTab === 'favorites' ? `Remove ${item.word} from favourites` : `Move ${item.word} to learning`}
              onPress={() => handleRemove(item.id)}
              disabled={workingId === item.id}
              style={({ pressed }) => [
                styles.removeButton,
                { borderColor: theme.border, opacity: pressed || workingId === item.id ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="close-circle-outline" size={18} color={theme.muted} />
              <Text style={[styles.removeLabel, { color: theme.muted }]}>
                {workingId === item.id ? 'Updating…' : activeTab === 'favorites' ? 'Remove favourite' : 'Move to learning'}
              </Text>
            </Pressable>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon={activeTab === 'favorites' ? 'heart-outline' : 'school-outline'}
            image={activeTab === 'favorites' ? require('../../assets/images/empty-favorites.png') : undefined}
            title={activeTab === 'favorites' ? 'No favourites yet' : 'No learned words yet'}
            message={
              activeTab === 'favorites'
                ? 'Save words you would like to revisit and they will be collected here.'
                : 'Mark a word as learned and it will appear here.'
            }
          />
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
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
  stateText: { fontSize: 14 },
  listContent: { flexGrow: 1, padding: spacing.lg, paddingBottom: spacing.xxl },
  listHeader: { gap: spacing.md, marginBottom: spacing.md },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: radii.card, padding: 4 },
  tab: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radii.small },
  tabLabel: { fontSize: 13, fontWeight: '700' },
  searchBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  searchInput: { flex: 1, fontSize: 14, minHeight: 44 },
  wordItem: { marginBottom: spacing.md },
  removeButton: { alignSelf: 'flex-end', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, borderWidth: 1, borderRadius: radii.pill },
  removeLabel: { fontSize: 12, fontWeight: '600' },
  errorText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});
