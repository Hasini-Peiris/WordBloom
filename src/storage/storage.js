import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJSON(key, fallback) {
  try {
    const storedValue = await AsyncStorage.getItem(key);
    if (storedValue === null) return fallback;
    return JSON.parse(storedValue);
  } catch (error) {
    throw new Error(`Could not read local data (${key}): ${error.message}`);
  }
}

export async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new Error(`Could not save local data (${key}): ${error.message}`);
  }
}

export async function removeStoredValue(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    throw new Error(`Could not remove local data (${key}): ${error.message}`);
  }
}
