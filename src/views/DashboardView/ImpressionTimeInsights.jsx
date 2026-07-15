import React, { useState, useEffect, useMemo, useRef } from "react";
import { dayofweek } from "../api/Api.jsx";

const toIsoDate = (d) => {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const METRIC_CONFIG = {
  impressions: { id: "impressions", label: "Impressions", color: "#8b5cf6", type: "number" },
  clicks: { id: "clicks", label: "Clicks", color: "#3b82f6", type: "number" },
  installs: { id: "installs", label: "Installs", color: "#10b981", type: "number" },
  conversions: { id: "conversions", label: "Payable Conversions", color: "#06b6d4", type: "number" },
  events: { id: "events", label: "Events", color: "#ec4899", type: "number" },
  cr: { id: "cr", label: "CR %", color: "#ef4444", type: "percent" }
};

function DualAxisChart({ chartData, activeMetrics, isLoading, isNoData }) {
  const svgRef = useRef(null);
  const scrollRef = useRef(null);
  const wrapperRef = useRef(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const n = chartData.length;
  const isNoDataFinal = isNoData || n === 0 || activeMetrics.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.deltaY !== 0 && e.deltaX === 0) {
        if (el.scrollWidth > el.clientWidth) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };
    const handleScroll = () => {
      setHoveredIdx(null);
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [n]);

  const W = Math.max(680, n * 80);
  const H = 400;
  const padL = 60, padR = 60, padT = 40, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  let maxNum = 1;
  let maxPct = 1;
  if (!isNoDataFinal) {
    chartData.forEach(d => {
      if (activeMetrics.includes('impressions') && d.impressions > maxNum) maxNum = d.impressions;
      if (activeMetrics.includes('clicks') && d.clicks > maxNum) maxNum = d.clicks;
      if (activeMetrics.includes('installs') && d.installs > maxNum) maxNum = d.installs;
      if (activeMetrics.includes('conversions') && d.conversions > maxNum) maxNum = d.conversions;
      if (activeMetrics.includes('events') && d.events > maxNum) maxNum = d.events;
      if (activeMetrics.includes('cr') && d.cr > maxPct) maxPct = d.cr;
    });
  }

  // Add 10% padding to max values
  maxNum = maxNum * 1.1;
  maxPct = Math.max(maxPct * 1.1, 10); // Minimum 10% scale for CR

  const formatNumberAxis = (val) => {
    if (val === 0) return "0";
    if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
    if (val >= 1000) return (val / 1000).toFixed(1) + "k";
    return Math.round(val).toString();
  };

  const toX = (i) => padL + (i / Math.max(1, n - 1)) * chartW;
  const toYNum = (v) => padT + chartH - ((v / maxNum) * chartH);
  const toYPct = (v) => padT + chartH - ((v / maxPct) * chartH);

  const makeSmoothPath = (dataArr, getY) => {
    if (!dataArr || dataArr.length === 0) return "";
    if (dataArr.length === 1) return `M${toX(0)},${getY(dataArr[0])}`;

    let path = `M${toX(0)},${getY(dataArr[0])}`;
    for (let i = 0; i < dataArr.length - 1; i++) {
      const x1 = toX(i);
      const y1 = getY(dataArr[i]);
      const x2 = toX(i + 1);
      const y2 = getY(dataArr[i + 1]);

      // Control points for bezier curve (monotone X)
      const cx = (x1 + x2) / 2;
      path += ` C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }
    return path;
  };

  const makeAreaPath = (linePath) => {
    if (!linePath || n === 0) return "";
    const xStart = toX(0);
    const xEnd = toX(n - 1);
    const yBottom = padT + chartH;
    return `${linePath} L${xEnd},${yBottom} L${xStart},${yBottom} Z`;
  };

  const handleMouseMove = (e) => {
    if (!svgRef.current || !wrapperRef.current || isNoDataFinal) return;
    const rect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapperRef.current.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * W;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < n; i++) {
      const xVal = toX(i);
      const diff = Math.abs(svgX - xVal);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (svgX >= padL - 10 && svgX <= W - padR + 50) {
      setHoveredIdx(closestIdx);

      const pointSvgX = toX(closestIdx);
      const screenX = rect.left + (pointSvgX / W) * rect.width;
      const screenY = rect.top + (padT / H) * rect.height; // Anchor tooltip higher

      setTooltipPos({
        x: screenX - wrapRect.left,
        y: screenY - wrapRect.top
      });
    } else {
      setHoveredIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const tooltipWidthEstimate = 200;
  const wrapWidth = wrapperRef.current ? wrapperRef.current.offsetWidth : 800;

  let finalLeft = tooltipPos.x + 15;
  if (finalLeft + tooltipWidthEstimate > wrapWidth) {
    finalLeft = tooltipPos.x - tooltipWidthEstimate - 15;
  }
  let finalTop = Math.max(12, tooltipPos.y);

  return (
    <div ref={wrapperRef} className="impression-chart-wrapper">
      {isNoDataFinal ? (
        <div className="impression-no-data-container">
          <div className="impression-no-data-content">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" className="impression-no-data-icon">
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p className="impression-no-data-text">No Data Available</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="impression-chart-loading" style={{ minHeight: `${H}px` }}>
          <div className="impression-spinner">
          </div>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="impression-chart-scrollable">
            <div style={{ minWidth: `${W}px`, position: "relative", height: `${H}px` }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                className="impression-anim impression-chart-svg"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  {activeMetrics.map(id => (
                    <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={METRIC_CONFIG[id].color} stopOpacity="0.12" />
                      <stop offset="100%" stopColor={METRIC_CONFIG[id].color} stopOpacity="0.00" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Grid Lines and Axes */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const y = padT + chartH - pct * chartH;
                  const isHasPctAxis = activeMetrics.some(m => METRIC_CONFIG[m].type === 'percent');
                  const isHasNumAxis = activeMetrics.some(m => METRIC_CONFIG[m].type === 'number');

                  return (
                    <g key={pct}>
                      <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,4" />
                      {isHasPctAxis && (
                        <text x={padL - 10} y={y + 4} textAnchor="end" fontSize="11" fontWeight="500" fill="#64748b">
                          {Math.round(pct * maxPct)}%
                        </text>
                      )}
                      {isHasNumAxis && (
                        <text x={W - padR + 10} y={y + 4} textAnchor="start" fontSize="11" fontWeight="500" fill="#64748b">
                          {formatNumberAxis(pct * maxNum)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Render areas then lines to keep lines crisp on top */}
                {activeMetrics.map(id => {
                  const config = METRIC_CONFIG[id];
                  const getY = config.type === 'percent' ? toYPct : toYNum;
                  const dataArr = chartData.map(d => d[id]);
                  const path = makeSmoothPath(dataArr, getY);
                  const area = makeAreaPath(path);
                  return <path key={`area-${id}`} d={area} fill={`url(#grad-${id})`} />;
                })}

                {activeMetrics.map(id => {
                  const config = METRIC_CONFIG[id];
                  const getY = config.type === 'percent' ? toYPct : toYNum;
                  const dataArr = chartData.map(d => d[id]);
                  const path = makeSmoothPath(dataArr, getY);
                  return <path key={`line-${id}`} d={path} fill="none" stroke={config.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
                })}

                {/* Hover Indicators */}
                {hoveredIdx !== null && (
                  <>
                    <line
                      x1={toX(hoveredIdx)}
                      x2={toX(hoveredIdx)}
                      y1={padT}
                      y2={H - padB}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    {activeMetrics.map(id => {
                      const config = METRIC_CONFIG[id];
                      const getY = config.type === 'percent' ? toYPct : toYNum;
                      const val = chartData[hoveredIdx][id];
                      return (
                        <circle
                          key={`dot-${id}`}
                          cx={toX(hoveredIdx)}
                          cy={getY(val)}
                          r="5"
                          fill="#fff"
                          stroke={config.color}
                          strokeWidth="2.5"
                          style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" }}
                        />
                      );
                    })}
                  </>
                )}

                {/* X Axis Labels */}
                {chartData.map((d, i) => (
                  <text key={`${d.day}_${i}`} x={toX(i)} y={padT + chartH + 24} textAnchor="middle" fontSize="11" fontWeight="500" fill="#94a3b8">{d.day}</text>
                ))}
              </svg>
            </div>
          </div>
          {hoveredIdx !== null && (
            <div
              className="impression-tooltip"
              style={{
                left: `${finalLeft}px`,
                top: `${finalTop}px`,
              }}
            >
              <div className="impression-tooltip-header">
                {chartData[hoveredIdx].day}
              </div>
              <div className="impression-tooltip-body">
                {activeMetrics.map(id => {
                  const config = METRIC_CONFIG[id];
                  const val = chartData[hoveredIdx][id];
                  const displayVal = config.type === 'percent' ? `${val.toFixed(2)}%` : val.toLocaleString();
                  return (
                    <div key={id} className="impression-tooltip-row">
                      <span className="impression-tooltip-label">
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: config.color }}></span>
                        {config.label}
                      </span>
                      <span className="impression-tooltip-value">
                        {displayVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const normalizeName = (name, type) => {
  if (!name) {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return "Other";
  }
  const lower = name.toLowerCase();
  if (lower === "unknown" || lower.includes("unknown")) {
    if (type === "exchange") return "Other Channel";
    if (type === "format") return "Other Format";
    if (type === "campaign") return "Other Campaign";
    if (type === "ad") return "Other Ad";
    return name.replace(/unknown/ig, "Other");
  }
  return name;
};

export default function ImpressionsDashboard({ overviewDataRaw, selectedChannel, selectedFrom, selectedAdFormat, selectedCampaign, selectedAd, dateFrom, dateTo, isLoading: externalLoading }) {
  const [impressionPayload, setImpressionPayload] = useState({ rawExchanges: [] });
  const [internalLoading, setInternalLoading] = useState(false);


  // const [activeMetrics, setActiveMetrics] = useState(["impressions", "clicks", "installs", "conversions", "events", "cr"]);
  const [activeMetrics, setActiveMetrics] = useState(["impressions", "clicks"]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const apiPayload = {
          startDate: dateFrom || toIsoDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
          endDate: dateTo || toIsoDate(new Date()),
          channel: "all",
          campaign: "all"
        };
        setInternalLoading(true);
        const res = await dayofweek(apiPayload);
        const rawData = res.data || [];

        let dataList = Array.isArray(rawData) ? rawData : [];
        if (dataList.length === 1) {
          const first = dataList[0];
          if (first.dayOfWeekBased && Array.isArray(first.dayOfWeekBased)) {
            dataList = first.dayOfWeekBased;
          }
        } else if (rawData.dayOfWeekBased && Array.isArray(rawData.dayOfWeekBased)) {
          dataList = rawData.dayOfWeekBased;
        }

        setImpressionPayload({ rawExchanges: dataList });
      } catch (err) {
        console.error("Error fetching chart data:", err);
      } finally {
        setInternalLoading(false);
      }
    };

    fetchChartData();
  }, [dateFrom, dateTo]);

  const rawData = impressionPayload?.rawExchanges ?? [];

  const { chartData, isNoData } = useMemo(() => {
    let isNoData = false;
    const dayMap = new Map();
    const occurrenceMap = new Map();

    if (!rawData || rawData.length === 0) {
      return { chartData: [], isNoData: true };
    }

    const checkMatch = (val, filter, type) => {
      if (!filter || filter.toLowerCase() === "all") return true;
      return normalizeName(val, type).toLowerCase() === filter.toLowerCase();
    };

    rawData.forEach(rawEx => {
      const exMatch = checkMatch(rawEx.exchangeName, selectedChannel, "exchange");
      if (!exMatch) return;

      const exName = (rawEx.exchangeName || "Unknown").trim();
      if (!occurrenceMap.has(exName)) {
        occurrenceMap.set(exName, new Map());
      }
      const exOccurrences = occurrenceMap.get(exName);

      const baseDayName = (rawEx.dayName || "Unknown").trim();
      const occ = (exOccurrences.get(baseDayName) || 0) + 1;
      exOccurrences.set(baseDayName, occ);

      const uniqueKey = `${baseDayName}_${occ}`;

      const addData = (dName, imp, clk, inst = 0, conv = 0, ev = 0) => {
        if (!dayMap.has(uniqueKey)) {
          dayMap.set(uniqueKey, { name: dName.trim(), order: dayMap.size, imp: 0, clk: 0, installs: 0, conversions: 0, events: 0 });
        }
        const entry = dayMap.get(uniqueKey);
        entry.imp += (imp || 0);
        entry.clk += (clk || 0);

        entry.installs += (inst || 0);
        entry.conversions += (conv || 0);
        entry.events += (ev || 0);
      };

      if (selectedCampaign || selectedAdFormat || selectedAd) {
        rawEx.dayOfWeekCampaignBasedResponseList?.forEach(camp => {
          const campMatch = checkMatch(camp.campaignName, selectedCampaign, "campaign");
          if (!campMatch) return;

          if (selectedAdFormat || selectedAd) {
            camp.adsData?.forEach(ad => {
              const formatMatch = checkMatch(ad.type, selectedAdFormat, "format");
              const adMatch = checkMatch(ad.name, selectedAd, "ad");
              if (formatMatch && adMatch) {
                addData(ad.dayName || camp.dayName || rawEx.dayName, ad.totalWin || ad.totalImpressions, ad.totalClicks);
              }
            });
          } else {
            addData(camp.dayName || rawEx.dayName, camp.totalImpressions, camp.totalClicks);
          }
        });
      } else {
        addData(rawEx.dayName, rawEx.totalImpressions, rawEx.totalClicks);
      }
    });

    const dayEntries = Array.from(dayMap.values());
    dayEntries.sort((a, b) => a.order - b.order);

    const outData = dayEntries.map(d => ({
      day: d.name,
      impressions: d.imp,
      clicks: d.clk,
      installs: d.installs,
      conversions: d.conversions,
      events: d.events,
      cr: d.clk > 0 ? (d.conversions / d.clk) * 100 : 0
    }));

    if (dayEntries.length === 0 || outData.every(d => d.impressions === 0 && d.clicks === 0)) {
      isNoData = true;
    }

    return { chartData: outData, isNoData };
  }, [selectedChannel, selectedAdFormat, selectedCampaign, selectedAd, rawData]);

  const toggleMetric = (id) => {
    setActiveMetrics(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  return (
    <div className="impression-dashboard-main">
      <div className="impression-dashboard-layout">
        <div className="impression-card">

          {/* Header Row */}
          <div className="impression-card-header">


            <div className="impression-metrics-container">
              {activeMetrics.map(id => (
                <div key={id} className="impression-metric-badge">
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: METRIC_CONFIG[id].color }}></span>
                  {METRIC_CONFIG[id].label}
                  <span
                    className="impression-metric-remove-btn"
                    onClick={() => toggleMetric(id)}
                  >
                    ×
                  </span>
                </div>
              ))}

              <div ref={dropdownRef} className="impression-dropdown-wrapper">
                <button
                  className="impression-add-metrics-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  + Metrics
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="impression-dropdown-menu">
                    {Object.values(METRIC_CONFIG).map(config => (
                      <div
                        key={config.id}
                        className="impression-dropdown-item"
                        onClick={() => toggleMetric(config.id)}
                        style={{ background: activeMetrics.includes(config.id) ? "#f8fafc" : "transparent" }}
                      >
                        <span className="impression-dropdown-item-label">
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: config.color }}></span>
                          {config.label}
                        </span>
                        {activeMetrics.includes(config.id) && <span className="impression-dropdown-checkmark">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="impression-chart-padding-container">
            <DualAxisChart
              chartData={chartData}
              activeMetrics={activeMetrics}
              isLoading={externalLoading || internalLoading}
              isNoData={isNoData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}