import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WordLibraryScreen from '../screens/WordLibraryScreen';
import WordDetailsScreen from '../screens/WordDetailsScreen';
import AddEditWordScreen from '../screens/AddEditWordScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function LibraryStack() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="WordLibrary" component={WordLibraryScreen} />
      <Stack.Screen name="WordDetails" component={WordDetailsScreen} />
      <Stack.Screen name="AddEditWord" component={AddEditWordScreen} />
    </Stack.Navigator>
  );
}
