import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Input,
  CardBody,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import DecisionModal from "../DecisionModal";
import UserModal from "./Modal/UserModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog, FaPlus, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt as faCalIcon } from "@fortawesome/free-solid-svg-icons";
import DataTable from "react-data-table-component";
import { getUserlist, edituser, deleteUser } from "../views/api/Api"; // Added deleteUser import
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { userlistoptions } from "../Utils.js";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";

const getStatusText = (code) => {
  const statusMap = {
    1: "Active",
    2: "Inactive",
    3: "Archived",
  };
  return statusMap[code] || code;
};

const getRoleNameText = (row) => {
  return row.roleName && row.roleName.trim() !== "" ? row.roleName : "No Role Assigned";
};

const UsersList = (props) => {
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const location = useLocation();
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();

  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const toggleuserModal = () => {
    setUserModalOpen(!userModalOpen);
    if (!userModalOpen) {
      setSelectedUser(null);
    }
  };
  const [selectedUser, setSelectedUser] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const currentUsername = localStorage.getItem("username") || "";

  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
    initializePageTab("Users List", "fa fa-users", "/admin/manage-user");
    const hasCreatePermission = canCreate("Users List");
    const hasViewPermission = canView("Users List");
    const hasEditPermission = canEdit("Users List");
    const hasDeletePermission = canDelete("Users List");
    const hasUpdatePermission = canUpdate("Users List");
    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);

  useEffect(() => {
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : (localStorage.getItem("username") || "User");
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-users me-2"></i>
          Users List - <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);

  const redraw = () => {
    setCount(count + 1);
  };

  const handleUserSave = (savedUser) => {
    console.log("User saved:", savedUser);
    setUserModalOpen(false);
    setSelectedUser(null);
    setLoading(true);
    setTimeout(() => {
      fetchUsersList();
    }, 800);
  };

  const refresh = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        await fetchUsersList();
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [statusType, setStatusType] = useState("1");
  const dropdownRef = useRef(null);

  const dateRangePopupRef = useRef(null);
  const tableDateRangeRef = useRef(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState({
    startDate: startDate || null,
    endDate: endDate || null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(false);
      }
      if (dateRangePopupRef.current && !dateRangePopupRef.current.contains(event.target) &&
        tableDateRangeRef.current && !tableDateRangeRef.current.contains(event.target)) {
        setShowDateRangePicker(false);
      }
      if (perPageRef.current && !perPageRef.current.contains(event.target)) {
        const portalNode = perPagePortalRef.current;
        if (portalNode && portalNode.contains(event.target)) {
          return;
        }
        setHoveredPerPage(null);
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
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isPerPageOpen]);

  const handleApply = () => setShowCalendar(false);
  const handleApplyAll = () => {
    console.log("Applied all ranges:", { startDate, endDate });
    setShowCalendar(false);
  };

  const getPresetRange = (preset) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    switch (preset) {
      case "Today":
        return { startDate: startOfToday, endDate: endOfToday };
      case "Yesterday": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 1);
        const end = new Date(endOfToday);
        end.setDate(end.getDate() - 1);
        return { startDate: start, endDate: end };
      }
      case "Last 7 Days": {
        const end = endOfToday;
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 6);
        return { startDate: start, endDate: end };
      }
      case "Last 30 Days": {
        const start = new Date(startOfToday);
        start.setDate(start.getDate() - 29);
        return { startDate: start, endDate: endOfToday };
      }
      default:
        return { startDate: null, endDate: null };
    }
  };

  const isSameDay = (first, second) => {
    if (!first || !second) return false;
    const f = new Date(first);
    const s = new Date(second);
    return f.toDateString() === s.toDateString();
  };

  const isSameDateRange = (firstRange, secondRange) => (
    isSameDay(firstRange?.startDate, secondRange?.startDate) &&
    isSameDay(firstRange?.endDate, secondRange?.endDate)
  );

  const formatPickerValue = (date) => {
    if (!date) return "-- / -- / ----";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} / ${month} / ${year}`;
  };

  const handlePresetSelect = (preset) => {
    const range = getPresetRange(preset);
    setDraftDateRange(range);
  };

  const handleDateRangeClear = () => {
    setDraftDateRange({ startDate: null, endDate: null });
    setStartDate(null);
    setEndDate(null);
    setShowDateRangePicker(false);
  };

  const handleDateRangeApply = () => {
    if (!draftDateRange.startDate || !draftDateRange.endDate) {
      return;
    }
    const s = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.startDate
      : draftDateRange.endDate;
    const e = draftDateRange.startDate <= draftDateRange.endDate
      ? draftDateRange.endDate
      : draftDateRange.startDate;

    setStartDate(s);
    setEndDate(e);
    setShowDateRangePicker(false);
  };

  const toggleDateRangePicker = () => {
    if (showDateRangePicker) {
      setShowDateRangePicker(false);
    } else {
      setDraftDateRange({
        startDate: startDate || null,
        endDate: endDate || null,
      });
      setShowDateRangePicker(true);
    }
  };

  const formatDateRangeLabel = () => {
    if (startDate && endDate) {
      const options = { day: "numeric", month: "short", year: "numeric" };
      return `${startDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;
    }
    return "Date Range";
  };

  const handleQuickSelect = (type) => {
    const today = new Date();
    let start, end;

    switch (type) {
      case "Today":
        start = end = today;
        break;
      case "Yesterday":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 1
        );
        break;
      case "2 Days Ago":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 2
        );
        break;
      case "Last 7 Days":
        end = today;
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6
        );
        break;
      case "Last 30 Days":
        end = today;
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 29
        );
        break;
      default:
        start = end = null;
    }

    setSelectedLabel(type);
    setStartDate(start);
    setEndDate(end);
  };

  const formatDateRange = () => {
    if (selectedLabel) return selectedLabel;
    if (startDate && endDate) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return `${startDate.toLocaleDateString(
        undefined,
        options
      )} - ${endDate.toLocaleDateString(undefined, options)}`;
    } else if (startDate) {
      return startDate.toLocaleDateString();
    } else {
      return "";
    }
  };
  const editUser = async (userId) => {
    console.log("Editing user ID:", userId);
    try {
      const existingUser = rowData.find(user => user.id === userId);
      
      if (existingUser) {
        const formattedUser = {
          id: existingUser.userId || existingUser.id,
          email: existingUser.email || "",
          firstName: existingUser.firstName || "",
          lastName: existingUser.lastName || "",
          roleId: existingUser.roleId || existingUser.originalData?.role?.roleId || "",
          roleName: existingUser.roleName || "",
          status: existingUser.status || 1,
          companyName: existingUser.companyName || existingUser.originalData?.companyName || "",
          phoneNumber: existingUser.phoneNumber || existingUser.originalData?.phoneNumber || "",
        };
        
        console.log("Setting user to modal:", formattedUser);
        setSelectedUser(formattedUser);
        setUserModalOpen(true);
      } else {
        console.error("User not found in list");
        alert("User data not available");
      }
    } catch (err) {
      console.error("Error editing user:", err);
      alert(`Error: ${err.message || "Failed to edit user"}`);
    }
  };

  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const modalCallback = async (doit) => {
    if (doit) {
      await deleteUserById(id);
    }
    setModal(!modal);
  };

  const showModal = (e, userId) => {
    if (e.ctrlKey) {
      deleteUserById(userId);
      return;
    }
    setId(userId);
    setModal(true);
  };

  const deleteUserById = async (userId) => {
    try {
      setLoading(true);
      console.log("Delete user:", userId);
      await fetchUsersList();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const res = await getUserlist();
      console.log("Full API Response for list:", res);
      const list =
        res?.data?.informationUsers ||
        res?.data?.data?.informationUsers ||
        [];
      console.log("Raw list data:", list);

      const formatted = list.map((item) => {
        const roleName = item.role?.roleName || "";
        const roleId = item.role?.roleId || "";
        const firstName = item.firstName || "";
        const lastName = item.lastName || "";
        const firstLetterOfLast = lastName ? lastName.charAt(0) : "";
        const fullName = firstLetterOfLast 
          ? `${firstName} ${firstLetterOfLast}`.trim() 
          : firstName || "";

        return {
          id: item.userId || item.id,
          userId: item.userId || item.id,
          email: item.email || "No email",
          firstName: item.firstName || "",
          lastName: item.lastName || "",
          fullName: fullName,
          status: item.status || 1,
          administrative: item.administrative || false,
          addfunds: item.addFunds || false,
          assignaddfunds: item.assignAddFunds || false,
          createdAt: item.createdAt || "",
          updatedAt: item.updatedAt || "",
          roleName: roleName,
          roleId: roleId,
          companyName: item.companyName || "",
          phoneNumber: item.phoneNumber || "",
          lastlogin: item.lastlogin || "22/01/2026",
          brand_permission: item.allBrands || false,
          selected_brand_ids: item.brandId || [],
          originalData: item,
        };
      });
      console.log("Formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  useEffect(() => {
    if (!userModalOpen) {
      setSelectedUser(null);
    }
  }, [userModalOpen]);

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

  const EmailCell = ({ row }) => <div className="gOorhn">{row.email}</div>;
  
  const NameCell = ({ row }) => {
    const firstName = row.firstName || "";
    const lastName = row.lastName || "";
    const firstLetterOfLast = lastName ? lastName.charAt(0) : "";
    const displayName = firstLetterOfLast 
      ? `${firstName} ${firstLetterOfLast}`.trim() 
      : firstName || "";
    return <div className="gOorhn">{displayName}</div>;
  };

  const LastloginCell = ({ row }) => (
    <div className="gOorhn">{row.lastlogin}</div>
  );

  const DateCreatedCell = ({ row }) => {
    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    return <div className="gOorhn">{formatDate(row.createdAt)}</div>;
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
      selector: (row) => {
        const firstName = row.firstName || "";
        const lastName = row.lastName || "";
        const firstLetterOfLast = lastName ? lastName.charAt(0) : "";
        return firstLetterOfLast 
          ? `${firstName} ${firstLetterOfLast}`.trim() 
          : firstName || "";
      },
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
      width: "340px",
    },
   
    {
      name: "Email",
      selector: (row) => row.email,
      cell: (row) => <EmailCell row={row} />,
      sortable: true,
      grow: 2,
      width: "340px",
    },
    {
      name: "Role Type",
      selector: (row) => getRoleNameText(row),
      cell: (row) => <div className="gOorhn">{getRoleNameText(row)}</div>,
      sortable: true,
      grow: 2,
      width: "160px",
    },
    {
      name: "Date Created",
      selector: (row) => row.createdAt,
      cell: (row) => <DateCreatedCell row={row} />,
      sortable: true,
      grow: 2,
      width: "160px",
    },
      {
      name: "Actions",
      cell: (row) => <UserActionsCell row={row} />,
      grow: 1,
      
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

  const filteredData = useMemo(() => {
    let filtered = rowData.filter(
      (item) =>
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.firstName + " " + item.lastName)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    if (statusType) {
      if (statusType === "1") {
        filtered = filtered.filter((item) => item.status === 1);
      } else if (statusType === "2") {
        filtered = filtered.filter((item) => item.status === 2);
      } else if (statusType === "3") {
        filtered = filtered.filter((item) => item.status === 3);
      }
    }

    return filtered;
  }, [rowData, searchTerm, statusType]);

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

  const UserActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hoveredAction, setHoveredAction] = useState(null);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle
          tag="span"
          className="settings"
          style={{
            height: "30px",
            minHeight: "30px",
            borderRadius: "6px",
            padding: "8px 16px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#fff",
            color: "#1e293b",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "none",
          }}
        >
          <FaCog style={{ marginRight: "0" }} />
          <FaCaretDown style={{ fontSize: "12px" }} />
        </DropdownToggle>
        <DropdownMenu
          className="custom-dropdown-menu"
          style={{
            minWidth: "180px",
            borderRadius: "13px",
            padding: "6px 0",
            overflow: "hidden",
          }}
        >
          {canEditUser && (
            <DropdownItem
              onClick={() => editUser(row.id)}
              onMouseEnter={() => setHoveredAction("edit")}
              onMouseLeave={() => setHoveredAction(null)}
              className="custom-dropdown-option"
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                backgroundColor: hoveredAction === "edit" ? "#e53e3e" : "transparent",
                color: hoveredAction === "edit" ? "#fff" : "#64748b",
                fontWeight: hoveredAction === "edit" ? "600" : "500",
              }}
            >
              Edit User
            </DropdownItem>
          )}
          {canDeleteUser && (
            <DropdownItem
              onClick={(e) => showModal(e, row.id)}
              onMouseEnter={() => setHoveredAction("delete")}
              onMouseLeave={() => setHoveredAction(null)}
              className="custom-dropdown-option"
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                backgroundColor: hoveredAction === "delete" ? "#e53e3e" : "transparent",
                color: hoveredAction === "delete" ? "#fff" : "#64748b",
                fontWeight: hoveredAction === "delete" ? "600" : "500",
              }}
            >
              Delete User
            </DropdownItem>
          )}
          {!canEditUser && !canDeleteUser && (
            <DropdownItem
              disabled
              className="custom-dropdown-option"
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                color: "#94a3b8",
                fontWeight: "500",
              }}
            >
              No Actions Available
            </DropdownItem>
          )}
        </DropdownMenu>
      </Dropdown>
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
      Email: item.email,
      Name: item.fullName,
      "Role Type": getRoleNameText(item),
      "Date Created": item.createdAt
        ? new Date(item.createdAt).toLocaleDateString()
        : "N/A",
      "Last Login": item.lastlogin,
      Status: getStatusText(item.status),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "users_export.xlsx");
  };

  return (
    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete User?"
          message="Only the db admin can undo this if you delete it!!!"
          name="DELETE"
          callback={modalCallback}
        />
      )}

      <UserModal
        isOpen={userModalOpen}
        toggle={toggleuserModal}
        user={selectedUser}
        callback={handleUserSave}
      />

      {creative === null && canViewUser && (
        <>
          <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <div className="campaign-daily-title" style={{ fontFamily: '"Open Sans", Arial, sans-serif', }} >
                <h2>Users List</h2>
              </div>
            </div>
          </div>

          <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
              <CardBody className="py-3" style={{ overflow: "visible" }}>
                <div className="d-flex align-items-center flex-wrap gap-2">
                   <div className="position-relative" style={{ minWidth: '180px' }}>
              <Input
                className="form-control py-1 px-1 custom-select-input"
                type="text"
                id="seaching"
                placeholder="Search by name or email"
                style={{ fontSize: "0.685rem", height: '30px ', fontFamily: '"Open Sans", Arial, sans-serif' }}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="d-flex align-items-center" style={{ gap: '8px'}}>
              <input
                type="checkbox"
                id="archivedCheckbox"
                className="form-check-input"
                onChange={(e) => {
                  if (e.target.checked) {
                    setStatusType("3");
                  } else if (statusType === "3") {
                    setStatusType("1");
                  }
                }}
              />
              <label
                htmlFor="archivedCheckbox"
                className="mb-0"
                style={{ fontSize: "11px" }}
              >
                Show Archived
              </label>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="cdi-icon-btn"
              style={{ padding: '4px 12px', fontSize: '11px', height: '30px' }}
            >
              <i className="fa fa-repeat me-1"></i>Refresh
            </button>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <div className="cd-pagination-summary" style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {filteredData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
              </div>
              <div className="cd-pagination-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
           
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
                style={{ width: '32px',height: '32px', borderRadius: '50%',border: 'none', backgroundColor: '#dc2626',color: 'white',display: 'flex', alignItems: 'center', justifyContent: 'center',fontSize: '14px', fontWeight: '500',cursor: 'default',}}>
                {currentPage}
              </button>
              <span className="cd-pagination-separators">of</span>
              <button className="cd-pagination-page-btn" type="button" style={{ width: '32px',  height: '32px',  borderRadius: '50%',  border: '1px solid #e2e8f0',  backgroundColor: '#fff',  color: '#64748b',  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '500',  cursor: 'default', }}  >
                {totalPages}
              </button>
              <button  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}  disabled={currentPage >= totalPages}  className="cd-pagination-nav-btn"  type="button"  style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}>
                <FaChevronRight className="classicon" />
              </button>
              <div className="campaign-select-wrapper1" ref={perPageRef}>
                <div className="campaign-select-wrapper">
                  <input
                    readOnly
                    value={`${perPage} per page`}
                    className="campaign-select-input"
                  id="perPageSelect"
                    onClick={() => {
                      setHoveredPerPage(null);
                      setIsPerPageOpen((open) => !open);
                    }}
                  />
                  <FaChevronDown
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: `translateY(-50%) ${isPerPageOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                      fontSize: '12px',
                      color: '#64748b',
                      pointerEvents: 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </div>
                {isPerPageOpen &&
                  typeof document !== 'undefined' &&
                  createPortal(
                    <div
                      ref={perPagePortalRef}
                      className="custom-dropdown-menu "
                      style={{
                        position: 'absolute',
                        top: `${perPageDropdownPosition.top}px`,
                        left: `${perPageDropdownPosition.left}px`,
                        zIndex: 9999,
                        minWidth: '130px',
                        pointerEvents: 'auto',
                        maxWidth: '150px',
                        maxHeight: '300px',
                        borderRadius: '13px',
                      }}
                    >
                      {[10, 20, 25, 50, 100].map((value) => {
                        const isSelected = perPage === value;
                        const isHovered = hoveredPerPage === value;

                        return (
                          <div
                            key={value}
                            onClick={() => {
                              setPerPage(value);
                              setCurrentPage(1);
                              setHoveredPerPage(null);
                              setIsPerPageOpen(false);
                            }}
                            onMouseEnter={() => setHoveredPerPage(value)}
                            onMouseLeave={() => setHoveredPerPage(null)}
                            className={`custom-dropdown-option ${isSelected ? 'selected' : ''}`}
                            style={{
                              height: '40px',
                              cursor: 'pointer',
                              pointerEvents: 'auto',
                              backgroundColor: (isSelected || isHovered) ? '#e53e3e' : 'transparent',
                            }}
                          >
                            <span
                              className="tick-icon"
                              style={{
                                marginRight: '12px',
                                color: (isSelected || isHovered) ? '#ffffff' : 'transparent',
                                fontSize: '18px',
                                minWidth: '20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {(isSelected || isHovered) && "\u2713"}
                            </span>
                            <span style={{ color: (isSelected || isHovered) ? '#ffffff' : '#64748b', fontWeight: (isSelected || isHovered) ? '600' : '500' }}>
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
            {/* )} */}
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
                onClick={toggleuserModal}
                id="newaudience"
                style={{ padding: '4px 12px', fontSize: '11px', backgroundColor: '#0ea5e9', color: 'white', borderColor: '#0ea5e9', height: '30px' }}
              >
                New User
              </button>
            )}
          </div>
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
          <strong>Access Denied:</strong> You do not have permission to view the Users List.
        </div>
      )}
    </div>
  );
};

export default UsersList;
