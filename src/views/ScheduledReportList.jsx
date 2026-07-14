import React, { useState, useEffect, useMemo, Fragment, useRef } from "react";
import { createPortal } from "react-dom";
import Swal from 'sweetalert2';
import {
  Row,
  Col,
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
import ScheduledReportModal from "./Modal/ScheduledReportModal";
import { FaCaretDown, FaCog, FaCalendarAlt, FaChevronDown, FaChevronRight, FaDownload } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { getScheduleReport, updateScheduleReportStatus, upadtestatusAudience, editAddon } from "../views/api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import { stroptions } from "../Utils.js";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/reports.css";

import ScheduledFile from "./ScheduledFile.jsx";
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



const ScheduledReportList = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [scheduledreportModalOpen, setscheduledReportModalOpen] = useState(false);
  const togglescheduledreportModal = () => setscheduledReportModalOpen(!scheduledreportModalOpen);
  const [selectedAddons, setSelectedAddons] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [canCreateScheduledReport, setCanCreateScheduledReport] = useState(false);
  const [canViewScheduledReport, setCanViewScheduledReport] = useState(false);
  const [canEditScheduledReport, setCanEditScheduledReport] = useState(false);
  const [canDeleteScheduledReport, setCanDeleteScheduledReport] = useState(false);
  const [canUpdateScheduledReport, setCanUpdateScheduledReport] = useState(false);
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();

  const currentUsername = localStorage.getItem("username") || "";
  useEffect(() => {
    initializePageTab("Scheduled Report", "fa fa-calendar-check-o", "/admin/schedulereporting");
    const hasCreatePermission = canCreate("Scheduled Report");
    const hasViewPermission = canView("Scheduled Report");
    const hasEditPermission = canEdit("Scheduled Report");
    const hasDeletePermission = canDelete("Scheduled Report");
    const hasUpdatePermission = canUpdate("Scheduled Report");

    console.log("✓ canCreate result for 'Scheduled Report':", hasCreatePermission);
    console.log("✓ canView result for 'Scheduled Report':", hasViewPermission);
    console.log("✓ canEdit result for 'Scheduled Report':", hasEditPermission);
    console.log("✓ canDelete result for 'Scheduled Report':", hasDeletePermission);
    console.log("✓ canUpdate result for 'Scheduled Report':", hasUpdatePermission);

    setCanCreateScheduledReport(hasCreatePermission);
    setCanViewScheduledReport(hasViewPermission);
    setCanEditScheduledReport(hasEditPermission);
    setCanDeleteScheduledReport(hasDeletePermission);
    setCanUpdateScheduledReport(hasUpdatePermission);
  }, [initializePageTab]);

  useEffect(() => {
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : (localStorage.getItem("username") || "User");
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-calendar-check-o me-2"></i>
          Scheduled Report - <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);;

  const [openDropdown, setOpenDropdown] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [hoveredOption, setHoveredOption] = useState(null);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

  const handleCheckboxChange = (value) => {
    setSelectedOptions((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

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


  const [step, setStep] = useState(0);
  const steps = [
    { label: "Files", icon: "tim-icons icon-cloud-download-93" },
  ];
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
        fetchScheduledReports();
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
          setscheduledReportModalOpen(true);
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

  const fetchScheduledReports = async () => {
    setLoading(true);
    try {
      const res = await getScheduleReport();
      const list = res?.data || res?.data?.data || [];
      console.log("API Response:", list);
      const formatted = list.map((item) => ({
        id: item.id,
        name: item.name || "Unnamed Report",
        status: item.status || "UNKNOWN",
        startDate: item.startDate || "",
        startTime: item.startTime || "",
        endDate: item.endDate || "",
        repeatType: item.repeatType || "",
        remainingReports: item.remainingReports ?? 0,
        originalData: item
      }));

      console.log("Formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching scheduled reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledReports();
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

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.name}
      </div>
    );
  };

  const StatusCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(prevState => !prevState);

    const initiateStatusChange = (newStatusText, newStatusCode) => {
      if (row.status === newStatusText) return;
      
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to change the status to ${newStatusText}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes, change it!',
        cancelButtonText: 'Cancel'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await updateScheduleReportStatus(row.id, newStatusCode);
            fetchScheduledReports();
          } catch (error) {
            console.error("Error updating status:", error);
          }
        }
      });
    };

    return (
      <div className="gOorhn">
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
          <DropdownToggle 
            tag="span"
            className={`badge reports-status-toggle ${row.status === 'ACTIVE' ? 'bg-success' : row.status === 'PAUSED' ? 'bg-warning text-dark' : 'bg-secondary'}`}
          >
            {row.status} <FaCaretDown className="reports-caret-icon" />
          </DropdownToggle>
          <DropdownMenu className="reports-status-menu">
            <DropdownItem onClick={() => initiateStatusChange("ACTIVE", 1)}>
              ACTIVE
            </DropdownItem>
            <DropdownItem onClick={() => initiateStatusChange("PAUSED", 0)}>
              PAUSED
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  };

  const StartsCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.startDate} {row.startTime}
      </div>
    );
  };

  const EndsCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.endDate}
      </div>
    );
  };

  const RepeatsCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.repeatType}
      </div>
    );
  };

  const RemainingReportsCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.remainingReports}
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
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "162px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <StatusCell row={row} />,
      sortable: true,
      grow: 2,
      width: "100px",
    },
    {
      name: "Starts",
      selector: (row) => row.startDate,
      cell: (row) => <StartsCell row={row} />,
      sortable: true,
      grow: 3,
      width: "140px",
    },
    {
      name: "Ends",
      selector: (row) => row.endDate,
      cell: (row) => <EndsCell row={row} />,
      sortable: true,
      grow: 3,
      width: "100px",
    },
    {
      name: "Repeats",
      selector: (row) => row.repeatType,
      cell: (row) => <RepeatsCell row={row} />,
      sortable: true,
      grow: 2,
      width: "100px",
    },
    {
      name: "Remaining Reports",
      selector: (row) => row.remainingReports,
      cell: (row) => <RemainingReportsCell row={row} />,
      sortable: true,
      grow: 2,
      width: "140px",
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#FBEDEF !important',
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
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <DropdownToggle tag="span" className="settings reports-action-toggle">
          <FaCog className="reports-action-icon" />
          <FaCaretDown className="reports-action-caret" />
        </DropdownToggle>
        <DropdownMenu className="reports-actions-menu">
          {canEditScheduledReport && (
            <DropdownItem onClick={() => editaddons(row.id)}>
              Edit List
            </DropdownItem>
          )}
          {canDeleteScheduledReport && (
            <DropdownItem onClick={(e) => showModal(e, row.id)}>
              Delete List
            </DropdownItem>
          )}
          {!canEditScheduledReport && !canDeleteScheduledReport && (
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
    setscheduledReportModalOpen(false);
    setSelectedAddons(null);
    setLoading(true);
    setTimeout(() => {
      fetchScheduledReports();
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
          {creative === null && canViewScheduledReport && (
            <>
              <div className="campaign-daily-header reports-page-header">
                <div>
                  <div className="campaign-daily-title">
                    <h2>Scheduled Reports</h2>
                  </div>
                </div>
              </div>

              <Card className="mb-3 reports-card">
                <CardBody className="py-3 reports-card-body">
                  <div className="reports-toolbar">
                    <div className="reports-toolbar-left">
                      <div className="cd-date-range-wrapper reports-search-wrap">
                        <input
                          type="text"
                          placeholder="Search"
                          className="input-search-box reports-search-input"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                      </div>

                      <div ref={dropdownRef} className="position-relative otr-dropdown-wrap reports-status-wrap">
                        <div
                          className="otr-select-box d-flex justify-content-between align-items-center reports-status-select"
                          onClick={() => setOpenDropdown(!openDropdown)}
                        >
                          <span>
                            {selectedOptions.length > 0
                              ? `Selected (${selectedOptions.length})`
                              : "Select Status"}
                          </span>
                          <FaCaretDown className="otr-icon" />
                        </div>

                        {openDropdown && (
                          <div className="otr-dropdown-menu reports-hidden-dropdown">
                            {stroptions.map((opt, index) => {
                              const isChecked = selectedOptions.includes(opt.value);

                              return (
                                <React.Fragment key={opt.value}>
                                  {index === 3 && <div className="otr-divider" />}

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
                          {stroptions.map((opt, index) => {
                            const isChecked = selectedOptions.includes(opt.value);
                            const isHovered = hoveredOption === opt.value;

                            return (
                              <React.Fragment key={opt.value}>
                                {index === 3 && <div className="reports-dropdown-divider" />}

                                <div
                                  className={`custom-dropdown-option reports-dropdown-option ${isChecked ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
                                  onClick={() => handleCheckboxChange(opt.value)}
                                  onMouseEnter={() => setHoveredOption(opt.value)}
                                  onMouseLeave={() => setHoveredOption(null)}
                                >
                                  <span className={`tick-icon reports-dropdown-tick ${isChecked || isHovered ? "active" : ""}`}>
                                    {(isChecked || isHovered) && "✓"}
                                  </span>

                                  <span className={`reports-dropdown-label ${isChecked || isHovered ? "active" : ""}`}>
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
                                    className="campaign-select-input reports-select-input"
                                    onClick={() => setIsPerPageOpen(!isPerPageOpen)}
                                  />
                                  <FaChevronDown className={`reports-select-chevron ${isPerPageOpen ? 'is-open' : ''}`} />
                                </div>
                                {isPerPageOpen &&
                                  typeof document !== 'undefined' &&
                                  createPortal(
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
                      {canCreateScheduledReport && (
                        <button
                          type="button"
                          className="cdi-export-btn reports-create-btn"
                          onClick={togglescheduledreportModal}
                        >
                          New Scheduled Time Report
                        </button>
                      )}
                    </div>
                  </div>

                </CardBody>
              </Card>

              <ScheduledReportModal
                isOpen={scheduledreportModalOpen}
                toggle={togglescheduledreportModal}
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

              <Fragment>
                <div className="reportenable">
                  <div
                    className="panel_Container brandpanel">
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
                                className={`tab-step reports-tab-step d-flex align-items-center mx-2 px-2 py-1 ${isActive ? "active" : ""}`}
                              >
                                <i className={`tim-icons ${item.icon} me-2 reports-tab-step-icon ${isActive ? "is-active" : "text-muted"}`} />
                                <span className={`fw-semibold reports-tab-step-label ${isActive ? "is-active" : "text-muted"}`} id="subgroupname">
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </Col>
                      </Row>
                      <div className="reports-spacer" />
                    </div>
                  </div>
                  {step === 0 && < ScheduledFile />}
                </div>
              </Fragment>
            </>
          )}
          {creative === null && !canViewScheduledReport && (
            <div className="alert alert-warning mt-3 reports-access-denied">
              <i className="fa fa-exclamation-triangle me-2"></i>
              <strong>Access Denied:</strong> You do not have permission to view the Scheduled Reports.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ScheduledReportList;
