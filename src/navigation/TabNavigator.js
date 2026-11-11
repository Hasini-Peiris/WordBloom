import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LibraryStack from './LibraryStack';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import QuizStack from './QuizStack';
import ProgressScreen from '../screens/ProgressScreen';
import { useTheme } from '../context/ThemeContext';
import { hapticSelection } from '../utils/haptics';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: 'home',
  Library: 'book',
  Flashcards: 'albums',
  Quiz: 'help-circle',
  Progress: 'stats-chart',
};

export default function TabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          minHeight: 62,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryStack} />
      <Tab.Screen name="Flashcards" component={FlashcardsScreen} />
      <Tab.Screen name="Quiz" component={QuizStack} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
}
