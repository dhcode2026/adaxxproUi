import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Row, Col, Input , CardBody} from "reactstrap";
import { useViewContext } from "../ViewContext";
import { FaCalendarAlt } from "react-icons/fa";
import DataTable from "react-data-table-component";
import DatePicker from "react-datepicker";
import { kibanaFormulaexcahngereport } from "../views/api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs, TabHeaderName } from "../context/TabContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";

const PubmaticReport = () => {
  const navigate = useNavigate();
  
  const location = useLocation();
  const {
    exchangeName: rawExchangeName,
    exchangeId,
    startDate: stateStartDate,
    endDate: stateEndDate,
  } = location.state || {};
  const exchangeName = rawExchangeName || "PubMatic";
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    initializePageTab,
  } = useGlobalTabs();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [startDate, setStartDate] = useState(() => {
    if (stateStartDate) return new Date(stateStartDate);
    // Default: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return start;
  });
  const [endDate, setEndDate] = useState(() => {
    if (stateEndDate) return new Date(stateEndDate);
    return new Date();
  });
  const [draftDateRange, setDraftDateRange] = useState(() => ({
    startDate: stateStartDate ? new Date(stateStartDate) : (() => {
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return start;
    })(),
    endDate: stateEndDate ? new Date(stateEndDate) : new Date(),
  }));
  const [selectedLabel, setSelectedLabel] = useState(
    stateStartDate && stateEndDate ? "" : "Last 30 Days",
  );

  useEffect(() => {
    initializePageTab(
      `Daily Reporting - ${exchangeName || ""}`,
      "fa fa-history",
      location.pathname,
    );
  }, [initializePageTab, exchangeName, location.pathname]);



  const formatWithComma = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString("en-IN");
  };
  const isSameDay = (first, second) => {
    if (!first || !second) return false;
    return new Date(first).toDateString() === new Date(second).toDateString();
  };
  const isSameDateRange = (firstRange, secondRange) =>
    isSameDay(firstRange?.startDate, secondRange?.startDate) &&
    isSameDay(firstRange?.endDate, secondRange?.endDate);

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
        return { startDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()), endDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999) };
      }
      case "2 Days Ago": {
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        return { startDate: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate()), endDate: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 23, 59, 59, 999) };
      }
      case "Last 7 Days": {
        const start = new Date(startOfToday);
        start.setDate(today.getDate() - 6);
        return { startDate: start, endDate: endOfToday };
      }
      case "Last 30 Days": {
        const start = new Date(startOfToday);
        start.setDate(today.getDate() - 29);
        return { startDate: start, endDate: endOfToday };
      }
      default:
        return null;
    }
  };

  const formatPickerValue = (date) => {
    if (!date) return "MM / DD / YYYY";
    const value = new Date(date);
    const day = String(value.getDate()).padStart(2, "0");
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setDraftDateRange({ startDate: null, endDate: null });
    setSelectedLabel("All Dates");
    setShowDateRangePicker(false);
  };

  const formatDateForApi = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const parseCurrency = (value) => {
    if (value === undefined || value === null) return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const fetchReportData = useCallback(async () => {
    if (!exchangeName) return;

    setLoading(true);
    try {
      const payload = {
        name: exchangeName.toLowerCase(),
        exchangeId: exchangeId,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
      };
      const response = await kibanaFormulaexcahngereport(payload);
      const rawData =
        response?.data?.data?.informationKibanaExchangeReports || [];

      const mappedData = rawData.map((item) => {
        const requests = item.totalRequest || 0;
        const responses = item.totalResponse || 0;
        const computedFillRate =
          requests > 0 ? (responses / requests) * 100 : 0;
        const revenue = parseCurrency(item.revenue);
        const impressions = Number(item.impression) || 0;
        const computedMediaEcpm =
          impressions > 0 ? (revenue / impressions) * 1000 : 0;

        return {
          date: item.reportDate || "",
          totalRequests: requests,
          totalResponses: responses,
          totalFillRate: computedFillRate,
          impressions: impressions,
          revenue: revenue,
          mediaEcpm: computedMediaEcpm,
          clicks: item.clicks || 0,
        };
      });

      setReportData(mappedData);
    } catch (err) {
      console.error("Error fetching report data:", err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [exchangeName, exchangeId, startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const toggleCalendar = () => {
    setDraftDateRange({ startDate, endDate });
    setShowDateRangePicker((prev) => !prev);
  };

  useEffect(() => {
    if (!showDateRangePicker) return;

    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDateRangePicker]);

  const handleQuickSelect = (type) => {
    const presetRange = getPresetRange(type);
    if (!presetRange) return;
    setSelectedLabel(type);
    setDraftDateRange(presetRange);
  };

  const handleApply = () => {
    setStartDate(draftDateRange.startDate);
    setEndDate(draftDateRange.endDate);
    setShowDateRangePicker(false);
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
      Clicks: item.clicks || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${exchangeName}_Report`);
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `${exchangeName}_report.xlsx`,
    );
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return reportData;
    return reportData.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(term),
      ),
    );
  }, [reportData, searchTerm]);

  const columns = [
    { name: "Date", selector: (row) => row.date || 0, sortable: true },

    {
      name: "Total Requests",
      selector: (row) => row.totalRequests || 0,
      sortable: true,
      format: (row) => formatWithComma(row.totalRequests),
    },
    {
      name: "Total Responses",
      selector: (row) => row.totalResponses || 0,
      sortable: true,
      format: (row) => formatWithComma(row.totalResponses),
    },
    {
      name: "Fill Rate (%)",
      selector: (row) => row.totalFillRate || 0,
      sortable: true,
      format: (row) =>
        row.totalFillRate ? row.totalFillRate.toFixed(2) : "0.00%",
    },
    {
      name: "Impressions",
      selector: (row) => row.impressions || 0,
      sortable: true,
      format: (row) => formatWithComma(row.impressions),
    },
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
      format: (row) => `$${row.mediaEcpm.toFixed(2)}`,
    },
    { name: "Clicks", selector: (row) => row.clicks || 0, sortable: true },

  ];

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 fw-bold text-secondary">
        No report data available
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
      height:"56px",
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
 
          <div className="content1">
            <div className="content-wrapper">
              <Row>
                <Col xs="12">
      <div className="campaign-daily-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <div>
            <div className="campaign-daily-title">
              <h2>Pubmatic Reporting</h2>
            </div>
          </div>
        </div>
    <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
      <CardBody className="py-3" style={{ overflow: "visible" }}>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12">
                      <Row className="align-items-center">
                        <Col md="2" className="p-0">
                          <div className="position-relative ms-2">
                            <Input
                              className="form-control py-1 px-1 "
                              type="text"
                              placeholder="Search"
                              style={{ fontSize: "0.685rem" }}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ height: "30px" , borderRadius:"4px" }}
                            />
                          </div>
                        </Col>
                        <Col md="2" className="position-relative">
                          <div className="date-input-wrapper">
                            <FaCalendarAlt className="calendar-icon" />
                            <input
                              type="text"
                              value={formatDateRange()}
                              onClick={toggleCalendar}
                              readOnly
                              className="date-input-pubmatic form-control"
                              style={{
                                fontSize: "0.685rem",
                                cursor: "pointer",
                                height: "30px"
                              }}
                            />
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
                        </Col>
                        <Col xs="auto">
                           <button
                               type="button"
                               onClick={fetchReportData}
                               className="inventory-toolbar-btn inventory-toolbar-secondary d-flex align-items-center justify-content-center"
                               id="refresh"
                                >
                                  <i className="fa fa-repeat me-1"></i>
                                    Refresh
                          </button>
                        </Col>
                      <Col xs="auto"  style={{ marginLeft: "auto" , paddingRight:"50px"}}>
                       <Button
                       type="btn"
                       className="inventory-toolbar-btn inventory-toolbar-primary"
                       id="export"
                       onClick={handleExport}
                        style={{ backgroundColor: "#E53E3E" }}
                       >
                        <span className="lasttime">
                        Export
                        </span>
                        </Button>
                        </Col>  
                      </Row>
                    </div>
                  </div>
                  </CardBody>
                  </Card>
                   <div className="campaign-daily-table-wrapper">
                    <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh"  }}>
                      <div style={{ minWidth: "1000px" }}>
                        <DataTable
                          keyField="date"
                          columns={columns}
                          data={filteredData}
                          customStyles={customStyles}
                          highlightOnHover
                          striped
                          dense
                          pointerOnHover
                          persistTableHead
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
                 
                </Col>
              </Row>
            </div>
          </div>
       
  );
};

export default PubmaticReport;
