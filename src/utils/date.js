export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getWordOfTheDay(words, date = new Date()) {
  if (words.length === 0) return null;
  const dateKey = getLocalDateKey(date);
  const dateNumber = Number(dateKey.replaceAll('-', ''));
  return words[dateNumber % words.length];
}
