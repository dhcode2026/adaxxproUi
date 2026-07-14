import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
import { FaCalendarAlt, FaCaretDown, FaCog, FaCaretUp } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { creativelist } from "./api/Api";
import DailyAdzCustomizationModal from "../views/customizationcolumns/DailyCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import "../assets/css/dailyreporting.css";

const DEFAULT_SELECTED_COLUMNS = [
  "Report Date",
  "Name",
  "ID",
  "CPM Bid",
  "25% Complete",
  "50% Complete",
  "75% Complete",
  "100% Complete",
  "Imps",
  "Win Percentage",
  "Hourly Reporting",
];

const AdsDailyReporting = (props) => {
  const { creativeId: urlCreativeId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
    const tableDateRangeRef = useRef(null);
  const queryCreativeId = searchParams.get('creativeId');
  const initialCreativeId = props.creativeId 
    || location.state?.creativeId 
    || queryCreativeId 
    || urlCreativeId;

  const [currentCreativeId, setCurrentCreativeId] = useState(
    initialCreativeId ? (initialCreativeId !== "undefined" ? initialCreativeId : null) : null
  );
  const [realBrandId, setRealBrandId] = useState(props.brandId || location.state?.brandId || localStorage.getItem('currentBrandId') || null);

  const formatIndian = (num) => {
    if (num == null || num === "") return "-";
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.floor(num));
  };

  const getApiRangeValue = (label) => {
    const rangeMap = {
      "Today": "TODAY",
      "Yesterday": "YESTERDAY",
      "2 Days Ago": "LAST_2_DAYS",
      "Last 7 Days": "LAST_7_DAYS",
      "Last 30 Days": "LAST_30_DAYS"
    };
    return rangeMap[label] || label;
  };

  useEffect(() => {
    const newCreativeId = props.creativeId || location.state?.creativeId || queryCreativeId || urlCreativeId;
    if (newCreativeId !== currentCreativeId) {
      setCurrentCreativeId(newCreativeId ? (newCreativeId !== "undefined" ? newCreativeId : null) : null);
    }
  }, [props.creativeId, location.state?.creativeId, queryCreativeId, urlCreativeId]);

  const IDCell = ({ row }) => <div className="gOorhn">{row.id}</div>;

  const DefaultCPMBidCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[$,]/g, "")) || 0;
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
      const numValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[$,]/g, "")) || 0;
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
    </div>
  );

  const MaxBidCell = ({ row }) => (
    <div className="gOorhn">
      {typeof row.max_bid === "number" ? `$${row.max_bid.toFixed(2)}` : row.max_bid || "$0.00"}
    </div>
  );

  const ReportDateCell = ({ row }) => {
    const formatted = row.reportDate ? new Date(row.reportDate).toLocaleDateString('en-GB') : '-';
    return <div className="gOorhn">{formatted}</div>;
  };

  const ALL_COLUMNS = {
    "Report Date": {
      name: "Report Date",
      selector: (row) => row.reportDate,
      cell: (row) => <ReportDateCell row={row} />,
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
    ID: {
      name: "ID",
      selector: (row) => row.id,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Default Bid": {
      name: "CPM Bid",
      selector: (row) => row.cpmBid,
      cell: (row) => <DefaultCPMBidCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Daily Budget": {
      name: "Daily Budget",
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
    "Imps": {
      name: "Imps",
      selector: (row) => row.impressionsWon || "-",
      cell: (row) => <div className="gOorhn">{row.impressionsWon?.toLocaleString() || 0}</div>,
      sortable: true,
      width: "150px",
    },
    "Win Percentage": {
      name: "Win Percentage",
      selector: (row) => row.winPercentage || "-",
      cell: (row) => <div className="gOorhn">{row.winPercentage ? `${row.winPercentage.toFixed(2)}%` : "-"}</div>,
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
    "All Time Budget": {
      name: "All Time Budget",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Adv. Spend": {
      name: "Adv. Spend",
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
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.mediaSpend || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Data Spend": {
      name: "Data Spend",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
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
    "Adv. Spend eCPC": {
      name: "Adv. Spend eCPC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total eCPC": {
      name: "Total eCPC",
      selector: (row) => row.totalEcpc || "-",
      cell: (row) => {
        const val = Number(row.totalEcpc);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.totalEcpc || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "CTR": {
      name: "CTR",
      selector: (row) => row.ctr || "-",
      cell: (row) => <div className="gOorhn">{row.ctr ? `${row.ctr.toFixed(2)}%` : "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "EPC": {
      name: "EPC",
      selector: (row) => row.epc || "-",
      cell: (row) => {
        const val = Number(row.epc);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.epc || "-")}</div>;
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
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.ecpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Total RPM": {
      name: "Total RPM",
      selector: (row) => row.totalRpm || 0,
      cell: (row) => {
        const val = Number(row.totalRpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.totalRpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "ROAS": {
      name: "ROAS",
      selector: (row) => row.roas || 0,
      cell: (row) => {
        const val = Number(row.roas);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.roas || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Advertiser Spend eCPM": {
      name: "Advertiser Spend eCPM",
      selector: (row) => row.ecpm || "-",
      cell: (row) => {
        const val = Number(row.ecpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.ecpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Platform Free": {
      name: "Platform Free",
      selector: (row) => row.groupPercentage || "-",
      cell: (row) => {
        const val = Number(row.groupPercentage);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.groupPercentage || "-")}</div>;
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
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.platformSpend || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Spend": {
      name: "Spend",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => {
        const val = Number(row.totalSpend);
        return <div className="gOorhn">{!isNaN(val) ? val.toFixed(2) : (row.totalSpend || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Hourly Reporting": {
      name: "Hourly Reporting",
      selector: (row) => row.id,
      cell: (row) => (
        <Button
          color="success"
          size="sm"
          id="hourlyreporting"
          onClick={() => {
            let reportDate = row.reportDate;
            if (reportDate && typeof reportDate === 'object') {
              const year = reportDate.getFullYear();
              const month = String(reportDate.getMonth() + 1).padStart(2, '0');
              const day = String(reportDate.getDate()).padStart(2, '0');
              reportDate = `${year}-${month}-${day}`;
            }
            navigate(
              `/admin/campaign/${props.campaignId || location.state?.campaignId}/detailed-ad-view/hourly-reporting/${reportDate}`,
              {
                state: {
                  creativeId: row.id,
                  reportDate: reportDate,
                  creativeName: row.name,
                  campaignId: props.campaignId || location.state?.campaignId,
                  fromDailyReporting: true
                },
              }
            );
          }}
        >
          View Hourly Report
        </Button>
      ),
      sortable: true,
      width: "150px",
    },
  };

  const vx = useViewContext();
  const navigate = useNavigate();
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
  } = useGlobalTabs();

  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [rowData, setRowData] = useState([]);
  const [isDailyCustomizationModalOpen, setDailyCustomizationModalOpen] = useState(false);
  const toggleDailyCustomizationModal = () => setDailyCustomizationModalOpen(!isDailyCustomizationModalOpen);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = "adsDailyReportingSelectedColumns";
  const LEGACY_STORAGE_KEYS = ["campaignsDailySelectedColumns"];
  
  const normalizeSelectedColumns = (cols) => {
    let next = Array.isArray(cols) ? cols.filter((c) => ALL_COLUMNS[c]) : [];
    if (!next.length) next = DEFAULT_SELECTED_COLUMNS.filter((c) => ALL_COLUMNS[c]);
    const newColumns = Object.keys(ALL_COLUMNS).filter(
      (col) => !next.includes(col) && DEFAULT_SELECTED_COLUMNS.includes(col)
    );
    next = [...next, ...newColumns];
    next = next.filter((col) => col !== "Hourly Reporting");
    if (ALL_COLUMNS["Hourly Reporting"]) {
      next.push("Hourly Reporting");
    }
    return next;
  };
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({ startDate: null, endDate: null });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const openDateRangePicker = () => setShowDateRangePicker(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);

  // Updated fetchCreativeData function - sends only creativeId, campaignId empty
  const fetchCreativeData = async () => {
    setIsLoading(true);
    try {
      const creativeId = currentCreativeId;
      
      console.log("Fetching with creativeId only:", creativeId);

      if (!creativeId) {
        console.log("No creativeId provided");
        setRowData([]);
        setIsLoading(false);
        return;
      }

      // Build payload with ONLY creativeId (campaignId empty as requested)
      const payload = {
        campaignId: "",  // Keep empty as requested
        creativeId: parseInt(creativeId),  // Ensure it's a number
        startDate: "",
        endDate: ""
      };

      // Add date range if applied
      if (appliedDateRange?.startDate && appliedDateRange?.endDate) {
        const formatDateForAPI = (date) => {
          if (!date) return null;
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        payload.startDate = formatDateForAPI(appliedDateRange.startDate) || "";
        payload.endDate = formatDateForAPI(appliedDateRange.endDate) || "";
      } else if (appliedDateRange?.apiRange) {
        payload.range = appliedDateRange.apiRange;
      }

      console.log("Calling creativelist with payload:", payload);
      const response = await creativelist(payload);
      console.log("API Response:", response);
      
      // Process response
      if (response.data && Array.isArray(response.data)) {
        const mappedData = response.data.map(item => {
          const totalClicks = item.totalClicks || item.clicks || 0;
          const impressions = item.totalWin || item.impressions || 0;
          const ctr = impressions > 0 ? (totalClicks / impressions * 100) : 0;

          const startCount = item.startCount || 0;
          const completedCount = item.completeCount || 0;
          let completionRate = "0%";

          if (startCount > 0) {
            const rate = (completedCount / startCount) * 100;
            completionRate = `${rate.toFixed(2)}%`;
          }

          return {
            id: item.creativeId,
            name: item.name,
            type: item.type,
            reportDate: item.reportDate,
            impressionsWon: impressions,
            audioVideoStarts: startCount,
            percent25: item.percent25 || 0,
            percent50: item.percent50 || 0,
            percent75: item.percent75 || 0,
            p100Complete: completedCount,
            cpmBid: item.cpmBid || item.bid || 0,
            budget: item.budget || 0,
            max_bid: item.maxBid || item.max_bid || 0,
            totalClicks: totalClicks,
            ctr: ctr,
            totalEcpc: item.totalEcpc || item.ecpc || 0,
            winPercentage: impressions > 0 ? ((impressions / (item.totalRequest || impressions)) * 100) : 0,
            conversion: item.conversion || item.conversions || 0,
            totalRpm: item.totalRpm || item.rpm || 0,
            roas: item.roas || item.roi || 0,
            groupPercentage: item.groupPercentage || item.platformFee || 0,
            totalRequest: item.totalRequest || 0,
            totalResponse: item.totalResponse || 0,
            completionRate: completionRate,
          };
        });
        setRowData(mappedData);
      } else {
        setRowData([]);
      }
    } catch (error) {
      console.error("Error fetching creative data:", error);
      Swal.fire("Error", "Failed to fetch creative data", "error");
      setRowData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  useEffect(() => {
    const keysToTry = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
    for (const key of keysToTry) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      try {
        const parsed = JSON.parse(saved);
        const normalized = normalizeSelectedColumns(parsed);
        setSelectedColumns(normalized);
        if (key !== STORAGE_KEY) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch (e) {
        console.error("Failed to parse saved columns", e);
      }
      break;
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedColumns));
  }, [selectedColumns]);
  
  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);
  
  useEffect(() => {
    initializePageTab("Ads Daily Reporting", "fa fa-bar-chart", "/admin/ads-daily-reporting");
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-bar-chart me-2"></i>
          Ads Daily Reporting
        </>
      ),
      route: "/admin/ads-daily-reporting",
    });
  }, [initializePageTab, updateTab]);

  const handleAddTab = () => {
    addTab({
      route: location.pathname,
      state: location.state,
      header: (
        <>
          <i className="fa fa-bar-chart me-2"></i>
          Ads Daily Reporting
        </>
      ),
    });
  };

  const openDailyCustomizationModal = () => setDailyCustomizationModalOpen(true);

  const getPresetRange = (preset) => {
    const today = new Date();
    let start, end;
    switch (preset) {
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
    return { startDate: start, endDate: end };
  };

  const isSameDateRange = (range1, range2) => {
    if (!range1 || !range2) return false;
    const d1Start = range1.startDate;
    const d1End = range1.endDate;
    const d2Start = range2.startDate;
    const d2End = range2.endDate;
    
    if (!d1Start || !d1End || !d2Start || !d2End) return false;
    
    return (
      d1Start.getFullYear() === d2Start.getFullYear() &&
      d1Start.getMonth() === d2Start.getMonth() &&
      d1Start.getDate() === d2Start.getDate() &&
      d1End.getFullYear() === d2End.getFullYear() &&
      d1End.getMonth() === d2End.getMonth() &&
      d1End.getDate() === d2End.getDate()
    );
  };

  const formatPickerValue = (date) => {
    if (!date) return "";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const redraw = () => setCount(count + 1);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    setDraftDateRange({ startDate: null, endDate: null });
    setSelectedLabel("");
    setAppliedDateRange(null);
    try {
      await delay(1000);
      await fetchCreativeData();
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch creative data when creativeId changes
  useEffect(() => {
    if (currentCreativeId && currentCreativeId !== "undefined" && currentCreativeId !== null) {
      console.log("Triggering fetch for creativeId only:", currentCreativeId);
      fetchCreativeData();
    } else {
      console.log("No valid creativeId available:", currentCreativeId);
      setRowData([]);
    }
  }, [currentCreativeId, appliedDateRange]);

  useEffect(() => {
    setSelectedIds([]);
  }, []);

  const handleQuickSelect = (type) => {
    const presetRange = getPresetRange(type);
    setDraftDateRange(presetRange);
    setSelectedLabel(type);
  };

  const formatDateRange = () => {
    if (appliedDateRange?.label) return appliedDateRange.label;
    if (appliedDateRange?.startDate && appliedDateRange?.endDate) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return `${appliedDateRange.startDate.toLocaleDateString(undefined, options)} - ${appliedDateRange.endDate.toLocaleDateString(undefined, options)}`;
    }
    return "All Dates";
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApply = async () => {
    setShowDateRangePicker(false);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate: draftDateRange.startDate,
      endDate: draftDateRange.endDate,
      label: selectedLabel,
      apiRange: apiRangeValue
    };
    setAppliedDateRange(dateRange);
    setLoading(false);
  };

  const handleApplyAll = async () => {
    setShowDateRangePicker(false);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate: draftDateRange.startDate,
      endDate: draftDateRange.endDate,
      label: selectedLabel,
      apiRange: apiRangeValue
    };
    setAppliedDateRange(dateRange);
    setLoading(false);
  };

  const handleClearDateRange = async () => {
    setDraftDateRange({ startDate: null, endDate: null });
    setSelectedLabel("");
    setAppliedDateRange(null);
    setShowDateRangePicker(false);
    setLoading(true);
    setLoading(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
    };
    if (showDateRangePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDateRangePicker]);

  const modalCallback = (doit) => {
    if (doit) {
      deleteAudience(id);
    }
    setModal(!modal);
  };

  const showModal = (e, x) => {
    if (e.ctrlKey) {
      deleteAudience(x);
      return;
    }
    setId(x);
    setModal(true);
  };

  const deleteAudience = async (id, key) => {
    await vx.deleteAudience(id, key);
    await vx.getDbAudience();
    setCreative(null);
    redraw();
  };

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
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
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
            if (typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))) {
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
    link.setAttribute("download", `Daily_Reporting_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
    setSelectedColumns(normalizeSelectedColumns(newSelectedColumns));
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
          ? "Please select a creative to view reporting data"
          : "No reporting data available for this creative"}
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
        backgroundColor: "#FBEDEF !important",
        "& .gOorhn": {
          color: "black !important",
        },
      },
    },
  ];

  return (

          <div className="content1">
            <div className="content-wrapper">
              {modal && (
                <DecisionModal
                  title="Really delete Group?"
                  message="Only the db admin can undo this if you delete it!!!"
                  name="DELETE"
                  callback={modalCallback}
                />
              )}
              {creative === null && (
                <>
                  <div className="campaign-daily-header dailyreporting-page-header">
                    <div>
                      <div className="campaign-daily-title dailyreporting-page-title">
                        <h2>Ads Daily Reporting</h2>
                      </div>
                    </div>
                  </div>

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

                      <Col md="2" className="position-relative dailyreporting-date-col">
                        <div ref={datePickerRef} >
                          <div className="cdi-date-filter dailyreporting-date-filter">
                            <div
                              className="cdi-date-display dailyreporting-date-display"
                              onClick={openDateRangePicker}
                            >
                              <FaCalendarAlt className="dailyreporting-date-display-icon" />
                              <span className="dailyreporting-date-display-label">
                                {formatDateRange()}
                              </span>
                              <FaCaretDown className="dailyreporting-date-display-caret" />
                            </div>

                            {showDateRangePicker && (
                              <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table dailyreporting-date-range-popup">
                                <div className="cd-date-range-presets">
                                  <div className="cd-date-range-presets-title">Preset Ranges</div>
                                  {[
                                    "Today",
                                    "Yesterday",
                                    "2 Days Ago",
                                    "Last 7 Days",
                                    "Last 30 Days",
                                  ].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      className={`cd-date-range-preset-btn ${isSameDateRange(draftDateRange, getPresetRange(preset)) ? "is-active" : ""}`}
                                      onClick={() => handleQuickSelect(preset)}
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
                                      setSelectedLabel("");
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
                                      onClick={handleClearDateRange}
                                    >
                                      Reset
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
                                      onClick={handleApply}
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
                      <Col xs="auto">
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
                      <Col md="3"></Col>
                      <Col xs="auto">
                        <Dropdown isOpen={dropdownOpen} toggle={toggle} className="new-dropdown"></Dropdown>
                      </Col>
                      <Col xs="auto" className="p-0">
                        <Button
                          type="btn"
                          className="cdi-export-btn dailyreporting-export-btn dailyreporting-export-btn-danger"
                          id="export"
                          onClick={exportToExcel}
                        >
                          <span className="lasttime">Export</span>
                        </Button>
                      </Col>
                      <Col xs="auto" className="">
                        <Button
                          type="btn"
                          className="cdi-export-btn dailyreporting-export-btn dailyreporting-export-btn-primary"
                          id="columns"
                          onClick={openDailyCustomizationModal}
                        >
                          <span className="lasttime">Customization Columns</span>
                        </Button>
                      </Col>
                    </Row>
                 
                  </div>
                  </CardBody>
                  </Card>

                  <DailyAdzCustomizationModal
                    isOpen={isDailyCustomizationModalOpen}
                    toggle={toggleDailyCustomizationModal}
                    selectedColumns={selectedColumns}
                    setSelectedColumns={handleColumnChange}
                    fixedColumns={[]}
                    defaultColumns={DEFAULT_SELECTED_COLUMNS}
                    availableColumns={Object.keys(ALL_COLUMNS)}
                  />
                  <div className="campaign-daily-table-wrapper dailyreporting-table-wrapper">
                    <div className="dailyreporting-table-shell">
                      <div className="dailyreporting-table-inner">
                        <DataTable
                          keyField="id"
                          className="data-table"
                          columns={buildColumns()}
                          data={filteredData}
                          customStyles={customStyles}
                          highlightOnHover
                          pointerOnHover
                          persistTableHead
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
              )}
            </div>
          </div>
      
  );
};

export default AdsDailyReporting;
