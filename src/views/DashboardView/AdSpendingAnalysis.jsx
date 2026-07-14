import React, { useState, useEffect, useMemo, useId } from "react";
import { useNavigate } from "react-router-dom";


const EXCHANGE_COLORS = ["#e84231", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];
const TYPE_COLORS = ["#3b82f6", "#10b981", "#ec4899", "#f59e0b", "#8b5cf6", "#06b6d4", "#f43f5e", "#14b8a6", "#f97316", "#0ea5e9", "#84cc16", "#eab308"];
const CAMPAIGN_COLORS = ["#e84231", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#0ea5e9", "#84cc16", "#eab308"];
const AD_COLORS = ["#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#14b8a6", "#f97316", "#0ea5e9", "#84cc16", "#eab308"];

const getDynamicColor = (index, level) => {
  let palette = EXCHANGE_COLORS;
  if (level === "exchange") palette = EXCHANGE_COLORS;
  else if (level === "type") palette = TYPE_COLORS;
  else if (level === "campaign") palette = CAMPAIGN_COLORS;
  else if (level === "ad") palette = AD_COLORS;

  return palette[index % palette.length];
};

const DONUT_COLOR = "#e84231";

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

function DonutChart({ title, data, onSliceClick, onBack, selected, activeName, onView, isLoading }) {
  const chartId = useId().replace(/:/g, "");
  const [hoveredName, setHoveredName] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [pinnedName, setPinnedName] = useState(null);

  const total = !data || data.length === 0 ? 0 : data.reduce((s, d) => s + (d.value || 0), 0);
  const isNoData = !data || data.length === 0 || total === 0 || (data.length === 1 && data[0].name === "No Data");

  const cx = 130, cy = 130, r = 70, innerR = 40;
  const gap = 0.02;

  useEffect(() => {
    if (pinnedName && !data.some((d) => d.name === pinnedName)) setPinnedName(null);
  }, [data, pinnedName]);

  const slices = isNoData ? [] : data.reduce(
    (acc, d) => {
      const fraction = d.value / (total || 1);
      const angle = fraction * 2 * Math.PI - gap;

      const startAngle = acc.cumAngle + gap / 2;
      const endAngle = startAngle + angle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const large = angle > Math.PI ? 1 : 0;
      const midAngle = startAngle + angle / 2;

      const labelR = r + 35;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);

      acc.slices.push({
        ...d,
        fraction,
        path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}
               L${ix1},${iy1} A${innerR},${innerR} 0 ${large},0 ${ix2},${iy2} Z`,
        lx,
        ly,
        midAngle,
      });

      acc.cumAngle += fraction * 2 * Math.PI;
      return acc;
    },
    { slices: [], cumAngle: -Math.PI / 2 }
  ).slices;

  return (
    <div >
      <div className="db-donut-title-section">
        <div className="db-donut-title-row">
          <p className="db-donut-title">{title}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onView?.(); }}
            className="db-donut-view-button"
          >
            View
          </button>
        </div>
      </div>

      <div className="ad-spending-chart-wrapper">
        {isLoading ? (
          <div className="ad-spending-loading">
            <div className="ad-spending-spinner"></div>
          </div>
        ) : (
          <>
            <svg
              key={JSON.stringify(data)}
              viewBox="0 30 200 200"
              width="200px"
              className="ad-donut-anim ad-spending-svg"
            >
              <defs>
                <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                </filter>
                {data.map((d) => (
                  <linearGradient
                    key={`grad-${chartId}-${d.name}`}
                    id={`grad-${chartId}-${d.name.replace(/\s+/g, "-")}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={d.color || DONUT_COLOR} />
                    <stop offset="100%" stopColor={d.color || DONUT_COLOR} stopOpacity="0.85" />
                  </linearGradient>
                ))}
              </defs>

              {isNoData ? (
                <g>
                  <path
                    d={`M${cx + r},${cy} A${r},${r} 0 1,1 ${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy}
                   M${cx + innerR},${cy} A${innerR},${innerR} 0 1,0 ${cx - innerR},${cy} A${innerR},${innerR} 0 1,0 ${cx + innerR},${cy} Z`}
                    fill="#f8fafc"
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                </g>
              ) : (
                <g filter="url(#donutShadow)">
                  {slices.map((s, idx) => (
                    <path
                      key={s.name}
                      d={s.path}
                      fill={`url(#grad-${chartId}-${s.name.replace(/\s+/g, "-")})`}
                      stroke="#ffffff"
                      strokeWidth={hoveredName === s.name ? "2.5" : "1.5"}
                      className="ad-spending-slice"
                      style={{
                        filter: hoveredName === s.name ? "brightness(1.1)" : "none"
                      }}
                      onClick={() => {
                        setPinnedName((prev) => (prev === s.name ? null : s.name));
                        onSliceClick?.(s.name);
                      }}
                      onMouseEnter={() => {
                        setHoveredName(s.name);
                        const angle = (s.startAngle + s.endAngle) / 2;
                        const hx = cx + Math.cos(angle) * (r * 0.8);
                        const hy = cy + Math.sin(angle) * (r * 0.8);
                        setHoverPos({ x: hx, y: hy });
                      }}
                      onMouseLeave={() => {
                        setHoveredName(null);
                        setHoverPos(null);
                      }}
                    />
                  ))}
                </g>
              )}

              {/* Near-pie labels/lines intentionally hidden */}

              {selected && onBack && (
                <g
                  onClick={onBack}
                  className="ad-spending-back-btn"
                  onMouseEnter={() => setHoveredName("__center__")}
                  onMouseLeave={() => hoveredName === "__center__" && setHoveredName(null)}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={16}
                    fill="#ffffff"
                    stroke="#eef0f2"
                    strokeWidth="1.5"
                  />
                  <polyline
                    points={`${cx + 4},${cy + 6} ${cx - 2},${cy} ${cx + 4},${cy - 6}`}
                    fill="none"
                    stroke="#4472C4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}
            </svg>

            {!isNoData && hoveredName && hoverPos && hoveredName !== "__center__" && (
              (() => {
                const hoveredItem = data.find((d) => d.name === hoveredName);
                return (
                  <div
                    className="ad-donut-tip"
                    style={{
                      left: Math.min(Math.max(hoverPos.x + 10, 6), 190),
                      top: Math.max(hoverPos.y - 6, 6),
                      transform: "translate(0, -100%)",
                    }}
                  >
                    <div className="ad-spending-tooltip-header">
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: hoveredItem?.color || DONUT_COLOR, boxShadow: "0 0 0 1px rgba(255,255,255,0.35)" }} />
                      {hoveredName}
                    </div>
                    <div className="ad-spending-tooltip-body">
                      {(() => {
                        const v = data.find(d => d.name === hoveredName)?.value ?? 0;
                        const pct = (v / (total || 1)) * 100;
                        return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct.toFixed(2)}%)`;
                      })()}
                    </div>
                  </div>
                );
              })()
            )}
          </>
        )}
      </div>

      {!isNoData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0 0" }}>
          {data.filter((item) => (item.value || 0) > 0).map((item) => {
            const percent = total ? ((item.value || 0) / total) * 100 : 0;

            return (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#334155",
                  lineHeight: 1.3
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "999px",
                      background: item.color || DONUT_COLOR,
                      display: "inline-block",
                      flexShrink: 0
                    }}
                  />
                  <span className="ad-spending-legend-text">
                    {item.name}
                  </span>
                </span>
                <span className="ad-spending-legend-percent">
                  {percent.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>

  );
}



export default function AdSpendingAnalysis({ overviewData, selectedChannel, setSelectedChannel, selectedFrom, setSelectedFrom, selectedAdFormat, setSelectedAdFormat, selectedCampaign, setSelectedCampaign, selectedAd, setSelectedAd, dateFrom, dateTo, isLoading }) {
  const overviewHierarchy = overviewData;
  const navigate = useNavigate();

  const [internalSelectedFrom, setInternalSelectedFrom] = useState(null);
  const effectiveSelectedFrom = selectedFrom ?? internalSelectedFrom;
  const setEffectiveSelectedFrom = setSelectedFrom ?? setInternalSelectedFrom;

  const drillLevel = selectedCampaign ? "Ad" : selectedAdFormat ? "Campaign" : "Ad Format";

  const currentSpendingData = useMemo(() => {
    const source = overviewHierarchy?.exchanges?.length ? overviewHierarchy : null;
    if (!source) return [];

    let result = [];
    if (!selectedChannel) {
      const mapped = source.exchanges.map(ex => ({
        name: ex.name,
        value: ex.summary.total_spend || 0
      })).sort((a, b) => b.value - a.value);

      result = mapped.map((ex, idx) => ({
        ...ex,
        color: getDynamicColor(idx, "exchange")
      }));
    } else {
      const exchange = source.exchanges.find(ex => ex.name?.toLowerCase() === selectedChannel?.toLowerCase());
      if (!exchange) return [];

      if (selectedCampaign) {
        const adsMap = {};
        const impMap = {};
        exchange.adFormats.forEach(format => {
          format.campaigns.forEach(camp => {
            if (camp.campaign === selectedCampaign) {
              camp.ads.forEach(ad => {
                adsMap[ad.ad] = (adsMap[ad.ad] || 0) + (ad.metrics.spend || 0);
                impMap[ad.ad] = (impMap[ad.ad] || 0) + (ad.metrics.impressions || 0);
              });
            }
          });
        });
        const top5Ads = Object.keys(impMap).sort((a, b) => impMap[b] - impMap[a]).slice(0, 5);
        result = top5Ads.map((name, idx) => ({ name, value: adsMap[name], color: getDynamicColor(idx, "ad") }));
      } else if (selectedAdFormat) {
        const adFormat = exchange.adFormats.find(f => f.format === selectedAdFormat);
        if (!adFormat) return [];
        const topCampaigns = [...adFormat.campaigns].sort((a, b) => (b.metrics.impressions || 0) - (a.metrics.impressions || 0)).slice(0, 5);
        result = topCampaigns.map((camp, idx) => ({ name: camp.campaign, value: camp.metrics.total_spend, color: getDynamicColor(idx, "campaign") }));
      } else {
        result = exchange.adFormats.map(f => ({ name: f.format, value: f.summary.total_spend })).sort((a, b) => b.value - a.value).slice(0, 5).map((f, idx) => ({ ...f, color: getDynamicColor(idx, "type") }));
      }
    }
    return result.map(d => ({
      ...d,
      displayName: d.name && d.name.length > 5 ? d.name.substring(0, 5) + "..." : d.name
    }));
  }, [selectedChannel, selectedAdFormat, selectedCampaign, overviewHierarchy, drillLevel]);

  const activeName = currentSpendingData.some(d => d.name === (selectedAd || selectedCampaign || selectedAdFormat || selectedChannel)) ? (selectedAd || selectedCampaign || selectedAdFormat || selectedChannel) : null;
  const title = selectedChannel ? `Ads Spending for ${selectedChannel} by ${drillLevel}` : "Ads Spending by Channel";

  const handleSliceClick = (name) => {
    if (!selectedChannel) {
      if (setSelectedChannel) setSelectedChannel(name);
      return;
    }
    const exchange = overviewHierarchy?.exchanges?.find(ex => ex.name?.toLowerCase() === selectedChannel?.toLowerCase());
    if (exchange?.adFormats.some(f => f.format === name)) { if (setSelectedAdFormat) setSelectedAdFormat(name); return; }

    const isCampaignName = exchange?.adFormats?.some((format) => format?.campaigns?.some((camp) => camp?.campaign === name));
    if (isCampaignName) { if (setSelectedCampaign) setSelectedCampaign(name); return; }

    const isAdName = exchange?.adFormats?.some((format) =>
      format?.campaigns?.some((camp) => camp?.ads?.some((ad) => ad?.ad === name))
    );
    if (isAdName) { if (setSelectedAd) setSelectedAd(name); return; }

    if (selectedChannel === name) {
      if (setSelectedChannel) setSelectedChannel(null);
      if (setSelectedAdFormat) setSelectedAdFormat(null);
      if (setSelectedCampaign) setSelectedCampaign(null);
      if (setSelectedAd) setSelectedAd(null);
    }
  };

  const handleBack = () => {
    if (selectedAd) { if (setSelectedAd) setSelectedAd(null); return; }
    if (selectedCampaign) { if (setSelectedCampaign) setSelectedCampaign(null); return; }
    if (selectedAdFormat) { if (setSelectedAdFormat) setSelectedAdFormat(null); return; }
    if (setSelectedChannel) setSelectedChannel(null);
  };

  const handleView = () => {
    navigate("/admin/exchange");
  };

  return (
    <div>
      <DonutChart
        title={title}
        data={currentSpendingData}
        onSliceClick={handleSliceClick}
        onBack={handleBack}
        selected={!!selectedChannel}
        activeName={activeName}
        onView={handleView}
        isLoading={isLoading}
      />
    </div>
  );
}
