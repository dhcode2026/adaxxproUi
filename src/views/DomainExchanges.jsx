import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
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
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import GroupModal from "./Modal/GroupModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { useNavigate, useLocation } from "react-router-dom";
import { editGroup, getgroupByDateRange, publisherinventorylist } from "../views/api/Api";
import DomainCustomizationModal from "../views/customizationcolumns/DomainCustomizationModal";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DomainCampaigns from "./DomainCampaigns";

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
const DEFAULT_SELECTED_COLUMNS = [
  "Name",
  "Status",
  "ID",
  "Imps. Won",
  "Win Rate",
  "Media Spend",
];

const DomainExchanges = (props) => {
  const { brandId: urlBrandId, groupId: urlGroupId } = useParams();
  const [currentBrandId, setCurrentBrandId] = useState(props.brandId || urlBrandId || null);

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


  const location = useLocation();

  const [realBrandId, setRealBrandId] = useState(
    props.brandId || location.state?.brandId || localStorage.getItem('currentBrandId') || null
  );
  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const [currentGroupId, setCurrentGroupId] = useState(
    initialGroupId ? (initialGroupId !== "undefined" ? initialGroupId : null) : null
  );
  const [step, setStep] = useState(0);

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
          <span className="badge bg-secondary ms-2" style={{ fontSize: '0.65rem' }}>
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

  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem >
            Edit List
          </DropdownItem>
          <DropdownItem>
            View Campaigns
          </DropdownItem>
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
          className="onoffbutton"
          style={{
            position: "relative",
            opacity: currentStatus === "Archived" ? 0.4 : (updating ? 0.7 : 1),
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {updating ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
            </>
          ) : (
            <>
              {currentStatus}
              <FaCaretDown style={{ marginLeft: "5px" }} />
            </>
          )}
        </DropdownToggle>
        <DropdownMenu className="audiencemenu">
          <DropdownItem
            // onClick={() => handleStatusChange("On")}
            active={currentStatus === "On"}
            disabled={updating}
          >
            <span className="conversionstatus">On</span>
          </DropdownItem>
          <DropdownItem
            //onClick={() => handleStatusChange("Archived")}
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
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const togglegroupModal = () => setGroupModalOpen(!groupModalOpen);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [domaincustomizationModal, setDomainCustomizationModalOpen] = useState(false);
  const toggleDomainCustomizationModal = () => setDomainCustomizationModalOpen(!domaincustomizationModal);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = 'groupListSelectedColumns';

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
        //await fetchArchivedGroup();
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

  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const toggleCalendar = () => setShowCalendar((prev) => !prev);
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState([]);

  const steps = [
    { label: "Exchanges", icon: "icon-world" },
  ];
  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case "Today":
        start = end = today;
        break;
      case "Yesterday":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1
        );
        break;
      case "2 Days Ago":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 2
        );
        break;
      case "Last 7 Days":
        end = today;
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6
        );
        break;
      case "Last 30 Days":
        end = today;
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 29
        );
        break;
      default:
        start = end = null;
    }

    setSelectedLabel(type);
    setStartDate(start);
    setEndDate(end);
  };

  const formatDateRange = () => {
    if (appliedDateRange?.label) return appliedDateRange.label;
    if (selectedLabel) return selectedLabel;
    if (startDate && endDate) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return `${startDate.toLocaleDateString(
        undefined,
        options
      )} - ${endDate.toLocaleDateString(undefined, options)}`;
    } else if (startDate) {
      return startDate.toLocaleDateString();
    } else {
      return "All Dates";
    }
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
    if (!loading && rowData.length > 0) {
      setSelectedIds([rowData[0].id]);
    }
  }, [loading, rowData]);
  useEffect(() => {
    if (currentBrandId) {
      //fetchGroupList();
    }
  }, [currentBrandId]);

  // const fetchGroupList = async () => {
  //   if (!currentBrandId) {
  //     console.log("No currentBrandId, skipping fetch");
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     console.log("Fetching groups for brandId:", currentBrandId);
  //     const res = await editGroupbrand(currentBrandId);
  //     console.log("Brand-specific group API Response:", res.data);

  //     let list = [];
  //     if (res.data?.data?.informationGroups) {
  //       list = res.data.data.informationGroups;
  //     } else if (res.data?.informationGroups) {
  //       list = res.data.informationGroups;
  //     } else if (res.data?.data) {
  //       list = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
  //     } else {
  //       list = res.data || [];
  //     }

  //     const formatted = list.map((item) => ({
  //       id: item.groupId || item.id || Math.random(),
  //       groupId: item.groupId || item.id || Math.random(),
  //       name: item.name || item.name || "Unnamed Group",
  //       status: getStatusText(item.status || 1),
  //       budget: item.budget || item.budget || "0",
  //       gbo_status: item.gbo_status || item.gbo_status || "Off",
  //       startDate: item.startDate || item.startDate || "",
  //       endDate: item.endDate || item.endDate || "",
  //       kpimetric: item.kpimetric || item.kpimetric || "-",
  //       kpivalue: item.kpivalue || item.kpivalue || "-",
  //       brandId: item.brandId || currentBrandId,
  //       impressionsWon: Math.floor(Math.random() * 10000),
  //       winRate: `${Math.floor(Math.random() * 100)}%`,
  //       advSpendECPM: `$${(Math.random() * 10).toFixed(2)}`,
  //       totalECPM: `$${(Math.random() * 12).toFixed(2)}`,
  //       mediaECPM: `$${(Math.random() * 8).toFixed(2)}`,
  //       dataECPM: `$${(Math.random() * 4).toFixed(2)}`,
  //       totalEligibleImps: Math.floor(Math.random() * 10000),
  //       totalMeasuredImps: Math.floor(Math.random() * 8000),
  //       totalViewableImps: Math.floor(Math.random() * 6000),
  //       measuredRate: `${Math.floor(Math.random() * 100)}%`,
  //       viewableRate: `${Math.floor(Math.random() * 100)}%`,
  //       eligibleSpend: `$${(Math.random() * 1000).toFixed(2)}`,
  //       eligibleVCPM: `$${(Math.random() * 15).toFixed(2)}`,
  //       originalData: item
  //     }));

  //     console.log("Formatted group data:", formatted);
  //     setRowData(formatted);
  //   } catch (err) {
  //     console.error("Error fetching groups:", err);
  //     try {
  //       const res = await getAllGroup();
  //       const allList = res?.data?.data?.informationGroups || [];
  //       const filteredList = currentBrandId
  //         ? allList.filter(item => item.brandId === currentBrandId)
  //         : allList;
  //       const formatted = filteredList.map((item) => ({
  //         id: item.groupId || item.id || Math.random(),
  //         groupId: item.groupId || item.id || Math.random(),
  //         name: item.name || item.name || "Unnamed Group",
  //         status: getStatusText(item.status || 1),
  //         budget: item.budget || item.budget || "0",
  //         gbo_status: item.gbo_status || item.gbo_status || "OFF",
  //         startDate: item.startDate || item.startDate || "",
  //         endDate: item.endDate || item.endDate || "",
  //         kpimetric: item.kpimetric || item.kpimetric || "-",
  //         kpivalue: item.kpivalue || item.kpivalue || "-",
  //         brandId: item.brandId || currentBrandId,
  //         impressionsWon: Math.floor(Math.random() * 10000),
  //         winRate: `${Math.floor(Math.random() * 100)}%`,
  //         advSpendECPM: `$${(Math.random() * 10).toFixed(2)}`,
  //         totalECPM: `$${(Math.random() * 12).toFixed(2)}`,
  //         mediaECPM: `$${(Math.random() * 8).toFixed(2)}`,
  //         dataECPM: `$${(Math.random() * 4).toFixed(2)}`,
  //         totalEligibleImps: Math.floor(Math.random() * 10000),
  //         totalMeasuredImps: Math.floor(Math.random() * 8000),
  //         totalViewableImps: Math.floor(Math.random() * 6000),
  //         measuredRate: `${Math.floor(Math.random() * 100)}%`,
  //         viewableRate: `${Math.floor(Math.random() * 100)}%`,
  //         eligibleSpend: `$${(Math.random() * 1000).toFixed(2)}`,
  //         eligibleVCPM: `$${(Math.random() * 15).toFixed(2)}`,
  //         originalData: item
  //       }));

  //       setRowData(formatted);
  //     } catch (fallbackErr) {
  //       console.error("Fallback API call also failed:", fallbackErr);
  //       setRowData([]);
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };
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
        backgroundColor: '#f8f9fa',
        height: '100%',
      },
    },
    headRow: {
      style: {
        borderTop: '1px solid #d4d4d4',
      },
    },
    headCells: {
      style: {
        borderRight: '1px solid #d4d4d4',

        '&:first-of-type': {
          paddingLeft: '16px',
        },
        '&:last-of-type': {
          borderRight: 'none',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        '&:first-of-type': {
          paddingLeft: '16px',
        },
      },
    },
    rows: {
      style: {},
    },
  };
  const buildColumns = () => {
    const columns = [
      {
        name: (
          <Input
            type="checkbox"
            checked={isAllFilteredSelected}
            onChange={handleSelectAllChange}
            disabled={filteredData.length === 0}
          />
        ),
        cell: (row) => {
          return (
            <Input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(row.id);
              }}
            />
          );
        },
        width: "50px",
      },
      {
        name: "Actions",
        cell: (row) => <AudienceActionsCell row={row} />,
        grow: 1,
        width: "100px",
      }
    ];


    selectedColumns.forEach(columnKey => {
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
        backgroundColor: '#FBEDEF !important',
        '& .gOorhn': {
          color: 'black !important',
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
    console.log("Audience saved:", savedConversion);
    setGroupModalOpen(false);
    setSelectedGroup(null);
    setLoading(true);
    setTimeout(() => {
      if (showArchived) {
        //fetchArchivedGroup();
      } else if (appliedDateRange) {
        fetchgroupListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.apiRange || appliedDateRange.label
        );
      } else {
        //fetchGroupList();
      }
    }, 800);
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
      console.log("CRM Date range API Response:", res.data);
      let list = [];
      if (res.data?.data?.informationGroups) {
        list = res.data.data.informationGroups;
      } else if (res.data?.informationGroups) {
        list = res.data.informationGroups;
      } else if (res.data?.data) {
        list = res.data.data;
      } else {
        list = res.data || [];
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
  const handleApply = async () => {
    setShowCalendar(false);
    setLoading(true);
    const dateRange = { startDate, endDate, label: selectedLabel };
    setAppliedDateRange(dateRange);

    try {
      await fetchgroupListByDateRange(startDate, endDate, selectedLabel);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      //await fetchGroupList();
    } finally {
      setLoading(false);
    }
  };
  const handleApplyAll = async () => {
    setShowCalendar(false);
    setLoading(true);
    const dateRange = { startDate, endDate, label: selectedLabel };
    setAppliedDateRange(dateRange);
    try {
      await fetchgroupListByDateRange(startDate, endDate, selectedLabel);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      //await fetchGroupList();
    } finally {
      setLoading(false);
    }
  };
  const handleClearDateRange = async () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("");
    setAppliedDateRange(null);
    setShowCalendar(false);
    setLoading(true);
    try {
      //await fetchGroupList();
    } catch (error) {
      console.error("Error clearing date range:", error);
    } finally {
      setLoading(false);
    }
  };
  const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
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
  useEffect(() => {
    if (showArchived) {
      //fetchArchivedGroup();
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
            <Row>
              <Col xs="12">
                <div className="row ">
                  <div className="col-xl-12 col-lg-12">
                    <Row className="align-items-center">
                      <Col md="2" className="p-0 ms-2 mt-2" id="maximing">
                        <div className="position-relative ms-2">
                          <Input
                            className="form-control py-1 px-1 mb-2 rounded-0 adsheight custom-select-input"
                            type="text"
                            id="seaching"
                            placeholder="Search11"
                            style={{ fontSize: "0.685rem" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                          />
                        </div>
                      </Col>

                      <Col md="2" className="position-relative">
                        <div ref={datePickerRef}>
                          <div className="date-input-wrapper">
                            <FaCalendarAlt className="calendar-icon" />
                            <input
                              type="text"
                              value={formatDateRange()}
                              onClick={toggleCalendar}
                              readOnly
                              className="date-input"
                            />
                          </div>
                          {showCalendar && (
                            <Card className="calendar-popup shadow">
                              <div>
                                <DatePicker
                                  selected={startDate || new Date()}
                                  onChange={(dates) => {
                                    const [start, end] = dates;
                                    setSelectedLabel("");
                                    setStartDate(start);
                                    setEndDate(end);
                                  }}
                                  startDate={startDate}
                                  endDate={endDate}
                                  selectsRange
                                  inline
                                  monthsShown={2}
                                  calendarClassName="custom-calendar"
                                />
                              </div>
                              <div className="quick-select-section">
                                <div className="quick-select-buttons d-flex flex-column">
                                  {[
                                    "Today",
                                    "Yesterday",
                                    "2 Days Ago",
                                    "Last 7 Days",
                                    "Last 30 Days",
                                  ].map((label) => (
                                    <button
                                      key={label}
                                      onClick={() => handleQuickSelect(label)}
                                      className="quick-select-btn btn btn-sm mb-2 text-start rounded-0"
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>

                                <div className="apply-buttons d-flex flex-column mt-2">
                                  <Button
                                    color="success"
                                    size="sm"
                                    className="mb-2 rounded-0 apply-btn applyaudeice"
                                    onClick={handleApply}
                                    disabled={!startDate || !endDate}
                                  >
                                    Apply
                                  </Button>
                                  <Button
                                    color="success"
                                    size="sm"
                                    className="rounded-0 apply-btn applyaudeice"
                                    onClick={handleApplyAll}
                                    disabled={!startDate || !endDate}
                                  >
                                    Apply All
                                  </Button>
                                  <Button
                                    color="secondary"
                                    size="sm"
                                    className="mt-2 rounded-0"
                                    onClick={handleClearDateRange}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>
                      </Col>
                      <Col xs="auto">
                        <button
                          type="button"
                          onClick={refresh}
                          className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center"
                          style={{ height: "26px", fontSize: "11px" }}
                          id="refresh"
                        >
                          <i className="fa fa-repeat me-1"></i>
                          Refresh
                        </button>
                      </Col>
                      <Col md="3" ></Col>
                      <Col xs="auto" className="p-0">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                          id="export"
                          onClick={exportToExcel}
                        >
                          <span className="lasttime">Export</span>
                        </Button>
                      </Col>
                      <Col xs="auto" className="">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                          id="export"
                          onClick={toggleDomainCustomizationModal}>
                          <span className="lasttime">
                            Customization Columns
                          </span>
                        </Button>
                      </Col>
                    </Row>

                    <GroupModal
                      isOpen={groupModalOpen}
                      toggle={togglegroupModal}
                      group={selectedGroup}
                      callback={handleGroupSave}
                      brandId={currentBrandId}
                    />

                    <DomainCustomizationModal
                      isOpen={domaincustomizationModal}
                      toggle={toggleDomainCustomizationModal}
                      selectedColumns={selectedColumns}
                      setSelectedColumns={handleColumnChange}
                    />
                  </div>
                </div>
                <div className="flex-grow-1 position-relative table-container">
                  <DataTable
                    className="groups1datatable"
                    columns={buildColumns()}
                    data={filteredData}
                    progressPending={loading}
                    progressComponent={<CustomLoader />}
                    striped
                    dense
                    fixedHeader
                    highlightOnHover
                    persistTableHead
                    conditionalRowStyles={conditionalRowStyles}
                    customStyles={{
                      ...customStyles,
                      tableWrapper: {
                        style: {
                          overflowY: 'auto',
                        },
                      },
                    }}
                    noDataComponent={<NoDataComponent />}
                    onRowClicked={handleRowClicked}
                  />
                </div>
              </Col>
              <Fragment>
                <div
                  className="panel_Container brandpanel ">
                  <div className="brandlist" >
                    <Row
                      className="inventory-row align-items-center border mt-2 py-2 px-3"
                      id="subtable"
                    >
                      <Col xs="12" md="2" className="d-flex align-items-center">
                        <i className="tim-icons icon-triangle-down me-2 opacity-75"></i>

                      </Col>

                      <Col
                        xs="auto"
                        className="d-flex flex-wrap align-items-center ms-auto"
                      >
                        {steps.map((item, i) => {
                          const isActive = i === step;

                          return (
                            <div
                              key={i}
                              onClick={() => setStep(i)}
                              style={{ cursor: "pointer" }}
                              className={`tab-step d-flex align-items-center mx-2 px-2 py-1 ${isActive ? "active" : ""
                                }`}
                            >
                              <i
                                className={`tim-icons ${item.icon} me-2 ${isActive ? "" : "text-muted"
                                  }`}
                                style={
                                  isActive
                                    ? { color: "#3a3d40", opacity: 1 }
                                    : {}
                                }
                              />
                              <span
                                className={`fw-semibold ${isActive ? "" : "text-muted"
                                  }`}
                                id="subgroupname"
                                style={
                                  isActive
                                    ? { color: "#3a3d40", opacity: 1 }
                                    : {}
                                }
                              >
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </Col>
                    </Row>
                    <div style={{ flexGrow: 1 }} />
                  </div>
                </div>

                {step === 0 && (
                  <DomainCampaigns
                    brandId={realBrandId}
                    groupid={currentGroupId}
                    campaignId={selectedIds[0]}
                  />
                )}


              </Fragment>
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default DomainExchanges;