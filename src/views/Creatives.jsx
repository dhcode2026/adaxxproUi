import React, { useState, useEffect, useMemo, Fragment, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Button,
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
import { useGlobalTabs } from "../context/TabContext";
import DecisionModal from "../DecisionModal";
import { FaCaretDown, FaCheck, FaCog, FaCaretUp } from "react-icons/fa";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import DataTable from "react-data-table-component";
import { getAllMyadslist, upadtestatusCreatives, updatecampaignstatus } from "../views/api/Api";
import Popup from "./Modal/Popup";
import { listCreativesbrand } from "../views/api/Api";
import CustomizationModal from "./Modal/CustomizationModal";
import LinkedCampaigns from "./LinkedCampaigns.jsx";
import LinkAdspop from "./Modal/LinkAds.jsx";
import ReviewDetails from "./ReviewDetails.jsx";
import { useNavigate } from "react-router-dom";
import FilterAdsModal from "./Modal/FilterAdsModal";
import BannerModal from "../views/Modal/BannerModal";
import AudioModal from "./Modal/AudioModal";
import VideoModal from "./Modal/VideoModal";
import NativeModal from "./Modal/NativeModal";
import BannerpreviewModal from "../../src/creativepreview/BannerpreviewModal.jsx";
import VideopreviewModal from "../../src/creativepreview/VideopreviewModal.jsx";
import AudiopreviewModal from "../../src/creativepreview/AudiopreviewModal.jsx";
import BannerModaleditor from "./Modal/modaleditor/BannerModaleditor";
import AudioModaleditor from "./Modal/modaleditor/AudioModaleditor";
import VideoModaleditor from "./Modal/modaleditor/VideoModaleditor";
import NativeModaleditor from "./Modal/modaleditor/NativeModaleditor";
import { canCreate, canEdit, canDelete, canView, canUpdate, canReporting, canApprove } from "../utils/permissionHelper";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import "../assets/css/creatives.css";

const getErrorMessage = (err) => {
  if (err && err.response && err.response.data) {
    const data = err.response.data;
    if (typeof data === "object") {
      return data.message || data.error || JSON.stringify(data);
    }
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return parsed.message || parsed.error || data;
      } catch (e) {
        return data;
      }
    }
  }
  return err ? (err.message || String(err)) : "Unknown error";
};

const getStatusText = (code) => {
  const statusMap = {
    "Approved": "Approved",
    "Rejected": "Rejected",
    "waiting approval": "waiting for approval",
    "waiting for approval": "waiting for approval",
    "waiting_for_approval": "waiting for approval"
  };
  return statusMap[code] || code;
};
const getStatusCode = (text) => {
  const statusMap = {
    "Approved": "Approved",
    "Rejected": "Rejected",
    "waiting for approval": "waiting approval"
  };
  return statusMap[text] || text;
};

const getApprovalStatusText = (item) => {
  const rawStatus = item.status;
  if (rawStatus) {
    const lowerStatus = String(rawStatus).toLowerCase();
    if (lowerStatus === "approved") {
      return "Approved";
    }
    if (lowerStatus === "rejected") {
      return "Rejected";
    }
    if (lowerStatus.includes("waiting approval") || lowerStatus.includes("waiting for approval") || lowerStatus.includes("waiting_for_approval")) {
      return "waiting for approval";
    }
  }
  const rawReview = item.external_review;
  if (rawReview) {
    const lower = rawReview.toLowerCase();
    if (lower.includes("waiting on internal approval") || lower.includes("waiting approval") || lower.includes("waiting for approval")) {
      return "waiting for approval";
    }
    if (lower.includes("rejected")) {
      return "Rejected";
    }
    return "Approved";
  }
  return "Approved";
};

const getRunnableStatusText = (item) => {
  const rawStatus = item.status;
  if (rawStatus) {
    const lower = String(rawStatus).toLowerCase();
    if (lower === "runnable" || lower === "on" || lower === "on") {
      return "runnable";
    }
    if (lower === "offline") {
      return "offline";
    }
  }
  return "runnable";
};
const DEFAULT_SELECTED_COLUMNS = [
  "ID",
  "Name",
  "Status",
  "Approved",
  "Size",
  "Ad Type",
  "Preview",
  "Destination URL",
  "Imp. URL",
];

const Creatives = (props) => {
  const { brandId } = useParams();
  const location = useLocation();
  const { globalTabsList: tabsList, initializePageTab } = useGlobalTabs();
  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };
  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [rowData, setRowData] = useState([]);
  const [currentBrandId, setCurrentBrandId] = useState(brandId || location.state?.brandId || null);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const toggleCustomizationModal = () => setCustomizationModalOpen(!customizationModalOpen);
  const [selectedColumns, setSelectedColumns] = useState(DEFAULT_SELECTED_COLUMNS);
  const datePickerRef = useRef(null);
  const toggleFilteradsModalOpen = () => setFilterAdsModalOpen(!filteradsModalOpen);
  const [filteradsModalOpen, setFilterAdsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);
  const [bannerpreviewModalOpen, setBannerPreviewModalOpen] = useState(false);
  const toggleBannerPreviewModal = () => setBannerPreviewModalOpen(!bannerpreviewModalOpen);
  const toggleBannerModal = () => setBannerModalOpen(!bannerModalOpen);
  const toggleAudioModal = () => setAudioModalOpen(!audioModalOpen);
  const toggleVideoModal = () => setVideoModalOpen(!videoModalOpen);
  const toggleNativeModal = () => setNativeModalOpen(!nativeModalOpen);
  const [LinkAdspopOpen, setLinkAdspopOpen] = useState(false);
  const toggleLinkAdspop = () => setLinkAdspopOpen(!LinkAdspopOpen);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState(null);
  const [videopreviewModalOpen, setVideoPreviewModalOpen] = useState(false);
  const toggleVideoPreviewModal = () => setVideoPreviewModalOpen(!videopreviewModalOpen);
  const [audiopreviewModalOpen, setAudioPreviewModalOpen] = useState(false);
  const toggleAudioPreviewModal = () => setAudioPreviewModalOpen(!audiopreviewModalOpen);
  const [bannereditorModalOpen, setBannereditorModalOpen] = useState(false);
  const toggleBannereditorModal = () => setBannereditorModalOpen(!bannereditorModalOpen)
  const [audioeditorModalOpen, setAudioeditorModalOpen] = useState(false);
  const toggleAudioeditorModal = () => setAudioeditorModalOpen(!audioeditorModalOpen);
  const [videoeditorModalOpen, setVideoeditorModalOpen] = useState(false);
  const toggleVideoeditorModal = () => setVideoeditorModalOpen(!videoeditorModalOpen);
  const [nativeeditorModalOpen, setNativeeditorModalOpen] = useState(false);
  const toggleNativeeditorModal = () => setNativeeditorModalOpen(!nativeeditorModalOpen);
  const STORAGE_KEY = 'creativeListSelectedColumns';
  const [currentBrandName, setCurrentBrandName] = useState(location.state?.brandName || localStorage.getItem('currentBrandName') || "");
  const [showPopup, setShowPopup] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingRow, setPendingRow] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [statusdata, setstatusdata] = useState({});
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const [canReportingUser, setCanReportingUser] = useState(false);
  const [canApproveUser, setCanApproveUser] = useState(false);
  let userid = localStorage.getItem("userId");
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
    const pageTitle = currentBrandName ? `My Ads - ${currentBrandName}` : "My Ads";
    initializePageTab(pageTitle, "fa fa-video-camera", location.pathname, null, location.state);
  }, [currentBrandName, initializePageTab, location.pathname, location.state?.brandId]);

  // Permission initialization
  useEffect(() => {
    const hasCreatePermission = canCreate("Creatives");
    const hasViewPermission = canView("Creatives");
    const hasEditPermission = canEdit("Creatives");
    const hasDeletePermission = canDelete("Creatives");
    const hasUpdatePermission = canUpdate("Creatives");
    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
    setCanReportingUser(canReporting("Creatives"));
    setCanApproveUser(canApprove("Creatives"));
  }, []);
  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          const statusIdx = parsed.indexOf("Status");
          if (statusIdx !== -1) {
            const approvedIdx = parsed.indexOf("Approved");
            if (approvedIdx !== -1) {
              parsed.splice(approvedIdx, 1);
            }
            parsed.splice(statusIdx + 1, 0, "Approved");
          } else if (!parsed.includes("Approved")) {
            parsed.push("Approved");
          }
          setSelectedColumns(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved columns', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedColumns));
  }, [selectedColumns]);

  const redraw = () => {
    setCount(count + 1);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const refresh = async () => {
    setLoading(true);
    try {
      await delay(1000);
      await fetchMyadsList();
      redraw();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const [showCalendar, setShowCalendar] = useState(false);
  const toggleCalendar = () => setShowCalendar((prev) => !prev);
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedBrandName, setSelectedBrandName] = useState("");
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Linked Campaigns", icon: "icon-world" },
  ];
  const editCreative = (creativeRow) => {
    const { type, originalData } = creativeRow;
    setSelectedCreative(originalData);
    switch (type?.toLowerCase()) {

      case 'banner':
        toggleBannereditorModal();
        break;
      case 'audio':
        toggleAudioeditorModal();
        break;
      case 'video':
        toggleVideoeditorModal();
        break;
      case 'native':
        toggleNativeeditorModal();
        break;
      default:
        console.warn('Unknown creative type:', type);
        alert(`Editing not supported for type: ${type}`);
        setSelectedCreative(null);
    }
  };
  const editPreviewCreative = (creativeRow) => {
    const { type, originalData } = creativeRow;
    setSelectedCreative(originalData);
    switch (type?.toLowerCase()) {

      case 'banner':
        toggleBannerPreviewModal();
        break;
      case 'audio':
        toggleAudioPreviewModal();
        break;
      case 'video':
        toggleVideoPreviewModal();
        break;
      case 'native':
        toggleNativeModal();
        break;
      default:
        console.warn('Unknown creative type:', type);
        alert(`Editing not supported for type: ${type}`);
        setSelectedCreative(null);
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

  const deleteAudience = async (id, key) => {
    await vx.deleteAudience(id, key);
    await vx.getDbAudience();
    setCreative(null);
    redraw();
  };
  const [loading, setLoading] = useState(false);
  const lastRowIdsStrRef = useRef("");
  useEffect(() => {
    const currentRowIdsStr = rowData.map(r => r.id).join(",");
    if (currentRowIdsStr !== lastRowIdsStrRef.current) {
      lastRowIdsStrRef.current = currentRowIdsStr;
      if (!loading && rowData.length > 0) {
        setSelectedIds([rowData[0].id]);
        setSelectedBrandName(rowData[0].name);
        setSelectedCreative(rowData[0].originalData);
      } else if (!loading && rowData.length === 0) {
        setSelectedBrandName("");
        setSelectedCreative(null);
      }
    }
  }, [loading, rowData]);
  // const fetchMyadsList = async () => {
  //   setLoading(true);
  //   try {
  //     let allCreatives = [];
  //     if (currentBrandId) {
  //       console.log("Fetching creatives for brandId:", currentBrandId);
  //       const res = await listCreativesbrand(currentBrandId);
  //       console.log("Brand-specific API Response:", res.data);
  //       allCreatives = res.data?.data?.informationCreatives || res.data?.informationCreatives || [];
  //     } else {
  //       const res = await getAllMyadslist();
  //       allCreatives = res.data?.data?.informationCreatives || res.data?.informationCreatives || [];
  //     }

  //     const formatted = allCreatives.map((item) => {
  //       const type = (item.type || "").toLowerCase();
  //       let duration = null;
  //       if (type === 'audio') {
  //         duration = item.audioDuration || item.duration || item.length || '';
  //       } else if (type === 'video') {
  //         duration = item.vast_video_duration || item.duration || item.length || '';
  //       }
  //       return {
  //         id: item.creativesId,
  //         creativesId: item.creativesId,
  //         name: item.name || "Unnamed Creative",
  //         status: getStatusText(item.status || 1),
  //         type: item.type || "-",
  //         gbo_status: item.gbo_status || "Off",
  //         kpimetric: item.kpimetric || "-",
  //         kpivalue: item.kpivalue || "-",
  //         brandId: item.brandId || currentBrandId,
  //         destinationUrl: item.destinationUrl || "",
  //         impressionTrackingUrl: item.impressionTrackingUrl || "-",
  //         external_review: item.external_review || "Approved",
  //         preview: item.preview || "Go to Ad Preview",
  //         width: item.width || 0,
  //         height: item.height || 0,
  //         duration: duration,
  //         audioDuration: item.audioDuration,
  //         vast_video_duration: item.vast_video_duration,
  //         originalData: item
  //       };
  //     });

  //     console.log("Formatted creatives:", formatted);
  //     setRowData(formatted);
  //   } catch (err) {
  //     console.error("Error fetching creatives:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  const fetchMyadsList = async () => {
    setLoading(true);
    try {
      let allCreatives = [];
      if (currentBrandId) {
        console.log("Fetching creatives for brandId:", currentBrandId);
        const res = await listCreativesbrand(currentBrandId);
        console.log("Brand-specific API Response:", res.data);
        allCreatives = res.data?.data?.informationCreatives || res.data?.informationCreatives || [];
      } else {
        const res = await getAllMyadslist();
        allCreatives = res.data?.data?.informationCreatives || res.data?.informationCreatives || [];
      }

      const normalizeType = (type) => {
        if (type === 'image') return 'banner';
        return type;
      };

      const formatted = allCreatives.map((item) => {
        const rawType = (item.type || "").toLowerCase();
        const type = normalizeType(rawType);
        let duration = null;
        if (type === 'audio') {
          duration = item.audioDuration || item.duration || item.length || '';
        } else if (type === 'video') {
          duration = item.vastVideoDuration || item.duration || item.length || '';
        }
        return {
          id: item.creativesId,
          creativesId: item.creativesId,
          name: item.name || "Unnamed Creative",
          status: getApprovalStatusText(item),
          approved: getRunnableStatusText(item),
          type: type,
          gbo_status: item.gbo_status || "Off",
          kpimetric: item.kpimetric || "-",
          kpivalue: item.kpivalue || "-",
          brandId: item.brandId || currentBrandId,
          destinationUrl: item.destinationUrl || "",
          impressionTrackingUrl: item.impressionTrackingUrl || "-",
          external_review: item.external_review || "Approved",
          preview: item.preview || "Go to Ad Preview",
          width: item.width || 0,
          height: item.height || 0,
          duration: duration,
          audioDuration: item.audioDuration,
          vastVideoDuration: item.vastVideoDuration,
          originalData: item
        };
      });

      console.log("Formatted creatives:", formatted);
      setRowData(formatted);
    } catch (err) {
      console.error("Error fetching creatives:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMyadsList();
  }, [currentBrandId]);


  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every(item => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);

  const handleSelectAllChange = () => {
    const filteredIds = filteredData.map(item => item.id);
    if (isAllFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const newSelected = [...prev];
        filteredIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  const CustomLoader = () => (
    <div className="customloader" >
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );
  const NoDataComponent = () => (
    <div
      className="nogroupdataavilable">
      <div className="py-4 fw-bold text-secondary">
        {currentBrandId ? "No ADS data available for this brand" : "No data available"}
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
        minHeight: "35px",
        borderBottom: "1px solid #eef2f7",
        height: "35px",
      },
    },
    cells: {
      style: {
        minWidth: 0,
        overflow: "hidden",
        paddingLeft: "14px",
        paddingRight: "14px",
        paddingTop: "10px",
        paddingBottom: "10px",
        borderRight: "1px solid #f1f5f9",
        whiteSpace: "nowrap",
      },
    },
  };

  const tableDropdownMenuProps = {
    container: "body",
    strategy: "fixed",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          boundary: "viewport",
        },
      },
    ],
  };

  const handleTableContentClick = (row, event) => {
    event?.stopPropagation();
    handleRowClicked(row);
  };

  const IDCell = ({ row }) => {
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={String(row.id ?? "")}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {row.id}
      </div>
    );
  };

  const AddTypeCell = ({ row }) => {
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={row.type}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {row.type}
      </div>
    );
  };
  const ExternalCell = ({ row }) => {
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={row.external_review}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {row.external_review}
      </div>
    );
  };

  const DestinationCell = ({ row }) => {
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={row.destinationUrl}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {row.destinationUrl}
      </div>
    );
  };
  const ImpressionCell = ({ row }) => {
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={row.impressionTrackingUrl}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {row.impressionTrackingUrl}
      </div>
    );
  };
  const InternalReviewCell = ({ row }) => {
    const isPending = row.external_review?.toLowerCase().includes('waiting on internal approval');
    return (
      <div
        className="gOorhn creative-table-cell-text creative-table-cell-center"
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {isPending && <i className="fa fa-clock-o creative-internal-review-icon" title="Pending internal approval" />}
      </div>
    );
  };


  const SizeCell = ({ row }) => {
    const type = row.type?.toLowerCase();
    if (type === 'audio' || type === 'video') {
      const duration = row.duration ? `${row.duration}s` : '30s';
      return (
        <div
          className="gOorhn creative-table-cell-text"
          title={duration}
          onClick={(event) => handleTableContentClick(row, event)}
        >
          {duration}
        </div>
      );
    }
    if (type === 'native') {
      return (
        <div
          className="gOorhn creative-table-cell-text"
          onClick={(event) => handleTableContentClick(row, event)}
        >
          -
        </div>
      );
    }
    const size = `${row.width ?? 0}x${row.height ?? 0}`;
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={size}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {size}
      </div>
    );
  };
  const NameCell = ({ row }) => {
    return (
      <div
        className="gOorhn creative-table-cell-text"
        title={row.name}
        onClick={(event) => handleTableContentClick(row, event)}
      >
        {row.name}
        {currentBrandId && (
          <span className="badge bg-secondary ms-2 creative-brand-badge">
          </span>
        )}
      </div>
    );
  };

  const PreviewCell = ({ row }) => {
    return (
      <div className="gOorhn creative-table-cell-text" title={row.preview}>
        <a
          onClick={(event) => {
            handleTableContentClick(row, event);
            editPreviewCreative(row);
          }}
        >
          {row.preview}
        </a>
      </div>
    );
  };
  const AudienceActionsCell = ({ row, canEditUser }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog className="creative-icon-mr" />
          <FaCaretDown className="creative-caret-ml" />
        </DropdownToggle>
        {canEditUser && (
          <DropdownMenu
            {...tableDropdownMenuProps}
            className="custom-dropdown-menu biddeript-bd creative-campaign-dropdown-menu"
          >
            <DropdownItem
              className="custom-dropdown-option creative-campaign-dropdown-option"
              onClick={() => handleLinkToCampaigns(row)}
            >
              <span className="creative-campaign-dropdown-tick">
                <FaCheck />
              </span>
              <span>Link Campaigns</span>
            </DropdownItem>
            <DropdownItem
              className="custom-dropdown-option creative-campaign-dropdown-option"
              onClick={() => editCreative(row)}
            >
              <span className="creative-campaign-dropdown-tick">
                <FaCheck />
              </span>
              <span>Edit Creative</span>
            </DropdownItem>
          </DropdownMenu>
        )}
        {!canEditUser && (
          <DropdownMenu
            {...tableDropdownMenuProps}
            className="custom-dropdown-menu biddeript-bd creative-campaign-dropdown-menu"
          >
            <DropdownItem className="custom-dropdown-option creative-campaign-dropdown-option">
              <span className="creative-campaign-dropdown-tick" />
              <span>No Actions Available</span>
            </DropdownItem>
          </DropdownMenu>
        )}
      </Dropdown>
    );
  };

  const ApprovedCell = ({ row }) => {
    const [approvedOpen, setApprovedOpen] = useState(false);
    const currentValue = row.approved || "runnable";

    const handleApprovedChange = (newValue) => {
      setRowData((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, approved: newValue } : item
        )
      );
      setApprovedOpen(false);
    };

    const toggleApproved = () => {
      setApprovedOpen(!approvedOpen);
    };

    return (
      <>
        
        <Dropdown isOpen={approvedOpen} toggle={toggleApproved}>
          <DropdownToggle
            tag="span"
            className={`onoffbutton status-${currentValue}`}
          >
            {currentValue}
            <FaCaretDown className="creative-caret-ml" />
          </DropdownToggle>

          <DropdownMenu className="audiencemenu" {...tableDropdownMenuProps}>
            <DropdownItem
              className="approved-dropdown-item"
              onClick={() => handleApprovedChange("runnable")}
              active={currentValue === "runnable"}
            >
              <span className="conversionstatus">runnable</span>
            </DropdownItem>
            <DropdownItem
              className="approved-dropdown-item"
              onClick={() => handleApprovedChange("offline")}
              active={currentValue === "offline"}
            >
              <span className="conversionstatus">offline</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </>
    );
  };

  const ActionStatusCell = ({ row }) => {
    const [currentStatus, setCurrentStatus] = useState(getStatusText(row.status || "Approved"));
    const [statusOpen, setStatusOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      setCurrentStatus(getStatusText(row.status || "Approved"));
    }, [row.status]);

    const handleStatusChange = async (newStatusText) => {
      if (currentStatus === newStatusText || updating) return;
      setUpdating(true);
      try {
        const statusCode = getStatusCode(newStatusText);
        const response = await upadtestatusCreatives(row.id, statusCode);
        if (response.status === 200) {
          setCurrentStatus(newStatusText);
          setRowData(prev =>
            prev.map(item =>
              item.id === row.id ? { ...item, status: newStatusText } : item
            )
          );
          await refresh();
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } catch (err) {
        console.error("Status update error:", err);
        const errorMessage = getErrorMessage(err);
        if (errorMessage && (errorMessage.toLowerCase().includes("please unlink the creative") || errorMessage.toLowerCase().includes("unlink"))) {
          Swal.fire({
            title: "Warning",
            text: "the select creative is linked with live campaign",
            icon: "warning",
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: `Failed to update status: ${errorMessage}`,
            icon: "error",
          });
        }
      } finally {
        setUpdating(false);
        setStatusOpen(false);
      }
    };

    const toggleStatus = () => {
      if (!updating) setStatusOpen(!statusOpen);
    };

    const handlepopupopen = (newStatusText) => {
      setPendingStatus(newStatusText);
      setPendingRow(row);
      setShowPopup(true);
    };

    return (
      <>
        

        <Dropdown isOpen={statusOpen} toggle={toggleStatus} disabled={updating}>
          {canApproveUser && (
            <>
              <DropdownToggle
                tag="span"
                className={`onoffbutton status-${currentStatus === "Approved"
                    ? "approved"
                    : (currentStatus === "waiting approval" || currentStatus === "waiting for approval" || currentStatus === "waiting_for_approval" || currentStatus === "Waiting for approval")
                      ? "waiting-for-approval"
                      : "rejected"
                  } ${updating ? "updating" : ""}`}
              >
                {updating ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                ) : (
                  <>
                    {currentStatus === "Approved"
                      ? "Approved"
                      : (currentStatus === "waiting approval" || currentStatus === "waiting for approval" || currentStatus === "waiting_for_approval" || currentStatus === "Waiting for approval")
                        ? "waiting for approval"
                        : "Rejected"}
                    <FaCaretDown className="creative-caret-ml" />
                  </>
                )}
              </DropdownToggle>

              <DropdownMenu
                className="custom-dropdown-menu biddeript-bd audiencemenu creative-campaign-dropdown-menu"
                {...tableDropdownMenuProps}
              >
                <DropdownItem
                  className={` custom-dropdown-option creative-campaign-dropdown-option ${currentStatus === "Approved" ? "selected" : ""}`}
                  onClick={() => handlepopupopen("Approved")}
                  active={currentStatus === "Approved"}
                  disabled={updating}
                >
                  <span className="creative-campaign-dropdown-tick">
                    <FaCheck />
                  </span>
                  <span className="conversionstatus">Approved</span>
                </DropdownItem>

                <DropdownItem
                  className={` custom-dropdown-option creative-campaign-dropdown-option ${currentStatus === "Rejected" ? "selected" : ""}`}
                  onClick={() => handlepopupopen("Rejected")}
                  active={currentStatus === "Rejected"}
                  disabled={updating}
                >
                  <span className="creative-campaign-dropdown-tick">
                    <FaCheck />
                  </span>
                  <span className="conversionstatus">Rejected</span>
                </DropdownItem>
              </DropdownMenu></>)}
        </Dropdown>
        {!canApproveUser && (
          <div className="audiencemenu gOorhn">
            <span>Access Denied</span>
          </div>
        )}

      </>
    );
  };

  const ALL_COLUMNS = {
    "ID": {
      name: "ID",
      selector: (row) => row.id,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Name": {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "200px",
    },
    "Status": {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <ActionStatusCell row={row} />,
      sortable: true,
      width: "150px",
      allowOverflow: true,
    },

    "Ad Type": {
      name: "Ad Type",
      selector: (row) => row.type,
      cell: (row) => <AddTypeCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Size": {
      name: "Size",
      selector: (row) => {
        const type = row.type?.toLowerCase();
        if (type === 'audio' || type === 'video') {
          return row.duration || '30s';
        }
        if (type === 'native') {
          return '-';
        }
        return `${row.width ?? 0}x${row.height ?? 0}`;
      },
      cell: (row) => <SizeCell row={row} />,
      sortable: true,
    },
    "Preview": {
      name: "Preview",
      selector: (row) => row.preview,
      cell: (row) => <PreviewCell row={row} />,
      sortable: false,
      width: "140px",
    },
    "Destination URL": {
      name: "Destination URL",
      selector: (row) => row.destinationUrl,
      cell: (row) => <DestinationCell row={row} />,
      sortable: true,
      width: "350px",
    },
    "Imp. URL": {
      name: "Imp. URL",
      selector: (row) => row.impressionTrackingUrl,
      cell: (row) => <ImpressionCell row={row} />,
      sortable: true,
      width: "350px",
    },
  };

  const buildColumns = useMemo(() => {
    return (() => {
      const columns = [
        {
          name: (
            <Input
              type="checkbox"
              checked={isAllFilteredSelected}
              onChange={handleSelectAllChange}
              disabled={filteredData.length === 0}
            />
          ),
          cell: (row) => {
            return (
              <Input
                type="checkbox"
                checked={selectedIds.includes(row.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange(row.id);
                }}
              />
            );
          },
          width: "50px",
        },
        {
          name: "Actions",
          cell: (row) => <AudienceActionsCell row={row} canEditUser={canEditUser} />,
          grow: 1,
          width: "100px",
          allowOverflow: true,
        }
      ];

      selectedColumns.forEach(columnKey => {
        if (ALL_COLUMNS[columnKey]) {
          columns.push(ALL_COLUMNS[columnKey]);
        }
      });

      return columns;
    })();
  }, [canEditUser, selectedColumns, isAllFilteredSelected, filteredData.length, selectedIds]);

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#cdcdcd !important',
        '& .gOorhn': {
          color: 'black !important',
        }
      },
    },
  ];
  const handleRowClicked = (row) => {
    console.log("Row clicked – raw creative data:", row.originalData);
    setSelectedIds([row.id]);
    setSelectedBrandName(row.name);
    setSelectedCreative(row.originalData);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleCreativeModalCallback = (updatedCreative) => {
    console.log("Creative saved/updated:", updatedCreative);
    setBannerModalOpen(false);
    setAudioModalOpen(false);
    setVideoModalOpen(false);
    setNativeModalOpen(false);
    setSelectedCreative(null);
    refresh();
  };
  const handleFillterCallback = (responseData) => {
    const apiCreatives = responseData?.data?.informationCreatives || responseData?.informationCreatives || [];

    console.log("📦 Raw API creatives:", apiCreatives);

    // Apply the same formatting as in fetchMyadsList
    const formatted = apiCreatives.map((item) => {
      const type = (item.type || "").toLowerCase();
      let duration = null;
      if (type === 'audio') {
        duration = item.audioDuration || item.duration || item.length || '';
      } else if (type === 'video') {
        duration = item.vastVideoDuration || item.duration || item.length || '';
      }
      return {
        id: item.creativesId,
        creativesId: item.creativesId,
        name: item.name || "Unnamed Creative",
        status: getApprovalStatusText(item),
        approved: getRunnableStatusText(item),
        type: item.type || "-",
        gbo_status: item.gbo_status || "Off",
        kpimetric: item.kpimetric || "-",
        kpivalue: item.kpivalue || "-",
        brandId: item.brandId || currentBrandId,
        destinationUrl: item.destinationUrl || "",
        impressionTrackingUrl: item.impressionTrackingUrl || "-",
        external_review: item.external_review || "Approved",
        preview: item.preview || "Go to Ad Preview",
        width: item.width || 0,
        height: item.height || 0,
        duration: duration,
        audioDuration: item.audioDuration,
        vastVideoDuration: item.vastVideoDuration,
        originalData: item
      };
    });

    console.log("✨ Formatted data for table:", formatted);

    // Update the table data
    setRowData(formatted);

    // Optional: Clear search term to show all filtered results
    setSearchTerm("");

  };
  const handleCreativeModaleditorCallback = (updatedCreative) => {
    console.log("Creative saved/updated:", updatedCreative);
    setBannereditorModalOpen(false);
    setNativeeditorModalOpen(false);
    setAudioeditorModalOpen(false);
    setVideoeditorModalOpen(false);

    setSelectedCreative(null);
    refresh();
  };

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

  const handleColumnChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
  };
  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }
    const headers = selectedColumns;
    const rows = filteredData.map(item => {
      const rowObj = {};
      headers.forEach(colName => {
        const colDef = ALL_COLUMNS[colName];
        if (colDef && typeof colDef.selector === 'function') {
          rowObj[colName] = colDef.selector(item);
        } else {
          rowObj[colName] = item[colName] || '';
        }
      });
      return rowObj;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Creatives');
    const fileName = `creatives_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  const showValidationError = async () => {
    await Swal.fire({
      html: `
        <div class="swal2-validation-error">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" class="swal2-validation-error-icon" />
          <span class="swal2-validation-error-title">Error</span>
        </div>
        <div class="swal2-validation-error-text">
         Please check at least one ad before attempting to link campaigns.
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 468,
      padding: 0,
      customClass: {
        popup: "swal2-custom-size",
        confirmButton: "swal2-small-btn",
      },
    });
  };

  const handleLinkToCampaigns = async (specificRow = null) => {
    let targetIds = [];
    let targetRows = [];

    if (specificRow) {
      targetIds = [specificRow.id];
      targetRows = [specificRow];
    } else {
      targetIds = selectedIds;
      targetRows = rowData.filter(item => selectedIds.includes(item.id));
    }

    if (targetIds.length === 0) {
      showValidationError();
      return;
    }

    // Check if any of the target ads are Non Approved (allowing approved and waiting for approval)
    const hasNonApproved = targetRows.some(row => {
      const statusVal = String(row.status || "Approved").trim().toLowerCase();
      return statusVal !== "approved" && !statusVal.includes("waiting");
    });

    if (hasNonApproved) {
      await Swal.fire({
        title: "Warning",
        text: "The selected ads are not approved. Please contact your administrator.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
      });
      return;
    }

    // Show confirmation popup
    const result = await Swal.fire({
      title: "Confirmation",
      text: "Do you want to link the ads to campaigns?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#62903e",
      cancelButtonColor: "#d33",
    });

    if (result.isConfirmed) {
      if (specificRow) {
        setSelectedIds([specificRow.id]);
      }
      toggleLinkAdspop();
    }
  };

  return (
    <div className="creatives-root">
      <div className="content1">
        <div className="content-wrapper1">
          {modal && (
            <DecisionModal
              title="Really delete Group?"
              message="Only the db admin can undo this if you delete it!!!"
              name="DELETE"
              callback={modalCallback}
            />
          )}
          {creative === null && canViewUser && (
            <>
              <Row>
                <Col xs="12">
                  <Card className="mb-3 creatives-card">
                    <CardBody className="py-3 creatives-card-body">
                      <div className="row ">
                        <div className="col-xl-12 col-lg-12">

                                  <div className="campaign-daily-controls creatives-controls">
                                    <div className="cdi-controls-left creatives-controls-left">
                                      <div className="cdi-search-box">
                                        <input
                                          type="text"
                                          placeholder="Search"
                                          className="input-search-box creatives-search-input"
                                          value={searchTerm}
                                          onChange={handleSearchChange}
                                        />
                                      </div>
                                      <Button
                                        className="cdi-export-btn creatives-filter-btn"
                                        type="button"
                                        id="filtersads"
                                        onClick={toggleFilteradsModalOpen}
                                      >
                                        Filter Ads
                                      </Button>
                                      <button
                                        type="button"
                                        className="cdi-refresh-btn creatives-refresh-btn"
                                        onClick={refresh}
                                        title="Refresh Data"
                                      >
                                        <i className={"fa fa-repeat " + (loading ? "fa-spin" : "")}></i>
                                      </button>
                                    </div>

                                    <div className="cdi-controls-right creatives-controls-right">
                                      {canEditUser && (
                                        <Button
                                          type="button"
                                          className="cdi-export-btn creatives-link-btn"
                                          onClick={() => handleLinkToCampaigns()}
                                        >
                                          Link To Campaigns
                                        </Button>)}
                              {canCreateUser && (
                                <Dropdown
                                  isOpen={dropdownOpen}
                                  toggle={toggle}
                                  className="new-dropdown"
                                >
                                  <DropdownToggle
                                    className="cdi-export-btn d-flex justify-content-center align-items-center creatives-newad-toggle"
                                    id="maindropdowns"
                                  >
                                    <span className="linkto"> New Ad </span>
                                    {dropdownOpen ? (
                                      <FaCaretUp className="creatives-caret-white" />
                                    ) : (
                                      <FaCaretDown className="creatives-caret-white" />
                                    )}
                                  </DropdownToggle>

                                  <DropdownMenu
                                    className="dropdown-menu-custom custom-dropdown-menu biddeript-bd creative-campaign-dropdown-menu"
                                  >
                                    <DropdownItem
                                      className="custom-dropdown-option creative-campaign-dropdown-option"
                                      onClick={toggleBannerModal}
                                    >
                                      <span className="creative-campaign-dropdown-tick">
                                        <FaCheck />
                                      </span>
                                      <span>Image Ad</span>
                                    </DropdownItem>
                                    <DropdownItem
                                      className="custom-dropdown-option creative-campaign-dropdown-option"
                                      onClick={toggleAudioModal}
                                    >
                                      <span className="creative-campaign-dropdown-tick">
                                        <FaCheck />
                                      </span>
                                      <span>Audio Ad</span>
                                    </DropdownItem>
                                    <DropdownItem
                                      className="custom-dropdown-option creative-campaign-dropdown-option"
                                      onClick={toggleVideoModal}
                                    >
                                      <span className="creative-campaign-dropdown-tick">
                                        <FaCheck />
                                      </span>
                                      <span>Video Ad</span>
                                    </DropdownItem>
                                    <DropdownItem
                                      className="custom-dropdown-option creative-campaign-dropdown-option"
                                      onClick={toggleNativeModal}
                                    >
                                      <span className="creative-campaign-dropdown-tick">
                                        <FaCheck />
                                      </span>
                                      <span>Native Ad</span>
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              )}
                              <Button
                                type="button"
                                className="cdi-export-btn dailyreporting-export-btn dailyreporting-export-btn-danger creatives-export-btn"
                                id="export"
                                onClick={exportToExcel}
                              >
                                Export
                              </Button>

                              <Button
                                type="button"
                                className="cdi-export-btn dailyreporting-export-btn dailyreporting-export-btn-primary creatives-customize-btn"
                                id="export"
                                onClick={toggleCustomizationModal}
                              >
                                Customization Columns
                              </Button>
                            </div>
                          </div>

                          <LinkAdspop
                            isOpen={LinkAdspopOpen}
                            toggle={toggleLinkAdspop}
                            brandId={currentBrandId}
                            creatives={selectedIds}
                            onLinked={refresh}
                          />
                          <CustomizationModal
                            isOpen={customizationModalOpen}
                            toggle={toggleCustomizationModal}
                            selectedColumns={selectedColumns}
                            setSelectedColumns={handleColumnChange}
                          />
                          <FilterAdsModal
                            isOpen={filteradsModalOpen}
                            toggle={toggleFilteradsModalOpen}
                            brandId={currentBrandId}
                            callback={handleFillterCallback}
                          />
                          <LinkAdspop
                            isOpen={LinkAdspopOpen}
                            toggle={toggleLinkAdspop}
                            brandId={currentBrandId}
                            creatives={selectedIds}
                            onLinked={refresh}
                          />
                          <BannerModal
                            isOpen={bannerModalOpen}
                            toggle={toggleBannerModal}
                            banner={selectedCreative}
                            callback={handleCreativeModalCallback}
                            brand_id={currentBrandId}
                          />

                          <AudioModal
                            isOpen={audioModalOpen}
                            toggle={toggleAudioModal}
                            banner={selectedCreative}
                            callback={handleCreativeModalCallback}
                            brand_id={currentBrandId}
                          />
                          <VideoModal
                            isOpen={videoModalOpen}
                            toggle={toggleVideoModal}
                            banner={selectedCreative}
                            callback={handleCreativeModalCallback}
                            brand_id={currentBrandId}
                          />
                          <NativeModal
                            isOpen={nativeModalOpen}
                            toggle={toggleNativeModal}
                            banner={selectedCreative}
                            callback={handleCreativeModalCallback}
                            brand_id={currentBrandId}
                          />
                          <BannerpreviewModal
                            isOpen={bannerpreviewModalOpen}
                            toggle={toggleBannerPreviewModal}
                            banner={selectedCreative}
                          />
                          <VideopreviewModal
                            isOpen={videopreviewModalOpen}
                            toggle={toggleVideoPreviewModal}
                            video={selectedCreative}
                          />
                          <AudiopreviewModal
                            isOpen={audiopreviewModalOpen}
                            toggle={toggleAudioPreviewModal}
                            audio={selectedCreative}
                          />

                          <BannerModaleditor
                            isOpen={bannereditorModalOpen}
                            toggle={toggleBannereditorModal}
                            banner={selectedCreative}
                            callback={handleCreativeModaleditorCallback}
                            brand_id={currentBrandId}
                          />
                          <AudioModaleditor
                            isOpen={audioeditorModalOpen}
                            toggle={toggleAudioeditorModal}
                            audio={selectedCreative}
                            callback={handleCreativeModaleditorCallback}
                            brand_id={currentBrandId}
                          />

                          <VideoModaleditor
                            isOpen={videoeditorModalOpen}
                            toggle={toggleVideoeditorModal}
                            video={selectedCreative}
                            callback={handleCreativeModaleditorCallback}
                            brand_id={currentBrandId}
                          />
                          <NativeModaleditor
                            isOpen={nativeeditorModalOpen}
                            toggle={toggleNativeeditorModal}
                            native={selectedCreative}
                            callback={handleCreativeModaleditorCallback}
                            brand_id={currentBrandId}
                          />

                          <Popup
                            isOpen={showPopup}
                            title={`Update Creatives Status`}
                            status={pendingStatus}
                            isLoading={popupLoading}
                            setpayload={setstatusdata}
                            onConfirm={async (data) => {
                              setPopupLoading(true);
                              try {
                                console.log(`Updating creatives ${pendingRow.id} with:`, data);
                                let data1 = {
                                  "status": data.status,
                                  "id": pendingRow.id,
                                  "userId": userid,
                                  "comments": data.comments,

                                  "attribute": "creative",
                                  "attributeId": pendingRow.id
                                }
                                setstatusdata({

                                  "status": data.status,
                                  "id": pendingRow.id,
                                  "user_id": userid,
                                  "comments": data.comments,

                                  "attribute": "creative",
                                  "attributeId": pendingRow.id
                                })
                                console.log(data1)
                                await upadtestatusCreatives(data1);
                                setRowData((prevData) =>
                                  prevData.map((item) =>
                                    item.id === pendingRow.id
                                      ? { ...item, status: data.status, name: data.name }
                                      : item
                                  )
                                );
                                console.log("Status updated successfully");
                                setShowPopup(false);
                                setPendingStatus(null);
                                setPendingRow(null);
                                Swal.fire({
                                  title: "Success!",
                                  text: "Status updated successfully.",
                                  icon: "success",
                                  confirmButtonColor: "#62903e",
                                });
                                await refresh();
                              } catch (err) {
                                console.error("Error updating status:", err);
                                const errorMessage = getErrorMessage(err);
                                if (errorMessage && (errorMessage.toLowerCase().includes("please unlink the creative") || errorMessage.toLowerCase().includes("unlink"))) {
                                  Swal.fire({
                                    title: "Warning",
                                    text: "the select creative is linked with live campaign",
                                    icon: "warning",
                                    confirmButtonText: "OK",
                                  });
                                } else {
                                  Swal.fire({
                                    title: "Error!",
                                    text: ` ${errorMessage}`,
                                    icon: "error",
                                  });
                                }
                              } finally {
                                setPopupLoading(false);
                              }
                            }}
                            onCancel={() => {
                              setShowPopup(false);
                              setPendingStatus(null);
                              setPendingRow(null);
                            }}
                            show={false}
                          />

                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  <div className="campaign-daily-table-wrapper">
                    <div className="dailyreporting-table-shell">
                      <div className="dailyreporting-table-inner">
                        <DataTable
                          className="groupsdatatable"
                          columns={buildColumns}
                          data={filteredData}
                          customStyles={customStyles}
                          highlightOnHover
                          striped
                          dense
                          pointerOnHover
                          persistTableHead
                          fixedHeader
                          fixedHeaderScrollHeight="100%"
                          responsive={false}
                          conditionalRowStyles={conditionalRowStyles}

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

                </Col>
                <Fragment>
                  <div
                    className="panel_Container brandpanel">
                    <div className="brandlist" >
                      <Row
                        className="inventory-row align-items-center border mt-2 py-2 px-3"
                        id="subtable"
                      >
                        <Col xs="12" md="2" className="d-flex align-items-center">
                          <i className="tim-icons icon-triangle-down me-2 opacity-75"></i>
                          <span className="brand-text mb-1">
                            {selectedBrandName || "Select a Creative"}
                          </span>
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
                                className={`tab-step d-flex align-items-center mx-2 px-2 py-1 ${isActive ? "active" : ""}`}
                              >
                                <i
                                  className={`tim-icons ${item.icon} me-2 ${isActive ? "" : "text-muted"}`}
                                  className={isActive ? "" : "text-muted"}
                                />
                                <span
                                  className={`fw-semibold ${isActive ? "" : "text-muted"
                                    }`}
                                  id="subgroupname"
                                  className={isActive ? "" : "text-muted"}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </Col>
                      </Row>
                      <div className="flex-grow-1" />
                    </div>
                  </div>
                  {step === 0 && <LinkedCampaigns selectedCreative={selectedCreative} />}
                </Fragment>
              </Row>
            </>
          )}
          {creative === null && !canViewUser && (
            <div className="alert alert-warning mt-3 creatives-alert-margin">
              <i className="fa fa-exclamation-triangle me-2"></i>
              <strong>Access Denied:</strong> You do not have permission to view the Creatives.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Creatives;
