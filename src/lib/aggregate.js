// Pure aggregation: join raw responses with the survey definition into
// per-question summaries for the results view. No React, no side effects.

import { isChoice, isText } from "./survey.js";

// Build questionId -> answer lookup for one response row.
function answersById(row) {
  const map = {};
  (row.answers || []).forEach((a) => {
    map[a.questionId] = a;
  });
  return map;
}

function summarizeChoice(q, rows) {
  const optionLabels = {};
  (q.options || []).forEach((o) => {
    optionLabels[o.id] = o.label;
  });
  const counts = {};
  (q.options || []).forEach((o) => {
    counts[o.id] = 0;
  });

  let totalAnswered = 0;
  for (const row of rows) {
    const a = answersById(row)[q.id];
    if (!a) continue;
    const picked =
      q.type === "multi_choice"
        ? a.selectedOptionIds || []
        : a.selectedOptionId != null
        ? [a.selectedOptionId]
        : [];
    if (picked.length === 0) continue;
    totalAnswered += 1;
    for (const id of picked) {
      counts[id] = (counts[id] || 0) + 1;
    }
  }

  const options = Object.keys(counts).map((id) => ({
    id,
    label: optionLabels[id] || id || "Unknown",
    count: counts[id],
    pct: totalAnswered ? Math.round((counts[id] / totalAnswered) * 100) : 0,
  }));

  return { kind: "choice", multi: q.type === "multi_choice", options, totalAnswered };
}

function summarizeScale(q, rows, def) {
  const scale = q.scale || def.scaleDefaults || { min: 1, max: 5 };
  const min = scale.min ?? 1;
  const max = scale.max ?? 5;

  const counts = {};
  for (let v = min; v <= max; v += 1) counts[v] = 0;

  let sum = 0;
  let totalAnswered = 0;
  for (const row of rows) {
    const a = answersById(row)[q.id];
    if (!a || a.scaleValue == null) continue;
    const v = Number(a.scaleValue);
    if (!Number.isFinite(v)) continue;
    totalAnswered += 1;
    sum += v;
    counts[v] = (counts[v] || 0) + 1;
  }

  const distribution = Object.keys(counts)
    .map((v) => ({ value: Number(v), count: counts[v] }))
    .sort((a, b) => a.value - b.value);

  return {
    kind: "scale",
    min,
    max,
    minLabel: scale.minLabel || "",
    maxLabel: scale.maxLabel || "",
    average: totalAnswered ? sum / totalAnswered : 0,
    distribution,
    totalAnswered,
  };
}

function summarizeText(q, rows) {
  const values = [];
  for (const row of rows) {
    const a = answersById(row)[q.id];
    if (!a || a.textValue == null || a.textValue === "") continue;
    values.push({
      text: a.textValue,
      userId: row.userId,
      submittedAt: row.submittedAt,
    });
  }
  return { kind: "text", values, totalAnswered: values.length };
}

export function summarizeResponses(def, rows) {
  const submittedTimes = rows.map((r) => r.submittedAt).filter(Boolean).sort();
  const meta = {
    total: rows.length,
    uniqueUsers: new Set(rows.map((r) => r.userId).filter(Boolean)).size,
    firstAt: submittedTimes[0] || null,
    lastAt: submittedTimes[submittedTimes.length - 1] || null,
    surveyType: def?.surveyType || "form",
  };

  const questions = (def?.questions || []).map((q) => {
    let summary;
    if (isChoice(q.type)) summary = summarizeChoice(q, rows);
    else if (isText(q.type)) summary = summarizeText(q, rows);
    else summary = summarizeScale(q, rows, def);
    return { id: q.id, type: q.type, prompt: q.prompt || q.id, ...summary };
  });

  return { meta, questions };
}
