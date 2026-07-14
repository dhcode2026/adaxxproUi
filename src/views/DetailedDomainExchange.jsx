import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Input,
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaChevronDown, FaChevronRight, FaDownload } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { kibanaFormuladomain, getAllCampaign } from "../views/api/Api";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/detailed-domain-exchange.css";

const DEFAULT_SELECTED_COLUMNS = [
  "Domain",
  "Domain App Id",
  "Clicks",
  "Impressions",
  "CPM Bid",
  "CTR",
];

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

const isSameDay = (first, second) => {
  if (!first || !second) return false;
  return startOfDay(first).getTime() === startOfDay(second).getTime();
};

const isSameDateRange = (firstRange, secondRange) => (
  isSameDay(firstRange?.startDate, secondRange?.startDate) &&
  isSameDay(firstRange?.endDate, secondRange?.endDate)
);

const getPresetRange = (preset) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case "Today":
      return { startDate: startOfToday, endDate: endOfToday };
    case "Yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    }
    case "2 Days Ago": {
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);
      return { startDate: startOfDay(twoDaysAgo), endDate: endOfDay(twoDaysAgo) };
    }
    case "Last 7 Days": {
      const start = startOfDay(today);
      start.setDate(today.getDate() - 6);
      return { startDate: start, endDate: endOfDay(today) };
    }
    case "Last 30 Days": {
      const start = startOfDay(today);
      start.setDate(today.getDate() - 29);
      return { startDate: start, endDate: endOfDay(today) };
    }
    default: return null;
  }
};

const DetailedDomainExchange = (props) => {
  const { brandId: urlBrandId, campaignId: urlCampaignId } = useParams();
  const [currentBrandId, setCurrentBrandId] = useState(props.brandId || urlBrandId || null);
  const [currentCampaignId, setCurrentCampaignId] = useState(props.campaignId || urlCampaignId || null);
  const [allCampaigns, setAllCampaigns] = useState([]);

  useEffect(() => {
    if (props.brandId && props.brandId !== currentBrandId) {
      setCurrentBrandId(props.brandId);
    }
  }, [props.brandId]);

  useEffect(() => {
    if (props.campaignId && props.campaignId !== currentCampaignId) {
      setCurrentCampaignId(props.campaignId);
    }
  }, [props.campaignId]);

  const DomainCell = ({ row }) => <div className="gOorhn">{row.domain}</div>;
  const DomainDateCell = ({ row }) => <div className="gOorhn">{row.campaignDomainDate}</div>;
  const DomainAppIdCell = ({ row }) => <div className="gOorhn">{row.id}</div>;
  const ClicksCell = ({ row }) => <div className="gOorhn">{row.clicks}</div>;
  const ImpressionsCell = ({ row }) => <div className="gOorhn">{row.impressions}</div>;

  const CpmBidCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    };
    return <div className="gOorhn">{formatCurrency(row.cpmbid)}</div>;
  };

  const CTRCell = ({ row }) => {
    const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : "0.00";
    return <div className="gOorhn">{ctr}%</div>;
  };

  const ALL_COLUMNS = {
    "Domain Date": {
      name: "Domain Date",
      selector: (row) => row.campaignDomainDate,
      cell: (row) => <DomainDateCell row={row} />,
      sortable: true,
      width: "300px",
    },
    "Domain": {
      name: "Domain",
      selector: (row) => row.domain,
      cell: (row) => <DomainCell row={row} />,
      sortable: true,
      width: "300px",
    },
    "Domain App Id": {
      name: "Domain App Id",
      selector: (row) => row.id,
      cell: (row) => <DomainAppIdCell row={row} />,
      sortable: true,
      width: "120px",
    },
    "Clicks": {
      name: "Clicks",
      selector: (row) => row.clicks,
      cell: (row) => <ClicksCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Impressions": {
      name: "Impressions",
      selector: (row) => row.impressions,
      cell: (row) => <ImpressionsCell row={row} />,
      sortable: true,
      width: "120px",
    },
    "CPM Bid": {
      name: "CPM Bid",
      selector: (row) => row.cpmbid,
      cell: (row) => <CpmBidCell row={row} />,
      sortable: true,
      width: "120px",
    },
    "CTR": {
      name: "CTR",
      selector: (row) => row.ctr,
      cell: (row) => <CTRCell row={row} />,
      sortable: true,
      width: "100px",
    },
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [rowData, setRowData] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const STORAGE_KEY = 'domainListSelectedColumns';
  // Helper function to get date 30 days ago
  const getLastOneMonthDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };
  const [startDate, setStartDate] = useState(getLastOneMonthDate());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedLabel, setSelectedLabel] = useState("Last 30 Days");

  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({ startDate: null, endDate: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [campaignDropdownPosition, setCampaignDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredCampaign, setHoveredCampaign] = useState(null);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");

  const openDateRangePicker = () => {
    setDraftDateRange({ startDate, endDate });
    setShowDateRangePicker(true);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const tableDateRangeRef = useRef(null);
  const campaignRef = useRef(null);
  const campaignPortalRef = useRef(null);
  const [selectedDropdownCampaignId, setSelectedDropdownCampaignId] = useState("306");
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [isCampaignPositioned, setIsCampaignPositioned] = useState(false);
  const campaignDropdownRef = useRef(null);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [isPerPagePositioned, setIsPerPagePositioned] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);
  const [hoveredPerPage, setHoveredPerPage] = useState(null);
  const [canViewDomains, setCanViewDomains] = useState(false);
  const [canCreateDomains, setCanCreateDomains] = useState(false);
  const [canEditDomains, setCanEditDomains] = useState(false);
  const [canDeleteDomains, setCanDeleteDomains] = useState(false);
  const [canUpdateDomains, setCanUpdateDomains] = useState(false);

  const filteredCampaigns = useMemo(() => {
    const query = campaignSearchTerm.trim().toLowerCase();
    return (Array.isArray(allCampaigns) ? allCampaigns : []).filter((campaign) => {
      const val = String(campaign.id || campaign.campaignId || campaign.name || 0);
      const label = String(campaign.name || campaign.campaignName || val);
      return !query || label.toLowerCase().includes(query) || val.toLowerCase().includes(query);
    });
  }, [allCampaigns, campaignSearchTerm]);

  useEffect(() => {
    const hasCreatePermission = canCreate("Domains");
    const hasViewPermission = canView("Domains");
    const hasEditPermission = canEdit("Domains");
    const hasDeletePermission = canDelete("Domains");
    const hasUpdatePermission = canUpdate("Domains");
    setCanCreateDomains(hasCreatePermission);
    setCanViewDomains(hasViewPermission);
    setCanEditDomains(hasEditPermission);
    setCanDeleteDomains(hasDeletePermission);
    setCanUpdateDomains(hasUpdatePermission);
  }, []);

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch domain data from API
  const fetchDomainData = async (start = null, end = null) => {
    const effectiveCampaignId = selectedDropdownCampaignId
      ? (isNaN(Number(selectedDropdownCampaignId)) ? 306 : Number(selectedDropdownCampaignId))
      : 306;

    if (!effectiveCampaignId) {
      console.log("No campaignId provided, skipping domain fetch");
      setRowData([]);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        campaignId: effectiveCampaignId,
        startDate: start ? formatDateForAPI(start) : "",
        endDate: end ? formatDateForAPI(end) : "",
      };
      console.log("Calling kibanaFormuladomain with payload:", payload);
      const res = await kibanaFormuladomain(payload);
      console.log("Domain API Response:", res.data);

      let domains = [];
      if (res.data?.data?.informationKibanaCampaignDomains) {
        domains = res.data.data.informationKibanaCampaignDomains;
      } else if (Array.isArray(res.data?.data)) {
        domains = res.data.data;
      } else if (Array.isArray(res.data)) {
        domains = res.data;
      }

      const formatted = domains.map((item, index) => ({
        id: item.kibanaCampaignDomainId || item.domain || `domain-${index}`,
        domain: decodeURIComponent(item.domain || ""),
        clicks: item.totalClicks || 0,
        impressions: item.totalImpression || 0,
        campaignDomainDate: item.campaignDomainDate || "",
        cpmbid: item.avgCpmBid || 0,
        ctr: item.ctr || 0,
      }));

      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching domain data:", err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch campaigns for dropdown
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
          const firstVal = firstCamp.id || firstCamp.campaignId || firstCamp.name || 306;
          setSelectedDropdownCampaignId(firstVal.toString());
        }
      } catch (err) {
        console.error("Failed to fetch campaigns for dropdown", err);
      }
    };
    fetchDropdownCampaigns();
  }, []);

  // Fetch data when campaign changes or on initial load with date range
  useEffect(() => {
    // Initial fetch with last one month date range
    fetchDomainData(startDate, endDate);
  }, [selectedDropdownCampaignId]);

  // Set applied date range on initial load
  useEffect(() => {
    setAppliedDateRange({ startDate, endDate, label: "Last 30 Days" });
  }, []);

  const redraw = () => setCount(count + 1);
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    try {
      await delay(500);
      await fetchDomainData(startDate, endDate);
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case "Today":
        start = end = today;
        break;
      case "Yesterday":
        start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
        break;
      case "2 Days Ago":
        start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
        break;
      case "Last 7 Days":
        end = today;
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
        break;
      case "Last 30 Days":
        end = today;
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
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

  const handleApply = async () => {
    setShowDateRangePicker(false);
    setStartDate(draftDateRange.startDate);
    setEndDate(draftDateRange.endDate);
    const dateRange = { startDate: draftDateRange.startDate, endDate: draftDateRange.endDate, label: selectedLabel };
    setAppliedDateRange(dateRange);
    await fetchDomainData(draftDateRange.startDate, draftDateRange.endDate);
  };

  const handleClearDateRange = async () => {
    const newStartDate = getLastOneMonthDate();
    const newEndDate = new Date();
    setDraftDateRange({ startDate: newStartDate, endDate: newEndDate });
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setSelectedLabel("Last 30 Days");
    setAppliedDateRange({ startDate: newStartDate, endDate: newEndDate, label: "Last 30 Days" });
    setShowDateRangePicker(false);
    await fetchDomainData(newStartDate, newEndDate);
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
    if (isCampaignOpen && campaignRef.current) {
      const updatePosition = () => {
        const rect = campaignRef.current.getBoundingClientRect();
        setCampaignDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
        });
        setIsCampaignPositioned(true);
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        setIsCampaignPositioned(false);
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
        setIsPerPagePositioned(true);
      };

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
        setIsPerPagePositioned(false);
      };
    }
  }, [isPerPageOpen]);

  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, perPage, selectedDropdownCampaignId]);

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

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Domains");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "domains_export.xlsx");
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
        {!selectedDropdownCampaignId
          ? "No campaign selected. Please select a campaign to view domains."
          : "No Exchange data available for this campaign."}
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
        backgroundColor: '#FBEDEF !important',
        '& .gOorhn': { color: 'black !important' }
      },
    },
  ];

  return (
    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete?"
          message="This action cannot be undone."
          name="DELETE"
          callback={() => setModal(false)}
        />
      )}
      {creative === null && canViewDomains && (
        <div className="campaign-daily-content">
          <div className="campaign-daily-header dde-header">
            <div>
              <div className="campaign-daily-title">
                <h2>Domains</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3 dde-card">
            <CardBody className="py-3 dde-card-body">
              <div className="dde-toolbar-grid">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="cdi-search-box">
                    <input
                      type="text"
                      placeholder="Search domains"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="dde-search-input"
                    />
                  </div>

                  {/* Date Filter Dropdown */}
                  <div className="dde-date-filter">
                    <div
                      className="dde-date-display"
                      onClick={openDateRangePicker}
                    >
                      <FaCalendarAlt className="dde-date-display-icon" />
                      <span>
                        {formatDateRange()}
                      </span>
                      <FaChevronDown className="dde-date-display-chevron" />
                    </div>

                    {showDateRangePicker && (
                      <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table" ref={datePickerRef}>
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

                  {/* Campaign Dropdown Filter */}
                  <div className="dde-campaign-filter">
                    <span className="dde-campaign-label">Campaign:</span>
                    <div ref={campaignRef} className="dde-campaign-control">
                      <div className="campaign-select-wrapper">
                        <input
                          readOnly
                          value={selectedDropdownCampaignId ? (Array.isArray(allCampaigns) ? allCampaigns : []).find(c => String(c.id || c.campaignId || c.name) === String(selectedDropdownCampaignId))?.name || selectedDropdownCampaignId : 'Select Campaign'}
                          className="dde-campaign-input"
                          onClick={() => {
                            setCampaignSearchTerm("");
                            setHoveredCampaign(null);
                            setIsCampaignOpen((open) => !open);
                          }}
                        />
                        <FaChevronDown
                          className={`dde-campaign-chevron ${isCampaignOpen ? 'is-open' : ''}`}
                        />
                      </div>
                      {isCampaignOpen &&
                        typeof document !== 'undefined' &&
                        ReactDOM.createPortal(
                          <div
                            ref={campaignPortalRef}
                            style={{
                              '--dropdown-top': `${campaignDropdownPosition.top}px`,
                              '--dropdown-left': `${campaignDropdownPosition.left}px`,
                            }}
                            className={`dde-campaign-dropdown ${isCampaignPositioned ? 'is-positioned' : ''}`}
                          >
                            <div className="dde-campaign-search-wrap">
                              <input
                                type="text"
                                value={campaignSearchTerm}
                                onChange={(e) => setCampaignSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Search campaign"
                                autoFocus
                                className="dde-campaign-search-input"
                              />
                            </div>
                            {filteredCampaigns.map((c) => {
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
                                  className={`dde-campaign-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                >
                                  <span className="dde-campaign-tick">
                                    {(isSelected) && '✓'}
                                  </span>
                                  <span className="dde-campaign-label-text">
                                    {c.name || c.campaignName || val}
                                  </span>
                                </div>
                              );
                            })}
                            {filteredCampaigns.length === 0 && (
                              <div className="dde-campaign-empty-state">
                                No campaigns found
                              </div>
                            )}
                          </div>,
                          document.body,
                        )}
                    </div>
                  </div>

                  <button className="dde-refresh-btn" onClick={refresh} title="Refresh Data">
                    <i className={"fa fa-refresh " + (loading ? "fa-spin" : "")}></i>
                  </button>
                </div>

                <div className="dde-controls-right">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="dde-pagination-summary">
                      {filteredData.length
                        ? `${Math.min(currentPage * perPage, filteredData.length)} of ${filteredData.length} entries`
                        : "0 entries"}
                    </div>
                    <div className="dde-pagination-toolbar">
                      {totalPages > 1 && (
                        <div className="dde-pagination-controls">
                          <button
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="dde-pagination-nav-btn"
                            type="button"
                          >
                            <FaChevronRight className="dde-pagination-chevron-rotated" />
                          </button>
                          <button
                            className="dde-pagination-page-btn is-active"
                            type="button"
                          >
                            {currentPage}
                          </button>
                          <span className="dde-pagination-gutter">of</span>
                          <button
                            className="dde-pagination-page-btn"
                            type="button"
                          >
                            {totalPages}
                          </button>
                          <button
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage >= totalPages}
                            className="dde-pagination-nav-btn"
                            type="button"
                          >
                            <FaChevronRight className="dde-pagination-chevron" />
                          </button>
                          <div className="dde-per-page-wrapper" ref={perPageRef}>
                            <div className="campaign-select-wrapper">
                              <input
                                readOnly
                                value={`${perPage} per page`}
                                className="dde-per-page-input"
                                onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                              />
                              <FaChevronDown
                                className={`dde-per-page-chevron ${isPerPageOpen ? 'is-open' : ''}`}
                              />
                            </div>
                            {isPerPageOpen &&
                              typeof document !== 'undefined' &&
                              ReactDOM.createPortal(
                                <div
                                  ref={perPagePortalRef}
                                  style={{
                                    '--per-page-top': `${perPageDropdownPosition.top}px`,
                                    '--per-page-left': `${perPageDropdownPosition.left}px`,
                                  }}
                                  className={`dde-per-page-dropdown ${isPerPagePositioned ? 'is-positioned' : ''}`}
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
                                        className={`dde-per-page-option ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                                      >
                                        <span className="dde-per-page-tick">
                                          {isSelected && '✓'}
                                        </span>
                                        <span className="dde-per-page-label">
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
                  <button className="dde-export-btn" onClick={exportToExcel}>
                    <FaDownload /> EXPORT CSV
                  </button>
                </div>
              </div>

            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div className="dde-table-wrapper">
              <div className="dde-table-inner">
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
        </div>
      )}
      {creative === null && !canViewDomains && (
        <div className="alert alert-warning mt-3 dde-access-denied">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Domains.
        </div>
      )}
    </div>
  );
};

export default DetailedDomainExchange;
