import React from "react";

export default function MetricsCard({ title, value, comparison, isNegative, chart, color, dateTo, isLoading }) {
  const getYesterdayText = () => {
    if (!dateTo) return "Yesterday :";
    const d = new Date(dateTo);
    d.setDate(d.getDate() - 1);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `Yesterday  :`;
  };

  const getCardClass = () => {
    const titleLower = title?.toLowerCase() || '';
    if (titleLower.includes('impression')) return 'db-metrics-card card-yellow';
    if (titleLower.includes('click')) return 'db-metrics-card card-red';
    if (titleLower.includes('conversion')) return 'db-metrics-card card-blue';
    if (titleLower.includes('spend')) return 'db-metrics-card card-green';
    return 'db-metrics-card';
  };

  return (
    <div className={getCardClass()}>
      <div style={styles.content}>
        <div style={styles.info}>
          <p style={styles.label}>{title}</p>
          <h3 style={styles.value}>{value}</h3>
        </div>
        {chart && <div style={styles.chartWrapper}>{chart}</div>}
      </div>

      <div style={styles.footer}>
        <span style={styles.comparisonText}>
          {title === "Cost"
            ? "Cost per conversion"
            : title === "Profits"
              ? "Profit per conversion"
              : `${getYesterdayText()} ${comparison}`}
        </span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #f1f5f9",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  content: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },
  value: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
  },
  chartWrapper: {
    width: "80px",
    height: "40px",
    flexShrink: 0,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "12px",
    borderTop: "1px solid #f1f5f9",
  },
  comparisonText: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#94a3b8",
  },
};
