import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { radii, spacing } from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import { hapticLight, hapticMedium } from '../utils/haptics';

export default function FlipCard({
  word,
  flipped,
  onFlip,
  onSwipe,
}) {
  const { theme } = useTheme();
  const { speechRate } = useWords();
  const [rotation] = useState(() => new Animated.Value(0));
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    Animated.spring(rotation, {
      toValue: flipped ? 1 : 0,
      useNativeDriver: Platform.OS !== 'web',
      friction: 9,
      tension: 65,
    }).start();
  }, [flipped, rotation]);

  const handleSpeak = async () => {
    if (!word) return;
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

  const frontRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18
      && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 55) {
        hapticMedium();
        onSwipe?.('right');
      }
      if (gesture.dx < -55) {
        hapticMedium();
        onSwipe?.('left');
      }
    },
  }), [onSwipe]);

  return (
    <View {...panResponder.panHandlers} style={styles.gestureArea}>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Front Side */}
        <Animated.View
          pointerEvents={flipped ? 'none' : 'auto'}
          style={[
            styles.side,
            {
              backgroundColor: theme.surface,
              transform: [{ perspective: 1000 }, { rotateY: frontRotation }],
            },
          ]}
        >
          <View style={styles.sideContent}>
            <View style={styles.cardTopRow}>
              <View style={[styles.cardIcon, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name="leaf-outline" size={22} color={theme.primary} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Listen to pronunciation"
                onPress={handleSpeak}
                style={({ pressed }) => [
                  styles.audioIconBtn,
                  { backgroundColor: `${theme.primary}15`, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={8}
              >
                <Ionicons name={speaking ? 'stop' : 'volume-high'} size={18} color={theme.primary} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Flashcard for ${word.word}. Tap to flip and see the meaning.`}
              accessibilityHint="Swipe right if you know it, or left if you are still learning."
              onPress={() => {
                hapticLight();
                onFlip?.();
              }}
              style={({ pressed }) => [
                styles.cardBody,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.frontWord, { color: theme.text }]}>{word.word}</Text>
              {word.phonetic ? (
                <Text style={[styles.phonetic, { color: theme.muted }]}>{word.phonetic}</Text>
              ) : null}
              <View style={[styles.categoryBadge, { backgroundColor: `${theme.primary}12` }]}>
                <Text style={[styles.category, { color: theme.primary }]}>{word.category}</Text>
              </View>
              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={17} color={theme.muted} />
                <Text style={[styles.hintText, { color: theme.muted }]}>Tap anywhere to flip</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Back Side */}
        <Animated.View
          pointerEvents={flipped ? 'auto' : 'none'}
          style={[
            styles.side,
            styles.backSide,
            {
              backgroundColor: theme.surface,
              transform: [{ perspective: 1000 }, { rotateY: backRotation }],
            },
          ]}
        >
          <View style={styles.sideContent}>
            <View style={styles.cardTopRow}>
              <Text style={[styles.meaningLabel, { color: theme.primary }]}>DEFINITION</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Listen to pronunciation"
                onPress={handleSpeak}
                style={({ pressed }) => [
                  styles.audioIconBtn,
                  { backgroundColor: `${theme.primary}15`, opacity: pressed ? 0.7 : 1 },
                ]}
                hitSlop={8}
              >
                <Ionicons name={speaking ? 'stop' : 'volume-high'} size={18} color={theme.primary} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Meaning of ${word.word}: ${word.meaning}. Tap to see the word.`}
              onPress={() => {
                hapticLight();
                onFlip?.();
              }}
              style={({ pressed }) => [
                styles.cardBody,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={[styles.meaning, { color: theme.text }]}>{word.meaning}</Text>
              {word.examples?.[0] ? (
                <View style={[styles.exampleBox, { backgroundColor: `${theme.accent}12` }]}>
                  <Text style={[styles.example, { color: theme.text }]} numberOfLines={3}>
                    “{word.examples[0]}”
                  </Text>
                </View>
              ) : null}
              <View style={styles.flipHint}>
                <Ionicons name="sync-outline" size={17} color={theme.muted} />
                <Text style={[styles.hintText, { color: theme.muted }]}>Tap to see word</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gestureArea: { width: '100%' },
  card: {
    minHeight: 350,
    borderWidth: 1,
    borderRadius: radii.card,
    shadowColor: '#171323',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  side: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.card,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  backSide: { backfaceVisibility: 'hidden' },
  sideContent: {
    flex: 1,
    minHeight: 348,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  cardBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  audioIconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  frontWord: { fontSize: 34, fontWeight: '800', textAlign: 'center' },
  phonetic: { fontSize: 16 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.pill, marginTop: spacing.xs },
  category: { fontSize: 13, fontWeight: '700' },
  meaningLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  meaning: { fontSize: 22, lineHeight: 32, fontWeight: '600', textAlign: 'center' },
  exampleBox: { padding: spacing.md, borderRadius: radii.card, marginHorizontal: spacing.sm },
  example: { fontSize: 14, lineHeight: 21, textAlign: 'center', fontStyle: 'italic' },
  flipHint: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  hintText: { fontSize: 13 },
});
