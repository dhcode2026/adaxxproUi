import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Input,
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import { FaCalendarAlt, FaCaretDown, FaCog, FaChevronRight, FaChevronDown } from "react-icons/fa";
import DataTable from "react-data-table-component";
import DatePicker from "react-datepicker";
import { getalllog } from "./api/Api";
import { useGlobalTabs, TabHeaderName } from "../context/TabContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import ActivityLogEventModal from "./Modal/ActivityLogEventModal";

const ACTIVITY_LOG_DATE_RANGE_KEY = "activityLogDateRange";

const parseStoredDate = (value) => {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoMatch) {
      const [year, month, day] = trimmed.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const parsedDate = new Date(trimmed);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  return null;
};

const getLast30DaysRange = () => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const start = new Date(startOfToday);
  start.setDate(start.getDate() - 29);

  const startLabel = formatCompactDateLabel(start);
  const endLabel = formatCompactDateLabel(endOfToday);

  return {
    startDate: start,
    endDate: endOfToday,
    label: `${startLabel} - ${endLabel}`
  };
};
const getTodayRange = () => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return {
    startDate: startOfToday,
    endDate: endOfToday,
    label: "Today",
  };
};
const formatCompactDateLabel = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatLocalYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatActivityLogDate = (value) => {
  if (!value) return "-";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "-";

    const dateOnlyMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateOnlyMatch) {
      return trimmed;
    }

    const datePart = trimmed.split("T")[0];
    const dateOnlyWithTimeMatch = datePart?.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateOnlyWithTimeMatch) {
      return datePart;
    }

    const parsedDate = new Date(trimmed);
    if (!Number.isNaN(parsedDate.getTime())) {
      return formatLocalYYYYMMDD(parsedDate);
    }

    return trimmed;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatLocalYYYYMMDD(value);
  }

  return String(value);
};

const getStoredDateRange = () => {
  if (typeof window === "undefined") {
    return getTodayRange();
  }

  try {
    const savedRange = window.localStorage.getItem(ACTIVITY_LOG_DATE_RANGE_KEY);
    if (!savedRange) {
      return getTodayRange();
    }

    const parsed = JSON.parse(savedRange);
    const startDate = parseStoredDate(parsed?.startDate);
    const endDate = parseStoredDate(parsed?.endDate);
    if (!startDate || !endDate) {
      return getLast30DaysRange();
    }

    return {
      startDate: startDate,
      endDate: endDate,
      label: parsed?.label || getLast30DaysRange().label,
    };
  } catch (error) {
    console.error("Failed to restore activity log date range", error);
    return getTodayRange();
  }
};

const persistDateRange = (startDateValue, endDateValue, labelValue) => {
  if (typeof window === "undefined") return;
  if (!startDateValue && !endDateValue) {
    const defaultRange = getTodayRange();
    const payload = {
      startDate: formatLocalYYYYMMDD(defaultRange.startDate),
      endDate: formatLocalYYYYMMDD(defaultRange.endDate),
      label: defaultRange.label,
    };
    window.localStorage.setItem(ACTIVITY_LOG_DATE_RANGE_KEY, JSON.stringify(payload));
    return;
  }

  const payload = {
    startDate: startDateValue ? formatLocalYYYYMMDD(startDateValue) : null,
    endDate: endDateValue ? formatLocalYYYYMMDD(endDateValue) : null,
    label: labelValue || "Date Range",
  };

  window.localStorage.setItem(ACTIVITY_LOG_DATE_RANGE_KEY, JSON.stringify(payload));
};

const ActivityLog = () => {
  const vx = useViewContext();
  const location = useLocation();
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
  } = useGlobalTabs();

  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const restoredDateRange = useMemo(() => getStoredDateRange(), []);
  const [startDate, setStartDate] = useState(restoredDateRange.startDate);
  const [endDate, setEndDate] = useState(restoredDateRange.endDate);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [rangeDisplayLabel, setRangeDisplayLabel] = useState(restoredDateRange.label);

  const dateRangePopupRef = useRef(null);
  const tableDateRangeRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: startDate || null,
    endDate: endDate || null,
  });
  const emptyRow = {
    name: "",
    exchangeEKey: "",
    exchangeIKey: "",
    supplyChain: false,
  };
  const [newRow, setNewRow] = useState(null);
  const [modal, setModal] = useState(false);
  const [activityLogEventModalOpen, setActivityLogEventModalOpen] = useState(false);
  const [selectedActivityLogEvent, setSelectedActivityLogEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);

  const toggleCalendar = () => setShowCalendar((prev) => !prev);

  useEffect(() => {
    initializePageTab("Activity Log", "fa fa-history", "/admin/activity-log");
  }, [initializePageTab]);

  useEffect(() => {
    const hasCreatePermission = canCreate("Activity Log");
    const hasViewPermission = canView("Activity Log");
    const hasEditPermission = canEdit("Activity Log");
    const hasDeletePermission = canDelete("Activity Log");
    const hasUpdatePermission = canUpdate("Activity Log");
    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRangePopupRef.current && !dateRangePopupRef.current.contains(event.target) &&
        tableDateRangeRef.current && !tableDateRangeRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        const portalNode = perPagePortalRef.current;
        if (portalNode && portalNode.contains(event.target)) {
          return;
        }
        setHoveredPerPage(null);
        setIsPerPageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isPerPageOpen]);

  const redraw = () => setCount((c) => c + 1);

  const openActivityLogEventModal = (row) => {
    setSelectedActivityLogEvent(row || null);
    setActivityLogEventModalOpen(true);
  };

  const closeActivityLogEventModal = () => {
    setActivityLogEventModalOpen(false);
    setSelectedActivityLogEvent(null);
  };

  const getPresetRange = (preset) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    switch (preset) {
      case "Today":
        return { startDate: startOfToday, endDate: endOfToday };
      case "Yesterday": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 1);
        const end = new Date(endOfToday);
        end.setDate(end.getDate() - 1);
        return { startDate: start, endDate: end };
      }
      case "Last 2 Days": {
        const end = endOfToday;
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 1);
        return { startDate: start, endDate: end };
      }
      case "Last 7 Days": {
        const end = endOfToday;
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 6);
        return { startDate: start, endDate: end };
      }
      case "Last 30 Days": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 29);
        return { startDate: start, endDate: endOfToday };
      }
      default:
        return { startDate: null, endDate: null };
    }
  };

  const isSameDay = (first, second) => {
    if (!first || !second) return false;
    const f = new Date(first);
    const s = new Date(second);
    return f.toDateString() === s.toDateString();
  };

  const isSameDateRange = (firstRange, secondRange) => (
    isSameDay(firstRange?.startDate, secondRange?.startDate) &&
    isSameDay(firstRange?.endDate, secondRange?.endDate)
  );

  const formatPickerValue = (date) => {
    if (!date) return "-- / -- / ----";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePresetSelect = (preset) => {
    const range = getPresetRange(preset);
    setDraftDateRange(range);
    if (range.startDate && range.endDate) {
      const startLabel = formatCompactDateLabel(range.startDate);
      const endLabel = formatCompactDateLabel(range.endDate);
      setRangeDisplayLabel(`${startLabel} - ${endLabel}`);
    } else {
      setRangeDisplayLabel(preset);
    }
  };

  const handleDateRangeClear = async () => {
    // Reset to Today instead of clearing
    const defaultRange = getTodayRange();
    setDraftDateRange(defaultRange);
    setStartDate(defaultRange.startDate);
    setEndDate(defaultRange.endDate);
    setRangeDisplayLabel(defaultRange.label);
    persistDateRange(defaultRange.startDate, defaultRange.endDate, defaultRange.label);
    setShowDateRangePicker(false);
    await fetchLogs(true, defaultRange.startDate, defaultRange.endDate);
  };

  const handleDateRangeApply = async () => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) {
      return;
    }

    const s = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.startDate
      : draftDateRange.endDate;
    const e = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.endDate
      : draftDateRange.startDate;

    setStartDate(s);
    setEndDate(e);
    const startLabel = formatCompactDateLabel(s);
    const endLabel = formatCompactDateLabel(e);
    const nextLabel = `${startLabel} - ${endLabel}`;
    setRangeDisplayLabel(nextLabel);
    persistDateRange(s, e, nextLabel);
    setShowDateRangePicker(false);
    await fetchLogs(true, s, e);
  };

  const toggleDateRangePicker = () => {
    if (showDateRangePicker) {
      setShowDateRangePicker(false);
    } else {
      setDraftDateRange({
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setShowDateRangePicker(true);
    }
  };

  const formatDateRangeLabel = () => {
    if (rangeDisplayLabel && rangeDisplayLabel !== "Date Range") {
      return rangeDisplayLabel;
    }
    if (startDate && endDate) {
      const startLabel = formatCompactDateLabel(startDate);
      const endLabel = formatCompactDateLabel(endDate);
      return `${startLabel} - ${endLabel}`;
    }
    return "Date Range";
  };

  const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return ["1", "true", "yes", "y", "on"].includes(normalized);
    }
    return false;
  };
  const fetchLogs = async (isFiltered = false, selectedStartDate = startDate, selectedEndDate = endDate) => {
    setLoading(true);
    try {
      let formattedStartDate = null;
      let formattedEndDate = null;

      if (isFiltered && selectedStartDate && selectedEndDate) {
        const start = new Date(selectedStartDate);
        const end = new Date(selectedEndDate);
        formattedStartDate = formatLocalYYYYMMDD(start);
        formattedEndDate = formatLocalYYYYMMDD(end);
      }

      const payload = {
        needfilteredData: isFiltered,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      };

      console.log("API Payload:", payload);

      const res = await getalllog(payload);
      console.log("API Response:", res);

      let list = [];
      if (res?.data?.data?.auditingList) {
        list = res.data.data.auditingList;
      } else if (res?.data?.auditingList) {
        list = res.data.auditingList;
      } else if (res?.auditingList) {
        list = res.auditingList;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }

      console.log("Extracted List:", list);

      if (!list || !Array.isArray(list) || list.length === 0) {
        setRowData([]);
        setLoading(false);
        return;
      }

      const formatted = list.map((item, index) => {
        let eventData = {};
        try {
          if (item.event) {
            eventData = typeof item.event === 'string' ? JSON.parse(item.event) : item.event;
          }
        } catch (e) {
          console.error("Invalid event JSON for item:", item.id, e);
          eventData = {};
        }
        const rowKey = `row_${item.id || index}_${Date.now()}_${index}`;

        return {
          id: item.id || index,
          name: item.attribute || eventData.attribute || 'N/A',
          activityname: item.name || eventData.name || 'N/A',
          exchangeEKey: item.eventStatus || eventData.status || 'N/A',
          exchangeIKey: item.attributeId || eventData.attributeId || 'N/A',
          comments: eventData.comments || item.comments || '-',
          createdAt: item.createdAt || eventData.createdAt || new Date().toISOString(),
          createdBy: item.createdBy || eventData.userId || 'N/A',
          eventStatus: item.eventStatus || 'N/A',
          attributeId: item.attributeId || 'N/A',
          rowKey: rowKey,
          supplyChain: false,
          _original: item,
          _eventData: eventData
        };
      });

      console.log("Formatted Data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (startDate && endDate) {
      fetchLogs(true, startDate, endDate);
    } else {
      const defaultRange = getTodayRange();
      setStartDate(defaultRange.startDate);
      setEndDate(defaultRange.endDate);
      setRangeDisplayLabel(defaultRange.label);
      fetchLogs(true, defaultRange.startDate, defaultRange.endDate);
    }
  }, []);

  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        if (startDate && endDate) {
          await fetchLogs(true, startDate, endDate);
        } else {
          await fetchLogs(false, startDate, endDate);
        }
        redraw();
      } catch (err) {
        console.error("Error refreshing logs:", err);
      } finally {
        setLoading(false);
      }
    }, 900);
  };

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = filteredData.map((item) => ({
      ID: item.id,
      "Name": item.activityname,
      Attribute: item.name,
      Status: item.exchangeEKey,
      Comments: item.comments,
      "Created At": formatActivityLogDate(item.createdAt),
      "Event Status": item.eventStatus,
      "Created By": item.createdBy,
      "Attribute ID": item.attributeId,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ActivityLog");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      "activity_log.xlsx",
    );
  };

  const filteredData = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];

    const term = searchTerm.toLowerCase().trim();
    if (!term) return rowData;

    return rowData.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.id && String(item.id).includes(term)) ||
        (item.exchangeEKey && item.exchangeEKey.toLowerCase().includes(term)) ||
        (item.comments && item.comments.toLowerCase().includes(term)) ||
        (item.eventStatus && item.eventStatus.toLowerCase().includes(term))
    );
  }, [rowData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const startIndex = (currentPage - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, currentPage, perPage]);

  const tableData = useMemo(() => {
    const newEntry = newRow
      ? [{ _isNew: true, id: "__new__", rowKey: "__new__", ...emptyRow }]
      : [];
    return [...newEntry, ...paginatedData];
  }, [newRow, paginatedData]);

  useEffect(() => {
    if (paginatedData && paginatedData.length > 0 && selectedIds.length === 0) {
      setSelectedIds([paginatedData[0].rowKey]);
    }
  }, [paginatedData, selectedIds.length]);

  const handleRowClicked = (row) => {
    if (row._isNew) return;
    setSelectedIds([row.rowKey]);
  };

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 fw-bold text-secondary">No data available</div>
    </div>
  );

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#fff",
        minWidth: "1000px",
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

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.rowKey),
      style: {
        backgroundColor: "#FBEDEF !important",
        "& .gOorhn": { color: "black !important" },
      },
    },
    {
      when: (row) => row._isNew === true,
      style: { backgroundColor: "#fffde7 !important" },
    },
  ];

  const columns = [
    {
      name: "S.No",
      cell: (row, index) => <div className="gOorhn">{index + 1}</div>,
      width: "80px",
    },
    {
      name: "Name",
      selector: (row) => row.activityname,
      cell: (row) => <div className="gOorhn">{row.activityname || '-'}</div>,
      sortable: true,
      grow: 2,
    },
    {
      name: "Attribute",
      selector: (row) => row.name,
      cell: (row) => <div className="gOorhn">{row.name || '-'}</div>,
      sortable: true,
      grow: 2,
    },
    {
      name: "Status",
      selector: (row) => row.exchangeEKey,
      cell: (row) => <div className="gOorhn">{row.exchangeEKey || '-'}</div>,
      sortable: true,
      grow: 2,
    },
    {
      name: "Event",
      selector: (row) => row.comments,
      cell: (row) => (
        <div className="gOorhn">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary px-2 py-0"
            onClick={() => openActivityLogEventModal(row)}
            id="activitylogbutton"
          >
            Events
          </button>
        </div>
      ),
      grow: 2,
    },
    {
      name: "Created",
      selector: (row) => formatActivityLogDate(row.createdAt),
      cell: (row) => (
        <div className="gOorhn">
          {formatActivityLogDate(row.createdAt)}
        </div>
      ),
      sortable: true,
      grow: 2,
    },
  ];

  return (
    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete Exchange?"
          message="Only the db admin can undo this if you delete it!!!"
          name="DELETE"
        />
      )}
      {activityLogEventModalOpen && (
        <ActivityLogEventModal
          isOpen={activityLogEventModalOpen}
          toggle={closeActivityLogEventModal}
          audience={selectedActivityLogEvent}
          callback={closeActivityLogEventModal}
        />
      )}
      {canViewUser && (
        <>
          <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <div className="campaign-daily-title" style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}>
                <h2>Activity Log</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
            <CardBody className="py-3" style={{ overflow: "visible" }}>
              <Row className="align-items-center g-2">
                <Col md="2">
                  <div className="position-relative" style={{ minWidth: '180px' }}>
                    <Input
                      className="form-control py-1 px-1 custom-select-input"
                      type="text"
                      id="searching"
                      placeholder="Search"
                      style={{ fontSize: "0.685rem", height: '30px', fontFamily: '"Open Sans", Arial, sans-serif' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Col>

                <Col md="2" className="activity-log">
                  <div className="cd-date-range-wrapper date-input-wrapper" ref={tableDateRangeRef}>
                    <button
                      type="button"
                      className="cd-date-range-button db-select"
                      onClick={toggleDateRangePicker}
                      style={{ minWidth: "180px", maxWidth: "100%", flex: "1 1 auto" }}
                    >
                      <FaCalendarAlt size={10} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {formatDateRangeLabel()}
                      </span>
                    </button>
                    {showDateRangePicker && (
                      <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table" ref={dateRangePopupRef}>
                        <div className="cd-date-range-presets">
                          <div className="cd-date-range-presets-title">Preset Ranges</div>
                          {[
                            "Today",
                            "Yesterday",
                            "Last 2 Days",
                            "Last 7 Days",
                            "Last 30 Days",
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
                              <div className="cd-date-range-field-value">
                                {formatPickerValue(draftDateRange.startDate)}
                              </div>
                            </div>
                            <div className="cd-date-range-field">
                              <span className="cd-date-range-field-label">To</span>
                              <div className="cd-date-range-field-value">
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
                </Col>

                <Col xs="auto" style={{ marginLeft: "50px" }}>
                  <button
                    type="button"
                    onClick={refresh}
                    className="cdi-icon-btn"
                    style={{ padding: '4px 10px', fontSize: '11px', height: '30px', fontFamily: '"Open Sans", Arial, sans-serif', whiteSpace: 'nowrap' }}
                  >
                    <i className="fa fa-repeat me-1"></i>Refresh
                  </button>
                </Col>

                <Col md="2"></Col>

                <Col xs="auto">
                  <div className="cd-pagination-summary" style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                  </div>
                </Col>

                <Col xs="auto">
                  <div className="cd-pagination-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                    {totalPages > 1 && (
                      <div className="cd-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="cd-pagination-nav-btn"
                          type="button"
                          style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                          <FaChevronRight style={{ transform: 'rotate(180deg)', fontSize: '12px' }} />
                        </button>
                        <button
                          className="cd-pagination-page-btn is-active"
                          type="button"
                          style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', cursor: 'default' }}>
                          {currentPage}
                        </button>
                        <span style={{ color: '#64748b', fontSize: '13px', margin: '0 4px', fontWeight: '500' }}>of</span>
                        <button className="cd-pagination-page-btn" type="button" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', cursor: 'default' }}>
                          {totalPages}
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage >= totalPages}
                          className="cd-pagination-nav-btn"
                          type="button"
                          style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                          <FaChevronRight style={{ fontSize: '12px' }} />
                        </button>
                        <div style={{ position: 'relative', marginLeft: '8px' }} ref={perPageRef}>
                          <div className="campaign-select-wrapper">
                            <input
                              readOnly
                              value={`${perPage} per page`}
                              className="campaign-select-input"
                              style={{
                                height: '30px',
                                minHeight: '30px',
                                borderRadius: '6px',
                                padding: '8px 28px 8px 16px',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                                color: '#1e293b',
                                fontWeight: '600',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                                outline: 'none',
                                maxWidth: '130px',
                              }}
                              onClick={() => {
                                setHoveredPerPage(null);
                                setIsPerPageOpen((open) => !open);
                              }}
                            />
                            <FaChevronDown
                              style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: `translateY(-50%) ${isPerPageOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                                fontSize: '12px',
                                color: '#64748b',
                                pointerEvents: 'none',
                                transition: 'transform 0.2s ease',
                              }}
                            />
                          </div>
                          {isPerPageOpen &&
                            typeof document !== 'undefined' &&
                            createPortal(
                              <div
                                ref={perPagePortalRef}
                                className="custom-dropdown-menu "
                                style={{
                                  position: 'absolute',
                                  top: `${perPageDropdownPosition.top}px`,
                                  left: `${perPageDropdownPosition.left}px`,
                                  zIndex: 9999,
                                  minWidth: '130px',
                                  pointerEvents: 'auto',
                                  maxWidth: '150px',
                                  maxHeight: '300px',
                                  borderRadius: '13px',
                                }}
                              >
                                {[10, 20, 25, 50, 100].map((value) => {
                                  const isSelected = perPage === value;
                                  const isHovered = hoveredPerPage === value;

                                  return (
                                    <div
                                      key={value}
                                      onClick={() => {
                                        setPerPage(value);
                                        setCurrentPage(1);
                                        setHoveredPerPage(null);
                                        setIsPerPageOpen(false);
                                      }}
                                      onMouseEnter={() => setHoveredPerPage(value)}
                                      onMouseLeave={() => setHoveredPerPage(null)}
                                      className={`custom-dropdown-option ${isSelected ? 'selected' : ''}`}
                                      style={{
                                        height: '40px',
                                        cursor: 'pointer',
                                        pointerEvents: 'auto',
                                        backgroundColor: (isSelected || isHovered) ? '#e53e3e' : 'transparent',
                                      }}
                                    >
                                      <span
                                        className="tick-icon"
                                        style={{
                                          marginRight: '12px',
                                          color: (isSelected || isHovered) ? '#ffffff' : 'transparent',
                                          fontSize: '18px',
                                          minWidth: '20px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {(isSelected || isHovered) && "\u2713"}
                                      </span>
                                      <span style={{ color: (isSelected || isHovered) ? '#ffffff' : '#64748b', fontWeight: (isSelected || isHovered) ? '600' : '500' }}>
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
                </Col>

                <Col xs="auto">
                  <button
                    type="button"
                    className="cdi-export-btn"
                    id="export"
                    onClick={handleExport}
                    style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#dc2626', color: 'white', borderColor: '#0ea5e9', height: '30px' }}
                  >
                    Export
                  </button>
                </Col>
              </Row>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
              <div style={{ minWidth: "1000px" }}>
                <DataTable
                  keyField="rowKey"
                  className="data-table"
                  columns={columns}
                  data={paginatedData}
                  customStyles={customStyles}
                  highlightOnHover
                  pointerOnHover
                  persistTableHead
                  fixedHeader
                  fixedHeaderScrollHeight="100%"
                  responsive={false}
                  conditionalRowStyles={conditionalRowStyles}
                  onRowClicked={handleRowClicked}
                  progressPending={loading}
                  progressComponent={<CustomLoader />}
                  noDataComponent={
                    <div className="py-5 text-center text-secondary">
                      No data available
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </>
      )}
      {!canViewUser && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Activity Log.
        </div>
      )}
    </div>
  );
};

export default ActivityLog;