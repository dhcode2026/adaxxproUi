import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import DatePicker from "react-datepicker";
import "../assets/css/dailyreporting.css";
import { FaCalendarAlt, FaCaretDown, FaCog,FaChevronDown, FaChevronRight } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faDownload, faChevronRight, faChevronDown, faCalendarAlt as faCalendarAltSolid } from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import { creativelist } from "../views/api/Api";

import AdzHourlyCustomizationModal from "../views/customizationcolumns/AdzHourlyCustomizationModal";
import Swal from "sweetalert2";

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
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
  return { startDate: start, endDate: endOfDay(today) };
};

const isSameDay = (first, second) => {
  if (!first || !second) return false;
  return startOfDay(first).getTime() === startOfDay(second).getTime();
};

const isSameDateRange = (firstRange, secondRange) => (
  isSameDay(firstRange?.startDate, secondRange?.startDate) &&
  isSameDay(firstRange?.endDate, secondRange?.endDate)
);

const DEFAULT_SELECTED_COLUMNS = [
  "Report Date",
  "Report Time",
  "Name",
   "Imps",
  "Clicks",
  "Hourly Budget",

];

const AdsHourlyReporting = (props) => {
  const {
    groupId: urlGroupId,
    groupName: urlGroupName,
    campaignId: urlCampaignId,
    creativeId: urlCreativeId,
    reportDate: urlReportDate,
  } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const decodedGroupName = urlGroupName
    ? decodeURIComponent(urlGroupName)
    : props.groupName || location.state?.name || "";
  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const initialCampaignId =
    props.campaignId || location.state?.campaignId || urlCampaignId;
  const initialCreativeId =
    props.creativeId || location.state?.creativeId || urlCreativeId || null;

  const [currentGroupId, setCurrentGroupId] = useState(
    initialGroupId && initialGroupId !== "undefined" ? initialGroupId : null
  );
  const [currentCampaignId, setCurrentCampaignId] = useState(
    initialCampaignId && initialCampaignId !== "undefined" ? initialCampaignId : null
  );
  const [currentCreativeId, setCurrentCreativeId] = useState(initialCreativeId);
  const [realBrandId, setRealBrandId] = useState(
    props.brandId ||
    location.state?.brandId ||
    localStorage.getItem("currentBrandId") ||
    null
  );
   const tableDateRangeRef = useRef(null);
  // Removed useGlobalTabs hook because we no longer use Tabs here



  const formatIndian = (num) => {
    if (num == null || num === "") return "-";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
      Math.floor(num)
    );
  };

  const getApiRangeValue = (label) => {
    const rangeMap = {
      Today: "TODAY",
      Yesterday: "YESTERDAY",
      "2 Days Ago": "LAST_2_DAYS",
      "Last 7 Days": "LAST_7_DAYS",
      "Last 30 Days": "LAST_30_DAYS",
    };
    return rangeMap[label] || label;
  };

  useEffect(() => {
    const newId = props.groupid || location.state?.groupId || urlGroupId;
    if (newId !== currentGroupId) {
      setCurrentGroupId(newId && newId !== "undefined" ? newId : null);
    }
    const newCampaignId =
      props.campaignId || location.state?.campaignId || urlCampaignId;
    if (newCampaignId !== currentCampaignId) {
      setCurrentCampaignId(
        newCampaignId && newCampaignId !== "undefined" ? newCampaignId : null
      );
    }
    const newCreativeId =
      props.creativeId || location.state?.creativeId || urlCreativeId;
    if (newCreativeId !== currentCreativeId) {
      setCurrentCreativeId(newCreativeId);
    }
  }, [
    props.groupid,
    urlGroupId,
    location.state?.groupId,
    props.campaignId,
    urlCampaignId,
    location.state?.campaignId,
    props.creativeId,
    urlCreativeId,
    location.state?.creativeId,
  ]);

  const IDCell = ({ row }) => <div className="gOorhn">{row.id}</div>;

  const DefaultCPMBidCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue =
        typeof value === "number"
          ? value
          : parseFloat(String(value).replace(/[$,]/g, "")) || 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    };
    return <div className="gOorhn">{formatCurrency(row.cpmBid)}</div>;
  };

  const BudgetCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue =
        typeof value === "number"
          ? value
          : parseFloat(String(value).replace(/[$,]/g, "")) || 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    };
    return <div className="gOorhn">{formatCurrency(row.budget)}</div>;
  };

  const NameCell = ({ row }) => (
    <div className="gOorhn">
      {row.name}
      {currentGroupId && (
        <span className="badge bg-secondary ms-2" style={{ fontSize: "0.65rem" }} />
      )}
    </div>
  );

  const MaxBidCell = ({ row }) => (
    <div className="gOorhn">
      {typeof row.max_bid === "number"
        ? `$${row.max_bid.toFixed(2)}`
        : row.max_bid || "$0.00"}
    </div>
  );

  const ReportDateCell = ({ row }) => {
    const formatted = row.reportDate
      ? new Date(row.reportDate).toLocaleDateString("en-GB")
      : "-";
    return <div className="gOorhn">{formatted}</div>;
  };

  const ReportTimeCell = ({ row }) => {
    const getFormattedTime = () => {
      if (!row.hourBucket) return "-";
      const date = new Date(row.hourBucket);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    };
    return <div className="gOorhn">{getFormattedTime()}</div>;
  };

  const ALL_COLUMNS = {
    "Report Date": {
      name: "Report Date",
      selector: (row) => row.reportDate,
      cell: (row) => <ReportDateCell row={row} />,
      sortable: true,
      width: "150px",
    },
    "Report Time": {
      name: "Report Time",
      selector: (row) => row.hourBucket,
      cell: (row) => <ReportTimeCell row={row} />,
      sortable: true,
      width: "150px",
    },
    Name: {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "300px",
    },
    // ID: {
    //   name: "ID",
    //   selector: (row) => row.id,
    //   cell: (row) => <IDCell row={row} />,
    //   sortable: true,
    //   width: "100px",
    // },
    "Default Bid": {
      name: "CPM Bid",
      selector: (row) => row.cpmBid,
      cell: (row) => <DefaultCPMBidCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Hourly Budget": {
      name: "Hourly Budget",
      selector: (row) => row.budget,
      cell: (row) => <BudgetCell row={row} />,
      sortable: true,
      width: "162px",
    },
    "Max Bid": {
      name: "Max Bid",
      selector: (row) => row.max_bid,
      cell: (row) => <MaxBidCell row={row} />,
      sortable: true,
      width: "100px",
    },
    Imps: {
      name: "Imps",
      selector: (row) => row.impressionsWon || "-",
      cell: (row) => (
        <div className="gOorhn">{row.impressionsWon?.toLocaleString() || 0}</div>
      ),
      sortable: true,
      width: "150px",
    },
    "Win Percentage": {
      name: "Win Percentage",
      selector: (row) => row.winPercentage || "-",
      cell: (row) => (
        <div className="gOorhn">
          {row.winPercentage ? `${row.winPercentage.toFixed(2)}%` : "-"}
        </div>
      ),
      sortable: true,
      width: "120px",
    },
    "Audio/Video Starts": {
      name: "Audio/Video Starts",
      selector: (row) => row.audioVideoStarts || 0,
      cell: (row) => <div className="gOorhn">{row.audioVideoStarts || 0}</div>,
      sortable: true,
      width: "150px",
    },
    "25% Complete": {
      name: "25% Complete",
      selector: (row) => row.percent25 || 0,
      cell: (row) => <div className="gOorhn">{row.percent25 || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "50% Complete": {
      name: "50% Complete",
      selector: (row) => row.percent50 || 0,
      cell: (row) => <div className="gOorhn">{row.percent50 || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "75% Complete": {
      name: "75% Complete",
      selector: (row) => row.percent75 || 0,
      cell: (row) => <div className="gOorhn">{row.percent75 || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "100% Complete": {
      name: "100% Complete",
      selector: (row) => row.p100Complete || 0,
      cell: (row) => <div className="gOorhn">{row.p100Complete || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "Completion Rate": {
      name: "Completion Rate",
      selector: (row) => row.completionRate || "-",
      cell: (row) => <div className="gOorhn">{row.completionRate || "-"}</div>,
      sortable: true,
      width: "140px",
    },
    "Adv. Spend eCPCV": {
      name: "Adv. Spend eCPCV",
      selector: (row) => row.advSpendECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.advSpendECPCV || "-"}</div>,
      sortable: true,
      width: "170px",
    },
    "Total eCPCV": {
      name: "Total eCPCV",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Media Spend": {
      name: "Media Spend",
      selector: (row) => row.mediaSpend || "-",
      cell: (row) => {
        const val = Number(row.mediaSpend);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.mediaSpend || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    Clicks: {
      name: "Clicks",
      selector: (row) => row.totalClicks || 0,
      cell: (row) => <div className="gOorhn">{formatIndian(row.totalClicks)}</div>,
      sortable: true,
      width: "100px",
    },
    "Total eCPC": {
      name: "Total eCPC",
      selector: (row) => row.totalEcpc || "-",
      cell: (row) => {
        const val = Number(row.totalEcpc);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.totalEcpc || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    CTR: {
      name: "CTR",
      selector: (row) => row.ctr || "-",
      cell: (row) => (
        <div className="gOorhn">{row.ctr ? `${row.ctr.toFixed(2)}%` : "-"}</div>
      ),
      sortable: true,
      width: "150px",
    },
    EPC: {
      name: "EPC",
      selector: (row) => row.epc || "-",
      cell: (row) => {
        const val = Number(row.epc);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.epc || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    "Total Conversions": {
      name: "Total Conversions",
      selector: (row) => row.conversion || "-",
      cell: (row) => <div className="gOorhn">{row.conversion?.toFixed(2) || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total Revenue": {
      name: "Total Revenue",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => <div className="gOorhn">{row.totalSpend?.toFixed(2) || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total eCPM": {
      name: "Total eCPM",
      selector: (row) => row.ecpm || "-",
      cell: (row) => {
        const val = Number(row.ecpm);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.ecpm || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    "Total RPM": {
      name: "Total RPM",
      selector: (row) => row.totalRpm || 0,
      cell: (row) => {
        const val = Number(row.totalRpm);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.totalRpm || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    ROAS: {
      name: "ROAS",
      selector: (row) => row.roas || 0,
      cell: (row) => {
        const val = Number(row.roas);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.roas || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    "Platform Free": {
      name: "Platform Free",
      selector: (row) => row.groupPercentage || "-",
      cell: (row) => {
        const val = Number(row.groupPercentage);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.groupPercentage || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    "Platform ECPM": {
      name: "Platform ECPM",
      selector: (row) => row.platformEcpm || "-",
      cell: (row) => <div className="gOorhn">{row.platformEcpm || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Media ECPM": {
      name: "Media ECPM",
      selector: (row) => row.mediaEcpm || "-",
      cell: (row) => <div className="gOorhn">{row.mediaEcpm || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Platform Spend": {
      name: "Platform Spend",
      selector: (row) => row.platformSpend || "-",
      cell: (row) => {
        const val = Number(row.platformSpend);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.platformSpend || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
    Spend: {
      name: "Spend",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => {
        const val = Number(row.totalSpend);
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.totalSpend || "-"}
          </div>
        );
      },
      sortable: true,
      width: "150px",
    },
  };

  // ---------- State for UI ----------
  const vx = useViewContext();
  const [rowData, setRowData] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  // Default to last 24 hours (yesterday to today)
  const [startDate, setStartDate] = useState(getYesterday());
  const [endDate, setEndDate] = useState(getToday());
  const [selectedLabel, setSelectedLabel] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const [hourlyCustomizationModal, setHourlyCustomizationModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const datePickerRef = useRef(null);
  const STORAGE_KEY = "campaignsHourlySelectedColumns";

  const dateRangePopupRef = useRef(null);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: startDate || null,
    endDate: endDate || null,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dateRangePopupRef.current &&
        !dateRangePopupRef.current.contains(event.target) &&
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setStartDate(null);
    setEndDate(null);
    setAppliedDateRange(null);
    setShowCalendar(false);
  }, []);

  const handleDateRangeApply = useCallback(() => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) {
      return;
    }

    const start = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.startDate
      : draftDateRange.endDate;
    const end = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.endDate
      : draftDateRange.startDate;

    setStartDate(start);
    setEndDate(end);
    setAppliedDateRange({ startDate: start, endDate: end });
    setShowCalendar(false);
  }, [draftDateRange]);

  const openDateRangePicker = useCallback(() => {
    setDraftDateRange({
      startDate: startDate || null,
      endDate: endDate || null,
    });
    setShowCalendar(true);
  }, [startDate, endDate]);

  const toggleDateRangePicker = useCallback(() => {
    if (showCalendar) {
      setShowCalendar(false);
    } else {
      openDateRangePicker();
    }
  }, [showCalendar, openDateRangePicker]);

  const dateDisplayOptions = useMemo(() => ({
    day: "numeric",
    month: "short",
    year: "numeric"
  }), []);

  const currentWeekRange = useMemo(() => getCurrentWeekRange(), []);

  const formatDateRangeLabel = useCallback((start, end) => {
    if (start && end) {
      if (isSameDateRange({ startDate: start, endDate: end }, currentWeekRange)) {
        return "Last 7 days";
      }
      return `${start.toLocaleDateString(undefined, dateDisplayOptions)} - ${end.toLocaleDateString(undefined, dateDisplayOptions)}`;
    }
    return "Date Range";
  }, [currentWeekRange, dateDisplayOptions]);

  const dateRangeLabel = useMemo(() => (
    formatDateRangeLabel(startDate, endDate)
  ), [startDate, endDate, formatDateRangeLabel]);


  
  useEffect(() => {
   
    if (currentCreativeId && !appliedDateRange && !urlReportDate) {
      const yesterday = getYesterday();
      const today = getToday();
      setAppliedDateRange({
        startDate: yesterday,
        endDate: today,
        label: "Last 24 Hours",
      });
      setSelectedLabel("Last 24 Hours");
    }
  }, [currentCreativeId, appliedDateRange, urlReportDate]);
  useEffect(() => {
    if (urlReportDate) {
      const date = new Date(urlReportDate);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
        setEndDate(date);
        setSelectedLabel("");
        setAppliedDateRange(null);
        setAppliedDateRange({
          startDate: date,
          endDate: date,
          label: urlReportDate,
        });
      }
    }
  }, [urlReportDate]);
  const formatDateString = (date) => {
    if (!date) return null;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateEmptyHourlyRecords = (dateStr) => {
    const result = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      result.push({
        id: currentCreativeId || null,
        reportDate: dateStr,
        hourBucket: `${dateStr} ${hourStr}:00:00`,
        name: "Creative",
        impressionsWon: 0,
        audioVideoStarts: 0,
        percent25: 0,
        percent50: 0,
        percent75: 0,
        p100Complete: 0,
        cpmBid: 0,
        budget: 0,
        max_bid: 0,
        totalClicks: 0,
        ctr: 0,
        totalEcpc: 0,
        winPercentage: 0,
        conversion: 0,
        totalRpm: 0,
        roas: 0,
        groupPercentage: 20,
        totalSpend: 0,
        platformSpend: 0,
        mediaSpend: 0,
        ecpm: 0,
        platformEcpm: 0,
        mediaEcpm: 0,
        epc: 0,
        completionRate: 0,
        advSpendECPCV: 0,
        totalECPCV: 0,
      });
    }
    return result;
  };

  // Transform API data to hourly records with all 24 hours
  const transformCreativeHourlyData = (apiData) => {
    // If API returns empty data, generate default 24-hour records
    if (!apiData || !apiData.length) {
      let dateToUse = urlReportDate;
      if (!dateToUse && appliedDateRange?.startDate) {
        dateToUse = appliedDateRange.startDate;
      }
      if (!dateToUse) {
        dateToUse = getToday();
      }
      const dateStr = formatDateString(dateToUse);
      console.log("API returned empty data. Generating default 24-hour records for:", dateStr);
      return generateEmptyHourlyRecords(dateStr);
    }

    // Group data by date
    const dataByDate = {};
    apiData.forEach(item => {
      if (!item.hourlyReport) return;
      const date = item.hourlyReport.split(' ')[0];
      if (!dataByDate[date]) {
        dataByDate[date] = [];
      }
      dataByDate[date].push(item);
    });

    // Process each date and generate all 24 hours
    const result = [];
    Object.keys(dataByDate).sort().forEach(date => {
      const hourlyData = dataByDate[date];

      // Create a map of hour -> data
      const hourMap = {};
      hourlyData.forEach(item => {
        const hour = new Date(item.hourlyReport).getHours();
        hourMap[hour] = item;
      });

      // Generate all 24 hours for this date
      for (let hour = 0; hour < 24; hour++) {
        const item = hourMap[hour];

        if (item) {
          // Use actual data if available
          result.push({
            id: item.creativeId,
            reportDate: date,
            hourBucket: item.hourlyReport,
            name: item.name || "Creative",
            impressionsWon: item.totalWin || 0,
            audioVideoStarts: item.startCount || 0,
            percent25: item.percent25 || 0,
            percent50: item.percent50 || 0,
            percent75: item.percent75 || 0,
            p100Complete: item.completeCount || 0,
            cpmBid: item.cpmBid || 0,
            budget: item.budget || 0,
            max_bid: item.maxBid || 0,
            totalClicks: item.totalClicks || 0,
            ctr: item.ctr || 0,
            totalEcpc: item.totalEcpc || 0,
            winPercentage: item.winPercentage || 0,
            conversion: item.conversion || 0,
            totalRpm: item.totalRpm || 0,
            roas: item.roas || 0,
            groupPercentage: item.groupPercentage || 20,
            totalSpend: item.totalSpend || 0,
            platformSpend: item.platformSpend || 0,
            mediaSpend: item.mediaSpend || 0,
            ecpm: item.ecpm || 0,
            platformEcpm: item.platformEcpm || 0,
            mediaEcpm: item.mediaEcpm || 0,
            epc: item.epc || 0,
            completionRate: item.completionRate || 0,
            advSpendECPCV: item.advSpendECPCV || 0,
            totalECPCV: item.totalECPCV || 0,
          });
        } else {
          // Create placeholder record for missing hour
          const hourStr = hour.toString().padStart(2, '0');
          const defaultCreative = hourlyData[0] || {};
          result.push({
            id: defaultCreative.creativeId || null,
            reportDate: date,
            hourBucket: `${date} ${hourStr}:00:00`,
            name: defaultCreative.name || "Creative",
            impressionsWon: 0,
            audioVideoStarts: 0,
            percent25: 0,
            percent50: 0,
            percent75: 0,
            p100Complete: 0,
            cpmBid: 0,
            budget: 0,
            max_bid: 0,
            totalClicks: 0,
            ctr: 0,
            totalEcpc: 0,
            winPercentage: 0,
            conversion: 0,
            totalRpm: 0,
            roas: 0,
            groupPercentage: 20,
            totalSpend: 0,
            platformSpend: 0,
            mediaSpend: 0,
            ecpm: 0,
            platformEcpm: 0,
            mediaEcpm: 0,
            epc: 0,
            completionRate: 0,
            advSpendECPCV: 0,
            totalECPCV: 0,
          });
        }
      }
    });

    return result;
  };

  const fetchCreativeHourlyData = async () => {
    if (!currentCreativeId) {
      setRowData([]);
      return;
    }

    setLoading(true);
    try {
      let start, end;

      // Check if we have a single date from URL (reportDate parameter)
      if (urlReportDate) {
        const date = new Date(urlReportDate);
        // Validate the date is valid
        if (!isNaN(date.getTime())) {
          start = date;
          end = date;
        }
      }
      // Otherwise use the applied date range
      else if (appliedDateRange?.startDate && appliedDateRange?.endDate) {
        start = appliedDateRange.startDate;
        end = appliedDateRange.endDate;
      }
      // Default to last 24 hours
      else {
        start = getYesterday();
        end = getToday();
      }

      const formatDateForAPI = (date) => {
        if (!date) return null;
        // Handle the case where date might be a string already
        if (typeof date === 'string') {
          // If it's already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
          }
          // Try to parse the string
          date = new Date(date);
          if (isNaN(date.getTime())) return null;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const startDateStr = formatDateForAPI(start);
      const endDateStr = formatDateForAPI(end);

      console.log("Fetching hourly data with payload:", {
        campaignId: "",
        creativeId: parseInt(currentCreativeId, 10),
        startDate: startDateStr,
        endDate: endDateStr,
      });

      const payload = {
        campaignId: "", // Keep empty as per your requirement
        creativeId: parseInt(currentCreativeId, 10),
        startDate: startDateStr,
        endDate: endDateStr,
      };

      const response = await creativelist(payload);
      console.log("Hourly API response:", response);

      let rawData = response.data?.data || response.data || [];
      if (!Array.isArray(rawData)) rawData = [];

      const transformedRows = transformCreativeHourlyData(rawData);
      setRowData(transformedRows);
    } catch (err) {
      console.error("Error fetching creative hourly data:", err);
      Swal.fire("Error", "Failed to fetch hourly data", "error");
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCreativeId) {
      // Add a small delay to ensure state updates are complete
      const timer = setTimeout(() => {
        fetchCreativeHourlyData();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setRowData([]);
    }
  }, [currentCreativeId, appliedDateRange, urlReportDate]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setSelectedColumns(parsed);
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  const refresh = async () => {
    // If we came from daily reporting with a specific date, keep that date
    if (urlReportDate) {
      const date = new Date(urlReportDate);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
        setEndDate(date);
        setSelectedLabel("");
        setAppliedDateRange({
          startDate: date,
          endDate: date,
          label: urlReportDate,
        });
        await fetchCreativeHourlyData();
      }
    } else {
      handleClearDateRange();
      if (currentCreativeId) {
        await fetchCreativeHourlyData();
      }
    }
  };

  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case "Today":
        start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        break;
      case "Yesterday":
        start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        break;
      case "2 Days Ago":
        start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
        break;
      case "Last 7 Days":
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        break;
      case "Last 30 Days":
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
        break;
      default:
        start = end = null;
    }
    setSelectedLabel(type);
    setStartDate(start);
    setEndDate(end);
  };

  const formatDateRange = () => {
    if (appliedDateRange?.label === "Last 24 Hours") return "Last 24 Hours";
    if (appliedDateRange?.label) return appliedDateRange.label;
    if (selectedLabel) return selectedLabel;
    if (startDate && endDate) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    } else if (startDate) {
      return startDate.toLocaleDateString();
    } else {
      return "All Dates";
    }
  };

  const handleApply = () => {
    setShowCalendar(false);
    if (startDate && endDate) {
      setAppliedDateRange({
        startDate,
        endDate,
        label: selectedLabel,
      });
    }
  };

  const handleApplyAll = () => {
    setShowCalendar(false);
    if (startDate && endDate) {
      setAppliedDateRange({
        startDate,
        endDate,
        label: selectedLabel,
      });
    }
  };

  const handleClearDateRange = () => {
    const yesterday = getYesterday();
    const today = getToday();
    setStartDate(yesterday);
    setEndDate(today);
    setSelectedLabel("Last 24 Hours");
    setAppliedDateRange({
      startDate: yesterday,
      endDate: today,
      label: "Last 24 Hours",
    });
    setShowCalendar(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every((item) => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);

  const handleSelectAllChange = () => {
    const filteredIds = filteredData.map((item) => item.id);
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const newSelected = [...prev];
        filteredIds.forEach((id) => {
          if (!newSelected.includes(id)) newSelected.push(id);
        });
        return newSelected;
      });
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const exportToExcel = () => {
    if (!filteredData.length) {
      alert("No data to export");
      return;
    }
    const headers = selectedColumns;
    const rows = filteredData.map((row) =>
      selectedColumns.map((colKey) => {
        const column = ALL_COLUMNS[colKey];
        if (!column) return "";
        let value = column.selector(row);
        if (value === null || value === undefined) return "";
        return value;
      })
    );
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            if (
              typeof cell === "string" &&
              (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
            ) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `Hourly_Reporting_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleColumnChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
  };

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nogroupdataavilable">
      <div className="py-4 text-secondary">
        {!currentCreativeId
          ? "No creative selected for hourly reporting"
          : "No hourly data available for this creative"}
      </div>
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
      height: "56px",
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
      height: "56px",
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

  const buildColumns = () => {
    const columns = [];

    selectedColumns.forEach((columnKey) => {
      if (ALL_COLUMNS[columnKey]) {
        columns.push(ALL_COLUMNS[columnKey]);
      }
    });

    return columns;
  };

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: "#ffe4e6 !important",
      },
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, currentPage, perPage]);

  return (
    <div>
          <div className="campaign-daily-header dailyreporting-page-header">
            <div>
              <div className="campaign-daily-title dailyreporting-page-title">
                <h2>Hourly Reporting - {decodedGroupName || "Creative"}</h2>
              </div>
            </div>
          </div>
              {modal && (
                <DecisionModal
                  title="Really delete Group?"
                  message="Only the db admin can undo this if you delete it!!!"
                  name="DELETE"
                  callback={() => setModal(false)}
                />
              )}
            
                  
          <>
             <Card className="mb-3 dailyreporting-card">
              <CardBody className="py-3 dailyreporting-card-body">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  
                  <Row className="align-items-center dailyreporting-toolbar-row">
                    <Col md="2"  id="maximing">
                      <div className="position-relative ms-2">
                        <Input
                          className="form-control py-1 px-1 custom-select-input dailyreporting-search-input"
                          type="text"
                          id="seaching"
                          placeholder="Search"
                          
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                      </div>
                    </Col>

                    <Col md="2" className="position-relative dailyreporting-date-col-wide" id="adshourlyreporting">
                      <div ref={datePickerRef} >
                        <div className="cdi-date-filter dailyreporting-date-filter">
                          <div
                            className="cdi-date-display dailyreporting-date-display-wide"
                            onClick={toggleDateRangePicker}
                          >
                            <FaCalendarAlt className="dailyreporting-date-display-icon" />
                            <span className="dailyreporting-date-display-label">
                              {dateRangeLabel}
                            </span>
                            <FaCaretDown className="dailyreporting-date-display-caret" />
                          </div>

                            {showCalendar && (
                            <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table dailyreporting-date-range-popup" ref={dateRangePopupRef}>
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
                                    onClick={() => setShowCalendar(false)}
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
                      </div>
                    </Col>
                    <Col xs="auto" className="ps-3">
                      <button
                        type="button"
                        onClick={refresh}
                        className="cdi-icon-btn dailyreporting-refresh-btn"
                        id="refresh"
                      >
                        <i className="fa fa-repeat me-1"></i>
                        Refresh
                      </button>
                    </Col>
                    <Col xs="auto">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                          <div className="cd-pagination-summary dailyreporting-pagination-summary">
                          {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                        </div>
                          <div className="cd-pagination-toolbar dailyreporting-pagination-toolbar">
                          {totalPages > 1 && (
                            <div className="cd-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                                <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="cd-pagination-nav-btn"
                                type="button"
                              >
                              <FaChevronRight className="cd-pagination-nav-icon rotate-180" />
                            </button>
                            <button
                            className="cd-pagination-page-btn is-active"
                            type="button"
                            >
                            {currentPage}
                          </button>
                          <span className="dailyreporting-pagination-of">of</span>
                          <button className="cd-pagination-page-btn" type="button">
                            {totalPages}
                          </button>
                          <button  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}  disabled={currentPage >= totalPages}  className="cd-pagination-nav-btn"  type="button">
                            <FaChevronRight className="cd-pagination-nav-icon" />
                          </button>
                        <div className="dailyreporting-perpage-wrapper" ref={perPageRef}>
                          <div className="campaign-select-wrapper">
                            <input
                              readOnly
                              value={`${perPage} per page`}
                              className="campaign-select-input dailyreporting-perpage-input"
                              onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                            />
                            <FaChevronDown className={`dailyreporting-perpage-chevron ${isPerPageOpen ? 'is-open' : ''}`} />
                          </div>
                          {isPerPageOpen &&
                            typeof document !== 'undefined' &&
                            createPortal(
                              <div
                                ref={perPagePortalRef}
                                className="custom-dropdown-menu biddeript-bd"
                                style={{
                                  position: 'absolute',
                                  top: `${perPageDropdownPosition.top}px`,
                                  left: `${perPageDropdownPosition.left}px`,
                                  zIndex: 9999,
                                  minWidth: '130px',
                                  pointerEvents: 'auto',
                                  maxWidth: '150px',
                                  maxHeight: '300px',
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
                                        setIsPerPageOpen(false);
                                      }}
                                      onMouseEnter={() => setHoveredPerPage(value)}
                                      onMouseLeave={() => setHoveredPerPage(null)}
                                      className={`custom-dropdown-option ${isSelected ? 'selected' : ''}`}
                                    >
                                      <span className="tick-icon">{isSelected && '✓'}</span>
                                      <span className="custom-dropdown-option-label">{value} per page</span>
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
                      </div>
                    </Col>
                    <Col xs="auto" className="p-0">
                      <Button type="button" className="cdi-export-btn dailyreporting-export-btn dailyreporting-export-btn-danger" onClick={exportToExcel}>
                        EXPORT
                      </Button>
                    </Col>
                    <Col xs="auto" className="">
                      <Button type="button" className="cdi-export-btn dailyreporting-export-btn dailyreporting-export-btn-primary" onClick={() => setHourlyCustomizationModalOpen(true)}>
                        COLUMNS
                      </Button>
                    </Col>
                  </Row>
                </div>
              </CardBody>
              </Card>
                      <AdzHourlyCustomizationModal
                        isOpen={hourlyCustomizationModal}
                        toggle={() => setHourlyCustomizationModalOpen(false)}
                        selectedColumns={selectedColumns}
                        setSelectedColumns={handleColumnChange}
                      />
                     
               <div className="campaign-daily-table-wrapper dailyreporting-table-wrapper">
                    <div className="dailyreporting-table-shell">
                      <div className="dailyreporting-table-inner">
                        <DataTable
                          keyField="id"
                          className="data-table"
                          columns={buildColumns()}
                          data={paginatedData}
                          customStyles={customStyles}
                          highlightOnHover
                          pointerOnHover
                          persistTableHead
                          striped
                          dense
                          fixedHeader
                          fixedHeaderScrollHeight="100%"
                          responsive={false}
                          // conditionalRowStyles={conditionalRowStyles}
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
              
    </div>
  );
};

export default AdsHourlyReporting;
