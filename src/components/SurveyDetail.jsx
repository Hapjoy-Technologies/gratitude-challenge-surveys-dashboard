import { questionCount } from "../lib/survey.js";

// Read-only detail for a cached survey, with an action to load it into the builder.
export default function SurveyDetail({ item, onBack, onEdit }) {
  const def = item.definition || item;
  const json = JSON.stringify(def, null, 2);

  return (
    <section className="card">
      <div className="hd">
        <h2>
          {def.title || def.id}{" "}
          <span className={`badge ${def.surveyType}`}>{def.surveyType}</span>
        </h2>
        <button type="button" className="icon-btn" onClick={onBack}>
          ← Back
        </button>
      </div>
      <div className="bd">
        <div className="muted-text">
          <b>{def.id}</b> · v{def.version} · {questionCount(def)} question
          {questionCount(def) === 1 ? "" : "s"}
          {item.status ? ` · ${item.status}` : ""}
        </div>
        <div className="spacer-sm" />
        <pre className="json-pre">{json}</pre>
        <div className="row">
          <button className="btn" onClick={() => onEdit(def)}>
            Edit / Duplicate in builder
          </button>
        </div>
      </div>
    </section>
  );
}
