// Survey domain helpers: factories, JSON builder, validation.
// Schema is the single source of truth from the API docs (surveysV2).

export const SURVEY_VERSION = 2;

export const SURVEY_TYPES = ["form", "scored", "external"];

export const QUESTION_TYPES = [
  "scale",
  "single_choice",
  "multi_choice",
  "short_text",
  "long_text",
];

export const QUESTION_TYPE_LABELS = {
  scale: "Scale (1–N)",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  short_text: "Short text",
  long_text: "Long text",
};

const CHOICE_TYPES = ["single_choice", "multi_choice"];
const TEXT_TYPES = ["short_text", "long_text"];

export const isChoice = (t) => CHOICE_TYPES.includes(t);
export const isText = (t) => TEXT_TYPES.includes(t);

// Internal, session-unique key for React lists / reordering. Never exported.
// The real question/option ids are generated deterministically at export time
// from the survey id + position (see buildSurveyJson), so they can't collide.
let _keySeq = 0;
function uid() {
  return `k${++_keySeq}`;
}

export function emptyOption() {
  return { key: uid(), label: "" };
}

export function emptyScale() {
  return { min: 1, max: 5, step: 1, minLabel: "", maxLabel: "" };
}

export function emptyQuestion(type = "scale") {
  return {
    key: uid(),
    type,
    prompt: "",
    required: true,
    // scale
    reverseScored: false,
    scaleOverrideEnabled: false,
    scale: emptyScale(),
    // choice
    options: isChoice(type) ? [emptyOption(), emptyOption()] : [],
    maxSelections: "",
    // text
    maxLength: type === "long_text" ? 1000 : 280,
  };
}

export function emptySurvey(surveyType = "form") {
  const firstQuestionType = surveyType === "scored" ? "scale" : "single_choice";
  return {
    id: "",
    version: SURVEY_VERSION,
    surveyType,
    title: "",
    intro: "",
    estimatedTime: "",
    canSkip: true,
    scaleDefaults: { min: 1, max: 5, step: 1, minLabel: "", maxLabel: "" },
    questions: surveyType === "external" ? [] : [emptyQuestion(firstQuestionType)],
    formUrl: "",
  };
}

// Demo survey: the self_compassion example, ported to v2 "scored".
export function demoSurvey() {
  const s = emptySurvey("scored");
  s.id = "self_compassion_v2";
  s.title = "Self-Compassion Check-in";
  s.intro =
    "Please read each statement carefully before answering. Select how often you behave in the stated manner.";
  s.estimatedTime = "1 minute";
  s.canSkip = true;
  s.scaleDefaults = {
    min: 1,
    max: 5,
    step: 1,
    minLabel: "Almost never",
    maxLabel: "Almost always",
  };
  const q = (prompt, reverseScored) => ({
    ...emptyQuestion("scale"),
    prompt,
    required: true,
    reverseScored,
  });
  s.questions = [
    q("I try to be understanding and patient towards those aspects of my personality I don’t like.", false),
    q("I try to see my failings as part of the human condition.", false),
    q("When I’m going through a very hard time, I give myself the caring and tenderness I need.", false),
    q("I’m disapproving and judgmental about my own flaws and inadequacies.", true),
    q("I’m intolerant and impatient towards those aspects of my personality I don’t like.", true),
  ];
  return s;
}

function toIntOrUndefined(v) {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function cleanScale(scale) {
  const out = {};
  for (const k of ["min", "max", "step"]) {
    const n = toIntOrUndefined(scale[k]);
    if (n !== undefined) out[k] = n;
  }
  if (scale.minLabel) out.minLabel = scale.minLabel;
  if (scale.maxLabel) out.maxLabel = scale.maxLabel;
  return out;
}

// Build the clean surveysV2 object that gets exported / pasted into ChallengeAssets.json.
// Drops editor-only fields and anything not relevant to the surveyType.
export function buildSurveyJson(s) {
  const base = {
    id: s.id.trim(),
    version: SURVEY_VERSION,
    surveyType: s.surveyType,
    title: s.title,
    intro: s.intro,
    estimatedTime: s.estimatedTime,
  };

  if (s.surveyType === "external") {
    return { ...base, formUrl: s.formUrl.trim() };
  }

  const out = { ...base, canSkip: !!s.canSkip };
  out.scaleDefaults = cleanScale(s.scaleDefaults);

  // Ids are derived from the survey id + position so they are stable, internal,
  // and can never collide. e.g. <surveyId>_question_1, <questionId>_answer_1
  const surveyId = s.id.trim() || "survey";
  out.questions = s.questions.map((q, i) => {
    const questionId = `${surveyId}_question_${i + 1}`;
    const base = {
      id: questionId,
      type: q.type,
      prompt: q.prompt,
      required: !!q.required,
    };
    if (q.type === "scale") {
      base.reverseScored = !!q.reverseScored;
      if (q.scaleOverrideEnabled) base.scale = cleanScale(q.scale);
    } else if (isChoice(q.type)) {
      base.options = q.options.map((o, j) => ({
        id: `${questionId}_answer_${j + 1}`,
        label: o.label,
      }));
      if (q.type === "multi_choice") {
        const ms = toIntOrUndefined(q.maxSelections);
        if (ms !== undefined) base.maxSelections = ms;
      }
    } else if (isText(q.type)) {
      const ml = toIntOrUndefined(q.maxLength);
      if (ml !== undefined) base.maxLength = ml;
    }
    return base;
  });
  return out;
}

// Convert a stored / pasted surveysV2 object back into the editor model
// (used by Edit / Duplicate from the browse list).
export function surveyFromJson(def) {
  const base = emptySurvey(def.surveyType || "scored");
  base.id = def.id || "";
  base.surveyType = def.surveyType || "scored";
  base.title = def.title || "";
  base.intro = def.intro || "";
  base.estimatedTime = def.estimatedTime || "";
  base.canSkip = def.canSkip !== false;
  base.formUrl = def.formUrl || "";
  if (def.scaleDefaults) base.scaleDefaults = { ...emptyScale(), ...def.scaleDefaults };
  base.questions = (def.questions || []).map((q) => {
    // incoming ids are discarded — they're regenerated deterministically on export
    const eq = emptyQuestion(q.type || "scale");
    eq.type = q.type || "scale";
    eq.prompt = q.prompt || "";
    eq.required = q.required !== false;
    eq.reverseScored = !!q.reverseScored;
    if (q.scale) {
      eq.scaleOverrideEnabled = true;
      eq.scale = { ...emptyScale(), ...q.scale };
    }
    if (Array.isArray(q.options)) {
      eq.options = q.options.map((o) => ({ key: uid(), label: o.label || "" }));
    }
    eq.maxSelections = q.maxSelections ?? "";
    eq.maxLength = q.maxLength ?? (q.type === "long_text" ? 1000 : 280);
    return eq;
  });
  return base;
}

const URL_RE = /^https?:\/\/.+/i;

export function validateSurvey(s) {
  const errors = [];
  const id = (s.id || "").trim();
  if (!id) errors.push("Survey id is required.");
  else if (/\s/.test(id)) errors.push("Survey id must not contain spaces.");
  if (!s.title || !s.title.trim()) errors.push("Title is required.");

  if (s.surveyType === "external") {
    if (!URL_RE.test((s.formUrl || "").trim()))
      errors.push("External surveys need a valid formUrl (http/https).");
    return errors;
  }

  if (!s.questions.length) errors.push("Add at least one question.");

  s.questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    if (!q.prompt || !q.prompt.trim()) errors.push(`${label}: prompt is required.`);

    if (s.surveyType === "scored" && q.type !== "scale")
      errors.push(`${label}: scored surveys only allow "scale" questions.`);

    if (isChoice(q.type)) {
      const opts = q.options || [];
      if (opts.length < 2) errors.push(`${label}: needs at least 2 options.`);
      opts.forEach((o, j) => {
        if (!o.label || !o.label.trim())
          errors.push(`${label}, option ${j + 1}: label is required.`);
      });
      if (q.type === "multi_choice") {
        const ms = toIntOrUndefined(q.maxSelections);
        if (ms !== undefined && ms > opts.length)
          errors.push(`${label}: maxSelections (${ms}) exceeds the number of options (${opts.length}).`);
      }
    }
  });

  return errors;
}

export function questionCount(def) {
  return Array.isArray(def?.questions) ? def.questions.length : 0;
}
