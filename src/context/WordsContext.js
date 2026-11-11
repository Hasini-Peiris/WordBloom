import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import bundledWords from '../data/words.json';
import { getLocalDateKey } from '../utils/date';
import { STORAGE_KEYS } from '../storage/keys';
import { readJSON, writeJSON } from '../storage/storage';

const WordsContext = createContext(null);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateList(value, key) {
  if (!Array.isArray(value)) {
    throw new Error(`Local data (${key}) is invalid. Reset the app's saved data and try again.`);
  }
  return value;
}

async function loadAppData() {
  const [savedWords, favorites, learned, dates, goal, history, onboarding, learningLevel, speechRate] = await Promise.all([
    readJSON(STORAGE_KEYS.USER_WORDS, []),
    readJSON(STORAGE_KEYS.FAVORITE_WORDS, []),
    readJSON(STORAGE_KEYS.LEARNED_WORDS, []),
    readJSON(STORAGE_KEYS.LEARNING_DATES, {}),
    readJSON(STORAGE_KEYS.DAILY_GOAL, 10),
    readJSON(STORAGE_KEYS.QUIZ_HISTORY, []),
    readJSON(STORAGE_KEYS.ONBOARDING_COMPLETE, false),
    readJSON(STORAGE_KEYS.LEARNING_LEVEL, 'Beginner'),
    readJSON(STORAGE_KEYS.SPEECH_RATE, 0.85),
  ]);
  const userWords = validateList(savedWords, STORAGE_KEYS.USER_WORDS);
  const favoriteWordIds = validateList(favorites, STORAGE_KEYS.FAVORITE_WORDS);
  const learnedWordIds = validateList(learned, STORAGE_KEYS.LEARNED_WORDS);
  const quizHistory = validateList(history, STORAGE_KEYS.QUIZ_HISTORY);
  if (typeof onboarding !== 'boolean') {
    throw new Error(`Local data (${STORAGE_KEYS.ONBOARDING_COMPLETE}) is invalid.`);
  }
  if (!isRecord(dates)) {
    throw new Error(`Local data (${STORAGE_KEYS.LEARNING_DATES}) is invalid.`);
  }

  const userWordsMap = new Map(userWords.map((w) => [w.id, w]));
  const mergedBundled = bundledWords.map((bundled) => {
    const override = userWordsMap.get(bundled.id);
    return override ? { ...bundled, ...override, isUserWord: true } : bundled;
  });
  const newCustomWords = userWords
    .filter((w) => !bundledWords.some((b) => b.id === w.id))
    .map((w) => ({ ...w, isUserWord: true }));

  return {
    userWords,
    favoriteWordIds,
    learnedWordIds,
    learningDates: dates,
    dailyGoal: [5, 10, 20].includes(goal) ? goal : 10,
    quizHistory,
    onboardingComplete: onboarding,
    learningLevel: ['Beginner', 'Intermediate', 'Advanced'].includes(learningLevel)
      ? learningLevel
      : 'Beginner',
    speechRate: [0.7, 0.85, 1, 1.15].includes(speechRate) ? speechRate : 0.85,
    words: [...mergedBundled, ...newCustomWords],
  };
}

export function WordsProvider({ children }) {
  const [words, setWords] = useState([]);
  const [userWords, setUserWords] = useState([]);
  const [favoriteWordIds, setFavoriteWordIds] = useState([]);
  const [learnedWordIds, setLearnedWordIds] = useState([]);
  const [learningDates, setLearningDates] = useState({});
  const [dailyGoal, setDailyGoalState] = useState(10);
  const [quizHistory, setQuizHistory] = useState([]);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [learningLevel, setLearningLevelState] = useState('Beginner');
  const [speechRate, setSpeechRateState] = useState(0.85);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applyAppData = useCallback((data) => {
    setUserWords(data.userWords);
    setFavoriteWordIds(data.favoriteWordIds);
    setLearnedWordIds(data.learnedWordIds);
    setLearningDates(data.learningDates);
    setDailyGoalState(data.dailyGoal);
    setQuizHistory(data.quizHistory);
    setOnboardingComplete(data.onboardingComplete);
    setLearningLevelState(data.learningLevel);
    setSpeechRateState(data.speechRate);
    setWords(data.words);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      applyAppData(await loadAppData());
    } catch (loadError) {
      setError(loadError.message || 'Could not load your saved words.');
    } finally {
      setLoading(false);
    }
  }, [applyAppData]);

  useEffect(() => {
    let active = true;
    loadAppData()
      .then((data) => {
        if (active) applyAppData(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load your saved words.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyAppData]);

  const toggleFavorite = useCallback(async (wordId) => {
    const updated = favoriteWordIds.includes(wordId)
      ? favoriteWordIds.filter((id) => id !== wordId)
      : [...favoriteWordIds, wordId];
    await writeJSON(STORAGE_KEYS.FAVORITE_WORDS, updated);
    setFavoriteWordIds(updated);
    return updated.includes(wordId);
  }, [favoriteWordIds]);

  const markLearned = useCallback(async (wordId) => {
    if (learnedWordIds.includes(wordId)) return;
    const updatedIds = [...learnedWordIds, wordId];
    const today = getLocalDateKey();
    const updatedDates = { ...learningDates, [today]: (learningDates[today] ?? 0) + 1 };
    await Promise.all([
      writeJSON(STORAGE_KEYS.LEARNED_WORDS, updatedIds),
      writeJSON(STORAGE_KEYS.LEARNING_DATES, updatedDates),
    ]);
    setLearnedWordIds(updatedIds);
    setLearningDates(updatedDates);
  }, [learnedWordIds, learningDates]);

  const unmarkLearned = useCallback(async (wordId) => {
    if (!learnedWordIds.includes(wordId)) return;
    const updatedIds = learnedWordIds.filter((id) => id !== wordId);
    await writeJSON(STORAGE_KEYS.LEARNED_WORDS, updatedIds);
    setLearnedWordIds(updatedIds);
  }, [learnedWordIds]);

  const saveUserWord = useCallback(async (word, wordId) => {
    const normalizedWord = word.word.trim().toLocaleLowerCase();
    const duplicate = words.find((item) => (
      item.word.trim().toLocaleLowerCase() === normalizedWord && item.id !== wordId
    ));
    if (duplicate) {
      throw new Error(`“${duplicate.word}” is already in your word library.`);
    }

    let updatedUserWords;
    let targetId = wordId;
    if (wordId) {
      const exists = userWords.some((item) => item.id === wordId);
      if (exists) {
        updatedUserWords = userWords.map((item) =>
          item.id === wordId ? { ...item, ...word, id: wordId, isUserWord: true } : item
        );
      } else {
        // Bundled word being customized/edited
        updatedUserWords = [...userWords, { ...word, id: wordId, isUserWord: true }];
      }
    } else {
      targetId = `user-${Date.now()}`;
      updatedUserWords = [...userWords, { ...word, id: targetId, isUserWord: true }];
    }

    await writeJSON(STORAGE_KEYS.USER_WORDS, updatedUserWords);
    setUserWords(updatedUserWords);

    const userWordsMap = new Map(updatedUserWords.map((w) => [w.id, w]));
    const mergedBundled = bundledWords.map((bundled) => {
      const override = userWordsMap.get(bundled.id);
      return override ? { ...bundled, ...override, isUserWord: true } : bundled;
    });
    const newCustomWords = updatedUserWords
      .filter((w) => !bundledWords.some((b) => b.id === w.id))
      .map((w) => ({ ...w, isUserWord: true }));

    setWords([...mergedBundled, ...newCustomWords]);
    return targetId;
  }, [userWords, words]);

  const deleteUserWord = useCallback(async (wordId) => {
    const isBundled = bundledWords.some((b) => b.id === wordId);
    const updatedUserWords = userWords.filter((word) => word.id !== wordId);
    const updatedFavorites = !isBundled
      ? favoriteWordIds.filter((id) => id !== wordId)
      : favoriteWordIds;
    const updatedLearned = !isBundled
      ? learnedWordIds.filter((id) => id !== wordId)
      : learnedWordIds;

    await Promise.all([
      writeJSON(STORAGE_KEYS.USER_WORDS, updatedUserWords),
      writeJSON(STORAGE_KEYS.FAVORITE_WORDS, updatedFavorites),
      writeJSON(STORAGE_KEYS.LEARNED_WORDS, updatedLearned),
    ]);
    setUserWords(updatedUserWords);
    setFavoriteWordIds(updatedFavorites);
    setLearnedWordIds(updatedLearned);

    const userWordsMap = new Map(updatedUserWords.map((w) => [w.id, w]));
    const mergedBundled = bundledWords.map((bundled) => {
      const override = userWordsMap.get(bundled.id);
      return override ? { ...bundled, ...override, isUserWord: true } : bundled;
    });
    const newCustomWords = updatedUserWords
      .filter((w) => !bundledWords.some((b) => b.id === w.id))
      .map((w) => ({ ...w, isUserWord: true }));

    setWords([...mergedBundled, ...newCustomWords]);
  }, [favoriteWordIds, learnedWordIds, userWords]);

  const setDailyGoal = useCallback(async (goal) => {
    if (![5, 10, 20].includes(goal)) {
      throw new Error('Choose a daily goal of 5, 10, or 20 words.');
    }
    await writeJSON(STORAGE_KEYS.DAILY_GOAL, goal);
    setDailyGoalState(goal);
  }, []);

  const recordQuizResult = useCallback(async (result) => {
    if (!result || !['meaning', 'synonym', 'fill'].includes(result.mode)
      || !Number.isInteger(result.score) || !Number.isInteger(result.total)
      || result.score < 0 || result.score > result.total || result.total < 1) {
      throw new Error('Quiz result is invalid and could not be saved.');
    }

    const savedResult = {
      id: `${Date.now()}-${result.mode}`,
      date: new Date().toISOString(),
      mode: result.mode,
      score: result.score,
      total: result.total,
      percentage: Math.round((result.score / result.total) * 100),
    };
    const updatedHistory = [savedResult, ...quizHistory].slice(0, 100);
    await writeJSON(STORAGE_KEYS.QUIZ_HISTORY, updatedHistory);
    setQuizHistory(updatedHistory);
    return savedResult;
  }, [quizHistory]);

  const completeOnboarding = useCallback(async (level, goal) => {
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(level)) {
      throw new Error('Choose a learning level to get started.');
    }
    if (![5, 10, 20].includes(goal)) {
      throw new Error('Choose a daily goal of 5, 10, or 20 words.');
    }
    await Promise.all([
      writeJSON(STORAGE_KEYS.LEARNING_LEVEL, level),
      writeJSON(STORAGE_KEYS.DAILY_GOAL, goal),
    ]);
    await writeJSON(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    setLearningLevelState(level);
    setDailyGoalState(goal);
    setOnboardingComplete(true);
  }, []);

  const setSpeechRate = useCallback(async (rate) => {
    if (![0.7, 0.85, 1, 1.15].includes(rate)) {
      throw new Error('Choose one of the available speech speeds.');
    }
    await writeJSON(STORAGE_KEYS.SPEECH_RATE, rate);
    setSpeechRateState(rate);
  }, []);

  const clearFavorites = useCallback(async () => {
    await writeJSON(STORAGE_KEYS.FAVORITE_WORDS, []);
    setFavoriteWordIds([]);
  }, []);

  const resetProgress = useCallback(async () => {
    await Promise.all([
      writeJSON(STORAGE_KEYS.LEARNED_WORDS, []),
      writeJSON(STORAGE_KEYS.LEARNING_DATES, {}),
      writeJSON(STORAGE_KEYS.QUIZ_HISTORY, []),
    ]);
    setLearnedWordIds([]);
    setLearningDates({});
    setQuizHistory([]);
  }, []);

  const resetUserWords = useCallback(async () => {
    const userWordIds = new Set(userWords.map((word) => word.id));
    const remainingFavorites = favoriteWordIds.filter((id) => !userWordIds.has(id));
    const remainingLearned = learnedWordIds.filter((id) => !userWordIds.has(id));
    await Promise.all([
      writeJSON(STORAGE_KEYS.USER_WORDS, []),
      writeJSON(STORAGE_KEYS.FAVORITE_WORDS, remainingFavorites),
      writeJSON(STORAGE_KEYS.LEARNED_WORDS, remainingLearned),
    ]);
    setUserWords([]);
    setFavoriteWordIds(remainingFavorites);
    setLearnedWordIds(remainingLearned);
    setWords(bundledWords);
  }, [favoriteWordIds, learnedWordIds, userWords]);

  const value = useMemo(() => ({
    words,
    userWords,
    favoriteWordIds,
    learnedWordIds,
    learningDates,
    dailyGoal,
    quizHistory,
    onboardingComplete,
    learningLevel,
    speechRate,
    loading,
    error,
    refresh,
    toggleFavorite,
    markLearned,
    unmarkLearned,
    saveUserWord,
    deleteUserWord,
    setDailyGoal,
    recordQuizResult,
    completeOnboarding,
    setSpeechRate,
    clearFavorites,
    resetProgress,
    resetUserWords,
  }), [
    words,
    userWords,
    favoriteWordIds,
    learnedWordIds,
    learningDates,
    dailyGoal,
    quizHistory,
    onboardingComplete,
    learningLevel,
    speechRate,
    loading,
    error,
    refresh,
    toggleFavorite,
    markLearned,
    unmarkLearned,
    saveUserWord,
    deleteUserWord,
    setDailyGoal,
    recordQuizResult,
    completeOnboarding,
    setSpeechRate,
    clearFavorites,
    resetProgress,
    resetUserWords,
  ]);

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  const context = useContext(WordsContext);
  if (!context) {
    throw new Error('useWords must be used within a WordsProvider');
  }
  return context;
}
