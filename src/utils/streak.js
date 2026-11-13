import { getLocalDateKey } from './date';

export function getCurrentStreak(learningDates, today = new Date()) {
  const learnedDays = new Set(Object.keys(learningDates));
  let current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterday = new Date(current);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!learnedDays.has(getLocalDateKey(current))) {
    if (!learnedDays.has(getLocalDateKey(yesterday))) return 0;
    current = yesterday;
  }

  let streak = 0;
  while (learnedDays.has(getLocalDateKey(current))) {
    streak += 1;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}
