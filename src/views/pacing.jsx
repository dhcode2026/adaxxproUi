import React, { useState, useEffect, useMemo, Fragment, useRef } from "react";
import {
  Button,
  Card,
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
import UserModal from "./Modal/UserModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretDown, FaCog } from "react-icons/fa";
import DataTable from "react-data-table-component";
import {
  getUserlist,
  upadtestatusConversion,
  editConversion,
} from "../views/api/Api";
import PacingCustomizationModal from "./Modal/PacingCustomizationModal";
import Campaigns from "./Campaigns.jsx";
import PacingChart from "./PacingChart.jsx";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalTabs } from "../context/TabContext";
import { statusOptions,spendOptions } from "../Utils.js";

const getStatusText = (code) => {
  const statusMap = {
    1: "Active",
    2: "Inactive",
    3: "Archived",
    1: "Active",
    2: "Inactive",
    3: "Archived",
  };
  return statusMap[code] || code;
};

const getStatusCode = (text) => {
  const statusMap = {
    Active: 1,
    Inactive: 2,
    Archived: 3,
  };
  return statusMap[text] || text;
};

const PacingList = (props) => {
  const location = useLocation();
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const toggleuserModal = () => setUserModalOpen(!userModalOpen);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [pacingcustomizationModal, setPacingCustomizationModalOpen] =
    useState(false);
  const togglePacingCustomizationModal = () =>
    setPacingCustomizationModalOpen(!pacingcustomizationModal);
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Pacing", icon: "tim-icons icon-user-run" },
    { label: "Campaigns", icon: "icon-world" },
  ];

  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => {
    setCount(count + 1);
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
        fetchUsersList();
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
  const navigate = useNavigate();
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
    firstName,
    lastName,
  } = useGlobalTabs();

  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [statusType, setStatusType] = useState("2"); // default = All but archived

   const [openSpendDropdown, setOpenSpendDropdown] = useState(false);
  const [spendType, setSpendType] = useState("3"); // default = All but archived

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenStatusDropdown(false);
        setOpenSpendDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentUsername = localStorage.getItem("username") || "";
  useEffect(() => {
    initializePageTab("Pacing", "tim-icons icon-user-run", "/admin/PacingList");
  }, [initializePageTab]);
  useEffect(() => {
    const displayName =
      firstName || lastName
        ? `${firstName || ""} ${lastName || ""}`.trim()
        : localStorage.getItem("username") ||
          localStorage.getItem("email") ||
          "";

    updateTab("default", {
      header: (
        <>
          <i className="tim-icons icon-user-run me-2 me-2"></i>
          Pacing - <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);

  const handleAddTab = () => {
    addTab({
      route: location.pathname,
      state: location.state,
      header: (
        <>
          <i className="tim-icons icon-user-run me-2"></i>
          Pacing -{" "}
          <i>
            {firstName || lastName
              ? `${firstName || ""} ${lastName || ""}`.trim()
              : localStorage.getItem("username") ||
                localStorage.getItem("email") ||
                ""}
          </i>
        </>
      ),
    });
  };

  const handleApplyAll = () => {
    console.log("Applied all ranges:", { startDate, endDate });
    setShowCalendar(false);
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
          today.getDate() - 1,
        );
        break;
      case "2 Days Ago":
        start = end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 2,
        );
        break;
      case "Last 7 Days":
        end = today;
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6,
        );
        break;
      case "Last 30 Days":
        end = today;
        start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 29,
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
        options,
      )} - ${endDate.toLocaleDateString(undefined, options)}`;
    } else if (startDate) {
      return startDate.toLocaleDateString();
    } else {
      return "";
    }
  };

  const editUser = async (id) => {
    console.log("Editing user ID:", id);
    try {
      const response = await editConversion(id);
      console.log("Full API Response for edit:", response);
      let userData = null;
      if (response.data?.data?.informationManagerUsers?.[0]) {
        userData = response.data.data.informationManagerUsers[0];
      } else if (response.data?.informationManagerUsers?.[0]) {
        userData = response.data.informationManagerUsers[0];
      } else if (response.data?.data) {
        userData = response.data.data;
      } else if (response.data) {
        userData = response.data;
      }
      console.log("Extracted user data:", userData);
      if (userData) {
        const formattedUser = {
          id: userData.manageUsersId || userData.id || id,
          manageUsersId: userData.manageUsersId || userData.id || id,
          email: userData.email || "",
          firstName: userData.firstName || userData.first_name || "",
          lastName: userData.lastName || userData.last_name || "",
          fullName:
            userData.fullName ||
            `${userData.firstName || userData.first_name || ""} ${userData.lastName || userData.last_name || ""}`.trim() ||
            "Unnamed User",
          user_access:
            userData.user_access || userData.user_access || "Read & Write",
          status: userData.status || 1,
          administrative: userData.administrative || false,
          addfunds: userData.addfunds || false,
          assignaddfunds: userData.assignaddfunds || false,
          createdAt: userData.createdAt || userData.created_at || "",
          updatedAt: userData.updatedAt || userData.updated_at || "",
          permissions: userData.administrative ? "Administrative" : "Standard",
          originalData: userData,
        };

        console.log("Setting user to modal:", formattedUser);
        setSelectedUser(formattedUser);
        setUserModalOpen(true);
      } else {
        console.error("No user data found in response");
        alert("No user data found");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      alert(`Error: ${err.message || "Failed to fetch user data"}`);
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

  const fetchUsersList = async () => {
    setLoading(true);
    try {
      const res = await getUserlist();
      console.log("Full API Response for list:", res);
      console.log("Response data:", res?.data);
      console.log("Response data.data:", res?.data?.data);
      const list =
        res?.data?.informationManagerUsers ||
        res?.data?.data?.informationManagerUsers ||
        [];
      console.log("Raw list data:", list);

      const formatted = list.map((item) => ({
        id: item.manageUsersId || item.id,
        manageUsersId: item.manageUsersId || item.id,
        email: item.email || "No email",
        firstName: item.first_name || "",
        lastName: item.last_name || "",
        fullName:
          `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
          "Unnamed User",
        user_access: item.user_access || "all_brands",
        status: item.status || 1,
        administrative: item.administrative || false,
        addfunds: item.addfunds || false,
        assignaddfunds: item.assignaddfunds || false,
        createdAt: item.createdAt || "",
        updatedAt: item.updatedAt || "",
        permissions: item.administrative ? "Administrative" : "Standard",
        lastlogin: item.lastlogin || "22/01/2026",
        originalData: item,
      }));
      console.log("Formatted data:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    //fetchUsersList();
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
      <div className="py-4  text-secondary">
        <br />
        <br />
        <br />
        No data Found
      </div>
    </div>
  );

  const customStyles = {
    table: {
      style: {
        backgroundColor: "#f8f9fa",
        height: "100%",
      },
    },
    headRow: {
      style: {
         borderTop: "1px solid #d4d4d4",
      },
    },
    headCells: {
      style: {
        borderRight: "1px solid #d4d4d4",
       
        "&:first-of-type": {
          paddingLeft: "16px",
        },
        "&:last-of-type": {
          borderRight: "none",
        },
      },
    },
    cells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
        "&:first-of-type": {
          paddingLeft: "16px",
        },
      },
    },
    rows: {
      style: {},
    },
  };

  // Cell Components
  const IDCell = ({ row }) => {
    return <div className="gOorhn">{row.manageUsersId}</div>;
  };

  const EmailCell = ({ row }) => {
    return <div className="gOorhn">{row.email}</div>;
  };

  const NameCell = ({ row }) => {
    return <div className="gOorhn">{row.fullName}</div>;
  };

  const PermissionsCell = ({ row }) => {
    return <div className="gOorhn">{row.permissions}</div>;
  };
  const LastloginCell = ({ row }) => {
    return <div className="gOorhn">{row.lastlogin}</div>;
  };

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
  const UserAccessCell = ({ row }) => {
    return <div className="gOorhn">{row.user_access || "All Brands"}</div>;
  };

  const columns = [
    {
      name: "Actions",
      cell: (row) => <UserActionsCell row={row} />,
      grow: 1,
      width: "100px",
    },
    {
      name: "GroupID",
      selector: (row) => row.email,
      cell: (row) => <EmailCell row={row} />,
      sortable: true,
      grow: 2,
      width: "310px",
    },
    {
      name: "Name",
      selector: (row) => row.fullName,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
      width: "180px",
    },
    {
      name: "Status",
      selector: (row) => row.permissions,
      cell: (row) => <PermissionsCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
    {
      name: "Days Remaining",
      selector: (row) => row.createdAt,
      cell: (row) => <DateCreatedCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
    {
      name: "Start Date   ",
      selector: (row) => row.user_access,
      cell: (row) => <UserAccessCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
    {
      name: "End Date",
      selector: (row) => row.lastlogin,
      cell: (row) => <LastloginCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
    {
      name: "OSI %",
      selector: (row) => row.lastlogin,
      cell: (row) => <LastloginCell row={row} />,
      sortable: true,
      grow: 2,
      width: "150px",
    },
  ];

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: "#59823a !important",
        "& .gOorhn": {
          color: "white !important",
        },
      },
    },
  ];

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const filteredData = useMemo(() => {
    return rowData.filter(
      (item) =>
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.firstName + " " + item.lastName)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
  }, [rowData, searchTerm]);

  const UserActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => editUser(row.id)}>
            Edit User
          </DropdownItem>
          <DropdownItem onClick={(e) => showModal(e, row.id)}>
            Delete User
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const UserStatusCell = ({ row }) => {
    const [currentStatus, setCurrentStatus] = useState(
      getStatusText(row.status || "Active"),
    );
    const [statusOpen, setStatusOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      if (row.status) {
        setCurrentStatus(getStatusText(row.status));
      }
    }, [row.status]);

    const toggleStatus = () => {
      if (!updating) {
        setStatusOpen(!statusOpen);
      }
    };

    const handleStatusChange = async (newStatusText) => {
      if (currentStatus === newStatusText || updating) return;
      setUpdating(true);
      try {
        console.log(
          `Updating user ${row.manageUsersId} status to ${newStatusText}`,
        );
        const statusCode = getStatusCode(newStatusText);
        const response = await upadtestatusConversion(
          row.manageUsersId,
          statusCode,
        );

        if (response.data?.success || response.status === 200) {
          setCurrentStatus(newStatusText);
          setRowData((prevData) =>
            prevData.map((item) =>
              item.manageUsersId === row.manageUsersId
                ? {
                    ...item,
                    status: statusCode,
                  }
                : item,
            ),
          );
          console.log("Status updated successfully");
        } else {
          console.error("Failed to update status:", response.data?.message);
          alert(
            `Failed to update status: ${response.data?.message || "Unknown error"}`,
          );
        }
      } catch (err) {
        console.error("Error updating status:", err);
        alert(`Error updating status: ${err.message || err}`);
      } finally {
        setUpdating(false);
        setStatusOpen(false);
      }
    };

    return (
      <Dropdown
        isOpen={statusOpen}
        toggle={toggleStatus}
        disabled={updating}
        className="vickey"
      >
        <DropdownToggle
          tag="span"
          className="onoffbutton"
          style={{
            position: "relative",
            opacity: updating ? 0.7 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {updating ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
            </>
          ) : (
            <>
              {currentStatus}
              <FaCaretDown style={{ marginLeft: "5px" }} />
            </>
          )}
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem
            onClick={() => handleStatusChange("Active")}
            active={currentStatus === "Active"}
            disabled={updating}
          >
            <span className="userstatus">Active</span>
          </DropdownItem>
          <DropdownItem
            onClick={() => handleStatusChange("Inactive")}
            active={currentStatus === "Inactive"}
            disabled={updating}
          >
            <span className="userstatus">Inactive</span>
          </DropdownItem>
          <DropdownItem
            onClick={() => handleStatusChange("Archived")}
            active={currentStatus === "Archived"}
            disabled={updating}
          >
            <span className="userstatus"> Archived</span>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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

  return (
    <div className="content1">
      <div class="content-wrapper">
        {modal && (
          <DecisionModal
            title="Really delete User?"
            message="Only the db admin can undo this if you delete it!!!"
            name="DELETE"
            callback={modalCallback}
          />
        )}
        {creative === null && (
          <Tabs onAdd={handleAddTab} onRemove={removeTab}>
            {tabsList.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                header={tab.header}
                route={tab.route}
                state={tab.state}
              >
                <Row className="m-0">
                  <Col xs="12" className="p-0">
                    <div className="row m-0">
                      <div className="col-xl-12 col-lg-12">
                        <Row className="inventory-row m-0 p-0">
                          <Col xs="12" className="m-0 p-0">
                            {/* Original Pacing header removed since we use Tabs now */}
                          </Col>
                        </Row>
                        <Row className="align-items-center m-0 mt-2">
                          <Col md="2" className="p-0 ms-2 mt-2" id="maximing">
                            <div className="position-relative ms-2">
                              <Input
                                className="form-control py-1 px-1 mb-2 rounded-0 adsheight custom-select-input"
                                type="text"
                                id="seaching"
                                placeholder="Search by name or email"
                                style={{ fontSize: "0.685rem" }}
                                value={searchTerm}
                                onChange={handleSearchChange}
                              />
                            </div>
                          </Col>

                          <Col md="1" className="p-0 ms-2 mt-2" id="maximing">
                            <div
                              ref={dropdownRef}
                              className="position-relative dropdown-width"
                            >
                              {/* Input box */}
                              <div
                                className="form-control py-1 px-1 mb-2 rounded-0 adsheight normalized-input custom-select-input d-flex justify-content-between align-items-center cursor-pointer"
                                onClick={() =>
                                  setOpenStatusDropdown(!openStatusDropdown)
                                }
                                tabIndex={0}
                              >
                                <span>
                                  {
                                    statusOptions.find(
                                      (opt) => opt.value === statusType,
                                    )?.label
                                  }
                                </span>

                                <FaCaretDown
                                  className={`custom-select-icon ${openStatusDropdown ? "open" : ""}`}
                                />
                              </div>

                              {/* Dropdown list */}
                              {openStatusDropdown && (
                                <div className="custom-dropdown-menu w-100">
                                  {statusOptions.map((opt, idx) => (
                                    <div
                                      key={idx}
                                      className={`custom-dropdown-option ${
                                        statusType === opt.value
                                          ? "selected"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        setStatusType(opt.value);
                                        setOpenStatusDropdown(false);
                                      }}
                                    >
                                      <span className="tick-icon">
                                        {statusType === opt.value && "✓"}
                                      </span>
                                      <span>{opt.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Col>

                          <Col md="1" className="p-0 ms-2 mt-2" id="maximing">
                            <div
                              ref={dropdownRef}
                              className="position-relative dropdown-width"
                            >
                              {/* Input box */}
                              <div
                                className="form-control py-1 px-1 mb-2 rounded-0 adsheight normalized-input custom-select-input d-flex justify-content-between align-items-center cursor-pointer"
                                onClick={() =>
                                  setOpenSpendDropdown(!openSpendDropdown)
                                }
                                tabIndex={0}
                              >
                                <span>
                                  {
                                    spendOptions.find(
                                      (opt) => opt.value === spendType,
                                    )?.label
                                  }
                                </span>

                                <FaCaretDown
                                  className={`custom-select-icon ${openSpendDropdown ? "open" : ""}`}
                                />
                              </div>

                              {/* Dropdown list */}
                              {openSpendDropdown && (
                                <div className="custom-dropdown-menu w-100">
                                  {spendOptions.map((opt, idx) => (
                                    <div
                                      key={idx}
                                      className={`custom-dropdown-option ${
                                        spendType === opt.value
                                          ? "selected"
                                          : ""
                                      }`}
                                      onClick={() => {
                                        setSpendType(opt.value);
                                        setOpenSpendDropdown(false);
                                      }}
                                    >
                                      <span className="tick-icon">
                                        {spendType === opt.value && "✓"}
                                      </span>
                                      <span>{opt.label}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Col>

                          <Col md="1" className="position-relative">
                            <div className="date-input-wrapper">
                              <FaCalendarAlt className="calendar-icon" />
                              <input
                                type="text"
                                value={startDate ? formatDateRange() : "Today"}
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
                                    {[
                                      "Today",
                                      "Yesterday",
                                      "2 Days Ago",
                                      "Last 7 Days",
                                      "Last 30 Days",
                                    ].map((label) => (
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
                                      className="mb-2 rounded-0 apply-btn"
                                      onClick={handleApply}
                                    >
                                      Apply
                                    </Button>
                                    <Button
                                      color="success"
                                      size="sm"
                                      className="rounded-0 apply-btn"
                                      onClick={handleApplyAll}
                                    >
                                      Apply All
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </Col>

                          <Col
                            xs="auto"
                            className="d-flex align-items-center ml-90"
                          >
                            <input
                              type="checkbox"
                              id="archivedCheckbox"
                              className="form-check-input"
                            />
                            <label
                              htmlFor="archivedCheckbox"
                              className="ms-2 mb-0 mt-2"
                              style={{ fontSize: "11px" }}
                            >
                              Show Archived
                            </label>
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
                          <Col md="3" className="custom-width"></Col>
                          <Col xs="auto">
                            <Button
                              type="btn"
                              className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                              id="export"
                            >
                              <span className="lasttime">Export</span>
                            </Button>
                          </Col>
                          <Col xs="auto" className="me-3 p-0">
                            <Button
                              type="btn"
                              className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                              id="export"
                              onClick={togglePacingCustomizationModal}
                            >
                              <span className="lasttime">
                                Customization Columns
                              </span>
                            </Button>
                          </Col>
                        </Row>

                        <PacingCustomizationModal
                          isOpen={pacingcustomizationModal}
                          toggle={togglePacingCustomizationModal}
                        />
                      </div>
                    </div>

                    <div className="flex-grow-1 table-container">
                      <DataTable
                        className="pacingdatable"
                        columns={columns}
                        data={filteredData}
                        progressPending={loading}
                        progressComponent={<CustomLoader />}
                        striped
                        dense
                        fixedHeader
                        fixedHeaderScrollHeight="80vh"
                        highlightOnHover
                        persistTableHead
                        conditionalRowStyles={conditionalRowStyles}
                        customStyles={{
                          ...customStyles,
                          tableWrapper: {
                            style: {
                              overflowY: "auto",
                            },
                          },
                        }}
                        noDataComponent={<NoDataComponent />}
                        onRowClicked={handleRowClicked}
                      />
                    </div>
                  </Col>

                  <Col xs="12" className="p-0">
                    <Fragment>
                      <div className="panel_Container brandpanel">
                        <div className="brandlist">
                          <Row
                            className="inventory-row align-items-center border mt-2 py-2 px-3"
                            id="subtable"
                          >
                            <Col
                              xs="12"
                              md="2"
                              className="d-flex align-items-center"
                            >
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
                                    className={`tab-step d-flex align-items-center mx-2 px-2 py-1 ${
                                      isActive ? "active" : ""
                                    }`}
                                  >
                                    <i
                                      className={`tim-icons ${item.icon} me-2 ${
                                        isActive ? "" : "text-muted"
                                      }`}
                                      style={
                                        isActive
                                          ? { color: "#3a3d40", opacity: 1 }
                                          : {}
                                      }
                                    />
                                    <span
                                      className={`fw-semibold ${
                                        isActive ? "" : "text-muted"
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
                      {step === 0 && <PacingChart />}
                      {step === 1 && <Campaigns />}
                    </Fragment>
                  </Col>
                </Row>
              </Tab>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default PacingList;
