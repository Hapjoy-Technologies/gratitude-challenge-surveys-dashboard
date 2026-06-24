import { useMemo } from "react";

// Individual responses, one row per submission. Joins answer ids with the
// survey definition for readable labels.
export default function SurveyResponsesTable({ rows, def }) {
  // questionId -> { prompt, optionId -> label }
  const lookup = useMemo(() => {
    const map = {};
    (def?.questions || []).forEach((q) => {
      const options = {};
      (q.options || []).forEach((o) => {
        options[o.id] = o.label;
      });
      map[q.id] = { prompt: q.prompt || q.id, options };
    });
    return map;
  }, [def]);

  const formatAnswer = (a) => {
    const q = lookup[a.questionId];
    switch (a.type) {
      case "scale":
        return String(a.scaleValue ?? "");
      case "single_choice":
        return q?.options[a.selectedOptionId] ?? a.selectedOptionId ?? "";
      case "multi_choice":
        return (a.selectedOptionIds || [])
          .map((id) => q?.options[id] ?? id)
          .join(", ");
      case "short_text":
      case "long_text":
        return a.textValue ?? "";
      default:
        return "";
    }
  };

  if (rows.length === 0) {
    return (
      <div className="empty">
        <h3>No responses yet</h3>
        <div className="muted-text">
          Submissions for this survey will appear here once users complete it.
        </div>
      </div>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Submitted</th>
          <th>User</th>
          <th>Day</th>
          <th>Answers</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.userId}-${r.submittedAt}-${i}`}>
            <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}</td>
            <td title={r.userId} style={{ fontFamily: "monospace", fontSize: "12px" }}>
              {r.userId ? `${r.userId.slice(0, 8)}…` : "—"}
            </td>
            <td>{r.dayNum ?? "—"}</td>
            <td>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {(r.answers || []).map((a, j) => (
                  <div key={j}>
                    <span className="muted-text">
                      {lookup[a.questionId]?.prompt || a.questionId}:{" "}
                    </span>
                    {formatAnswer(a)}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
