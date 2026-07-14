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
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaCaretUp, FaChevronDown, FaChevronRight, FaSync, FaDownload } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { editGroup, getcampaignByDateRange, upadtestatusCampaign } from "../views/api/Api";
import { listCampaigngroup, getkibanaFormula, getAllCampaign } from "../views/api/Api";
import DailyCustomizationModal from "../views/customizationcolumns/DailyCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/reports.css";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isSameDateRange = (range1, range2) => {
  if (!range1 || !range2) return false;
  const s1 = range1.startDate ? new Date(range1.startDate).getTime() : null;
  const e1 = range1.endDate ? new Date(range1.endDate).getTime() : null;
  const s2 = range2.startDate ? new Date(range2.startDate).getTime() : null;
  const e2 = range2.endDate ? new Date(range2.endDate).getTime() : null;
  return s1 === s2 && e1 === e2;
};

const DEFAULT_SELECTED_COLUMNS = [
  "Report Date",
  "Name",
  "ID",
  "Default Bid",
  "Daily Budget",
  "Max Bid",
  "Imps",
  "Platform Spend",
  "25% Complete",
  "50% Complete",
  "75% Complete",
  "100% Complete",
  "Clicks",
  "Hourly Reporting",
];


const DailyReporting = (props) => {
  const { groupId: urlGroupId, groupName: urlGroupName, campaignId: urlCampaignId } = useParams();
  const location = useLocation();
  const decodedGroupName = urlGroupName ? decodeURIComponent(urlGroupName) : (props.groupName || location.state?.name || "");
  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const initialCampaignId = props.campaignId || location.state?.campaignId || urlCampaignId;
  const [currentGroupId, setCurrentGroupId] = useState(initialGroupId ? (initialGroupId !== "undefined" ? initialGroupId : null) : null);
  const [currentCampaignId, setCurrentCampaignId] = useState(initialCampaignId ? (initialCampaignId !== "undefined" ? initialCampaignId : null) : null);
  const [realBrandId, setRealBrandId] = useState(props.brandId || location.state?.brandId || localStorage.getItem('currentBrandId') || null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [selectedDropdownCampaignId, setSelectedDropdownCampaignId] = useState("306");
  const [canCreateDailyReport, setCanCreateDailyReport] = useState(false);
  const [canViewDailyReport, setCanViewDailyReport] = useState(false);
  const [canEditDailyReport, setCanEditDailyReport] = useState(false);
  const [canDeleteDailyReport, setCanDeleteDailyReport] = useState(false);
  const [canUpdateDailyReport, setCanUpdateDailyReport] = useState(false);

  useEffect(() => {
    const hasCreatePermission = canCreate("Daily reporting");
    const hasViewPermission = canView("Daily reporting");
    const hasEditPermission = canEdit("Daily reporting");
    const hasDeletePermission = canDelete("Daily reporting");
    const hasUpdatePermission = canUpdate("Daily reporting");
    setCanCreateDailyReport(hasCreatePermission);
    setCanViewDailyReport(hasViewPermission);
    setCanEditDailyReport(hasEditPermission);
    setCanDeleteDailyReport(hasDeletePermission);
    setCanUpdateDailyReport(hasUpdatePermission);
  }, []);

  useEffect(() => {
    const fetchDropdownCampaigns = async () => {
      try {
        const res = await getAllCampaign();

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

        setAllCampaigns(list);

        if (list.length > 0 && selectedDropdownCampaignId === "306") {
          const firstCamp = list[0];
          const firstVal = firstCamp.id || firstCamp.campaignId || firstCamp.name || 0;
          setSelectedDropdownCampaignId(firstVal);
        }
      } catch (err) {
        console.error("Failed to fetch campaigns for dropdown", err);
      }
    };
    fetchDropdownCampaigns();
  }, []);

  const formatIndian = (num) => {
    if (num == null || num === "") return "-";
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(num));
  };

  const getApiRangeValue = (label) => {
    const rangeMap = {
      "Today": "TODAY",
      "Yesterday": "YESTERDAY",
      "2 Days Ago": "LAST_2_DAYS",
      "Last 2 days": "LAST_2_DAYS",
      "Last 7 Days": "LAST_7_DAYS",
      "Last 30 Days": "LAST_30_DAYS"
    };
    return rangeMap[label] || label;
  };

  useEffect(() => {
    const newId = props.groupid || location.state?.groupId || urlGroupId;
    if (newId !== currentGroupId) {
      setCurrentGroupId(newId ? (newId !== "undefined" ? newId : null) : null);
    }
    const newCampaignId = props.campaignId || location.state?.campaignId || urlCampaignId;
    if (newCampaignId !== currentCampaignId) {
      setCurrentCampaignId(newCampaignId ? (newCampaignId !== "undefined" ? newCampaignId : null) : null);
    }
  }, [props.groupid, urlGroupId, location.state?.groupId, props.campaignId, urlCampaignId, location.state?.campaignId, currentGroupId, currentCampaignId]);

  console.log("Campaigns - currentGroupId:", currentGroupId, "currentCampaignId:", currentCampaignId);

  // ================= CELL COMPONENTS =================
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
      {currentGroupId && (
        <span className="badge bg-secondary ms-2 reports-badge-inline" />
      )}
    </div>
  );

  const MaxBidCell = ({ row }) => {
    const numValue = typeof row.max_bid === "number" ? row.max_bid : parseFloat(String(row.max_bid).replace(/[$,]/g, ""));
    return (
      <div className="gOorhn">
        {!isNaN(numValue)
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(numValue)
          : row.max_bid || "$0.00"}
      </div>
    );
  };

  const ReportDateCell = ({ row }) => {
    const formatted = row.reportDate ? new Date(row.reportDate).toLocaleDateString('en-GB') : '-';
    return <div className="gOorhn">{formatted}</div>;
  };
  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    const navigate = useNavigate();
    const editgroup = (id) => navigate(`/admin/campaign-editor-update/${id}`);
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings reports-action-toggle">
          <FaCog className="reports-action-icon" />
          <FaCaretDown className="reports-action-caret" />
        </DropdownToggle>
        <DropdownMenu className="reports-actions-menu">
          <DropdownItem onClick={() => editgroup(row.id)}>Edit Campaign</DropdownItem>
          <DropdownItem onClick={() => navigate(`/admin/campaign/${row.id}/detailed-reporting/domains`, { state: { campaignId: row.id, campaignName: row.name } })}>Detailed reporting</DropdownItem>
          <DropdownItem>Summary</DropdownItem>
          <DropdownItem onClick={() => { setCampaignToCopy(row); toggleCopyModal(); }}>Copy Campaign</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
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
      cell: (row) => <div className="gOorhn">{row.impressionsWon?.toLocaleString('en-US') || 0}</div>,
      sortable: true,
      width: "150px",
    },
    "Win Percentage": {
      name: "Win Percentage",
      selector: (row) => row.winPercentage || "-",
      cell: (row) => <div className="gOorhn">{row.winPercentage ? `${Number(row.winPercentage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "-"}</div>,
      sortable: true,
      width: "120px",
    },
    "Audio/Video Starts": {
      name: "Audio/Video Starts",
      selector: (row) => row.audioVideoStarts || 0,
      cell: (row) => <div className="gOorhn">{row.audioVideoStarts != null ? Number(row.audioVideoStarts).toLocaleString('en-US') : 0}</div>,
      sortable: true,
      width: "150px",
    },
    "25% Complete": {
      name: "25% Complete",
      selector: (row) => row.percent25 || 0,
      cell: (row) => <div className="gOorhn">{row.percent25 != null ? Number(row.percent25).toLocaleString('en-US') : 0}</div>,
      sortable: true,
      width: "130px",
    },
    "50% Complete": {
      name: "50% Complete",
      selector: (row) => row.percent50 || 0,
      cell: (row) => <div className="gOorhn">{row.percent50 != null ? Number(row.percent50).toLocaleString('en-US') : 0}</div>,
      sortable: true,
      width: "130px",
    },
    "75% Complete": {
      name: "75% Complete",
      selector: (row) => row.percent75 || 0,
      cell: (row) => <div className="gOorhn">{row.percent75 != null ? Number(row.percent75).toLocaleString('en-US') : 0}</div>,
      sortable: true,
      width: "130px",
    },
    "100% Complete": {
      name: "100% Complete",
      selector: (row) => row.p100Complete || 0,
      cell: (row) => <div className="gOorhn">{row.p100Complete != null ? Number(row.p100Complete).toLocaleString('en-US') : 0}</div>,
      sortable: true,
      width: "130px",
    },
    "Completion Rate": {
      name: "Completion Rate",
      selector: (row) => row.completionRate || "-",
      cell: (row) => {
        const valStr = row.completionRate;
        const compRateVal = typeof valStr === "string" && valStr.includes("%") ? valStr : (!isNaN(Number(valStr)) ? `${Number(valStr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : (valStr || "-"));
        return <div className="gOorhn">{compRateVal}</div>;
      },
      sortable: true,
      width: "140px",
    },
    "Adv. Spend eCPCV": {
      name: "Adv. Spend eCPCV",
      selector: (row) => row.advSpendECPCV || "-",
      cell: (row) => {
        const val = Number(row.advSpendECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.advSpendECPCV || "-")}</div>;
      },
      sortable: true,
      width: "170px",
    },
    "Total eCPCV": {
      name: "Total eCPCV",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "All Time Budget": {
      name: "All Time Budget",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Adv. Spend": {
      name: "Adv. Spend",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Media Spend": {
      name: "Media Spend",
      selector: (row) => row.mediaSpend || "-",
      cell: (row) => {
        const val = Number(row.mediaSpend);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.mediaSpend || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Data Spend": {
      name: "Data Spend",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
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
    "Adv. Spend eCPC": {
      name: "Adv. Spend eCPC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Total eCPC": {
      name: "Total eCPC",
      selector: (row) => row.totalEcpc || "-",
      cell: (row) => {
        const val = Number(row.totalEcpc);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalEcpc || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "CTR": {
      name: "CTR",
      selector: (row) => row.ctr || "-",
      cell: (row) => <div className="gOorhn">{row.ctr ? `${Number(row.ctr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "EPC": {
      name: "EPC",
      selector: (row) => row.epc || "-",
      cell: (row) => {
        const val = Number(row.epc);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.epc || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Companion Imps. Won": {
      name: "Companion Imps. Won",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Companion Clicks": {
      name: "Companion Clicks",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Companion CTC": {
      name: "Companion CTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Companion CTC Revenue": {
      name: "Companion CTC Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Total Conversions": {
      name: "Total Conversions",
      selector: (row) => row.conversion || "-",
      cell: (row) => <div className="gOorhn">{row.conversion != null && row.conversion !== "-" ? Number(row.conversion).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "CTC": {
      name: "CTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "VTC": {
      name: "VTC",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Adv. Spend eCPA": {
      name: "Adv. Spend eCPA",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Total Revenue": {
      name: "Total Revenue",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => <div className="gOorhn">{row.totalSpend != null && row.totalSpend !== "-" ? Number(row.totalSpend).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</div>,
      sortable: true,
      width: "150px",
    },
    "Total eCPM": {
      name: "Total eCPM",
      selector: (row) => row.ecpm || "-",
      cell: (row) => {
        const val = Number(row.ecpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.ecpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "CTC Revenue": {
      name: "CTC Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "VTC Revenue": {
      name: "VTC Revenue",
      selector: (row) => row.totalECPCV || "-",
      cell: (row) => {
        const val = Number(row.totalECPCV);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalECPCV || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Total RPM": {
      name: "Total RPM",
      selector: (row) => row.totalRpm || 0,
      cell: (row) => {
        const val = Number(row.totalRpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalRpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "ROAS": {
      name: "ROAS",
      selector: (row) => row.roas || 0,
      cell: (row) => {
        const val = Number(row.roas);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.roas || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Advertiser Spend eCPM": {
      name: "Advertiser Spend eCPM",
      selector: (row) => row.ecpm || "-",
      cell: (row) => {
        const val = Number(row.ecpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.ecpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Platform Free": {
      name: "Platform Free",
      selector: (row) => row.groupPercentage || "-",
      cell: (row) => {
        const val = Number(row.groupPercentage);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.groupPercentage || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Platform ECPM": {
      name: "Platform ECPM",
      selector: (row) => row.platformEcpm || "-",
       cell: (row) => {
        const val = Number(row.platformEcpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.platformEcpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Media ECPM": {
      name: "Media ECPM",
      selector: (row) => row.mediaEcpm || "-",
      cell: (row) => {
        const val = Number(row.mediaEcpm);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.mediaEcpm || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Platform Spend": {
      name: "Platform Spend",
      selector: (row) => row.platformSpend || "-",
      cell: (row) => {
        const val = Number(row.platformSpend);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.platformSpend || "-")}</div>;
      },
      sortable: true,
      width: "150px",
    },
    "Spend": {
      name: "Spend",
      selector: (row) => row.totalSpend || "-",
      cell: (row) => {
        const val = Number(row.totalSpend);
        return <div className="gOorhn">{!isNaN(val) ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (row.totalSpend || "-")}</div>;
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
  const [isDailyCustomizationModalOpen, setDailyCustomizationModalOpen] = useState(false);
  const toggleDailyCustomizationModal = () => setDailyCustomizationModalOpen(!isDailyCustomizationModalOpen);
  const openDailyCustomizationModal = () => setDailyCustomizationModalOpen(true);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = "dailyReportingSelectedColumns";
  const LEGACY_STORAGE_KEYS = ["campaignsDailySelectedColumns"];
  const REQUIRED_COLUMNS = ["Hourly Reporting"];

  const normalizeSelectedColumns = (cols) => {
    let next = Array.isArray(cols) ? cols.filter((c) => ALL_COLUMNS[c]) : [];

    if (!next.length) {
      next = DEFAULT_SELECTED_COLUMNS.filter((c) => ALL_COLUMNS[c]);
    }

    REQUIRED_COLUMNS.forEach((c) => {
      if (ALL_COLUMNS[c] && !next.includes(c)) next.push(c);
    });

    return next;
  };
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const [campaign, setCampaign] = useState(null);

  // Custom Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [dateRangeLabel, setDateRangeLabel] = useState("");
  const [draftDateRange, setDraftDateRange] = useState({ startDate: null, endDate: null });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const tableDateRangeRef = useRef(null);

  const getPresetRange = useCallback((preset) => {
    const today = new Date();
    switch (preset) {
      case "Last 2 days": {
        const start = startOfDay(today);
        start.setDate(today.getDate() - 1);
        return { startDate: start, endDate: endOfDay(today) };
      }
      case "Today": return { startDate: startOfDay(today), endDate: endOfDay(today) };
      case "Yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
      }
      case "Last 7 days": {
        const start = startOfDay(today);
        start.setDate(today.getDate() - 6);
        return { startDate: start, endDate: endOfDay(today) };
      }
      case "Last 30 days": {
        const start = startOfDay(today);
        start.setDate(today.getDate() - 29);
        return { startDate: start, endDate: endOfDay(today) };
      }
      case "This month": {
        return { startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: endOfDay(today) };
      }
      case "Last month": {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { startDate: start, endDate: endOfDay(end) };
      }
      case "Last 3 months": {
        const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        return { startDate: start, endDate: endOfDay(today) };
      }
      default: return null;
    }
  }, []);

  const handlePresetClick = (preset) => {
    const range = getPresetRange(preset);
    if (range) setDraftDateRange(range);
  };

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
  }, []);

  useEffect(() => {
    if (!showDateRangePicker) return;

    const handleOutsideClick = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showDateRangePicker]);

  useEffect(() => {
    const initialRange = getPresetRange("Today");
    setStartDate(initialRange.startDate);
    setEndDate(initialRange.endDate);
    setDraftDateRange(initialRange);
    setDateRangeLabel("Today");
    setAppliedDateRange({ startDate: initialRange.startDate, endDate: initialRange.endDate, label: "Today" });
    setShowDateRangePicker(false);
  }, []);

  const handleDateRangeApply = useCallback(async () => {
    setStartDate(draftDateRange.startDate);
    setEndDate(draftDateRange.endDate);

    let foundPreset = null;
    const presets = ["Today", "Last 2 days", "Last 7 days", "Yesterday", "Last 30 days", "This month", "Last month", "Last 3 months"];
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
    setDraftDateRange({ startDate, endDate });
    setShowDateRangePicker(true);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const toggleCopyModal = () => setCopyModalOpen(!copyModalOpen);
  const [campaignToCopy, setCampaignToCopy] = useState(null);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const campaignRef = useRef(null);
  const campaignPortalRef = useRef(null);
  const [campaignDropdownPosition, setCampaignDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredCampaign, setHoveredCampaign] = useState(null);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

  const filteredDropdownCampaigns = useMemo(() => {
    const query = campaignSearchTerm.trim().toLowerCase();
    return (Array.isArray(allCampaigns) ? allCampaigns : []).filter((campaign) => {
      const val = String(campaign.id || campaign.campaignId || campaign.name || 0);
      const label = String(campaign.name || campaign.campaignName || val);
      return !query || label.toLowerCase().includes(query) || val.toLowerCase().includes(query);
    });
  }, [allCampaigns, campaignSearchTerm]);

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
    if (isCampaignOpen && campaignRef.current) {
      const updatePosition = () => {
        const rect = campaignRef.current.getBoundingClientRect();
        setCampaignDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
      };
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      return () => window.removeEventListener("scroll", updatePosition);
    }
  }, [isCampaignOpen]);

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
      window.addEventListener("scroll", updatePosition);
      return () => window.removeEventListener("scroll", updatePosition);
    }
  }, [isPerPageOpen]);

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
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => setCount(count + 1);
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    setStartDate(null);
    setEndDate(null);
    setDateRangeLabel("");
    setAppliedDateRange(null);
    try {
      await delay(1000);
      if (showArchived) {
        // handle archived if needed
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
      console.log("Fetching campaigns...");
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const payloadStartDate = startDate ? formatDateForAPI(startDate) : (appliedDateRange ? formatDateForAPI(appliedDateRange.startDate) : formatDateForAPI(defaultStartDate));
      const payloadEndDate = endDate ? formatDateForAPI(endDate) : (appliedDateRange ? formatDateForAPI(appliedDateRange.endDate) : formatDateForAPI(defaultEndDate));

      const payload = {
        userId: 1,
        userRole: ["ROLE_SUPER_ADMIN"],
        brandId: [35],
        groupId: [45],
        detailReport: true,
        campaignId: selectedDropdownCampaignId ? (isNaN(Number(selectedDropdownCampaignId)) ? [306] : [Number(selectedDropdownCampaignId)]) : [],
        startDate: payloadStartDate,
        endDate: payloadEndDate
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

      if (list.length === 0 && selectedDropdownCampaignId) {
        const selectedCamp = allCampaigns.find(c => String(c.id || c.campaignId || c.name) === String(selectedDropdownCampaignId)) || {};
        list = [{
          campaignId: selectedDropdownCampaignId,
          campaignName: selectedCamp.name || selectedDropdownCampaignId || "Unknown Campaign",
          reportDate: payloadEndDate || new Date().toISOString().split("T")[0],
          totalBudget: 0,
          cpmBid: 0,
          totalClicks: 0,
          totalWin: 0,
          totalConversions: 0
        }];
      }

      const formatted = list.map((item) => {
        const groupPercentage = 20;
        const kf = item;
        const campaignId = item.campaignId || item.id;
        const budget = item.campaignBudget ?? item.totalBudget ?? 0;
        const cpmBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const maxBid = item.campaignCpmBid ?? item.cpmBid ?? 0;
        const startDate = item.startDate ? item.startDate.split("T")[0] :
          (item.campaignStartDate ? item.campaignStartDate.split("T")[0] : "");
        const endDate = item.endDate ? item.endDate.split("T")[0] :
          (item.campaignEndDate ? item.campaignEndDate.split("T")[0] : "");
        const totalClicks = Number(item.totalClicks ?? 0);
        const totalWin = Number(item.totalWin ?? 0);
        const ctr = totalWin > 0 ? parseFloat(((totalClicks / totalWin) * 100).toFixed(2)) : 0;
        const platformEcpm = cpmBid * (groupPercentage / 100);
        const platformSpend = Number((totalWin / 1000) * platformEcpm ?? 0);
        const mediaEcpm = cpmBid - platformEcpm;
        const mediaSpend = Number((totalWin / 1000) * mediaEcpm ?? 0);
        const totalSpend = platformSpend + mediaSpend;
        const advSpendEcpm = ((platformSpend + mediaSpend) / totalWin) * 1000 || 0;

        return {
          id: campaignId,
          reportDate: item.reportDate,
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
        appliedDateRange.label
      );
    } else {
      fetchCampaignList();
    }
  }, [currentGroupId, currentCampaignId, appliedDateRange, selectedDropdownCampaignId]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentGroupId]);



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
        userId: 1,
        userRole: ["ROLE_SUPER_ADMIN"],
        brandId: [35],
        groupId: [45],
        campaignId: selectedDropdownCampaignId ? (isNaN(Number(selectedDropdownCampaignId)) ? [306] : [Number(selectedDropdownCampaignId)]) : [],
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        detailReport: true
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

      if (list.length === 0 && selectedDropdownCampaignId) {
        const selectedCamp = allCampaigns.find(c => String(c.id || c.campaignId || c.name) === String(selectedDropdownCampaignId)) || {};
        // When no data returned, use the requested end date so UI doesn't show today's date unexpectedly
        list = [{
          campaignId: selectedDropdownCampaignId,
          campaignName: selectedCamp.name || selectedDropdownCampaignId || "Unknown Campaign",
          reportDate: formattedEndDate || new Date().toISOString().split("T")[0],
          totalBudget: 0,
          cpmBid: 0,
          totalClicks: 0,
          totalWin: 0,
          totalConversions: 0
        }];
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
        const ctr = totalWin > 0 ? parseFloat(((totalClicks / totalWin) * 100).toFixed(2)) : 0;
        const platformEcpm = cpmBid * (groupPercentage / 100);
        const platformSpend = Number((totalWin / 1000) * platformEcpm ?? 0);
        const mediaEcpm = cpmBid - platformEcpm;
        const mediaSpend = Number((totalWin / 1000) * mediaEcpm ?? 0);
        const totalSpend = platformSpend + mediaSpend;
        const advSpendEcpm = ((platformSpend + mediaSpend) / totalWin) * 1000 || 0;

        return {
          id: item.campaignId || item.id,
          reportDate: item.reportDate,   // ✅ Direct mapping from API
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
    const selectedCampaignValue = String(selectedDropdownCampaignId || "").trim();
    const searchValue = searchTerm.toLowerCase();

    return rowData.filter((item) => {
      const itemCampaignValue = String(
        item.id ??
        item.campaignId ??
        item.originalData?.campaignId ??
        item.originalData?.id ??
        item.campaignName ??
        item.name ??
        "",
      );

      const matchesCampaign = !selectedCampaignValue || itemCampaignValue === selectedCampaignValue;
      const matchesSearch = item.name?.toLowerCase().includes(searchValue);

      return matchesCampaign && matchesSearch;
    });
  }, [rowData, searchTerm, selectedDropdownCampaignId]);

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
            case "Report Date": val = row.reportDate; break;
            case "Platform Spend": val = row.platformSpend; break;
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
    link.setAttribute("download", `daily_reporting_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          ? "Please select a group to view campaigns"
          : !selectedDropdownCampaignId
            ? "Please select a campaign to view reporting data"
            : "No reporting data available for the selected campaign"}
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
        backgroundColor: "#59823a !important",
        "& .gOorhn": {
          color: "white !important",
        },
      },
    },
  ];

  return (
    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete Group?"
          message="Only the db admin can undo this if you delete it!!!"
          name="DELETE"
          callback={modalCallback}
        />
      )}
      {creative === null && canViewDailyReport && (
        <div className="campaign-daily-content">
          <div className="campaign-daily-header reports-page-header">
            <div>
              <div className="campaign-daily-title">
                <h2>Daily Reporting</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3 reports-card">
            <CardBody className="py-3 reports-card-body">
              <div className="reports-toolbar-grid">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="cdi-date-filter reports-date-filter">
                    <div className="cdi-date-display reports-date-display" onClick={openDateRangePicker}>
                      <FaCalendarAlt className="reports-date-display-icon" />
                      <span className="reports-date-display-label">
                        {dateRangeLabel || 'Select dates'}
                      </span>
                      <FaChevronDown className="reports-date-display-chevron" />
                    </div>
                    {showDateRangePicker && (
                      <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table reports-date-range-popup" ref={datePickerRef}>
                        <div className="cd-date-range-presets">
                          <div className="cd-date-range-presets-title">Preset Ranges</div>
                          {[
                            "Today",
                            "Last 2 days",
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
                              onClick={() => handlePresetClick(preset)}
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

                  {/* Campaign Dropdown Filter */}
                  <div className="reports-campaign-filter">
                    <span className="reports-campaign-label">Campaign:</span>
                    <div ref={campaignRef} className="reports-campaign-control">
                      <div className="campaign-select-wrapper">
                        <input
                          readOnly
                          value={selectedDropdownCampaignId ? (Array.isArray(allCampaigns) ? allCampaigns : []).find(c => String(c.id || c.campaignId) === String(selectedDropdownCampaignId))?.name || selectedDropdownCampaignId : 'Select Campaign'}
                          className="campaign-select-input reports-campaign-input"
                          onClick={() => {
                            setCampaignSearchTerm("");
                            setHoveredCampaign(null);
                            setIsCampaignOpen((open) => !open);
                          }}
                        />
                        <FaChevronDown className={`reports-select-chevron ${isCampaignOpen ? 'is-open' : ''}`} />
                      </div>
                      {isCampaignOpen &&
                        typeof document !== 'undefined' &&
                        createPortal(
                          <div
                            ref={campaignPortalRef}
                            style={{
                              '--dropdown-top': `${campaignDropdownPosition.top}px`,
                              '--dropdown-left': `${campaignDropdownPosition.left}px`,
                            }}
                            className="custom-dropdown-menu biddeript-bd reports-dropdown-menu reports-campaign-dropdown-menu"
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
                                  className={`custom-dropdown-option reports-dropdown-option reports-campaign-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                >
                                  <span className={`tick-icon reports-dropdown-tick ${isSelected || isHovered ? 'active' : ''}`}>
                                    {(isSelected) && '✓'}
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

                  <button className="cdi-refresh-btn reports-refresh-btn" onClick={refresh} title="Refresh Data">
                    <i className={"fa fa-refresh " + (loading ? "fa-spin" : "")}></i>
                  </button>
                </div>

                <div className="cdi-controls-right reports-controls-right">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="cd-pagination-summary reports-pagination-summary">
                      {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
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
                            <FaChevronRight className="reports-pagination-chevron reports-pagination-chevron-rotated" />
                          </button>
                          <button
                            className="cd-pagination-page-btn reports-pagination-page-btn is-active"
                            type="button"
                          >
                            {currentPage}
                          </button>
                          <span className="reports-gutter">of</span>
                          <button
                            className="cd-pagination-page-btn reports-pagination-page-btn"
                            type="button"
                          >
                            {totalPages}
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="cd-pagination-nav-btn reports-pagination-nav-btn"
                            type="button"
                          >
                            <FaChevronRight className="reports-pagination-chevron" />
                          </button>
                          <div className="reports-items-per-page-wrapper" ref={perPageRef}>
                            <div className="campaign-select-wrapper">
                              <input
                                readOnly
                                value={`${perPage} per page`}
                                className="campaign-select-input reports-select-input reports-per-page-input"
                                onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                              />
                              <FaChevronDown className={`reports-select-chevron ${isPerPageOpen ? 'is-open' : ''}`} />
                            </div>
                            {isPerPageOpen &&
                              typeof document !== 'undefined' &&
                              createPortal(
                                <div
                                  ref={perPagePortalRef}
                                  style={{
                                    '--per-page-top': `${perPageDropdownPosition.top}px`,
                                    '--per-page-left': `${perPageDropdownPosition.left}px`,
                                  }}
                                  className="custom-dropdown-menu reports-dropdown-menu reports-per-page-menu"
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
                                        className={`custom-dropdown-option reports-dropdown-option reports-per-page-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                      >
                                        <span className={`tick-icon reports-dropdown-tick ${isSelected || isHovered ? 'active' : ''}`}>
                                          {(isSelected || isHovered) && '✓'}
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
                  </div>
                  <button className="cdi-export-btn reports-export-btn reports-export-btn-danger" onClick={handleExportCSV}>
                    <FaDownload /> EXPORT
                  </button>
                  <button className="cdi-export-btn reports-export-btn reports-export-btn-primary" onClick={openDailyCustomizationModal}>
                    <FaCog /> COLUMNS
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="campaign-daily-table-wrapper">
            <div className="reports-table-shell">
              <DataTable
                key={selectedColumns.join("|")}
                columns={buildColumns()}
                data={paginatedData}
                className="data-table"
                customStyles={customStyles}
                striped
                dense
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

          <DailyCustomizationModal
            isOpen={isDailyCustomizationModalOpen}
            toggle={toggleDailyCustomizationModal}
            selectedColumns={selectedColumns}
            setSelectedColumns={handleColumnChange}
            fixedColumns={["Hourly Reporting"]}
            defaultColumns={DEFAULT_SELECTED_COLUMNS}
            availableColumns={Object.keys(ALL_COLUMNS)}
          />

          {/* copyModal removed due to missing component */}
        </div>
      )}
      {creative === null && !canViewDailyReport && (
        <div className="alert alert-warning mt-3 reports-access-denied">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Daily Reporting.
        </div>
      )}
    </div>
  );
};

export default DailyReporting;
