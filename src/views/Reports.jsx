import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { createPortal } from "react-dom";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import OnetimeReportModal from "./Modal/OnetimeReportModal";
import { FaCaretDown, FaCog, FaCalendarAlt, FaChevronDown, FaChevronRight, FaDownload } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { getAllAddons, upadtestatusAudience, editAddon, getOneTimeReport, downloadOneTimeReport } from "../views/api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import { otroptions } from "../Utils.js";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/reports.css";

var undef;
const getStatusText = (code) => {
  const statusMap = {
    1: "On",
    2: "Off",
    3: "Archived",
    "1": "On",
    "2": "Off",
    "3": "Archived"
  };
  return statusMap[code] || code;
};

const Reports = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [onetimereportModalOpen, setOnetimeReportModalOpen] = useState(false);
  const toggleonetimereportModal = () => setOnetimeReportModalOpen(!onetimereportModalOpen);
  const [selectedAddons, setSelectedAddons] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);
  const [canCreateReport, setCanCreateReport] = useState(false);
  const [canViewReport, setCanViewReport] = useState(false);
  const [canEditReport, setCanEditReport] = useState(false);
  const [canDeleteReport, setCanDeleteReport] = useState(false);
  const [canUpdateReport, setCanUpdateReport] = useState(false);

  // Use global tabs
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();

  // Pagination dropdown refs
  const perPageInternalRef = useRef(null);

  useEffect(() => {
    initializePageTab("One-Time-Reports", "fa fa-calendar", location.pathname);
    const hasCreatePermission = canCreate("One-Time-Reports");
    const hasViewPermission = canView("One-Time-Reports");
    const hasEditPermission = canEdit("One-Time-Reports");
    const hasDeletePermission = canDelete("One-Time-Reports");
    const hasUpdatePermission = canUpdate("One-Time-Reports");
    setCanCreateReport(hasCreatePermission);
    setCanViewReport(hasViewPermission);
    setCanEditReport(hasEditPermission);
    setCanDeleteReport(hasDeletePermission);
    setCanUpdateReport(hasUpdatePermission);
  }, [initializePageTab, location.pathname]);

  useEffect(() => {
    const displayName = (firstName || lastName)
      ? `${firstName || ""} ${lastName || ""}`.trim()
      : (localStorage.getItem("username") || localStorage.getItem("email") || "");



    updateTab("default", {
      header: (
        <>
          <i className="fa fa-calendar me-2"></i>
          One-Time-Reports - <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);




  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [hoveredOption, setHoveredOption] = useState(null);

  const handleCheckboxChange = (value) => {
    setSelectedOptions((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [statusType, setStatusType] = useState("1");
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const tableDateRangeRef = useRef(null);

  useEffect(() => {
    if (!openDropdown) return;

    const updateDropdownPosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [openDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target)
      ) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const redraw = () => {
    setCount(count + 1);
  };
  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        fetchReportsList();
        redraw();
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    }, 900);
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const toggleCalendar = () => setShowCalendar((prev) => !prev);
  const handleApply = () => setShowCalendar(false);
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState([]);

  const handleApplyAll = () => {
    console.log("Applied all ranges:", { startDate, endDate });
    setShowCalendar(false);
  };

  const editaddons = async (id) => {
    console.log("Editing addon ID:", id);
    try {
      const response = await editAddon(id);
      console.log("Full API Response for edit:", response.data);

      let addonsData;
      if (response.data?.data?.addonsList) {
        addonsData = response.data.data.addonsList[0];
      } else if (response.data?.addonsList) {
        addonsData = response.data.addonsList[0];
      } else if (response.data?.data) {
        addonsData = response.data.data;
      } else {
        addonsData = response.data;
      }

      console.log("Extracted addon data:", addonsData);

      if (addonsData) {
        const formattedAddons = {
          id: addonsData.addonsId || addonsData.id || id,
          addonsId: addonsData.addonsId || addonsData.id || id,
          name: addonsData.name || "Unnamed Addon",
          serviceProvider: addonsData.serviceProvider || "",
          addOnAmount: addonsData.addOnAmount || addonsData.addOnAmount || "0",
          addOnType: addonsData.addOnType || addonsData.addontype || "CPM",
          ...addonsData
        };

        console.log("Setting addon to modal:", formattedAddons);
        setSelectedAddons(formattedAddons);
        setTimeout(() => {
          setOnetimeReportModalOpen(true);
        }, 50);
      } else {
        alert("No addon data found");
      }
    } catch (err) {
      console.error("Error fetching addon:", err);
      alert(`Error: ${err.message}`);
    }
  };
  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading && rowData.length > 0) {
      setSelectedIds([rowData[0].id]);
    }
  }, [loading, rowData]);

  const fetchReportsList = async () => {
    setLoading(true);
    try {
      const res = await getOneTimeReport({});
      const list = res?.data?.data || res?.data || res || [];
      console.log("API Response:", list);

      const formatted = Array.isArray(list) ? list.map((item) => ({
        id: item.id,
        reportName: item.reportName,
        createdTime: item.createdTime,
        expireTime: item.expireTime,
        status: item.status,
        csvFilePath: item.csvFilePath,
        originalData: item
      })) : [];

      console.log("Formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsList();
  }, []);

  const CustomLoader = () => (
    <div className="customloader" >
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div
      className="nodataavilable"
    >
      <div className="py-4 fw-bold text-secondary">
        {"No data available"}
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

  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.id}
      </div>
    );
  };

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.reportName}
      </div>
    );
  };

  const CreatedCell = ({ row }) => {
    const formatted = row.createdTime ? new Date(row.createdTime).toLocaleDateString() : "";
    return (
      <div className="gOorhn">
        {formatted}
      </div>
    );
  };

  const ExpireCell = ({ row }) => {
    const formatted = row.expireTime ? new Date(row.expireTime).toLocaleDateString() : "";
    return (
      <div className="gOorhn">
        {formatted}
      </div>
    );
  };

  const handleDownloadReport = async (reportId, reportName) => {
    try {
      const res = await downloadOneTimeReport(reportId);

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeName = reportName ? reportName.replace(/[^a-zA-Z0-9_\- ]/g, '') : `report_${reportId}`;
      link.setAttribute('download', `${safeName}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
    }
  };

  const StatusCell = ({ row }) => {
    if (row.csvFilePath) {
      return (
        <div
          className="gOorhn reports-status-download"
          onClick={() => handleDownloadReport(row.id, row.reportName)}
        >
          Available <FaDownload />
        </div>
      );
    }
    return (
      <div className="gOorhn">
        {row.status}
      </div>
    );
  };

  const columns = [
    {
      name: "Actions",
      cell: (row) => <AudienceActionsCell row={row} />,
      grow: 1,
      width: "100px",
    },
    {
      name: "ID",
      selector: (row) => row.id,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "62px",
    },
    {
      name: "Report Name",
      selector: (row) => row.reportName,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
    },
    {
      name: "Created On",
      selector: (row) => row.createdTime,
      cell: (row) => <CreatedCell row={row} />,
      sortable: true,
      grow: 4,
      width: "162px",
    },
    {
      name: "Expires On",
      selector: (row) => row.expireTime,
      cell: (row) => <ExpireCell row={row} />,
      sortable: true,
      grow: 5,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <StatusCell row={row} />,
      sortable: true,
      grow: 5,
    },

  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        // backgroundColor: '#FBEDEF !important',
        '& .gOorhn': {
          color: 'black !important',
        }
      },
    },
  ];

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.reportName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const pagedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, currentPage, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog className="reports-action-icon" />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          {canEditReport && (
            <DropdownItem onClick={() => editaddons(row.id)}>
              Edit List
            </DropdownItem>
          )}
          {canDeleteReport && (
            <DropdownItem onClick={(e) => showModal(e, row.id)}>
              Delete List
            </DropdownItem>
          )}
          {!canEditReport && !canDeleteReport && (
            <DropdownItem disabled>No Actions Available</DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
    );
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddonsSave = (savedAudience) => {
    console.log("Audience saved:", savedAudience);
    setOnetimeReportModalOpen(false);
    setSelectedAddons(null);
    setLoading(true);
    setTimeout(() => {
      fetchReportsList();
    }, 800);
  };

  return (
    <>
      <div className="campaign-daily-container">
        <div className="campaign-daily-content">
          {modal && (
            <DecisionModal
              title="Really delete Audience?"
              message="Only the db admin can undo this if you delete it!!!"
              name="DELETE"
              callback={modalCallback}
            />
          )}
          {creative === null && canViewReport && (
            <>
              <div className="campaign-daily-header reports-page-header">
                <div>
                  <div className="campaign-daily-title">
                    <h2>One-Time Reports</h2>
                  </div>
                </div>
              </div>
              <Card className="mb-3 reports-card">
                <CardBody className="py-3 reports-card-body">
                  <div className="reports-toolbar">
                    <div className="reports-toolbar-left">
                      <div
                        className="cd-date-range-wrapper reports-search-wrap"
                        ref={tableDateRangeRef}
                      >
                        <input
                          type="text"
                          placeholder="Search"
                          className="input-search-box reports-search-input"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                      </div>

                      <div ref={dropdownRef} className="position-relative otr-dropdown-wrap">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(!openDropdown)}
                          className={`reports-status-button ${openDropdown ? "reports-status-open" : ""}`}
                        >
                          {selectedOptions.length > 0
                            ? `Selected (${selectedOptions.length})`
                            : "Select Status"}
                          <i className={`fa reports-status-icon ${openDropdown ? "fa-chevron-up" : "fa-chevron-down"}`} />
                        </button>

                        {openDropdown && false && (
                          <div className="otr-dropdown-menu reports-dropdown-menu reports-dropdown-menu-legacy">
                            {otroptions.map((opt, index) => {
                              const isChecked = selectedOptions.includes(opt.value);

                              return (
                                <React.Fragment key={opt.value}>
                                  {index === 5 && <div className="otr-divider" />}

                                  <div
                                    className="otr-option-item"
                                    onClick={() => handleCheckboxChange(opt.value)}
                                  >
                                    <div className={`otr-checkbox-box ${isChecked ? "checked" : ""}`}>
                                      {isChecked && "✓"}
                                    </div>

                                    <span className="otr-label">{opt.label}</span>
                                  </div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {openDropdown && createPortal(
                        <div
                          ref={dropdownMenuRef}
                          className="custom-dropdown-menu biddeript-b reports-dropdown-menu"
                          style={{
                            "--dropdown-top": `${dropdownPosition.top}px`,
                            "--dropdown-left": `${dropdownPosition.left}px`,
                            "--dropdown-width": `${dropdownPosition.width}px`,
                          }}
                        >
                          {otroptions.map((opt, index) => {
                            const isChecked = selectedOptions.includes(opt.value);
                            const isHovered = hoveredOption === opt.value;

                            return (
                              <React.Fragment key={opt.value}>
                                {index === 5 && <div className="reports-dropdown-divider" />}

                                <div
                                  className={`custom-dropdown-option reports-dropdown-option ${isChecked ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
                                  onClick={() => handleCheckboxChange(opt.value)}
                                  onMouseEnter={() => setHoveredOption(opt.value)}
                                  onMouseLeave={() => setHoveredOption(null)}
                                >
                                  <span className="tick-icon">
                                    {(isChecked) && "✓"}
                                  </span>

                                  <span className="reports-dropdown-label">
                                    {opt.label}
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>,
                        document.body
                      )}

                      <button className="cdi-refresh-btn reports-refresh-btn" onClick={refresh} title="Refresh Data">
                        <i className={"fa fa-repeat " + (loading ? "fa-spin" : "")}></i>
                      </button>
                    </div>

                    <div className="cdi-controls-right reports-toolbar-right">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <div className="cd-pagination-summary reports-pagination-summary">
                          {filteredData.length
                            ? `${Math.min(currentPage * perPage, filteredData.length)} of ${filteredData.length} entries`
                            : "0 entries"}
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
                              <div
                                id="items-per-page-wrapper"
                                ref={perPageRef}
                                className="reports-items-per-page-wrapper"
                              >
                                <div className="campaign-select-wrapper">
                                  <input
                                    readOnly
                                    value={`${perPage} per page`}
                                    className="campaign-select-input reports-select-input"
                                    onClick={() =>
                                      setIsPerPageOpen(!isPerPageOpen)
                                    }
                                  />
                                  <FaChevronDown className={`reports-select-chevron ${isPerPageOpen ? "is-open" : ""}`} />
                                </div>
                              </div>
                              {isPerPageOpen &&
                                typeof document !== "undefined" &&
                                ReactDOM.createPortal(
                                  <div
                                    ref={perPagePortalRef}
                                    className="custom-dropdown-menu biddeript-b reports-per-page-menu"
                                    style={{
                                      "--per-page-top": `${perPageDropdownPosition.top}px`,
                                      "--per-page-left": `${perPageDropdownPosition.left}px`,
                                    }}
                                  >
                                    {[10, 20, 25, 50, 100, 250, 500].map((value) => {
                                      const isSelected = perPage === value;
                                      return (
                                        <div
                                          key={value}
                                          onClick={() => {
                                            setPerPage(value);
                                            setCurrentPage(1);
                                            setIsPerPageOpen(false);
                                          }}
                                          className={`custom-dropdown-option reports-per-page-option ${isSelected ? "selected" : ""}`}
                                        >
                                          <span className="tick-icon">
                                            {isSelected && "✓"}
                                          </span>
                                          <span>{value} per page</span>
                                        </div>
                                      );
                                    })}
                                  </div>,
                                  document.body,
                                )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cdi-export-btn reports-delete-btn"
                        onClick={() => {
                          if (!selectedIds[0]) return;
                          setId(selectedIds[0]);
                          setModal(true);
                        }}
                      >
                        Delete Reports
                      </button>
                      {canCreateReport && (
                        <button
                          type="button"
                          className="cdi-export-btn reports-create-btn"
                          onClick={toggleonetimereportModal}

                        >
                          New One-Time Report
                        </button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              <OnetimeReportModal
                isOpen={onetimereportModalOpen}
                toggle={toggleonetimereportModal}
                audience={selectedAddons}
                callback={handleAddonsSave}
              />

              <div className="campaign-daily-table-wrapper">
                <div className="reports-table-shell">
                  <div className="reports-table-inner">
                    <DataTable
                      keyField="id"
                      className="data-table"
                      columns={columns}
                      data={pagedData}
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
          {creative === null && !canViewReport && (
            <div className="alert alert-warning mt-3 reports-access-denied">
              <i className="fa fa-exclamation-triangle me-2"></i>
              <strong>Access Denied:</strong> You do not have permission to view the One-Time Reports.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Reports;
