import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
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
  CardBody
} from "reactstrap";
import { useViewContext } from "../ViewContext";
import { useGlobalTabs } from "../context/TabContext";
import DecisionModal from "../DecisionModal";
import ConversionModal from "./Modal/ConversionModal";
import ConversionGetCodeModal from "./Modal/ConversionGetCodeModal";
import DatePicker from "react-datepicker";
import { FaCalendarAlt, FaCaretUp, FaCaretDown, FaCog, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSync, faDownload, faFilter, faColumns, faChevronRight, faChevronDown, faTimes, faPlus, faSearch, faCheck, faList, faDatabase } from "@fortawesome/free-solid-svg-icons";
import Tabs from "../components/Tab/Tabs"
import Tab from "../components/Tab/Tab";
import DataTable from "react-data-table-component";
import { getConversionlist, upadtestatusConversion, editConversion, getconversionByDateRange, getConversionStatus } from "../views/api/Api";
import { editConversionbrand } from "../views/api/Api";
import { useParams, useLocation } from "react-router-dom";
import { canCreate, canEdit, canDelete, canView, canUpdate, canApprove } from "../utils/permissionHelper";
import ConversionEventModal from "./Modal/ConversionEventModal"
import ConversionMacrosModal from "./Modal/ConversionMacrosModal";

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

const getStatusCode = (text) => {
  const statusMap = {
    "On": 1,
    "Off": 2,
    "Archived": 3
  };
  return statusMap[text] || text;
};

const getApiRangeValue = (label) => {
  const rangeMap = {
    "Today": "TODAY",
    "Yesterday": "YESTERDAY",
    "2 Days Ago": "LAST_2_DAYS",
    "Last 7 Days": "LAST_7_DAYS",
    "Last 30 Days": "LAST_30_DAYS"
  };
  return rangeMap[label] || label;
};

const Conversion = (props) => {
  const { brandId } = useParams();
  const location = useLocation();
  const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab } = useGlobalTabs();
  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const toggleConversionModal = () => setConversionModalOpen(!conversionModalOpen);

  const [conversionEventModalOpen, setConversionEventModalOpen] = useState(false);
  const toggleConversionEventModal = () => {
    if (!conversionEventModalOpen) {
      setSelectedConversion(null);
    }
    setConversionEventModalOpen(!conversionEventModalOpen);
  };

  const [conversionMacrosModalOpen, setConversionMacrosModalOpen] = useState(false);
  const toggleConversionMacrosModal = () => {
    if (!conversionMacrosModalOpen) {
      setSelectedConversion(null);
    }
    setConversionMacrosModalOpen(!conversionMacrosModalOpen);
  };

  const [selectedConversion, setSelectedConversion] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [currentBrandId, setCurrentBrandId] = useState(brandId || location.state?.brandId || null);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const datePickerRef = useRef(null);
  const [showArchived, setShowArchived] = useState(false);
  const [currentBrandName, setCurrentBrandName] = useState(location.state?.brandName || localStorage.getItem('currentBrandName') || "");
  const [ConversionCodepopOpen, setConversionCodepopOpen] = useState(false);
  const [selectedConversionForCode, setSelectedConversionForCode] = useState(null);
  const [codePidValue, setCodePidValue] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const [canApproveUser, setCanApproveUser] = useState(false);
  const [canViewConversion, setCanViewConversion] = useState(false);
  useEffect(() => {
    initializePageTab("Conversions", "fa fa-id-card-o", "/admin/conversions");
    const hasCreatePermission = canCreate("Conversion");
    const hasViewPermission = canView("Conversion");
    const hasEditPermission = canEdit("Conversion");
    const hasDeletePermission = canDelete("Conversion");
    const hasUpdatePermission = canUpdate("Conversion");
    const hasApprovePermission = canApprove("Conversion");
    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
    setCanApproveUser(hasApprovePermission);
    setCanViewConversion(hasViewPermission);
  }, []);
  const redraw = () => {
    setCount(count + 1);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    try {
      await delay(1000);
      if (showArchived) {
        await fetchArchivedConversion();
      } else if (appliedDateRange) {
        await fetchconversionListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.label
        );
      } else {
        await fetchConversionList();
      }
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const toggleCalendar = () => setShowCalendar((prev) => !prev);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const perPagePortalRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const [hoveredPerPage, setHoveredPerPage] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const toggleConversionCodepop = () => {
    if (ConversionCodepopOpen) {
      setConversionCodepopOpen(false);
      setSelectedConversionForCode(null);
      setCodePidValue("");
    }
  };

  const openCodeModal = async (row) => {
    setLoadingCode(true);
    setConversionCodepopOpen(true);
    setSelectedConversionForCode(row);

    try {
      const response = await editConversion(row.id);

      const conversionDetail =
        response?.data?.data?.informationConversion?.[0] || {};

      const conversionWithDetails = {
        ...row, labelValue:
          conversionDetail.labelValue ||
          row.labelValue ||
          "",

        pid:
          conversionDetail.pid ||
          "",

        conversionId:
          conversionDetail.conversionId ||
          row.conversionId ||
          row.id,

        securityToken:
          conversionDetail.securityToken ||
          row.securityToken ||
          ""
      };

      setCodePidValue(conversionWithDetails.pid);
      setSelectedConversionForCode(conversionWithDetails);

    } catch (err) {
      console.error("Error fetching conversion code:", err);
      alert(
        `Failed to fetch conversion code: ${err.message || "Unknown error"
        }`
      );
      setCodePidValue("");
    } finally {
      setLoadingCode(false);
    }
  };



  useEffect(() => {
    const bId = brandId || location.state?.brandId;
    const bName = location.state?.brandName;

    if (bId && bId != currentBrandId) {
      setCurrentBrandId(bId);
      localStorage.setItem('currentBrandId', bId);
    }

    if (bName && bName !== currentBrandName) {
      setCurrentBrandName(bName);
      localStorage.setItem('currentBrandName', bName);
    } else if (currentBrandId && !currentBrandName) {
      const storedBrands = JSON.parse(localStorage.getItem('brands') || sessionStorage.getItem('brands') || '[]');
      const brand = storedBrands.find(b => b.id == currentBrandId);
      if (brand) {
        setCurrentBrandName(brand.name);
        localStorage.setItem('currentBrandName', brand.name);
      }
    }
  }, [brandId, location.state?.brandId, location.state?.brandName, currentBrandId, currentBrandName]);

  useEffect(() => {
    const pageTitle = currentBrandName ? `Conversion - ${currentBrandName}` : "Conversion";
    if (!location.state?.isTabView) {
      initializePageTab(pageTitle, "fa fa-id-card-o", location.pathname, null, location.state);
    }
  }, [currentBrandName, initializePageTab, location.pathname, location.state?.brandId, location.state?.isTabView]);

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
    if (appliedDateRange?.label) return appliedDateRange.label;
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
      return "All Dates";
    }
  };

  const editconversion = async (id) => {
    console.log("Editing conversion ID:", id);
    try {
      const response = await editConversion(id);
      let conversionData = null;
      if (response.data?.data?.informationConversion?.[0]) {
        conversionData = response.data.data.informationConversion[0];
      } else if (response.data?.informationConversion?.[0]) {
        conversionData = response.data.informationConversion[0];
      } else if (response.data?.data) {
        conversionData = response.data.data;
      } else if (response.data) {
        conversionData = response.data;
      }

      if (conversionData) {
        const formattedConversion = {
          id: conversionData.conversionId || conversionData.id || id,
          conversionId: conversionData.conversionId || conversionData.id || id,
          name: conversionData.name || "",
          mmType: conversionData.mmType || "",
          pid: conversionData.pid || "",
          notes: conversionData.notes || "",
          defaultValue: conversionData.defaultValue || conversionData.default_value || "0",
          labelValue: conversionData.labelValue || conversionData.label_value || "",
          status: conversionData.status || 1,
          number_of_hits: conversionData.number_of_hits || 0,
          conversion_count: conversionData.conversion_count || 0,
          brandId: conversionData.brandId || currentBrandId,
          pid: conversionData.pid || conversionData.code || "",
          ...conversionData
        };
        setSelectedConversion(formattedConversion);
        setConversionModalOpen(true);
      } else {
        console.error("No conversion data found in response");
        alert("No conversion data found");
      }
    } catch (err) {
      console.error("Error fetching conversion:", err);
      alert(`Error: ${err.message || "Failed to fetch conversion data"}`);
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

  const fetchConversionList = async () => {
    setLoading(true);
    try {
      let list = [];
      if (currentBrandId) {
        const res = await editConversionbrand(currentBrandId);
        if (res.data?.data?.informationConversion) {
          list = res.data.data.informationConversion;
        } else if (res.data?.informationConversion) {
          list = res.data.informationConversion;
        } else if (res.data?.data) {
          list = res.data.data;
        } else {
          list = res.data || [];
        }
      } else {
        const res = await getConversionlist();
        list = res?.data?.data?.informationConversion || [];
      }

      const formatted = list.map((item) => ({
        id: item.conversionId || item.id || item.conversionId,
        conversionId: item.conversionId || item.conversionId || item.conversionId,
        name: item.name || item.name || "Unnamed Conversion",
        mmType: item.mmType || item.mmType || "",
        pid: item.pid || item.mmType || "",
        status: getStatusText(item.status || 1),
        number_of_hits: item.number_of_hits || item.number_of_hits || "0",
        defaultValue: item.defaultValue || item.defaultValue || "0",
        conversion_count: item.conversion_count || item.conversion_count || "-",
        labelValue: item.labelValue || item.label_value || "",
        originalData: item
      }));

      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching exchanges:", err);
      if (currentBrandId) {
        try {
          const res = await getConversionlist();
          const list = res?.data?.data?.informationConversion || [];
          const filteredList = currentBrandId
            ? list.filter(item => item.brandId == currentBrandId || item.brandId == brandId)
            : list;
          const formatted = filteredList.map((item) => ({
            id: item.conversionId || item.id || item.conversionId,
            conversionId: item.conversionId || item.conversionId || item.conversionId,
            name: item.name || item.name || "Unnamed Conversion",
            mmType: item.mmType || item.mmType || "",
            pid: item.mmType || "",
            status: getStatusText(item.status || 1),
            number_of_hits: item.number_of_hits || item.number_of_hits || "0",
            defaultValue: item.defaultValue || item.defaultValue || "0",
            conversion_count: item.conversion_count || item.conversion_count || "-",
            labelValue: item.labelValue || item.label_value || "",
            brandId: item.brandId || currentBrandId,
            originalData: item
          }));

          setRowData(formatted);
        } catch (fallbackErr) {
          console.error("Fallback API call also failed:", fallbackErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversionList();
  }, [currentBrandId]);

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nodataavilable">
      <div className="py-4 text-secondary">
        {"No data available"}
      </div>
    </div>
  );



  const IDCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.conversionId}
      </div>
    );
  };

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.mmType}
      </div>
    );
  };

  const DefaultValueCell = ({ row }) => {
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
        {formatCurrency(row.defaultValue)}
      </div>
    );
  };

  const NumberCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.pid}
      </div>
    );
  };

  const CreateEventCell = ({ row }) => {
    const handleCreateEventClick = (e) => {
      e.stopPropagation();
      console.log('Opening event modal for row:', row);
      setSelectedConversion(row);
      setConversionEventModalOpen(true);
    };

    return (
      <button
        className="btn btn-sm btn-primary rounded-0"
        onClick={handleCreateEventClick}
        style={{
          fontSize: '11px',
          padding: '4px 12px',
          backgroundColor: '#e53e3e ',
          borderColor: '#e53e3e '
        }}
      >
        View Event
      </button>
    );
  };

  const CreateMacroCell = ({ row }) => {
    const handleCreateMacroClick = (e) => {
      e.stopPropagation();
      console.log('Opening macro modal for row:', row);
      setSelectedConversion(row);
      setConversionMacrosModalOpen(true);
    };

    return (
      <button
        className="btn btn-sm btn-primary rounded-0"
        onClick={handleCreateMacroClick}
        style={{
          fontSize: '11px',
          padding: '4px 12px',
          backgroundColor: '#e53e3e ',
          borderColor: '#e53e3e '
        }}
      >
        View Macro
      </button>
    );
  };

  const ConversionActionsCell = ({ row, canEdit: canEditPerm }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [hoveredAction, setHoveredAction] = useState(null);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    if (!canEditPerm) {
      return (
        <div title="No edit permission" style={{ opacity: 0.5 }}>
          <FaCog style={{ marginRight: "5px", cursor: "not-allowed" }} />
        </div>
      );
    }

    return (
      <div onClick={(e) => e.stopPropagation()}>
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
              minWidth: "160px",
              borderRadius: "13px",
              padding: "6px 0",
              overflow: "hidden",
            }}
          >
            <DropdownItem
              onClick={() => editconversion(row.id)}
              disabled={!canEditPerm}
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
              Edit List
            </DropdownItem>
            <DropdownItem
              onClick={() => openCodeModal(row)}
              disabled={!canEditPerm}
              onMouseEnter={() => setHoveredAction("code")}
              onMouseLeave={() => setHoveredAction(null)}
              className="custom-dropdown-option"
              style={{
                height: "40px",
                display: "flex",
                alignItems: "center",
                backgroundColor: hoveredAction === "code" ? "#e53e3e" : "transparent",
                color: hoveredAction === "code" ? "#fff" : "#64748b",
                fontWeight: hoveredAction === "code" ? "600" : "500",
              }}
            >
              Get Code
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  };

  const ActionStatusCell = ({ row, canApprove: canApprovePerm }) => {
    const [currentStatus, setCurrentStatus] = useState(getStatusText(row.status || "On"));
    const [statusOpen, setStatusOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [hoveredStatus, setHoveredStatus] = useState(null);

    useEffect(() => {
      if (row.status) {
        setCurrentStatus(getStatusText(row.status));
      }
    }, [row.status]);

    const toggleStatus = () => {
      if (!updating && canApprovePerm) {
        setStatusOpen(!statusOpen);
      }
    };

    const handleStatusChange = async (newStatusText) => {
      if (currentStatus === newStatusText || updating) return;
      setUpdating(true);
      try {
        const statusCode = getStatusCode(newStatusText);
        const response = await upadtestatusConversion(row.conversionId, statusCode);

        if (response.data?.success || response.status === 200) {
          setCurrentStatus(newStatusText);
          setRowData(prevData =>
            prevData.map(item =>
              item.conversionId === row.conversionId ? {
                ...item,
                status: newStatusText
              } : item
            )
          );
          await refresh();
        } else {
          alert(`Failed to update status: ${response.data?.message || "Unknown error"}`);
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
      <div onClick={(e) => e.stopPropagation()}>
        {canApproveUser && (
          <Dropdown isOpen={statusOpen} toggle={toggleStatus} disabled={updating || !canApprovePerm} className="vickey">
            <DropdownToggle
              tag="span"
              className="onoffbutton"
              style={{
                position: "relative",
                opacity: currentStatus === "Archived" ? 0.4 : (updating ? 0.7 : (!canApprovePerm ? 0.5 : 1)),
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
                justifyContent: "space-between",
                gap: "6px",
                cursor: canApprovePerm ? "pointer" : "not-allowed",
                boxShadow: "none",
              }}
              title={!canApprovePerm ? "No approval permission" : ""}
            >
              {updating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                </>
              ) : (
                <>
                  {currentStatus}
                  <FaCaretDown style={{ marginLeft: "5px", fontSize: "12px" }} />
                </>
              )}
            </DropdownToggle>
            <DropdownMenu
              className="custom-dropdown-menu"
              style={{
                minWidth: "130px",
                borderRadius: "13px",
                padding: "6px 0",
                overflow: "hidden",
              }}
            >
              <DropdownItem
                onClick={() => handleStatusChange("On")}
                active={currentStatus === "On"}
                disabled={updating || !canApprovePerm}
                onMouseEnter={() => setHoveredStatus("On")}
                onMouseLeave={() => setHoveredStatus(null)}
                className="custom-dropdown-option"
                style={{
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: (currentStatus === "On" || hoveredStatus === "On") ? "#e53e3e" : "transparent",
                  color: (currentStatus === "On" || hoveredStatus === "On") ? "#fff" : "#64748b",
                  fontWeight: (currentStatus === "On" || hoveredStatus === "On") ? "600" : "500",
                }}
              >
                <span className="conversionstatus" style={{ color: "inherit" }}>On</span>
              </DropdownItem>
              <DropdownItem
                onClick={() => handleStatusChange("Off")}
                active={currentStatus === "Off"}
                disabled={updating || !canApprovePerm}
                onMouseEnter={() => setHoveredStatus("Off")}
                onMouseLeave={() => setHoveredStatus(null)}
                className="custom-dropdown-option"
                style={{
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: (currentStatus === "Off" || hoveredStatus === "Off") ? "#e53e3e" : "transparent",
                  color: (currentStatus === "Off" || hoveredStatus === "Off") ? "#fff" : "#64748b",
                  fontWeight: (currentStatus === "Off" || hoveredStatus === "Off") ? "600" : "500",
                }}
              >
                <span className="conversionstatus" style={{ color: "inherit" }}>Off</span>
              </DropdownItem>

            </DropdownMenu>
          </Dropdown>
        )}
        {!canApproveUser && (
          <div className="audiencemenu gOorhn">
            <span>Access Denied</span>
          </div>
        )}
      </div>
    );
  };

  // Updated columns definition
  const columns = [
   
   {
      name: "S.No",
      cell: (row, index) => <div className="gOorhn">{index + 1}</div>,
      sortable: false,
      width: "90px",
    },
    {
      name: "Name",
      selector: (row) => row.mmType,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
      width: "250px"
    },
    {
      name: "ID",
      selector: (row) => row.conversionId,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "100px",
      grow: 3,
    },
    {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <ActionStatusCell row={row} canApprove={canApproveUser} />,
      sortable: true,
      grow: 5,
      width: "100px",
    },
    {
      name: "PID",
      selector: (row) => row.pid,
      cell: (row) => <NumberCell row={row} />,
      sortable: true,
      grow: 6,
      width: "250px",
    },
    {
      name: "Events",
      cell: (row) => <CreateEventCell row={row} />,
      sortable: false,
      grow: 6,
      width: "130px",
    },
   {
      name: "Actions",
      cell: (row) => <ConversionActionsCell row={row} canEdit={canEditUser} canDelete={canDeleteUser} />,
      grow: 1,
    
    },
  ];



  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
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
        height: "56px",
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
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

  const handleExportCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert("No data to export");
      return;
    }
    const exportColumns = columns.filter(c => c.name !== 'Actions' && c.name !== 'Events');
    const headers = exportColumns.map(c => c.name).join(",");
    const csvRows = filteredData.map(row => {
      return exportColumns.map(col => {
        let val = col.selector ? col.selector(row) : "";
        if (val === undefined || val === null) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `conversions_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConversionSave = async (savedConversion) => {
    console.log('Conversion saved in event modal:', savedConversion);
    setConversionEventModalOpen(false);
    setSelectedConversion(null);

    setLoading(true);

    try {
      await delay(500);
      if (showArchived) {
        await fetchArchivedConversion();
      } else if (appliedDateRange) {
        await fetchconversionListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.apiRange || appliedDateRange.label
        );
      } else {
        await fetchConversionList();
      }

      // Force a re-render
      redraw();

    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMacroSave = async (selectedMacros) => {
    console.log('Macros saved:', selectedMacros);
    console.log('For conversion ID:', selectedConversion?.conversionId);

    // Close the macro modal
    setConversionMacrosModalOpen(false);
    setSelectedConversion(null);

    setLoading(true);

    try {
      await delay(500);
      if (showArchived) {
        await fetchArchivedConversion();
      } else if (appliedDateRange) {
        await fetchconversionListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.apiRange || appliedDateRange.label
        );
      } else {
        await fetchConversionList();
      }

      redraw();

    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const fetchconversionListByDateRange = async (start, end, range = null) => {
    try {
      const formattedStartDate = formatDateForAPI(start);
      const formattedEndDate = formatDateForAPI(end);
      if (!formattedStartDate || !formattedEndDate) {
        await fetchConversionList();
        return;
      }
      const apiRange = getApiRangeValue(range) || range;
      const res = await getconversionByDateRange(
        currentBrandId || 0,
        formattedStartDate,
        formattedEndDate,
        apiRange
      );

      let list = [];
      if (res.data?.data?.informationConversion) {
        list = res.data.data.informationConversion;
      } else if (res.data?.informationConversion) {
        list = res.data.informationConversion;
      } else if (res.data?.data) {
        list = res.data.data;
      } else {
        list = res.data || [];
      }

      const formatted = list.map((item) => ({
        id: item.conversionId || item.id || item.conversionId,
        conversionId: item.conversionId || item.conversionId || item.conversionId,
        name: item.name || item.name || "Unnamed Conversion",
        mmType: item.mmType || item.mmType || "",
        pid: item.pid || "",
        status: getStatusText(item.status || 1),
        number_of_hits: item.number_of_hits || item.number_of_hits || "0",
        defaultValue: item.defaultValue || item.defaultValue || "0",
        conversion_count: item.conversion_count || item.conversion_count || "-",
        labelValue: item.labelValue || item.label_value || "",
        originalData: item
      }));

      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching data by date range:", err);
      await fetchConversionList();
    }
  };

  const fetchArchivedConversion = async () => {
    setLoading(true);
    try {
      const res = await getConversionStatus(3);
      let list = [];

      if (res.data?.data?.informationConversion) {
        list = res.data.data.informationConversion;
      } else if (res.data?.informationConversion) {
        list = res.data.informationConversion;
      } else if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else {
        list = [];
      }

      if (currentBrandId) {
        list = list.filter(item => {
          return !item.brandId || item.brandId == currentBrandId;
        });
      }

      const formatted = list.map((item) => ({
        id: item.conversionId || item.id || item.conversionId,
        conversionId: item.conversionId || item.conversionId || item.conversionId,
        name: item.name || item.name || "Unnamed Conversion",
        mmType: item.mmType || item.mmType || "",
        pid: item.pid || "",
        status: getStatusText(item.status || 1),
        number_of_hits: item.number_of_hits || item.number_of_hits || "0",
        defaultValue: item.defaultValue || item.defaultValue || "0",
        conversion_count: item.conversion_count || item.conversion_count || "-",
        labelValue: item.labelValue || item.label_value || "",
        originalData: item
      }));

      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching archived audiences:", err);
      try {
        let fallbackList = [];
        if (currentBrandId) {
          const res = await editConversion(currentBrandId);
          if (res.data?.data?.informationConversion) {
            fallbackList = res.data.data.informationConversion;
          } else if (res.data?.informationConversion) {
            fallbackList = res.data.informationConversion;
          }
        } else {
          const res = await fetchConversionList();
          fallbackList = res?.data?.data?.informationConversion || [];
        }
        fallbackList = fallbackList.filter(item => item.status == 3);
        const formattedFallback = fallbackList.map((item) => ({
          id: item.conversionId || item.id || item.conversionId,
          conversionId: item.conversionId || item.conversionId || item.conversionId,
          name: item.name || item.name || "Unnamed Conversion",
          mmType: item.mmType || item.mmType || "",
          pid: item.pid || "",
          status: getStatusText(item.status || 1),
          number_of_hits: item.number_of_hits || item.number_of_hits || "0",
          defaultValue: item.defaultValue || item.defaultValue || "0",
          conversion_count: item.conversion_count || item.conversion_count || "-",
          labelValue: item.labelValue || item.label_value || "",
          originalData: item
        }));
        setRowData(formattedFallback);
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
        alert(`Error loading archived audiences: ${err.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showArchived) {
      fetchArchivedConversion();
    } else {
      if (appliedDateRange) {
        fetchconversionListByDateRange(
          appliedDateRange.startDate,
          appliedDateRange.endDate,
          appliedDateRange.apiRange || appliedDateRange.label
        );
      } else {
        fetchConversionList();
      }
    }
  }, [showArchived]);

  const handleApply = async () => {
    setShowCalendar(false);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate,
      endDate,
      label: selectedLabel,
      apiRange: apiRangeValue
    };
    setAppliedDateRange(dateRange);

    try {
      await fetchconversionListByDateRange(startDate, endDate, apiRangeValue);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      await fetchConversionList();
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = async () => {
    setShowCalendar(false);
    setLoading(true);
    const apiRangeValue = getApiRangeValue(selectedLabel);
    const dateRange = {
      startDate,
      endDate,
      label: selectedLabel,
      apiRange: apiRangeValue
    };
    setAppliedDateRange(dateRange);
    try {
      await fetchconversionListByDateRange(startDate, endDate, apiRangeValue);
    } catch (error) {
      console.error("Error fetching data by date range:", error);
      await fetchConversionList();
    } finally {
      setLoading(false);
    }
  };

  const handleClearDateRange = async () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLabel("");
    setAppliedDateRange(null);
    setShowCalendar(false);
    setLoading(true);
    try {
      await fetchConversionList();
    } catch (error) {
      console.error("Error clearing date range:", error);
    } finally {
      setLoading(false);
    }
  };



  return (

    <div className="campaign-daily-container">
      {modal && (
        <DecisionModal
          title="Really delete Conversion?"
          message="Only the db admin can undo this if you delete it!!!"
          name="DELETE"
          callback={modalCallback}
        />
      )}

      <ConversionGetCodeModal
        isOpen={ConversionCodepopOpen}
        toggle={toggleConversionCodepop}
        conversion={selectedConversionForCode}
        pid={codePidValue}
        loading={loadingCode}
        brandId={currentBrandId}
      />

      <ConversionModal
        isOpen={conversionModalOpen}
        toggle={toggleConversionModal}
        conversion={selectedConversion}
        callback={handleConversionSave}
      />

      <ConversionEventModal
        isOpen={conversionEventModalOpen}
        toggle={toggleConversionEventModal}
        conversion={selectedConversion}
        callback={handleConversionSave}
        brandId={currentBrandId}
      />

      <ConversionMacrosModal
        isOpen={conversionMacrosModalOpen}
        toggle={toggleConversionMacrosModal}
        onSelect={handleMacroSave}
        conversionId={selectedConversion?.conversionId || selectedConversion?.id}
      />

      {creative === null && canViewConversion && (
        <>
          <div className="campaign-daily-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div>
              <div className="campaign-daily-title">
                <h2>Conversions</h2>
              </div>
            </div>
          </div>
          <Card className="mb-3" style={{ borderRadius: "18px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)" }}>
            <CardBody className="py-3" style={{ overflow: "visible" }}>
              <div className="campaign-daily-controls">
                <button className="cdi-icon-btn" onClick={refresh}>
                  <FontAwesomeIcon
                    icon={faSync}
                    className={loading ? "fa-spin" : ""}
                    style={{ marginRight: '6px' }}
                  />
                  Refresh
                </button>

                <div className="cdi-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="cd-pagination-summary" style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {filteredData.length
                        ? `${Math.min(currentPage * perPage, filteredData.length)} of ${filteredData.length} entries`
                        : "0 entries"}
                    </div>
                    <div className="cd-pagination-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                      {/* {totalPages > 1 && ( */}
                        <div className="cd-pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                          <button
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            className="cd-pagination-nav-btn"
                            type="button"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#64748b' }}
                          >
                            <FaChevronRight style={{ transform: 'rotate(180deg)', fontSize: '12px' }} />
                          </button>
                          <button
                            className="cd-pagination-page-btn is-active"
                            type="button"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: '#dc2626',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'default',
                            }}
                          >
                            {currentPage}
                          </button>
                          <span style={{ color: '#64748b', fontSize: '13px', margin: '0 4px', fontWeight: '500' }}>of</span>
                          <button
                            className="cd-pagination-page-btn"
                            type="button"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#fff',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'default',
                            }}
                          >
                            {totalPages}
                          </button>
                          <button
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            disabled={currentPage >= totalPages}
                            className="cd-pagination-nav-btn"
                            type="button"
                            style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#64748b' }}
                          >
                            <FaChevronRight style={{ fontSize: '12px' }} />
                          </button>
                          <div style={{ position: 'relative', marginLeft: '8px' }} ref={perPageRef}>
                            <div className="campaign-select-wrapper">
                              <input
                                readOnly
                                value={`${perPage} per page`}
                                className="campaign-select-input"
                                style={{
                                  height: '30px',
                                  minHeight: '30px',
                                  borderRadius: '6px',
                                  padding: '8px 28px 8px 16px',
                                  border: '1px solid #e2e8f0',
                                  fontSize: '12px',
                                  color: '#1e293b',
                                  fontWeight: '600',
                                  backgroundColor: '#fff',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  maxWidth: '130px',
                                }}
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
                                  {[10, 20, 25, 50, 100, 250, 500].map((value) => {
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
                                          {(isSelected || isHovered) && '✓'}
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

                  <button className="cdi-export-btn" onClick={handleExportCSV} style={{ backgroundColor: "#dc2626", color: "white", borderColor: "#dc2626" }}>
                    <FontAwesomeIcon icon={faDownload} /> EXPORT CSV
                  </button>
                  {canCreateUser && (
                    <button className="cdi-export-btn" onClick={toggleConversionModal} style={{ backgroundColor: "#0ea5e9", color: "white", borderColor: "#0ea5e9", marginLeft: "8px" }}>
                      ADD MMP
                    </button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
          <div className="campaign-daily-table-wrapper">
            <div style={{ border: "1px solid #e6ebf2", borderRadius: "14px", overflowX: "auto", overflowY: "auto", maxHeight: "70vh" }}>
              <div style={{ minWidth: "1000px" }}>
                <DataTable
                  keyField="id"
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
                  // onRowClicked={handleRowClicked}
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
      {creative === null && !canViewConversion && (
        <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view Conversions.
        </div>
      )}
    </div>
  );
};

export default Conversion;
