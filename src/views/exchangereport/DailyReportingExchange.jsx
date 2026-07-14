import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardBody } from "reactstrap";
import { FaCalendarAlt } from "react-icons/fa";
import DataTable from "react-data-table-component";
import DatePicker from "react-datepicker";
import { kibanaFormulaexcahngereport } from "../api/Api";
import { useGlobalTabs } from "../../context/TabContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";

const DailyReportingExchange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    exchangeName,
    exchangeId,
    startDate: stateStartDate,
    endDate: stateEndDate,
  } = location.state || {};
  const {
    initializePageTab,
  } = useGlobalTabs();

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const datePickerRef = useRef(null);
  const [startDate, setStartDate] = useState(() => {
    if (stateStartDate) return new Date(stateStartDate);
    return null;
  });
  const [endDate, setEndDate] = useState(() => {
    if (stateEndDate) return new Date(stateEndDate);
    return null;
  });
  const [selectedLabel, setSelectedLabel] = useState(
    stateStartDate && stateEndDate ? "" : "All Dates",
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
  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("All Dates");
    setShowCalendar(false);
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
        // FIXED: Fill Rate formula - (responses / requests) * 100
        const computedFillRate = requests > 0 ? (responses / requests) * 100 : 0;
        const revenue = parseCurrency(item.revenue);
        const impressions = Number(item.impression) || 0;
        const computedMediaEcpm = impressions > 0 ? (revenue / impressions) * 1000 : 0;

        return {
          date: item.createdAt || "",
          totalRequests: requests,
          totalResponses: responses,
          totalFillRate: computedFillRate, // Using the computed fill rate instead of API value
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
        `${(row.totalFillRate || 0).toFixed(2)}%`,
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
      format: (row) => `$${(isFinite(Number(row.mediaEcpm)) ? Number(row.mediaEcpm) : 0).toFixed(2)}`,
    },
    { name: "Clicks", selector: (row) => row.clicks || 0, sortable: true },

    {
      name: "Hourly Reporting",
      selector: (row) => row.id,
      cell: (row) => (
        <Button
          color="success"
          size="sm"
          className="rounded-0"
          onClick={() => {
            if (exchangeId && exchangeName) {
              const rowDate = row.date;

              navigate(`/admin/exchange/${exchangeId}/detailed-exchange-view/hourly-reporting`, {
                state: {
                  exchangeId: exchangeId,
                  exchangeName: exchangeName,
                  startDate: rowDate,
                  endDate: rowDate,
                },
              });
            } else {
              console.warn("Missing data for daily reporting navigation", { exchangeId, exchangeName });
            }
          }}
        >
          View Hourly Report
        </Button>
      ),
      sortable: true,
      width: "180px",
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
      <div className="py-4 fw-bold text-secondary">No data available</div>
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

  return (
    // <Tabs>
    //   {tabsList.map((tab) => (
    //     <Tab
    //       key={tab.value}
    //       value={tab.value}
    //       header={tab.header}
    //       route={tab.route}
    //       state={tab.state}
    //     >
    <div className="campaign-daily-container">
      <div className="campaign-daily-content">
        <div className="campaign-daily-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
          <div>
            <div className="campaign-daily-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                onClick={() => navigate(-1)} 
                className="campaign-btn campaign-btn-back" 
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <i className="fa fa-arrow-left"></i>
                Back
              </button>
              <h2 style={{ margin: 0 }}>Daily Reporting</h2>
            </div>
          </div>
        </div>
        <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
          <CardBody className="py-3" style={{ overflow: "visible" }}>
            <div
              className="campaign-daily-controls"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div
                className="cdi-controls-left"
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "nowrap",
                  gap: "12px",
                  whiteSpace: "nowrap",
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search"
                    className="form-control"
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      fontSize: "13px",
                      width: "200px",
                      height: "30px",
                      boxSizing: "border-box",
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="position-relative" ref={datePickerRef}>
                  <div className="cdi-date-filter" style={{ position: "relative" }}>
                    <div
                      className="cdi-date-display"
                      onClick={toggleCalendar}
                      style={{
                        cursor: "pointer",
                        padding: "6px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        minWidth: "220px",
                        height: "30px",
                        color: "#334155",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    >
                      <FaCalendarAlt style={{ marginRight: "8px", color: "#64748b" }} />
                      <span>{formatDateRange()}</span>
                    </div>
                    {showCalendar && (
                      <div
                        className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table"
                        style={{ position: "absolute", zIndex: 1000, width: "auto" }}
                      >
                        <div className="cd-date-range-presets">
                          <div className="cd-date-range-presets-title">Preset Ranges</div>
                          {[
                            "Today",
                            "Yesterday",
                            "2 Days Ago",
                            "Last 7 Days",
                            "Last 30 Days",
                          ].map((label) => (
                            <button
                              key={label}
                              type="button"
                              className={`cd-date-range-preset-btn ${selectedLabel === label ? "is-active" : ""}`}
                              onClick={() => handleQuickSelect(label)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="cd-date-range-panel">
                          <div className="cd-date-range-fields">
                            <div className="cd-date-range-field">
                              <span className="cd-date-range-field-label">From</span>
                              <div className={`cd-date-range-field-value ${!startDate ? "is-empty" : ""}`}>
                                {formatPickerValue(startDate)}
                              </div>
                            </div>
                            <div className="cd-date-range-field">
                              <span className="cd-date-range-field-label">To</span>
                              <div className={`cd-date-range-field-value ${!endDate ? "is-empty" : ""}`}>
                                {formatPickerValue(endDate)}
                              </div>
                            </div>
                          </div>
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
                            calendarClassName="cd-range-calendar"
                          />
                          <div className="cd-date-range-footer">
                            <button
                              type="button"
                              className="cd-date-range-btn cd-date-range-btn-secondary"
                              onClick={handleClearDateRange}
                              disabled={!startDate && !endDate}
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              className="cd-date-range-btn cd-date-range-btn-secondary"
                              onClick={() => setShowCalendar(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="cd-date-range-btn cd-date-range-btn-primary"
                              onClick={handleApply}
                              disabled={!startDate || !endDate}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                </div>
                <button
                  className="cdi-refresh-btn"
                  onClick={fetchReportData}
                  title="Refresh Data"
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#fff",
                    borderRadius: "4px",
                    cursor: "pointer",
                    height: "30px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    boxSizing: "border-box",
                  }}
                >
                  <i className={`fa fa-repeat ${loading ? "fa-spin" : ""}`}></i>
                </button>

                <div
                  className="cdi-controls-right"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "nowrap",
                    whiteSpace: "nowrap",
                    marginLeft: "auto",
                    flex: "0 0 auto",
                  }}
                >
                  <button
                    className="cdi-export-btn"
                    onClick={handleExport}
                    style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                      borderColor: "#dc2626",
                      height: "30px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      boxSizing: "border-box",
                      lineHeight: 1,
                    }}
                  >
                    <i className="fa fa-download"></i>
                    EXPORT
                  </button>
                </div>
              </div>


            </div>
          </CardBody>
        </Card>
        <div className="campaign-daily-table-wrapper">
          <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
            <div style={{ minWidth: "1000px" }}>
              <DataTable
                className="data-table"
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
      </div>
    </div>
    //     </Tab>
    //   ))}
    // </Tabs>
  );
};

export default DailyReportingExchange;
