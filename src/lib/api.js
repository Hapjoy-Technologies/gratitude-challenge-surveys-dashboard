// SurveyGeneratorCache API — backed by a standalone Lambda Function URL.
// GET  -> list saved/generated surveys
// POST -> upsert one survey definition (keyed by definition.id)

export const API_BASE =
  "https://6pvd6abqzi6e7axmwavoz3egpq0qjaas.lambda-url.us-east-1.on.aws";

// GET -> { surveys: [ { id, version, surveyType, status, definition, updatedAt } ] }
export async function fetchGeneratedSurveys() {
  const res = await fetch(API_BASE, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.surveys || [];
}

// POST { definition, status } -> persists one cache item (upsert by definition.id).
export async function saveGeneratedSurvey(definition, status = "draft") {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ definition, status }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Survey responses — backed by the rewritten fetchSurveyResults Lambda.
// Querys ChallengeSurveyResponses by surveyId and returns raw V2 answers.
export const RESPONSES_API_BASE =
  "https://pl5xaf0r80.execute-api.us-east-1.amazonaws.com/prod/fetchSurveyResults";

// GET -> { results: [ { userId, challengeId, surveyId, dayNum, surveyType, submittedAt, answers[] } ], count, nextCursor }
export async function fetchSurveyResponsesPage({
  surveyId,
  challengeId,
  dayNum,
  cursor,
  limit = 200,
}) {
  const url = new URL(RESPONSES_API_BASE);
  url.searchParams.set("surveyId", surveyId);
  if (challengeId) url.searchParams.set("challengeId", challengeId);
  if (dayNum != null) url.searchParams.set("dayNum", String(dayNum));
  if (limit) url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Follows nextCursor to collect every response for a survey (GSI Query => complete set).
export async function fetchAllSurveyResponses(surveyId, opts = {}) {
  let cursor = null;
  let all = [];
  do {
    const { results, nextCursor } = await fetchSurveyResponsesPage({
      surveyId,
      cursor,
      ...opts,
    });
    all = all.concat(results || []);
    cursor = nextCursor;
  } while (cursor);
  return all;
}
