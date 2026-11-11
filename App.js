import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { WordsProvider } from './src/context/WordsContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { theme } = useTheme();

  return (
    <NavigationContainer theme={theme.navigationTheme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <WordsProvider>
          <AppContent />
        </WordsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
