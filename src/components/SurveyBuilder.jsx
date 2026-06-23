import { useMemo, useState } from "react";
import {
  SURVEY_TYPES,
  SURVEY_VERSION,
  emptyQuestion,
  emptySurvey,
  demoSurvey,
  buildSurveyJson,
  validateSurvey,
} from "../lib/survey.js";
import { saveGeneratedSurvey } from "../lib/api.js";
import QuestionEditor from "./QuestionEditor.jsx";
import JsonPreview from "./JsonPreview.jsx";

export default function SurveyBuilder({ survey, setSurvey }) {
  const [showJson, setShowJson] = useState(false);
  const [saveState, setSaveState] = useState(""); // "" | "saving" | "saved" | error msg
  const patch = (p) => setSurvey({ ...survey, ...p });
  const patchScaleDefaults = (p) =>
    setSurvey({ ...survey, scaleDefaults: { ...survey.scaleDefaults, ...p } });

  const setType = (surveyType) => {
    const next = { ...survey, surveyType };
    if (surveyType === "scored") {
      // scored only allows scale questions — coerce existing ones
      next.questions = (survey.questions || []).map((q) => ({
        ...emptyQuestion("scale"),
        id: q.id,
        prompt: q.prompt,
        required: q.required,
        reverseScored: q.reverseScored,
      }));
      if (!next.questions.length) next.questions = [emptyQuestion("scale")];
    } else if (surveyType === "form") {
      if (!next.questions.length) next.questions = [emptyQuestion("single_choice")];
    }
    setSurvey(next);
  };

  const setQuestion = (i, q) =>
    patch({ questions: survey.questions.map((old, idx) => (idx === i ? q : old)) });
  const addQuestion = () =>
    patch({
      questions: [
        ...survey.questions,
        emptyQuestion(survey.surveyType === "scored" ? "scale" : "single_choice"),
      ],
    });
  const removeQuestion = (i) =>
    patch({ questions: survey.questions.filter((_, idx) => idx !== i) });
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= survey.questions.length) return;
    const next = survey.questions.slice();
    [next[i], next[j]] = [next[j], next[i]];
    patch({ questions: next });
  };

  const jsonObj = useMemo(() => buildSurveyJson(survey), [survey]);
  const jsonText = useMemo(() => JSON.stringify(jsonObj, null, 2), [jsonObj]);
  const errors = useMemo(() => validateSurvey(survey), [survey]);

  const isExternal = survey.surveyType === "external";
  const filename = `${(survey.id || "survey").trim() || "survey"}.json`;

  const save = async () => {
    if (errors.length) return;
    setSaveState("saving");
    try {
      await saveGeneratedSurvey(jsonObj, "draft");
      setSaveState("saved");
      setTimeout(() => setSaveState(""), 2500);
    } catch (e) {
      setSaveState(e.message || "Save failed");
    }
  };

  return (
    <div className={showJson ? "grid cols-2" : ""}>
      {/* ---------- form ---------- */}
      <section className="card">
        <div className="hd">
          <h2>Create Survey</h2>
          <div className="acts" style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSurvey(demoSurvey())}
            >
              Load demo
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSurvey(emptySurvey(survey.surveyType))}
            >
              Reset
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setShowJson((v) => !v)}
            >
              {showJson ? "Hide JSON" : "View JSON"}
              {errors.length > 0 ? ` (${errors.length})` : ""}
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={save}
              disabled={errors.length > 0 || saveState === "saving"}
              title={errors.length > 0 ? "Fix validation errors first" : "Save to SurveyGeneratorCache"}
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                ? "Saved ✓"
                : "Save to cache"}
            </button>
          </div>
        </div>
        <div className="bd">
          {saveState && saveState !== "saving" && saveState !== "saved" && (
            <div className="status error" style={{ marginBottom: 12 }}>
              Couldn’t save: {saveState}
            </div>
          )}
          <div className="grid2">
            <div>
              <label>Survey id</label>
              <input
                value={survey.id}
                placeholder="self_compassion_v2"
                onChange={(e) => patch({ id: e.target.value })}
              />
              <div className="hint-sm">Must be unique and not clash with v1 ids.</div>
            </div>
            <div>
              <label>Survey type</label>
              <select value={survey.surveyType} onChange={(e) => setType(e.target.value)}>
                {SURVEY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="spacer-sm" />
          <label>Title</label>
          <input
            value={survey.title}
            placeholder="Self-Compassion Check-in"
            onChange={(e) => patch({ title: e.target.value })}
          />

          <div className="spacer-sm" />
          <label>Intro</label>
          <textarea
            value={survey.intro}
            placeholder="Shown before the questions"
            onChange={(e) => patch({ intro: e.target.value })}
          />

          <div className="spacer-sm" />
          <div className="grid2">
            <div>
              <label>Estimated time</label>
              <input
                value={survey.estimatedTime}
                placeholder="1 minute"
                onChange={(e) => patch({ estimatedTime: e.target.value })}
              />
            </div>
            <div>
              <label>Version</label>
              <input value={SURVEY_VERSION} readOnly />
            </div>
          </div>

          {!isExternal && (
            <label className="check">
              <input
                type="checkbox"
                checked={!!survey.canSkip}
                onChange={(e) => patch({ canSkip: e.target.checked })}
              />
              <span>User can skip / dismiss</span>
            </label>
          )}

          {/* external */}
          {isExternal && (
            <>
              <div className="spacer-sm" />
              <label>Google Form URL</label>
              <input
                value={survey.formUrl}
                placeholder="https://docs.google.com/forms/d/e/.../viewform"
                onChange={(e) => patch({ formUrl: e.target.value })}
              />
              <div className="hint-sm">
                External surveys open this link only — no in-app questions, no submission.
              </div>
            </>
          )}

          {/* scored / form */}
          {!isExternal && (
            <>
              <div className="divider" />
              <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "#fff" }}>
                Scale defaults
              </h2>
              <div className="grid3">
                <div>
                  <label>Min</label>
                  <input
                    type="number"
                    value={survey.scaleDefaults.min ?? ""}
                    onChange={(e) => patchScaleDefaults({ min: e.target.value })}
                  />
                </div>
                <div>
                  <label>Max</label>
                  <input
                    type="number"
                    value={survey.scaleDefaults.max ?? ""}
                    onChange={(e) => patchScaleDefaults({ max: e.target.value })}
                  />
                </div>
                <div>
                  <label>Step</label>
                  <input
                    type="number"
                    value={survey.scaleDefaults.step ?? ""}
                    onChange={(e) => patchScaleDefaults({ step: e.target.value })}
                  />
                </div>
              </div>
              <div className="spacer-sm" />
              <div className="grid2">
                <div>
                  <label>Min label</label>
                  <input
                    value={survey.scaleDefaults.minLabel ?? ""}
                    placeholder="Almost never"
                    onChange={(e) => patchScaleDefaults({ minLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label>Max label</label>
                  <input
                    value={survey.scaleDefaults.maxLabel ?? ""}
                    placeholder="Almost always"
                    onChange={(e) => patchScaleDefaults({ maxLabel: e.target.value })}
                  />
                </div>
              </div>

              <div className="divider" />
              <div className="qhead" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, margin: 0, color: "#fff" }}>
                  Questions ({survey.questions.length})
                </h2>
                <button type="button" className="icon-btn" onClick={addQuestion}>
                  + Add question
                </button>
              </div>

              {survey.questions.map((q, i) => (
                <QuestionEditor
                  key={q.key}
                  question={q}
                  index={i}
                  total={survey.questions.length}
                  surveyType={survey.surveyType}
                  onChange={(nq) => setQuestion(i, nq)}
                  onRemove={() => removeQuestion(i)}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                />
              ))}

              {!survey.questions.length && (
                <div className="muted-text">No questions yet — add one above.</div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ---------- preview (hidden until "View JSON") ---------- */}
      {showJson && (
        <div className="sticky-side">
          <JsonPreview jsonText={jsonText} errors={errors} filename={filename} />
        </div>
      )}
    </div>
  );
}
