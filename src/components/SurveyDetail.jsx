import { useState } from "react";
import { questionCount, QUESTION_TYPE_LABELS } from "../lib/survey.js";

// Read-only detail for a cached survey, with an action to load it into the builder.
export default function SurveyDetail({ item, onBack, onEdit, onViewResponses }) {
  const [showJson, setShowJson] = useState(false);
  const def = item.definition || item;
  const json = JSON.stringify(def, null, 2);

  const renderQuestionPreview = (q, i) => {
    const scale = q.scale || def.scaleDefaults || { min: 1, max: 5 };
    const typeLabel = QUESTION_TYPE_LABELS[q.type] || q.type;

    return (
      <div key={q.id || i} style={{ marginBottom: "16px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
        <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "8px" }}>
          {i + 1}. {q.prompt}
          {q.required && <span style={{ color: "#ff8b8b", marginLeft: "4px" }} title="Required">*</span>}
        </div>
        <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "12px", textTransform: "uppercase" }}>
          {typeLabel} {q.reverseScored ? "(Reverse Scored)" : ""}
        </div>
        
        {q.type === "scale" && (
          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "6px", color: "#ccc" }}>
            <span>{scale.minLabel || scale.min}</span>
            <span>...</span>
            <span>{scale.maxLabel || scale.max}</span>
          </div>
        )}

        {(q.type === "single_choice" || q.type === "multi_choice") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {q.options?.map((opt, j) => (
              <div key={opt.id || j} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: q.type === "single_choice" ? "50%" : "4px", border: "1px solid #666", flexShrink: 0 }} />
                <span>{opt.label}</span>
              </div>
            ))}
          </div>
        )}

        {q.type === "short_text" && (
          <input type="text" disabled placeholder="Short text answer..." style={{ width: "100%", opacity: 0.5 }} />
        )}

        {q.type === "long_text" && (
          <textarea disabled placeholder="Long text answer..." style={{ width: "100%", height: "80px", opacity: 0.5 }} />
        )}
      </div>
    );
  };

  return (
    <section className="card">
      <div className="hd">
        <h2>
          {def.title || def.id}{" "}
          <span className={`badge ${def.surveyType}`}>{def.surveyType}</span>
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" className="icon-btn" onClick={() => setShowJson(!showJson)}>
            {showJson ? "Show UI" : "View JSON"}
          </button>
          <button type="button" className="icon-btn" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
      <div className="bd">
        <div className="muted-text">
          <b>{def.id}</b> · v{def.version} · {questionCount(def)} question
          {questionCount(def) === 1 ? "" : "s"}
          {item.status ? ` · ${item.status}` : ""}
          {def.estimatedTime ? ` · ⏱ ${def.estimatedTime}` : ""}
        </div>
        <div className="spacer-sm" />
        
        {showJson ? (
          <pre className="json-pre">{json}</pre>
        ) : (
          <div className="survey-preview" style={{ marginTop: "16px" }}>
            {def.intro && (
              <div style={{ marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", fontStyle: "italic", color: "#ccc", borderLeft: "3px solid rgba(255,255,255,0.2)" }}>
                {def.intro}
              </div>
            )}
            
            {def.surveyType === "external" ? (
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", textAlign: "center" }}>
                <p style={{ marginBottom: "8px" }}>This is an external survey.</p>
                <a href={def.formUrl} target="_blank" rel="noreferrer" style={{ color: "#4facfe" }}>
                  {def.formUrl}
                </a>
              </div>
            ) : (
              def.questions?.map((q, i) => renderQuestionPreview(q, i))
            )}
          </div>
        )}
        
        <div className="row" style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px" }}>
          <button className="btn" onClick={() => onEdit(def)}>
            Edit / Duplicate in builder
          </button>
          {def.surveyType !== "external" && onViewResponses && (
            <button className="btn secondary" onClick={() => onViewResponses(def)}>
              View responses
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
