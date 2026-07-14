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

const RAW_CONVERSION_BASE_ROWS = [
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:58:33",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "6500ea30394e4a828fee34fe99acde45",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:58:28",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "b5f32231da314716a2576cea6e9d60bf",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:57:17",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "6d965bbaf1c4405a95f40a02454082ff",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:57:25",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "047dff9d836f46cda68bba3645a04349",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:56:14",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "9912dffee9974a04ac001939fb55bcad",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:56:11",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "e84c4b579ce44a089009ac89980f3735",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:55:31",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "1fa56cfe69d04f3bb65c1e8adacafc7d",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:54:58",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "27ed98dd6eba4ec39ac813bcebe84ff0",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:54:45",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "d00cc080c59846f0fb3bf2fda27c6c75",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:53:08",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "33bd0a14bc27405b98364505df3bb839",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
  {
    eventDate: "2026-06-09",
    timestamp: "2026-06-09 06:53:03",
    eventName: "af_reactivation_2Mplus",
    eventMappedName: "af_reactivation_2Mplus",
    conversionId: "3c70c3b83fdb434ea885e2565bd19296",
    campaignId: "75",
    revenue: "$0.00",
    geo: "IN",
    isSampled: false,
    status: "RECEIVED",
  },
];

const RAW_CONVERSION_ROWS = RAW_CONVERSION_BASE_ROWS.map((row, index) => {
  const suffix = String(index + 1).padStart(2, "0");
  const isPaytm = row.campaignId === "75";

  return {
    ...row,
    clickId: `click_${row.campaignId}_${suffix}`,
    advertiserName: isPaytm ? "Paytm" : "Jar",
    publisherName: isPaytm ? "Paytm" : "Jar",
  };
});

const CONVERSION_COLUMN_DEFINITIONS = {
  timestamp: {
    name: "Date",
    selector: (row) => row.timestamp,
    cell: (row) => {
      const ts = row.timestamp || "";
      const isIso = ts.includes("T");
      const datePart = isIso ? ts.split("T")[0] : ts.split(" ")[0];
      const timePart = isIso ? ts.split("T")[1]?.split("+")[0]?.split(".")[0] : ts.split(" ")[1];
      return (
        <div className="reports-conversionlog-timestamp">
          <div className="reports-conversionlog-timestamp-date">
            {datePart}
          </div>
          <div className="reports-conversionlog-timestamp-time">
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
      <span className="reports-conversionlog-status">
        {row.status}
      </span>
    ),
    sortable: false,
    width: "120px",
  },
  eventName: {
    name: "Event Name",
    selector: (row) => row.eventName || row.event_name,
    cell: (row) => (
      <div
        title={row.eventName || row.event_name}
        className="reports-conversionlog-event-name"
      >
        {row.eventName || row.event_name}
      </div>
    ),
    sortable: false,
    width: "220px",
  },
  eventMappedName: {
    name: "Event Mapped Name",
    selector: (row) => row.eventMappedName,
    cell: (row) => (
      <div
        title={row.eventMappedName}
        className="reports-conversionlog-event-mapped-name"
      >
        {row.eventMappedName}
      </div>
    ),
    sortable: false,
    width: "220px",
  },
  conversionId: {
    name: "Conversion ID",
    selector: (row) => row.conversionId,
    cell: (row) => (
      <span
        title={row.conversionId}
        className="reports-conversionlog-conversion-id"
      >
        {row.conversionId}
      </span>
    ),
    sortable: false,
    width: "280px",
  },
  campaignId: {
    name: "Campaign ID",
    selector: (row) => row.campaignId,
    sortable: false,
    width: "140px",
  },
  revenue: {
    name: "Revenue",
    selector: (row) => row.revenue || row.eventRevenu,
    cell: (row) => (
      <span className="reports-conversionlog-revenue">
        {row.revenue || row.eventRevenu}
      </span>
    ),
    sortable: false,
    width: "110px",
  },
  geo: {
    name: "Geo",
    selector: (row) => row.geo,
    cell: (row) => (
      <span className="reports-conversionlog-geo-badge">
        {row.geo}
      </span>
    ),
    sortable: false,
    width: "85px",
  },
  isSampled: {
    name: "Is Sampled",
    selector: (row) => row.isSampled,
    cell: (row) => (
      <span className="reports-conversionlog-is-sampled">
        {String(row.isSampled)}
      </span>
    ),
    sortable: false,
    width: "110px",
  },
  campaignName: {
    name: "Campaign Name",
    selector: (row) => row.campaignName,
    cell: (row) => (
      <span
        title={row.campaignName}
        className="reports-conversionlog-campaign-name"
      >
        {row.campaignName}
      </span>
    ),
    sortable: false,
    width: "220px",
  },
  clickId: {
    name: "Click ID",
    selector: (row) => row.clickId,
    cell: (row) => (
      <span
        title={row.clickId}
        className="reports-conversionlog-click-id"
      >
        {row.clickId}
      </span>
    ),
    sortable: false,
    width: "220px",
  },
  advertiserName: {
    name: "Advertiser Name",
    selector: (row) => row.advertiserName,
    sortable: false,
    width: "200px",
  },
  publisherName: {
    name: "Publisher Name",
    selector: (row) => row.publisherName || row.publisherId,
    sortable: false,
    width: "180px",
  },
};

const DEFAULT_CONVERSION_COLUMN_CONFIG = [
  { id: "timestamp", label: "Date", isVisible: true },
  { id: "status", label: "Status", isVisible: true },
  { id: "eventName", label: "Event Name", isVisible: true },
  { id: "eventMappedName", label: "Event Mapped Name", isVisible: true },
  { id: "conversionId", label: "Conversion ID", isVisible: true },
  { id: "campaignId", label: "Campaign ID", isVisible: true },
  { id: "revenue", label: "Revenue", isVisible: true },
  { id: "geo", label: "Geo", isVisible: true },
  { id: "isSampled", label: "Is Sampled", isVisible: true },
  { id: "campaignName", label: "Campaign Name", isVisible: false },
  { id: "clickId", label: "Click ID", isVisible: false },
  { id: "advertiserName", label: "Advertiser Name", isVisible: false },
  { id: "publisherName", label: "Publisher Name", isVisible: false },
];

const INITIAL_CONVERSION_FILTERS = {
  conversionId: "",
  clickId: "",
  eventName: "",
  eventMappedName: "",
  campaignName: "",
  advertiserName: "",
  publisherName: "",
  geo: "",
};

const buildConversionColumns = (columnConfig) =>
  columnConfig
    .filter((column) => column.isVisible)
    .map((column) => ({
      ...CONVERSION_COLUMN_DEFINITIONS[column.id],
      name: column.label,
    }));

const customStyles = {
  table: {
    style: {
      backgroundColor: "#fff",
      minWidth: "1500px",
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

const ConversionLog = () => {
  const location = useLocation();
  const { initializePageTab } = useGlobalTabs();
  const [canViewConversionLog, setCanViewConversionLog] = useState(false);
  const [canCreateConversionLog, setCanCreateConversionLog] = useState(false);
  const [canEditConversionLog, setCanEditConversionLog] = useState(false);
  const [canDeleteConversionLog, setCanDeleteConversionLog] = useState(false);
  const [canUpdateConversionLog, setCanUpdateConversionLog] = useState(false);

  useEffect(() => {
    const hasCreatePermission = canCreate("Conversion Log");
    const hasViewPermission = canView("Conversion Log");
    const hasEditPermission = canEdit("Conversion Log");
    const hasDeletePermission = canDelete("Conversion Log");
    const hasUpdatePermission = canUpdate("Conversion Log");
    setCanCreateConversionLog(hasCreatePermission);
    setCanViewConversionLog(hasViewPermission);
    setCanEditConversionLog(hasEditPermission);
    setCanDeleteConversionLog(hasDeletePermission);
    setCanUpdateConversionLog(hasUpdatePermission);
  }, []);

  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);
  const [draftDateRange, setDraftDateRange] = useState(currentWeekRange);
  const [appliedDateRange, setAppliedDateRange] = useState(currentWeekRange);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showCustomizeColumnsModal, setShowCustomizeColumnsModal] = useState(false);
  const [draftFilters, setDraftFilters] = useState(INITIAL_CONVERSION_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_CONVERSION_FILTERS);
  const [columnConfig, setColumnConfig] = useState(
    DEFAULT_CONVERSION_COLUMN_CONFIG.map((column) => ({ ...column })),
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
    initializePageTab("Raw Conversions Logs", "fa fa-hand-pointer-o", location.pathname);
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
          conversionLog: true,
          postBackLog: false
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
        console.error("Error fetching conversion logs", error);
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
    setShowFilterPanel(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setDraftFilters(INITIAL_CONVERSION_FILTERS);
    setAppliedFilters(INITIAL_CONVERSION_FILTERS);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    const refreshedRange = getCurrentWeekRange();
    const resetFilters = { ...INITIAL_CONVERSION_FILTERS };

    setDraftDateRange({ ...refreshedRange });
    setAppliedDateRange({ ...refreshedRange });
    setDraftFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setColumnConfig(DEFAULT_CONVERSION_COLUMN_CONFIG.map((column) => ({ ...column })));
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
    link.download = `conversion-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tableColumns = useMemo(
    () => buildConversionColumns(columnConfig),
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

    let rows = apiRows.length > 0 ? apiRows : RAW_CONVERSION_ROWS;

    if (!appliedDateRange.startDate || !appliedDateRange.endDate) {
      rows = apiRows.length > 0 ? apiRows : RAW_CONVERSION_ROWS;
    } else {
      const rangeStart = startOfDay(appliedDateRange.startDate);
      const rangeEnd = endOfDay(appliedDateRange.endDate);

      rows = rows.filter((row) => {
        const rowDate = new Date(row.eventDate || row.timestamp);
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

  if (!canViewConversionLog) {
    return (
      <div className="content1">
        <div className="content-wrapper">
          <Row>
            <Col xs="12">
              <div className="alert alert-warning mt-3 reports-conversionlog-access-denied">
                <i className="fa fa-exclamation-triangle me-2"></i>
                <strong>Access Denied:</strong> You do not have permission to view the Conversion Log.
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
            <div className="mb-2 reports-page-subtitle reports-conversionlog-page-subtitle">
              LOGS / REPORTS
            </div>
            <div className="d-flex align-items-end flex-wrap gap-2 mb-3">
              <h1 className="mb-0 reports-page-title reports-conversionlog-page-title">
                <span className="reports-page-title-main">Raw Conversions</span>{" "}
                <span className="reports-page-title-muted">Logs</span>
              </h1>
            </div>

            <Card className="mb-3 reports-card reports-conversionlog-card">
              <CardBody className="py-3 reports-card-body">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div
                      className="cd-date-range-wrapper reports-date-range-wrapper reports-conversionlog-date-range-wrapper"
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
                      className={`reports-filter-toggle reports-conversionlog-filter-toggle ${showFilterPanel ? "is-active" : ""}`}
                    >
                      <i className="fa fa-filter" />
                      FILTERS
                      <i className={`fa ${showFilterPanel ? "fa-chevron-up" : "fa-chevron-down"}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCustomizeColumnsModal(true)}
                      title="Customize columns"
                      className="reports-icon-btn reports-conversionlog-icon-btn"
                    >
                      <i className="fa fa-th-large" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRefresh}
                      title="Refresh"
                      className="reports-icon-btn reports-conversionlog-icon-btn"
                    >
                      <i className="fa fa-refresh" />
                    </button>
                  </div>

                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="reports-pagination-summary reports-conversionlog-pagination-summary">
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
                                        className={`reports-per-page-option ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
                                      >
                                        <span className={`reports-dropdown-tick ${isSelected || isHovered ? 'active' : ''}`}>
                                          {isSelected && '✓'}
                                        </span>
                                        <span className={`reports-dropdown-label ${isSelected || isHovered ? 'active' : ''}`}>
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
                      className="reports-export-btn reports-export-btn-danger reports-conversionlog-export-btn"
                    >
                      <i className="fa fa-download fa-report-icon" />
                      EXPORT CSV
                    </button>
                  </div>
                </div>

                {showFilterPanel && (
                  <div className="reports-filter-panel reports-conversionlog-filter-panel">
                    <div className="reports-filter-grid reports-conversionlog-filter-grid">

                      {[
                        { name: "conversionId", placeholder: "Conversion ID..." },
                        { name: "clickId", placeholder: "Click ID..." },
                        { name: "eventName", placeholder: "Event Name..." },
                        { name: "eventMappedName", placeholder: "Mapped Name..." },
                      ].map((field) => (
                        <input
                          key={field.name}
                          name={field.name}
                          value={draftFilters[field.name]}
                          onChange={handleDraftFilterChange}
                          placeholder={field.placeholder}
                          style={{
                            width: "100%",
                            height: "36px",
                            borderRadius: "10px",
                            border: "1px solid #d7deea",
                            padding: "0 14px",
                            fontSize: "13px",
                            color: "#0f172a",
                            outline: "none",
                          }}
                        />
                      ))}
                    </div>

                    <div className="reports-filter-grid reports-conversionlog-filter-grid reports-conversionlog-filter-grid-secondary">

                      {[
                        { name: "campaignName", placeholder: "Search campaigns by name..." },
                        { name: "advertiserName", placeholder: "Search advertisers by name" },
                        { name: "publisherName", placeholder: "Search publishers by name" },
                        { name: "geo", placeholder: "Geo..." },
                      ].map((field) => (
                        <input
                          key={field.name}
                          name={field.name}
                          value={draftFilters[field.name]}
                          onChange={handleDraftFilterChange}
                          placeholder={field.placeholder}
                          style={{
                            width: "100%",
                            height: "36px",
                            borderRadius: "10px",
                            border: "1px solid #d7deea",
                            padding: "0 14px",
                            fontSize: "13px",
                            color: "#0f172a",
                            outline: "none",
                          }}
                        />
                      ))}
                    </div>

                    <div className="reports-filter-actions reports-conversionlog-filter-actions">

                      <button
                        type="button"
                        onClick={handleApplyFilters}
                        className="reports-filter-submit-btn reports-conversionlog-filter-submit-btn"
                      >
                        <i className="fa fa-search" />
                        APPLY
                      </button>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        title="Clear filters"
                        className="reports-filter-clear-btn reports-conversionlog-filter-clear-btn"
                      >
                        <i className="fa fa-times" />
                      </button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="reports-card reports-conversionlog-card">
              <CardBody className="p-0 reports-card-body reports-conversionlog-card-body">
                {isLoading && (
                  <div className="reports-loading-overlay reports-conversionlog-loading-overlay">
                    <div className="reports-custom-loader reports-conversionlog-inline-loader">
                      <div className="loader" role="status"></div>
                      <span className="ms-2 fw-bold">Loading...</span>
                    </div>
                  </div>
                )}
                <div className={`reports-table-shell reports-conversionlog-table-shell ${isLoading ? "is-loading" : "not-loading"}`}>
                  <div className="reports-conversionlog-table-inner">
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

export default ConversionLog;
