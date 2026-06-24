import { lazy, Suspense, useState } from "react";
import { emptySurvey, surveyFromJson } from "./lib/survey.js";
import SurveyBuilder from "./components/SurveyBuilder.jsx";
import SurveyList from "./components/SurveyList.jsx";

// Code-split: the responses view pulls in Recharts, only load it on demand.
const SurveyResponses = lazy(() => import("./components/SurveyResponses.jsx"));

export default function App() {
  const [view, setView] = useState("browse"); // "create" | "browse" | "responses"
  const [survey, setSurvey] = useState(() => emptySurvey("form"));
  const [responsesDef, setResponsesDef] = useState(null);

  const editFromBrowse = (def) => {
    setSurvey(surveyFromJson(def));
    setView("create");
  };

  const viewResponses = (def) => {
    setResponsesDef(def);
    setView("responses");
  };

  return (
    <>
      <header className="appbar">
        <div className="appbar-inner">
          <div className="brand">Gratitude Surveys</div>
          <nav className="tabs">
            <button
              className={`tab ${view === "browse" ? "active" : ""}`}
              onClick={() => setView("browse")}
            >
              Existing Surveys
            </button>
            <button
              className={`tab ${view === "create" ? "active" : ""}`}
              onClick={() => setView("create")}
            >
              Create
            </button>
          </nav>
        </div>
      </header>

      <div className="container appbar-pad">
        {view === "create" && (
          <SurveyBuilder survey={survey} setSurvey={setSurvey} />
        )}
        {view === "browse" && (
          <SurveyList onEdit={editFromBrowse} onViewResponses={viewResponses} />
        )}
        {view === "responses" && (
          <Suspense fallback={<div className="muted-text">Loading…</div>}>
            <SurveyResponses def={responsesDef} onBack={() => setView("browse")} />
          </Suspense>
        )}
      </div>

      <footer>Gratitude Surveys</footer>
    </>
  );
}
