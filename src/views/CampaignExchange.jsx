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

const DEFAULT_SELECTED_COLUMNS = [
  "Exchange",
  "Exchange App Id",
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

const CampaignExchange = (props) => {
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

  const DomainCell = ({ row }) => <div className="gOorhn">{row.exchange}</div>;
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
    "Exchange": {
      name: "Exchange",
      selector: (row) => row.exchange,
      cell: (row) => <DomainCell row={row} />,
      sortable: true,
      width: "300px",
    },
    "Exchange App Id": {
      name: "Exchange App Id",
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
  const campaignRef = useRef(null);
  const campaignPortalRef = useRef(null);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const STORAGE_KEY = 'domainListSelectedColumns';
  // Helper function to get date 30 days ago
  const getLastOneMonthDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };

  // Set initial date range to last one month (30 days ago to today)
  const [startDate, setStartDate] = useState(getLastOneMonthDate());
  const [endDate, setEndDate] = useState(new Date());
  const [selectedLabel, setSelectedLabel] = useState("Last 30 Days");

  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({ startDate: null, endDate: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [campaignDropdownPosition, setCampaignDropdownPosition] = useState({ top: 0, left: 0 });
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredCampaign, setHoveredCampaign] = useState(null);
  const [hoveredPerPage, setHoveredPerPage] = useState(null);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");

  const openDateRangePicker = () => {
    setDraftDateRange({ startDate, endDate });
    setShowDateRangePicker(true);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [selectedDropdownCampaignId, setSelectedDropdownCampaignId] = useState("306");
  const [canViewExchanges, setCanViewExchanges] = useState(false);
  const [canCreateExchanges, setCanCreateExchanges] = useState(false);
  const [canEditExchanges, setCanEditExchanges] = useState(false);
  const [canDeleteExchanges, setCanDeleteExchanges] = useState(false);
  const [canUpdateExchanges, setCanUpdateExchanges] = useState(false);

  const filteredDropdownCampaigns = useMemo(() => {
    const query = campaignSearchTerm.trim().toLowerCase();
    return (Array.isArray(allCampaigns) ? allCampaigns : []).filter((campaign) => {
      const val = String(campaign.id || campaign.campaignId || campaign.name || 0);
      const label = String(campaign.name || campaign.campaignName || val);
      return !query || label.toLowerCase().includes(query) || val.toLowerCase().includes(query);
    });
  }, [allCampaigns, campaignSearchTerm]);

  useEffect(() => {
    const hasCreatePermission = canCreate("Exchanges");
    const hasViewPermission = canView("Exchanges");
    const hasEditPermission = canEdit("Exchanges");
    const hasDeletePermission = canDelete("Exchanges");
    const hasUpdatePermission = canUpdate("Exchanges");
    setCanCreateExchanges(hasCreatePermission);
    setCanViewExchanges(hasViewPermission);
    setCanEditExchanges(hasEditPermission);
    setCanDeleteExchanges(hasDeletePermission);
    setCanUpdateExchanges(hasUpdatePermission);
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

      // CORRECTED MAPPING - properly map all fields from API response
      const formatted = domains.map((item, index) => ({
        id: item.kibanaCampaignDomainId || item.domain || `domain-${index}`,
        domain: item.domain || "", // Add domain field for search
        exchange: item.exchange || "", // Map exchange name directly (no decodeURIComponent needed)
        clicks: item.totalClicks || 0,
        impressions: item.totalImpression || 0,
        campaignDomainDate: item.campaignDomainDate || "",
        cpmbid: item.avgCpmBid || 0,
        ctr: item.ctr || 0,
      }));

      console.log("Formatted data:", formatted); // Debug log to verify mapping
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

  // Fixed search to use exchange name instead of domain
  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.exchange?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

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
        height: "57px",
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
      {creative === null && canViewExchanges && (
        <div className="campaign-daily-content">
          <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <div className="campaign-daily-title">
                <h2>Exchanges</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
            <CardBody className="py-3" style={{ overflow: "visible" }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="cdi-search-box">
                    <input
                      type="text"
                      placeholder="Search by Exchange"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px', width: '150px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                    />
                  </div>

                  {/* Date Filter Dropdown */}
                  <div className="cdi-date-filter" style={{ position: 'relative', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    <div
                      className="cdi-date-display"
                      onClick={openDateRangePicker}
                      style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'flex', alignItems: 'center', backgroundColor: '#fff' }}
                    >
                      <FaCalendarAlt style={{ color: '#64748b', marginRight: '8px' }} />
                      <span style={{ fontSize: '13px', color: '#1e293b' }}>
                        {formatDateRange()}
                      </span>
                      <FaChevronDown style={{ color: '#64748b', marginLeft: '8px', fontSize: '10px' }} />
                    </div>

                    {showDateRangePicker && (
                      <div className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table" ref={datePickerRef} style={{ position: 'absolute', top: '200px', zIndex: 1000 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', marginRight: '8px' }}>Campaign:</span>
                    <div ref={campaignRef} style={{ position: 'relative', minWidth: '130px', zIndex: 100 }}>
                      <div className="campaign-select-wrapper">
                        <input
                          readOnly
                          value={selectedDropdownCampaignId ? (Array.isArray(allCampaigns) ? allCampaigns : []).find(c => String(c.id || c.campaignId || c.name) === String(selectedDropdownCampaignId))?.name || selectedDropdownCampaignId : 'Select Campaign'}
                          className="campaign-select-input"
                          style={{
                            height: '30px',
                            minHeight: '30px',
                            borderRadius: '4px',
                            padding: '6px 28px 6px 12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            color: '#1e293b',
                            fontWeight: '600',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: '130px',
                            maxWidth: '150px',
                          }}
                          onClick={() => {
                            setCampaignSearchTerm("");
                            setHoveredCampaign(null);
                            setIsCampaignOpen((open) => !open);
                          }}
                        />
                        <FaChevronDown
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: `translateY(-50%) ${isCampaignOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                            fontSize: '10px',
                            color: '#64748b',
                            pointerEvents: 'none',
                            transition: 'transform 0.2s ease',
                          }}
                        />
                      </div>
                      {isCampaignOpen &&
                        typeof document !== 'undefined' &&
                        ReactDOM.createPortal(
                          <div
                            ref={campaignPortalRef}
                            className="custom-dropdown-menu biddeript-bd"
                            style={{
                              position: 'absolute',
                              top: `${campaignDropdownPosition.top}px`,
                              left: `${campaignDropdownPosition.left}px`,
                              zIndex: 9999,
                              minWidth: '130px',
                              pointerEvents: 'auto',
                              maxWidth: '300px',
                              maxHeight: '300px',
                            }}
                          >
                            <div
                              style={{
                                padding: '8px',
                                borderBottom: '1px solid #e2e8f0',
                                backgroundColor: '#fff',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1,
                              }}
                            >
                              <input
                                type="text"
                                value={campaignSearchTerm}
                                onChange={(e) => setCampaignSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Search campaign"
                                autoFocus
                                style={{
                                  width: '100%',
                                  height: '30px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  color: '#1e293b',
                                  outline: 'none',
                                  fontWeight: '500',
                                }}
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
                                  className={`custom-dropdown-option ${isSelected ? 'selected' : ''}`}
                                  style={{
                                    height: '40px',
                                    cursor: 'pointer',
                                    pointerEvents: 'auto',
                                    backgroundColor: (isSelected || isHovered) ? '#e53e3e' : 'transparent',
                                  }}
                                >
                                  <span
                                    className="tick-icon"
                                    style={{
                                      marginRight: '12px',
                                      fontWeight: 'bold',
                                      color: (isSelected || isHovered) ? '#ffffff' : 'transparent',
                                      fontSize: '18px',
                                      minWidth: '20px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    {isSelected && '✓'}
                                  </span>
                                  <span style={{ color: (isSelected || isHovered) ? '#ffffff' : '#64748b', fontWeight: (isSelected || isHovered) ? '600' : '500' }}>
                                    {c.name || c.campaignName || val}
                                  </span>
                                </div>
                              );
                            })}
                            {filteredDropdownCampaigns.length === 0 && (
                              <div
                                style={{
                                  padding: '10px 12px',
                                  color: '#94a3b8',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                No campaigns found
                              </div>
                            )}
                          </div>,
                          document.body,
                        )}
                    </div>
                  </div>

                  <button className="cdi-refresh-btn" onClick={refresh} title="Refresh Data" style={{ padding: '6px 12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer', height: '30px' }}>
                    <i className={"fa fa-refresh " + (loading ? "fa-spin" : "")}></i>
                  </button>
                </div>

                <div className="cdi-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="cd-pagination-summary" style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {filteredData.length
                        ? `${Math.min(currentPage * perPage, filteredData.length)} of ${filteredData.length} entries`
                        : "0 entries"}
                    </div>
                    <div className="cd-pagination-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      {totalPages > 1 && (
                        <div className="cd-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="cd-pagination-nav-btn"
                            type="button"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b' }}
                          >
                            <FaChevronRight style={{ transform: 'rotate(180deg)', fontSize: '12px' }} />
                          </button>
                          <button
                            className="cd-pagination-page-btn is-active"
                            type="button"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'default',
                            }}
                          >
                            {currentPage}
                          </button>
                          <span style={{ color: '#64748b', fontSize: '13px', margin: '0 4px', fontWeight: '500' }}>of</span>
                          <button
                            className="cd-pagination-page-btn"
                            type="button"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#fff',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'default',
                            }}
                          >
                            {totalPages}
                          </button>
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage >= totalPages}
                            className="cd-pagination-nav-btn"
                            type="button"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}
                          >
                            <FaChevronRight style={{ fontSize: '12px' }} />
                          </button>
                          <div style={{ position: 'relative', marginLeft: '8px' }} ref={perPageRef}>
                            <div className="campaign-select-wrapper">
                              <input
                                readOnly
                                value={`${perPage} per page`}
                                className="campaign-select-input"
                                style={{
                                  height: '30px',
                                  minHeight: '30px',
                                  borderRadius: '4px',
                                  padding: '6px 28px 6px 12px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '13px',
                                  color: '#1e293b',
                                  fontWeight: '600',
                                  backgroundColor: '#fff',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  minWidth: '130px',
                                  maxWidth: '130px',
                                }}
                                onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                              />
                              <FaChevronDown
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  top: '50%',
                                  transform: `translateY(-50%) ${isPerPageOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                                  fontSize: '10px',
                                  color: '#64748b',
                                  pointerEvents: 'none',
                                  transition: 'transform 0.2s ease',
                                }}
                              />
                            </div>
                            {isPerPageOpen &&
                              typeof document !== 'undefined' &&
                              ReactDOM.createPortal(
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
                                        className={`custom-dropdown-option ${isSelected ? 'selected' : ''}`}
                                        style={{
                                          height: '40px',
                                          cursor: 'pointer',
                                          pointerEvents: 'auto',
                                          backgroundColor: (isSelected || isHovered) ? '#e53e3e' : 'transparent',
                                        }}
                                      >
                                        <span
                                          className="tick-icon"
                                          style={{
                                            marginRight: '12px',
                                            color: (isSelected || isHovered) ? '#ffffff' : 'transparent',
                                            fontSize: '18px',
                                            minWidth: '20px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                          }}
                                        >
                                          {isSelected && '✓'}
                                        </span>
                                        <span style={{ color: (isSelected || isHovered) ? '#ffffff' : '#64748b', fontWeight: (isSelected || isHovered) ? '600' : '500' }}>
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
                  <button className="cdi-export-btn" onClick={exportToExcel} style={{ backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626', padding: '6px 6px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: '30px' }}>
                    <FaDownload /> EXPORT CSV
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
              <div style={{ minWidth: "1000px" }}>
                <DataTable
                  keyField="id"
                  className="data-table"
                  columns={buildColumns()}
                  data={paginatedData}
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
          </div>
        </div>
      )}
      {creative === null && !canViewExchanges && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Exchanges.
        </div>
      )}
    </div>
  );
};

export default CampaignExchange;
