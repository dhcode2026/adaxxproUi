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
import DomainModal from "./Modal/DomainModal";
import { FaCaretDown, FaCog, FaChevronRight, FaChevronDown } from "react-icons/fa";
import DataTable from "react-data-table-component";
import { getAllDomainlist, editDomain } from "../views/api/Api";
import { useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/domainlist.css";
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
const DomainList = (props) => {
  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const toggledomaintModal = () => {
    // if modal is currently open and being toggled closed, clear selectedDomain
    if (domainModalOpen) {
      setSelectedDomain(null);
    }
    setDomainModalOpen(!domainModalOpen);
  };
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [perPage, setPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);
  const redraw = () => {
    setCount(count + 1);
  };
  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        fetchDomainList();
        redraw();
      } catch (error) {
        console.error("Error refreshing data:", error);
      } finally {
        setLoading(false);
      }
    }, 900);
  };
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
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
    const hasCreatePermission = canCreate("Domain List");
    const hasViewPermission = canView("Domain List");
    const hasEditPermission = canEdit("Domain List");
    const hasDeletePermission = canDelete("Domain List");
    const hasUpdatePermission = canUpdate("Domain List");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
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



  const editdomain = async (id) => {
    console.log("Editing Domain ID:", id);
    try {
      const response = await editDomain(id);
      console.log("Full API Response for edit:", response.data);

      let domainData;
      if (response.data?.data?.informationDomainList) {
        domainData = response.data.data.informationDomainList[0];
      } else if (response.data?.informationDomainList) {
        domainData = response.data.informationDomainList[0];
      } else if (response.data?.data) {
        domainData = response.data.data;
      } else {
        domainData = response.data;
      }
      console.log("Extracted domain data:", domainData);
      if (domainData) {
        const formattedDomain = {
          id: domainData.domainListId || domainData.id || id,
          name: domainData.name || "Unnamed Domain List",
          list_type: domainData.listType === "ALLOWLIST" || domainData.listType === "allowlist" ? "allowlist" : "blocklist",
          domain_name: Array.isArray(domainData.domains)
            ? domainData.domains.join('\n')
            : (domainData.domains || ""),
          domainListCount: domainData.domainListCount || 0,
          ...domainData
        };

        console.log("Setting domain to modal:", formattedDomain);
        setSelectedDomain(formattedDomain);
        setTimeout(() => {
          setDomainModalOpen(true);
        }, 50);
      } else {
        alert("No domain data found");
      }
    } catch (err) {
      console.error("Error fetching domain:", err);
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
  const fetchDomainList = async () => {
    setLoading(true);
    try {
      const res = await getAllDomainlist();
      const list = res?.data?.data?.informationDomainList || [];
      console.log("API Response:", list);
      const formatted = list.map((item, index) => ({
        id: item.domainListId || item.id || `domain-${index}`,
        domainListId: item.domainListId || item.id,
        name: item.name || "Unnamed Audience",
        status: getStatusText(item.status || 1),
        listType: item.listType || "",
        domainListCount: item.domainListCount || "0",
        domains: item.domains || [],
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
    fetchDomainList();
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
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
    },
    {
      name: "Type",
      selector: (row) => row.listType,
      cell: (row) => <TypeCell row={row} />,
      sortable: true,
      grow: 4,
      width: "162px",
    },
    {
      name: "URL Count",
      selector: (row) => row.name,
      cell: (row) => <UrlCell row={row} />,
      sortable: true,
      grow: 5,
       width: "140px",
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
          className="pointer-flex-dl settings"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <FaCog className="icon-margin-right-dl" />
          <FaCaretDown
            className={`arrow-dl ${dropdownOpen ? "rotate-dl" : ""}`}
          />
        </div>
        {dropdownOpen &&
          typeof document !== "undefined" &&
          ReactDOM.createPortal(
            <div
              ref={actionPortalRef}
              className="custom-dropdown-menu biddeript-b custom-dropdown-menu-dl"
              style={{
                "--dropdown-top": `${actionDropdownPosition.top}px`,
                "--dropdown-left": `${actionDropdownPosition.left}px`,
              }}
            >
              {canEditUser && (
                <div
                  onClick={() => {
                    editdomain(row.id);
                    setDropdownOpen(false);
                  }}
                  className="custom-dropdown-option custom-dropdown-option-dl"
                >
                  <span>Edit List</span>
                </div>
              )}
              {!canEditUser && (
                <div
                  className="custom-dropdown-option custom-dropdown-option-dl"
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
      ID: item.domainListId,
      Name: item.name,
      Type: item.listType,
      "URL Count": item.domainListCount,
      Status: item.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Domains");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "domains_export.xlsx");
  };

  const handleAudienceSave = (savedAudience) => {
    console.log("Audience saved:", savedAudience);
    setDomainModalOpen(false);
    setSelectedDomain(null);
    setLoading(true);
    setTimeout(() => {
      fetchDomainList();
    }, 800);
  };

  return (
    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete Domain List?"
          message="Only the db admin can undo this if you delete it!!!"
          name="DELETE"
          callback={modalCallback}
        />
      )}

      <DomainModal
        isOpen={domainModalOpen}
        toggle={toggledomaintModal}
        audience={selectedDomain}
        callback={handleAudienceSave}
      />

      {creative === null && canViewUser && (
        <>
          <div className="campaign-daily-header domain-list-header-dl">
            <div>
              <div className="campaign-daily-title domain-list-title-dl">
                <h2>Domain Lists</h2>
              </div>
            </div>
          </div>
          <Card className="mb-3 domain-list-card-dl">
            <CardBody className="py-3 domain-list-card-body-dl">
              <div className="campaign-daily-controls domain-list-controls-dl">
                <div className="position-relative domain-list-search-wrapper-dl">
                  <Input
                    className="form-control py-1 px-1 rounded-6 custom-select-input domain-list-search-input-dl"
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
                  className="cdi-icon-btn domain-list-refresh-btn-dl"
                >
                  <i className="fa fa-repeat me-1"></i>Refresh
                </button>
                <div className="d-flex align-items-center flex-wrap gap-2 domain-list-pagination-shell-dl">
                  <div className="cdi-pagination-controls domain-list-pagination-controls-dl">
                    <div className="cd-pagination-summary domain-list-pagination-summary-dl">
                      {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                    </div>
                    <div className="cd-pagination-toolbar domain-list-pagination-toolbar-dl">
                      {totalPages > 1 && (
                        <div className="cd-pagination-controls domain-list-pagination-inner-dl">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="cd-pagination-nav-btn domain-list-pagination-nav-btn-dl"
                            type="button"
                          >
                            <FaChevronRight className="domain-list-nav-chevron-left-dl" />
                          </button>
                          <button
                            className="cd-pagination-page-btn is-active domain-list-pagination-page-btn-dl is-active"
                            type="button"
                          >
                            {currentPage}
                          </button>
                          <span className="domain-list-pagination-label-dl">of</span>
                          <button className="cd-pagination-page-btn domain-list-pagination-page-btn-dl" type="button">
                            {totalPages}
                          </button>
                          <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="cd-pagination-nav-btn domain-list-pagination-nav-btn-dl" type="button">
                            <FaChevronRight className="domain-list-nav-chevron-right-dl" />
                          </button>
                          <div
                            id="items-per-page-wrapper"
                            ref={perPageRef}
                            className="domain-list-per-page-wrapper-dl"
                          >
                            <div className="campaign-select-wrapper domain-list-select-wrapper-dl">
                              <Input
                                readOnly
                                value={`${perPage} per page`}
                                className="campaign-select-input domain-list-select-input-dl"
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
                                className="custom-dropdown-menu biddeript-b custom-dropdown-menu-dl"
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
                                      className={`custom-dropdown-option custom-dropdown-option-dl ${isSelected ? "selected" : ""
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
                  className="cdi-export-btn domain-list-export-btn-dl"
                  id="export"
                  onClick={exportToExcel}
                >
                  Export
                </button>
                {canCreateUser && (
                  <button
                    type="button"
                    className="cdi-export-btn domain-list-create-btn-dl"
                    onClick={() => {
                      // explicitly open modal for creating a new domain list
                      setSelectedDomain(null);
                      setDomainModalOpen(true);
                    }}
                    id="newaudience"
                  >
                    New Domain List
                  </button>)}
              </div>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div className="domain-list-table-shell-dl">
              <div className="domain-list-table-inner-dl">
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
        <div className="alert alert-warning mt-3 domain-list-access-denied-dl">
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Domain List.
        </div>
      )}
    </div>
  );
};

export default DomainList;