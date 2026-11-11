import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import WordDetailsScreen from '../screens/WordDetailsScreen';
import AddEditWordScreen from '../screens/AddEditWordScreen';
import SavedWordsScreen from '../screens/SavedWordsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';
import { useWords } from '../context/WordsContext';
import PrimaryButton from '../components/PrimaryButton';
import { spacing } from '../theme/spacing';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { theme } = useTheme();
  const { loading, error, refresh, onboardingComplete } = useWords();

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.message, { color: theme.muted }]}>Opening your word garden…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Your words could not be opened</Text>
        <Text style={[styles.message, { color: theme.muted }]}>{error}</Text>
        <PrimaryButton title="Try again" onPress={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={onboardingComplete ? 'MainTabs' : 'Onboarding'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="WordDetails" component={WordDetailsScreen} />
      <Stack.Screen name="AddEditWord" component={AddEditWordScreen} />
      <Stack.Screen name="SavedWords" component={SavedWordsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
