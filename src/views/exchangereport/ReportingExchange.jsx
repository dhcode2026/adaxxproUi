import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button, Row, Col, Input , Card , CardBody } from "reactstrap";
import { useViewContext } from "../../ViewContext";
import { FaCalendarAlt } from "react-icons/fa";
import DataTable from "react-data-table-component";
import DatePicker from "react-datepicker";
import { kibanaFormulaexcahngereport } from "../api/Api";
import Tabs from "../../components/Tab/Tabs";
import { useNavigate, useLocation } from "react-router-dom";
import Tab from "../../components/Tab/Tab";
import { useGlobalTabs, TabHeaderName } from "../../context/TabContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";

const ReportingExchange = ({ exchangeName: propExchangeName, exchangeId: propExchangeId }) => {
  const location = useLocation();
  const { exchangeName: stateExchangeName, exchangeId: stateExchangeId } = location.state || {};
  const exchangeName = propExchangeName || stateExchangeName;
  const exchangeId = propExchangeId || stateExchangeId;
  const { globalTabsList: tabsList, removeTab } = useGlobalTabs();
  const navigate = useNavigate();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("All Dates");
  const datePickerRef = useRef(null);

  const formatDateForApi = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const fetchReportData = useCallback(async () => {
    if (!exchangeName) return;

    setLoading(true);
    try {
      const payload = {
        name: exchangeName.toLowerCase(),
        exchangeId: exchangeId,
        startDate: formatDateForApi(endDate),
        endDate: formatDateForApi(startDate),
      };
      const response = await kibanaFormulaexcahngereport(payload);
      const rawData = response?.data?.data?.informationKibanaExchangeReports || [];
      const mappedData = rawData.map((item) => ({
        id: item.id,
        name: item.name,
        reportDate: item.createdAt,
        date: item.createdAt || "",
        totalRequests: item.totalRequest || 0,
        totalResponses: item.totalResponse || 0,
        totalFillRate: item.totalFillRate || 0,
        impressions: item.impression || 0,
        revenue: item.revenue || 0,
        mediaEcpm: item.mediaEcpm || 0,
        clicks: item.clicks || 0,
      }));
      setReportData(mappedData);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [exchangeName, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const toggleCalendar = () => setShowCalendar((prev) => !prev);

  useEffect(() => {
    if (!showCalendar) return;

    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  const formatPickerValue = (date) => {
    if (!date) return "MM / DD / YYYY";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const handleQuickSelect = (type) => {
    const todayDate = new Date();
    let start, end;

    switch (type) {
      case "Today":
        start = end = todayDate;
        break;
      case "Yesterday":
        start = end = new Date(todayDate.setDate(todayDate.getDate() - 1));
        break;
      case "2 Days Ago":
        start = end = new Date(todayDate.setDate(todayDate.getDate() - 2));
        break;
      case "Last 7 Days":
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 6);
        break;
      case "Last 30 Days":
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 29);
        break;
      default:
        start = end = null;
    }
    setSelectedLabel(type);
    setStartDate(start);
    setEndDate(end);
    setShowCalendar(false);
  };

  const handleApply = () => {
    setShowCalendar(false);
  };

  const handleClearDateRange = () => {
    setSelectedLabel("All Dates");
    setStartDate(null);
    setEndDate(null);
    setShowCalendar(false);
  };

  const formatDateRange = () => {
    if (selectedLabel) return selectedLabel;
    if (startDate && endDate) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    }
    return "All Dates";
  };

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Date: item.date || "",
      "Total Requests": item.totalRequests || 0,
      "Total Responses": item.totalResponses || 0,
      "Fill Rate (%)": item.totalFillRate || 0,
      Impressions: item.impressions || 0,
      Revenue: item.revenue || 0,
      "Media eCPM": item.mediaEcpm || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${exchangeName}_Report`);
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `${exchangeName}_report.xlsx`);
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return reportData;
    return reportData.filter((item) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [reportData, searchTerm]);

  const columns = [
    { name: "Total Requests", selector: (row) => row.totalRequests || 0, sortable: true },
    { name: "Total Responses", selector: (row) => row.totalResponses || 0, sortable: true },
    {
      name: "Fill Rate (%)",
      selector: (row) => row.totalFillRate || 0,
      sortable: true,
      format: (row) => (row.totalFillRate ? row.totalFillRate.toFixed(2) : "0.00%"),
    },
    { name: "Impressions", selector: (row) => row.impressions || 0, sortable: true },
    {
      name: "Revenue",
      selector: (row) => row.revenue || 0,
      sortable: true,
      format: (row) => (row.revenue ? `$${row.revenue.toFixed(2)}` : "$0.00"),
    },
    {
      name: "Media eCPM",
      selector: (row) => row.mediaEcpm || 0,
      sortable: true,
      format: (row) => `$${(isFinite(Number(row.mediaEcpm)) ? Number(row.mediaEcpm) : 0).toFixed(2)}`,
    },
    { name: "Clicks", selector: (row) => row.clicks || 0, sortable: true },
    {
      name: "Daily Reporting",
      cell: (row) => (
        <Button
          color="success"
          size="sm"
          id="dailyreporting"
          onClick={() => {
            if (exchangeId && exchangeName) {
              let finalStart = startDate;
              let finalEnd = endDate;

              if (!finalStart || !finalEnd) {
                finalEnd = new Date();
                finalStart = new Date();
                finalStart.setDate(finalEnd.getDate() - 29);
              }

              navigate(`/admin/exchange/${exchangeId}/detailed-exchange-view/daily-reporting`, {
                state: {
                  exchangeId: exchangeId,
                  exchangeName: exchangeName,
                  startDate: formatDateForApi(finalStart),
                  endDate: formatDateForApi(finalEnd),
                },
              });
            } else {
              console.warn("Missing data for daily reporting navigation", { exchangeId, exchangeName });
            }
          }}
        >
          View Daily Report
        </Button>
      ),
    },
  ];

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 fw-bold text-secondary">No report data available</div>
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
  return (
    <div className="campaign-daily-content">
      {/* <div className="campaign-daily-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <div>
            <div className="campaign-daily-title">
              <h2>Exchange Reporting</h2>
            </div>
          </div>
        </div> */}
    <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
      <CardBody className="py-3" style={{ overflow: "visible" }}>
      <div className="campaign-daily-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px", flexWrap: "wrap", gap: "16px" }}>
        <div className="cdi-controls-left" style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: "12px", whiteSpace: "nowrap" }}>
          <div className="cdi-search-box">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "13px", width: "200px" }}
            />
          </div>


          <button
            type="button"
            onClick={fetchReportData}
            className="cdi-refresh-btn"
            style={{ padding: "6px 12px", border: "1px solid #e2e8f0", backgroundColor: "#fff", borderRadius: "4px", cursor: "pointer" }}
          >
            <i className={"fa fa-repeat " + (loading ? "fa-spin" : "")}></i>
          </button>
        </div>

        <div className="cdi-controls-right" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap", whiteSpace: "nowrap" }}>
          <button
            type="button"
            onClick={handleExport}
            className="cdi-export-btn"
            style={{ backgroundColor: "#dc2626", color: "white", borderColor: "#dc2626", height: "30px" }}
          >
            <i className="fa fa-download me-1"></i> EXPORT
          </button>
        </div>
      </div>
      </CardBody>
      </Card>
      <div className="campaign-daily-table-wrapper">
        <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh"  }}>
          <div style={{ minWidth: "1000px" }}>
            <DataTable
              className="groups1datatable"
              keyField="date"
              columns={columns}
              data={filteredData}
              customStyles={customStyles}
              highlightOnHover
              pointerOnHover
              persistTableHead
              striped
              dense
              fixedHeader
              fixedHeaderScrollHeight="100%"
              responsive={false}
              // conditionalRowStyles={conditionalRowStyles}
              // onRowClicked={handleRowClicked}
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
  );
};

export default ReportingExchange;
