import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Row,
  Col,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import AddonModal from "./Modal/AddonModal";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaCaretUp, FaCaretDown, FaCog, FaChevronDown } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { getAllAddons, upadtestatusAudience, editAddon } from "../views/api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/addonslist.css";

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



const AddonsList = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const toggleaddonModal = () => {
    if (addonModalOpen) {
      setSelectedAddons(null);
    }
    setAddonModalOpen(!addonModalOpen);
  };
  const [selectedAddons, setSelectedAddons] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);
  const currentUsername = localStorage.getItem("username") || "";
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();


  useEffect(() => {
    initializePageTab("Add-Ons", "fa fa-puzzle-piece", "/admin/add-ons");
  }, [initializePageTab]);
  ;
  useEffect(() => {
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : (localStorage.getItem("username") || "User");
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-puzzle-piece me-2"></i>
          Add-Ons - <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);;
  useEffect(() => {
    const hasCreatePermission = canCreate("Add-On");
    const hasViewPermission = canView("Add-On");
    const hasEditPermission = canEdit("Add-On");
    const hasDeletePermission = canDelete("Add-On");
    const hasUpdatePermission = canUpdate("Add-On");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
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
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => {
    setCount(count + 1);
  };
  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        fetchAddonsList();
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

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
          addOnType: addonsData.addOnType || addonsData.addontype || "CPM", // Fixed field name
          ...addonsData
        };

        console.log("Setting addon to modal:", formattedAddons);
        setSelectedAddons(formattedAddons);
        setTimeout(() => {
          setAddonModalOpen(true);
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

  const fetchAddonsList = async () => {
    setLoading(true);
    try {
      const res = await getAllAddons();
      const list = res?.data?.data?.addonsList || [];
      console.log("API Response:", list);
      const formatted = list.map((item) => ({
        id: item.addonsId || item.id || item.addonsId,
        addonsId: item.addonsId || item.addonsId || item.addonsId,
        name: item.name || item.name || "Unnamed Audience",
        serviceProvider: item.serviceProvider || item.serviceProvider || "",
        addOnAmount: item.addOnAmount || item.addOnAmount || "0",
        addontype: item.addontype || item.addontype || "CPM",
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
    fetchAddonsList();
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
        {row.addonsId}
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

  const AddonCell = ({ row }) => {
    const formatCurrency = (value) => {
      const numValue = typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/[$,]/g, '')) || 0;

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numValue);
    };

    return (
      <div className="gOorhn">
        {formatCurrency(row.addOnAmount)}
      </div>
    );
  };

  const ServiceCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.serviceProvider}
      </div>
    );
  };

  const AddTypeCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.addontype}
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
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
    },
    {
      name: "Service Provider",
      selector: (row) => row.serviceProvider,
      cell: (row) => <ServiceCell row={row} />,
      sortable: true,
      grow: 4,
      width: "162px",
    },
    {
      name: "Add-On Amount",
      selector: (row) => row.addOnAmount,
      cell: (row) => <AddonCell row={row} />,
      sortable: true,
      grow: 5,
    },
    {
      name: "Add-On Type",
      selector: (row) => row.addontype,
      cell: (row) => <AddTypeCell row={row} />,
      sortable: true,
      grow: 5,
    },
      {
      name: "Actions",
      cell: (row) => <AudienceActionsCell row={row} />,
      grow: 1,
      width: "100px",
    },

  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#FBEDEF!important',
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
          className="settings addons-action-menu-dl"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FaCog className="addons-action-icon-dl" />
          <FaCaretDown className={`addons-action-arrow-dl ${dropdownOpen ? "rotate-dl" : ""}`} />
        </div>
        {dropdownOpen &&
          typeof document !== "undefined" &&
          ReactDOM.createPortal(
            <div
              ref={actionPortalRef}
              className="custom-dropdown-menu biddeript-b addons-dropdown-menu-dl"
              style={{
                "--dropdown-top": `${actionDropdownPosition.top}px`,
                "--dropdown-left": `${actionDropdownPosition.left}px`,
              }}
            >
              {canEditUser && (
                <div
                  onClick={() => {
                    editaddons(row.id);
                    setDropdownOpen(false);
                  }}
                  className="custom-dropdown-option option-style-dl"
                >
                  <span>Edit List</span>
                </div>
              )} 
              {!canEditUser && (
                <div
                  className="custom-dropdown-option addons-dropdown-option-dl"
                >
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

  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export");
      return;
    }
    const exportData = filteredData.map((item) => ({
      ID: item.addonsId,
      Name: item.name,
      "Service Provider": item.serviceProvider,
      "Add-On Amount": item.addOnAmount,
      "Add-On Type": item.addontype,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Add-Ons");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "addons_export.xlsx");
  };

  const handleAddonsSave = (savedAudience) => {
    console.log("Audience saved:", savedAudience);
    setAddonModalOpen(false);
    setSelectedAddons(null);
    setLoading(true);
    setTimeout(() => {
      fetchAddonsList();
    }, 800);
  };

  return (
    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete Add-On?"
          message="Only the db admin can undo this if you delete it!!!"
          name="DELETE"
          callback={modalCallback}
        />
      )}

      <AddonModal
        isOpen={addonModalOpen}
        toggle={toggleaddonModal}
        audience={selectedAddons}
        callback={handleAddonsSave}
      />

      {creative === null && canViewUser && (
        <>
          <div className="campaign-daily-header addons-list-header-dl">
            <div>
              <div className="campaign-daily-title addons-list-title-dl">
                <h2>Add-Ons</h2>
              </div>
            </div>
          </div>
          <Card className="mb-3 addons-list-card-dl">
            <CardBody className="py-3 addons-list-card-body-dl">
              <div className="campaign-daily-controls addons-list-controls-dl">
                <div className="position-relative addons-list-search-wrapper-dl">
                  <Input
                    className="form-control py-1 px-1 custom-select-input addons-list-search-input-dl"
                    type="text"
                    id="searching"
                    placeholder="Search by name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={refresh}
                  className="cdi-icon-btn addons-list-refresh-btn-dl"
                >
                  <i className="fa fa-repeat me-1"></i>Refresh
                </button>

                <div className="d-flex align-items-center flex-wrap gap-2 addons-list-pagination-shell-dl">
                  <div className="cdi-pagination-controls addons-list-pagination-controls-dl">
                    <div className="cd-pagination-summary addons-list-pagination-summary-dl">
                      {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                    </div>
                    <div className="cd-pagination-toolbar addons-list-pagination-toolbar-dl">
                      {totalPages > 1 && (
                        <div className="cd-pagination-controls addons-list-pagination-inner-dl">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="cd-pagination-nav-btn addons-list-pagination-nav-btn-dl"
                            type="button"
                          >
                            <FaChevronRight className="addons-list-nav-chevron-left-dl" />
                          </button>
                          <button
                            className="cd-pagination-page-btn is-active addons-list-pagination-page-btn-dl is-active"
                            type="button"
                          >
                            {currentPage}
                          </button>
                          <span className="addons-list-pagination-label-dl">of</span>
                          <button className="cd-pagination-page-btn addons-list-pagination-page-btn-dl" type="button">
                            {totalPages}
                          </button>
                          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="cd-pagination-nav-btn addons-list-pagination-nav-btn-dl" type="button">
                            <FaChevronRight className="addons-list-nav-chevron-right-dl" />
                          </button>
                          <div
                            id="items-per-page-wrapper"
                            ref={perPageRef}
                            className="addons-list-per-page-wrapper-dl"
                          >
                            <div className="campaign-select-wrapper addons-list-select-wrapper-dl">
                              <Input
                                readOnly
                                value={`${perPage} per page`}
                                className="campaign-select-input addons-list-select-input-dl"
                                onClick={() =>
                                  setIsPerPageOpen(!isPerPageOpen)
                                }
                                tabIndex={0}
                              />
                              <FaCaretDown
                                className={`custom-select-icon campaign-select-icon ${isPerPageOpen ? "open" : ""
                                  }`}
                              />
                            </div>
                          </div>
                          {isPerPageOpen &&
                            typeof document !== "undefined" &&
                            ReactDOM.createPortal(
                              <div
                                ref={perPagePortalRef}
                                className="custom-dropdown-menu biddeript-b addons-dropdown-menu-dl"
                                style={{
                                  "--dropdown-top": `${perPageDropdownPosition.top}px`,
                                  "--dropdown-left": `${perPageDropdownPosition.left}px`,
                                }}
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
                                      className={`option-style-dl custom-dropdown-option ${isSelected ? "selected" : ""
                                        }`}
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

                <button
                  type="button"
                  className="cdi-export-btn addons-list-export-btn-dl"
                  id="export"
                  onClick={exportToExcel}
                >
                  Export
                </button>
                {canCreateUser && (
                  <button
                    type="button"
                    className="cdi-export-btn addons-list-create-btn-dl"
                    onClick={() => {
                      setSelectedAddons(null);
                      setAddonModalOpen(true);
                    }}
                    id="newaudience"
                  >
                    New Add-On
                  </button>)}
              </div>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div className="addons-list-table-shell-dl">
              <div className="addons-list-table-inner-dl">
                <DataTable
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
        <div className="alert alert-warning mt-3 addons-list-access-denied-dl">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Add-On.
        </div>
      )}
    </div>
  );
};

export default AddonsList;