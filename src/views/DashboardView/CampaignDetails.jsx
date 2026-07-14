import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./CampaignDetails.css";
import { getAllCampaigns, updatecampaignstatus, getAlladvertiserLogin, edituser } from "../api/Api.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { canCreate, canEdit, canDelete, canView, canUpdate, canApprove } from "../../utils/permissionHelper";
import {
  faCalendarAlt,
  faChevronDown,
  faChevronUp,
  faChartBar,
  faExternalLinkAlt,
  faInfoCircle,
  faComment,
  faSearch,
  faList,
  faSortAmountDown,
  faSortAmountUp,
  faPlus,
  faFileExport,
  faCog,
  faRotateRight,
  faStar,
  faChevronLeft,
  faChevronRight,
  faCheck,
  faEdit,
  faTrash,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import { FaCaretDown } from "react-icons/fa";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Input, Spinner } from "reactstrap";
import Popup from "../Modal/Popup.jsx"

function CampaignBadge({ level }) {
  const colors = {
    3: ["#60a5fa", "#38bdf8"],
    2: ["#34d399", "#4ade80"],
    1: ["#f87171", "#fca5a5"],
  };
  const [top, bottom] = colors[level] || colors[3];
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      className="cd-campaign-badge-svg"
    >
      <defs>
        <linearGradient id={`cd-badge${level}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="22" height="22" rx="4" fill={`url(#cd-badge${level})`} />
      <text
        x="11"
        y="15"
        textAnchor="middle"
        fontSize="12"
        fill="white"
        fontWeight="bold"
      >
        ✦
      </text>
    </svg>
  );
}

function DualAxisChart({
  visible,
  selectedMetrics,
  campaignData,
  chartRows,
  dateRange,
}) {
  const svgRef = useRef(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    setChartData(buildChartSeriesFromRows(chartRows || [], dateRange || {}));
  }, [chartRows, dateRange?.endDate, dateRange?.startDate]);

  if (!visible || !campaignData) return null;

  if (!chartData || !chartData.dates || chartData.dates.length === 0) {
    return (
      <div
        className="cd-dual-axis-chart-container"
        style={{
          position: "relative",
          minHeight: "350px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="cd-chart-overview-header">
          <div className="cd-chart-overview-heading">
            <div className="cd-chart-overview-title"> Overview</div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            width: "100%",
          }}
        >
          <div
            style={{
              padding: "20px",
              border: "1px dashed #dbe4ff",
              borderRadius: "14px",
              background: "#fbfcff",
              color: "#5b6475",
              fontSize: "14px",
              textAlign: "center",
              width: "100%",
            }}
          >
            No daily impression, click, or conversion data was returned by the API
            for the selected campaign.
          </div>
        </div>
      </div>
    );
  }

  const sampleCount = Math.min(8, chartData.dates.length);
  const sampleIndices =
    sampleCount === chartData.dates.length
      ? chartData.dates.map((_, index) => index)
      : Array.from({ length: sampleCount }, (_, index) =>
        sampleCount === 1
          ? chartData.dates.length - 1
          : Math.floor(
            (index * (chartData.dates.length - 1)) / (sampleCount - 1),
          ),
      );

  const displayDates = sampleIndices.map((index) => chartData.dates[index]);
  const displayImpressions = sampleIndices.map(
    (index) => chartData.impressions[index],
  );
  const displayConversions = sampleIndices.map(
    (index) => chartData.conversions[index],
  );
  const displayClicks = sampleIndices.map((index) => chartData.clicks[index]);

  const W = 1800,
    H = 350;
  const padL = 30,
    padR = 30,
    padT = 20,
    padB = 48;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const maxImp = Math.max(...displayImpressions, 1);
  const maxConv = Math.max(...displayConversions, 1);
  const maxClicks = Math.max(...displayClicks, 1);
  const n = displayDates.length;

  const xS = (i) => (n === 1 ? padL + cW / 2 : padL + (i / (n - 1)) * cW);
  const yI = (v) => padT + cH - (v / maxImp) * cH;
  const yC = (v) => padT + cH - (v / maxConv) * cH;
  const yClk = (v) => padT + cH - (v / maxClicks) * cH;

  const makeSmoothPath = (data, xFunc, yFunc) => {
    if (!data || data.length === 0) return "";
    if (data.length === 1) {
      return `M${xFunc(0)},${yFunc(data[0])}`;
    }

    let path = `M${xFunc(0)},${yFunc(data[0])}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = xFunc(i);
      const y1 = yFunc(data[i]);
      const x2 = xFunc(i + 1);
      const y2 = yFunc(data[i + 1]);
      const cx = (x1 + x2) / 2;
      path += ` C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }

    return path;
  };

  const makeAreaPath = (linePath, xFunc, data, padT, cH) => {
    if (!linePath || data.length === 0) return "";
    const xStart = xFunc(0);
    const xEnd = xFunc(data.length - 1);
    const yBottom = padT + cH;
    return `${linePath} L${xEnd},${yBottom} L${xStart},${yBottom} Z`;
  };

  const impPath = makeSmoothPath(displayImpressions, xS, yI);
  const convPath = makeSmoothPath(displayConversions, xS, yC);
  const clicksPath = makeSmoothPath(displayClicks, xS, yClk);

  const impArea = makeAreaPath(impPath, xS, displayImpressions, padT, cH);
  const convArea = makeAreaPath(convPath, xS, displayConversions, padT, cH);
  const clicksArea = makeAreaPath(clicksPath, xS, displayClicks, padT, cH);

  const gridFactors = [0, 0.25, 0.5, 0.75, 1];
  const impGrid = gridFactors.map((f) => Math.floor(maxImp * f));
  const convGrid = gridFactors.map((f) => Math.floor(maxConv * f));
  const clicksGrid = gridFactors.map((f) => Math.floor(maxClicks * f));

  const showImpressions = selectedMetrics.impressions;
  const showConversions = selectedMetrics.conversions;
  const showClicks = selectedMetrics.clicks;
  const chartBottom = H - padB;
  const hoveredPoints =
    hoveredIdx === null
      ? []
      : [
        showImpressions ? yI(displayImpressions[hoveredIdx]) : null,
        showConversions ? yC(displayConversions[hoveredIdx]) : null,
        showClicks ? yClk(displayClicks[hoveredIdx]) : null,
      ].filter((value) => typeof value === "number");
  const hoveredTooltipY = hoveredPoints.length
    ? hoveredPoints.reduce((sum, value) => sum + value, 0) /
    hoveredPoints.length
    : 12;
  const tooltipWidthEstimate = 220;
  const tooltipPadding = 12;
  const tooltipAnchorX = xS(hoveredIdx);
  const tooltipLeftPx = Math.min(
    Math.max(tooltipAnchorX + 12, tooltipPadding),
    W - tooltipWidthEstimate - tooltipPadding,
  );

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * W;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < n; i++) {
      const xVal = xS(i);
      const diff = Math.abs(svgX - xVal);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (svgX >= padL - 10 && svgX <= W - padR + 50) {
      setHoveredIdx(closestIdx);
    } else {
      setHoveredIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  return (
    <div
      className="cd-dual-axis-chart-container"
      style={{ position: "relative" }}
    >
      <div className="cd-chart-overview-header">
        <div className="cd-chart-overview-heading">
          <div className="cd-chart-overview-title"> Overview</div>
        </div>
        <div className="cd-chart-overview-legend">
          {showImpressions && (
            <span className="cd-overview-legend-item">
              <span
                className="cd-overview-legend-dot"
                style={{ backgroundColor: "#8b5cf6" }}
              ></span>
              IMPRESSIONS
            </span>
          )}
          {showClicks && (
            <span className="cd-overview-legend-item">
              <span
                className="cd-overview-legend-dot"
                style={{ backgroundColor: "#3b82f6" }}
              ></span>
              CLICKS
            </span>
          )}
          {showConversions && (
            <span className="cd-overview-legend-item">
              <span
                className="cd-overview-legend-dot"
                style={{ backgroundColor: "#ec4899" }}
              ></span>
              CONVERSIONS
            </span>
          )}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="cd-dual-axis-chart-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="grad-impressions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="grad-conversions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="grad-clicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {gridFactors.map((f, i) => {
          const y = padT + cH - cH * f;
          return (
            <line
              key={`grid-${i}`}
              x1={padL}
              x2={W - padR + 20}
              y1={y}
              y2={y}
              className="cd-chart-grid-line"
              strokeDasharray={i === 0 ? "0" : "2 5"}
              opacity={i === 0 ? 1 : 0.45}
            />
          );
        })}

        <line
          x1={padL}
          x2={W - padR + 20}
          y1={chartBottom}
          y2={chartBottom}
          className="cd-chart-grid-line"
          opacity="0.75"
        />

        {gridFactors.map((f, i) => (
          <text
            key={`left-${i}`}
            x={padL - 8}
            y={padT + cH - cH * f + 4}
            textAnchor="end"
            className="cd-chart-label-impressions"
          >
            {`${Math.round(f * 8)}%`}
          </text>
        ))}

        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
          <text
            key={`right-${i}`}
            x={W - padR + 10}
            y={padT + cH - cH * f + 4}
            textAnchor="start"
            className="cd-chart-label-conversions"
          >
            {f === 0 ? "0" : `${(300 * f).toFixed(1)}k`}
          </text>
        ))}

        {displayDates.map((l, i) => (
          <text
            key={i}
            x={xS(i)}
            y={chartBottom + 24}
            textAnchor="middle"
            className="cd-chart-date-text"
          >
            {l}
          </text>
        ))}

        {showImpressions && <path d={impArea} fill="url(#grad-impressions)" />}
        {showConversions && <path d={convArea} fill="url(#grad-conversions)" />}
        {showClicks && <path d={clicksArea} fill="url(#grad-clicks)" />}

        {showImpressions && (
          <path
            d={impPath}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
        )}
        {showConversions && (
          <path
            d={convPath}
            fill="none"
            stroke="#e11d48"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
        )}
        {showClicks && (
          <path
            d={clicksPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
        )}

        {hoveredIdx !== null && (
          <>
            <line
              x1={xS(hoveredIdx)}
              x2={xS(hoveredIdx)}
              y1={padT}
              y2={H - padB}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.6"
            />
            {showImpressions && (
              <circle
                cx={xS(hoveredIdx)}
                cy={yI(displayImpressions[hoveredIdx])}
                r="4.5"
                fill="#7c3aed"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.15))" }}
              />
            )}
            {showConversions && (
              <circle
                cx={xS(hoveredIdx)}
                cy={yC(displayConversions[hoveredIdx])}
                r="4.5"
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.15))" }}
              />
            )}
            {showClicks && (
              <circle
                cx={xS(hoveredIdx)}
                cy={yClk(displayClicks[hoveredIdx])}
                r="4.5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="1.5"
                style={{ filter: "drop-shadow(0px 1px 3px rgba(0,0,0,0.15))" }}
              />
            )}
          </>
        )}
      </svg>

      {hoveredIdx !== null && (
        <div
          className="cd-chart-html-tooltip"
          style={{
            position: "absolute",
            left: `${(tooltipLeftPx / W) * 100}%`,
            top: `${Math.max(12, Math.min(chartBottom - 132, hoveredTooltipY - 82))}px`,
            transform: "none",
            pointerEvents: "none",
          }}
        >
          <div className="cd-tooltip-header">
            {displayDates[hoveredIdx].toUpperCase()}
          </div>
          <div className="cd-tooltip-divider"></div>
          <div className="cd-tooltip-body">
            {showImpressions && (
              <div className="cd-tooltip-row">
                <span
                  className="cd-tooltip-dot"
                  style={{ backgroundColor: "#7c3aed" }}
                ></span>
                <span className="cd-tooltip-label">Impressions</span>
                <span className="cd-tooltip-value">
                  {displayImpressions[hoveredIdx].toLocaleString('en-US')}
                </span>
              </div>
            )}
            {showClicks && (
              <div className="cd-tooltip-row">
                <span
                  className="cd-tooltip-dot"
                  style={{ backgroundColor: "#3b82f6" }}
                ></span>
                <span className="cd-tooltip-label">Clicks</span>
                <span className="cd-tooltip-value">
                  {displayClicks[hoveredIdx].toLocaleString('en-US')}
                </span>
              </div>
            )}
            {showConversions && (
              <div className="cd-tooltip-row">
                <span
                  className="cd-tooltip-dot"
                  style={{ backgroundColor: "#e11d48" }}
                ></span>
                <span className="cd-tooltip-label">Conversions</span>
                <span className="cd-tooltip-value">
                  {displayConversions[hoveredIdx].toLocaleString('en-US')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomizeGraphModal({ isOpen, onClose, selectedMetrics, onSave }) {
  const [tempMetrics, setTempMetrics] = useState(selectedMetrics);

  if (!isOpen) return null;

  return (
    <div className="cd-modal-overlay">
      <div className="cd-modal-container">
        <div className="cd-modal-header">Customize Graph</div>
        <div className="cd-modal-body">
          <p className="cd-modal-description">
            Select metrics to display on the chart:
          </p>
          <label className="cd-modal-checkbox-label">
            <input
              type="checkbox"
              checked={tempMetrics.impressions}
              onChange={(e) =>
                setTempMetrics({
                  ...tempMetrics,
                  impressions: e.target.checked,
                })
              }
              className="cd-modal-checkbox"
            />
            <span className="cd-modal-checkbox-text">Impressions</span>
          </label>
          <label className="cd-modal-checkbox-label">
            <input
              type="checkbox"
              checked={tempMetrics.conversions}
              onChange={(e) =>
                setTempMetrics({
                  ...tempMetrics,
                  conversions: e.target.checked,
                })
              }
              className="cd-modal-checkbox"
            />
            <span className="cd-modal-checkbox-text">Total Conversions</span>
          </label>
          <label className="cd-modal-checkbox-label">
            <input
              type="checkbox"
              checked={tempMetrics.clicks}
              onChange={(e) =>
                setTempMetrics({ ...tempMetrics, clicks: e.target.checked })
              }
              className="cd-modal-checkbox"
            />
            <span className="cd-modal-checkbox-text">Total Clicks</span>
          </label>
        </div>
        <div className="cd-modal-footer">
          <button onClick={onClose} className="cd-modal-btn-cancel">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(tempMetrics);
              onClose();
            }}
            className="cd-modal-btn-apply"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function Select({ value, options, onChange, minWidth = 100 }) {
  return (
    <div className="cd-select-wrapper">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cd-select-dropdown"
        style={{ minWidth }}
      >
        {options.map((o, index) => (
          <option key={o.value !== undefined ? o.value : o} value={o.value !== undefined ? o.value : o}>{o.label || o}</option>
        ))}
      </select>
      <span className="cd-select-icon">
        <FontAwesomeIcon icon={faChevronDown} size="xs" />
      </span>
    </div>
  );
}

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const getCurrentWeekRange = () => {
  const today = new Date();
  const start = startOfDay(today);
  start.setDate(start.getDate() - 6);

  return {
    startDate: start,
    endDate: endOfDay(today),
  };
};

const isSameDay = (first, second) => {
  if (!first || !second) return false;
  return startOfDay(first).getTime() === startOfDay(second).getTime();
};

const isSameDateRange = (firstRange, secondRange) =>
  isSameDay(firstRange?.startDate, secondRange?.startDate) &&
  isSameDay(firstRange?.endDate, secondRange?.endDate);

const getDatesInRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (
    !start ||
    !end ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return [];
  }

  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);
  if (rangeStart > rangeEnd) {
    return [];
  }

  const dates = [];
  const current = new Date(rangeStart);

  while (current <= rangeEnd) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const formatChartDateLabel = (date) => {
  const normalized = new Date(date);
  if (Number.isNaN(normalized.getTime())) {
    return String(date || "");
  }

  const month = normalized.toLocaleString("default", { month: "short" });
  return `${month} ${normalized.getDate()}`;
};

const toChartNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildChartSeriesFromRows = (rows = [], dateRange = {}) => {
  if (rows.some((row) => row.date)) {
    const sortedRows = [...rows].sort((a, b) => new Date(a.date) - new Date(b.date));
    const dates = sortedRows.map((row) => formatChartDateLabel(row.date));
    return {
      dates,
      impressions: sortedRows.map((row) =>
        toChartNumber(row.impressionsWon ?? row.impressions),
      ),
      clicks: sortedRows.map((row) => toChartNumber(row.totalClicks ?? row.clicks)),
      conversions: sortedRows.map((row) =>
        toChartNumber(row.conversions ?? row.totalConversions ?? row.conversion),
      ),
    };
  }

  const rangeDates = getDatesInRange(dateRange.startDate, dateRange.endDate);
  const pointCount = Math.max(rangeDates.length, rows.length);
  const dates = Array.from({ length: pointCount }, (_, index) =>
    rangeDates[index]
      ? formatChartDateLabel(rangeDates[index])
      : `Day ${index + 1}`,
  );
  const points = Array.from(
    { length: pointCount },
    (_, index) => rows[index] || {},
  );

  return {
    dates,
    impressions: points.map((row) =>
      toChartNumber(row.impressionsWon ?? row.impressions),
    ),
    clicks: points.map((row) => toChartNumber(row.totalClicks ?? row.clicks)),
    conversions: points.map((row) =>
      toChartNumber(row.conversions ?? row.totalConversions ?? row.conversion),
    ),
  };
};

// StatusDropdown Component
function StatusDropdown({ campaign, onStatusChange, canApproveUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);

  const handleStatusChange = (newStatus) => {
    onStatusChange(campaign, newStatus);
    setDropdownOpen(false);
  };

  const getStatusButtonColor = (status) => {
    switch (status) {
      case "runnable":
        return "#10b981";
      case "offline":
        return "#6b7280";
      case "hold":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {canApproveUser && (
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
          <DropdownToggle
            tag="button"
            className="cd-status-dropdown-btn"
            style={{
              backgroundColor: getStatusButtonColor(campaign.status),
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              textTransform: "capitalize",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {campaign.status || "Set Status"}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transition: "transform 0.2s ease",
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </DropdownToggle>
          <DropdownMenu className="cd-status-dropdown-menu">
            <DropdownItem
              onClick={() => handleStatusChange("runnable")}
              className="cd-status-item"
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#10b981",
                  marginRight: "8px",
                }}
              ></span>
              Runnable
            </DropdownItem>
            <DropdownItem
              onClick={() => handleStatusChange("offline")}
              className="cd-status-item"
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#6b7280",
                  marginRight: "8px",
                }}
              ></span>
              Offline
            </DropdownItem>
            <DropdownItem
              onClick={() => handleStatusChange("hold")}
              className="cd-status-item"
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  marginRight: "8px",
                }}
              ></span>
              Hold
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>)}
      {!canApproveUser && (
        <div className="audiencemenu gOorhn">
          <span>Access Denied</span>
        </div>
      )}
    </div>
  );
}

function DataTable({
  data,
  onSelectCampaign,
  viewBy,
  sortColumn,
  sortDirection,
  onSort,
  onEditCampaign,
  onDeleteCampaign,
  onStatusChange,
  canEditUser,
  canApproveUser,
}) {
  const columnCount = 18;

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "--";
    return `$${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "--";
    return Number(num).toLocaleString('en-US');
  };

  const getViewByValue = (c) => {
    switch (viewBy) {
      case "Spend":
        return formatCurrency(c.totalSpend);
      case "Impressions":
        return formatNumber(c.impressionsWon);
      case "Clicks":
        return formatNumber(c.totalClicks);
      case "Conversions":
        return formatNumber(c.totalRevenue ? c.totalRevenue / 10 : 0);
      default:
        return formatCurrency(c.totalSpend);
    }
  };

  const getViewByLabel = () => {
    switch (viewBy) {
      case "Spend":
        return "TOTAL SPEND";
      case "Impressions":
        return "TOTAL IMPRESSIONS";
      case "Clicks":
        return "TOTAL CLICKS";
      case "Conversions":
        return "TOTAL CONVERSIONS";
      default:
        return "TOTAL SPEND";
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="cd-data-table-wrapper">
      <div className="cd-table-scroll-container">
        <table className="cd-data-table">
          <thead className="cd-data-table-header">
            <tr>
              <th
                className="cd-data-table-th cd-sortable"
                onClick={() => onSort("name")}
              >
                Campaign{renderSortIcon("name")}
              </th>
              <th
                className="cd-data-table-th cd-sortable"
                onClick={() => onSort("status")}
              >
                Status
              </th>
              <th
                className="cd-data-table-th-right cd-sortable"
                onClick={() => onSort("budget")}
              >
                Budget{renderSortIcon("budget")}
              </th>
              <th
                className="cd-data-table-th-center cd-sortable"
                onClick={() => onSort("remaining")}
              >
                Remaining{renderSortIcon("remaining")}
              </th>
              <th className="cd-data-table-th-right">GOAL / ACTUAL</th>
              <th className="cd-data-table-th-center">Metrics</th>
              <th
                className="cd-data-table-th-right cd-sortable"
                onClick={() => onSort("totalSpend")}
              >
                {getViewByLabel()}
                {renderSortIcon("totalSpend")}
              </th>
              <th className="cd-data-table-th-center">ACTIONS</th>
              <th className="cd-data-table-th-right">Dates</th>
              <th className="cd-data-table-th-right">Win Rate</th>
              <th className="cd-data-table-th-right">Impression</th>
              <th className="cd-data-table-th-right">Clicks</th>
              <th className="cd-data-table-th-right">Install</th>
              <th className="cd-data-table-th-right">CTR</th>
              <th className="cd-data-table-th-right">CVR</th>
              <th className="cd-data-table-th-right">Primary Conversion</th>
              <th className="cd-data-table-th-right">Secondary Conversion</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="cd-data-table-empty-state">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((campaign, idx) => {
                const remainingAmt =
                  (campaign.totalBudget || 0) - (campaign.totalSpend || 0);
                const remainingPct = campaign.totalBudget
                  ? (remainingAmt / campaign.totalBudget) * 100
                  : 0;
                const barColor =
                  remainingPct < 0
                    ? "#e73c32"
                    : remainingPct < 2
                      ? "#e73c32"
                      : "#e73c32";
                const textColor = remainingPct < 50 ? "#1e293b" : "#fff";
                const barWidth =
                  remainingPct < 0
                    ? 100
                    : Math.max(4, Math.min(100, remainingPct));
                const isActive = campaign.status === "runnable";
                const computedWinRate =
                  Number(campaign.totalResponse) > 0
                    ? (Number(campaign.impressionsWon || 0) / Number(campaign.totalResponse)) * 100
                    : 0;

                return (
                  <tr
                    key={campaign.id || idx}
                    className={`cd-data-table-row ${isActive ? "cd-row-active" : "cd-row-inactive"}`}
                    onMouseEnter={(e) =>
                      e.currentTarget.classList.add("cd-row-hover")
                    }
                    onMouseLeave={(e) =>
                      e.currentTarget.classList.remove("cd-row-hover")
                    }
                    onClick={() => onSelectCampaign(campaign)}
                  >
                    <td className="cd-data-table-td">
                      <div className="cd-campaign-name-container">
                        <CampaignBadge level={campaign.badgeLevel || 1} />
                        <span className="cd-campaign-advertiser">
                          {campaign.name?.split(" - ")[0] || "Campaign"}
                        </span>
                      </div>
                      <span className="cd-campaign-name">{campaign.name}</span>
                    </td>
                    <td className="cd-data-table-td-center">
                      <StatusDropdown
                        campaign={campaign}
                        onStatusChange={onStatusChange}
                        canApproveUser={canApproveUser}
                      />
                    </td>
                    <td className="cd-data-table-td-right cd-data-table-td-bold">
                      {formatCurrency(campaign.totalBudget)}
                    </td>
                    <td className="cd-data-table-td">
                      <div className="cd-progress-bar-container">
                        <div
                          className="cd-progress-bar-fill"
                          style={{
                            width: `${barWidth}%`,
                            background: barColor,
                          }}
                        />
                        <div
                          className="cd-progress-bar-text"
                          style={{ color: textColor }}
                        >
                          {formatCurrency(remainingAmt)}
                        </div>
                      </div>
                    </td>
                    <td className="cd-data-table-td-right">
                      <div className="cd-metric-value">
                        <span className="cd-metric-label">GOAL: </span>
                        <span className="cd-metric-number">
                          {campaign.goalValue != null && campaign.goalValue !== 0
                            ? `$${Number(campaign.goalValue).toLocaleString('en-US')}`
                            : "0"}{" "}
                        </span>
                      </div>
                      <div className="cd-metric-value">
                        <span className="cd-metric-label">ACTUAL: </span>
                        <span className="cd-metric-number">
                          {campaign.actualPrice != null && campaign.actualPrice !== 0
                            ? `$${Number(campaign.actualPrice).toLocaleString('en-US')}`
                            : "0"}
                        </span>
                      </div>
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.campaignType?.toLocaleString('en-US') || "0"}
                    </td>
                    <td className="cd-data-table-td-right">
                      <div className="cd-metric-value">
                        <span className="cd-metric-label">
                          {getViewByLabel()}:{" "}
                        </span>
                        <span className="cd-metric-number">
                          {getViewByValue(campaign)}
                        </span>
                      </div>
                      {/* <div className="cd-metric-value">
                        <span className="cd-metric-label">ACTUAL: </span>
                        <span className="cd-metric-number">
                          {campaign.totalCost
                            ? formatCurrency(campaign.totalCost)
                            : "--"}
                        </span>
                      </div> */}
                    </td>
                    <td className="cd-data-table-td-center">
                      <CampaignActionsCell
                        campaign={campaign}
                        onEdit={() => onEditCampaign(campaign)}
                        onDelete={() => onDeleteCampaign(campaign)}
                        canEditUser={canEditUser}
                      />
                    </td>
                    <td className="cd-data-table-td-right cd-data-table-dates">
                      <div>
                        <span className="cd-date-label">START: </span>
                        {formatDate(campaign.activateTime)}
                      </div>
                      <div>
                        <span className="cd-date-label">END: </span>
                        {formatDate(campaign.expireTime)}
                      </div>
                    </td>
                    <td className="cd-data-table-td-right">
                      {`${computedWinRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.impressionsWon?.toLocaleString('en-US') || "0"}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.totalClicks?.toLocaleString('en-US') || "0"}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.install?.toLocaleString('en-US') || "0"}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.impressionsWon > 0
                        ? `${(
                          (campaign.totalClicks / campaign.impressionsWon) *
                          100
                        ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                        : "0%"}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.cvr != null
                        ? `${Number(campaign.cvr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                        : "0"}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.primaryConversion?.toLocaleString('en-US') || "0"}
                    </td>
                    <td className="cd-data-table-td-right">
                      {campaign.secondaryConversion?.toLocaleString('en-US') || "0"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



function CampaignActionsCell({ campaign, onEdit, onDelete, canEditUser }) {
  return (
    <div
      className="cd-actions-cell-wrapper"
      onClick={(e) => e.stopPropagation()}
    >
      {canEditUser ? (
          <FontAwesomeIcon   onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }} icon={faEdit} className="cd-actions-icon" />
      
      ) : null}
    </div>
  );
}

export default function CampaignDashboard() {
  const [chartVisible, setChartVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("Date Created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [tableSortColumn, setTableSortColumn] = useState(null);
  const [tableSortDirection, setTableSortDirection] = useState("asc");
  const [showActive, setShowActive] = useState(true);
  const [viewBy, setViewBy] = useState("Spend");
  const [compareAgainst, setCompareAgainst] = useState("Campaign Goal");
  const [intervalVal, setIntervalVal] = useState("Campaign To Date");
  const [search, setSearch] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignChartRows, setCampaignChartRows] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState("All Advertisers");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopups = async () => {
      if (location.state && location.state.showSavedPopup) {
        const shouldShowFundAlert = location.state.showFundAlert;
        // Clear state so popups don't show again on manual refresh
        navigate(location.pathname, {
          replace: true,
          state: {
            ...location.state,
            showSavedPopup: false,
            showFundAlert: false,
          },
        });

        // 1. Show Campaign Saved success popup
        await Swal.fire({
          html: `
            <div style="
              padding: 40px 30px;
              text-align: center;
              font-family: Arial, sans-serif;
            ">
              <div style="
                width: 90px;
                height: 90px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(40,167,69,0.1);
                border-radius: 50%;
              ">
                <i class="fa fa-check-circle" style="
                  font-size: 50px;
                  color: #28a745;
                "></i>
              </div>

              <h2 style="
                margin: 0 0 10px;
                font-size: 28px;
                font-weight: 700;
                color: #1e293b;
              ">
                Campaign Saved!
              </h2>

              <p style="
                margin: 0;
                font-size: 16px;
                color: #64748b;
              ">
                Your campaign was saved successfully.
              </p>
            </div>
          `,
          timer: 2000,
          showConfirmButton: false,
          width: 500,
          padding: 0,
          background: "#ffffff",
          allowOutsideClick: false,
        });

        // 2. Show warning/error popup if fund check failed 
        if (shouldShowFundAlert) {
          await Swal.fire({
            html: `
              <div class="campaign-swal-card">
                <div class="campaign-swal-icon" aria-hidden="true" style="color: #eab308; background: linear-gradient(180deg, #fef9c3 0%, #fef08a 100%); box-shadow: inset 0 0 0 1px rgba(234, 179, 8, 0.14);">
                  <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px;">
                    <path
                      d="M12 9v4"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.4"
                      stroke-linecap="round"
                    />
                    <circle cx="12" cy="17" r="1.25" fill="currentColor" />
                    <path
                      d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <div class="campaign-swal-title">Alert</div>
                <div class="campaign-swal-message">Entered Campaign Budget Is Less Than Your Available Fund. Please Update Your Fund or Contact the Administrator.</div>
              </div>
            `,
            showConfirmButton: true,
            confirmButtonText: "OK",
            width: 500,
            padding: 0,
            background: "#ffffff",
            allowOutsideClick: false,
            buttonsStyling: false,
            customClass: {
              popup: "campaign-swal-popup",
              htmlContainer: "campaign-swal-body",
              actions: "campaign-swal-actions",
              confirmButton: "campaign-swal-confirm",
            },
          });
        }
      }
    };
    handlePopups();
  }, [location.state, navigate]);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const addCampaignButtonRef = useRef(null);
  const addCampaignMenuRef = useRef(null);
  const [addMenuPosition, setAddMenuPosition] = useState({ top: 0, left: 0 });
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    impressions: true,
    conversions: true,
    clicks: true,
  });
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState(() =>
    getCurrentWeekRange(),
  );
  const [appliedDateRange, setAppliedDateRange] = useState(() =>
    getCurrentWeekRange(),
  );
  const tableDateRangeRef = useRef(null);
  const graphDateRangeRef = useRef(null);
  const dateRangePopupRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingRow, setPendingRow] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [statusdata, setstatusdata] = useState({});
  const [openItemsPerPageDropdown, setOpenItemsPerPageDropdown] = useState(false);
  const [openViewByDropdown, setOpenViewByDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [viewByDropdownPosition, setViewByDropdownPosition] = useState({ top: 0, left: 0 });
  const itemsPerPageDropdownRef = useRef(null);
  const viewByDropdownRef = useRef(null);
  const portalDropdownRef = useRef(null);
  const portalViewByDropdownRef = useRef(null);

  // Permission states
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const [canApproveUser, setCanApproveUser] = useState(false);

  const userid = localStorage.getItem("userId");
  const [isAdvertiser, setIsAdvertiser] = useState(false);
  const billingStatusStorageKey = useMemo(
    () => `campaign-billing-status:${userid || "anonymous"}`,
    [userid],
  );

  useEffect(() => {
    if (userid) {
      edituser(userid)
        .then((res) => {
          const info = res.data?.data?.informationUsers?.[0];
          if (info?.role?.roleId === 3) {
            setIsAdvertiser(true);
          } else {
            setIsAdvertiser(false);
          }
        })
        .catch((err) => {
          console.error("Error fetching user role:", err);
          setIsAdvertiser(false);
        });
    }
  }, [userid]);


  // Helper function to get campaign ID
  const getCampaignId = useCallback((campaign) => campaign?.id || campaign?.campaignId, []);

  const normalizeBillingStatus = useCallback((value) => {
    if (value === undefined || value === null || value === "") return null;

    const normalized = String(value).trim().toLowerCase();
    if (normalized === "1" || normalized === "true" || normalized === "yes") return 1;
    if (normalized === "0" || normalized === "false" || normalized === "no") return 0;

    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? value : numeric;
  }, []);

  const readBillingStatusCache = useCallback(() => {
    const readStorage = (storage) => {
      try {
        const raw = storage.getItem(billingStatusStorageKey);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    return {
      ...readStorage(localStorage),
      ...readStorage(sessionStorage),
    };
  }, [billingStatusStorageKey]);

  const writeBillingStatusCache = useCallback((nextCache) => {
    const serialized = JSON.stringify(nextCache || {});
    try {
      localStorage.setItem(billingStatusStorageKey, serialized);
    } catch {
      // Ignore storage failures and keep the in-memory state working.
    }
    try {
      sessionStorage.setItem(billingStatusStorageKey, serialized);
    } catch {
      // Ignore storage failures and keep the in-memory state working.
    }
  }, [billingStatusStorageKey]);

  const persistCampaignBillingStatus = useCallback((campaignId, billingStatus) => {
    const normalizedStatus = normalizeBillingStatus(billingStatus);
    if (!campaignId || normalizedStatus === null) return;

    const cache = readBillingStatusCache();
    cache[String(campaignId)] = normalizedStatus;
    writeBillingStatusCache(cache);
  }, [normalizeBillingStatus, readBillingStatusCache, writeBillingStatusCache]);

  const hydrateCampaignBillingStatus = useCallback((campaign) => {
    if (!campaign) return campaign;

    const directBillingStatus = normalizeBillingStatus(
      campaign.billingStatus ?? campaign.billing_status ?? campaign.billingstatus,
    );
    const campaignId = getCampaignId(campaign);

    if (directBillingStatus !== null) {
      if (campaignId) {
        persistCampaignBillingStatus(campaignId, directBillingStatus);
      }
      return {
        ...campaign,
        billingStatus: directBillingStatus,
      };
    }

    if (!campaignId) return campaign;

    const cachedBillingStatus = normalizeBillingStatus(
      readBillingStatusCache()[String(campaignId)],
    );

    if (cachedBillingStatus === null) return campaign;

    return {
      ...campaign,
      billingStatus: cachedBillingStatus,
    };
  }, [getCampaignId, normalizeBillingStatus, persistCampaignBillingStatus, readBillingStatusCache]);

  const hasPlatformFee = useCallback((campaign) => {
    return [campaign?.platformFee, campaign?.platform_fee, campaign?.groupPercentage]
      .some((value) => Number(value) > 0);
  }, []);

  const shouldShowPlatformFeeField = useCallback((campaign) => {
    if (!campaign) return true;

    const billingStatus = normalizeBillingStatus(
      campaign.billingStatus ?? campaign.billing_status ?? campaign.billingstatus,
    );

    if (String(billingStatus) === "1") {
      return false;
    }

    if (hasPlatformFee(campaign)) {
      return false;
    }

    return billingStatus === null || String(billingStatus) === "0";
  }, [hasPlatformFee, normalizeBillingStatus]);

  // Reusable function for status update
  const updateCampaignStatus = useCallback(async (campaign, newStatus, additionalData = {}) => {
    setPopupLoading(true);
    try {
      const campaignId = getCampaignId(campaign);
      console.log(`Updating campaign with ID:`, campaignId);

      if (!campaignId) {
        throw new Error("Campaign ID is missing. Cannot update campaign without ID.");
      }

      const payload = {
        id: campaignId,
        status: newStatus,
        userId: parseInt(userid) || 0,
        platformFee: parseFloat(additionalData.platform_fee) || 0,
        comments: additionalData.comments || "",
        attribute: "campagin",
        attributeId: campaignId
      };

      console.log("Sending payload:", payload);

      let res = await updatecampaignstatus(payload);
      console.log("Response:", res);

      if (res.data?.status === 200 || res.status === 200) {
        const findAvailableFund = (obj) => {
          if (!obj || typeof obj !== "object") return null;
          if ("availableFund" in obj) return obj.availableFund;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const val = findAvailableFund(item);
              if (val !== null) return val;
            }
          } else {
            for (const k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const val = findAvailableFund(obj[k]);
                if (val !== null) return val;
              }
            }
          }
          return null;
        };

        const avFund = findAvailableFund(res.data);
        const isInsufficient = (avFund === true || avFund === "true") && newStatus === "runnable";

        if (isInsufficient) {
          console.log("Campaign budget is insufficient. Keeping old status in UI.");
          return { success: true, insufficientFund: true };
        }

        const findBillingStatus = (obj) => {
          if (!obj || typeof obj !== "object") return null;
          if ("billingStatus" in obj) return obj.billingStatus;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const val = findBillingStatus(item);
              if (val !== null) return val;
            }
          } else {
            for (const k in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, k)) {
                const val = findBillingStatus(obj[k]);
                if (val !== null) return val;
              }
            }
          }
          return null;
        };

        const bStatus = findBillingStatus(res.data);
        if (bStatus !== null) {
          persistCampaignBillingStatus(campaignId, bStatus);
        }

        // Update campaigns list
        setCampaigns((prevData) =>
          prevData.map((item) =>
            getCampaignId(item) === getCampaignId(campaign)
              ? {
                  ...item,
                  status: newStatus,
                  ...(bStatus !== null ? { billingStatus: bStatus } : {})
                }
              : item
          )
        );

        // Update selectedCampaign if it's the same campaign
        if (selectedCampaign && getCampaignId(selectedCampaign) === getCampaignId(campaign)) {
          setSelectedCampaign(prev => ({
            ...prev,
            status: newStatus,
            ...(bStatus !== null ? { billingStatus: bStatus } : {})
          }));
        }

        console.log("Status updated successfully");
        return { success: true, insufficientFund: false };
      } else {
        throw new Error(res.data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      throw err;
    } finally {
      setPopupLoading(false);
    }
  }, [userid, selectedCampaign, getCampaignId, persistCampaignBillingStatus]);

  // Handle status change with proper confirmation
  const handleStatusChange = useCallback((campaign, newStatus) => {
    // For runnable status, show the popup modal with platform fee and comments
    if (newStatus === "runnable") {
      setPendingRow(hydrateCampaignBillingStatus(campaign));
      setPendingStatus(newStatus);
      setShowPopup(true);
    }
    // For offline and hold status, show confirmation dialog
    else if (newStatus === "offline" || newStatus === "hold") {
      Swal.fire({
        html: `
          <div class="campaign-swal-card">
            <div class="campaign-swal-icon" aria-hidden="true" style="color: #3b82f6; background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%); box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.14);">
              <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="campaign-swal-title">Are you sure?</div>
            <div class="campaign-swal-message">You want to change the status to "${newStatus}"?</div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Yes, change it!",
        cancelButtonText: "Cancel",
        width: 500,
        padding: 0,
        background: "#ffffff",
        allowOutsideClick: false,
        buttonsStyling: false,
        customClass: {
          popup: "campaign-swal-popup",
          htmlContainer: "campaign-swal-body",
          actions: "campaign-status-swal-actions",
          confirmButton: "campaign-status-confirm-btn",
          cancelButton: "campaign-status-cancel-btn"
        }
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const updateResult = await updateCampaignStatus(campaign, newStatus, {});
            if (updateResult && updateResult.insufficientFund) {
              await Swal.fire({
                html: `
                  <div class="campaign-swal-card">
                    <div class="campaign-swal-icon" aria-hidden="true" style="color: #eab308; background: linear-gradient(180deg, #fef9c3 0%, #fef08a 100%); box-shadow: inset 0 0 0 1px rgba(234, 179, 8, 0.14);">
                      <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px;">
                        <path
                          d="M12 9v4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.4"
                          stroke-linecap="round"
                        />
                        <circle cx="12" cy="17" r="1.25" fill="currentColor" />
                        <path
                          d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div class="campaign-swal-title">Alert</div>
                    <div class="campaign-swal-message">The selected advertiser's campaign budget is insufficient to run. Please update the advertiser's fund.</div>
                  </div>
                `,
                showConfirmButton: true,
                confirmButtonText: "OK",
                width: 500,
                padding: 0,
                background: "#ffffff",
                allowOutsideClick: false,
                buttonsStyling: false,
                customClass: {
                  popup: "campaign-swal-popup",
                  htmlContainer: "campaign-swal-body",
                  actions: "campaign-swal-actions",
                  confirmButton: "campaign-swal-confirm",
                },
              });
            } else {
              Swal.fire({
                html: `
                  <div class="campaign-swal-card">
                    <div class="campaign-swal-icon" aria-hidden="true" style="color: #22c55e; background: linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%); box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.14);">
                      <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round;">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div class="campaign-swal-title">Success!</div>
                    <div class="campaign-swal-message">Status changed to "${newStatus}" successfully.</div>
                  </div>
                `,
                timer: 2000,
                showConfirmButton: false,
                width: 500,
                padding: 0,
                background: "#ffffff",
                customClass: {
                  popup: "campaign-swal-popup",
                  htmlContainer: "campaign-swal-body"
                }
              });
            }
          } catch (err) {
            Swal.fire({
              html: `
                <div class="campaign-swal-card">
                  <div class="campaign-swal-icon" aria-hidden="true" style="color: #dc2626; background: linear-gradient(180deg, #fee2e2 0%, #fecaca 100%); box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.14);">
                    <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round;">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </div>
                  <div class="campaign-swal-title">Error!</div>
                  <div class="campaign-swal-message">Error updating status: ${err?.message || "Something went wrong."}</div>
                </div>
              `,
              showConfirmButton: true,
              confirmButtonText: "OK",
              width: 500,
              padding: 0,
              background: "#ffffff",
              allowOutsideClick: false,
              buttonsStyling: false,
              customClass: {
                popup: "campaign-swal-popup",
                htmlContainer: "campaign-swal-body",
                actions: "campaign-swal-actions",
                confirmButton: "campaign-swal-confirm",
              },
            });
          }
        }
      });
    }
  }, [hydrateCampaignBillingStatus, updateCampaignStatus]);

  useEffect(() => {
    const hasCreatePermission = canCreate("Manage Campaign");
    const hasViewPermission = canView("Manage Campaign");
    const hasEditPermission = canEdit("Manage Campaign");
    const hasDeletePermission = canDelete("Manage Campaign");
    const hasUpdatePermission = canUpdate("Manage Campaign");
    const hasApprovePermission = canApprove("Manage Campaign");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
    setCanApproveUser(hasApprovePermission);
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScrollPosition = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScrollPosition();
    const rafId = requestAnimationFrame(resetScrollPosition);

    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const popupNode = dateRangePopupRef.current;
      const tableNode = tableDateRangeRef.current;
      const graphNode = graphDateRangeRef.current;
      const dropdownNode = itemsPerPageDropdownRef.current;
      const viewByNode = viewByDropdownRef.current;
      const portalNode = portalDropdownRef.current;
      const portalViewByNode = portalViewByDropdownRef.current;
      if (
        (popupNode && popupNode.contains(event.target)) ||
        (tableNode && tableNode.contains(event.target)) ||
        (graphNode && graphNode.contains(event.target)) ||
        (dropdownNode && dropdownNode.contains(event.target)) ||
        (viewByNode && viewByNode.contains(event.target)) ||
        (portalNode && portalNode.contains(event.target)) ||
        (portalViewByNode && portalViewByNode.contains(event.target))
      ) {
        return;
      }

      setShowDateRangePicker(false);
      setOpenItemsPerPageDropdown(false);
      setOpenViewByDropdown(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (openItemsPerPageDropdown && itemsPerPageDropdownRef.current) {
      const updatePosition = () => {
        const rect = itemsPerPageDropdownRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition);
      return () => window.removeEventListener("scroll", updatePosition);
    }
  }, [openItemsPerPageDropdown]);

  useEffect(() => {
    if (openViewByDropdown && viewByDropdownRef.current) {
      const updatePosition = () => {
        const rect = viewByDropdownRef.current.getBoundingClientRect();
        setViewByDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      };

      updatePosition();
      window.addEventListener("scroll", updatePosition);
      return () => window.removeEventListener("scroll", updatePosition);
    }
  }, [openViewByDropdown]);

  const updateAddMenuPosition = useCallback(() => {
    const buttonNode = addCampaignButtonRef.current;
    if (!buttonNode || typeof window === "undefined") {
      return;
    }

    const rect = buttonNode.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 126;
    const gap = 8;
    const viewportPadding = 16;

    const idealLeft = rect.right - menuWidth;
    const left = Math.max(
      viewportPadding,
      Math.min(idealLeft, window.innerWidth - menuWidth - viewportPadding),
    );

    const belowTop = rect.bottom + gap;
    const shouldOpenAbove =
      belowTop + menuHeight > window.innerHeight - viewportPadding;
    const top = shouldOpenAbove
      ? Math.max(viewportPadding, rect.top - gap - menuHeight)
      : belowTop;

    setAddMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!showAddMenu) {
      return;
    }

    const handlePointerDown = (event) => {
      const targetNode = event.target;
      if (
        addCampaignButtonRef.current?.contains(targetNode) ||
        addCampaignMenuRef.current?.contains(targetNode)
      ) {
        return;
      }

      setShowAddMenu(false);
    };

    const handleViewportChange = () => {
      updateAddMenuPosition();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowAddMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAddMenu, updateAddMenuPosition]);

  const dateDisplayOptions = useMemo(
    () => ({
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    [],
  );
  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);

  const formatDateRangeLabel = useCallback(
    (startDate, endDate) => {
      if (startDate && endDate) {
        if (isSameDateRange({ startDate, endDate }, currentWeekRange)) {
          return "Last 7 days";
        }

        return `${startDate.toLocaleDateString(undefined, dateDisplayOptions)} - ${endDate.toLocaleDateString(undefined, dateDisplayOptions)}`;
      }
      return "Date Range";
    },
    [currentWeekRange, dateDisplayOptions],
  );

  const formatPickerValue = useCallback((date) => {
    if (!date) return "-- / -- / ----";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  }, []);

  const formatPayloadDate = useCallback((date) => {
    if (!date) return null;
    const normalized = new Date(date);
    if (Number.isNaN(normalized.getTime())) return null;

    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, "0");
    const day = String(normalized.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const normalizeDate = useCallback((value) => {
    if (!value) return null;
    const parsed = value instanceof Date ? new Date(value) : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const getPresetRange = useCallback((preset) => {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    switch (preset) {
      case "Last 7 days":
        return getCurrentWeekRange();
      case "Today":
        return { startDate: startOfToday, endDate: endOfToday };
      case "Yesterday": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 1);
        const end = new Date(endOfToday);
        end.setDate(end.getDate() - 1);
        return { startDate: start, endDate: end };
      }
      case "Last 30 days": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 29);
        return { startDate: start, endDate: endOfToday };
      }
      case "This month": {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: start, endDate: endOfToday };
      }
      case "Last month": {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(
          today.getFullYear(),
          today.getMonth(),
          0,
          23,
          59,
          59,
          999,
        );
        return { startDate: start, endDate: end };
      }
      case "Last 3 months": {
        const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        return { startDate: start, endDate: endOfToday };
      }
      default:
        return { startDate: null, endDate: null };
    }
  }, []);

  const openDateRangePicker = useCallback(() => {
    setDraftDateRange({
      startDate: appliedDateRange.startDate,
      endDate: appliedDateRange.endDate,
    });
    setShowDateRangePicker(true);
  }, [appliedDateRange.endDate, appliedDateRange.startDate]);

  const dateRangeLabel = useMemo(
    () =>
      formatDateRangeLabel(
        appliedDateRange.startDate,
        appliedDateRange.endDate,
      ),
    [
      appliedDateRange.endDate,
      appliedDateRange.startDate,
      formatDateRangeLabel,
    ],
  );

  const handleDateRangeApply = useCallback(() => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) {
      return;
    }

    const startDate =
      draftDateRange.startDate <= draftDateRange.endDate
        ? draftDateRange.startDate
        : draftDateRange.endDate;
    const endDate =
      draftDateRange.startDate <= draftDateRange.endDate
        ? draftDateRange.endDate
        : draftDateRange.startDate;

    setAppliedDateRange({ startDate, endDate });
    setShowDateRangePicker(false);
  }, [draftDateRange.endDate, draftDateRange.startDate]);

  const handleDateRangeClear = useCallback(() => {
    setDraftDateRange({ startDate: null, endDate: null });
    setAppliedDateRange({ startDate: null, endDate: null });
    setShowDateRangePicker(false);
  }, []);

  const handlePresetSelect = useCallback(
    (preset) => {
      const range = getPresetRange(preset);
      setDraftDateRange(range);
    },
    [getPresetRange],
  );

  const handleEditCampaign = (campaign) => {
    const campaignId = campaign?.id || campaign?.campaignId;
    if (campaignId) {
      navigate(`/admin/campcreate/${campaignId}`);
    }
  };

  const handleDeleteCampaign = (campaign) => {
    Swal.fire({
      html: `
        <div class="campaign-swal-card">
          <div class="campaign-swal-icon" aria-hidden="true" style="color: #ef4444; background: linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%); box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.14);">
            <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="14"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="campaign-swal-title">Are you sure?</div>
          <div class="campaign-swal-message">You want to delete campaign "${campaign.name}"?</div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      width: 500,
      padding: 0,
      background: "#ffffff",
      allowOutsideClick: false,
      buttonsStyling: false,
      customClass: {
        popup: "campaign-swal-popup",
        htmlContainer: "campaign-swal-body",
        actions: "campaign-status-swal-actions",
        confirmButton: "campaign-status-confirm-btn",
        cancelButton: "campaign-status-cancel-btn"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Deleted!", "Your campaign has been deleted.", "success");
      }
    });
  };

  const buildCampaignPayload = useCallback(
    (campaignIds = []) => {
      const normalizedCampaignIds = Array.isArray(campaignIds)
        ? campaignIds.filter(Boolean)
        : [campaignIds].filter(Boolean);

      const payload = {
        // advertiser_id: 1,
        campaignId: normalizedCampaignIds,
      };

      const startDate = formatPayloadDate(appliedDateRange.startDate);
      const endDate = formatPayloadDate(appliedDateRange.endDate);

      if (startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      return payload;
    },
    [appliedDateRange.endDate, appliedDateRange.startDate, formatPayloadDate],
  );

  const normalizeCampaignList = useCallback(
    (list = []) =>
      list.map((campaign) => ({
        ...campaign,
        advertiser: campaign.name?.split(" - ")[0] || "Campaign",
        badgeLevel:
          campaign.totalBudget > 5000 ? 3 : campaign.totalBudget > 1000 ? 2 : 1,
        isActive: campaign.status === "runnable",
        createdAtDate: new Date(campaign.createdAt || campaign.activateTime),
      })),
    [],
  );

  const exportToCSV = () => {
    const headers = [
      "Campaign Name",
      "Total Budget",
      "Total Spend",
      "Total Clicks",
      "Total Impressions",
      "Total Conversions",
      "Start Date",
      "End Date",
      "Status",
    ];
    const rows = campaigns.map((c) => [
      c.name,
      c.totalBudget || 0,
      c.totalSpend || 0,
      c.totalClicks || 0,
      c.impressionsWon || 0,
      c.totalRevenue ? (c.totalRevenue / 10).toFixed(0) : 0,
      c.flightStartdate ? new Date(c.flightStartdate).toLocaleDateString() : "",
      c.flightEnddate ? new Date(c.flightEnddate).toLocaleDateString() : "",
      c.status || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaigns_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTableSort = (column) => {
    setCurrentPage(1);
    setTableSortColumn((currentColumn) => {
      if (currentColumn === column) {
        setTableSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc",
        );
        return currentColumn;
      }

      setTableSortDirection("asc");
      return column;
    });
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const searchTerm = search.toLowerCase();
      const matchesSearch =
        campaign.name?.toLowerCase().includes(searchTerm) ||
        campaign.advertiser?.toLowerCase().includes(searchTerm);

      const matchesAdvertiser =
        selectedAdvertiser === "All Advertisers" ||
        String(campaign.createdUserId) === String(selectedAdvertiser);

      return matchesSearch && matchesAdvertiser;
    });
  }, [campaigns, search, selectedAdvertiser]);

  const applySorting = useCallback(
    (campaignsToSort) => {
      const sorted = [...campaignsToSort];

      if (tableSortColumn) {
        sorted.sort((a, b) => {
          const direction = tableSortDirection === "asc" ? 1 : -1;

          switch (tableSortColumn) {
            case "name":
              return (
                direction *
                String(a.name || "").localeCompare(String(b.name || ""))
              );
            case "budget":
              return direction * ((a.totalBudget || 0) - (b.totalBudget || 0));
            case "remaining":
              return (
                direction *
                ((a.totalBudget || 0) -
                  (a.totalSpend || 0) -
                  ((b.totalBudget || 0) - (b.totalSpend || 0)))
              );
            case "totalSpend":
              return direction * ((a.totalSpend || 0) - (b.totalSpend || 0));
            default:
              return 0;
          }
        });
        return sorted;
      }

      switch (sortBy) {
        case "Name":
          sorted.sort((a, b) => {
            const nameA = (a.name || "").toLowerCase();
            const nameB = (b.name || "").toLowerCase();
            if (sortOrder === "asc") return nameA.localeCompare(nameB);
            return nameB.localeCompare(nameA);
          });
          break;
        case "Budget":
          sorted.sort((a, b) => {
            const budgetA = a.totalBudget || 0;
            const budgetB = b.totalBudget || 0;
            if (sortOrder === "asc") return budgetA - budgetB;
            return budgetB - budgetA;
          });
          break;
        case "Spend":
          sorted.sort((a, b) => {
            const spendA = a.totalSpend || 0;
            const spendB = b.totalSpend || 0;
            if (sortOrder === "asc") return spendA - spendB;
            return spendB - spendA;
          });
          break;
        case "Date Created":
        default:
          sorted.sort((a, b) => {
            const dateA = a.createdAtDate || new Date(0);
            const dateB = b.createdAtDate || new Date(0);
            if (sortOrder === "asc") return dateA - dateB;
            return dateB - dateA;
          });
          break;
      }
      return sorted;
    },
    [sortBy, sortOrder, tableSortColumn, tableSortDirection],
  );

  const applyActiveFirst = useCallback(
    (campaignsToSort) => {
      if (showActive) {
        return [...campaignsToSort].sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return 0;
        });
      }
      return campaignsToSort;
    },
    [showActive],
  );

  const sortedCampaigns = useMemo(() => {
    return applySorting(filteredCampaigns);
  }, [filteredCampaigns, applySorting]);

  const activeFirstCampaigns = useMemo(() => {
    return applyActiveFirst(sortedCampaigns);
  }, [sortedCampaigns, applyActiveFirst]);

  const getFirstSortedCampaign = useCallback(
    (list) => {
      if (!list || list.length === 0) return null;

      let filtered = list;
      if (search || selectedAdvertiser !== "All Advertisers") {
        const searchTerm = search.toLowerCase();
        filtered = list.filter((campaign) => {
          const matchesSearch =
            campaign.name?.toLowerCase().includes(searchTerm) ||
            campaign.advertiser?.toLowerCase().includes(searchTerm);

          const matchesAdvertiser =
            selectedAdvertiser === "All Advertisers" ||
            String(campaign.createdUserId) === String(selectedAdvertiser);

          return matchesSearch && matchesAdvertiser;
        });
      }

      const sorted = applySorting(filtered);
      const activeFirst = applyActiveFirst(sorted);
      return activeFirst[0] || list[0];
    },
    [search, selectedAdvertiser, applySorting, applyActiveFirst],
  );

  const fetchCampaignList = useCallback(async () => {
    const response = await getAllCampaigns(buildCampaignPayload([]));

    if (response.data && response.status === 200) {
      const campaignList = normalizeCampaignList(response.data.data || []).map(hydrateCampaignBillingStatus);
      setCampaigns(campaignList);
      return campaignList;
    }

    throw new Error("Failed to load campaigns");
  }, [buildCampaignPayload, hydrateCampaignBillingStatus, normalizeCampaignList]);

  const fetchCampaignById = useCallback(async (campaignId) => {
    const response = await getAllCampaigns(buildCampaignPayload([campaignId]));

      if (response.data && response.status === 200) {
        const campaignRows = response.data.data || [];
        setCampaignChartRows(campaignRows);

        const campaignList = normalizeCampaignList(campaignRows).map(hydrateCampaignBillingStatus);
        const matchedCampaign = campaignList.find(
          (campaign) => String(getCampaignId(campaign)) === String(campaignId),
        );
      if (matchedCampaign) {
        setSelectedCampaign(matchedCampaign);
      }
      return matchedCampaign || campaignList[0] || null;
    }

    throw new Error("Failed to load campaign");
  }, [buildCampaignPayload, getCampaignId, hydrateCampaignBillingStatus, normalizeCampaignList]);

  const fetchCampaigns = useCallback(async () => {
    const startTime = Date.now();
    setLoading(true);

    try {
      const campaignList = await fetchCampaignList();
      if (campaignList.length > 0) {
        const firstCampaign = getFirstSortedCampaign(campaignList);
        if (firstCampaign) {
          await fetchCampaignById(getCampaignId(firstCampaign));
        }
      } else {
        setSelectedCampaign(null);
        setCampaignChartRows([]);
      }
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Error loading campaign data");
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  }, [fetchCampaignList, getFirstSortedCampaign, fetchCampaignById, getCampaignId]);

  // const fetchAdvertisers = useCallback(async () => {
  //   try {
  //     const res = await getAlladvertiserLogin();
  //     if (res.data && res.data.status) {
  //       setAdvertisers(res.data.data);
  //     }
  //   } catch (err) {
  //     console.error("Error fetching advertisers:", err);
  //   }
  // }, []);

  useEffect(() => {
    fetchCampaigns();
    // fetchAdvertisers();
  }, [fetchCampaigns]);  //[fetchCampaigns, fetchAdvertisers]);

  const totalPages = Math.max(
    1,
    Math.ceil(activeFirstCampaigns.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const windowSize = 5;
    const halfWindow = 2;
    let start = Math.max(1, currentPage - halfWindow);
    let end = Math.min(totalPages, start + windowSize - 1);

    if (end - start + 1 < windowSize) {
      start = Math.max(1, end - windowSize + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const pagedCampaigns = useMemo(
    () => activeFirstCampaigns.slice(startIndex, endIndex),
    [activeFirstCampaigns, endIndex, startIndex],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!activeFirstCampaigns.length) {
      setSelectedCampaign(null);
      setCampaignChartRows([]);
      return;
    }

    const isSelectedVisible = selectedCampaign
      ? activeFirstCampaigns.some(
        (campaign) => String(getCampaignId(campaign)) === String(getCampaignId(selectedCampaign)),
      )
      : false;

    if (!isSelectedVisible) {
      const defaultCampaign = activeFirstCampaigns[0];
      setSelectedCampaign(defaultCampaign);
      const defaultCampaignId = getCampaignId(defaultCampaign);
      if (defaultCampaignId) {
        fetchCampaignById(defaultCampaignId).catch((err) => {
          console.error("Error fetching default campaign chart data:", err);
        });
      }
    }
  }, [activeFirstCampaigns, selectedCampaign, getCampaignId, fetchCampaignById]);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  const handleSelectCampaign = async (campaign) => {
    const clickedCampaignId = getCampaignId(campaign);

    if (!clickedCampaignId) {
      return;
    }

    setSelectedCampaign(campaign);

    try {
      await fetchCampaignById(clickedCampaignId);
    } catch (err) {
      console.error("Error fetching campaign details:", err);
    }
  };
  if (error) {
    return (
      <div className="cd-dashboard-error">
        <div className="cd-error-container">
          <p className="cd-error-message">{error}</p>
          <button onClick={fetchCampaigns} className="cd-error-retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      {canViewUser && (
        <div className="cd-dashboard-container">
          <div className={`campaign-loader-overlay ${loading ? "show" : ""}`}>
            <Spinner
              className="campaign-loader-spinner"
              style={{ width: "3.5rem", height: "3.5rem" }}
            />
          </div>
          <CustomizeGraphModal
            isOpen={showCustomizeModal}
            onClose={() => setShowCustomizeModal(false)}
            selectedMetrics={selectedMetrics}
            onSave={setSelectedMetrics}
          />

          {showDateRangePicker && (
            <div
              className="cd-date-range-popup cd-date-range-popup-floating"
              ref={dateRangePopupRef}
            >
              <div className="cd-date-range-presets">
                <div className="cd-date-range-presets-title">Preset Ranges</div>
                {[
                  "Today",
                  "Last 7 days",
                  "Yesterday",
                  "Last 30 days",
                  "This month",
                  "Last month",
                  "Last 3 months",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`cd-date-range-preset-btn ${isSameDateRange(draftDateRange, getPresetRange(preset)) ? "is-active" : ""}`}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="cd-date-range-panel">
                <div className="cd-date-range-fields">
                  <div className="cd-date-range-field">
                    <span className="cd-date-range-field-label">From</span>
                    <div
                      className={`cd-date-range-field-value ${!draftDateRange.startDate ? "is-empty" : ""}`}
                    >
                      {formatPickerValue(draftDateRange.startDate)}
                    </div>
                  </div>
                  <div className="cd-date-range-field">
                    <span className="cd-date-range-field-label">To</span>
                    <div
                      className={`cd-date-range-field-value ${!draftDateRange.endDate ? "is-empty" : ""}`}
                    >
                      {formatPickerValue(draftDateRange.endDate)}
                    </div>
                  </div>
                </div>
                <DatePicker
                  selected={draftDateRange.startDate || new Date()}
                  onChange={(dates) => {
                    const [start, end] = dates;
                    setDraftDateRange({ startDate: start, endDate: end });
                  }}
                  startDate={draftDateRange.startDate}
                  endDate={draftDateRange.endDate}
                  selectsRange
                  inline
                  monthsShown={2}
                  calendarClassName="cd-range-calendar"
                />
                <div className="cd-date-range-footer">
                  <button
                    type="button"
                    className="cd-date-range-btn cd-date-range-btn-secondary"
                    onClick={handleDateRangeClear}
                    disabled={!draftDateRange.startDate && !draftDateRange.endDate}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="cd-date-range-btn cd-date-range-btn-secondary"
                    onClick={() => setShowDateRangePicker(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="cd-date-range-btn cd-date-range-btn-primary"
                    onClick={handleDateRangeApply}
                    disabled={!draftDateRange.startDate || !draftDateRange.endDate}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {chartVisible && (
            <div className="cd-dashboard-card">
              <div className="cd-campaign-title-section">
                <div className="cd-campaign-title">
                  {selectedCampaign?.name || "Select a Campaign"}
                </div>
                <div className="cd-campaign-title-actions">
                  <button
                    type="button"
                    ref={graphDateRangeRef}
                    className="cd-date-range-button"
                    onClick={openDateRangePicker}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} size="sm" />
                    <span>{dateRangeLabel}</span>
                  </button>
                  <button
                    onClick={() => setShowCustomizeModal(true)}
                    className="cd-btn cd-btn-default"
                  >
                    <FontAwesomeIcon icon={faCog} size="xs" /> Customize Graph
                  </button>
                  <button onClick={exportToCSV} className="cd-btn cd-btn-default">
                    <FontAwesomeIcon icon={faFileExport} size="xs" /> Export
                  </button>
                </div>
              </div>

              <DualAxisChart
                visible={chartVisible}
                selectedMetrics={selectedMetrics}
                campaignData={selectedCampaign}
                chartRows={campaignChartRows}
                dateRange={appliedDateRange}
              />
            </div>
          )}

          <div className="cd-dashboard-card">
            <div className="cd-filters-bar">
              <div className="cd-filters-left">
                {!isAdvertiser && (
                  <Select
                    value={selectedAdvertiser}
                    options={[
                      { label: "All Advertisers", value: "All Advertisers" },
                      ...advertisers.map(adv => ({
                        label: adv.firstName || adv.email,
                        value: adv.userId
                      }))
                    ]}
                    onChange={setSelectedAdvertiser}
                  />
                )}
                <div className="cd-search-wrapper">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by campaign name"
                    className="cd-search-input"
                  />
                  <span className="cd-search-icon">
                    <FontAwesomeIcon icon={faSearch} size="xs" />
                  </span>
                </div>
                <div className="cd-sort-group">
                  <label className="cd-active-filter">
                    <div
                      onClick={() => setShowActive(!showActive)}
                      className={`cd-table-checkbox ${showActive ? "cd-table-checkbox-checked" : "cd-table-checkbox-unchecked"}`}
                    >
                      {showActive && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          size="xs"
                          className="cd-table-checkbox-icon"
                        />
                      )}
                    </div>
                    <span>Show Active First</span>
                  </label>
                </div>
                <div className="cd-sort-group">
                  <div
                    id="viewby-wrapper"
                    ref={viewByDropdownRef}
                    style={{ position: "relative", minWidth: "120px" }}
                  >
                    <div className="campaign-select-wrapper">
                      <Input
                        readOnly
                        value={viewBy}
                        className="campaign-select-input"
                        style={{
                          height: "38px",
                          minHeight: "38px",
                          borderRadius: "13px",
                          padding: "10px 34px 10px 12px",
                          maxWidth: "120px"

                        }}
                        onClick={() =>
                          setOpenViewByDropdown(!openViewByDropdown)
                        }
                        tabIndex={0}
                      />
                      <FaCaretDown
                        className={`custom-select-icon campaign-select-icon ${openViewByDropdown ? "open" : ""
                          }`}
                      />
                    </div>
                  </div>
                  {openViewByDropdown &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        ref={portalViewByDropdownRef}
                        className="custom-dropdown-menu biddeript-b"
                        style={{
                          position: "absolute",
                          top: `${viewByDropdownPosition.top}px`,
                          left: `${viewByDropdownPosition.left}px`,
                          zIndex: 9999,
                          minWidth: "140px",
                          pointerEvents: "auto"
                        }}
                      >
                        {["Spend", "Impressions", "Clicks", "Conversions"].map((option) => {
                          const isSelected = viewBy === option;
                          return (
                            <div
                              key={option}
                              onClick={() => {
                                setViewBy(option);
                                setOpenViewByDropdown(false);
                              }}
                              className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                }`}
                              style={{ height: "40px", cursor: "pointer", pointerEvents: "auto" }}
                            >
                              <span className="tick-icon">
                                {isSelected && "✓"}
                              </span>
                              <span>{option}</span>
                            </div>
                          );
                        })}
                      </div>,
                      document.body,
                    )}
                </div>
                <button
                  type="button"
                  onClick={fetchCampaigns}
                  className="cd-btn cd-btn-default cd-refresh-btn"
                >
                  <FontAwesomeIcon icon={faRotateRight} size="xs" />
                  Refresh
                </button>
                <div className="cd-date-range-wrapper" ref={tableDateRangeRef}>
                  <button
                    type="button"
                    className="cd-date-range-button"
                    onClick={openDateRangePicker}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} size="sm" />
                    <span>{dateRangeLabel}</span>
                  </button>
                </div>
                <button
                  onClick={() => setChartVisible((v) => !v)}
                  className="cd-btn cd-btn-default"
                >
                  {chartVisible ? (
                    <FontAwesomeIcon icon={faChevronUp} size="xs" />
                  ) : (
                    <FontAwesomeIcon icon={faChevronDown} size="xs" />
                  )}
                  &nbsp;
                  {chartVisible ? "Hide Chart" : "Show Chart"}
                </button>
              </div>
              <div className="cd-filters-bottom-row">

                <div className="cd-pagination-summary">
                  {activeFirstCampaigns.length
                    ? `${Math.min(endIndex, activeFirstCampaigns.length)} of ${activeFirstCampaigns.length} campaigns`
                    : "0 campaigns"}
                </div>
                <div className="cd-filters-right">
                  <div className="cd-pagination-toolbar">
                    {totalPages > 1 && (
                      <div className="cd-pagination-controls">
                        <button
                          onClick={() =>
                            handlePageChange(Math.max(1, currentPage - 1))
                          }
                          disabled={currentPage === 1}
                          className="cd-pagination-nav-btn-cam"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} size="xs" />
                        </button>
                        {paginationPages.map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`cd-pagination-page-btn-cam ${currentPage === page ? "is-active" : ""}`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            handlePageChange(Math.min(totalPages, currentPage + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="cd-pagination-nav-btn-cam"
                        >
                          <FontAwesomeIcon icon={faChevronRight} size="xs" />
                        </button>
                        <div
                          id="items-per-page-wrapper"
                          ref={itemsPerPageDropdownRef}
                          style={{ position: "relative", minWidth: "120px", zIndex: 100 }}
                        >
                          <div className="campaign-select-wrapper">
                            <Input
                              readOnly
                              value={`${itemsPerPage} per page`}
                              className="campaign-select-input"
                              style={{
                                height: "38px",
                                minHeight: "38px",
                                borderRadius: "13px",
                                padding: "10px 34px 10px 12px",
                                maxWidth: "120px"
                              }}
                              onClick={() =>
                                setOpenItemsPerPageDropdown(!openItemsPerPageDropdown)
                              }
                              tabIndex={0}
                            />
                            <FaCaretDown
                              className={`custom-select-icon campaign-select-icon ${openItemsPerPageDropdown ? "open" : ""
                                }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {openItemsPerPageDropdown &&
                      typeof document !== "undefined" &&
                      createPortal(
                        <div
                          ref={portalDropdownRef}
                          className="custom-dropdown-menu biddeript-b"
                          style={{
                            position: "absolute",
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            zIndex: 9999,
                            minWidth: "120px",
                            pointerEvents: "auto",
                            maxWidth: "120px",
                          }}
                        >
                          {[10, 20, 50, 100].map((value) => {
                            const isSelected = itemsPerPage === value;
                            return (
                              <div
                                key={value}
                                onClick={() => {
                                  handleItemsPerPageChange(value);
                                  setOpenItemsPerPageDropdown(false);
                                }}
                                className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                  }`}
                                style={{ height: "40px", cursor: "pointer", pointerEvents: "auto" }}
                              >
                                <span className="tick-icon">
                                  {isSelected && "✓"}
                                </span>
                                <span>{value} per page</span>
                              </div>
                            );
                          })}
                        </div>,
                        document.body,
                      )}
                  </div>
                  <div className="cd-add-campaign-wrapper">
                    {canCreateUser && (<button
                      type="button"
                      ref={addCampaignButtonRef}
                      onClick={() => {
                        if (showAddMenu) {
                          setShowAddMenu(false);
                          return;
                        }

                        updateAddMenuPosition();
                        setShowAddMenu(true);
                      }}
                      className="cd-btn cd-btn-primary"
                    >
                      <FontAwesomeIcon icon={faPlus} size="xs" /> Add Campaign
                    </button>)}
                    {showAddMenu &&
                      typeof document !== "undefined" &&
                      createPortal(
                        <div
                          ref={addCampaignMenuRef}
                          className="cd-add-campaign-menu cd-add-campaign-menu-portal"
                          style={{
                            "--cd-add-menu-top": `${addMenuPosition.top}px`,
                            "--cd-add-menu-left": `${addMenuPosition.left}px`,
                          }}
                        >
                          <div
                            className="cd-menu-item"
                            onClick={() => {
                              setShowAddMenu(false);
                              navigate("/admin/campcreate", { state: { campaignType: "Desktop (WEB)" } });
                            }}
                          >
                            Desktop (WEB)
                          </div>
                          <div
                            className="cd-menu-item"
                            onClick={() => {
                              setShowAddMenu(false);
                              navigate("/admin/campcreate", { state: { campaignType: "Mobile (APP)" } });
                            }}
                          >
                            Mobile (APP)
                          </div>
                          <div
                            className="cd-menu-item"
                            onClick={() => {
                              setShowAddMenu(false);
                              navigate("/admin/campcreate", { state: { campaignType: "Advanced Campaign" } });
                            }}
                          >
                            Advanced Campaign
                          </div>
                        </div>,
                        document.body,
                      )}
                  </div>
                </div>
              </div>
            </div>

            <DataTable
              data={pagedCampaigns}
              onSelectCampaign={handleSelectCampaign}
              viewBy={viewBy}
              sortColumn={tableSortColumn}
              sortDirection={tableSortDirection}
              onSort={handleTableSort}
              onEditCampaign={handleEditCampaign}
              onDeleteCampaign={handleDeleteCampaign}
              onStatusChange={handleStatusChange}
              canEditUser={canEditUser}
              canApproveUser={canApproveUser}
            />
          </div>

          <Popup
            isOpen={showPopup}
            title={`Update Campaign Status`}
            status={pendingStatus}
            isLoading={popupLoading}
            setpayload={setstatusdata}
            show={!pendingRow || shouldShowPlatformFeeField(pendingRow)}
            onConfirm={async (data) => {
              if (pendingRow) {
                try {
                  const existingPlatformFee = pendingRow.platformFee || pendingRow.platform_fee || pendingRow.groupPercentage || 0;
                  const platformFeeToSend = data.platform_fee !== "" ? data.platform_fee : existingPlatformFee;
                  const updatedData = { ...data, platform_fee: platformFeeToSend };
                  const updateResult = await updateCampaignStatus(pendingRow, data.status, updatedData);
                  setShowPopup(false);
                  setPendingStatus(null);
                  setPendingRow(null);
                  setstatusdata({});
                  if (updateResult && updateResult.insufficientFund) {
                    await Swal.fire({
                      html: `
                        <div class="campaign-swal-card">
                          <div class="campaign-swal-icon" aria-hidden="true" style="color: #eab308; background: linear-gradient(180deg, #fef9c3 0%, #fef08a 100%); box-shadow: inset 0 0 0 1px rgba(234, 179, 8, 0.14);">
                            <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px;">
                              <path
                                d="M12 9v4"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.4"
                                stroke-linecap="round"
                              />
                              <circle cx="12" cy="17" r="1.25" fill="currentColor" />
                              <path
                                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              />
                            </svg>
                          </div>
                          <div class="campaign-swal-title">Alert</div>
                          <div class="campaign-swal-message">The selected advertiser's campaign budget is insufficient to run. Please update the advertiser's fund.</div>
                        </div>
                      `,
                      showConfirmButton: true,
                      confirmButtonText: "OK",
                      width: 500,
                      padding: 0,
                      background: "#ffffff",
                      allowOutsideClick: false,
                      buttonsStyling: false,
                      customClass: {
                        popup: "campaign-swal-popup",
                        htmlContainer: "campaign-swal-body",
                        actions: "campaign-swal-actions",
                        confirmButton: "campaign-swal-confirm",
                      },
                    });
                  } else {
                    Swal.fire({
                      html: `
                        <div class="campaign-swal-card">
                          <div class="campaign-swal-icon" aria-hidden="true" style="color: #22c55e; background: linear-gradient(180deg, #f0fdf4 0%, #bbf7d0 100%); box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.14);">
                            <svg viewBox="0 0 24 24" role="presentation" focusable="false" style="width: 34px; height: 34px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round;">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div class="campaign-swal-title">Success!</div>
                          <div class="campaign-swal-message">Status updated successfully.</div>
                        </div>
                      `,
                      timer: 2000,
                      showConfirmButton: false,
                      width: 500,
                      padding: 0,
                      background: "#ffffff",
                      customClass: {
                        popup: "campaign-swal-popup",
                        htmlContainer: "campaign-swal-body"
                      }
                    });
                  }
                } catch (err) {
                  Swal.fire({
                    title: "Error!",
                    text: `Error updating status: ${err.message}`,
                    icon: "error",
                    confirmButtonColor: "#d33",
                  });
                }
              }
            }}
            onCancel={() => {
              setShowPopup(false);
              setPendingStatus(null);
              setPendingRow(null);
              setstatusdata({});
            }}
          />
        </div>)}
      {!canViewUser && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Manage Campaign.
        </div>
      )}
    </>
  );


}
