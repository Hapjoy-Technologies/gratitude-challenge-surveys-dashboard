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
