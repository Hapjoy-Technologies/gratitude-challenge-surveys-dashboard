// Temporary mock data so the results view can be demoed before real
// submissions exist. Flip USE_MOCK_RESPONSES to false to use the live API.
//
// Mock responses are generated from the survey *definition* so the charts line
// up with the actual questions/options of whichever survey you open.

export const USE_MOCK_RESPONSES = false;

const SAMPLE_TEXT = [
  "Really enjoyed this, thank you!",
  "It was okay, nothing special.",
  "The reflection helped me a lot this week.",
  "Could be shorter.",
  "Loved the prompts, very thoughtful.",
  "Not sure how I feel yet.",
  "Grateful for my family and friends.",
  "This made me pause and think.",
  "A bit repetitive but useful.",
  "Great way to end the day.",
];

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function randomUserId() {
  return "u_" + Math.random().toString(36).slice(2, 10);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function answerFor(q, def) {
  switch (q.type) {
    case "scale": {
      const scale = q.scale || def.scaleDefaults || { min: 1, max: 5 };
      const min = scale.min ?? 1;
      const max = scale.max ?? 5;
      // mild central bias so the histogram looks natural
      const v = Math.round((randInt(min, max) + randInt(min, max)) / 2);
      return { questionId: q.id, type: q.type, scaleValue: v };
    }
    case "single_choice": {
      const opts = q.options || [];
      if (!opts.length) return null;
      return { questionId: q.id, type: q.type, selectedOptionId: pick(opts).id };
    }
    case "multi_choice": {
      const opts = q.options || [];
      if (!opts.length) return null;
      const cap = Math.min(q.maxSelections || opts.length, opts.length);
      const n = randInt(1, cap);
      return {
        questionId: q.id,
        type: q.type,
        selectedOptionIds: shuffle(opts).slice(0, n).map((o) => o.id),
      };
    }
    case "short_text":
    case "long_text":
      return { questionId: q.id, type: q.type, textValue: pick(SAMPLE_TEXT) };
    default:
      return null;
  }
}

export function generateMockResponses(def, count = 24) {
  if (!def || !Array.isArray(def.questions)) return [];

  // a small pool of users so "unique users" < total (realistic)
  const userPool = Array.from({ length: Math.max(3, Math.ceil(count / 3)) }, randomUserId);
  const now = Date.now();
  const rows = [];

  for (let i = 0; i < count; i += 1) {
    const answers = [];
    for (const q of def.questions) {
      // optional questions get skipped ~30% of the time to show partials
      if (q.required === false && Math.random() < 0.3) continue;
      const a = answerFor(q, def);
      if (a) answers.push(a);
    }
    rows.push({
      userId: pick(userPool),
      challengeId: def.challengeId || "mock_challenge",
      surveyId: def.id,
      dayNum: randInt(1, 7),
      surveyType: def.surveyType || "form",
      submittedAt: new Date(now - randInt(0, 29) * 86400000 - randInt(0, 86400) * 1000).toISOString(),
      answers,
    });
  }
  return rows;
}
