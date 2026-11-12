import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';

export default function Toast({ message, type = 'success', onDismiss }) {
  const { theme } = useTheme();
  const isError = type === 'error';
  const color = isError ? theme.danger : theme.success;

  useEffect(() => {
    if (!message) return undefined;
    AccessibilityInfo.announceForAccessibility(message);
    const timer = setTimeout(onDismiss, 2800);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.toast, { backgroundColor: theme.surface, borderColor: color }]}
    >
      <Ionicons name={isError ? 'alert-circle' : 'checkmark-circle'} size={20} color={color} />
      <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#171323',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
