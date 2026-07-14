import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";

// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaChevronDown, FaCaretUp, FaCaretDown, FaCog } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { getAllDomainlist, upadtestatusAudience, editAudience } from "../views/api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/export.css";

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
const ExportList = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };
  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const toggledomaintModal = () => setDomainModalOpen(!domainModalOpen);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);
  // Permission states
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();

  const currentUsername = localStorage.getItem("username") || "";
  useEffect(() => {
    initializePageTab("Export Segments", "ti-folder", "/admin/ExportList");
  }, [initializePageTab]);
  useEffect(() => {
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : (localStorage.getItem("username") || "User");
    updateTab("default", {
      header: (
        <>
          <i className="ti-folder me-2"></i>
          Export Segments1- <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);;




  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
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
    if (perPagePortalRef.current && isPerPageOpen) {
      perPagePortalRef.current.style.setProperty("--dropdown-top", `${perPageDropdownPosition.top}px`);
      perPagePortalRef.current.style.setProperty("--dropdown-left", `${perPageDropdownPosition.left}px`);
    }
  }, [perPageDropdownPosition, isPerPageOpen]);

  useEffect(() => {
    const hasCreatePermission = canCreate("Export Segments");
    const hasViewPermission = canView("Export Segments");
    const hasEditPermission = canEdit("Export Segments");
    const hasDeletePermission = canDelete("Export Segments");
    const hasUpdatePermission = canUpdate("Export Segments");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);

  const redraw = () => {
    setCount(count + 1);
  };

  const setDates = (c) => {
    var date = new Date();
    c.interval_start = date.getTime();
    c.interval_end = date.setDate(date.getDate() + 30);
    return c;
  };

  const deleteCreative = async (id, key) => {
    await vx.deleteCreative(id, key);
    await vx.getDbAudience();
    setCreative(null);
    redraw();
  };

  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        //fetchDomainList();
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

  const [currentPage, setCurrentPage] = useState(1);

  const handleApplyAll = () => {
    console.log("Applied all ranges:", { startDate, endDate });
    setShowCalendar(false);
  };

  const editaudience = async (id) => {
    console.log("Editing audience ID:", id);
    try {
      const response = await editAudience(id);
      console.log("Full API Response for edit:", response.data);
      let audienceData;
      if (response.data?.data?.informationDomainList) {
        audienceData = response.data.data.informationDomainList[0];
      } else if (response.data?.informationDomainList) {
        audienceData = response.data.informationDomainList[0];
      } else if (response.data?.data) {
        audienceData = response.data.data;
      } else {
        audienceData = response.data;
      }
      console.log("Extracted audience data:", audienceData);
      if (audienceData) {
        const formattedAudience = {
          id: audienceData.domainListId || audienceData.id || id,
          domainListId: audienceData.domainListId || audienceData.id || id,
          name: audienceData.name || "Unnamed Audience",
          listType: audienceData.listType || 0,
          domainListCount: audienceData.domainListCount || 0,
          ...audienceData
        };
        console.log("Setting audience to modal:", formattedAudience);
        setSelectedDomain(formattedAudience);
        setTimeout(() => {
          setDomainModalOpen(true);
        }, 50);
      } else {
        alert("No audience data found");
      }
    } catch (err) {
      console.error("Error fetching audience:", err);
      alert(`Error: ${err.message}`);
    }
  };;

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

  const fetchDomainList = async () => {
    setLoading(true);
    try {
      const res = await getAllDomainlist();
      const list = res?.data?.data?.informationDomainList || [];
      console.log("API Response:", list);
      const formatted = list.map((item) => ({
        id: item.domainListId || item.id || item.domainListId,
        domainListId: item.domainListId || item.domainListId || item.domainListId,
        name: item.name || item.name || "Unnamed Audience",
        status: getStatusText(item.status || 1),
        listType: item.listType || item.listType || "",
        domainListCount: item.domainListCount || item.domainListCount || "0",
        originalData: item
      }));

      console.log("Formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching exchanges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchDomainList();
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
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        No data available
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

  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.domainListId}
      </div>
    );
  };

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.name}
      </div>
    );
  };

  const UrlCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.domainListCount}
      </div>
    );
  };

  const TypeCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.listType}
      </div>
    );
  };

  const columns = [
    {
      name: "S.No",
      cell: (row, index) => <div className="gOorhn">{index + 1}</div>,
      sortable: false,
      width: "90px",
    },
    {
      name: "Type",
      selector: (row) => row.domainListId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
    {
      name: "Status",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
      width: "200px",
    },
    {
      name: "Created On",
      selector: (row) => row.listType,
      cell: (row) => <TypeCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
     {
      name: "Actions",
      cell: (row) => <AudienceActionsCell row={row} />,
      grow: 1,
     
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

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, currentPage, perPage]);

  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const actionRef = useRef(null);
    const actionPortalRef = useRef(null);
    const [actionDropdownPosition, setActionDropdownPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (dropdownOpen && actionRef.current) {
        const updatePosition = () => {
          const rect = actionRef.current.getBoundingClientRect();
          setActionDropdownPosition({
            top: rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX,
          });
        };
        updatePosition();
        window.addEventListener("scroll", updatePosition);
        return () => window.removeEventListener("scroll", updatePosition);
      }
    }, [dropdownOpen]);

    useEffect(() => {
      if (dropdownOpen && actionPortalRef.current) {
        actionPortalRef.current.style.setProperty("--dropdown-top", `${actionDropdownPosition.top}px`);
        actionPortalRef.current.style.setProperty("--dropdown-left", `${actionDropdownPosition.left}px`);
      }
    }, [actionDropdownPosition, dropdownOpen]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (actionRef.current && !actionRef.current.contains(event.target)) {
          const portalNode = actionPortalRef.current;
          if (portalNode && portalNode.contains(event.target)) {
            return;
          }
          setDropdownOpen(false);
        }
      };

      if (dropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [dropdownOpen]);

    return (
      <>
        <div
          ref={actionRef}
          className="settings export-list-settings-trigger"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FaCog className="export-list-action-icon" />
          <FaCaretDown className={`export-list-action-caret${dropdownOpen ? " rotate" : ""}`} />
        </div>
        {dropdownOpen &&
          typeof document !== "undefined" &&
          ReactDOM.createPortal(
            <div
              ref={actionPortalRef}
              className="custom-dropdown-menu biddeript-b export-list-dropdown-portal"
            >
              {canEditUser && (
                <div
                  onClick={() => {
                    editaudience(row.id);
                    setDropdownOpen(false);
                  }}
                  className="custom-dropdown-option export-list-dropdown-option"
                >
                  <span>Edit List</span>
                </div>)}
              {/* {canDeleteUser && (
              <div
                onClick={(e) => {
                  showModal(e, row.id);
                  setDropdownOpen(false);
                }}
                className="custom-dropdown-option export-list-dropdown-option"
              >
                <span>Delete List</span>
              </div>
              )} */}
              {!canEditUser && (
                <div className="custom-dropdown-option export-list-dropdown-option">
                  <span>No Actions Available</span>
                </div>
              )}
            </div>,
            document.body,
          )}
      </>
    );
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  return (
    <div className="content1 export-list-page">
      <div className="content-wrapper export-list-wrapper">
        {modal && (
          <DecisionModal
            title="Really delete Audience?"
            message="Only the db admin can undo this if you delete it!!!"
            name="DELETE"
            callback={modalCallback}
          />
        )}
        {creative === null && canViewUser && (
          <>
            <div className="campaign-daily-header export-list-header">
              <div>
                <div className="campaign-daily-title export-list-title">
                  <h2>Export Segments</h2>
                </div>
              </div>
            </div>
            <Card className="mb-3 export-list-card">
              <CardBody className="py-3 export-list-card-body">
                <div className="campaign-daily-controls export-list-controls">
                  <div className="position-relative export-list-search-wrapper">
                    <Input
                      className="form-control py-1 px-1 custom-select-input export-list-search-input"
                      type="text"
                      id="seaching"
                      placeholder="Search by name"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={refresh}
                    className="cdi-icon-btn export-list-refresh-btn"
                  >
                    <i className="fa fa-repeat me-1"></i>Refresh
                  </button>

                  <div className="d-flex align-items-center flex-wrap gap-2 export-list-right-controls">
                    <div className="cdi-pagination-controls export-list-pagination-controls">
                      <div className="cd-pagination-summary export-list-pagination-summary">
                        {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                      </div>
                      <div className="cd-pagination-toolbar export-list-pagination-toolbar">
                        {totalPages > 1 && (
                          <div className="cd-pagination-controls export-list-pagination-inner">
                            <button
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              disabled={currentPage === 1}
                              className="cd-pagination-nav-btn export-list-pagination-nav-btn"
                              type="button"
                            >
                              <FaChevronRight className="export-list-nav-chevron export-list-nav-chevron-left" />
                            </button>
                            <button
                              className="cd-pagination-page-btn is-active export-list-pagination-page-btn export-list-pagination-page-btn-active"
                              type="button"
                            >
                              {currentPage}
                            </button>
                            <span className="export-list-pagination-label">of</span>
                            <button className="cd-pagination-page-btn export-list-pagination-page-btn" type="button">
                              {totalPages}
                            </button>
                            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="cd-pagination-nav-btn export-list-pagination-nav-btn" type="button">
                              <FaChevronRight className="export-list-nav-chevron export-list-nav-chevron-right" />
                            </button>
                            <div
                              id="items-per-page-wrapper"
                              ref={perPageRef}
                              className="export-list-per-page-wrapper"
                            >
                              <div className="campaign-select-wrapper export-list-select-wrapper">
                                <Input
                                  readOnly
                                  value={`${perPage} per page`}
                                  className="campaign-select-input export-list-select-input"
                                  onClick={() =>
                                    setIsPerPageOpen(!isPerPageOpen)
                                  }
                                  tabIndex={0}
                                />
                                <FaCaretDown
                                  className={`custom-select-icon campaign-select-icon ${isPerPageOpen ? "open" : ""}`}
                                />
                              </div>
                            </div>
                            {isPerPageOpen &&
                              typeof document !== "undefined" &&
                              ReactDOM.createPortal(
                                <div
                                  ref={perPagePortalRef}
                                  className="custom-dropdown-menu biddeript-b export-list-dropdown-portal"
                                >
                                  {[10, 20, 25, 50, 100].map((value) => {
                                    const isSelected = perPage === value;
                                    return (
                                      <div
                                        key={value}
                                        onClick={() => {
                                          setPerPage(value);
                                          setCurrentPage(1);
                                          setIsPerPageOpen(false);
                                        }}
                                        className={`custom-dropdown-option export-list-dropdown-option ${isSelected ? "selected" : ""}`}
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
                  </div>
                </div>
              </CardBody>
            </Card>
            <div className="campaign-daily-table-wrapper export-list-table-wrapper">
              <div className="export-list-table-shell">
                <div className="export-list-table-inner">
                  <DataTable
                    className="data-table"
                    keyField="date"
                    columns={columns}
                    data={paginatedData}
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
        {creative === null && !canViewUser && (
          <div className="alert alert-warning mt-3 export-list-access-denied">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <strong>Access Denied:</strong> You do not have permission to view the Export Segments.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportList;
