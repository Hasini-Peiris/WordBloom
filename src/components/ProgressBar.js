import { StyleSheet, View } from 'react-native';
import { radii } from '../theme/spacing';
import { useTheme } from '../context/ThemeContext';

export default function ProgressBar({ progress = 0, color }) {
  const { theme } = useTheme();
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%`;

  return (
    <View style={[styles.track, { backgroundColor: theme.border }]}>
      <View style={[styles.fill, { backgroundColor: color ?? theme.primary, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
  },
});
