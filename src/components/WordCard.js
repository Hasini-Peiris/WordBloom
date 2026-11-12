import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';
import LevelBadge from './LevelBadge';

function WordCard({ word, learned = false, isFavorite = false, onPress, onEdit }) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${word.word}, ${word.meaning}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.wordTitleWrap}>
          <Text style={[styles.word, { color: theme.text }]}>{word.word}</Text>
          {word.isUserWord && (
            <View style={[styles.customBadge, { backgroundColor: `${theme.primary}1A` }]}>
              <Text style={[styles.customText, { color: theme.primary }]}>Custom</Text>
            </View>
          )}
        </View>
        <View style={styles.badgesRow}>
          {isFavorite && <Ionicons name="heart" size={17} color={theme.secondary} />}
          <LevelBadge level={word.level} />
          {onEdit && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${word.word}`}
              onPress={(e) => {
                e?.stopPropagation?.();
                onEdit();
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.editButton,
                { backgroundColor: `${theme.primary}16`, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="pencil" size={13} color={theme.primary} />
            </Pressable>
          )}
        </View>
      </View>
      <Text style={[styles.meaning, { color: theme.muted }]} numberOfLines={2}>
        {word.meaning}
      </Text>
      <View style={styles.bottomRow}>
        <View style={[styles.categoryBadge, { backgroundColor: `${theme.primary}14` }]}>
          <Ionicons name="folder-outline" size={12} color={theme.primary} />
          <Text style={[styles.categoryText, { color: theme.primary }]}>{word.category}</Text>
        </View>
        <Text style={[styles.meta, { color: theme.muted }]}>{word.partOfSpeech}</Text>
        {learned ? (
          <View style={styles.learnedTag}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.learnedText, { color: theme.success }]}>Learned</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  wordTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  word: {
    fontSize: 20,
    fontWeight: '700',
    flexShrink: 1,
  },
  customBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  customText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meaning: {
    fontSize: 14,
    lineHeight: 21,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    fontWeight: '600',
  },
  learnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  learnedText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default memo(WordCard);
