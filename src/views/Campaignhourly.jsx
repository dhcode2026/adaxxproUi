import React, { useState, useEffect, useMemo, useRef, Fragment, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  CardBody,
  DropdownItem,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaCaretUp, FaChevronDown, FaDownload, FaChevronRight } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { listCampaigngroup, getkibanaFormulahourly } from "../views/api/Api";

import HourlyCustomizationModal from "../views/customizationcolumns/HourlyCustomizationModal";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "../assets/css/reports.css";

const DEFAULT_SELECTED_COLUMNS = [
  "Report Date",
  "Report Time",
  "Name",
  "ID",
  "Default Bid",
  "Hourly Budget",
  "Max Bid",
  "Platform Spend",
];

const expandHourlyData = (apiData, rangeStartDate, rangeEndDate, currentGroupId, fallbackId = null, fallbackName = "Campaign") => {
  if ((!apiData || !apiData.length) && !fallbackId) return [];
  let startDateObj, endDateObj;
  if (rangeStartDate && rangeEndDate) {
    startDateObj = new Date(rangeStartDate);
    endDateObj = new Date(rangeEndDate);
  } else {
    const dates = apiData.map(item => item.reportDate).filter(Boolean);
    if (dates.length) {
      const sorted = [...new Set(dates)].sort();
      startDateObj = new Date(sorted[0]);
      endDateObj = new Date(sorted[sorted.length - 1]);
    } else {
      const today = new Date();
      startDateObj = today;
      endDateObj = today;
    }
  }
  const dateList = [];
  const currentDate = new Date(startDateObj);
  while (currentDate <= endDateObj) {
    dateList.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  const dataMap = new Map();
  apiData.forEach(item => {
    const campaignId = item.campaignId || item.id;
    const reportDate = item.reportDate;
    if (!campaignId || !reportDate) return;
    const key = `${campaignId}|${reportDate}`;
    if (!dataMap.has(key)) dataMap.set(key, []);
    dataMap.get(key).push(item);
  });

  const expandedRows = [];
  const campaignIdsSet = new Set((apiData || []).map(item => item.campaignId || item.id).filter(Boolean));
  if (fallbackId) {
    const normalizedId = isNaN(fallbackId) ? fallbackId : Number(fallbackId);
    campaignIdsSet.add(normalizedId);
  }
  const campaignIds = Array.from(campaignIdsSet);

  for (const campaignId of campaignIds) {
    const firstCampaign = (apiData || []).find(item => {
      const id = item.campaignId || item.id;
      return id == campaignId;
    });
    const campaignName = firstCampaign?.campaignName || firstCampaign?.name || fallbackName || "Unnamed Campaign";
    const campaignBudget = firstCampaign?.campaignBudget || 0;
    const campaignCpmBid = firstCampaign?.campaignCpmBid || 0;

    for (const date of dateList) {
      const dateStr = date.toISOString().split('T')[0];
      const key = `${campaignId}|${dateStr}`;
      const existingHourlyData = dataMap.get(key) || [];
      const hourMap = new Map();
      existingHourlyData.forEach(item => {
        const hourBucket = item.hourBucket;
        if (hourBucket) {
          hourMap.set(hourBucket, item);
        }
      });
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        const hourBucket = `${dateStr} ${hourStr}:00:00`;
        const existing = hourMap.get(hourBucket);
        const defaultRow = {
          id: campaignId,
          reportDate: dateStr,
          hourBucket: hourBucket,
          name: campaignName,
          budget: campaignBudget,
          cpmBid: campaignCpmBid,
          max_bid: campaignCpmBid,
          startDate: firstCampaign?.campaignStartDate?.split('T')[0] || "",
          endDate: firstCampaign?.campaignEndDate?.split('T')[0] || "",
          groupId: currentGroupId,
          impressionsWon: 0,
          ctr: 0,
          clicks: 0,
          totalClicks: 0,
          conversion: 0,
          winPercentage: 0,
          totalCost: 0,
          groupPercentage: 20,
          totalSpend: 0,
          ecpm: 0,
          platformEcpm: 0,
          mediaEcpm: 0,
          platformSpend: 0,
          mediaSpend: 0,
          epc: 0,
          totalRpm: 0,
          roas: 0,
          totalEcpc: 0,
          completionRate: 0,
          percent25: 0,
          percent50: 0,
          percent75: 0,
          p100Complete: 0,
          advSpendECPCV: 0,
          totalECPCV: 0,
          audioVideoStarts: 0,
          totalEligibleImps: 0,
          totalMeasuredImps: 0,
          totalViewableImps: 0,
          measuredRate: 0,
          viewableRate: 0,
          eligibleSpend: 0,
          eligibleVCPM: 0,
        };

        if (existing) {
          const groupPercentage = existing.groupPercentage || 20;
          const cpmBid = existing.campaignCpmBid ?? existing.cpmBid ?? 0;
          const totalWin = existing.totalWin ?? 0;
          const platformEcpm = cpmBid * (groupPercentage / 100);
          const platformSpend = (totalWin / 1000) * platformEcpm;
          const mediaEcpm = cpmBid - platformEcpm;
          const mediaSpend = (totalWin / 1000) * mediaEcpm;
          const totalSpend = platformSpend + mediaSpend;

          defaultRow.impressionsWon = totalWin;
          defaultRow.winPercentage = existing.totalWinPercentage ?? 0;
          defaultRow.totalClicks = existing.totalClicks ?? 0;
          defaultRow.clicks = existing.totalClicks ?? 0;
          defaultRow.conversion = existing.totalConversions ?? 0;
          defaultRow.totalSpend = totalSpend;
          defaultRow.platformSpend = platformSpend;
          defaultRow.mediaSpend = mediaSpend;
          defaultRow.ecpm = cpmBid;
          defaultRow.platformEcpm = platformEcpm;
          defaultRow.mediaEcpm = mediaEcpm;
          defaultRow.ctr = existing.totalCtr ? existing.totalCtr * 100 : 0;
          defaultRow.epc = existing.totalEpc ?? 0;
          defaultRow.totalRpm = existing.totalRpm ?? 0;
          defaultRow.roas = existing.roas ?? 0;
          defaultRow.totalEcpc = existing.totalEcpc ?? 0;
          defaultRow.completionRate = existing.completionRate ?? 0;
          defaultRow.percent25 = existing.percent25 ?? 0;
          defaultRow.percent50 = existing.percent50 ?? 0;
          defaultRow.percent75 = existing.percent75 ?? 0;
          defaultRow.p100Complete = existing.p100Complete ?? 0;
        }

        expandedRows.push(defaultRow);
      }
    }
  }

  return expandedRows;
};

const Campaignhourly = (props) => {
  const {
    groupId: urlGroupId,
    groupName: urlGroupName,
    campaignId: urlCampaignId,
    reportDate: urlReportDate,
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

  const tableDateRangeRef = useRef(null);



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
        <span className="badge bg-secondary ms-2 reports-badge-inline" />
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
    const formatted = row.hourBucket ? new Date(row.hourBucket).toLocaleTimeString("en-GB") : "-";
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
  const [hourlycustomizationModal, setHourlyCustomizationModalOpen] =
    useState(false);
  const toggleHourlyCustomizationModal = () =>
    setHourlyCustomizationModalOpen(!hourlycustomizationModal);
  const [selectedColumns, setSelectedColumns] = useState(
    DEFAULT_SELECTED_COLUMNS,
  );
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const STORAGE_KEY = "campaignsHourlySelectedColumns";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const [campaign, setCampaign] = useState(null);
  const selectedDropdownCampaignId = initialCampaignId
    ? String(initialCampaignId)
    : "";
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({ startDate: null, endDate: null });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const openDateRangePicker = () => {
    setDraftDateRange({ startDate, endDate });
    setShowDateRangePicker(true);
  };
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const toggleCopyModal = () => setCopyModalOpen(!copyModalOpen);
  const [campaignToCopy, setCampaignToCopy] = useState(null);

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

  useEffect(() => {
    if (urlReportDate) {
      const date = new Date(urlReportDate);
      if (!isNaN(date.getTime())) {
        setStartDate(date);
        setEndDate(date);
        setAppliedDateRange({
          startDate: date,
          endDate: date,
          label: urlReportDate,
        });
      }
    }
  }, [urlReportDate]);

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
          campaignId: currentCampaignId ? [Number(currentCampaignId)] : [],
          detailReport: true,
        };

        console.log("getkibanaFormula payload:", payload);
        const res = await getkibanaFormulahourly(payload);
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

      // Determine the date range for expansion: if no date range applied, use today
      let startDateForExpand = null;
      let endDateForExpand = null;
      if (appliedDateRange) {
        startDateForExpand = appliedDateRange.startDate;
        endDateForExpand = appliedDateRange.endDate;
      } else if (urlReportDate) {
        const date = new Date(urlReportDate);
        startDateForExpand = isNaN(date.getTime()) ? new Date() : date;
        endDateForExpand = startDateForExpand;
      } else {
        const today = new Date();
        startDateForExpand = today;
        endDateForExpand = today;
      }

      const expandedData = expandHourlyData(
        list,
        startDateForExpand,
        endDateForExpand,
        currentGroupId,
        currentCampaignId,
        location.state?.campaignName
      );
      setRowData(expandedData);
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
    setSelectedRowKey(null);
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
    setDraftDateRange({ startDate: start, endDate: end });
  };

  const formatPickerValue = useCallback((date) => {
    if (!date) return "-- / -- / ----";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  }, []);

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

      const payload = {
        userId,
        campaignId: currentCampaignId ? [Number(currentCampaignId)] : [],
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        detailReport: true,
      };

      console.log("getkibanaFormula payload with date range:", payload);
      const res = await getkibanaFormulahourly(payload);
      console.log("API Response with date range:", res.data);

      let list = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      } else {
        list = [];
      }

      const expandedData = expandHourlyData(
        list,
        start,
        end,
        currentGroupId,
        currentCampaignId,
        location.state?.campaignName
      );
      setRowData(expandedData);
    } catch (err) {
      console.error("Error fetching data by date range:", err);
      await fetchCampaignList();
    }
  };

  const handleApply = async () => {
    setShowDateRangePicker(false);
    setStartDate(draftDateRange.startDate);
    setEndDate(draftDateRange.endDate);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate: draftDateRange.startDate,
      endDate: draftDateRange.endDate,
      label: selectedLabel,
      apiRange: apiRangeValue,
    };
    setAppliedDateRange(dateRange);

    try {
      await fetchgroupListByDateRange(draftDateRange.startDate, draftDateRange.endDate, apiRangeValue);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      await fetchCampaignList();
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = async () => {
    setShowDateRangePicker(false);
    setStartDate(draftDateRange.startDate);
    setEndDate(draftDateRange.endDate);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate: draftDateRange.startDate,
      endDate: draftDateRange.endDate,
      label: selectedLabel,
      apiRange: apiRangeValue,
    };
    setAppliedDateRange(dateRange);
    try {
      await fetchgroupListByDateRange(draftDateRange.startDate, draftDateRange.endDate, apiRangeValue);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      await fetchCampaignList();
    } finally {
      setLoading(false);
    }
  };

  const handleClearDateRange = async () => {
    setDraftDateRange({ startDate: null, endDate: null });
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("");
    setAppliedDateRange(null);
    setShowDateRangePicker(false);
    setLoading(true);
    try {
      await fetchCampaignList();
    } catch (error) {
      console.error("Error clearing date range:", error);
    } finally {
      setLoading(false);
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

      return !selectedCampaignValue || itemCampaignValue === selectedCampaignValue;
    });
  }, [rowData, selectedDropdownCampaignId]);

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
      `Hourly_Reporting_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRowClicked = (row) => {
    setSelectedRowKey(`${row.id ?? ""}-${row.reportDate ?? ""}-${row.hourBucket ?? ""}`);
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
      when: (row) => `${row.id ?? ""}-${row.reportDate ?? ""}-${row.hourBucket ?? ""}` === selectedRowKey,
      style: {
        backgroundColor: "#FBEDEF !important",
        "& .gOorhn": {
          color: "black !important",
        },
      },
    },
  ];

  return (
    <div className="campaign-daily-container">
      <div className="campaign-daily-content">
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
                 
                     <div className="campaign-daily-content">
                      <div className="campaign-daily-header reports-page-header">
                      <div className="campaign-daily-title reports-page-title">
                        <h2>Hourly Reporting</h2>
                      </div>
                    </div>
                  </div>

                  <Card className="mb-3 reports-card">
              <CardBody className="py-3 reports-card-body">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                  
                       <div className="reports-date-filter" ref={datePickerRef}>
                        <div
                          className="reports-date-display"
                          onClick={openDateRangePicker}
                          id="cdi-date-display"
                        >
                          <FaCalendarAlt className="reports-date-display-icon" />
                          <span className="reports-date-display-label">
                            {formatDateRange()}
                          </span>
                          <FaChevronDown className="reports-date-display-chevron" />
                        </div>

                        {showDateRangePicker && (
                          <div className="reports-date-range-popup cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table">
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
                                  className={`cd-date-range-preset-btn ${selectedLabel === preset ? "is-active" : ""}`}
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
                                  disabled={!draftDateRange.startDate && !draftDateRange.endDate && !startDate && !endDate}
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
                                  onClick={handleApplyAll}
                                  disabled={!draftDateRange.startDate || !draftDateRange.endDate}
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button className="reports-refresh-btn" onClick={refresh} title="Refresh Data">
                        <i className={"fa fa-refresh " + (loading ? "fa-spin" : "")}></i>
                      </button>
                    </div>

                    <div className="reports-toolbar-right">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <div className="reports-pagination-summary">
                          {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                        </div>
                        <div className="reports-pagination-toolbar">
                          {totalPages > 1 && (
                            <div className="reports-pagination-controls">
                              <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="reports-pagination-nav-btn"
                              type="button">
                            <FaChevronRight className="reports-pagination-chevron reports-pagination-chevron-rotated" />
                          </button>
                          <button
                          className="reports-pagination-page-btn is-active"
                          type="button">
                          {currentPage}
                        </button>
                        <span className="reports-gutter">of</span>
                        <button className="reports-pagination-page-btn" type="button">
                          {totalPages}
                        </button>
                        <button  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}  disabled={currentPage >= totalPages}  className="reports-pagination-nav-btn"  type="button">
                          <FaChevronRight className="reports-pagination-chevron" />
                        </button>
                        <div className="reports-items-per-page-wrapper" ref={perPageRef}>
                          <div className="campaign-select-wrapper">
                            <input
                              readOnly
                              value={`${perPage} per page`}
                              className="reports-per-page-input"
                              onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                            />
                            <FaChevronDown className={`reports-select-chevron ${isPerPageOpen ? 'is-open' : ''}`} />
                          </div>
                          {isPerPageOpen &&
                            typeof document !== 'undefined' &&
                            createPortal(
                              <div
                                ref={perPagePortalRef}
                                className="reports-per-page-menu"
                                style={{
                                  top: `${perPageDropdownPosition.top}px`,
                                  left: `${perPageDropdownPosition.left}px`,
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
                                      className={`reports-per-page-option ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}`}
                                    >
                                      <span className={`reports-per-page-tick ${isSelected ? 'is-active' : ''}`}>
                                        {isSelected && '✓'}
                                      </span>
                                      <span className={`reports-per-page-label ${isSelected || isHovered ? 'is-active' : ''}`}>
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

                      <button className="reports-export-btn reports-export-btn-danger" onClick={exportToExcel}>
                        <FaDownload /> EXPORT
                      </button>
                      <button className="reports-export-btn reports-export-btn-primary" onClick={toggleHourlyCustomizationModal}>
                        <FaCog /> COLUMNS
                      </button>
                    </div>
                  </div>
                  </CardBody>
                  </Card>
                  <HourlyCustomizationModal
                    isOpen={hourlycustomizationModal}
                    toggle={toggleHourlyCustomizationModal}
                    selectedColumns={selectedColumns}
                    setSelectedColumns={handleColumnChange}
                  />
                  
                  <div className="reports-table-wrapper campaign-daily-table-wrapper">
                    <div className="reports-table-shell">
                      <div className="reports-table-inner">
                        <DataTable
                          className="data-table"
                          key={selectedColumns.join("|")}
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
      </div>
    </div>
  );
};

export default Campaignhourly;
