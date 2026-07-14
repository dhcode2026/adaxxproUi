
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Row,
  Col,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Offcanvas,
  OffcanvasHeader,
  OffcanvasBody,
  FormGroup,
  Label,
  Input,
  Modal,
} from "reactstrap";
import DataTable from "react-data-table-component";
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt, FaShieldAlt, FaKey, FaCog, FaCaretDown, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation, useNavigate } from "react-router-dom";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import "./editors/campcreate.css";
import { createRole, getAllRole, updateRoleById, deleteRoleById, getRoleById, getroleaccess } from "./api/Api";
import UserAccess from "./UserAccess";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
const Settings = () => {
  const { globalTabsList: tabsList, addTab, removeTab, initializePageTab } = useGlobalTabs();
  const location = useLocation();

  const [showRoleOffcanvas, setShowRoleOffcanvas] = useState(false);
  const [roles, setRoles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState({ id: null, roleName: "" });
  const [loading, setLoading] = useState(false);
  const [showUserAccess, setShowUserAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionsCounts, setPermissionsCounts] = useState({});
  const [selectedRoleForAccess, setSelectedRoleForAccess] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const navigate = useNavigate();
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);

  const campaignConfirmClasses = {
    popup: "campaign-save-swal-popup",
    title: "campaign-save-swal-title",
    htmlContainer: "campaign-save-swal-message",
    actions: "campaign-save-swal-actions",
    confirmButton: "campaign-save-swal-confirm",
    cancelButton: "campaign-save-swal-cancel",
  };

  useEffect(() => {
    initializePageTab("Settings", "fa fa-cog", "/admin/settings");
  }, []);
  useEffect(() => {
    const hasCreatePermission = canCreate("Roles & Permissions");
    const hasViewPermission = canView("Roles & Permissions");
    const hasEditPermission = canEdit("Roles & Permissions");
    const hasDeletePermission = canDelete("Roles & Permissions");
    const hasUpdatePermission = canUpdate("Roles & Permissions");
    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        setIsPerPageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!loading && roles.length > 0) {
      setSelectedIds([roles[0].id]);
    }
  }, [loading, roles]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await getAllRole();
      if (response.data && response.status === 200) {
        const informationRoles = response.data.data.informationRoles;
        const mappedRoles = informationRoles.map((role) => ({
          ...role,
          id: role.roleId, // Mapping roleId to id for component compatibility
        }));
        setRoles(mappedRoles);

        const counts = {};
        await Promise.all(mappedRoles.map(async (r) => {
          try {
            const accRes = await getroleaccess({ roleId: parseInt(r.id) });
            let count = 0;
            if (accRes.data && Array.isArray(accRes.data)) {
              accRes.data.forEach(item => {
                if (item.canView === 1 || item.canEdit === 1 || item.canUpdate === 1 || item.canCreate === 1 || item.canDelete === 1 || item.canReport === 1) {
                  count++;
                }
              });
            }
            counts[r.id] = count;
          } catch (e) {
            counts[r.id] = 0;
          }
        }));
        setPermissionsCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      // Swal.fire("Error", "Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const toggleOffcanvas = () => setShowRoleOffcanvas(!showRoleOffcanvas);

  const handleAddRole = () => {
    setIsEditing(false);
    setCurrentRole({ id: null, roleName: "" });
  };

  const handleEditRole = async (role) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This role is already assigned to users. Do you want to edit?",
      icon: "question",
      iconColor: "#fbbf24",
      showCancelButton: true,
      confirmButtonText: "Yes, edit it!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: campaignConfirmClasses,
      allowOutsideClick: true,
    });

    if (!result.isConfirmed) return;

    setShowRoleOffcanvas(true);
    setLoading(true);
    try {
      const response = await getRoleById(role.id);
      if (response.data && response.status === 200) {
        const roleData = response.data.data.informationRoles[0];

        setIsEditing(true);
        setCurrentRole({
          id: roleData.roleId,
          roleName: roleData.roleName,
          status: roleData.status
        });
      }
    } catch (error) {
      console.error("Error fetching role details:", error);
      Swal.fire("Error", "Failed to load role details", "error");
    } finally {
      setLoading(false);
    }
  };

  const showValidationError = async () => {
    await Swal.fire({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center;">
          Please enter a role name.
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 268,
      padding: 0,
    });
  };

  const handleDeleteRole = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this role?",
      icon: "question",
      iconColor: "#fbbf24",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: campaignConfirmClasses,
      allowOutsideClick: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const response = await deleteRoleById(id);
          if (response.status === 200 || response.status === 204) {
            setRoles(roles.filter((r) => r.id !== id));
            await showCampaignAlert("Deleted!", "The role has been deleted.", "success");
          }
        } catch (error) {
          console.error("Error deleting role:", error);
          await showCampaignAlert("Error", "Failed to delete role", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleConfirmSaveRole = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: isEditing ? "Do you want to update this role?" : "Do you want to create this role?",
      icon: "question",
      iconColor: "#fbbf24",
      showCancelButton: true,
      confirmButtonText: isEditing ? "Yes, update it!" : "Yes, save it!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: campaignConfirmClasses,
      allowOutsideClick: true,
    });

    if (!result.isConfirmed) return;

    await handleSaveRole();
  };

  const showCampaignAlert = async (title, text, icon) => {
    await Swal.fire({
      title,
      text,
      icon,
      iconColor: icon === "error" ? "#ef4444" : "#22c55e",
      confirmButtonText: "OK",
      buttonsStyling: false,
      customClass: campaignConfirmClasses,
      allowOutsideClick: true,
    });
  };

  const handleSaveRole = async () => {
    // Simple validation: Check if role name is not empty
    if (!currentRole.roleName || currentRole.roleName.trim() === "") {
      await showValidationError();
      return;
    }

    const payload = {
      roleName: currentRole.roleName,
      status: 1,
    };

    if (isEditing) {
      console.log("Update Role Payload:", { ...payload, id: currentRole.id });
      setLoading(true);
      try {
        const response = await updateRoleById(currentRole.id, payload);
        if (response.status === 200) {
          // Update local state with response data if available, or just keep payload
          const updatedRole = response.data?.data?.informationRoles?.[0] || { ...currentRole, ...payload };
          setRoles(roles.map((r) => (r.id === currentRole.id ? { ...r, ...updatedRole, id: updatedRole.roleId || r.id } : r)));
          await showCampaignAlert("Updated!", "Role updated successfully.", "success");
          handleAddRole();
          setShowRoleOffcanvas(false);
        }
      } catch (error) {
        console.error("Error updating role:", error);
        await showCampaignAlert("Error", "Failed to update role", "error");
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Add Role Payload:", payload);
      setLoading(true);
      try {
        const response = await createRole(payload);
        if (response.data && response.status === 201) {
          const newRoleFromApi = response.data.data.informationRoles[0];
          setRoles([...roles, {
            id: newRoleFromApi.roleId,
            roleName: newRoleFromApi.roleName,
            status: newRoleFromApi.status
          }]);
          await showCampaignAlert("Added!", "New role added successfully.", "success");
          handleAddRole();
          setShowRoleOffcanvas(false);
        }
      } catch (error) {
        console.error("Error creating role:", error);
        await showCampaignAlert("Error", "Failed to add role", "error");
      } finally {
        setLoading(false);
      }
    }
  };


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



  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 fw-bold text-secondary">{"No data available"}</div>
    </div>
  );


  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      (role.roleName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredRoles.slice(startIndex, startIndex + perPage);
  }, [filteredRoles, currentPage, perPage]);

  const RoleActionsCell = ({ row }) => (
    <div className="d-flex gap-2">
      {canEditUser && (
        <Button
          color="info"
          size="sm"
          className="action-btn edit-btn"
          onClick={() => handleEditRole(row)}
          title="Edit"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          <FaEdit size={12} />
        </Button>
      )}
      <Button
        color="warning"
        size="sm"
        className="action-btn permissions-btn"
        onClick={() => { setSelectedRoleForAccess(row.id); setShowUserAccess(true); }}
        title="Manage Permissions"
        style={{ padding: '4px 8px', fontSize: '12px' }}
      >
        <FaShieldAlt size={12} />
      </Button>
      {canDeleteUser && (
        <Button
          color="danger"
          size="sm"
          className="action-btn delete-btn"
          onClick={() => handleDeleteRole(row.id)}
          title="Delete"
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          <FaTrash size={12} />
        </Button>)}
    </div>
  );

  const RoleNameCell = ({ row }) => (
    <div className="gOorhn">
      <FaShieldAlt style={{ marginRight: "8px", fontSize: '12px', color: '#666' }} />
      {row.roleName}
    </div>
  );

  const columns = [
      {
      name: "S.No",
      cell: (row, index) => <div className="gOorhn">{index + 1}</div>,
      sortable: false,
      width: "90px",
    },
    {
      name: "Role Name",
      selector: (row) => row.roleName,
      cell: (row) => <RoleNameCell row={row} />,
      sortable: true,
      grow: 2,
    },
    {
      name: "Actions",
      cell: (row) => <RoleActionsCell row={row} />,
      grow: 1,
      width: "140px",
      right: true,
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: "#FBEDEF !important",
        "& .gOorhn": { color: "black !important" },
      },
    },
  ];

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  return (
    <>
      {canViewUser && (
        <div className="content1">
          <div className="campaign-daily-container">
            <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div>
                <div className="campaign-daily-title" style={{ fontFamily: '"Open Sans", Arial, sans-serif' }}>
                  <h2>Roles & Permissions</h2>
                </div>
              </div>
            </div>

            <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
              <CardBody className="py-3" style={{ overflow: "visible" }}>
                <Row className="align-items-center g-2">
                  <Col md="2">
                    <div className="position-relative" style={{ minWidth: '180px' }}>
                      <Input
                        className="form-control py-1 px-1 custom-select-input"
                        type="text"
                        id="searchRoles"
                        placeholder="Search by role name"
                        style={{ fontSize: "0.685rem", height: '30px', fontFamily: '"Open Sans", Arial, sans-serif' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col sm="6" md="4" lg="3" xl="2" className="ms-auto">
                  </Col>
                  <Col sm="auto">
                    {canCreateUser && (
                      <button
                        type="button"
                        className="cdi-export-btn"
                        onClick={() => { setShowRoleOffcanvas(true); handleAddRole(); }}
                        style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#DC2626', color: 'white', borderColor: '#DC2626', height: '30px' }}
                      >
                        <FaPlus className="me-1" /> Add Role
                      </button>)}
                  </Col>

                </Row>
              </CardBody>
            </Card>
            <div className="campaign-daily-table-wrapper">
              <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
                <div style={{ minWidth: "1000px" }}>
                  <DataTable
                    keyField="id"
                    className="data-table"
                    columns={columns}
                    data={paginatedData}
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
          </div>

          <Modal
            isOpen={showRoleOffcanvas}
            toggle={toggleOffcanvas}
            className="custom-role-modal"
            centered
          >
            <div className="role-modal-header" >
              <div className="role-modal-icon-bg">
                <i className="fa fa-user"></i>
              </div>
              <h5 className="role-modal-title">{isEditing ? "Edit Role" : "New Role"}</h5>
            </div>
            <div className="role-modal-body">
              <label>
                Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={currentRole.roleName}
                onChange={(e) => setCurrentRole({ ...currentRole, roleName: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            <div className="role-modal-footer">
              <button className="role-modal-btn cancel" onClick={toggleOffcanvas}>
                Cancel
              </button>
              {((isEditing && canUpdateUser) || (!isEditing && canCreateUser)) && (
                <button className="role-modal-btn create" onClick={handleConfirmSaveRole}>
                  {isEditing ? "Update" : "Create"}
                </button>
              )}
            </div>
          </Modal>

          <Offcanvas
            direction="end"
            isOpen={showUserAccess}
            toggle={() => setShowUserAccess(!showUserAccess)}
            className="roles"
          >
            <OffcanvasHeader toggle={() => setShowUserAccess(false)}>
              <span className="useraccessmanagement">User Access Management</span>
            </OffcanvasHeader>
            <OffcanvasBody className="useraccessmanagementbody">
              {showUserAccess && <UserAccess defaultRoleId={selectedRoleForAccess} />}
            </OffcanvasBody>
          </Offcanvas>

        </div>)}
      {!canViewUser && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the Roles & Permissions.
        </div>
      )}
    </>

  );
};

export default Settings;
