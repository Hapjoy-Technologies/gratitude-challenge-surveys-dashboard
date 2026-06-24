import { useEffect, useState } from "react";
import { fetchGeneratedSurveys } from "../lib/api.js";
import { questionCount } from "../lib/survey.js";
import SurveyDetail from "./SurveyDetail.jsx";

export default function SurveyList({ onEdit, onViewResponses }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchGeneratedSurveys();
      setItems(rows);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (selected) {
    return (
      <SurveyDetail
        item={selected}
        onBack={() => setSelected(null)}
        onEdit={onEdit}
        onViewResponses={onViewResponses}
      />
    );
  }

  return (
    <section className="card">
      <div className="hd">
        <h2>Existing Surveys</h2>
        <button type="button" className="icon-btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
      <div className="bd">
        {error && <div className="status error">{error}</div>}

        {!error && items.length === 0 && (
          <div className="empty">
            <h3>No saved surveys yet</h3>
            <div className="muted-text">
              Surveys you save are stored in the <b>SurveyGeneratorCache</b> table.
              <br />
              Build a survey in <b>Create</b> and hit <b>Save to cache</b> — it’ll show up here.
            </div>
          </div>
        )}

        {items.map((item) => {
          const def = item.definition || item;
          return (
            <div
              className="list-row"
              key={item.id || def.id}
              onClick={() => setSelected(item)}
              style={{ cursor: "pointer" }}
            >
              <span className={`badge ${def.surveyType}`}>{def.surveyType}</span>
              <div className="meta">
                <div className="name">{def.title || def.id}</div>
                <div className="sub">
                  {def.id} · v{def.version} · {questionCount(def)} question
                  {questionCount(def) === 1 ? "" : "s"}
                </div>
              </div>
              {item.status && <span className="badge">{item.status}</span>}
              <button
                type="button"
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(def);
                }}
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
