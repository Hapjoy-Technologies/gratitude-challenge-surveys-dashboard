// Shared chart theming so Recharts matches the dark/pink Outfit theme.
export const CHART = {
  accent: "#EA436B",
  text: "#fff0f3",
  muted: "#dcaaaa",
  grid: "rgba(255,255,255,0.08)",
  tooltipBg: "rgba(25,10,14,0.95)",
  tooltipBorder: "rgba(234,67,107,0.3)",
  // multi-hue palette for when distinct colors help (kept subtle)
  palette: ["#EA436B", "#fbbf24", "#10b981", "#4facfe", "#a78bfa", "#f472b6"],
};

export const tooltipStyle = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: 10,
  color: CHART.text,
  fontSize: 13,
};
