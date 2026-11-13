export const QUIZ_LENGTH = 10;

const VALID_TYPES = ['meaning', 'synonym', 'fill'];

function shuffle(items, random = Math.random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function buildQuiz(questionBank, mode, count = QUIZ_LENGTH, random = Math.random) {
  if (!VALID_TYPES.includes(mode)) {
    throw new Error('Choose a meaning, synonym, or fill-in-the-blank quiz.');
  }

  const eligible = questionBank.filter((question) => question.type === mode);
  if (eligible.length < count) {
    throw new Error(`Not enough ${mode} questions are available to start a quiz.`);
  }

  return shuffle(eligible, random)
    .slice(0, count)
    .map((question) => {
      const correctAnswer = question.options[question.answerIndex];
      if (!correctAnswer) {
        throw new Error(`Quiz question "${question.id}" has no correct answer.`);
      }
      const options = shuffle(question.options, random);
      return {
        ...question,
        options,
        answerIndex: options.indexOf(correctAnswer),
      };
    });
}
