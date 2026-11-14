// merge_words.js — Merges all 8 category files into src/data/words.json
/* global __dirname */
const fs = require('fs');
const path = require('path');

const categories = [
  require('./cat1_daily_life'),
  require('./cat2_education'),
  require('./cat3_business'),
  require('./cat4_travel'),
  require('./cat5_emotions'),
  require('./cat6_technology'),
  require('./cat7_nature'),
  require('./cat8_health'),
];

const allWords = categories.flat();

// Validate
console.log(`Total words: ${allWords.length}`);
if (allWords.length !== 200) {
  console.error(`ERROR: Expected 200 words, got ${allWords.length}`);
  process.exit(1);
}

// Check IDs are sequential word-001 to word-200
const ids = allWords.map(w => w.id);
for (let i = 1; i <= 200; i++) {
  const expected = `word-${String(i).padStart(3, '0')}`;
  if (!ids.includes(expected)) {
    console.error(`ERROR: Missing ID ${expected}`);
    process.exit(1);
  }
}

// Check no duplicate words
const wordNames = allWords.map(w => w.word.toLowerCase());
const unique = new Set(wordNames);
if (unique.size !== 200) {
  const dupes = wordNames.filter((w, i) => wordNames.indexOf(w) !== i);
  console.error(`ERROR: Duplicate words found: ${[...new Set(dupes)].join(', ')}`);
  process.exit(1);
}

// Write output
const outputPath = path.resolve(__dirname, '../../src/data/words.json');
fs.writeFileSync(outputPath, JSON.stringify(allWords, null, 2), 'utf8');
console.log(`Successfully wrote ${allWords.length} words to ${outputPath}`);

// Summary
const categories_summary = {};
allWords.forEach(w => {
  categories_summary[w.category] = (categories_summary[w.category] || 0) + 1;
});
console.log('\nCategory breakdown:');
Object.entries(categories_summary).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} words`);
});
