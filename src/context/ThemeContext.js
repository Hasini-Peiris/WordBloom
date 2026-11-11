import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { STORAGE_KEYS } from '../storage/keys';
import { readJSON, writeJSON } from '../storage/storage';
import { colors } from '../theme/colors';

const ThemeContext = createContext(null);

function makeNavigationTheme(isDark, palette) {
  return {
    dark: isDark,
    colors: {
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.secondary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '700' },
    },
  };
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState('system');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    let active = true;
    readJSON(STORAGE_KEYS.THEME_MODE, 'system')
      .then((mode) => {
        if (!['light', 'dark', 'system'].includes(mode)) {
          throw new Error('Saved theme preference is invalid.');
        }
        if (active) setThemeModeState(mode);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load your theme preference.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    if (!['light', 'dark', 'system'].includes(mode)) {
      throw new Error('Choose a light, dark, or system theme.');
    }
    await writeJSON(STORAGE_KEYS.THEME_MODE, mode);
    setThemeModeState(mode);
    setError('');
  }, []);

  const refreshTheme = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mode = await readJSON(STORAGE_KEYS.THEME_MODE, 'system');
      if (!['light', 'dark', 'system'].includes(mode)) {
        throw new Error('Saved theme preference is invalid.');
      }
      setThemeModeState(mode);
    } catch (loadError) {
      setError(loadError.message || 'Could not load your theme preference.');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => {
    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
    const palette = isDark ? colors.dark : colors.light;
    return {
      theme: {
        ...palette,
        isDark,
        navigationTheme: makeNavigationTheme(isDark, palette),
      },
      themeMode,
      setThemeMode,
      loading,
      error,
      refreshTheme,
    };
  }, [error, loading, refreshTheme, setThemeMode, systemScheme, themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
