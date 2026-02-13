export const CHART_COLORS = {
  accent: "#e8a820",
  accentLight: "#f0b830",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  secondary: "#8a8a9a",
  grid: "rgba(255, 255, 255, 0.04)",
  text: "#8a8a9a",
  tooltipBg: "#1a1a1f",
  tooltipBorder: "rgba(255, 255, 255, 0.1)",
};

export const CHART_CATEGORY_COLORS = ["#e8a820", "#3b82f6", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6"];

export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: '"General Sans", sans-serif',
    color: "#f0f0f0",
  },
  itemStyle: { color: "#f0f0f0" },
  labelStyle: { color: "#8a8a9a", marginBottom: "4px" },
};
