import { Pressable, StyleSheet, Text } from 'react-native';
import { radii, spacing } from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';

export default function PrimaryButton({ title, onPress, variant = 'primary', disabled = false }) {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';
  const backgroundColor = isPrimary ? theme.primary : theme.surface;
  const textColor = isPrimary ? theme.primaryText : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: theme.border, opacity: disabled ? 0.5 : pressed ? 0.82 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
