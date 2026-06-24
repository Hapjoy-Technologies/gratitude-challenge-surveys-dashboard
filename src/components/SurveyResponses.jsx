import { useEffect, useMemo, useState } from "react";
import { fetchAllSurveyResponses } from "../lib/api.js";
import { summarizeResponses } from "../lib/aggregate.js";
import { USE_MOCK_RESPONSES, generateMockResponses } from "../lib/mockResponses.js";
import SurveyResultsSummary from "./SurveyResultsSummary.jsx";
import SurveyResponsesTable from "./SurveyResponsesTable.jsx";

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString() : "—");

export default function SurveyResponses({ def, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary"); // "summary" | "individual"

  const surveyId = def?.id;

  const load = async () => {
    if (!surveyId) return;
    setLoading(true);
    setError("");
    try {
      if (USE_MOCK_RESPONSES) {
        setRows(generateMockResponses(def));
        return;
      }
      const all = await fetchAllSurveyResponses(surveyId);
      setRows(all);
    } catch (e) {
      setError(e.message || "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  const summary = useMemo(() => summarizeResponses(def, rows), [def, rows]);
  const { meta } = summary;
  const hasData = rows.length > 0;

  return (
    <>
      <section className="card">
        <div className="hd">
          <h2>
            Responses{" "}
            <span className="muted-text" style={{ fontWeight: 400 }}>
              {def?.title || surveyId}
            </span>
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="icon-btn" onClick={load} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button type="button" className="icon-btn" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>
        <div className="bd">
          {error && <div className="status error">{error}</div>}

          {USE_MOCK_RESPONSES && (
            <div className="mock-note">⚠ Showing mock data (no live responses yet)</div>
          )}

          {!error && (
            <div className="meta-grid">
              <div>
                <span className="meta-label">Responses</span>
                <span className="meta-value">{meta.total}</span>
              </div>
              <div>
                <span className="meta-label">Unique users</span>
                <span className="meta-value">{meta.uniqueUsers}</span>
              </div>
              <div>
                <span className="meta-label">Date range</span>
                <span className="meta-value">
                  {meta.firstAt ? `${fmtDate(meta.firstAt)} – ${fmtDate(meta.lastAt)}` : "—"}
                </span>
              </div>
              <div>
                <span className="meta-label">Type</span>
                <span className={`badge ${meta.surveyType}`}>{meta.surveyType}</span>
              </div>
              <div>
                <span className="meta-label">Questions</span>
                <span className="meta-value">{def?.questions?.length ?? 0}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {!error && hasData && (
        <>
          <div className="tabs" style={{ margin: "16px 0" }}>
            <button
              className={`tab ${tab === "summary" ? "active" : ""}`}
              onClick={() => setTab("summary")}
            >
              Summary
            </button>
            <button
              className={`tab ${tab === "individual" ? "active" : ""}`}
              onClick={() => setTab("individual")}
            >
              Individual
            </button>
          </div>

          {tab === "summary" ? (
            <SurveyResultsSummary summary={summary} />
          ) : (
            <section className="card">
              <div className="bd">
                <SurveyResponsesTable rows={rows} def={def} />
              </div>
            </section>
          )}
        </>
      )}

      {!error && !loading && !hasData && (
        <section className="card">
          <div className="bd">
            <div className="empty">
              <h3>No responses yet</h3>
              <div className="muted-text">
                Submissions for this survey will appear here once users complete it.
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
