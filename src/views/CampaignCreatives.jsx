import React, { useState, useEffect, useMemo, useRef, Fragment, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
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
  CardBody
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaChevronDown } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faDownload, faChevronRight, faChevronDown, faCalendarAlt as faCalendarAltSolid } from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import { creativelist, getAllCampaign } from "./api/Api";
import { editGroupbrand } from "./api/Api";
import AdsCustomizationModal from "../views/customizationcolumns/AdsCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";
import AdsDailyReporting from "./AdsDailyReporting";
import AdsHourlyReporting from "./AdsHourlyReporting";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useGlobalTabs } from "../context/TabContext";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import LinkAdspop from "./Modal/LinkAds.jsx";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";

const getStatusText = (code) => {
  const statusMap = {
    1: "On",
    2: "Off",
    3: "Archived",
    "1": "On",
    "2": "Off",
    "3": "Archived"
  };
  return statusMap[code] || code;
};

const getStatusCode = (text) => {
  const statusMap = {
    "On": 1,
    "Off": 2,
    "Archived": 3
  };
  return statusMap[text] || text;
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
  "Name",
  "Type",
  "ID",
  "Imps Won",
  "Win Rate",
  "Destination URL",
  "Impression URL",
  "Impression URL",
  "25% Complete",
  "50% Complete",
  "75% Complete",
  "100% Complete",
  "Daily Reporting",
];

const CampaignCreatives = (props) => {
  const { brandId: urlBrandId, groupId: urlGroupId, campaignId: urlCampaignId } = useParams();
  const location = useLocation();
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [currentBrandId, setCurrentBrandId] = useState(props.brandId || urlBrandId || null);
  const [selectedDropdownCampaignId, setSelectedDropdownCampaignId] = useState("306");
  const [canViewAds, setCanViewAds] = useState(false);
  const [canCreateAds, setCanCreateAds] = useState(false);
  const [canEditAds, setCanEditAds] = useState(false);
  const [canDeleteAds, setCanDeleteAds] = useState(false);
  const [canUpdateAds, setCanUpdateAds] = useState(false);

  useEffect(() => {
    const hasCreatePermission = canCreate("Ads");
    const hasViewPermission = canView("Ads");
    const hasEditPermission = canEdit("Ads");
    const hasDeletePermission = canDelete("Ads");
    const hasUpdatePermission = canUpdate("Ads");
    setCanCreateAds(hasCreatePermission);
    setCanViewAds(hasViewPermission);
    setCanEditAds(hasEditPermission);
    setCanDeleteAds(hasDeletePermission);
    setCanUpdateAds(hasUpdatePermission);
  }, []);

  const [realBrandId, setRealBrandId] = useState(
    props.brandId || location.state?.brandId || localStorage.getItem('currentBrandId') || null
  );
  const [currentCampaignId, setCurrentCampaignId] = useState(
    props.campaignId || location.state?.campaignId || urlCampaignId || null
  );

  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const [currentGroupId, setCurrentGroupId] = useState(
    initialGroupId ? (initialGroupId !== "undefined" ? initialGroupId : null) : null
  );
  const [step, setStep] = useState(0);
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, } = useGlobalTabs();
  const [creativeData, setCreativeData] = useState([]);
  const [creativeLoading, setCreativeLoading] = useState(false);
  const [expandedCreativeData, setExpandedCreativeData] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (props.brandId && props.brandId !== currentBrandId) {
      setCurrentBrandId(props.brandId);
    }
  }, [props.brandId]);

  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.creativeId}
      </div>
    );
  };

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.name}
        {currentBrandId && (
          <span className="badge bg-secondary ms-2 reports-badge-inline">
          </span>
        )}
      </div>
    );
  };

  const CreativeActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    const navigate = useNavigate();
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog className="reports-action-icon" />
          <FaChevronDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem>Unlink</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const ActionStatusCell = ({ row }) => {
    const [currentStatus, setCurrentStatus] = useState(getStatusText(row.status || "On"));
    const [statusOpen, setStatusOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      if (row.status) {
        setCurrentStatus(getStatusText(row.status));
      }
    }, [row.status]);

    const toggleStatus = () => {
      if (!updating) {
        setStatusOpen(!statusOpen);
      }
    };

    return (
      <Dropdown isOpen={statusOpen} toggle={toggleStatus} disabled={updating}>
        <DropdownToggle
          tag="span"
          className={`reports-status-toggle ${currentStatus === "Archived" ? "is-archived" : ""} ${updating ? "is-updating" : ""}`}
        >
          {updating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
            </>
          ) : (
            <>
              {currentStatus}
              <FaCaretDown className="reports-caret-icon" />
            </>
          )}
        </DropdownToggle>
        <DropdownMenu className="audiencemenu">
          <DropdownItem
            active={currentStatus === "On"}
            disabled={updating}
          >
            <span className="conversionstatus">On</span>
          </DropdownItem>
          <DropdownItem
            active={currentStatus === "Archived"}
            disabled={updating}
          >
            <span className="conversionstatus"> Archived</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const ALL_COLUMNS = {
    "Name": {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "300px",
    },
    "Type": {
      name: "Type",
      selector: (row) => row.type,
      cell: (row) => <div className="gOorhn">{row.type || "-"}</div>,
      sortable: true,
      width: "100px",
    },
    "ID": {
      name: "ID",
      selector: (row) => row.creativeId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "120px",
    },
    "Status": {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <ActionStatusCell row={row} />,
      sortable: true,
      width: "90px",
    },
    "Imps Won": {
      name: "Imps Won",
      selector: (row) => row.totalWin,
      cell: (row) => <div className="gOorhn">{row.totalWin?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "120px",
    },
    "Win Rate": {
      name: "Win Rate",
      selector: (row) => row.winRate,
      cell: (row) => <div className="gOorhn">{row.winRate || "0%"}</div>,
      sortable: true,
      width: "100px",
    },
    "Starts": {
      name: "Starts",
      selector: (row) => row.startCount,
      cell: (row) => <div className="gOorhn">{row.startCount?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "100px",
    },
    "25% Complete": {
      name: "25% Complete",
      selector: (row) => row.percent25,
      cell: (row) => <div className="gOorhn">{row.percent25?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "50% Complete": {
      name: "50% Complete",
      selector: (row) => row.percent50,
      cell: (row) => <div className="gOorhn">{row.percent50?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "75% Complete": {
      name: "75% Complete",
      selector: (row) => row.percent75,
      cell: (row) => <div className="gOorhn">{row.percent75?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "100% Complete": {
      name: "100% Complete",
      selector: (row) => row.completeCount,
      cell: (row) => <div className="gOorhn">{row.completeCount?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "Completion Rate": {
      name: "Completion Rate",
      selector: (row) => row.completionRate,
      cell: (row) => <div className="gOorhn">{row.completionRate || "-"}</div>,
      sortable: true,
      width: "140px",
    },
    "Video Duration": {
      name: "Video Duration (s)",
      selector: (row) => row.vastVideoDuration,
      cell: (row) => <div className="gOorhn">{row.vastVideoDuration || 0}</div>,
      sortable: true,
      width: "140px",
    },
    "Audio/Video Starts": {
      name: "Audio/Video Starts",
      selector: (row) => row.startCount || 0,
      cell: (row) => <div className="gOorhn">{row.startCount != null ? Number(row.startCount).toLocaleString('en-US') : 0}</div>,
      sortable: true,
      width: "150px",
    },
    "Width": {
      name: "Width",
      selector: (row) => row.width,
      cell: (row) => <div className="gOorhn">{row.width || 0}</div>,
      sortable: true,
      width: "100px",
    },
    "Height": {
      name: "Height",
      selector: (row) => row.height,
      cell: (row) => <div className="gOorhn">{row.height || 0}</div>,
      sortable: true,
      width: "100px",
    },
    "Destination URL": {
      name: "Destination URL",
      selector: (row) => row.destinationUrl,
      cell: (row) => <div className="gOorhn reports-url-cell">{row.destinationUrl || "-"}</div>,
      sortable: false,
      width: "350px",
    },
    "Impression URL": {
      name: "Impression URL",
      selector: (row) => row.impressionTrackingUrl,
      cell: (row) => <div className="gOorhn reports-url-cell">{row.impressionTrackingUrl || "-"}</div>,
      sortable: false,
      width: "250px",
    },
    "Daily Reporting": {
      name: "Daily Reporting",
      selector: (row) => row.id,
      cell: (row) => (
        <Button
          color="success"
          size="sm"
          className="rounded-0"
          id="dailyreporting"
          onClick={() => {
            const creativeIdForNav = row.creativeId || row.id;
            console.log("Navigating to daily reporting with creativeId:", creativeIdForNav);
            // Navigate to the correct route structure
            navigate(
              `/admin/campaign/${creativeIdForNav}/detailed-ad-view/daily-reporting`,
              {
                state: {
                  creativeId: creativeIdForNav,
                  adName: row.name,
                  creativeName: row.name,
                },
              }
            );
          }}
        >
          View daily Report
        </Button>
      ),
      sortable: true,
      width: "150px",
    },
  };

  const loadDataOnce = async () => {
    // await vx.getDbAudience();
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const togglegroupModal = () => setGroupModalOpen(!groupModalOpen);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [adscustomizationModal, setAdsCustomizationModalOpen] = useState(false);
  const toggleAdsCustomizationModal = () => setAdsCustomizationModalOpen(!adscustomizationModal);
  const openAdsCustomizationModal = () => setAdsCustomizationModalOpen(true);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = 'creativeListSelectedColumns';

  const fetchCreativeList = async (campaignId, creativeId = "", startDateVal = null, endDateVal = null) => {
    if (!campaignId) {
      setCreativeData([]);
      return;
    }

    setCreativeLoading(true);
    try {
      const payload = {
        campaignId: campaignId.toString(),
        creativeId: creativeId || "",
        startDate: startDateVal ? new Date(startDateVal).toISOString().split('T')[0] : "",
        endDate: endDateVal ? new Date(endDateVal).toISOString().split('T')[0] : ""
      };
      const response = await creativelist(payload);

      let creativeList = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        creativeList = response.data.data;
      } else if (Array.isArray(response.data)) {
        creativeList = response.data;
      } else {
        creativeList = response.data || [];
      }

      const mapped = creativeList.map(item => {
        const winRate = item.totalWin 
          ? `${Number((item.totalWin / (item.totalWin + (item.totalLoss || 0))) * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` 
          : "0%";
        const completionRate = item.startCount > 0 && item.completeCount
          ? `${Number((item.completeCount / item.startCount) * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
          : item.startCount > 0 && item.percent75
            ? `${Number((item.percent75 / item.startCount) * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
            : "0%";
        return {
          id: item.creativeId,
          creativeId: item.creativeId,
          name: item.name,
          type: item.type,
          totalWin: item.totalWin || 0,
          startCount: item.startCount || 0,
          percent25: item.percent25 || 0,
          percent50: item.percent50 || 0,
          percent75: item.percent75 || 0,
          completeCount: item.completeCount || 0,
          vastVideoDuration: item.vastVideoDuration || 0,
          destinationUrl: item.destinationUrl || "",
          impressionTrackingUrl: item.impressionTrackingUrl || "",
          width: item.width || 0,
          height: item.height || 0,
          winRate: winRate,
          completionRate: completionRate,
          status: item.status || "On",
        };
      });

      setCreativeData(mapped);
    } catch (err) {
      console.error("Error fetching creatives:", err);
      setCreativeData([]);
    } finally {
      setCreativeLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setSelectedColumns([
            ...parsed.filter((column) => ALL_COLUMNS[column]),
            ...DEFAULT_SELECTED_COLUMNS.filter((column) => !parsed.includes(column)),
          ]);
        }
      } catch (e) {
        console.error('Failed to parse saved columns', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);

  useEffect(() => {
    let campaignId = currentCampaignId;

    if (!campaignId && props.campaignId) {
      campaignId = props.campaignId;
    }
    if (!campaignId && location.state?.campaignId) {
      campaignId = location.state.campaignId;
    }

    if (campaignId && campaignId !== "undefined" && campaignId !== null) {
      console.log("Fetching creative list for campaign ID:", campaignId);
      setCurrentCampaignId(campaignId);
      fetchCreativeList(campaignId, "", startDate, endDate);
    } else {
      console.log("No valid campaign ID available for creative list");
      setCreativeData([]);
    }
  }, [currentCampaignId, props.campaignId, location.state?.campaignId, startDate, endDate]);

  useEffect(() => {
    initializePageTab("Campaign Creatives", "tim-icons icon-chart-bar-32", location.pathname);
  }, [initializePageTab, location.pathname]);

  useEffect(() => {
    if (selectedDropdownCampaignId) {
      console.log("Fetching creatives for campaign:", selectedDropdownCampaignId);
      fetchCreativeList(selectedDropdownCampaignId, "", startDate, endDate);
    }
  }, [selectedDropdownCampaignId, startDate, endDate]);

  useEffect(() => {
    updateTab("default", {
      header: (
        <>
          <i className="tim-icons icon-chart-bar-32 me-2"></i>
          Campaign Creatives
        </>
      ),
    });
  }, [updateTab]);

  const redraw = () => {
    setCount(count + 1);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const refresh = async () => {
    setLoading(true);
    try {
      await delay(1000);
      if (selectedDropdownCampaignId) {
        console.log("Refreshing creatives for campaign:", selectedDropdownCampaignId);
        await fetchCreativeList(selectedDropdownCampaignId, "", startDate, endDate);
      }
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  }

  const dateRangePopupRef = useRef(null);
  const tableDateRangeRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateRangeLabel, setDateRangeLabel] = useState("All time");

  useEffect(() => {
    const handleClickOutside = (event) => {
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
    setDateRangeLabel("All time");
    setShowDateRangePicker(false);
  }, []);

  const handleDateRangeApply = useCallback(() => {
    setStartDate(draftDateRange.startDate);
    setEndDate(draftDateRange.endDate);

    let foundPreset = null;
    const presets = ["Today", "Last 7 days", "Yesterday", "Last 30 days", "This month", "Last month", "Last 3 months"];
    for (const preset of presets) {
      if (isSameDateRange(draftDateRange, getPresetRange(preset))) {
        foundPreset = preset;
        break;
      }
    }

    if (foundPreset) {
      setDateRangeLabel(foundPreset);
    } else {
      const startStr = formatPickerValue(draftDateRange.startDate);
      const endStr = formatPickerValue(draftDateRange.endDate);
      setDateRangeLabel(`${startStr} - ${endStr}`);
    }

    setShowDateRangePicker(false);
  }, [draftDateRange, getPresetRange, formatPickerValue]);

  const openDateRangePicker = () => {
    setShowDateRangePicker((prev) => !prev);
  };

  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading && creativeData.length > 0) {
      setSelectedIds([creativeData[0].id]);
    }
  }, [loading, creativeData]);

  useEffect(() => {
    if (currentBrandId) {
      //fetchGroupList();
    }
  }, [currentBrandId]);

  const filteredData = useMemo(() => {
    return creativeData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [creativeData, searchTerm]);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);
  const campaignRef = useRef(null);
  const campaignPortalRef = useRef(null);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [campaignDropdownPosition, setCampaignDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredCampaign, setHoveredCampaign] = useState(null);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");

  const filteredDropdownCampaigns = useMemo(() => {
    const query = campaignSearchTerm.trim().toLowerCase();
    return (Array.isArray(allCampaigns) ? allCampaigns : []).filter((campaign) => {
      const val = String(campaign.id || campaign.campaignId || campaign.name || 0);
      const label = String(campaign.name || campaign.campaignName || val);
      return !query || label.toLowerCase().includes(query) || val.toLowerCase().includes(query);
    });
  }, [allCampaigns, campaignSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (campaignRef.current && !campaignRef.current.contains(event.target)) {
        const portalNode = campaignPortalRef.current;
        if (portalNode && portalNode.contains(event.target)) {
          return;
        }
        setCampaignSearchTerm("");
        setHoveredCampaign(null);
        setIsCampaignOpen(false);
      }
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
    if (isCampaignOpen && campaignRef.current) {
      const updatePosition = () => {
        const rect = campaignRef.current.getBoundingClientRect();
        setCampaignDropdownPosition({
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
  }, [isCampaignOpen]);

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

  const isAllFilteredSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every(item => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);

  const handleSelectAllChange = () => {
    const filteredIds = filteredData.map(item => item.id);
    if (isAllFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const newSelected = [...prev];
        filteredIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const CustomLoader = () => (
    <div className="customloader" >
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nogroupdataavilable">
      <div className="py-4 text-secondary">
        {currentCampaignId ? "No creative data available for this campaign" : "No campaign selected"}
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
        height: "57px",
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
    const orderedColumnKeys = [
      ...selectedColumns.filter((columnKey) => columnKey !== "Daily Reporting"),
      ...(selectedColumns.includes("Daily Reporting") ? ["Daily Reporting"] : []),
    ];

    orderedColumnKeys.forEach((columnKey) => {
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
        // backgroundColor: '#59823a !important',
        '& .gOorhn': {
          // color: 'white !important',
        }
      },
    },
  ];

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleNewAudienceClick = () => {
    if (currentBrandId) {
      setSelectedGroup({
        brandId: currentBrandId,
        status: "On"
      });
    }
    setGroupModalOpen(true);
  };

  const handleColumnChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
  };

  useEffect(() => {

  }, [showArchived]);

  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export");
      return;
    }
    const rows = filteredData.map((row) => {
      const rowData = {};
      selectedColumns.forEach((colKey) => {
        const column = ALL_COLUMNS[colKey];
        if (column && column.selector) {
          let value = column.selector(row);
          if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value);
          }
          rowData[colKey] = value;
        } else {
          rowData[colKey] = row[colKey] || "";
        }
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Creatives");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "creatives_export.xlsx");
  };

  useEffect(() => {
    const fetchDropdownCampaigns = async () => {
      try {
        console.log("Fetching dropdown campaigns...");
        const res = await getAllCampaign();
        console.log("Dropdown campaigns API response:", res);

        let list = [];
        let rData = res.data;

        if (typeof rData === 'string') {
          try { rData = JSON.parse(rData); } catch (e) { }
        }

        if (rData?.data?.informationCampaigns && Array.isArray(rData.data.informationCampaigns)) {
          list = rData.data.informationCampaigns;
        } else if (rData?.informationCampaigns && Array.isArray(rData.informationCampaigns)) {
          list = rData.informationCampaigns;
        } else if (rData?.data && Array.isArray(rData.data)) {
          list = rData.data;
        } else if (Array.isArray(rData)) {
          list = rData;
        } else if (rData && typeof rData === 'object') {
          for (const key in rData) {
            if (Array.isArray(rData[key])) {
              list = rData[key];
              break;
            }
          }
        }

        console.log("Parsed campaigns list:", list);
        setAllCampaigns(list);

        if (list.length > 0 && selectedDropdownCampaignId === "306") {
          const firstCamp = list[0];
          const firstVal = firstCamp.id || firstCamp.campaignId || firstCamp.name || 306;
          setSelectedDropdownCampaignId(firstVal.toString());
        }
      } catch (err) {
        console.error("Failed to fetch campaigns for dropdown", err);
      }
    };
    fetchDropdownCampaigns();
  }, []);

  return (
    <div className="campaign-daily-container">
      <AdsCustomizationModal
        isOpen={adscustomizationModal}
        toggle={toggleAdsCustomizationModal}
        selectedColumns={selectedColumns}
        setSelectedColumns={handleColumnChange}
        defaultColumns={DEFAULT_SELECTED_COLUMNS}
        availableColumns={Object.keys(ALL_COLUMNS)}
      />

      {creative === null && canViewAds && (
        <>
          <div className="campaign-daily-header reports-page-header">
            <div>
              <div className="campaign-daily-title">
                <h2>Creatives</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3 reports-card">
            <CardBody className="py-3 reports-card-body">
              <div className="reports-toolbar-grid">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div
                    className="reports-date-range-wrapper"
                    ref={tableDateRangeRef}
                  >
                    <button
                      type="button"
                      className="db-select reports-date-range-trigger"
                      onClick={openDateRangePicker}
                    >
                      <div className="reports-date-range-trigger-inner">
                        <FontAwesomeIcon icon={faCalendarAltSolid} size="sm" />
                        <span className="reports-date-range-label">{dateRangeLabel}</span>
                      </div>
                    </button>
                    {showDateRangePicker && (
                      <div className="reports-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table" ref={dateRangePopupRef}>
                        <div className="reports-date-range-presets">
                          <div className="reports-date-range-presets-title">Preset Ranges</div>
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
                              className={`reports-date-range-preset-btn ${isSameDateRange(draftDateRange, getPresetRange(preset)) ? "is-active" : ""}`}
                              onClick={() => handlePresetSelect(preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        <div className="reports-date-range-panel">
                          <div className="reports-date-range-fields">
                            <div className="reports-date-range-field">
                              <span className="reports-date-range-field-label">From</span>
                              <div className={`reports-date-range-field-value ${!draftDateRange.startDate ? "is-empty" : ""}`}>
                                {formatPickerValue(draftDateRange.startDate)}
                              </div>
                            </div>
                            <div className="reports-date-range-field">
                              <span className="reports-date-range-field-label">To</span>
                              <div className={`reports-date-range-field-value ${!draftDateRange.endDate ? "is-empty" : ""}`}>
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
                          <div className="reports-date-range-footer">
                            <button
                              type="button"
                              className="reports-date-range-btn"
                              onClick={handleDateRangeClear}
                              disabled={!draftDateRange.startDate && !draftDateRange.endDate}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="reports-date-range-btn"
                              onClick={() => setShowDateRangePicker(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="reports-date-range-btn reports-date-range-btn-primary"
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
                  <div className="reports-campaign-filter">
                    <span className="reports-campaign-label">Campaign:</span>
                    <div ref={campaignRef} className="reports-campaign-control">
                      <div className="campaign-select-wrapper">
                        <input
                          readOnly
                          value={selectedDropdownCampaignId ? (Array.isArray(allCampaigns) ? allCampaigns : []).find(c => String(c.id || c.campaignId || c.name) === String(selectedDropdownCampaignId))?.name || selectedDropdownCampaignId : 'Select Campaign'}
                          className="campaign-select-input reports-campaign-input"
                          onClick={() => {
                            setCampaignSearchTerm("");
                            setHoveredCampaign(null);
                            setIsCampaignOpen((open) => !open);
                          }}
                        />
                        <FaChevronDown className={`reports-campaign-caret ${isCampaignOpen ? 'is-open' : ''}`} />
                      </div>
                      {isCampaignOpen &&
                        typeof document !== 'undefined' &&
                        createPortal(
                          <div
                            ref={campaignPortalRef}
                            className="reports-campaign-dropdown-menu custom-dropdown-menu biddeript-bd"
                            style={{
                              '--dropdown-top': `${campaignDropdownPosition.top}px`,
                              '--dropdown-left': `${campaignDropdownPosition.left}px`,
                            }}
                          >
                            <div className="reports-campaign-search-wrap">
                              <input
                                type="text"
                                value={campaignSearchTerm}
                                onChange={(e) => setCampaignSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Search campaign"
                                autoFocus
                                className="reports-campaign-search-input"
                              />
                            </div>
                            {filteredDropdownCampaigns.map((c) => {
                              const val = String(c.id || c.campaignId || c.name || 0);
                              const isSelected = String(selectedDropdownCampaignId) === val;
                              const isHovered = hoveredCampaign === val;

                              return (
                                <div
                                  key={val}
                                  onClick={() => {
                                    setSelectedDropdownCampaignId(val);
                                    setCampaignSearchTerm("");
                                    setHoveredCampaign(null);
                                    setIsCampaignOpen(false);
                                  }}
                                  onMouseEnter={() => setHoveredCampaign(val)}
                                  onMouseLeave={() => setHoveredCampaign(null)}
                                  className={`reports-campaign-option reports-dropdown-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                >
                                  <span
                                    className={`reports-dropdown-tick ${isSelected || isHovered ? 'active' : ''}`}
                                  >
                                    {isSelected && '✓'}
                                  </span>
                                  <span className={`reports-dropdown-label ${isSelected || isHovered ? 'active' : ''}`}>
                                    {c.name || c.campaignName || val}
                                  </span>
                                </div>
                              );
                            })}
                            {filteredDropdownCampaigns.length === 0 && (
                              <div className="reports-campaign-empty-state">
                                No campaigns found
                              </div>
                            )}
                          </div>,
                          document.body,
                        )}
                    </div>
                  </div>
                  <button className="cdi-icon-btn reports-refresh-btn" onClick={refresh}>
                    <FontAwesomeIcon
                      icon={faSync}
                      className={loading ? "fa-spin" : ""}
                    />
                    Refresh
                  </button>
                </div>

                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="reports-pagination-summary">
                    {filteredData.length ? `${currentPage} of ${totalPages}` : "0 of 0"}
                  </div>
                  <div className="reports-pagination-toolbar">
                    {totalPages > 1 && (
                      <div className="reports-pagination-controls">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="cd-pagination-nav-btn"
                          type="button"
                        >
                          <i className="fa fa-chevron-left" />
                        </button>
                        <button className="reports-pagination-page-btn is-active" type="button">
                          {currentPage}
                        </button>
                        <span className="reports-gutter">of</span>
                        <button className="reports-pagination-page-btn" type="button">
                          {totalPages}
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
                              value={`${perPage} per page`}
                              className="campaign-select-input reports-per-page-input"
                              onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                            />
                            <FaChevronDown className={`reports-select-chevron ${isPerPageOpen ? 'is-open' : ''}`} />
                          </div>
                          {isPerPageOpen &&
                            typeof document !== 'undefined' &&
                            createPortal(
                              <div
                                ref={perPagePortalRef}
                                className="reports-per-page-menu custom-dropdown-menu biddeript-bd"
                                style={{
                                  '--per-page-top': `${perPageDropdownPosition.top}px`,
                                  '--per-page-left': `${perPageDropdownPosition.left}px`,
                                }}
                              >
                                {[10, 20, 25, 50, 100, 250, 500].map((value) => {
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
                                      className={`reports-per-page-option reports-dropdown-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                    >
                                      <span
                                        className={`reports-dropdown-tick ${isSelected || isHovered ? 'active' : ''}`}
                                      >
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
                  <button className="cdi-export-btn reports-export-btn reports-export-btn-danger" onClick={exportToExcel}>
                    <FontAwesomeIcon icon={faDownload} /> EXPORT
                  </button>
                  <button className="cdi-export-btn reports-export-btn reports-export-btn-primary" onClick={openAdsCustomizationModal}>
                    <FaCog /> COLUMNS
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
          <div className={`reports-table-wrapper ${loading ? 'is-loading' : ''}`}>
            {loading && (
              <div className="reports-loading-overlay">
                <div className="customloader reports-inline-loader">
                  <div className="loader" role="status"></div>
                  <span className="ms-2 fw-bold">Loading...</span>
                </div>
              </div>
            )}
            <div className={`reports-table-shell ${loading ? 'is-loading' : 'not-loading'}`}>
              <div className="reports-table-inner">
                <DataTable
                  keyField="id"
                  className="Adzdatatable"
                  columns={buildColumns()}
                  data={paginatedData}
                  customStyles={customStyles}
                  highlightOnHover
                  pointerOnHover
                  persistTableHead
                  fixedHeader
                  fixedHeaderScrollHeight="100%"
                  responsive={false}
                  onRowClicked={handleRowClicked}
                  noDataComponent={
                    loading ? (
                      <div className="reports-empty-state" />
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
        </>
      )}
      {creative === null && !canViewAds && (
        <div className="alert alert-warning mt-3 reports-access-denied">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Ads.
        </div>
      )}
    </div>
  );
};

export default CampaignCreatives;
