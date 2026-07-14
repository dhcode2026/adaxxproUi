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
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";

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



const Rules = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const location = useLocation();
  const navigate = useNavigate();
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
  // Permission states
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();


  useEffect(() => {
    initializePageTab("Rules", "fa fa-puzzle-piece", "/admin/add-ons");
  }, [initializePageTab]);
  ;
  useEffect(() => {
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : (localStorage.getItem("username") || "User");
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-puzzle-piece me-2"></i>
          Rules - <i>{displayName}</i>
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
      const list = res?.data?.data?.addonsLists || [];
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
      name: "Actions",
      cell: (row) => <AudienceActionsCell row={row} />,
      grow: 1,
      width: "100px",
    },

    {
      name: "ID",
      selector: (row) => row.addonsId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "62px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "400px",
    },
    {
      name: "Hierarchy",
      selector: (row) => row.serviceProvider,
      cell: (row) => <ServiceCell row={row} />,
      sortable: true,
      grow: 4,
      
    },
    // {
    //   name: "Add-On Amount",
    //   selector: (row) => row.addOnAmount,
    //   cell: (row) => <AddonCell row={row} />,
    //   sortable: true,
    //   grow: 5,
    // },
    // {
    //   name: "Add-On Type",
    //   selector: (row) => row.addontype,
    //   cell: (row) => <AddTypeCell row={row} />,
    //   sortable: true,
    //   grow: 5,
    // },

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
          className="settings"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
        >
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown
            style={{
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
        {dropdownOpen &&
          typeof document !== "undefined" &&
          ReactDOM.createPortal(
            <div
              ref={actionPortalRef}
              className="custom-dropdown-menu biddeript-b"
              style={{
                position: "absolute",
                top: `${actionDropdownPosition.top}px`,
                left: `${actionDropdownPosition.left}px`,
                zIndex: 9999,
                minWidth: "120px",
                pointerEvents: "auto",
              }}
            >
              {canEditUser && (
                <div
                  onClick={() => {
                    editaddons(row.id);
                    setDropdownOpen(false);
                  }}
                  className="custom-dropdown-option"
                  style={{
                    height: "40px",
                    cursor: "pointer",
                    pointerEvents: "auto",
                  }}
                >
                  <span>Edit List</span>
                </div>
              )} 
              {!canEditUser && (
                <div
                  className="custom-dropdown-option"
                  style={{
                    height: "40px",
                    cursor: "pointer",
                    pointerEvents: "auto",
                  }}
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
          <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <div className="campaign-daily-title" style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}>
                <h2>Rules</h2>
              </div>
            </div>
          </div>
          <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
            <CardBody className="py-3" style={{ overflow: "visible" }}>
              <div className="campaign-daily-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div className="position-relative" style={{ minWidth: '180px' }}>
                  <Input
                    className="form-control py-1 px-1 custom-select-input"
                    type="text"
                    id="searching"
                    placeholder="Search by name"
                    style={{ fontSize: "0.685rem", height: '30px', fontFamily: '"Open Sans", Arial, sans-serif' }}
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={refresh}
                  className="cdi-icon-btn"
                  style={{ padding: '4px 12px', fontSize: '11px', height: '30px', fontFamily: '"Open Sans", Arial, sans-serif' }}
                >
                  <i className="fa fa-repeat me-1"></i>Refresh
                </button>

                <div className="d-flex align-items-center flex-wrap gap-2" style={{ marginLeft: 'auto' }}>
                  <div className="cdi-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flex: '0 0 auto' }}>
                    <div className="cd-pagination-summary" style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                    </div>
                    <div className="cd-pagination-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      {totalPages > 1 && (
                        <div className="cd-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="cd-pagination-nav-btn"
                            type="button"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                            <FaChevronRight style={{ transform: 'rotate(180deg)', fontSize: '12px' }} />
                          </button>
                          <button
                            className="cd-pagination-page-btn is-active"
                            type="button"
                            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', cursor: 'default', }}>
                            {currentPage}
                          </button>
                          <span style={{ color: '#64748b', fontSize: '13px', margin: '0 4px', fontWeight: '500' }}>of</span>
                          <button className="cd-pagination-page-btn" type="button" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500', cursor: 'default', }}  >
                            {totalPages}
                          </button>
                          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="cd-pagination-nav-btn" type="button" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                            <FaChevronRight style={{ fontSize: '12px' }} />
                          </button>
                          <div
                            id="items-per-page-wrapper"
                            ref={perPageRef}
                            style={{ position: "relative", minWidth: "120px", zIndex: 100 }}
                          >
                            <div className="campaign-select-wrapper">
                              <Input
                                readOnly
                                value={`${perPage} per page`}
                                className="campaign-select-input"
                                style={{
                                  height: "38px",
                                  minHeight: "38px",
                                  borderRadius: "13px",
                                  padding: "10px 34px 10px 12px",
                                }}
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
                                className="custom-dropdown-menu biddeript-b"
                                style={{
                                  position: "absolute",
                                  top: `${perPageDropdownPosition.top}px`,
                                  left: `${perPageDropdownPosition.left}px`,
                                  zIndex: 9999,
                                  minWidth: "120px",
                                  pointerEvents: "auto",
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
                                      className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                        }`}
                                      style={{
                                        height: "40px",
                                        cursor: "pointer",
                                        pointerEvents: "auto",
                                      }}
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
                  className="cdi-export-btn"
                  id="export"
                  onClick={exportToExcel}
                  style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#dc2626', color: 'white', borderColor: '#0ea5e9', height: '30px' }}
                >
                  Export
                </button>
                {canCreateUser && (
                  <button
                    type="button"
                    className="cdi-export-btn"
                    id="newaudience"
                    onClick={() => navigate("/admin/rule-editor")}
                    style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#0ea5e9', color: 'white', borderColor: '#0ea5e9', height: '30px' }}
                  >
                    New Rules
                  </button>)}
              </div>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
              <div style={{ minWidth: "1000px" }}>
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
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Add-On.
        </div>
      )}
    </div>
  );
};

export default Rules;