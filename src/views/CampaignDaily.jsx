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
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaCaretUp } from "react-icons/fa";
import DataTable from "react-data-table-component";
import {
  editGroup,
  getcampaignByDateRange,
  upadtestatusCampaign,
} from "../views/api/Api";
import { listCampaigngroup, getkibanaFormula } from "../views/api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import DailyCustomizationModal from "../views/customizationcolumns/DailyCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const DEFAULT_SELECTED_COLUMNS = [
  "Report Date",
  "Hourly Reporting",
  "Name",
  "ID",
  "Default Bid",
  "Daily Budget",
  "Max Bid",
  "Platform Spend",
];

const CampaignDaily = (props) => {
  const {
    groupId: urlGroupId,
    groupName: urlGroupName,
    campaignId: urlCampaignId,
  } = useParams();
  const location = useLocation();
  const decodedGroupName = urlGroupName
    ? decodeURIComponent(urlGroupName)
    : props.groupName || location.state?.name || "";
  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const initialCampaignId =
    props.campaignId || location.state?.campaignId || urlCampaignId;
  const [currentGroupId, setCurrentGroupId] = useState(
    initialGroupId
      ? initialGroupId !== "undefined"
        ? initialGroupId
        : null
      : null,
  );
  const [currentCampaignId, setCurrentCampaignId] = useState(
    initialCampaignId
      ? initialCampaignId !== "undefined"
        ? initialCampaignId
        : null
      : null,
  );
  const [realBrandId, setRealBrandId] = useState(
    props.brandId ||
    location.state?.brandId ||
    localStorage.getItem("currentBrandId") ||
    null,
  );
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
  } = useGlobalTabs();

  useEffect(() => {
    initializePageTab("Daily Reporting", "fa fa-bullseye", location.pathname);
  }, [initializePageTab, location.pathname]);

  useEffect(() => {
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-bullseye me-2"></i>
          Daily Reporting - <i>{decodedGroupName || ""}</i>
        </>
      ),
    });
  }, [decodedGroupName, updateTab]);



  const formatIndian = (num) => {
    if (num == null || num === "") return "-";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
      Math.floor(num),
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
      setCurrentGroupId(newId ? (newId !== "undefined" ? newId : null) : null);
    }
    const newCampaignId =
      props.campaignId || location.state?.campaignId || urlCampaignId;
    if (newCampaignId !== currentCampaignId) {
      setCurrentCampaignId(
        newCampaignId
          ? newCampaignId !== "undefined"
            ? newCampaignId
            : null
          : null,
      );
    }
  }, [
    props.groupid,
    urlGroupId,
    location.state?.groupId,
    props.campaignId,
    urlCampaignId,
    location.state?.campaignId,
    currentGroupId,
    currentCampaignId,
  ]);

  console.log(
    "Campaigns - currentGroupId:",
    currentGroupId,
    "currentCampaignId:",
    currentCampaignId,
  );
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
        <span
          className="badge bg-secondary ms-2"
          style={{ fontSize: "0.65rem" }}
        />
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
    // Format reportDate nicely (YYYY-MM-DD -> DD/MM/YYYY)
    const formatted = row.reportDate
      ? new Date(row.reportDate).toLocaleDateString("en-GB")
      : "-";
    return <div className="gOorhn">{formatted}</div>;
  };

  // const StartDateCell = ({ row }) => <div className="gOorhn">{row.startDate}</div>;
  // const EndDateCell = ({ row }) => <div className="gOorhn">{row.endDate}</div>;
  // const KPICell = ({ row }) => <div className="gOorhn">{row.kpimetric}</div>;
  // const KPIValueCell = ({ row }) => <div className="gOorhn">{row.kpivalue}</div>;

  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    const navigate = useNavigate();
    const editgroup = (id) => navigate(`/admin/campaign-editor-update/${id}`);
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => editgroup(row.id)}>
            Edit Campaign
          </DropdownItem>
          <DropdownItem
            onClick={() =>
              navigate(`/admin/campaign/${row.id}/detailed-reporting/domains`, {
                state: { campaignId: row.id, campaignName: row.name },
              })
            }
          >
            Detailed reporting
          </DropdownItem>
          <DropdownItem>Summary</DropdownItem>
          <DropdownItem
            onClick={() => {
              setCampaignToCopy(row);
              toggleCopyModal();
            }}
          >
            Copy Campaign
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  // ================= COLUMN DEFINITIONS =================
  const ALL_COLUMNS = {
    "Report Date": {
      name: "Report Date",
      selector: (row) => row.reportDate,
      cell: (row) => <ReportDateCell row={row} />,
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
          className="rounded-0"
          id="hourlyreporting"
          onClick={() =>
            navigate(
              `/admin/campaign/${row.id}/detailed-reporting/hourly-reporting/${row.reportDate}`,
              {
                state: {
                  campaignId: row.id,
                  campaignName: row.name,
                  reportDate: row.reportDate,
                },
              },
            )
          }
        >
          View Hourly Report
        </Button>
      ),
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
    // "Start Date": {
    //   name: "Start Date",
    //   selector: (row) => row.startDate,
    //   cell: (row) => <StartDateCell row={row} />,
    //   sortable: true,
    //   width: "110px",
    // },
    // "End Date": {
    //   name: "End Date",
    //   selector: (row) => row.endDate,
    //   cell: (row) => <EndDateCell row={row} />,
    //   sortable: true,
    //   width: "110px",
    // },
    // "KPI Metric": {
    //   name: "KPI Metric",
    //   selector: (row) => row.kpimetric,
    //   cell: (row) => <KPICell row={row} />,
    //   sortable: true,
    //   width: "120px",
    // },
    // "KPI Value": {
    //   name: "KPI Value",
    //   selector: (row) => row.kpivalue,
    //   cell: (row) => <KPIValueCell row={row} />,
    //   sortable: true,
    //   width: "100px",
    // },
    Imps: {
      name: "Imps",
      selector: (row) => row.impressionsWon || "-",
      cell: (row) => (
        <div className="gOorhn">
          {row.impressionsWon?.toLocaleString() || 0}
        </div>
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
        return (
          <div className="gOorhn">
            {!isNaN(val) ? val.toFixed(2) : row.mediaSpend || "-"}
          </div>
        );
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
      cell: (row) => (
        <div className="gOorhn">{formatIndian(row.totalClicks)}</div>
      ),
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
      cell: (row) => (
        <div className="gOorhn">{row.conversion?.toFixed(2) || "-"}</div>
      ),
      sortable: true,
      width: "150px",
    },
    CTC: {
      name: "CTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => <div className="gOorhn">{row.totalECPCV || "-"}</div>,
      sortable: true,
      width: "150px",
    },
    VTC: {
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
      cell: (row) => (
        <div className="gOorhn">{row.totalSpend?.toFixed(2) || "-"}</div>
      ),
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
    "Advertiser Spend eCPM": {
      name: "Advertiser Spend eCPM",
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

  const vx = useViewContext();
  const navigate = useNavigate();

  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const togglegroupModal = () => setGroupModalOpen(!groupModalOpen);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [isDailyCustomizationModalOpen, setDailyCustomizationModalOpen] =
    useState(false);
  const toggleDailyCustomizationModal = () =>
    setDailyCustomizationModalOpen(!isDailyCustomizationModalOpen);
  const [selectedColumns, setSelectedColumns] = useState(
    DEFAULT_SELECTED_COLUMNS,
  );
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = "campaignDailySelectedColumns";
  const LEGACY_STORAGE_KEYS = ["campaignsDailySelectedColumns"];
  const REQUIRED_COLUMNS = ["Hourly Reporting"];

  const normalizeSelectedColumns = (cols) => {
    let next = Array.isArray(cols) ? cols.filter((c) => ALL_COLUMNS[c]) : [];

    if (!next.length) {
      next = DEFAULT_SELECTED_COLUMNS.filter((c) => ALL_COLUMNS[c]);
    }

    // Enforce required columns (eg, navigation buttons) even if older saved settings omitted them.
    REQUIRED_COLUMNS.forEach((c) => {
      if (ALL_COLUMNS[c] && !next.includes(c)) next.push(c);
    });

    return next;
  };
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

  const onCopyCampaign = async (details) => {
    console.log("Copying campaign with details:", details);
    setIsLoading(true);
    try {
      setTimeout(() => {
        setIsLoading(false);
        toggleCopyModal();
        Swal.fire({
          title: "Success!",
          text: `Campaign "${details.newName}" has been copied successfully.`,
          icon: "success",
          confirmButtonColor: "#62903e",
        });
        refresh();
      }, 1000);
    } catch (error) {
      console.error("Error copying campaign:", error);
      setIsLoading(true);
      Swal.fire("Error", "Failed to copy campaign.", "error");
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

        // One-time migrate to the new key so other screens no longer interfere.
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
        // handle archived if needed
      } else if (appliedDateRange) {
        await fetchgroupListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.label,
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
      if (currentGroupId || currentCampaignId) {
        console.log(
          "Fetching campaigns for groupId:",
          currentGroupId,
          "or campaignId:",
          currentCampaignId,
        );
        const rolesStr = localStorage.getItem("roles");
        const userRoles = rolesStr ? JSON.parse(rolesStr) : [];
        const userIdStr = localStorage.getItem("userId");
        const userId = userIdStr ? parseInt(userIdStr, 10) : null;

        const payload = {
          userId: userId,
          userRole: userRoles,
          brandId: realBrandId ? [Number(realBrandId)] : [],
          groupId: currentGroupId ? [Number(currentGroupId)] : [],
          campaignId: currentCampaignId ? [Number(currentCampaignId)] : [],
          detailReport: true,
        };

        console.log("getkibanaFormula payload:", payload);
        const res = await getkibanaFormula(payload);
        console.log("API Response:", res.data);
        if (res.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        } else {
          list = [];
        }
      } else {
        console.log("No group or campaign selected, showing empty list");
        list = [];
      }

      const formatted = list.map((item) => {
        const groupPercentage = 20;
        const kf = item;
        const campaignId = item.campaignId || item.id;
        const budget = item.campaignBudget ?? item.totalBudget ?? 0;
        const cpmBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const maxBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const startDate = item.startDate
          ? item.startDate.split("T")[0]
          : item.campaignStartDate
            ? item.campaignStartDate.split("T")[0]
            : "";
        const endDate = item.endDate
          ? item.endDate.split("T")[0]
          : item.campaignEndDate
            ? item.campaignEndDate.split("T")[0]
            : "";
        const totalClicks = Number(item.totalClicks ?? 0);
        const totalWin = Number(item.totalWin ?? 0);
        const ctr =
          totalWin > 0
            ? parseFloat(((totalClicks / totalWin) * 100).toFixed(2))
            : 0;
        const platformEcpm = cpmBid * (groupPercentage / 100);
        const platformSpend = Number((totalWin / 1000) * platformEcpm ?? 0);
        const mediaEcpm = cpmBid - platformEcpm;
        const mediaSpend = Number((totalWin / 1000) * mediaEcpm ?? 0);
        const totalSpend = platformSpend + mediaSpend;
        const advSpendEcpm =
          ((platformSpend + mediaSpend) / totalWin) * 1000 || 0;

        return {
          id: campaignId,
          reportDate: item.reportDate, // ✅ Direct mapping from API
          name: item.campaignName || item.name || "Unnamed Campaign",
          budget: budget,
          cpmBid: cpmBid,
          max_bid: maxBid,
          startDate: startDate,
          endDate: endDate,
          // kpimetric: "-",
          // kpivalue: "-",
          groupId: currentGroupId,
          impressionsWon: kf.totalWin ?? 0,
          ctr: ctr || 0,
          clicks: kf.totalClicks ?? 0,
          totalClicks: kf.totalClicks ?? 0,
          conversion: kf.totalConversions ?? 0,
          winPercentage: kf.totalWinPercentage ?? 0,
          totalCost: kf.totalCost ?? 0,
          groupPercentage: kf.totalgroupPercentage ?? 0,
          totalSpend: totalSpend ?? 0,
          ecpm: kf.totalEcpm ?? 0,
          platformEcpm: platformEcpm.toFixed(2) ?? 0,
          mediaEcpm: mediaEcpm ?? 0,
          platformSpend: platformSpend ?? 0,
          mediaSpend: mediaSpend ?? 0,
          epc: kf.totalEpc ?? 0,
          totalRpm: kf.totalRpm ?? 0,
          roas: kf.roas ?? 0,
          totalEcpc: kf.totalEcpc ?? 0,
          completionRate: kf.completionRate ?? 0,
          percent25: kf.percent25 ?? 0,
          percent50: kf.percent50 ?? 0,
          percent75: kf.percent75 ?? 0,
          advSpendECPM: advSpendEcpm ?? 0,
          totalECPM: kf.totalECPM ?? 0,
          mediaECPM: kf.mediaECPM ?? 0,
          dataECPM: kf.dataECPM ?? 0,
          totalEligibleImps: kf.totalEligibleImps ?? 0,
          totalMeasuredImps: kf.totalMeasuredImps ?? 0,
          totalViewableImps: kf.totalViewableImps ?? 0,
          measuredRate: kf.measuredRate ?? 0,
          viewableRate: kf.viewableRate ?? 0,
          eligibleSpend: kf.eligibleSpend ?? 0,
          eligibleVCPM: kf.eligibleVCPM ?? 0,
          ecpm: advSpendEcpm ?? 0,
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
        appliedDateRange.label,
      );
    } else {
      fetchCampaignList();
    }
  }, [currentGroupId, currentCampaignId, appliedDateRange]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentGroupId]);

  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case "Today":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
        );
        break;
      case "Yesterday":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1,
        );
        break;
      case "2 Days Ago":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 2,
        );
        break;
      case "Last 7 Days":
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6,
        );
        break;
      case "Last 30 Days":
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 29,
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
    if (typeof date === "string") return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
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
        range: apiRange,
      });
      const userIdStr = localStorage.getItem("userId");
      const userId = userIdStr ? parseInt(userIdStr, 10) : null;
      let userRole = [];
      try {
        const rolesStr = localStorage.getItem("roles");
        userRole = rolesStr ? JSON.parse(rolesStr) : [];
      } catch (e) {
        userRole = [];
      }

      const payload = {
        userId,
        userRole,
        brandId: realBrandId ? [Number(realBrandId)] : [],
        groupId: currentGroupId ? [Number(currentGroupId)] : [],
        campaignId: currentCampaignId ? [Number(currentCampaignId)] : [],
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        detailReport: true,
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
        const budget = item.campaignBudget ?? item.totalBudget ?? 0;
        const cpmBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const maxBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        // const startDate = item.startDate ? item.startDate.split("T")[0] :
        //   (item.campaignStartDate ? item.campaignStartDate.split("T")[0] : "");
        // const endDate = item.endDate ? item.endDate.split("T")[0] :
        //   (item.campaignEndDate ? item.campaignEndDate.split("T")[0] : "");
        const totalClicks = Number(item.totalClicks ?? 0);
        const totalWin = Number(item.totalWin ?? 0);
        const ctr =
          totalWin > 0
            ? parseFloat(((totalClicks / totalWin) * 100).toFixed(2))
            : 0;
        const platformEcpm = cpmBid * (groupPercentage / 100);
        const platformSpend = Number((totalWin / 1000) * platformEcpm ?? 0);
        const mediaEcpm = cpmBid - platformEcpm;
        const mediaSpend = Number((totalWin / 1000) * mediaEcpm ?? 0);
        const totalSpend = platformSpend + mediaSpend;
        const advSpendEcpm =
          ((platformSpend + mediaSpend) / totalWin) * 1000 || 0;

        return {
          id: item.campaignId || item.id,
          reportDate: item.reportDate, // ✅ Direct mapping from API
          name: item.campaignName || item.name || "Unnamed Campaign",
          budget: budget,
          cpmBid: cpmBid,
          max_bid: maxBid,
          // startDate: startDate,
          // endDate: endDate,
          // kpimetric: "-",
          // kpivalue: "-",
          groupId: currentGroupId,
          impressionsWon: kf.totalWin ?? 0,
          ctr: ctr || 0,
          clicks: kf.totalClicks ?? 0,
          totalClicks: kf.totalClicks ?? 0,
          conversion: kf.totalConversions ?? 0,
          winPercentage: kf.totalWinPercentage ?? 0,
          totalCost: kf.totalCost ?? 0,
          groupPercentage: kf.totalgroupPercentage ?? 0,
          totalSpend: totalSpend ?? 0,
          ecpm: kf.totalEcpm ?? 0,
          platformEcpm: platformEcpm ?? 0,
          mediaEcpm: mediaEcpm ?? 0,
          platformSpend: platformSpend ?? 0,
          mediaSpend: mediaSpend ?? 0,
          epc: kf.totalEpc ?? 0,
          totalRpm: kf.totalRpm ?? 0,
          roas: kf.roas ?? 0,
          totalEcpc: kf.totalEcpc ?? 0,
          completionRate: kf.completionRate ?? 0,
          percent25: kf.percent25 ?? 0,
          percent50: kf.percent50 ?? 0,
          percent75: kf.percent75 ?? 0,
          advSpendECPM: advSpendEcpm ?? 0,
          totalECPM: kf.totalECPM ?? 0,
          mediaECPM: kf.mediaECPM ?? 0,
          dataECPM: kf.dataECPM ?? 0,
          totalEligibleImps: kf.totalEligibleImps ?? 0,
          totalMeasuredImps: kf.totalMeasuredImps ?? 0,
          totalViewableImps: kf.totalViewableImps ?? 0,
          measuredRate: kf.measuredRate ?? 0,
          viewableRate: kf.viewableRate ?? 0,
          eligibleSpend: kf.eligibleSpend ?? 0,
          eligibleVCPM: kf.eligibleVCPM ?? 0,
          ecpm: advSpendEcpm ?? 0,
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
      apiRange: apiRangeValue,
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
      apiRange: apiRangeValue,
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
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
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

  const editgroup = async (campaign_id) => {
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
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
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
      }),
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
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `Daily_Reporting_export_${new Date().toISOString().slice(0, 10)}.csv`,
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
    setSelectedColumns(normalizeSelectedColumns(newSelectedColumns));
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
          ? "No data found"
          : "No data found"}
      </div>
    </div>
  );

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#f8f9fa",
        height: "auto",
      },
    },
    headRow: {
      style: {
        borderTop: "1px solid #d4d4d4",
      },
    },
    pagination: {
      style: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
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
      // {
      //   name: (
      //     <Input
      //       type="checkbox"
      //       checked={isAllFilteredSelected}
      //       onChange={handleSelectAllChange}
      //       disabled={filteredData.length === 0}
      //     />
      //   ),
      //   cell: (row) => (
      //     <Input
      //       type="checkbox"
      //       checked={selectedIds.includes(row.id)}
      //       onChange={(e) => {
      //         e.stopPropagation();
      //         handleCheckboxChange(row.id);
      //       }}
      //     />
      //   ),
      //   width: "50px",
      // },
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
    <Tabs>
      {tabsList.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          header={tab.header}
          route={tab.route}
          state={tab.state}
        >
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
                                            onClick={() =>
                                              handleQuickSelect(label)
                                            }
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
                                className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center ml-90"
                                style={{ height: "26px", fontSize: "11px" }}
                                id="refresh"
                              >
                                <i className="fa fa-repeat me-1"></i>
                                Refresh
                              </button>
                            </Col>
                            <Col md="3"></Col>

                            <Col xs="auto">
                              <Dropdown
                                isOpen={dropdownOpen}
                                toggle={toggle}
                                className="new-dropdown"
                              >
                                {/* Dropdown content can be added here */}
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
                                onClick={toggleDailyCustomizationModal}
                              >
                                <span className="lasttime">
                                  Customization Columns
                                </span>
                              </Button>
                            </Col>
                          </Row>
                          <DailyCustomizationModal
                            isOpen={isDailyCustomizationModalOpen}
                            toggle={toggleDailyCustomizationModal}
                            selectedColumns={selectedColumns}
                            setSelectedColumns={handleColumnChange}
                            fixedColumns={["Hourly Reporting"]}
                            defaultColumns={DEFAULT_SELECTED_COLUMNS}
                          />
                        </div>
                      </div>
                      <div className="inventory-table-wrapper">
                        <DataTable
                          className=""
                          columns={buildColumns()}
                          data={filteredData}
                          progressPending={loading}
                          progressComponent={<CustomLoader />}
                          striped
                          dense
                          fixedHeader
                          highlightOnHover
                          persistTableHead
                          fixedHeaderScrollHeight="calc(100vh - 200px)"
                          conditionalRowStyles={conditionalRowStyles}
                          pagination
                          paginationPerPage={100}
                          paginationRowsPerPageOptions={[100, 200, 300, 400, 500]}
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
          </div>
        </Tab>
      ))}
    </Tabs>
  );
};

export default CampaignDaily;
