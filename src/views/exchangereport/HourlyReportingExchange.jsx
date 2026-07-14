import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FaCalendarAlt, FaChevronDown, FaChevronRight, FaDownload } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { Card , CardBody } from "reactstrap";
import { kibanaFormulaexcahngereport } from "../api/Api";
import DatePicker from "react-datepicker";
import Tabs from "../../components/Tab/Tabs";
import Tab from "../../components/Tab/Tab";
import { useGlobalTabs, TabHeaderName } from "../../context/TabContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";

const HourlyReportingExchange = ({ exchangeName: propExchangeName, exchangeId: propExchangeId }) => {
  const location = useLocation();
  const {
    exchangeName: stateExchangeName,
    exchangeId: stateExchangeId,
    startDate: stateStartDate,
    endDate: stateEndDate,
  } = location.state || {};

  const exchangeName = propExchangeName || stateExchangeName;
  const exchangeId = propExchangeId || stateExchangeId;

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
    stateStartDate && stateEndDate ? "" : "All Dates"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const { globalTabsList: tabsList, addTab, removeTab, initializePageTab } = useGlobalTabs();

  useEffect(() => {
    initializePageTab(
      "Hourly Reporting",
      "fa fa-clock-o",
      location.pathname,
      null,
      location.state
    );
  }, [initializePageTab, location.pathname, location.state]);

  const handleAddTab = () => {
    addTab({
      route: location.pathname,
      state: location.state,
      header: (
        <>
          <i className="fa fa-clock-o me-2"></i>
          Hourly Reporting - <TabHeaderName />
        </>
      ),
    });
  };

  const formatDateForApi = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const formatDateRange = () => {
    if (selectedLabel) return selectedLabel;
    if (startDate && endDate) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    }
    return "";
  };

  const formatPickerValue = (date) => {
    if (!date) return "MM / DD / YYYY";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const handleClearDateRange = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("All Dates");
    setShowCalendar(false);
  };

  const toggleCalendar = () => setShowCalendar((prev) => !prev);

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
    setStartDate(start);
    setEndDate(end);
    setShowCalendar(false);
  };

  const handleApply = () => {
    setShowCalendar(false);
    fetchReportData();
  };

  // Function to generate all 24 hours in GMT format
  const generateAllHours = (date) => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hourStr = i.toString().padStart(2, '0') + ":00";
      hours.push({
        hour: hourStr,
        hourIndex: i,
        date: date,
      });
    }
    return hours;
  };
  
  const getDateInGMT = (date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };
  
  const mergeWithAllHours = (apiData, selectedDate) => {
    if (!selectedDate) return apiData;

    const dateStr = getDateInGMT(selectedDate);
    const allHours = generateAllHours(dateStr);
    const dataMap = new Map();
    apiData.forEach(item => {
      if (item.hour) {
        dataMap.set(item.hour, item);
      }
    });
    const mergedData = allHours.map((hourTemplate, idx) => {
      const existingData = dataMap.get(hourTemplate.hour);

      if (existingData) {
        return {
          ...existingData,
          id: idx,
        };
      } else {
        // Return zero-filled record for missing hour
        return {
          id: idx,
          kibanaExchangeReportId: null,
          date: dateStr,
          hour: hourTemplate.hour,
          fullDateTime: `${dateStr} ${hourTemplate.hour}`,
          reportDate: `${dateStr} ${hourTemplate.hour}`,
          exchangeName: exchangeName,
          totalRequests: 0,
          totalResponses: 0,
          totalFillRates: 0,
          impressions: 0,
          revenue: 0,
          mediaEcpm: 0,
          mediaSpend: 0,
          clicks: 0,
          cmpBid: 0,
          platformMargin: 0,
          createdAt: null,
        };
      }
    });

    return mergedData;
  };

  const fetchReportData = useCallback(async () => {
    if (!exchangeName) {
      console.warn("No exchangeName provided – cannot fetch report");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: exchangeName.toLowerCase(),
        exchangeId: exchangeId,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
      };
      const response = await kibanaFormulaexcahngereport(payload);
      let rawData = [];
      if (Array.isArray(response?.data)) {
        rawData = response.data;
      } else if (Array.isArray(response)) {
        rawData = response;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else {
        console.error("Unexpected API response structure", response);
        setReportData([]);
        return;
      }

      const mappedData = rawData.map((item, idx) => {
        const requests = Number(item.totalRequest) || Number(item.totalRequest) || 0;
        const responses = Number(item.totalResponse) || Number(item.totalResponse) || 0;
        // FIXED: Fill Rate formula - (responses / requests) * 100
        const fillRate = requests > 0 ? (responses / requests) * 100 : 0;

        const revenue = Number(item.revenue) || 0;
        const impressions = Number(item.impression) || 0;
        const mediaEcpm = Number(item.mediaEcpm) || (impressions > 0 ? (revenue / impressions) * 1000 : 0);

        let formattedDate = item.reportDate || "";
        let dateOnly = "";
        let hourOnly = "";

        if (formattedDate) {
          if (formattedDate.includes(" ")) {
            const [date, time] = formattedDate.split(" ");
            dateOnly = date;
            hourOnly = time.substring(0, 5);
          } else {
            dateOnly = formattedDate;
            hourOnly = "";
          }
        }

        return {
          id: idx,
          kibanaExchangeReportId: item.kibanaExchangeReportId,
          date: dateOnly,
          hour: hourOnly,
          fullDateTime: formattedDate,
          reportDate: item.reportDate,
          exchangeName: item.name || item.aaexchange || item.bexchange,
          totalRequests: requests,
          totalResponses: responses,
          totalFillRates: fillRate, // Using computed fill rate
          impressions: impressions,
          revenue: revenue,
          mediaEcpm: mediaEcpm,
          mediaSpend: Number(item.mediaSpend) || 0,
          clicks: Number(item.clicks) || 0,
          cmpBid: Number(item.cmpBid) || 0,
          platformMargin: Number(item.platformMargin) || 0,
          createdAt: item.createdAt,
        };
      });

      console.log(`Mapped ${mappedData.length} records from API`, mappedData);

      // If a single date is selected (startDate === endDate), fill all 24 hours
      let finalData = mappedData;
      if (startDate && endDate && formatDateForApi(startDate) === formatDateForApi(endDate)) {
        finalData = mergeWithAllHours(mappedData, startDate);
        console.log(`Expanded to ${finalData.length} hours with zeros for missing data`, finalData);
      }

      setReportData(finalData);
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

  // --- Table filtering & formatting ---
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return reportData.filter((item) => {
      return (
        item.date?.toLowerCase().includes(term) ||
        item.hour?.toLowerCase().includes(term) ||
        String(item.totalRequests).includes(term) ||
        String(item.totalResponses).includes(term) ||
        String(item.revenue).includes(term) ||
        String(item.clicks).includes(term)
      );
    });
  }, [reportData, searchTerm]);

  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, currentPage, perPage]);

  const handleExport = () => {
    const exportData = filteredData.map((item) => ({
      Date: item.date || "",
      Hour: item.hour || "",
      "Total Requests": item.totalRequests || 0,
      "Total Responses": item.totalResponses || 0,
      "Fill Rate (%)": item.totalFillRates || 0,
      Impressions: item.impressions || 0,
      Revenue: item.revenue || 0,
      "Media eCPM": item.mediaEcpm || 0,
      Clicks: item.clicks || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${exchangeName}_Hourly_Report`);
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `${exchangeName}_hourly_report.xlsx`,
    );
  };

  const formatWithComma = (num) => {
    if (num === null || num === undefined) return "0";
    return num.toLocaleString("en-IN");
  };

  const columns = [
    { name: "Date", selector: (row) => row.date || "", sortable: true },
    { name: "Hour (GMT)", selector: (row) => row.hour || "", sortable: true },
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
      selector: (row) => row.totalFillRates || 0,
      sortable: true,
      format: (row) => (row.totalFillRates ? `${row.totalFillRates.toFixed(2)}%` : "0.00%"),
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
      format: (row) => `$${row.revenue.toFixed(2)}`,
    },
    {
      name: "Media eCPM",
      selector: (row) => row.mediaEcpm || 0,
      sortable: true,
      format: (row) => `$${(isFinite(Number(row.mediaEcpm)) ? Number(row.mediaEcpm) : 0).toFixed(2)}`,
    },
    {
      name: "Clicks",
      selector: (row) => row.clicks || 0,
      sortable: true,
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
      height: "56px",
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

  const refresh = () => fetchReportData();

  return (
   
          <div className="campaign-daily-container">
            <div className="campaign-daily-content">
              <div className="campaign-daily-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <div>
                  <div className="campaign-daily-title">
                    <h2>Hourly Reporting</h2>
                  </div>
                </div>
              </div>
              <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
              <CardBody className="py-3" style={{ overflow: "visible" }}>
              <div className="campaign-daily-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div className="cdi-controls-left" style={{ display: "flex", alignItems: "center", flexWrap: "nowrap", gap: "12px", whiteSpace: "nowrap", flex: "1 1 auto", minWidth: 0 }}>
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
                    <div className="cdi-date-filter" id="hourly-reporting-date-filter">
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
                        <span>{startDate && endDate ? formatDateRange() : "All Dates"}</span>
                      </div>
                      {showCalendar && (
                        <div
                          className="cd-date-range-popup cd-date-range-popup-floating cd-date-range-popup-top-table"
                          style={{ position: "absolute", zIndex: 1000, width: "auto" }}
                        >
                          <div className="cd-date-range-presets">
                            <div className="cd-date-range-presets-title">Preset Ranges</div>
                            {["Today", "Yesterday", "2 Days Ago", "Last 7 Days", "Last 30 Days"].map((label) => (
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
                    onClick={refresh}
                    title="Refresh Data"
                    style={{
                      padding: "6px 12px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#fff",
                      borderRadius: "4px",
                      cursor: "pointer",
                      height: "30px",
                    }}
                  >
                    <i className={`fa fa-repeat ${loading ? "fa-spin" : ""}`}></i>
                  </button>
                </div>

                <div className="cdi-controls-right" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "nowrap", whiteSpace: "nowrap", marginLeft: "auto", flex: "0 0 auto" }}>
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
                                         onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                                         onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                         disabled={currentPage >= totalPages}
                                         className="cd-pagination-nav-btn"
                                         type="button"
                                         style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}
                                       >
                                         <FaChevronRight style={{ fontSize: '12px' }} />
                                       </button>
                                       <div style={{ position: 'relative', marginLeft: '8px' }}>
                                         <select
                                           value={perPage}
                                           onChange={(e) => { setPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                                           className="cd-pagination-select"
                                           style={{ appearance: 'none', padding: '8px 28px 8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', color: '#1e293b', fontWeight: '600', backgroundColor: '#fff', cursor: 'pointer', outline: 'none', height: '30px' }}
                                         >
                                           <option value={10}>10 per page</option>
                                           <option value={20}>20 per page</option>
                                           <option value={25}>25 per page</option>
                                           <option value={50}>50 per page</option>
                                           <option value={100}>100 per page</option>
                                           <option value={250}>250 per page</option>
                                           <option value={500}>500 per page</option>
                                         </select>
                                         <FaChevronDown style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b', pointerEvents: 'none' }} />
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               </div>
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
                    <FaDownload />
                    EXPORT
                  </button>
                </div>
              </div>
              </CardBody>
              </Card>
                  <div className="campaign-daily-table-wrapper">
                    <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh"  }}>
                      <div style={{ minWidth: "1000px" }}>
                        <DataTable
                          className="data-table"
                          keyField="id"
                          columns={columns}
                          data={paginatedData}
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
          </div>
      
  );
};

export default HourlyReportingExchange;
