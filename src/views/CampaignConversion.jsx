import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaChevronDown } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faDownload, faChevronRight, faChevronDown as faChevronDownSolid, faCalendarAlt as faCalendarAltSolid } from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import ConversionCustomizationModal from "../views/customizationcolumns/ConversionCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getgroupByDateRange } from "../views/api/Api";
import { canView } from "../utils/permissionHelper";
import "../assets/css/reports.css";

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
  "Status",
  "ID",
  "Imps. Won",
  "Win Rate",
  "Adv. Spend eCPM",
  "Total eCPM",
  "Media eCPM",
  "Data eCPM",
];

const CampaignConversion = (props) => {
  const { brandId: urlBrandId } = useParams();
  const [currentBrandId, setCurrentBrandId] = useState(props.brandId || urlBrandId || localStorage.getItem('currentBrandId') || null);

  useEffect(() => {
    if (props.brandId && props.brandId !== currentBrandId) {
      setCurrentBrandId(props.brandId);
    }
  }, [props.brandId]);

  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.groupId}
      </div>
    );
  };

  const BudgetCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue = typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[$,]/g, '')) || 0;

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    };

    return (
      <div className="gOorhn">
        {formatCurrency(row.budget)}
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

  const GBOCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.gbo_status}
      </div>
    );
  };

  const StartDateCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.startDate}
      </div>
    );
  };

  const EndDateCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.endDate}
      </div>
    );
  };

  const KPICell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.kpimetric}
      </div>
    );
  };

  const KPIValueCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.kpivalue}
      </div>
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
          className={`onoffbutton reports-status-toggle ${currentStatus === "Archived" ? "is-archived" : ""} ${updating ? "is-updating" : ""}`}
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
        <DropdownMenu className="audiencemenu reports-status-menu">
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
    "Status": {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <ActionStatusCell row={row} />,
      sortable: true,
      width: "90px",
    },
    "ID": {
      name: "ID",
      selector: (row) => row.groupId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "62px",
    },
    "Daily Budget": {
      name: "Daily Budget",
      selector: (row) => row.budget,
      cell: (row) => <BudgetCell row={row} />,
      sortable: true,
      width: "162px",
    },
    "Imps. Won": {
      name: "Imps. Won",
      selector: (row) => row.impressionsWon || 0,
      cell: (row) => <div className="gOorhn">{row.impressionsWon || 0}</div>,
      sortable: true,
      width: "120px",
    },
    "Win Rate": {
      name: "Win Rate",
      selector: (row) => row.winRate || "0%",
      cell: (row) => <div className="gOorhn">{row.winRate || "0%"}</div>,
      sortable: true,
      width: "100px",
    },
    "Adv. Spend eCPM": {
      name: "Adv. Spend eCPM",
      selector: (row) => row.advSpendECPM || "$0.00",
      cell: (row) => <div className="gOorhn">{row.advSpendECPM || "$0.00"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total eCPM": {
      name: "Total eCPM",
      selector: (row) => row.totalECPM || "$0.00",
      cell: (row) => <div className="gOorhn">{row.totalECPM || "$0.00"}</div>,
      sortable: true,
      width: "120px",
    },
    "Media eCPM": {
      name: "Media eCPM",
      selector: (row) => row.mediaECPM || "$0.00",
      cell: (row) => <div className="gOorhn">{row.mediaECPM || "$0.00"}</div>,
      sortable: true,
      width: "120px",
    },
    "Data eCPM": {
      name: "Data eCPM",
      selector: (row) => row.dataECPM || "$0.00",
      cell: (row) => <div className="gOorhn">{row.dataECPM || "$0.00"}</div>,
      sortable: true,
      width: "120px",
    },
    "Total Eligible Imps.": {
      name: "Total Eligible Imps.",
      selector: (row) => row.totalEligibleImps || 0,
      cell: (row) => <div className="gOorhn">{row.totalEligibleImps || 0}</div>,
      sortable: true,
      width: "150px",
    },
    "Total Measured Imps.": {
      name: "Total Measured Imps.",
      selector: (row) => row.totalMeasuredImps || 0,
      cell: (row) => <div className="gOorhn">{row.totalMeasuredImps || 0}</div>,
      sortable: true,
      width: "150px",
    },
    "Total Viewable Imps.": {
      name: "Total Viewable Imps.",
      selector: (row) => row.totalViewableImps || 0,
      cell: (row) => <div className="gOorhn">{row.totalViewableImps || 0}</div>,
      sortable: true,
      width: "150px",
    },
    "Measured Rate": {
      name: "Measured Rate",
      selector: (row) => row.measuredRate || "0%",
      cell: (row) => <div className="gOorhn">{row.measuredRate || "0%"}</div>,
      sortable: true,
      width: "120px",
    },
    "Viewable Rate": {
      name: "Viewable Rate",
      selector: (row) => row.viewableRate || "0%",
      cell: (row) => <div className="gOorhn">{row.viewableRate || "0%"}</div>,
      sortable: true,
      width: "120px",
    },
    "Eligible Spend": {
      name: "Eligible Spend",
      selector: (row) => row.eligibleSpend || "$0.00",
      cell: (row) => <div className="gOorhn">{row.eligibleSpend || "$0.00"}</div>,
      sortable: true,
      width: "130px",
    },
    "Eligible vCPM": {
      name: "Eligible vCPM",
      selector: (row) => row.eligibleVCPM || "$0.00",
      cell: (row) => <div className="gOorhn">{row.eligibleVCPM || "$0.00"}</div>,
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
    "Default Bid": {
      name: "Default Bid",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Max Bid": {
      name: "Max Bid",
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
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
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
    "Clicks": {
      name: "Clicks",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
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
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "CTR": {
      name: "CTR",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "EPC": {
      name: "EPC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Companion Imps. Won": {
      name: "Companion Imps. Won",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Companion Clicks": {
      name: "Companion Clicks",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Companion CTC": {
      name: "Companion CTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Companion CTC Revenue": {
      name: "Companion CTC Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total Conversions": {
      name: "Total Conversions",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "CTC": {
      name: "CTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "VTC": {
      name: "VTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Adv. Spend eCPA": {
      name: "Adv. Spend eCPA",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total Revenue": {
      name: "Total Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "CTC Revenue": {
      name: "CTC Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "VTC Revenue": {
      name: "VTC Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "25% Complete": {
      name: "25% Complete",
      selector: (row) => row.p25Complete || 0,
      cell: (row) => <div className="gOorhn">{row.p25Complete || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "50% Complete": {
      name: "50% Complete",
      selector: (row) => row.p50Complete || 0,
      cell: (row) => <div className="gOorhn">{row.p50Complete || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "75% Complete": {
      name: "75% Complete",
      selector: (row) => row.p75Complete || 0,
      cell: (row) => <div className="gOorhn">{row.p75Complete || 0}</div>,
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
    "CPM Bid Range": {
      name: "CPM Bid Range",
      selector: (row) => row.cpmBidRange || "-",
      cell: (row) => <div className="gOorhn">{row.cpmBidRange || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total Spend": {
      name: "Total Spend",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => <div className="gOorhn">{row.totalSpend || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total eCPA": {
      name: "Total eCPA",
      selector: (row) => row.totalECPA || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPA || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "CTC eCPA": {
      name: "CTC eCPA",
      selector: (row) => row.ctcECPA || "-",
      cell: (row) => <div className="gOorhn">{row.ctcECPA || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Click CVR": {
      name: "Click CVR",
      selector: (row) => row.clickCVR || "-",
      cell: (row) => <div className="gOorhn">{row.clickCVR || "-"}</div>,
      sortable: true,
      width: "120px",
    },
    "View CVR": {
      name: "View CVR",
      selector: (row) => row.viewCVR || "-",
      cell: (row) => <div className="gOorhn">{row.viewCVR || "-"}</div>,
      sortable: true,
      width: "120px",
    },
    "Total CVRM": {
      name: "Total CVRM",
      selector: (row) => row.totalCVRM || "-",
      cell: (row) => <div className="gOorhn">{row.totalCVRM || "-"}</div>,
      sortable: true,
      width: "130px",
    },
    "Primary Conv": {
      name: "Primary Conv",
      selector: (row) => row.primaryConv || "-",
      cell: (row) => <div className="gOorhn">{row.primaryConv || "-"}</div>,
      sortable: true,
      width: "130px",
    },
    "Primary CTC": {
      name: "Primary CTC",
      selector: (row) => row.primaryCTC || "-",
      cell: (row) => <div className="gOorhn">{row.primaryCTC || "-"}</div>,
      sortable: true,
      width: "130px",
    },
    "Primary VTC": {
      name: "Primary VTC",
      selector: (row) => row.primaryVTC || "-",
      cell: (row) => <div className="gOorhn">{row.primaryVTC || "-"}</div>,
      sortable: true,
      width: "130px",
    },
    "Primary Adv.Spend eCPA": {
      name: "Primary Adv.Spend eCPA",
      selector: (row) => row.primaryAdvSpendECPA || "-",
      cell: (row) => <div className="gOorhn">{row.primaryAdvSpendECPA || "-"}</div>,
      sortable: true,
      width: "190px",
    },
    "Primary Conv. eCPA": {
      name: "Primary Conv. eCPA",
      selector: (row) => row.primaryConvECPA || "-",
      cell: (row) => <div className="gOorhn">{row.primaryConvECPA || "-"}</div>,
      sortable: true,
      width: "160px",
    },
    "Primary CTC eCPA": {
      name: "Primary CTC eCPA",
      selector: (row) => row.primaryCTCeCPA || "-",
      cell: (row) => <div className="gOorhn">{row.primaryCTCeCPA || "-"}</div>,
      sortable: true,
      width: "160px",
    },
    "Total RPM": {
      name: "Total RPM",
      selector: (row) => row.totalRPM || "-",
      cell: (row) => <div className="gOorhn">{row.totalRPM || "-"}</div>,
      sortable: true,
      width: "120px",
    },
    "Click RPM": {
      name: "Click RPM",
      selector: (row) => row.clickRPM || "-",
      cell: (row) => <div className="gOorhn">{row.clickRPM || "-"}</div>,
      sortable: true,
      width: "120px",
    },
    "ROAS": {
      name: "ROAS",
      selector: (row) => row.roas || "-",
      cell: (row) => <div className="gOorhn">{row.roas || "-"}</div>,
      sortable: true,
      width: "100px",
    },
    "Total Request": {
      name: "Total Request",
      selector: (row) => row.totalRequest || 0,
      cell: (row) => <div className="gOorhn">{row.totalRequest || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "Total Response": {
      name: "Total Response",
      selector: (row) => row.totalResponse || 0,
      cell: (row) => <div className="gOorhn">{row.totalResponse || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "Total Win %": {
      name: "Total Win %",
      selector: (row) => row.totalWinPct || "0%",
      cell: (row) => <div className="gOorhn">{row.totalWinPct || "0%"}</div>,
      sortable: true,
      width: "120px",
    },
  };

  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [conversioncustomizationModal, setConversionCustomizationModalOpen] = useState(false);
  const toggleConversionCustomizationModal = () => setConversionCustomizationModalOpen(!conversioncustomizationModal);
  const openConversionCustomizationModal = () => setConversionCustomizationModalOpen(true);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = 'groupListSelectedColumns';
  const [canViewUser, setCanViewUser] = useState(false);
  useEffect(() => {
    const hasViewPermission = canView("Conversions");
    setCanViewUser(hasViewPermission);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setSelectedColumns(parsed);
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

  const redraw = () => {
    setCount(count + 1);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const refresh = async () => {
    setLoading(true);
    try {
      await delay(1000);
      if (showArchived) {
      } else if (appliedDateRange) {
        await fetchgroupListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.label
        );
      } else {
        //await fetchGroupList();
      }
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  }

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const dateRangePopupRef = useRef(null);
  const tableDateRangeRef = useRef(null);
  const perPageRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [dateRangeLabel, setDateRangeLabel] = useState("All time");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
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
      window.addEventListener("scroll", updatePosition);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition);
      };
    }
  }, [isPerPageOpen]);

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

  const handleDateRangeApply = useCallback(async () => {
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

    let labelToUse = foundPreset || "";
    if (foundPreset) {
      setDateRangeLabel(foundPreset);
    } else {
      const startStr = formatPickerValue(draftDateRange.startDate);
      const endStr = formatPickerValue(draftDateRange.endDate);
      setDateRangeLabel(`${startStr} - ${endStr}`);
    }

    setShowDateRangePicker(false);

    // Set appliedDateRange for consistency with other parts of the component
    setAppliedDateRange({ startDate: draftDateRange.startDate, endDate: draftDateRange.endDate, label: labelToUse });

    setLoading(true);
    try {
      await fetchgroupListByDateRange(draftDateRange.startDate, draftDateRange.endDate, labelToUse);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
    } finally {
      setLoading(false);
    }
  }, [draftDateRange, getPresetRange, formatPickerValue]);

  const openDateRangePicker = () => {
    setShowDateRangePicker((prev) => !prev);
  };

  const steps = [
    { label: "Campaigns", icon: "icon-world" },
  ];

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
    if (!loading && rowData.length > 0) {
      setSelectedIds([rowData[0].id]);
    }
  }, [loading, rowData]);
  useEffect(() => {
    if (currentBrandId) {
      // fetchGroupList();
    }
  }, [currentBrandId]);

 
  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

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
      <div className="py-4  text-secondary">
        {currentBrandId ? "No Group data available for this brand" : "No data available"}
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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, currentPage, perPage]);
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
        backgroundColor: '#59823a !important',
        '& .gOorhn': {
          color: 'white !important',
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

  const handleGroupSave = (savedConversion) => {

    setSelectedGroup(null);
    setLoading(true);
    setTimeout(() => {
      if (showArchived) {
      } else if (appliedDateRange) {
        fetchgroupListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.apiRange || appliedDateRange.label
        );
      } else {
      }
    }, 800);
  };

  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    // get current columns, ignore the checkbox column (which has an object as name) and Actions column
    const currentColumns = buildColumns().filter(c => c.name !== 'Actions' && typeof c.name === 'string');
    const headers = currentColumns.map(c => c.name).join(",");

    const csvRows = filteredData.map(row => {
      return currentColumns.map(col => {
        let val = "";
        if (col.selector) {
          val = col.selector(row);
        } else {
          switch (col.name) {
            case "ID": val = row.groupId || row.id; break;
            case "Name": val = row.name; break;
            case "Status": val = row.status; break;
            case "Budget": val = row.budget; break;
            case "GBO": val = row.gbo_status; break;
            case "Start Date": val = row.startDate; break;
            case "End Date": val = row.endDate; break;
            case "KPI Metric": val = row.kpimetric; break;
            case "KPI Value": val = row.kpivalue; break;
            case "Imps. Won": val = row.impressionsWon; break;
            case "Win Rate": val = row.winRate; break;
            case "Adv. Spend eCPM": val = row.advSpendECPM; break;
            case "Total eCPM": val = row.totalECPM; break;
            case "Media eCPM": val = row.mediaECPM; break;
            case "Data eCPM": val = row.dataECPM; break;
            default: val = "";
          }
        }
        if (val === undefined || val === null) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `campaign_conversion_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleColumnChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
  };


  const fetchgroupListByDateRange = async (start, end, range = null) => {
    try {
      const formattedStartDate = formatDateForAPI(start);
      const formattedEndDate = formatDateForAPI(end);

      if (!formattedStartDate || !formattedEndDate) {
        console.log("No date range specified, fetching all data");
        //await fetchGroupList();
        return;
      }

      console.log("Fetching universal with date range:", {
        brandId: currentBrandId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        range
      });
      const res = await getgroupByDateRange(
        currentBrandId || 0,
        formattedStartDate,
        formattedEndDate,
        range
      );
      console.log("CRM Date range API Response:", res?.data);
      let list = [];
      if (res?.data?.data?.informationGroups) {
        list = res.data.data.informationGroups;
      } else if (res?.data?.informationGroups) {
        list = res.data.informationGroups;
      } else if (res?.data?.data) {
        list = res.data.data;
      } else {
        list = res?.data || [];
      }
      const formatted = list.map((item) => ({
        id: item.groupId || item.id || item.groupId,
        groupId: item.groupId || item.groupId || item.groupId,
        name: item.name || item.name || "Unnamed Group",
        status: getStatusText(item.status || 1),
        budget: item.budget || item.budget || "0",
        gbo_status: item.gbo_status || item.gbo_status || "Off",
        startDate: item.startDate || item.startDate || "",
        endDate: item.endDate || item.endDate || "",
        kpimetric: item.kpimetric || item.kpimetric || "-",
        kpivalue: item.kpivalue || item.kpivalue || "-",
        brandId: item.brandId || currentBrandId,
        originalData: item
      }));
      console.log(" universal Date range formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching universal data by date range:", err);
      //await fetchGroupList();
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };


  useEffect(() => {
    if (showArchived) {
    
    } else {
      if (appliedDateRange) {
        fetchgroupListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.apiRange || appliedDateRange.label
        );
      } else {
        //fetchGroupList();
      }
    }
  }, [showArchived]);

  // Fixed exportToExcel function
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Groups");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "groups_export.xlsx");
  };

  return (
    <div className="campaign-daily-container">
      <ConversionCustomizationModal
        isOpen={conversioncustomizationModal}
        toggle={toggleConversionCustomizationModal}
        selectedColumns={selectedColumns}
        setSelectedColumns={handleColumnChange}
        defaultColumns={DEFAULT_SELECTED_COLUMNS}
        availableColumns={Object.keys(ALL_COLUMNS)}
      />

      {creative === null && canViewUser && (
        <>
          <div className="campaign-daily-header reports-page-header">
            <div>
              <div className="campaign-daily-title">
                <h2>Conversion</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3 reports-card">
            <CardBody className="py-3 reports-card-body">
              <div className="reports-toolbar-grid">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="cd-date-range-wrapper reports-date-range-wrapper" ref={tableDateRangeRef}>
                    <button type="button" className="db-select reports-date-range-trigger" onClick={openDateRangePicker}>
                      <div className="reports-date-range-trigger-inner">
                        <FontAwesomeIcon icon={faCalendarAltSolid} size="sm" />
                        <span className="reports-date-range-label">{dateRangeLabel}</span>
                      </div>
                    </button>
                    {showDateRangePicker && (
                      <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table reports-date-range-popup" ref={dateRangePopupRef}>
                        <div className="cd-date-range-presets reports-date-range-presets">
                          <div className="cd-date-range-presets-title reports-date-range-presets-title">Preset Ranges</div>
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
                              className={`cd-date-range-preset-btn reports-date-range-preset-btn ${isSameDateRange(draftDateRange, getPresetRange(preset)) ? "is-active" : ""}`}
                              onClick={() => handlePresetSelect(preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        <div className="cd-date-range-panel reports-date-range-panel">
                          <div className="cd-date-range-fields reports-date-range-fields">
                            <div className="cd-date-range-field reports-date-range-field">
                              <span className="cd-date-range-field-label reports-date-range-field-label">From</span>
                              <div className={`cd-date-range-field-value reports-date-range-field-value ${!draftDateRange.startDate ? "is-empty" : ""}`}>
                                {formatPickerValue(draftDateRange.startDate)}
                              </div>
                            </div>
                            <div className="cd-date-range-field reports-date-range-field">
                              <span className="cd-date-range-field-label reports-date-range-field-label">To</span>
                              <div className={`cd-date-range-field-value reports-date-range-field-value ${!draftDateRange.endDate ? "is-empty" : ""}`}>
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
                          <div className="cd-date-range-footer reports-date-range-footer">
                            <button
                              type="button"
                              className="cd-date-range-btn cd-date-range-btn-secondary reports-date-range-btn reports-date-range-btn-secondary"
                              onClick={handleDateRangeClear}
                              disabled={!draftDateRange.startDate && !draftDateRange.endDate}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="cd-date-range-btn cd-date-range-btn-secondary reports-date-range-btn reports-date-range-btn-secondary"
                              onClick={() => setShowDateRangePicker(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="cd-date-range-btn cd-date-range-btn-primary reports-date-range-btn reports-date-range-btn-primary"
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

                  <button className="cdi-icon-btn reports-refresh-btn" onClick={refresh}>
                    <FontAwesomeIcon
                      icon={faSync}
                      className={`reports-refresh-icon ${loading ? "fa-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>

                <div className="d-flex align-items-center flex-wrap gap-2 reports-toolbar-right">
                  <div className="cd-pagination-summary reports-pagination-summary">
                    {filteredData.length ? `${currentPage} of ${totalPages}` : "0 of 0"}
                  </div>
                  <div className="cd-pagination-toolbar reports-pagination-toolbar">
                    {totalPages > 1 && (
                      <div className="cd-pagination-controls reports-pagination-controls">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="cd-pagination-nav-btn reports-pagination-nav-btn"
                          type="button"
                        >
                          <i className="fa fa-chevron-left" />
                        </button>
                        <button className="cd-pagination-page-btn reports-pagination-page-btn is-active" type="button">
                          {currentPage}
                        </button>
                        <span className="reports-gutter">
                          of
                        </span>
                        <button className="cd-pagination-page-btn reports-pagination-page-btn" type="button">
                          {totalPages}
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="cd-pagination-nav-btn reports-pagination-nav-btn"
                          type="button"
                        >
                          <i className="fa fa-chevron-right" />
                        </button>
                        <div className="reports-items-per-page-wrapper" ref={perPageRef}>
                          <div className="campaign-select-wrapper">
                            <input
                              readOnly
                              value={`${perPage} per page`}
                              className="campaign-select-input reports-select-input"
                              onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                            />
                            <FaChevronDown className={`reports-select-chevron ${isPerPageOpen ? 'is-open' : ''}`} />
                          </div>
                          {isPerPageOpen &&
                            typeof document !== 'undefined' &&
                            createPortal(
                              <div
                                ref={perPagePortalRef}
                                className="custom-dropdown-menu biddeript-bd reports-per-page-menu"
                                style={{
                                  "--per-page-top": `${perPageDropdownPosition.top}px`,
                                  "--per-page-left": `${perPageDropdownPosition.left}px`,
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
                                      className={`custom-dropdown-option reports-dropdown-option reports-per-page-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                    >
                                      <span className={`tick-icon reports-dropdown-tick ${isSelected || isHovered ? 'active' : ''}`}>
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
                  <button className="cdi-export-btn reports-export-btn reports-export-btn-danger" onClick={handleExportCSV}>
                    <FontAwesomeIcon icon={faDownload} /> EXPORT
                  </button>
                  <button className="cdi-export-btn reports-export-btn reports-export-btn-primary" onClick={openConversionCustomizationModal}>
                    <FaCog /> COLUMNS
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div className="reports-table-shell">
              <div className="reports-table-inner">
                <DataTable
                  key={selectedColumns.join("|")}
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
      {creative === null && !canViewUser && (
        <div className="alert alert-warning mt-3 reports-access-denied">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view Conversions.
        </div>
      )}
    </div>
  );
};

export default CampaignConversion;
