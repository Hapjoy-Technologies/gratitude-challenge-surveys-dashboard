import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { QUESTION_TYPE_LABELS } from "../lib/survey.js";
import { CHART, tooltipStyle } from "../lib/chart.js";

function ChoiceChart({ q }) {
  if (q.totalAnswered === 0) return <EmptyQ />;
  const height = Math.max(140, q.options.length * 44);
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart
          layout="vertical"
          data={q.options}
          margin={{ top: 4, right: 48, bottom: 4, left: 8 }}
        >
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: CHART.muted, fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fill: CHART.text, fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={tooltipStyle}
            formatter={(v, _n, p) => [`${v} (${p.payload.pct}%)`, "Responses"]}
          />
          <Bar dataKey="count" fill={CHART.accent} radius={[0, 6, 6, 0]} barSize={22}>
            <LabelList
              dataKey="count"
              position="right"
              fill={CHART.muted}
              fontSize={12}
              formatter={(v) => `${v}`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScaleChart({ q }) {
  if (q.totalAnswered === 0) return <EmptyQ />;
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: CHART.accent }}>
          {q.average.toFixed(2)}
        </span>
        <span className="muted-text">
          average · {q.totalAnswered} response{q.totalAnswered === 1 ? "" : "s"}
        </span>
      </div>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={q.distribution} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="value" tick={{ fill: CHART.text, fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: CHART.muted, fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={tooltipStyle}
              formatter={(v) => [v, "Responses"]}
              labelFormatter={(l) => `Value ${l}`}
            />
            <Bar dataKey="count" fill={CHART.accent} radius={[6, 6, 0, 0]}>
              <LabelList dataKey="count" position="top" fill={CHART.muted} fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {(q.minLabel || q.maxLabel) && (
        <div
          style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}
          className="muted-text"
        >
          <span>{q.minLabel}</span>
          <span>{q.maxLabel}</span>
        </div>
      )}
    </>
  );
}

function TextAnswers({ q }) {
  if (q.totalAnswered === 0) return <EmptyQ />;
  return (
    <div>
      <div className="muted-text" style={{ marginBottom: 8 }}>
        {q.totalAnswered} response{q.totalAnswered === 1 ? "" : "s"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {q.values.map((v, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {v.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyQ() {
  return <div className="muted-text">No answers for this question yet.</div>;
}

export default function SurveyResultsSummary({ summary }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {summary.questions.map((q, i) => (
        <section className="card" key={q.id}>
          <div className="bd">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {i + 1}. {q.prompt}
              </h3>
              <span className="badge" style={{ flexShrink: 0 }}>
                {QUESTION_TYPE_LABELS[q.type] || q.type}
              </span>
            </div>
            {q.kind === "choice" && <ChoiceChart q={q} />}
            {q.kind === "scale" && <ScaleChart q={q} />}
            {q.kind === "text" && <TextAnswers q={q} />}
          </div>
        </section>
      ))}
    </div>
  );
}
