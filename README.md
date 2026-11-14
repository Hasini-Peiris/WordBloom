# 🌸 WordBloom — Offline English Vocabulary Learning App

> **ICA 03 – Individual React Native Project**  
> Expo SDK 58 · React Navigation 7 · AsyncStorage · Offline-first  

---

## 📱 App Overview

WordBloom is a fully offline English vocabulary learning app built with **Expo / React Native**. It helps learners discover, practise, and retain new English words through interactive flashcards, adaptive quizzes, and personal progress tracking — with zero internet dependency.

---

## 🖥 Screens (11 Total)

| # | Screen | Purpose |
|---|--------|---------|
| 1 | **Onboarding** | First-launch welcome & feature introduction |
| 2 | **Home** | Word of the Day, quick actions, streak counter |
| 3 | **Word Library** | Browse, search, and filter 200 vocabulary words |
| 4 | **Word Details** | Full definition, phonetics, examples, synonyms/antonyms |
| 5 | **Add / Edit Word** | Create or update custom vocabulary entries |
| 6 | **Saved Words** | Favourites and learned word collections |
| 7 | **Flashcards** | Flip-card practice with audio pronunciation |
| 8 | **Quiz** | 75-question bank: meaning, synonym, fill-in-the-blank |
| 9 | **Quiz Result** | Score, missed words, and study links |
| 10 | **Progress** | Streak, stats, quiz history, learning analytics |
| 11 | **Settings** | Theme toggle, haptics, dataset stats, reset |

> ✅ Exceeds the minimum requirement of 5 screens.

---

## ✨ Features

### 📚 Vocabulary
- **200 curated words** across 8 categories: Daily Life, Education, Business, Travel, Emotions, Technology, Nature, Health
- Each word includes: meaning, IPA phonetics, part of speech, 2 natural example sentences, synonyms, antonyms, difficulty level, and a memory tip
- **Search** words in real time by name or meaning
- **Filter** by category and difficulty level
- **Sort** alphabetically or by difficulty
- **Text-to-Speech** pronunciation on Word Details and Flashcards
- **Add custom words** with the same rich format

### ⭐ Favourites & Progress
- Mark any word as a **Favourite** or **Learned**
- **Daily streak** tracking with animated counter
- Quiz score history and **average score** tracking
- Words-learned counter linked directly to Saved Words screen

### 🃏 Flashcards
- Animated flip card (front: word + phonetic; back: meaning + examples)
- Audio listen button on both faces
- Swipe or tap to advance through the deck
- Filtered deck from your Library selections

### 🧠 Quiz
- 75 questions: **25 Meaning**, **25 Synonym Match**, **25 Fill-in-the-Blank**
- 4 clearly distinct answer options per question
- Educational explanations for every answer
- Missed words linked to Word Details for immediate review
- Results screen with score, percentage, and retry option

### 🌙 Theming & Accessibility
- Light and Dark mode (follows system preference, manual override in Settings)
- Haptic feedback on interactions (iOS/Android only)
- Accessible labels on all interactive elements

---

## 🏗 Project Structure

```
WordBloom/
├── src/
│   ├── app/                    # (reserved for future Expo Router migration)
│   ├── navigation/
│   │   ├── AppNavigator.js     # Root stack: Onboarding, MainTabs, modals
│   │   ├── TabNavigator.js     # 5 bottom tabs
│   │   └── QuizStack.js        # Quiz > QuizResult > WordDetails stack
│   ├── screens/
│   │   ├── OnboardingScreen.js
│   │   ├── HomeScreen.js
│   │   ├── WordLibraryScreen.js
│   │   ├── WordDetailsScreen.js
│   │   ├── AddEditWordScreen.js
│   │   ├── SavedWordsScreen.js
│   │   ├── FlashcardsScreen.js
│   │   ├── QuizScreen.js
│   │   ├── QuizResultScreen.js
│   │   ├── ProgressScreen.js
│   │   └── SettingsScreen.js
│   ├── components/
│   │   ├── FlipCard.js         # Animated flashcard component
│   │   ├── WordCard.js         # Reusable word list card
│   │   └── Toast.js            # In-app notification
│   ├── context/
│   │   └── VocabularyContext.js  # Global state: words, favourites, progress
│   ├── data/
│   │   ├── words.json          # 200 vocabulary entries
│   │   ├── quiz.json           # 75 quiz questions
│   │   └── categories.json     # Category metadata
│   └── utils/
│       └── haptics.js          # Safe cross-platform haptics wrapper
├── App.js
├── app.json
└── package.json
```

---

## 📊 Dataset Summary

### words.json
| Category | Words |
|----------|-------|
| Daily Life | 25 |
| Education | 25 |
| Business | 25 |
| Travel | 25 |
| Emotions | 25 |
| Technology | 25 |
| Nature | 25 |
| Health | 25 |
| **Total** | **200** |

Each word entry contains:
```json
{
  "id": "word-001",
  "word": "routine",
  "phonetic": "/ruːˈtiːn/",
  "partOfSpeech": "noun",
  "meaning": "A fixed regular set of activities performed repeatedly.",
  "examples": [
    "She follows a morning routine before going to university.",
    "Reading before bed every night has become part of his daily routine."
  ],
  "synonyms": ["habit", "schedule", "pattern"],
  "antonyms": ["irregularity", "spontaneity"],
  "difficulty": "beginner",
  "category": "Daily Life",
  "isFavorite": false,
  "isLearned": false,
  "isCustom": false,
  "memoryTip": "Think of 'route' — a routine is the daily route your life follows."
}
```

### quiz.json
| Type | Questions |
|------|-----------|
| Meaning (definition recall) | 25 |
| Synonym Match | 25 |
| Fill-in-the-Blank | 25 |
| **Total** | **75** |

---

## 🔌 Offline Architecture

```
App Launch
   │
   ├─► First Launch?
   │     └─► Load bundled words.json & quiz.json into AsyncStorage
   │
   └─► Subsequent Launch
         └─► Load from AsyncStorage (custom words, favourites, progress merged)
               │
               └─► VocabularyContext provides global state to all screens
```

> **No internet connection is required at any point.** All data is bundled within the app.

---

## 🚀 Running the App

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Install & Start
```bash
npm install
npx expo start
```

### Run on Device / Emulator
```bash
npx expo run:android   # Android (requires Android Studio)
npx expo run:ios       # iOS (requires Xcode on macOS)
```

### Web Preview
```bash
npx expo start --web
```

---

## 🧪 Test Checklist

| Feature | Test | Expected |
|---------|------|----------|
| Offline launch | Disable Wi-Fi, restart app | App loads fully |
| Search | Type partial word in Library | Results filter in real time |
| Category filter | Select 'Technology' | Only tech words shown |
| Favourites | Tap heart on Word Details | Word saved to Favourites tab |
| Custom word | Add a word via + button | Appears in Library with custom badge |
| Flashcard flip | Tap card | Smooth flip animation |
| Quiz | Complete 10 questions | Score calculated and stored |
| Progress | View Progress screen | Streak and quiz history shown |
| Dark mode | Toggle in Settings | All screens switch theme |
| Text-to-Speech | Tap speaker on Word Details | Word is read aloud |

---

## 📸 Screenshots

> **To capture screenshots:**
> 1. Run `npx expo start` and open the app on your device or emulator.
> 2. Navigate to each screen listed below.
> 3. Take a screenshot using your device (Power + Volume Down on Android; Power + Home/Side on iOS).

**Recommended screens to screenshot:**
- Home Screen (Word of the Day visible)
- Word Library (search bar active, results showing)
- Word Details (full entry with phonetics and examples)
- Flashcard (front face showing word)
- Quiz Screen (question with 4 options visible)
- Progress Screen (streak counter and quiz history)

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` (SDK 58) | Core Expo runtime |
| `react-navigation` v7 | Navigation (stack + bottom tabs) |
| `@react-native-async-storage/async-storage` | Local data persistence |
| `expo-speech` | Text-to-speech pronunciation |
| `expo-haptics` | Haptic feedback |
| `react-native-reanimated` | Smooth animations |

---

## 👩‍💻 Developer

**Hasini** — ICA 03 Individual React Native Project  
*WordBloom – Offline English Vocabulary Learning App*

---

*All vocabulary data, quiz questions, and application code were independently created by the developer.*
