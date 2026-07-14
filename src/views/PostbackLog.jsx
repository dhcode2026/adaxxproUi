import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaChevronDown } from "react-icons/fa";
import DataTable from "react-data-table-component";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLocation } from "react-router-dom";
import { Card, CardBody, Col, Row } from "reactstrap";
import { useGlobalTabs } from "../context/TabContext";
import CustomizeColumnsModal from "./customizationcolumns/CustomizeColumnsModal";
import { getPostBackConversion } from "./api/Api";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";

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

const formatPickerValue = (date) => {
  if (!date) return "-- / -- / ----";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day} / ${month} / ${year}`;
};

const formatDateForApi = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getPresetRange = (preset) => {
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

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
};

const formatDateRangeLabel = (startDate, endDate, currentWeekRange) => {
  if (startDate && endDate) {
    if (isSameDateRange({ startDate, endDate }, currentWeekRange)) {
      return "Last 7 days";
    }
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
  return "Date Range";
};

const POSTBACK_COLUMN_DEFINITIONS = {
  timestamp: {
    name: "Timestamp",
    selector: (row) => row.timestamp || row.clickTime,
    cell: (row) => {
      const ts = row.clickTime || row.timestamp || "";
      const isIso = ts.includes("T");
      const datePart = isIso ? ts.split("T")[0] : ts.split(" ")[0];
      const timePart = isIso ? ts.split("T")[1]?.split("+")[0]?.split(".")[0] : ts.split(" ")[1];
      return (
        <div className="reports-postbacklog-timestamp">
          <div className="reports-postbacklog-timestamp-date">
            {datePart}
          </div>
          <div className="reports-postbacklog-timestamp-time">
            {timePart}
          </div>
        </div>
      );
    },
    sortable: false,
    width: "120px",
  },
  status: {
    name: "Status",
    selector: (row) => row.status,
    cell: (row) => (
      <span className="reports-postbacklog-status">
        {row.status}
      </span>
    ),
    sortable: false,
    width: "120px",
  },
  campaignId: {
    name: "Campaign ID",
    selector: (row) => row.campaignId,
    sortable: false,
    width: "140px",
  },
  campaignName: {
    name: "Campaign Name",
    selector: (row) => row.campaignName,
    cell: (row) => (
      <span
        title={row.campaignName}
        className="reports-postbacklog-campaign-name"
      >
        {row.campaignName}
      </span>
    ),
    sortable: false,
    width: "240px",
  },
  event: {
    name: "Event",
    selector: (row) => row.eventType || row.event || row.eventName || row.event_name,
    cell: (row) => (
      <span
        title={row.eventType || row.event || row.eventName || row.event_name}
        className="reports-postbacklog-event"
      >
        {row.eventType || row.event || row.eventName || row.event_name}
      </span>
    ),
    sortable: false,
    width: "260px",
  },
  postbackId: {
    name: "Postback ID",
    selector: (row) => row.postbackId,
    sortable: false,
    width: "160px",
  },
  clickId: {
    name: "Click ID",
    selector: (row) => row.clickId,
    sortable: false,
    width: "160px",
  },
  conversionId: {
    name: "Conv ID",
    selector: (row) => row.conversionId,
    sortable: false,
    width: "170px",
  },
  publisherName: {
    name: "Publisher Name",
    selector: (row) => row.publisherName || row.publisherId || row.exchangeName || "-",
    sortable: false,
    width: "180px",
  },
  publisherId: {
    name: "Publisher ID",
    selector: (row) => row.publisherId || "-",
    sortable: false,
    width: "120px",
  },
  organizationId: {
    name: "Organization ID",
    selector: (row) => row.organizationId,
    sortable: false,
    width: "140px",
  },
  attempts: {
    name: "Attempts",
    selector: (row) => row.attempts,
    sortable: false,
    width: "100px",
  },
  errorMessage: {
    name: "Error Message",
    selector: (row) => row.errorMessage,
    sortable: false,
    width: "180px",
  },
  targetUrl: {
    name: "Target URL",
    selector: (row) => row.targetUrl,
    sortable: false,
    width: "260px",
  },
};

const DEFAULT_POSTBACK_COLUMN_CONFIG = [
  { id: "timestamp", label: "Timestamp", isVisible: true },
  { id: "status", label: "Status", isVisible: true },
  { id: "campaignId", label: "Campaign ID", isVisible: true },
  { id: "campaignName", label: "Campaign Name", isVisible: true },
  { id: "event", label: "Event", isVisible: true },
  { id: "postbackId", label: "Postback ID", isVisible: false },
  { id: "clickId", label: "Click ID", isVisible: false },
  { id: "conversionId", label: "Conv ID", isVisible: false },
  { id: "publisherName", label: "Publisher Name", isVisible: false },
  { id: "publisherId", label: "Publisher ID", isVisible: false },
  { id: "organizationId", label: "Organization ID", isVisible: false },
  { id: "attempts", label: "Attempts", isVisible: false },
  { id: "errorMessage", label: "Error Message", isVisible: false },
  { id: "targetUrl", label: "Target URL", isVisible: false },
];

const INITIAL_POSTBACK_FILTERS = {
  clickId: "",
  postbackId: "",
  conversionId: "",
  event: "",
  campaignId: "",
  campaignName: "",
  publisherName: "",
};

const buildPostbackColumns = (columnConfig) =>
  columnConfig
    .filter((column) => column.isVisible)
    .map((column) => ({
      ...POSTBACK_COLUMN_DEFINITIONS[column.id],
      name: column.label,
    }));

const customStyles = {
  table: {
    style: {
      backgroundColor: "#fff",
      minWidth: "1050px",
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

const PostbackLog = () => {
  const location = useLocation();
  const { initializePageTab } = useGlobalTabs();
  const [canViewPostbackLog, setCanViewPostbackLog] = useState(false);
  const [canCreatePostbackLog, setCanCreatePostbackLog] = useState(false);
  const [canEditPostbackLog, setCanEditPostbackLog] = useState(false);
  const [canDeletePostbackLog, setCanDeletePostbackLog] = useState(false);
  const [canUpdatePostbackLog, setCanUpdatePostbackLog] = useState(false);

  useEffect(() => {
    const hasCreatePermission = canCreate("Postback Log");
    const hasViewPermission = canView("Postback Log");
    const hasEditPermission = canEdit("Postback Log");
    const hasDeletePermission = canDelete("Postback Log");
    const hasUpdatePermission = canUpdate("Postback Log");
    setCanCreatePostbackLog(hasCreatePermission);
    setCanViewPostbackLog(hasViewPermission);
    setCanEditPostbackLog(hasEditPermission);
    setCanDeletePostbackLog(hasDeletePermission);
    setCanUpdatePostbackLog(hasUpdatePermission);
  }, []);

  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const [draftDateRange, setDraftDateRange] = useState(currentWeekRange);
  const [appliedDateRange, setAppliedDateRange] = useState(currentWeekRange);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCustomizeColumnsModal, setShowCustomizeColumnsModal] = useState(false);
  const [draftFilters, setDraftFilters] = useState(INITIAL_POSTBACK_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_POSTBACK_FILTERS);
  const [columnConfig, setColumnConfig] = useState(
    DEFAULT_POSTBACK_COLUMN_CONFIG.map((column) => ({ ...column })),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [apiRows, setApiRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const tableDateRangeRef = useRef(null);
  const dateRangePopupRef = useRef(null);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

  useEffect(() => {
    initializePageTab("Raw Postback Logs", "fa fa-hand-pointer-o", location.pathname);
  }, [initializePageTab, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        const portalNode = perPagePortalRef.current;
        if (portalNode && portalNode.contains(event.target)) {
          return;
        }
        setIsPerPageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isPerPageOpen && perPageRef.current) {
      const updatePosition = () => {
        const rect = perPageRef.current.getBoundingClientRect();
        setPerPageDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [isPerPageOpen]);

  useEffect(() => {
    const fetchPostBackConversion = async () => {
      if (!appliedDateRange.startDate || !appliedDateRange.endDate) return;
      setIsLoading(true);
      try {
        const payload = {
          startDate: formatDateForApi(appliedDateRange.startDate),
          endDate: formatDateForApi(appliedDateRange.endDate),
          clickLog: false,
          conversionLog: false,
          postBackLog: true
        };
        const response = await getPostBackConversion(payload);
        if (response.data) {
          let dataToSet = [];
          if (Array.isArray(response.data)) {
            dataToSet = response.data;
          } else if (Array.isArray(response.data.data)) {
            dataToSet = response.data.data;
          }
          setApiRows(dataToSet);
        }
      } catch (error) {
        console.error("Error fetching postback logs", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostBackConversion();
  }, [appliedDateRange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const popupNode = dateRangePopupRef.current;
      const buttonNode = tableDateRangeRef.current;

      if (
        showDateRangePicker &&
        popupNode &&
        !popupNode.contains(event.target) &&
        buttonNode &&
        !buttonNode.contains(event.target)
      ) {
        setShowDateRangePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDateRangePicker]);

  const handleDraftFilterChange = (event) => {
    const { name, value } = event.target;
    setDraftFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    setShowFilterPanel(false);
  };

  const handleClearFilters = () => {
    setDraftFilters(INITIAL_POSTBACK_FILTERS);
    setAppliedFilters(INITIAL_POSTBACK_FILTERS);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    const refreshedRange = getCurrentWeekRange();
    const resetFilters = { ...INITIAL_POSTBACK_FILTERS };

    setDraftDateRange({ ...refreshedRange });
    setAppliedDateRange({ ...refreshedRange });
    setDraftFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setColumnConfig(DEFAULT_POSTBACK_COLUMN_CONFIG.map((column) => ({ ...column })));
    setShowFilterPanel(false);
    setShowDateRangePicker(false);
    setCurrentPage(1);
    setItemsPerPage(10);
  };

  const handleExportCsv = () => {
    const exportColumns = tableColumns;
    const csvRows = [
      exportColumns.map((column) => `"${String(column.name).replace(/"/g, '""')}"`).join(","),
      ...filteredRows.map((row) =>
        exportColumns
          .map((column) => {
            const rawValue = column.selector ? column.selector(row) : "";
            const normalizedValue = rawValue === null || rawValue === undefined ? "" : String(rawValue);
            return `"${normalizedValue.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `postback-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tableColumns = useMemo(
    () => buildPostbackColumns(columnConfig),
    [columnConfig],
  );

  const filteredRows = useMemo(() => {
    const normalizedFilters = Object.entries(appliedFilters).reduce(
      (acc, [key, value]) => {
        acc[key] = value.trim().toLowerCase();
        return acc;
      },
      {},
    );

    let rows = apiRows || [];

    if (appliedDateRange.startDate && appliedDateRange.endDate) {
      const rangeStart = startOfDay(appliedDateRange.startDate);
      const rangeEnd = endOfDay(appliedDateRange.endDate);

      rows = rows.filter((row) => {
        const rowDate = new Date(row.eventDate || row.clickTime || row.timestamp);
        return rowDate >= rangeStart && rowDate <= rangeEnd;
      });
    }

    return rows.filter((row) =>
      Object.entries(normalizedFilters).every(([key, value]) => {
        if (!value) return true;
        const rowValue = String(row[key] ?? "").toLowerCase();
        return rowValue.includes(value);
      }),
    );
  }, [appliedDateRange, appliedFilters, apiRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));

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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pagedRows = useMemo(
    () => filteredRows.slice(startIndex, endIndex),
    [filteredRows, startIndex, endIndex],
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const dateRangeLabel = useMemo(
    () =>
      formatDateRangeLabel(
        appliedDateRange.startDate,
        appliedDateRange.endDate,
        currentWeekRange,
      ),
    [
      appliedDateRange.endDate,
      appliedDateRange.startDate,
      currentWeekRange,
    ],
  );

  const handlePresetSelect = (preset) => {
    setDraftDateRange(getPresetRange(preset));
  };

  const handleDateRangeApply = () => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) return;

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
    setCurrentPage(1);
  };

  const handleDateRangeClear = () => {
    setDraftDateRange({ startDate: null, endDate: null });
    setAppliedDateRange({ startDate: null, endDate: null });
    setShowDateRangePicker(false);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  if (!canViewPostbackLog) {
    return (
      <div className="content1">
        <div className="content-wrapper">
          <Row>
            <Col xs="12">
              <div className="alert alert-warning mt-3 reports-postbacklog-access-denied">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <strong>Access Denied:</strong> You do not have permission to view the Postback Log.
              </div>
            </Col>
          </Row>
        </div>
      </div>
    );
  }

  return (
    <div className="content1">
      <div className="content-wrapper">
        <Row>
          <Col xs="12">
            <div className="mb-2 reports-postbacklog-page-subtitle">
              LOGS / REPORTS
            </div>
            <div className="d-flex align-items-end flex-wrap gap-2 mb-3">
              <h1 className="mb-0 reports-postbacklog-page-title">
                <span className="reports-postbacklog-page-title-highlight">Raw Postback</span>{" "}
                <span className="reports-postbacklog-page-title-muted">Logs</span>
              </h1>
            </div>

            <Card className="mb-3 reports-card reports-postbacklog-card">
              <CardBody className="py-3 reports-card-body">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div
                      className="cd-date-range-wrapper reports-postbacklog-date-range-wrapper"
                      ref={tableDateRangeRef}
                    >
                      <button
                        type="button"
                        className="cd-date-range-button"
                        onClick={() => {
                          setDraftDateRange(appliedDateRange);
                          setShowDateRangePicker(true);
                        }}
                      >
                        <i className="fa fa-calendar" />
                        <span>{dateRangeLabel}</span>
                      </button>

                      {showDateRangePicker && (
                        <div
                          ref={dateRangePopupRef}
                          className="cd-date-range-popup cd-date-range-popup-floating"

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
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowFilterPanel((value) => !value);
                        setShowDateRangePicker(false);
                      }}
                      className={`reports-postbacklog-toolbar-btn ${showFilterPanel ? "is-active" : ""}`}
                    >
                      <i className="fa fa-filter" />
                      FILTERS
                      <i className={`fa ${showFilterPanel ? "fa-chevron-up" : "fa-chevron-down"}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCustomizeColumnsModal(true)}
                      title="Customize columns"
                      className="reports-postbacklog-icon-btn"
                    >
                      <i className="fa fa-th-large" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRefresh}
                      title="Refresh"
                      className="reports-postbacklog-icon-btn"
                    >
                      <i className="fa fa-refresh" />
                    </button>
                  </div>

                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="reports-pagination-summary reports-postbacklog-pagination-summary">
                      {filteredRows.length ? `${currentPage} of ${totalPages}` : "0 of 0"}
                    </div>
                    <div className="reports-pagination-toolbar">
                      {totalPages > 1 && (
                        <div className="reports-pagination-controls">
                          <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="cd-pagination-nav-btn"
                            type="button"
                          >
                            <i className="fa fa-chevron-left" />
                          </button>
                          <button className="cd-pagination-page-btn is-active" type="button">
                            {currentPage}
                          </button>
                          <span className="reports-gutter">of</span>
                          <button className="cd-pagination-page-btn" type="button">
                            {totalPages}
                          </button>
                          <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="cd-pagination-nav-btn"
                            type="button"
                          >
                            <i className="fa fa-chevron-right" />
                          </button>
                          <div className="reports-items-per-page-wrapper" ref={perPageRef}>
                            <div className="campaign-select-wrapper">
                              <input
                                readOnly
                                value={`${itemsPerPage} per page`}
                                className="campaign-select-input reports-select-input"
                                onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                              />
                              <FaChevronDown
                                className={`reports-select-chevron ${isPerPageOpen ? "is-open" : ""}`}
                              />
                            </div>
                            {isPerPageOpen &&
                              typeof document !== 'undefined' &&
                              createPortal(
                                <div
                                  ref={perPagePortalRef}
                                  className="reports-per-page-menu"
                                  style={{
                                    '--per-page-top': `${perPageDropdownPosition.top}px`,
                                    '--per-page-left': `${perPageDropdownPosition.left}px`,
                                  }}
                                >
                                  {[10, 20, 50, 100].map((value) => {
                                    const isSelected = itemsPerPage === value;
                                    const isHovered = hoveredPerPage === value;

                                    return (
                                      <div
                                        key={value}
                                        onClick={() => {
                                          handleItemsPerPageChange(value);
                                          setIsPerPageOpen(false);
                                        }}
                                        onMouseEnter={() => setHoveredPerPage(value)}
                                        onMouseLeave={() => setHoveredPerPage(null)}
                                        className={`reports-per-page-option reports-postbacklog-per-page-option ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
                                      >
                                        <span className={`reports-postbacklog-per-page-tick ${isSelected || isHovered ? 'is-active' : ''}`}>
                                          {isSelected && '✓'}
                                        </span>
                                        <span className={`reports-postbacklog-per-page-label ${isSelected || isHovered ? 'is-active' : ''}`}>
                                          {value} per page
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>,
                                document.body,
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="reports-export-btn reports-export-btn-danger reports-postbacklog-export-btn"
                    >
                      <i className="fa fa-download fa-report-icon" />
                      EXPORT CSV
                    </button>
                  </div>
                </div>
                {showFilterPanel && (
                  <div className="reports-filter-panel reports-postbacklog-filter-panel">
                    <div className="reports-postbacklog-filter-grid">

                      {[
                        { name: "clickId", placeholder: "Click ID..." },
                        { name: "postbackId", placeholder: "Postback ID..." },
                        { name: "conversionId", placeholder: "Conv ID..." },
                        { name: "event", placeholder: "Event Name..." },
                      ].map((field) => (
                        <input
                          key={field.name}
                          name={field.name}
                          value={draftFilters[field.name]}
                          onChange={handleDraftFilterChange}
                          placeholder={field.placeholder}
                          className="reports-filter-input reports-postbacklog-filter-input"
                        />
                      ))}
                    </div>

                    <div className="reports-postbacklog-filter-row">

                      <input
                        name="campaignId"
                        value={draftFilters.campaignId}
                        onChange={handleDraftFilterChange}
                        placeholder="Search campaign by ID..."
                        className="reports-filter-input reports-postbacklog-filter-input"
                      />
                      <input
                        name="campaignName"
                        value={draftFilters.campaignName}
                        onChange={handleDraftFilterChange}
                        placeholder="Search campaigns by name..."
                        className="reports-filter-input reports-postbacklog-filter-input"
                      />
                      <button
                        type="button"
                        onClick={handleApplyFilters}
                        className="reports-filter-submit-btn reports-postbacklog-apply-btn"
                      >
                        <i className="fa fa-search" />
                        APPLY
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        title="Clear filters"
                        className="reports-filter-clear-btn reports-postbacklog-clear-btn"
                      >
                        <i className="fa fa-times" />
                      </button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="reports-card reports-postbacklog-card">
              <CardBody className="p-0 reports-card-body reports-postbacklog-card-body">
                {isLoading && (
                  <div className="reports-loading-overlay reports-postbacklog-loading-overlay">
                    <div className="reports-custom-loader reports-postbacklog-inline-loader">
                      <div className="loader" role="status"></div>
                      <span className="ms-2 fw-bold">Loading...</span>
                    </div>
                  </div>
                )}
                <div className={`reports-table-shell reports-postbacklog-table-shell ${isLoading ? "is-loading" : "not-loading"}`}>
                  <div className="reports-postbacklog-table-inner">
                    <DataTable
                      columns={tableColumns}
                      data={isLoading ? [] : pagedRows}
                      customStyles={customStyles}
                      highlightOnHover
                      pointerOnHover
                      persistTableHead
                      fixedHeader
                      fixedHeaderScrollHeight="calc(100vh - 360px)"
                      responsive={false}
                      noDataComponent={
                        isLoading ? (
                          <div className="reports-empty-state" />
                        ) : (
                          <div className="py-5 text-center text-secondary reports-empty-state">
                            No data available
                          </div>
                        )
                      }
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
            <CustomizeColumnsModal
              isOpen={showCustomizeColumnsModal}
              onClose={() => setShowCustomizeColumnsModal(false)}
              columns={columnConfig}
              onSave={setColumnConfig}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PostbackLog;
