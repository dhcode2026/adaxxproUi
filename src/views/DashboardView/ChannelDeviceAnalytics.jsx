import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


const EXCHANGE_COLORS = ["#e84231", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];
const TYPE_COLORS = ["#3b82f6", "#10b981", "#ec4899", "#f59e0b", "#8b5cf6", "#06b6d4"];
const CAMPAIGN_COLORS = ["#e84231", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#6366f1"];
const AD_COLORS = ["#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b"];

const DONUT_COLOR = "#e84231";

const getDynamicColor = (index, level) => {
  let palette = EXCHANGE_COLORS;
  if (level === "exchange") palette = EXCHANGE_COLORS;
  else if (level === "type") palette = TYPE_COLORS;
  else if (level === "campaign") palette = CAMPAIGN_COLORS;
  else if (level === "ad") palette = AD_COLORS;
  return palette[index % palette.length];
};

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

const getShortName = (name) => {
  if (!name) return "";
  return name.split(/[_ \-]/)[0];
};

function DonutChart({ title, data, onSliceClick, onBack, selected, activeName, onView, isLoading }) {
  const chartId = useId().replace(/:/g, "");
  const [hoveredName, setHoveredName] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [pinnedName, setPinnedName] = useState(null);

  const total = !data || data.length === 0 ? 0 : data.reduce((s, d) => s + (d.value || 0), 0);
  const isNoData = !data || data.length === 0 || total === 0 || (data.length === 1 && data[0].name === "No Data");

  const cx = 130, cy = 130, r = 70, inner = 40;
  const gap = 0.02;

  useEffect(() => {
    if (pinnedName && !data.some((d) => d.name === pinnedName)) setPinnedName(null);
  }, [data, pinnedName]);

  const slices = isNoData ? [] : data.reduce((acc, d) => {
    const frac = d.value / (total || 1);
    const angle = frac * 2 * Math.PI - gap;
    const cum = acc.cum;
    const sa = cum + gap / 2;
    const ea = sa + angle;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    const ix1 = cx + inner * Math.cos(ea), iy1 = cy + inner * Math.sin(ea);
    const ix2 = cx + inner * Math.cos(sa), iy2 = cy + inner * Math.sin(sa);
    const lg = angle > Math.PI ? 1 : 0;
    const mid = sa + angle / 2;
    acc.slices.push({
      ...d, frac, mid, startAngle: sa, endAngle: ea,
      path: `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix1},${iy1} A${inner},${inner} 0 ${lg},0 ${ix2},${iy2} Z`,
      lx: cx + (r + 24) * Math.cos(mid), ly: cy + (r + 24) * Math.sin(mid),
    });
    acc.cum += frac * 2 * Math.PI;
    return acc;
  }, { slices: [], cum: -Math.PI / 2 }).slices;

  return (
    <div className="db-donut-chart-container">
      <style>{`
        @keyframes donutPop {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .donut-anim {
          animation: donutPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform-origin: center;
        }
        .donut-tip {
          position: absolute;
          background: rgba(17,24,39,0.92);
          color: #fff;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 11px;
          line-height: 1.2;
          pointer-events: none;
          box-shadow: 0 6px 16px rgba(0,0,0,0.22);
          z-index: 20;
          white-space: nowrap;
        }
      `}</style>

      <div className="db-donut-title-section">
        <div className="db-donut-title-row">
          <p className="db-donut-title">{title}</p>
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(); }}
              className="db-donut-view-button"
            >
              View
            </button>
          )}
        </div>



        {isNoData && (
          <div className="db-donut-legend">
            <span className="db-donut-legend-item">
              <span className="db-donut-legend-dot" />
              No Data
            </span>
          </div>
        )}

      </div>



      <div className="db-donut-chart-wrapper">
        {isLoading ? (
          <div style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 1s linear infinite" }}>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          <>
            <svg
              key={JSON.stringify(data)}
              viewBox="25 30 200 200"
              width="200px"
              className="donut-anim db-donut-svg"
            >
              <defs>
                <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                </filter>
                {data.map((d) => (
                  <linearGradient key={`grad-${chartId}-${d.name}`} id={`grad-${chartId}-${d.name.replace(/\s+/g, "-")}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={d.color || DONUT_COLOR} />
                    <stop offset="100%" stopColor={d.color || DONUT_COLOR} stopOpacity="0.85" />
                  </linearGradient>
                ))}
              </defs>

              {isNoData ? (
                <g>
                  <path
                    d={`M${cx + r},${cy} A${r},${r} 0 1,1 ${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy}
                   M${cx + inner},${cy} A${inner},${inner} 0 1,0 ${cx - inner},${cy} A${inner},${inner} 0 1,0 ${cx + inner},${cy} Z`}
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
                      style={{
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        filter: hoveredName === s.name ? "brightness(1.1)" : "none",
                        opacity: 1
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


              {selected && onBack && (
                <g
                  onClick={onBack}
                  style={{ cursor: "pointer" }}
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
              <div
                className="donut-tip"
                style={{
                  left: hoverPos.x,
                  top: hoverPos.y - 12,
                  transform: "translate(-50%, -100%)",
                  zIndex: 9999,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: data.find((d) => d.name === hoveredName)?.color || DONUT_COLOR,
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
                    }}
                  />
                  {getShortName(hoveredName)}
                </div>
                <div style={{ opacity: 0.9 }}>
                  {(() => {
                    const v = data.find((d) => d.name === hoveredName)?.value ?? 0;
                    const pct = (v / (total || 1)) * 100;
                    return `${v.toLocaleString()} (${pct.toFixed(2)}%)`;
                  })()}
                </div>
              </div>
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
                  <span style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                    {item.name}
                  </span>
                </span>
                <span style={{ color: "#0f527c", fontWeight: 700, whiteSpace: "nowrap" }}>
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

function BarChart({ data, title, onBarClick, onView, isLoading }) {
  const [tooltip, setTooltip] = useState(null);
  const chartRef = useRef(null);
  const isNoData = !data || data.length === 0;

  const maxClicks = isNoData ? 100 : Math.max(...data.map(d => d.clicks)) * 1.1 || 100;
  const maxCtr = isNoData ? 2 : Math.max(...data.map(d => d.ctr)) * 1.1 || 2;

  const formatXAxis = (val) => {
    if (val === 0) return "0.00";
    if (val >= 1000) return (val / 1000).toFixed(2) + "K";
    return val.toFixed(2);
  };

  return (
    <div className="db-bar-chart-container">
      <div className="db-bar-title-section">
        <div className="db-bar-title-row">
          <p className="db-bar-title">{title || "Clicks and CTR by Category"}</p>
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(); }}
              className="db-donut-view-button"
            >
              View
            </button>
          )}
        </div>

        {!isNoData && (
          <div className="db-bar-legend">
            <span className="db-bar-legend-item">
              <span className="db-bar-legend-dot" style={{ background: "#0f527c" }} /> CTR
            </span>
            <span className="db-bar-legend-item">
              <span className="db-bar-legend-dot" style={{ background: "#22a3d4" }} /> Clicks
            </span>
          </div>
        )}
      </div>


      <div className="db-bar-content">
        {isLoading ? (
          <div style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", animation: "spin 1s linear infinite" }} />
          </div>
        ) : isNoData ? (
          <div className="db-bar-no-data">
            <div style={{ textAlign: "center" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", margin: 0 }}>No Data Available</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingRight: 10, minWidth: 70 }}>
              {data.map((d, i) => (
                <div key={d.name || i} style={{ height: 38, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, color: "#1e293b", fontWeight: "700" }}>{getShortName(d.name)}</span>
                </div>
              ))}
            </div>

            <div ref={chartRef} style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
                {data.map((d, rowIndex) => (
                  <div
                    key={d.name}
                    style={{
                      cursor: onBarClick ? "pointer" : "default"
                    }}
                    onClick={() => onBarClick && onBarClick(d.name)}
                    onMouseEnter={(e) => {
                      const host = chartRef.current;
                      if (!host) return setTooltip({ ...d, rowIndex });
                      const hostRect = host.getBoundingClientRect();
                      const rowRect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ ...d, rowIndex, y: rowRect.top - hostRect.top + rowRect.height / 2, name: d.name });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <div style={{ height: 16, display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", columnGap: 8 }}>
                      <div style={{ height: 10, width: "100%", background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div
                          className="db-bar-metric-bar"
                          style={{
                            width: `${(d.ctr / maxCtr) * 100}%`,
                            background: "#0f527c",
                            borderRadius: 10,
                            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: "#111827", fontWeight: "800", whiteSpace: "nowrap", minWidth: 46, textAlign: "right" }}>{`${d.ctr.toFixed(2)}%`}</span>
                    </div>
                    <div style={{ height: 16, display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", columnGap: 8 }}>
                      <div style={{ height: 10, width: "100%", background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                        <div
                          className="db-bar-metric-bar"
                          style={{
                            width: `${(d.clicks / maxClicks) * 100}%`,
                            background: "#22a3d4",
                            borderRadius: 10,
                            transition: "width 1s 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: "#111827", fontWeight: "400", whiteSpace: "nowrap", minWidth: 56, textAlign: "right" }}>{`${(d.clicks / 1000).toFixed(2)}K`}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingLeft: 8, fontSize: 10, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 4 }}>
                <span>0.00</span>
                <span>{formatXAxis(maxClicks / 3)}</span>
                <span>{formatXAxis((maxClicks * 2) / 3)}</span>
                <span>{formatXAxis(maxClicks)}</span>
              </div>

              {tooltip && (
                <div style={{ position: "absolute", top: tooltip.y, left: "70%", transform: "translate(-50%, -50%)", background: "#1e293b", color: "#fff", borderRadius: 6, padding: "8px 12px", fontSize: 11, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)", zIndex: 50, pointerEvents: "none", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 4 }}>{getShortName(tooltip.name)}</p>
                  <p style={{ margin: "2px 0" }}>CTR: <span style={{ color: "#818cf8", fontWeight: 800 }}>{(tooltip.ctr || 0).toFixed(2)}%</span></p>
                  <p style={{ margin: "2px 0" }}>Clicks: <span style={{ color: "#38bdf8", fontWeight: 800 }}>{(tooltip.clicks || 0).toLocaleString()}</span></p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChannelDashboard({ overviewData, selectedChannel, setSelectedChannel, selectedFrom, setSelectedFrom, selectedAdFormat, setSelectedAdFormat, selectedCampaign, setSelectedCampaign, selectedAd, setSelectedAd, dateFrom, dateTo, children, isLoading }) {
  const navigate = useNavigate();
  const [internalSelected, setInternalSelected] = useState(null);
  const [internalSelectedFrom, setInternalSelectedFrom] = useState(null);
  const effectiveSelected = selectedChannel ?? internalSelected;
  const effectiveSelectedFrom = selectedFrom ?? internalSelectedFrom;
  const setEffectiveSelected = setSelectedChannel ?? setInternalSelected;
  const setEffectiveSelectedFrom = setSelectedFrom ?? setInternalSelectedFrom;

  const overviewHierarchy = overviewData;



  useEffect(() => {
    if (effectiveSelected && !effectiveSelectedFrom) setEffectiveSelectedFrom("impressions");
  }, [effectiveSelected, effectiveSelectedFrom, setEffectiveSelectedFrom]);

  const resetView = () => {
    if (selectedAd) { if (setSelectedAd) setSelectedAd(null); return; }
    if (selectedCampaign) { if (setSelectedCampaign) setSelectedCampaign(null); return; }
    if (selectedAdFormat) { if (setSelectedAdFormat) setSelectedAdFormat(null); return; }
    setEffectiveSelectedFrom(null);
    setEffectiveSelected(null);
  };

  const handleDonutClick = (metric, name) => {
    if (!effectiveSelected) {
      setEffectiveSelectedFrom(metric);
      setEffectiveSelected(name);
      return;
    }
    const exchange = (overviewHierarchy || { exchanges: [] }).exchanges.find(ex => ex.name?.toLowerCase() === effectiveSelected?.toLowerCase());
    if (!exchange) return;

    if (exchange.adFormats.some(f => f.format === name)) {
      if (setSelectedAdFormat) setSelectedAdFormat(name);
      return;
    }

    const isCampaignName = exchange.adFormats.some(format => format.campaigns.some(camp => camp.campaign === name));
    if (isCampaignName) {
      if (setSelectedCampaign) setSelectedCampaign(name);
      return;
    }

    const isAdName = exchange.adFormats.some(format =>
      format.campaigns.some(camp => camp.ads.some(ad => ad.ad === name))
    );
    if (isAdName) {
      if (setSelectedAd) setSelectedAd(name);
      return;
    }

    if (effectiveSelected === name) resetView();
  };

  const getFilteredMetrics = (metricKey) => {
    if (!effectiveSelected) {
      const mapped = (overviewHierarchy || { exchanges: [] }).exchanges.map(ex => ({
        name: ex.name,
        value: ex.summary[metricKey] || 0
      })).sort((a, b) => b.value - a.value);

      return mapped.map((ex, idx) => ({
        ...ex,
        color: getDynamicColor(idx, "exchange")
      }));
    }
    const exchange = (overviewHierarchy || { exchanges: [] }).exchanges.find(ex => ex.name?.toLowerCase() === effectiveSelected?.toLowerCase());
    if (!exchange) return [];

    if (selectedCampaign) {
      const adsMap = {};
      const impMap = {};
      exchange.adFormats.forEach(format => {
        format.campaigns.forEach(camp => {
          if (camp.campaign === selectedCampaign) {
            camp.ads.forEach(ad => {
              const val = metricKey === "total_spend" ? ad.metrics.spend : metricKey === "totalclicks" ? ad.metrics.clicks : metricKey === "totalconversion" ? ad.metrics.conversion : metricKey === "totalctr" ? ad.metrics.ctr : ad.metrics.impressions;
              adsMap[ad.ad] = (adsMap[ad.ad] || 0) + val;
              impMap[ad.ad] = (impMap[ad.ad] || 0) + ad.metrics.impressions;
            });
          }
        });
      });
      const top5Ads = Object.keys(impMap).sort((a, b) => impMap[b] - impMap[a]).slice(0, 5);
      return top5Ads.map((name, idx) => ({
        name,
        value: adsMap[name],
        color: getDynamicColor(idx, "ad")
      }));
    }

    if (selectedAdFormat) {
      const adFormat = exchange.adFormats.find(f => f.format === selectedAdFormat);
      if (!adFormat) return [];
      const topCampaigns = [...adFormat.campaigns].sort((a, b) => (b.metrics?.impressions || 0) - (a.metrics?.impressions || 0)).slice(0, 5);
      return topCampaigns.map((camp, idx) => {
        const val = metricKey === "total_spend" ? camp.metrics.spend : metricKey === "totalclicks" ? camp.metrics.clicks : metricKey === "totalconversion" ? camp.metrics.conversion : metricKey === "totalctr" ? camp.metrics.ctr : camp.metrics.impressions;
        return {
          name: camp.campaign,
          value: val,
          color: getDynamicColor(idx, "campaign")
        };
      });
    }

    return exchange.adFormats.map(f => ({
      name: f.format,
      value: f.summary[metricKey]
    })).sort((a, b) => b.value - a.value).slice(0, 5).map((f, idx) => ({
      ...f,
      color: getDynamicColor(idx, "type")
    }));
  };

  const currentImpressions = useMemo(() => getFilteredMetrics("totalimpressions"), [effectiveSelected, selectedAdFormat, selectedCampaign, overviewHierarchy]);
  const currentConversion = useMemo(() => getFilteredMetrics("totalconversion"), [effectiveSelected, selectedAdFormat, selectedCampaign, overviewHierarchy]);

  const currentBarData = useMemo(() => {
    const clicks = getFilteredMetrics("totalclicks");
    const ctrs = getFilteredMetrics("totalctr");
    return clicks.map(c => {
      const ctrVal = ctrs.find(i => i.name === c.name)?.value || 0;
      return { name: c.name, clicks: c.value, ctr: ctrVal };
    });
  }, [effectiveSelected, selectedAdFormat, selectedCampaign, overviewHierarchy]);

  const impressionsActiveName = currentImpressions.some(d => d.name === (selectedAd || selectedCampaign || selectedAdFormat || effectiveSelected)) ? (selectedAd || selectedCampaign || selectedAdFormat || effectiveSelected) : null;
  const conversionActiveName = currentConversion.some(d => d.name === (selectedAd || selectedCampaign || selectedAdFormat || effectiveSelected)) ? (selectedAd || selectedCampaign || selectedAdFormat || effectiveSelected) : null;

  const drillLevel = selectedCampaign ? "Ad" : selectedAdFormat ? "Campaign" : "Ad Format";

  const impTitle = effectiveSelected
    ? `Impressions by ${drillLevel}`
    : "Impressions by Channel";

  const barTitle = effectiveSelected
    ? `Clicks & CTR by ${drillLevel}`
    : "Clicks and CTR by Channel";

  const convTitle = effectiveSelected
    ? `Conversion by ${drillLevel}`
    : "Conversion by Channel";

  const spendingTitle = effectiveSelected
    ? `Ads Spending for ${effectiveSelected} by ${drillLevel}`
    : "Ads Spending by Channel, Ad Format, Campaign and Ad";

  const handleView = () => {
    navigate("/admin/exchange");
  };

  return (
    <div style={{ position: "relative", padding: 12, paddingLeft: 0, paddingRight: 0, borderRadius: 12 }}>
      <div className="db-charts-grid" style={{ gridTemplateColumns: children ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr" }}>
        <DonutChart
          title={impTitle}
          data={currentImpressions}
          onSliceClick={(name) => handleDonutClick("impressions", name)}
          onBack={resetView}
          selected={!!effectiveSelected}
          activeName={impressionsActiveName}
          onView={handleView}
          isLoading={isLoading}
        />
        <BarChart
          data={currentBarData}
          title={barTitle}
          onBarClick={(name) => handleDonutClick("bar", name)}
          onView={handleView}
          isLoading={isLoading}
        />
        <DonutChart
          title={convTitle}
          data={currentConversion}
          onSliceClick={(name) => handleDonutClick("conversion", name)}
          onBack={resetView}
          selected={!!effectiveSelected}
          activeName={conversionActiveName}
          onView={handleView}
          isLoading={isLoading}
        />
        {children}
      </div>
    </div>
  );
}

