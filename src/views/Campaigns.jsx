import React, { useState, useEffect, useMemo, useRef } from "react";
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
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaCaretUp } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { editGroup, getcampaignByDateRange, updatecampaignstatus } from "../views/api/Api";
import { listCampaigngroup, getkibanaFormula } from "../views/api/Api";
import CampaignsCustomizationModal from "./Modal/CampaignsCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";

import Popup from "./Modal/Popup";
import Swal from "sweetalert2";
import { stroptions } from "../Utils.js";
const DEFAULT_SELECTED_COLUMNS = [
  "Name",
  "Status",
  "ID",
  "Default Bid",
  "Daily Budget",
  "Max Bid",
  "Start Date",
  "End Date",
  "KPI Metric",
  "KPI Value",
  "Platform Spend",
];

const Campaigns = (props) => {
  const { groupId: urlGroupId, groupName: urlGroupName } = useParams();
  const [statusdata, setstatusdata] = useState({});
  let userid = localStorage.getItem("userId");
  const location = useLocation();
  const decodedGroupName = urlGroupName ? decodeURIComponent(urlGroupName) : (props.groupName || location.state?.name || "");
  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const [showPopup, setShowPopup] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingRow, setPendingRow] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(initialGroupId ? initialGroupId : null);
  const [realBrandId, setRealBrandId] = useState(props.brandId || location.state?.brandId || localStorage.getItem('currentBrandId') || null);
  const numericToStatusString = {
    1: "runnable",
    2: "offline",
    3: "archived"
  };
  const statusToNumeric = (statusText) => {
    switch (statusText) {
      case 'runnable': return 1;
      case 'offline': return 2;
      case 'archived': return 3;
      default: return null;
    }
  };
      const [openDropdown, setOpenDropdown] = useState(false);
const [selectedOptions, setSelectedOptions] = useState([]);

const handleDropCheckboxChange = (value) => {
  setSelectedOptions((prev) =>
    prev.includes(value)
      ? prev.filter((item) => item !== value)
      : [...prev, value]
  );
};

   const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
      const [statusType, setStatusType] = useState("1"); 
      const dropdownRef = useRef(null);
      
      useEffect(() => {
          const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
              setOpenStatusDropdown(false);
            }
          };
      
          document.addEventListener("mousedown", handleClickOutside);
      
          return () => {
            document.removeEventListener("mousedown", handleClickOutside);
          };
        }, []);

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

  const formatIndian = (num) => {
    if (num == null || num === "") return "-";
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.floor(num));
  };
  useEffect(() => {
    const newId = props.groupid || location.state?.groupId || urlGroupId;
    if (newId !== currentGroupId) {
      setCurrentGroupId(newId ? newId : null);
    }
  }, [props.groupid, urlGroupId, location.state?.groupId, currentGroupId]);
  console.log("Campaigns - currentGroupId:", currentGroupId);
  const IDCell = ({ row }) => <div className="gOorhn">{row.id}</div>;
  const DefaultCPMBidCell = ({ row }) => {
    return <div className="gOorhn">{row.cpmBid}</div>;
  };
  const BudgetCell = ({ row }) => (
    <div className="gOorhn">
      {row.budget}
      {currentGroupId && (
        <span className="badge bg-secondary ms-2" style={{ fontSize: "0.65rem" }} />
      )}
    </div>
  );
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
  const StartDateCell = ({ row }) => <div className="gOorhn">{row.startDate}</div>;
  const EndDateCell = ({ row }) => <div className="gOorhn">{row.endDate}</div>;
  const KPICell = ({ row }) => <div className="gOorhn">{row.kpimetric}</div>;
  const KPIValueCell = ({ row }) => <div className="gOorhn">{row.kpivalue}</div>;

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
          <DropdownItem onClick={() => editCampaign(row.id)}>Edit Campaign</DropdownItem>
          <DropdownItem onClick={() => navigate(`/admin/campaign/${row.id}/detailed-reporting/domains`, { state: { campaignId: row.id, campaignName: row.name } })}>Detailed reporting</DropdownItem>
          <DropdownItem>Summary</DropdownItem>
          <DropdownItem onClick={() => { setCampaignToCopy(row); toggleCopyModal(); }}>Copy Campaign</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const ActionStatusCell = ({ row }) => {
    console.log("row", row);

    const [currentStatus, setCurrentStatus] = useState(row.status || "runnable");
    const [statusOpen, setStatusOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      if (row.status) setCurrentStatus(row.status);
    }, [row.status]);

    const toggleStatus = () => {
      if (!updating) setStatusOpen(!statusOpen);
    };

    const handlepopupopen = (newStatusText) => {
      setPendingStatus(newStatusText);
      setPendingRow(row);
      setShowPopup(true);
    };

    return (
      <>

        <Dropdown isOpen={statusOpen} toggle={toggleStatus} disabled={updating}>
          <DropdownToggle
            tag="span"
            className="onoffbutton"
            style={{
              position: "relative",
              opacity: updating ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {updating ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" />
            ) : (
              <>
                {currentStatus}
                <FaCaretDown style={{ marginLeft: "5px" }} />
              </>
            )}
          </DropdownToggle>
          <DropdownMenu className="audiencemenu">
            <DropdownItem
              onClick={() => handlepopupopen("runnable")}
              active={currentStatus === "runnable"}
              disabled={updating}
            >
              <span className="conversionstatus">ON</span>
            </DropdownItem>
            <DropdownItem
              onClick={() => handlepopupopen("hold")}
              active={currentStatus === "hold"}
              disabled={updating}
            >
              <span className="conversionstatus">HOLD</span>
            </DropdownItem>
            <DropdownItem
              onClick={() => handlepopupopen("offline")}
              active={currentStatus === "offline"}
              disabled={updating}
            >
              <span className="conversionstatus">OFF</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

      </>
    );
  };

  const ALL_COLUMNS = {
    Name: {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "300px",
    },
    Status: {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <ActionStatusCell row={row} />,
      sortable: true,
      width: "90px",
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
    "Start Date": {
      name: "Start Date",
      selector: (row) => row.startDate,
      cell: (row) => <StartDateCell row={row} />,
      sortable: true,
      width: "110px",
    },
    "End Date": {
      name: "End Date",
      selector: (row) => row.endDate,
      cell: (row) => <EndDateCell row={row} />,
      sortable: true,
      width: "110px",
    },
    "KPI Metric": {
      name: "KPI Metric",
      selector: (row) => row.kpimetric,
      cell: (row) => <KPICell row={row} />,
      sortable: true,
      width: "120px",
    },
    "KPI Value": {
      name: "KPI Value",
      selector: (row) => row.kpivalue,
      cell: (row) => <KPIValueCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Imps": {
      name: "Imps",
      selector: (row) => row.impressionsWon || "-",
      cell: (row) => {
        const value = row.impressionsWon ?? 0;

        const formatted =
          typeof value === "number"
            ? value.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })
            : value;

        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Win Percentage": {
      name: "Win Percentage",
      selector: (row) => row.winPercentage || "-",
      cell: (row) => {
        const value = row.winPercentage != null ? Number(row.winPercentage) : null;
        return <div className="gOorhn">{value != null ? `${value.toFixed(2)}%` : "-"}</div>;
      },
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
      selector: (row) => row.percent25 || "-",
      cell: (row) => <div className="gOorhn">{row.percent25 || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "50% Complete": {
      name: "50% Complete",
      selector: (row) => row.percent50 || "-",
      cell: (row) => <div className="gOorhn">{row.percent50 || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "75% Complete": {
      name: "75% Complete",
      selector: (row) => row.percent75 || "-",
      cell: (row) => <div className="gOorhn">{row.percent75 || 0}</div>,
      sortable: true,
      width: "130px",
    },
    "100% Complete": {
      name: "100% Complete",
      selector: (row) => row.p100Complete || "-",
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
        const value = row.mediaSpend ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
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
      cell: (row) => {
        const value = row.totalClicks ?? 0;
        const formatted = formatIndian(value);
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "100px",
    },

    "Spend": {
      name: "Spend",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => <div className="gOorhn">{row.totalSpend ? row.totalSpend.toFixed(2) : "-"}</div>,
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
      selector: (row) => row.totalEcpc || "-",
      cell: (row) => {
        const value = row.totalEcpc ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "CTR": {
      name: "CTR",
      selector: (row) => row.ctr || "-",
      cell: (row) => {
        const value = row.ctr ?? 0;
        const formatted = typeof value === 'number' ? `${value.toFixed(2)}%` : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },


    "EPC": {
      name: "EPC",
      selector: (row) => row.epc || "-",
      cell: (row) => {
        const value = row.epc ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
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
      selector: (row) => row.conversion || "-",
      cell: (row) => {
        const value = row.conversion ?? "-";
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
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
      selector: (row) => row.totalSpend || "-",
      cell: (row) => <div className="gOorhn">{row.totalSpend ? (row.totalSpend / 10000000).toFixed(4) : "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total eCPM": {
      name: "Total eCPM",
      selector: (row) => row.ecpm || "-",
      cell: (row) => {
        const value = row.ecpm ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(5) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
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
    Clicks: {
      name: "Clicks",
      selector: (row) => row.totalClicks || row.clicks || 0,
      cell: (row) => {
        const value = row.totalClicks ?? row.clicks ?? 0;
        const formatted = formatIndian(value);
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "100px",
    },
    "Total RPM": {
      name: "Total RPM",
      selector: (row) => row.totalRpm || 0,
      cell: (row) => {
        const value = row.totalRpm ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "ROAS": {
      name: "ROAS",
      selector: (row) => row.roas || 0,
      cell: (row) => {
        const value = row.roas ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Advertiser Spend eCPM": {
      name: "Advertiser Spend eCPM",
      selector: (row) => row.ecpm || "-",
      cell: (row) => {
        const value = row.ecpm ?? 0;
        const formatted = typeof value === "number" ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },

    // "Total Spend": {
    //   name: "Total Spend",
    //   selector: (row) => row.totalCost || "-",
    //   cell: (row) => {
    //     const value = row.totalCost ?? 0;
    //     const formatted = typeof value === 'number' ? value.toFixed(2) : value;
    //     return <div className="gOorhn">{formatted}</div>;
    //   },
    //   sortable: true,
    //   width: "150px",
    // },

    "Platform ECPM": {
      name: "Platform ECPM",
      selector: (row) => row.platformEcpm || "-",
      cell: (row) => {
        const value = row.platformEcpm ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },

    "Media ECPM": {
      name: "Media ECPM",
      selector: (row) => row.mediaEcpm || "-",
      cell: (row) => {
        const value = row.mediaEcpm ?? 0;
        const formatted = typeof value === 'number' ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Platform Spend": {
      name: "Platform Spend",
      selector: (row) => row.platformSpend || "-",
      cell: (row) => {
        const value = row.platformSpend ?? 0;
        const formatted = typeof value === "number" ? value.toFixed(2) : value;
        return <div className="gOorhn">{formatted}</div>;
      },
      sortable: true,
      width: "150px",
    },

    //  "Total Spend": {
    //   name: "Total Spend",
    //   selector: (row) => row.totalSpend || "-",
    //   cell: (row) => {
    //     const value = row.totalSpend ?? 0;
    //     const formatted = typeof value === "number" ? value.toFixed(2) : value;
    //     return <div className="gOorhn">{formatted}</div>;
    //   },
    //   sortable: true,
    //   width: "150px",
    // },
  };

  const vx = useViewContext();
  const navigate = useNavigate();

  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const togglegroupModal = () => setGroupModalOpen(!groupModalOpen);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [campaignscustomizationModal, setCampaignsCustomizationModalOpen] = useState(false);
  const toggleCampaignsCustomizationModal = () =>
    setCampaignsCustomizationModalOpen(!campaignscustomizationModal);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = "campaignsListSelectedColumns";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const [campaign, setCampaign] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const toggleCalendar = () => setShowCalendar((prev) => !prev);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const toggleCopyModal = () => setCopyModalOpen(!copyModalOpen);
  const [campaignToCopy, setCampaignToCopy] = useState(null);



  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

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

  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => setCount(count + 1);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("");
    setAppliedDateRange(null);
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
        await fetchCampaignList();
      }
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCampaignList = async () => {
    setLoading(true);
    try {
      let list = [];
      let campaignNameMap = {};

      if (currentGroupId) {
        console.log("Fetching campaigns for groupId:", currentGroupId);
        const rolesStr = localStorage.getItem("roles");
        const userRoles = rolesStr ? JSON.parse(rolesStr) : [];
        const userId = localStorage.getItem("userId");

        // Fetch campaign names from group API in parallel with kibana data
        const payload = {
          userId: userId,
          userRole: userRoles,
          brandId: realBrandId ? [realBrandId] : [],
          groupId: [currentGroupId],
          detailReport: false,
          campaignId: []
        };

        const [res, groupRes] = await Promise.all([
          getkibanaFormula(payload),
          listCampaigngroup(currentGroupId).catch(() => null)
        ]);

        // Build a map of campaignId -> campaignName from group API
        if (groupRes?.data?.data) {
          const campaigns = Array.isArray(groupRes.data.data) ? groupRes.data.data : [groupRes.data.data];
          campaigns.forEach(c => {
            const cId = c.campaignId || c.id;
            if (cId && c.name) {
              campaignNameMap[cId] = c.name;
            }
          });
        }

        console.log("API Response:", res.data);
        if (res.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        } else {
          list = [];
        }
      } else {
        console.log("No group selected, showing empty campaigns list");
        list = [];
      }
      const formatted = list.map((item) => {
        const groupPercentage = 20;
        const kf = item;
        const campaignId = item.campaignId || item.id;
        const status = numericToStatusString[item.status] ?? item.campaignStatus ?? item.status ?? "unknown";
        const budget = item.campaignBudget ?? item.totalBudget ?? 0;
        const cpmBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const maxBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const startDate = item.campaignStartDate ? item.campaignStartDate.split("T")[0] : "";
        const endDate = item.campaignEndDate ? item.campaignEndDate.split("T")[0] : "";
        const totalClicks = Number(item.totalClicks ?? 0);
        const totalWin = Number(item.totalWin ?? 0);
        const ctr = totalWin > 0 ? parseFloat(((totalClicks / totalWin) * 100).toFixed(2)) : 0;
        const platformEcpm = cpmBid * (groupPercentage / 100);
        const platformSpend = Number((totalWin / 1000) * platformEcpm ?? 0);
        const mediaEcpm = cpmBid - platformEcpm;
        const mediaSpend = Number((totalWin / 1000) * mediaEcpm ?? 0);
        const totalSpend = platformSpend + mediaSpend;
        const advSpendEcpm = ((platformSpend + mediaSpend) / totalWin) * 1000 || 0;
        console.log("advSpendEcpm", ctr)
        return {
  id: campaignId,

  name:
    item.campaignName ??
    item.name ??
    campaignNameMap[campaignId],

  status,
  budget,
  cpmBid,
  max_bid: maxBid,

  startDate,
  endDate,
  kpimetric: item.kpimetric,
  kpivalue: item.kpivalue,

  groupId: currentGroupId,

  impressionsWon: kf.totalWin,
  ctr,
  clicks: kf.totalClicks,
  totalClicks: kf.totalClicks,
  conversion: kf.totalConversions,
  winPercentage: kf.totalWinPercentage,
  totalCost: kf.totalCost,
  groupPercentage: kf.totalgroupPercentage,

  // ✅ safe calculation
  totalSpend:
    platformSpend != null && mediaSpend != null
      ? platformSpend + mediaSpend
      : undefined,

  ecpm: kf.totalEcpm,

  platformEcpm:
    platformEcpm != null ? Number(platformEcpm.toFixed(2)) : undefined,

  mediaEcpm,
  platformSpend,
  mediaSpend,

  epc: kf.totalEpc,
  totalRpm: kf.totalRpm,
  roas: kf.roas,
  totalEcpc: kf.totalEcpc,

  completionRate: kf.completionRate,
  percent25: kf.percent25,
  percent50: kf.percent50,
  percent75: kf.percent75,

  advSpendECPM:
    advSpendEcpm != null ? Number(advSpendEcpm.toFixed(2)) : undefined,

  totalECPM: kf.totalECPM,
  mediaECPM: kf.mediaECPM,
  dataECPM: kf.dataECPM,

  totalEligibleImps: kf.totalEligibleImps,
  totalMeasuredImps: kf.totalMeasuredImps,
  totalViewableImps: kf.totalViewableImps,

  measuredRate: kf.measuredRate,
  viewableRate: kf.viewableRate,

  eligibleSpend: kf.eligibleSpend,
  eligibleVCPM: kf.eligibleVCPM,

  originalData: item,
};
      });
      console.log("Formatted campaigns:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appliedDateRange) {
      fetchgroupListByDateRange(
        appliedDateRange.startDate,
        appliedDateRange.endDate,
        appliedDateRange.label
      );
    } else {
      fetchCampaignList();
    }
  }, [currentGroupId, appliedDateRange]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentGroupId]);

  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case "Today":
        start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6
        );
        break;
      case "Last 30 Days":
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
      return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    } else if (startDate) {
      return startDate.toLocaleDateString();
    } else {
      return "All Dates";
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };



  const fetchgroupListByDateRange = async (start, end, range = null) => {
    try {
      const formattedStartDate = formatDateForAPI(start);
      const formattedEndDate = formatDateForAPI(end);
      if (!formattedStartDate || !formattedEndDate) {
        console.log("No date range specified, fetching all data");
        await fetchCampaignList();
        return;
      }
      const apiRange = getApiRangeValue(range) || range;
      console.log("Fetching with date range:", {
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        range: apiRange
      });
      const userIdStr = localStorage.getItem('userId');
      const userId = userIdStr ? parseInt(userIdStr, 10) : null;
      let userRole = [];
      try {
        const rolesStr = localStorage.getItem('roles');
        userRole = rolesStr ? JSON.parse(rolesStr) : [];
      } catch (e) {
        userRole = [];
      }

      const payload = {
        userId,
        userRole,
        brandId: realBrandId ? [Number(realBrandId)] : [],
        groupId: currentGroupId ? [Number(currentGroupId)] : [],
        campaignId: [],
        detailReport: false,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      };

      console.log("getkibanaFormula payload with date range:", payload);
      const res = await getkibanaFormula(payload);
      console.log("API Response with date range:", res.data);

      let list = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      } else {
        list = [];
      }

      const formatted = list.map((item) => {
        const groupPercentage = 20;
        const kf = item;
        const status = numericToStatusString[item.status] ?? item.campaignStatus ?? item.status ?? "unknown";
        const budget = item.campaignBudget ?? item.totalBudget ?? 0;
        const cpmBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const maxBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const startDate = item.campaignStartDate ? item.campaignStartDate.split("T")[0] :
          (item.startDate ? item.startDate.split("T")[0] : "");
        const endDate = item.campaignEndDate ? item.campaignEndDate.split("T")[0] :
          (item.endDate ? item.endDate.split("T")[0] : "");
        const totalClicks = Number(item.totalClicks ?? 0);
        const totalWin = Number(item.totalWin ?? 0);
        const ctr = totalWin > 0 ? parseFloat(((totalClicks / totalWin) * 100).toFixed(2)) : 0;
        const platformEcpm = cpmBid * (groupPercentage / 100);
        const platformSpend = Number((totalWin / 1000) * platformEcpm ?? 0);
        const mediaEcpm = cpmBid - platformEcpm;
        const mediaSpend = Number((totalWin / 1000) * mediaEcpm ?? 0);
        const totalSpend = platformSpend + mediaSpend;
        const advSpendEcpm = ((platformSpend + mediaSpend) / totalWin) * 1000 || 0;
        console.log("advSpendEcpm", ctr)

       return {
  id: item.campaignId ?? item.id,

  name: item.campaignName ?? item.name,

  status,
  budget,
  cpmBid,
  max_bid: maxBid,

  startDate,
  endDate,
  kpimetric: item.kpimetric,
  kpivalue: item.kpivalue,

  groupId: currentGroupId,

  impressionsWon: kf.totalWin,
  ctr,
  clicks: kf.totalClicks,
  totalClicks: kf.totalClicks,
  conversion: kf.totalConversions,
  winPercentage: kf.totalWinPercentage,
  totalCost: kf.totalCost,
  groupPercentage: kf.totalgroupPercentage,

  // ✅ safe totalSpend
  totalSpend:
    platformSpend != null && mediaSpend != null
      ? platformSpend + mediaSpend
      : undefined,

  ecpm: kf.totalEcpm,

  // ✅ safe toFixed
  platformEcpm:
    platformEcpm != null ? Number(platformEcpm.toFixed(2)) : undefined,

  mediaEcpm,
  platformSpend,
  mediaSpend,

  epc: kf.totalEpc,
  totalRpm: kf.totalRpm,
  roas: kf.roas,
  totalEcpc: kf.totalEcpc,

  completionRate: kf.completionRate,
  percent25: kf.percent25,
  percent50: kf.percent50,
  percent75: kf.percent75,

  advSpendECPM:
    advSpendEcpm != null ? Number(advSpendEcpm.toFixed(2)) : undefined,

  totalECPM: kf.totalECPM,
  mediaECPM: kf.mediaECPM,
  dataECPM: kf.dataECPM,

  totalEligibleImps: kf.totalEligibleImps,
  totalMeasuredImps: kf.totalMeasuredImps,
  totalViewableImps: kf.totalViewableImps,

  measuredRate: kf.measuredRate,
  viewableRate: kf.viewableRate,

  eligibleSpend: kf.eligibleSpend,
  eligibleVCPM: kf.eligibleVCPM,

  originalData: item,
};
      });

      console.log("Formatted campaigns with date range:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching data by date range:", err);
      await fetchCampaignList();
    }
  };

  const handleApply = async () => {
    setShowCalendar(false);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate,
      endDate,
      label: selectedLabel,
      apiRange: apiRangeValue
    };
    setAppliedDateRange(dateRange);

    try {
      await fetchgroupListByDateRange(startDate, endDate, apiRangeValue);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      await fetchCampaignList();
    } finally {
      setLoading(false);
    }
  };
  const handleApplyAll = async () => {
    setShowCalendar(false);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate,
      endDate,
      label: selectedLabel,
      apiRange: apiRangeValue
    };
    setAppliedDateRange(dateRange);
    try {
      await fetchgroupListByDateRange(startDate, endDate, apiRangeValue);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      await fetchCampaignList();
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
      await fetchCampaignList();
    } catch (error) {
      console.error("Error clearing date range:", error);
    } finally {
      setLoading(false);
    }
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

  const editCampaign = async (campaign_id) => {
    console.log("Editing campaign ID:", campaign_id);
    if (campaign_id) {
      navigate(`/admin/campaign-editor-update/${campaign_id}`);
    }
  };

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

  useEffect(() => {
    if (filteredData.length > 0) {
      const isAnySelectedInFiltered = selectedIds.some((id) =>
        filteredData.some((item) => item.id === id)
      );
      if (!isAnySelectedInFiltered) {
        setSelectedIds([filteredData[0].id]);
      }
    }
  }, [filteredData, selectedIds]);

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
    link.setAttribute("download", `campaigns_export_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const makeNew = async () => {
    if (campaign !== null) return;

    setIsLoading(true);

    try {
      const camp = await vx.getNewCampaign("My New Campaign");
      setCampaign(camp);

      setTimeout(() => {
        setIsLoading(false);
        navigate(`/admin/campaign-editor/${currentGroupId}`, {
          state: { brandId: realBrandId, groupName: decodedGroupName },
        });
      }, 200);
    } catch (error) {
      console.error("Error creating new campaign:", error);
      setIsLoading(false);
    }
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
        {!currentGroupId
          ? "Please select a group to view campaigns"
          : "No campaigns available for this group"}
      </div>
    </div>
  );

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#f8f9fa",
        height: "100%",
      },
    },
    headRow: {
      style: {
         borderTop: "1px solid #d4d4d4",
      },
    },
    headCells: {
      style: {
        borderRight: "1px solid #d4d4d4",
       
        "&:first-of-type": {
          paddingLeft: "16px",
        },
        "&:last-of-type": {
          borderRight: "none",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
        "&:first-of-type": {
          paddingLeft: "16px",
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
      },
    ];

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
        backgroundColor: "#59823a !important",
        "& .gOorhn": {
          color: "white !important",
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
                            placeholder="Search"
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
                      <Col md="2" className="p-0 ms-2 mt-2" id="maximing">
                              <div ref={dropdownRef} className="position-relative otr-dropdown-wrap">

                              
                              <div
                                className="otr-select-box d-flex justify-content-between align-items-center"
                                onClick={() => setOpenDropdown(!openDropdown)}
                              >
                                <span>
                                  {selectedOptions.length > 0
                                    ? `Selected (${selectedOptions.length})`
                                    : "Select Status"}
                                </span>
                                <FaCaretDown className="otr-icon" />
                              </div>

                              
                             {openDropdown && (
                                <div className="otr-dropdown-menu">
                                  {stroptions.map((opt, index) => {
                                    const isChecked = selectedOptions.includes(opt.value);

                                    return (
                                      <React.Fragment key={opt.value}>
                                        
                                        
                                        {index === 5 && <div className="otr-divider" />}

                                        <div
                                          className="otr-option-item"
                                          onClick={() => handleDropCheckboxChange(opt.value)}
                                        >
                                          <div className={`otr-checkbox-box ${isChecked ? "checked" : ""}`}>
                                            {isChecked && "✓"}
                                          </div>

                                          <span className="otr-label">{opt.label}</span>
                                        </div>

                                      </React.Fragment>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            </Col>
                      <Col xs="auto">
                        <button
                          type="button"
                          onClick={refresh}
                          className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center ml-90"
                          style={{ height: "26px", fontSize: "11px" }}
                          id="refresh"
                        >
                          <i className="fa fa-repeat me-1"></i>
                          Refresh
                        </button>
                      </Col>
                      <Col md="1" className="custom-width"></Col>

                      <Col xs="auto">
                        <Dropdown
                          isOpen={dropdownOpen}
                          toggle={toggle}
                          className="new-dropdown"
                        >
                          <DropdownToggle
                            className="form-control py-1 px-1 rounded-0 adsheight custom-select-input d-flex justify-content-center align-items-center"
                            id="newaudience"
                          >
                            <span className="linkto"> New Campaign</span>

                            {dropdownOpen ? (
                              <FaCaretUp className="fabtn" />
                            ) : (
                              <FaCaretDown className="fabtn" />
                            )}
                          </DropdownToggle>

                          <DropdownMenu className="dropdown-menu-custom">
                            <DropdownItem onClick={makeNew}>
                              <div>
                                <div className="advancedall">
                                  Advanced Campaign
                                </div>
                                <div className="allfeature">
                                  All features (Experts Only)
                                </div>
                              </div>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </Col>
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
                          onClick={toggleCampaignsCustomizationModal}
                        >
                          <span className="lasttime">
                            Customization Columns
                          </span>
                        </Button>
                      </Col>
                    </Row>
                    <CampaignsCustomizationModal
                      isOpen={campaignscustomizationModal}
                      toggle={toggleCampaignsCustomizationModal}
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
                          overflowY: "auto",
                        },
                      },
                    }}
                    noDataComponent={<NoDataComponent />}
                    onRowClicked={handleRowClicked}
                  />
                </div>
              </Col>

            </Row>
          </>
        )}
      </div>

      <Popup
        isOpen={showPopup}
        title={`Update Campaign Status`}
        status={pendingStatus}
        isLoading={popupLoading}
        setpayload={setstatusdata}
        onConfirm={async (data) => {
          setPopupLoading(true);
          try {
            // Extract campaign ID explicitly
            const campaignId = pendingRow?.id || pendingRow?.campaignId;
            
            console.log(`Updating campaign with ID:`, campaignId);
            console.log(`Updating campaign ${campaignId} with:`, data);
            
            if (!campaignId) {
              throw new Error("Campaign ID is missing. Cannot update campaign without ID.");
            }
            
            let data1 = {
              "id": campaignId,
              "status": data.status,
              "userId": parseInt(userid) || 0,
              "comments": data.comments || "",
              "platformFee": parseFloat(data.platform_fee) || 0,
              "attribute": "campagin",
              "attributeId": campaignId
            }
            setstatusdata({
              "id": campaignId,
              "status": data.status,
              "userId": parseInt(userid) || 0,
              "comments": data.comments || "",
              "platformFee": parseFloat(data.platform_fee) || 0,
              "attribute": "campagin",
              "attributeId": campaignId
            })
         let res = await updatecampaignstatus(data1);
         console.log("responst :",res)
         if(res.data.status==200){

      
            setRowData((prevData) =>
              prevData.map((item) =>
                item.id === pendingRow.id
                  ? { ...item, status: pendingStatus, name: data.name }
                  : item
              )
            );
            console.log("Status updated successfully");
            setShowPopup(false);
            setPendingStatus(null);
            setPendingRow(null);
            Swal.fire({
              title: "Success!",
              text: "Status updated successfully.",
              icon: "success",
              confirmButtonColor: "#62903e",
            });}
            else{
               setShowPopup(false);
            setPendingStatus(null);
            setPendingRow(null);
            Swal.fire({
    title: "Warning!",
    text: "Your Total campaign budget exceeds your group budget please update, Total campaign budget should less than group budget",
    icon: "warning",
    confirmButtonColor: "#d33",
  });
            }
          } catch (err) {
            console.error("Error updating status:", err);
            Swal.fire({
              title: "Error!",
              text: `Error updating status: ${err.message}`,
              icon: "error",
            });
          } finally {
            setPopupLoading(false);
          }
        }}
        onCancel={() => {
          setShowPopup(false);
          setPendingStatus(null);
          setPendingRow(null);
        }}
        show={true}
      />
    </div>
  );
};

export default Campaigns;