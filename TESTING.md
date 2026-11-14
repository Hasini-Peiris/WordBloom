# WordBloom testing checklist

Use an installed app build for the offline checks. Finish installing the app and any required operating-system speech voice packs before enabling airplane mode. No test item should require an API, account, or server.

## Airplane-mode checklist

Enable airplane mode, verify Wi-Fi and mobile data are off, then open WordBloom.

### Launch and onboarding

- [ ] App launches and shows the three onboarding slides on first launch.
- [ ] Continue and Skip controls work; the final slide accepts Beginner, Intermediate, or Advanced and a 5-, 10-, or 20-word daily goal.
- [ ] Completing onboarding opens the tabbed app and persists after force-closing and reopening.
- [ ] Existing users who completed onboarding go directly to the app.

### Home and library

- [ ] Home shows an offline-ready indicator, date-based Word of the Day, goal progress, streak, and category counts.
- [ ] Category and continue-learning controls open the expected library or word detail.
- [ ] Library search matches words, meanings, and synonyms while typing.
- [ ] Level, category, part-of-speech, and learned-status filters update the results and result count.
- [ ] A–Z, Z–A, level, and recently-added sorting work; alphabet quick-jump and clear-filters work.
- [ ] A query with no matches shows an empty state; pull-to-refresh completes without network access.

### Word details and saved lists

- [ ] Open a word and check its phonetic spelling, meaning, examples, synonyms, antonyms, and memory tip.
- [ ] Pronunciation works with an installed offline English voice; copy-to-clipboard works.
- [ ] Favorite and learned toggles update their saved lists and remain correct after restarting.
- [ ] Related words open the corresponding details.
- [ ] Favorites and Learned tabs show their respective words and understandable empty states.
- [ ] Removing a saved word updates the list.

### Custom vocabulary

- [ ] Add a valid custom word and confirm it appears in the library and details.
- [ ] Required-field and duplicate-word validation prevents invalid saves and explains the issue.
- [ ] Edit a custom word and verify the changes persist after restart.
- [ ] Delete a custom word only after confirming; confirm it is removed from the library and saved lists.

### Flashcards and quizzes

- [ ] Start flashcards for all words and for a selected category or level.
- [ ] Flip cards; use Know it and Still learning (and swipe gestures where available).
- [ ] Finish a session and check its summary; learned words persist.
- [ ] Start Meaning, Synonym match, and Fill in the blank quizzes.
- [ ] Answer all questions and verify progress, answer feedback, and explanations.
- [ ] Finish a quiz, review wrong answers, and verify score history updates.
- [ ] Return to the quiz menu and start another session.

### Progress and settings

- [ ] Progress totals, streak, daily goal, quiz average, best score, 7-day chart, and level mastery match saved activity.
- [ ] Change the theme to Light, Dark, and System; each selection persists and System follows the device setting.
- [ ] Change daily goal and speech speed; both persist. Try the voice sample and verify word pronunciation uses the selected speed.
- [ ] Clear favorites after confirmation; learned words and custom words remain.
- [ ] Reset progress after confirmation; learned words, daily activity, and quiz scores clear, while favorites and custom words remain.
- [ ] Remove custom words after confirmation; bundled words and quiz history remain.
- [ ] About information and the offline note are visible.

## Error and accessibility checks

- [ ] Test with a small phone viewport and a larger phone viewport; scrollable forms and lists remain reachable.
- [ ] Test system font scaling and screen-reader labels for icon-only buttons and filters.
- [ ] Deny or disable speech support if the OS permits; the app remains usable and reports pronunciation failure without crashing.
- [ ] If practical, simulate AsyncStorage read/write failure; the app should show an error and offer a retry where applicable.

## Developer checks

Run these from the project directory while online as needed for installed tooling:

```bash
npm run lint
npx expo-doctor
npx expo export --platform android --output-dir dist
```

The Expo export verifies that the JavaScript app and its required bundled assets can be packaged. It does not replace the airplane-mode runtime checklist above.
