import { useState } from "react";
import { emptySurvey, surveyFromJson } from "./lib/survey.js";
import SurveyBuilder from "./components/SurveyBuilder.jsx";
import SurveyList from "./components/SurveyList.jsx";

export default function App() {
  const [view, setView] = useState("browse"); // "create" | "browse"
  const [survey, setSurvey] = useState(() => emptySurvey("form"));

  const editFromBrowse = (def) => {
    setSurvey(surveyFromJson(def));
    setView("create");
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
        {view === "create" ? (
          <SurveyBuilder survey={survey} setSurvey={setSurvey} />
        ) : (
          <SurveyList onEdit={editFromBrowse} />
        )}
      </div>

      <footer>Gratitude Surveys</footer>
    </>
  );
}
