import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Input,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { kibanaFormuladomain } from "../views/api/Api";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useGlobalTabs } from "../context/TabContext";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import DetailedDomainExchange from "./DetailedDomainExchange";

const DEFAULT_SELECTED_COLUMNS = [
  "Domain",
  "Domain App Id",
  "Clicks",
  "Impressions",
  "CPM Bid",
  "CTR",
];

const DetailedReportDomain = (props) => {
  const { brandId: urlBrandId, groupId: urlGroupId, campaignId: urlCampaignId } = useParams();
  const location = useLocation();
  const [currentBrandId, setCurrentBrandId] = useState(props.brandId || urlBrandId || null);
  const [realBrandId, setRealBrandId] = useState(
    props.brandId || location.state?.brandId || localStorage.getItem('currentBrandId') || null
  );
  const initialGroupId = props.groupid || location.state?.groupId || urlGroupId;
  const [currentGroupId, setCurrentGroupId] = useState(
    initialGroupId ? (initialGroupId !== "undefined" ? initialGroupId : null) : null
  );
  const [step, setStep] = useState(0);

  const steps = [
    { label: "Exchange", icon: "icon-chart-bar-32" },
  ];

  const [currentCampaignId, setCurrentCampaignId] = useState(
    props.campaignId || location.state?.campaignId || urlCampaignId || null,
  );

  useEffect(() => {
    const nextCampaignId =
      props.campaignId || location.state?.campaignId || urlCampaignId || null;
    if (nextCampaignId !== currentCampaignId) {
      setCurrentCampaignId(nextCampaignId);
    }
  }, [props.campaignId, location.state?.campaignId, urlCampaignId, currentCampaignId]);
  const DomainCell = ({ row }) => <div className="gOorhn">{row.domain}</div>;
  const DomainDateCell = ({ row }) => <div className="gOorhn">{row.campaignDomainDate}</div>;
  const DomainAppIdCell = ({ row }) => <div className="gOorhn">{row.domain}</div>;
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

    "Doamin Date": {
      name: "Doamin Date",
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const toggleCalendar = () => setShowCalendar((prev) => !prev);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const fetchDomainData = async (start = null, end = null) => {
    if (!currentCampaignId) {
      //console.log("No campaignId provided, skipping domain fetch");
      setRowData([]);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        campaignId: currentCampaignId,
        startDate: start ? formatDateForAPI(start) : "",
        endDate: end ? formatDateForAPI(end) : ""
      };
      //console.log("Calling kibanaFormuladomain with payload:", payload);
      const res = await kibanaFormuladomain(payload);
      //console.log("Domain API Response:", res.data);

      let domains = [];
      if (res.data?.data?.informationKibanaCampaignDomains) {
        domains = res.data.data.informationKibanaCampaignDomains;
      } else if (Array.isArray(res.data?.data)) {
        domains = res.data.data;
      } else if (Array.isArray(res.data)) {
        domains = res.data;
      }
      const formatted = domains.map((item, index) => ({
        id: item.domain || "",
        domain: decodeURIComponent(item.domain || ""),
        campaignDomainDate: item.campaignDomainDate || 0,
        clicks: item.clicks || 0,
        impressions: item.totalImpression || 0,
        cpmbid: item.cpmbid || 0,
         ctr: item.ctr ,
      //  originalData: item,
      }));

      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching domain data:", err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDomainData();
  }, [currentCampaignId]);
  const redraw = () => setCount(count + 1);
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    try {
      await delay(500);
      await fetchDomainData();
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const campaignName =
    location.state?.campaignName || location.state?.name || props.campaignName || "";

  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
  } = useGlobalTabs();

  useEffect(() => {
    initializePageTab("Domains", "fa fa-globe", location.pathname, null, location.state);
  }, [initializePageTab, location.pathname]);

  useEffect(() => {
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-globe me-2"></i>
          Domains{campaignName ? " - " : ""}
          {campaignName ? <i>{campaignName}</i> : null}
        </>
      ),
    });
  }, [campaignName, updateTab]);

  const handleAddTab = () => {
    addTab({
      route: location.pathname,
      state: location.state,
      header: (
        <>
          <i className="fa fa-globe me-2"></i>
          Domains{campaignName ? " - " : ""}
          {campaignName ? <i>{campaignName}</i> : null}
        </>
      ),
    });
  };

  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;
    switch (type) {
      case "Today": start = end = today; break;
      case "Yesterday": start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1); break;
      case "2 Days Ago": start = end = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2); break;
      case "Last 7 Days": end = today; start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6); break;
      case "Last 30 Days": end = today; start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29); break;
      default: start = end = null;
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


  const handleApply = async () => {
    setShowCalendar(false);
    const dateRange = { startDate, endDate, label: selectedLabel };
    setAppliedDateRange(dateRange);
    await fetchDomainData(startDate, endDate);
  };

  const handleApplyAll = async () => {
    setShowCalendar(false);
    const dateRange = { startDate, endDate, label: selectedLabel };
    setAppliedDateRange(dateRange);
    await fetchDomainData(startDate, endDate);
  };
  const handleClearDateRange = async () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("");
    setAppliedDateRange(null);
    setShowCalendar(false);
    await fetchDomainData();
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
  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.domain?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

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
        {!currentCampaignId
          ? "No campaign selected. Please select a campaign to view domains."
          : "No domain data available for this campaign."}
      </div>
    </div>
  );

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#f8f9fa',
        height: '100%',
      },
    },
    headRow: {
      style: {
        borderTop: '1px solid #d4d4d4',
      },
    },
    headCells: {
      style: {
        borderRight: '1px solid #d4d4d4',
        '&:first-of-type': { paddingLeft: '16px' },
        '&:last-of-type': { borderRight: 'none' },
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        '&:first-of-type': { paddingLeft: '16px' },
      },
    },
    rows: { style: {} },
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
        cell: (row) => (
          <Input
            type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleCheckboxChange(row.id);
            }}
          />
        ),
        width: "50px",
      },
    ];

    selectedColumns.forEach(columnKey => {
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
        backgroundColor: '#59823a !important',
        '& .gOorhn': { color: 'white !important' }
      },
    },
  ];
  const formatDateForAPI = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return (
    <Tabs onAdd={handleAddTab} onRemove={removeTab}>
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
                  title="Really delete?"
                  message="This action cannot be undone."
                  name="DELETE"
                  callback={() => setModal(false)}
                />
              )}
              {creative === null && (
                <>
                  <Row>
                    <Col xs="12">
                      <div className="row">
                        <div className="col-xl-12 col-lg-12">
                          <Row className="align-items-center">
                            <Col md="2" className="p-0 ms-2 mt-2" id="maximing">
                              <div className="position-relative ms-2">
                                <Input
                                  className="form-control py-1 px-1 mb-2 rounded-0 adsheight custom-select-input"
                                  type="text"
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
                                        {["Today", "Yesterday", "2 Days Ago", "Last 7 Days", "Last 30 Days"].map((label) => (
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
                                          color="secondary"
                                          size="sm"
                                          className="mt-1 rounded-0"
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
                                className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center"
                                style={{ height: "26px", fontSize: "11px" }}
                                id="refresh"
                              >
                                <i className="fa fa-repeat me-1"></i>
                                Refresh
                              </button>
                            </Col>

                            <Col md="2"></Col>

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
                          </Row>
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
                            tableWrapper: { style: { overflowY: 'auto' } },
                          }}
                          noDataComponent={<NoDataComponent />}
                          onRowClicked={handleRowClicked}
                        />
                      </div>
                    </Col>
                    <Fragment>
                      <div
                        className="panel_Container brandpanel ">
                        <div className="brandlist" >
                          <Row
                            className="inventory-row align-items-center border mt-2 py-2 px-3"
                            id="subtable"
                          >
                            <Col xs="12" md="2" className="d-flex align-items-center">
                              <i className="tim-icons icon-triangle-down me-2 opacity-75"></i>

                            </Col>

                            <Col
                              xs="auto"
                              className="d-flex flex-wrap align-items-center ms-auto"
                            >
                              {steps.map((item, i) => {
                                const isActive = i === step;

                                return (
                                  <div
                                    key={i}
                                    onClick={() => setStep(i)}
                                    style={{ cursor: "pointer" }}
                                    className={`tab-step d-flex align-items-center mx-2 px-2 py-1 ${isActive ? "active" : ""
                                      }`}
                                  >
                                    <i
                                      className={`tim-icons ${item.icon} me-2 ${isActive ? "" : "text-muted"
                                        }`}
                                      style={
                                        isActive
                                          ? { color: "#3a3d40", opacity: 1 }
                                          : {}
                                      }
                                    />
                                    <span
                                      className={`fw-semibold ${isActive ? "" : "text-muted"
                                        }`}
                                      id="subgroupname"
                                      style={
                                        isActive
                                          ? { color: "#3a3d40", opacity: 1 }
                                          : {}
                                      }
                                    >
                                      {item.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </Col>
                          </Row>
                          <div style={{ flexGrow: 1 }} />
                        </div>
                      </div>

                      {step === 0 && (
                        <DetailedDomainExchange
                          brandId={realBrandId}
                          groupid={currentGroupId}
                          campaignId={selectedIds[0]}
                        />
                      )}


                    </Fragment>
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

export default DetailedReportDomain;
