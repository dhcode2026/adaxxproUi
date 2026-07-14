import React, { useState, useEffect, useMemo } from "react";


const normalizeName = (name, type) => {
  if (!name) {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return "Other";
  }
  const lower = name.toLowerCase();
  if (lower === "unknown") {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return "Other";
  }
  if (lower.includes("unknown")) {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return name.replace(/unknown/ig, "Other");
  }
  return name;
};

const CampaignAnalysis = ({ overviewData, selectedChannel, selectedCampaign, dateFrom, dateTo }) => {
  const overviewHierarchy = overviewData;

  const { totalImpressions, totalClicks, totalConversions, totalCost } = useMemo(() => {
    const exchanges = overviewHierarchy?.exchanges ?? [];
    return {
      totalImpressions: exchanges.reduce((acc, ex) => acc + (ex?.summary?.totalimpressions ?? 0), 0),
      totalClicks: exchanges.reduce((acc, ex) => acc + (ex?.summary?.totalclicks ?? 0), 0),
      totalConversions: exchanges.reduce((acc, ex) => acc + (ex?.summary?.totalconversion ?? 0), 0),
      totalCost: exchanges.reduce((acc, ex) => acc + (ex?.summary?.total_spend ?? 0), 0),
    };
  }, [overviewHierarchy]);

  // Calculations
  const ctr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalConversions ? totalCost / totalConversions : 0;

  const formatValue = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  const metrics = [
    {
      id: 1,
      title: 'Impressions',
      value: formatValue(totalImpressions),
      comparison: '-2.15%',
      isNegative: true,
      comparisonText: 'Compare to last month:'
    },
    {
      id: 2,
      title: 'Clicks',
      value: formatValue(totalClicks),
      comparison: ctr.toFixed(2) + '%',
      isNegative: false,
      comparisonText: 'Clicks through rate:'
    },
    {
      id: 3,
      title: 'Conversions',
      value: formatValue(totalConversions),
      comparison: '5.24%',
      isNegative: false,
      comparisonText: 'Compare to last month:'
    },
    {
      id: 4,
      title: 'Cost',
      value: `$${formatValue(totalCost)}`,
      comparison: `$${cpc.toFixed(2)}`,
      isNegative: false,
      comparisonText: 'Cost per conversion:'
    }
  ];

  // Simple line chart simulation with SVG
  const SimpleLineChart = ({ isNegative }) => {
    const points = Array.from({ length: 30 }, (_, i) => ({
      x: (i / 29) * 100,
      y: 30 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 10 + (isNegative ? -5 : 5)
    }));

    const pathData = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    return (
      <svg width="100%" height="60" viewBox="0 0 100 60" className="ca-chart-svg">
        <path
          d={pathData}
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </svg>
    );
  };

  return (
    <div className="ca-main-container">
      <div className="ca-metrics-wrapper">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="ca-metric-card"
          >
            <div className="ca-metric-header">
              <p className="ca-metric-title">
                {metric.title}
              </p>
            </div>

            <div className="ca-metric-value-container">
              <h2 className="ca-metric-value">
                {metric.value}
              </h2>
            </div>

            <div className="ca-metric-chart-container">
              <SimpleLineChart isNegative={metric.isNegative} />
            </div>

            <div className="ca-metric-footer">
              <span className="ca-metric-comparison-text">{metric.comparisonText}</span>
              <span 
                className="ca-metric-comparison-value"
                style={{ color: metric.isNegative ? 'var(--color-text-danger)' : 'var(--color-text-success)' }}
              >
                {metric.comparison}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default CampaignAnalysis;
