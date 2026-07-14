import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSync, faDownload, faFilter, faColumns, faChevronRight, faChevronDown, faTimes, faPlus, faSearch, faCheck, faList } from "@fortawesome/free-solid-svg-icons";
import { getDashboardOverview } from "../api/Api.jsx";
import CustomizeColumnsModal from "../customizationcolumns/CustomizeColumnsModal.jsx";
import DataTable from "react-data-table-component";
import { Card, CardBody } from "reactstrap";
import { FaChevronRight as FaChevronRightIcon, FaChevronDown as FaChevronDownIcon } from "react-icons/fa";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../../utils/permissionHelper";

const toIsoDate = (date) => {
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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

const isSameDateRange = (firstRange, secondRange) => (
  isSameDay(firstRange?.startDate, secondRange?.startDate) &&
  isSameDay(firstRange?.endDate, secondRange?.endDate)
);

// --- Tree Builder Function ---
const buildTree = (data, groupKeys, currentLevel = 0) => {
  if (groupKeys.length === 0) {
    return data; // Return flat data if no groupings
  }
  if (currentLevel >= groupKeys.length) {
    return []; // No more groups to build
  }

  const key = groupKeys[currentLevel];
  const groups = {};

  data.forEach(row => {
    const groupVal = row[key] || "Unknown";
    if (!groups[groupVal]) groups[groupVal] = [];
    groups[groupVal].push(row);
  });

  return Object.keys(groups).map(groupVal => {
    const childrenData = groups[groupVal];
    const isLastGroup = currentLevel === groupKeys.length - 1;
    const children = isLastGroup ? [] : buildTree(childrenData, groupKeys, currentLevel + 1);

    // Aggregate metrics
    const aggregated = {
      isGroup: true,
      groupKey: key,
      groupValue: groupVal,
      level: currentLevel,
      children,
      impressions: 0, clicks: 0, installs: 0, events: 0, total_conversions: 0, revenue: 0, total_payout: 0, payable_payout: 0, profit: 0, payable_conversion: 0, sampled_events: 0
    };

    childrenData.forEach(row => {
      aggregated.impressions += row.impressions || 0;
      aggregated.clicks += row.clicks || 0;
      aggregated.installs += row.installs || 0;
      aggregated.events += row.events || 0;
      aggregated.total_conversions += row.total_conversions || 0;
      aggregated.revenue += row.revenue || 0;
      aggregated.total_payout += row.total_payout || 0;
      aggregated.payable_payout += row.payable_payout || 0;
      aggregated.profit += row.profit || 0;
      aggregated.payable_conversion += row.payable_conversion || 0;
      aggregated.sampled_events += row.sampled_events || 0;
      // Not aggregating non-numeric fields like ID or advertiser name
    });

    return aggregated;
  });
};

export default function CampaignDailyInsights() {
  const [canViewCampaignReport, setCanViewCampaignReport] = useState(false);
  const [canCreateCampaignReport, setCanCreateCampaignReport] = useState(false);
  const [canEditCampaignReport, setCanEditCampaignReport] = useState(false);
  const [canDeleteCampaignReport, setCanDeleteCampaignReport] = useState(false);
  const [canUpdateCampaignReport, setCanUpdateCampaignReport] = useState(false);

  useEffect(() => {
    const hasCreatePermission = canCreate("Campaign Report");
    const hasViewPermission = canView("Campaign Report");
    const hasEditPermission = canEdit("Campaign Report");
    const hasDeletePermission = canDelete("Campaign Report");
    const hasUpdatePermission = canUpdate("Campaign Report");
    setCanCreateCampaignReport(hasCreatePermission);
    setCanViewCampaignReport(hasViewPermission);
    setCanEditCampaignReport(hasEditPermission);
    setCanDeleteCampaignReport(hasDeletePermission);
    setCanUpdateCampaignReport(hasUpdatePermission);
  }, []);

  const [startDate, setStartDate] = useState(getCurrentWeekRange().startDate);
  const [endDate, setEndDate] = useState(getCurrentWeekRange().endDate);

  const dateRangePopupRef = useRef(null);
  const tableDateRangeRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: startDate,
    endDate: endDate,
  });

  const getPresetRange = useCallback((preset) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

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
        const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
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

  const handlePresetSelect = useCallback((preset) => {
    const range = getPresetRange(preset);
    setDraftDateRange(range);
  }, [getPresetRange]);

  const formatPickerValue = useCallback((date) => {
    if (!date) return "-- / -- / ----";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  }, []);

  const handleDateRangeClear = useCallback(() => {
    setDraftDateRange({ startDate: null, endDate: null });
  }, []);

  const handleDateRangeApply = useCallback(() => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) {
      return;
    }
    const start = draftDateRange.startDate <= draftDateRange.endDate ? draftDateRange.startDate : draftDateRange.endDate;
    const end = draftDateRange.startDate <= draftDateRange.endDate ? draftDateRange.endDate : draftDateRange.startDate;
    setStartDate(start);
    setEndDate(end);
    setShowDateRangePicker(false);
  }, [draftDateRange]);

  const openDateRangePicker = useCallback(() => {
    setDraftDateRange({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });
    setShowDateRangePicker(true);
  }, [startDate, endDate]);

  const dateDisplayOptions = useMemo(() => ({
    day: "numeric",
    month: "short",
    year: "numeric"
  }), []);
  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);

  const formatDateRangeLabel = useCallback((startObj, endObj) => {
    if (startObj && endObj) {
      if (isSameDateRange({ startDate: startObj, endDate: endObj }, currentWeekRange)) {
        return "Last 7 days";
      }
      return `${startObj.toLocaleDateString(undefined, dateDisplayOptions)} - ${endObj.toLocaleDateString(undefined, dateDisplayOptions)}`;
    }
    return "Date Range";
  }, [currentWeekRange, dateDisplayOptions]);

  const dateRangeLabel = useMemo(() => (
    formatDateRangeLabel(startDate, endDate)
  ), [startDate, endDate, formatDateRangeLabel]);

  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

    const CustomLoader = () => (
    <div className="cdi-custom-loader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const allAvailableGroups = [
    { id: "campaign", label: "Campaign" },
    { id: "geo", label: "Geo" },
    { id: "date", label: "Date" },
    // { id: "publisherid", label: "Publisher ID" },
    //   { id: "publishername", label: "Publisher Name" },

  ];
  const [groupBy, setGroupBy] = useState([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const groupMenuRef = useRef(null);

  // Tree and View state
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set(["root"])); // keys for expanded nodes
  const [viewMode, setViewMode] = useState("nested"); // "nested" or "flat"

  // Totals
  const [totals, setTotals] = useState({});

  // Columns state
  const defaultColumns = [
    { id: "impressions", label: "IMPRESSIONS", isVisible: true },
    { id: "clicks", label: "CLICKS", isVisible: true },
    { id: "installs", label: "INSTALLS", isVisible: true },
    { id: "events", label: "EVENTS", isVisible: true },
    { id: "total_conversions", label: "TOTAL CONVERSIONS", isVisible: false },
    { id: "revenue", label: "TOTAL REVENUE", isVisible: true },
    { id: "total_payout", label: "TOTAL PAYOUT", isVisible: true },
    { id: "payable_payout", label: "PAYABLE PAYOUT", isVisible: false },
    { id: "profit", label: "PROFIT", isVisible: true },
    { id: "payable_conversion", label: "PAYABLE CONVERSION", isVisible: false },
    { id: "sampled_events", label: "SAMPLED EVENTS", isVisible: false },
    { id: "advertiser_id", label: "ADVERTISER ID", isVisible: false },
    { id: "ctr", label: "CTR", isVisible: false },
    { id: "advertiser_name", label: "ADVERTISER NAME", isVisible: false },
  ];
  const [columns, setColumns] = useState(defaultColumns);
  const [isCustomizeColumnsOpen, setIsCustomizeColumnsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState("");
  const [isCampaignFilterDropdownOpen, setIsCampaignFilterDropdownOpen] = useState(false);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
  const campaignFilterRef = useRef(null);

  const fetchDashboardData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const payload = {
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
        channel: "all",
        campaign: "all"
      };
      const res = await getDashboardOverview(payload);
      const data = res.data || [];

      const flatData = [];
      data.forEach(mainObj => {
        if (mainObj.exchangeNameBased) {
          mainObj.exchangeNameBased.forEach(exchange => {
            if (exchange.campaignData) {
              exchange.campaignData.forEach(camp => {
                flatData.push({
                  id: camp.campaignId,
                  publisherName: exchange.exchangeName,
                  campaign: camp.campaignName,
                  date: camp.date || exchange.date || mainObj.date || "Unknown",
                  geo: camp.geo || exchange.geo || mainObj.geo || "Unknown",
                  publisherId: camp.publisherId || exchange.publisherId || "Unknown",
                  impressions: camp.totalImpressions || 0,
                  clicks: camp.totalClicks || 0,
                  installs: camp.totalConversion || 0,
                  events: 0,
                  total_conversions: camp.totalConversion || 0,
                  revenue: camp.totalSpend || 0,
                  total_payout: camp.totalSpend || 0,
                  payable_payout: 0,
                  profit: 0,
                  payable_conversion: 0,
                  sampled_events: 0,
                  advertiser_id: "N/A",
                  ctr: camp.totalCtr || 0,
                  advertiser_name: "N/A"
                });
              });
            }
          });
        }
      });

      setRawData(flatData);
    } catch (err) {
      console.error("Error fetching campaign daily insights", err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const filteredData = selectedCampaignFilter
      ? rawData.filter(r => r.id === selectedCampaignFilter)
      : rawData;

    const tree = (viewMode === "flat" || groupBy.length === 0) ? filteredData : buildTree(filteredData, groupBy);
    setTreeData(tree);

    const t = {
      impressions: 0, clicks: 0, installs: 0, events: 0, total_conversions: 0,
      revenue: 0, total_payout: 0, payable_payout: 0, profit: 0,
      payable_conversion: 0, sampled_events: 0
    };
    filteredData.forEach(row => {
      t.impressions += row.impressions || 0;
      t.clicks += row.clicks || 0;
      t.installs += row.installs || 0;
      t.events += row.events || 0;
      t.total_conversions += row.total_conversions || 0;
      t.revenue += row.revenue || 0;
      t.total_payout += row.total_payout || 0;
      t.payable_payout += row.payable_payout || 0;
      t.profit += row.profit || 0;
      t.payable_conversion += row.payable_conversion || 0;
      t.sampled_events += row.sampled_events || 0;
    });
    setTotals(t);
  }, [rawData, groupBy, selectedCampaignFilter, viewMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target)) {
        setIsGroupMenuOpen(false);
      }
      if (campaignFilterRef.current && !campaignFilterRef.current.contains(event.target)) {
        setIsCampaignFilterDropdownOpen(false);
      }
      if (
        dateRangePopupRef.current &&
        !dateRangePopupRef.current.contains(event.target) &&
        tableDateRangeRef.current &&
        !tableDateRangeRef.current.contains(event.target)
      ) {
        setShowDateRangePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportCsv = () => {
    const visibleCols = columns.filter(c => c.isVisible);
    const headers = [
      "CAMPAIGN NAME",
      ...visibleCols.map(c => c.label)
    ];

    const csvRows = [];
    csvRows.push(headers.join(","));

    const addRows = (nodes, parentId = "") => {
      nodes.forEach((node, index) => {
        const isFlat = !node.isGroup;
        const firstCol = isFlat ? `${node.campaign}` : node.groupValue;

        const rowData = [
          `"${firstCol.replace(/"/g, '""')}"`,
          ...visibleCols.map(col => {
            let val = node[col.id];
            if (val === undefined) val = 0;
            const formattedVal = ['revenue', 'total_payout', 'profit', 'payable_payout'].includes(col.id)
              ? formatCurr(val)
              : val;
            return `"${String(formattedVal).replace(/"/g, '""')}"`;
          })
        ];
        csvRows.push(rowData.join(","));

        if (node.children && node.children.length > 0) {
          addRows(node.children, `${parentId}-${index}`);
        }
      });
    };

    addRows(treeData);

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Campaign_Daily_Insights_${toIsoDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const toggleGroupSelection = (id) => {
    setGroupBy(prev => {
      if (prev.includes(id)) {
        return prev.filter(g => g !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const formatCurr = (val) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatNum = (val) => Number(val).toLocaleString('en-US');

  const uniqueCampaigns = Array.from(new Set(rawData.map(r => r.id)))
    .map(id => {
      const row = rawData.find(r => r.id === id);
      return {
        id,
        name: row.campaign
      };
    });

  const visibleColumns = columns.filter(c => c.isVisible);

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#fff",
        minWidth: "1000px",
      },
    },
    progress: {
      style: {
        position: "sticky",
        left: 0,
        width: "100%",
        height: "200px",
      },
    },
    headRow: {
      style: {
        minHeight: "56px",
        backgroundColor: "#eef4fa",
        borderBottom: "1px solid #dfe7f1",
      },
    },
    headCells: {
      style: {
        color: "#64748b",
        fontSize: "12px",
        fontWeight: 800,
        textTransform: "uppercase",
        paddingLeft: "12px",
        paddingRight: "12px",
        borderRight: "1px solid #e6ebf2",
      },
    },
    rows: {
      style: {
        minHeight: "56px",
        borderBottom: "1px solid #eef2f7",
      },
    },
    cells: {
      style: {
        paddingLeft: "14px",
        paddingRight: "14px",
        paddingTop: "10px",
        paddingBottom: "10px",
        borderRight: "1px solid #f1f5f9",
        whiteSpace: "nowrap",
      },
    },
  };

  const flattenTree = (nodes, parentId = "") => {
    let flatData = [];
    nodes.forEach((node, index) => {
      const isFlat = !node.isGroup;
      const nodeId = `${parentId}-${index}-${isFlat ? node.id : node.groupValue}`;
      const isExpanded = expandedNodes.has(nodeId);
      const hasChildren = node.children && node.children.length > 0;

      flatData.push({
        ...node,
        _nodeId: nodeId,
        _isExpanded: isExpanded,
        _hasChildren: hasChildren,
        _isFlat: isFlat,
        _level: node.level || 0,
      });

      if (isExpanded && hasChildren) {
        flatData = flatData.concat(flattenTree(node.children, nodeId));
      }
    });
    return flatData;
  };

  const flatTreeData = flattenTree(treeData);
  const dataTableData = [
    {
      _isTotal: true,
      _level: 0,
      ...totals
    },
    ...flatTreeData
  ];

  const dataTableColumns = useMemo(() => [
    {
      name: "CAMPAIGN NAME",
      width: "35%",
      cell: (row) => {
        if (row._isTotal) {
          return <div className="cdi-totals-row">Totals</div>;
        }
        return (
          <div className={`cdi-campaign-name-cell cdi-campaign-name-cell--level-${Math.min(row._level || 0, 8)}`}>
            {row._hasChildren ? (
              <span
                className={`cdi-expand-icon ${row._isExpanded ? 'expanded' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleNode(row._nodeId); }}
              >
                <FontAwesomeIcon icon={row._isExpanded ? faChevronDown : faChevronRight} />
              </span>
            ) : (
              viewMode === "nested" && <span className="cdi-campaign-name-spacer"></span>
            )}
            <span className="cdi-group-label">
              {row._isFlat ? `${row.campaign}` : row.groupValue}
            </span>
          </div>
        );
      }
    },
    ...visibleColumns.map(col => ({
      name: col.label,
      selector: row => row[col.id],
      cell: row => {
        let val = row[col.id] || 0;
        if (col.id === 'advertiser_id') return <span className={`cdi-formatted-value ${row._isTotal ? 'is-total' : ''}`}>{val}</span>;
        const formattedVal = ['revenue', 'total_payout', 'profit', 'payable_payout'].includes(col.id)
          ? formatCurr(val)
          : formatNum(val);
        return <span className={`cdi-formatted-value ${row._isTotal ? 'is-total' : ''}`}>{formattedVal}</span>;
      }
    }))
  ], [viewMode, visibleColumns, expandedNodes]);

  const filteredAvailableGroups = allAvailableGroups.filter(g => g.label.toLowerCase().includes(groupSearch.toLowerCase()));

  return (
    <div className="campaign-daily-container">
      {canViewCampaignReport ? (
        <>
          <div className="campaign-daily-header">
            <div>
              <div className="campaign-daily-breadcrumb">
                <FontAwesomeIcon icon={faCalendarAlt} className="cdi-breadcrumb-icon" /> REPORTS / PERFORMANCE
              </div>
              <div className="campaign-daily-title">
                <h2>Campaign Daily</h2>
                <span>Insights</span>
              </div>
            </div>

            <div className="campaign-daily-actions">
              <div className="cdi-date-range-wrapper" ref={tableDateRangeRef}>
                <button
                  type="button"
                  className="cdi-date-picker"
                  onClick={openDateRangePicker}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>{dateRangeLabel}</span>
                </button>
                {showDateRangePicker && (
                  <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top cdi-date-range-popup" ref={dateRangePopupRef}>
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
                          <div className={`cd-date-range-field-value ${!draftDateRange.startDate ? "is-empty" : ""}`}>
                            {formatPickerValue(draftDateRange.startDate)}
                          </div>
                        </div>
                        <div className="cd-date-range-field">
                          <span className="cd-date-range-field-label">To</span>
                          <div className={`cd-date-range-field-value ${!draftDateRange.endDate ? "is-empty" : ""}`}>
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
              </div>

              <button className="cdi-icon-btn" onClick={fetchDashboardData}>
                <FontAwesomeIcon icon={faSync} className={isLoading ? "fa-spin" : ""} />
              </button>

              <button className="cdi-export-btn" onClick={handleExportCsv}>
                <FontAwesomeIcon icon={faDownload} /> EXPORT CSV
              </button>
            </div>
          </div>

          <Card className="mb-3 cdi-card">
            <CardBody className="py-3 cdi-card-body">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <button className={`cdi-control-btn ${isFilterOpen ? 'active-filter' : ''}`} onClick={() => setIsFilterOpen(!isFilterOpen)}>
                    <FontAwesomeIcon icon={faFilter} /> Filters
                  </button>
                  <button className="cdi-control-btn" onClick={() => setIsCustomizeColumnsOpen(true)}>
                    <FontAwesomeIcon icon={faColumns} /> Columns
                  </button>

                  <div className="cdi-view-tooltip-container">
                    <div className="cdi-view-tooltip">{viewMode === 'flat' ? 'Flat View' : 'Nested View'}</div>
                    <div className="cdi-view-toggle">
                      <button
                        className={`cdi-view-btn ${viewMode === 'flat' ? 'active' : ''}`}
                        onClick={() => setViewMode('flat')}
                      >
                        <FontAwesomeIcon icon={faList} />
                      </button>
                      <button
                        className={`cdi-view-btn ${viewMode === 'nested' ? 'active' : ''}`}
                        onClick={() => setViewMode('nested')}
                      >
                        <FontAwesomeIcon icon={faColumns} />
                      </button>
                    </div>
                  </div>

                  <div className="cdi-toolbar-separator"></div>

                  <div className="cdi-group-by-label">GROUP BY</div>

                  <div className="cdi-group-tags">
                    {groupBy.map((gId, idx) => {
                      const groupLabel = allAvailableGroups.find(g => g.id === gId)?.label;
                      return (
                        <React.Fragment key={gId}>
                          <div className="cdi-group-tag">
                            {groupLabel}
                            <FontAwesomeIcon
                              icon={faTimes}
                              className="cdi-group-tag-remove"
                              onClick={() => toggleGroupSelection(gId)}
                            />
                          </div>
                          {idx < groupBy.length - 1 && (
                            <FontAwesomeIcon icon={faChevronRight} className="cdi-group-arrow" />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {groupBy.length > 0 && <FontAwesomeIcon icon={faChevronRight} className="cdi-group-arrow" />}

                    <div className="cdi-add-group-btn" onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)} ref={groupMenuRef}>
                      <FontAwesomeIcon icon={faPlus} />
                      {isGroupMenuOpen && (
                        <div className="cdi-dropdown-menu" onClick={e => e.stopPropagation()}>
                          <div className="cdi-dropdown-search">
                            <div className="cdi-search-input-wrap">
                              <FontAwesomeIcon icon={faSearch} className="cdi-search-input-icon" />
                              <input
                                type="text"
                                placeholder="Search grouping..."
                                value={groupSearch}
                                onChange={e => setGroupSearch(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          {filteredAvailableGroups.map(g => {
                            const isSelected = groupBy.includes(g.id);
                            return (
                              <div key={g.id} className="cdi-dropdown-item" onClick={() => toggleGroupSelection(g.id)}>
                                <div className={`cdi-checkbox ${isSelected ? 'checked' : ''}`}>
                                  {isSelected && <FontAwesomeIcon icon={faCheck} className="cdi-check-icon" />}
                                </div>
                                {g.label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="cdi-controls-right">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="cd-pagination-summary cdi-pagination-summary">
                      {dataTableData.length - 1 > 0
                        ? `${dataTableData.length - 1} entries`
                        : "0 entries"}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {isFilterOpen && (
            <div className="cdi-filter-panel-wrapper">
              <div className="cdi-campaign-dropdown-wrapper" ref={campaignFilterRef}>
                <div className="cdi-campaign-input-box" onClick={() => setIsCampaignFilterDropdownOpen(!isCampaignFilterDropdownOpen)}>
                  <FontAwesomeIcon icon={faSearch} className="cdi-search-icon" />
                  <input
                    type="text"
                    placeholder="Search campaign..."
                    value={campaignSearchTerm}
                    onChange={(e) => {
                      setCampaignSearchTerm(e.target.value);
                      setIsCampaignFilterDropdownOpen(true);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <FontAwesomeIcon icon={isCampaignFilterDropdownOpen ? faChevronDown : faChevronRight} className="cdi-chevron-icon" />
                </div>
                {isCampaignFilterDropdownOpen && (
                  <div className="cdi-campaign-dropdown-menu">
                    <div className="cdi-campaign-item all-campaigns" onClick={() => { setSelectedCampaignFilter(""); setCampaignSearchTerm(""); setIsCampaignFilterDropdownOpen(false); }}>
                      All Campaigns
                    </div>
                    {uniqueCampaigns.filter(c => c.name.toLowerCase().includes(campaignSearchTerm.toLowerCase())).map(c => (
                      <div key={c.id} className="cdi-campaign-item" onClick={() => { setSelectedCampaignFilter(c.id); setCampaignSearchTerm(c.name); setIsCampaignFilterDropdownOpen(false); }}>
                        <div className="cdi-campaign-name">{c.name}</div>
                        <div className="cdi-campaign-sub">ID: {c.id} • ACTIVE</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="cdi-filter-close-btn" onClick={() => { setIsFilterOpen(false); setSelectedCampaignFilter(""); setCampaignSearchTerm(""); }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          )}

          <div className={`cdi-table-wrapper ${isLoading ? 'is-loading' : ''}`}>
            {isLoading && (
              <div className="cdi-loading-overlay">
                <div className="customloader cdi-inline-loader">
                  <div className="loader" role="status"></div>
                  <span className="ms-2 fw-bold">Loading...</span>
                </div>
              </div>
            )}
            <div className={`cdi-table-shell ${isLoading ? 'is-loading' : 'not-loading'}`}>
              <div className="cdi-table-inner">
                <DataTable
                  keyField="id"
                  className="data-table"
                  columns={dataTableColumns}
                  data={dataTableData}
                  customStyles={customStyles}
                  highlightOnHover
                  pointerOnHover
                  persistTableHead
                  fixedHeader
                  fixedHeaderScrollHeight="100%"
                  responsive={false}
                  // conditionalRowStyles={conditionalRowStyles}
                  noDataComponent={
                    isLoading ? (
                      <div className="cdi-no-data-placeholder" />
                    ) : (
                      <div className="py-5 text-center text-secondary">
                        No data available
                      </div>
                    )
                  }
                />
              </div>
            </div>
          </div>

          <CustomizeColumnsModal
            isOpen={isCustomizeColumnsOpen}
            onClose={() => setIsCustomizeColumnsOpen(false)}
            columns={columns}
            onSave={(newColumns) => setColumns(newColumns)}
          />
        </>
      ) : (
        <div className="alert alert-warning mt-3 cdi-access-denied-alert">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Campaign Report.
        </div>
      )}
    </div>
  );
}


