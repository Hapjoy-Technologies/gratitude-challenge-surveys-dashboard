import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  isChoice,
  isText,
  emptyQuestion,
} from "../lib/survey.js";
import OptionsEditor from "./OptionsEditor.jsx";

export default function QuestionEditor({
  question,
  index,
  total,
  surveyType,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const q = question;
  const patch = (p) => onChange({ ...q, ...p });

  // changing type: rebuild type-specific defaults but keep key/prompt/required
  const changeType = (type) => {
    const fresh = emptyQuestion(type);
    onChange({
      ...fresh,
      key: q.key,
      prompt: q.prompt,
      required: q.required,
    });
  };

  const scaled = surveyType === "scored"; // type locked to scale
  const sc = q.scale || {};

  const patchScale = (p) => patch({ scale: { ...sc, ...p } });

  return (
    <div className="qcard">
      <div className="qhead">
        <span className="ttl">Question {index + 1}</span>
        <div className="acts">
          <button
            type="button"
            className="icon-btn"
            title="Move up"
            disabled={index === 0}
            onClick={onMoveUp}
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Move down"
            disabled={index === total - 1}
            onClick={onMoveDown}
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-btn danger"
            title="Remove question"
            onClick={onRemove}
          >
            ✕
          </button>
        </div>
      </div>

      <div>
        <label>Type</label>
        <select
          value={q.type}
          disabled={scaled}
          onChange={(e) => changeType(e.target.value)}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {scaled && (
          <div className="hint-sm">Scored surveys only use scale questions.</div>
        )}
      </div>

      <div className="spacer-sm" />
      <label>Prompt</label>
      <textarea
        value={q.prompt}
        placeholder="The question text shown to the user"
        onChange={(e) => patch({ prompt: e.target.value })}
      />

      <label className="check">
        <input
          type="checkbox"
          checked={!!q.required}
          onChange={(e) => patch({ required: e.target.checked })}
        />
        <span>Required</span>
      </label>

      {/* ---- scale ---- */}
      {q.type === "scale" && (
        <>
          <div className="spacer-sm" />
          <label className="check">
            <input
              type="checkbox"
              checked={!!q.reverseScored}
              onChange={(e) => patch({ reverseScored: e.target.checked })}
            />
            <span>Reverse scored</span>
          </label>

          <div className="spacer-sm" />
          <label className="check">
            <input
              type="checkbox"
              checked={!!q.scaleOverrideEnabled}
              onChange={(e) => patch({ scaleOverrideEnabled: e.target.checked })}
            />
            <span>Override default scale for this question</span>
          </label>

          {q.scaleOverrideEnabled && (
            <>
              <div className="spacer-sm" />
              <div className="grid3">
                <div>
                  <label>Min</label>
                  <input
                    type="number"
                    value={sc.min ?? ""}
                    onChange={(e) => patchScale({ min: e.target.value })}
                  />
                </div>
                <div>
                  <label>Max</label>
                  <input
                    type="number"
                    value={sc.max ?? ""}
                    onChange={(e) => patchScale({ max: e.target.value })}
                  />
                </div>
                <div>
                  <label>Step</label>
                  <input
                    type="number"
                    value={sc.step ?? ""}
                    onChange={(e) => patchScale({ step: e.target.value })}
                  />
                </div>
              </div>
              <div className="spacer-sm" />
              <div className="grid2">
                <div>
                  <label>Min label</label>
                  <input
                    value={sc.minLabel ?? ""}
                    onChange={(e) => patchScale({ minLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label>Max label</label>
                  <input
                    value={sc.maxLabel ?? ""}
                    onChange={(e) => patchScale({ maxLabel: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ---- choice ---- */}
      {isChoice(q.type) && (
        <>
          <div className="spacer-sm" />
          <OptionsEditor options={q.options} onChange={(options) => patch({ options })} />
          {q.type === "multi_choice" && (
            <>
              <div className="spacer-sm" />
              <div className="grid2">
                <div>
                  <label>Max selections (optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={q.maxSelections}
                    placeholder="e.g. 3"
                    onChange={(e) => patch({ maxSelections: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ---- text ---- */}
      {isText(q.type) && (
        <>
          <div className="spacer-sm" />
          <div className="grid2">
            <div>
              <label>Max length (optional)</label>
              <input
                type="number"
                min="1"
                value={q.maxLength}
                onChange={(e) => patch({ maxLength: e.target.value })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
