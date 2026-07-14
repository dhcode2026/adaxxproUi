import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
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
import { FaCaretUp, FaCaretDown, FaCog } from "react-icons/fa";
import DataTable from "react-data-table-component";
import {
  listCreativesbrand,
  upadtestatusCreatives,
  getAllMyadslist,
} from "../views/api/Api";
import CustomizationModal from "./Modal/CustomizationModal";
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
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import LinkAdspop from "../views/Modal/LinkAds.jsx";
import { searchOptions } from "../Utils.js";

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
    1: "On",
    2: "Off",
    3: "Archived",
    1: "On",
    2: "Off",
    3: "Archived",
  };
  return statusMap[code] || code;
};

const DEFAULT_SELECTED_COLUMNS = [
  "ID",
  "Name",
  "Status",
  "Internal Review",
  "External Review",
  "Ad Vault Path",
  "Size",
  "Ad Type",
  "Preview",
  "Destination URL",
  "Imp. URL",
];

const getStatusCode = (text) => {
  const statusMap = {
    On: 1,
    Off: 2,
    Archived: 3,
  };
  return statusMap[text] || text;
};

const CreativesList = (props) => {
  const { brandId: urlBrandId } = useParams();
  const [currentBrandId, setCurrentBrandId] = useState(
    props.brandId || urlBrandId || null,
  );
  useEffect(() => {
    if (props.brandId && props.brandId !== currentBrandId) {
      setCurrentBrandId(props.brandId);
    }
  }, [props.brandId]);

  const NameCell = ({ row }) => {
    return (
      <div className="gOorhn">
        {row.name}
        {currentBrandId && (
          <span
            className="badge bg-secondary ms-2"
            style={{ fontSize: "0.65rem" }}
          ></span>
        )}
      </div>
    );
  };
  const IDCell = ({ row }) => {
    return <div className="gOorhn">{row.id}</div>;
  };

  const AddTypeCell = ({ row }) => {
    return <div className="gOorhn">{row.type}</div>;
  };

  const DestinationCell = ({ row }) => {
    return <div className="gOorhn">{row.destinationUrl}</div>;
  };
  const ImpressionCell = ({ row }) => {
    return <div className="gOorhn">{row.impressionTrackingUrl}</div>;
  };

  const PreviewCell = ({ row }) => {
    return (
      <div className="gOorhn">
        <a onClick={() => editPreviewCreative(row)}>{row.preview}</a>
      </div>
    );
  };
  const InternalReviewCell = ({ row }) => {
    const isPending = row.external_review
      ?.toLowerCase()
      .includes("waiting on internal approval");
    return (
      <div className="gOorhn" style={{ textAlign: "center" }}>
        {isPending && (
          <i
            className="fa fa-clock-o"
            style={{ fontSize: "15px" }}
            title="Pending internal approval"
          />
        )}
      </div>
    );
  };

  const SizeCell = ({ row }) => {
    const type = row.type?.toLowerCase();
    if (type === "audio" || type === "video") {
      return <div className="gOorhn">{row.duration || "30s"}</div>;
    }
    if (type === "native") {
      return <div className="gOorhn">-</div>;
    }
    return (
      <div className="gOorhn">
        {row.width ?? 0}x{row.height ?? 0}
      </div>
    );
  };

  const ExternalCell = ({ row }) => {
    return <div className="gOorhn">{row.external_review}</div>;
  };
  const AudienceActionsCell = ({ row }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);

    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="settings">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => editCreative(row)}>
            Edit List
          </DropdownItem>
          <DropdownItem onClick={(e) => showModal(e, row.id)}>
            Delete List
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const ActionStatusCell = ({ row }) => {
    const [currentStatus, setCurrentStatus] = useState(
      getStatusText(row.status || "On"),
    );
    const [statusOpen, setStatusOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      setCurrentStatus(getStatusText(row.status));
    }, [row.status]);

    const handleStatusChange = async (newStatusText) => {
      if (currentStatus === newStatusText || updating) return;
      setUpdating(true);
      try {
        const statusCode = getStatusCode(newStatusText);
        const response = await upadtestatusCreatives(row.id, statusCode);
        if (response.status === 200) {
          setCurrentStatus(newStatusText);
          setRowData((prev) =>
            prev.map((item) =>
              item.id === row.id ? { ...item, status: newStatusText } : item,
            ),
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

    return (
      <Dropdown
        isOpen={statusOpen}
        toggle={() => !updating && setStatusOpen((prev) => !prev)}
        disabled={updating}
      >
        <DropdownToggle
          tag="span"
          className="onoffbutton"
          style={{
            opacity: currentStatus === "Archived" ? 0.4 : updating ? 0.7 : 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: updating ? "wait" : "pointer",
          }}
        >
          {updating ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
            />
          ) : (
            <>
              {currentStatus}
              <FaCaretDown style={{ marginLeft: "5px" }} />
            </>
          )}
        </DropdownToggle>
        <DropdownMenu className="audiencemenu">
          {["On", "Off", "Archived"].map((status) => (
            <DropdownItem
              key={status}
              onClick={() => handleStatusChange(status)}
              active={currentStatus === status}
              disabled={updating}
            >
              <span className="conversionstatus">{status}</span>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    );
  };

  const loadDataOnce = async () => {
    await vx.getDbAudience();
  };

  const vx = useViewContext();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const toggleCustomizationModal = () =>
    setCustomizationModalOpen(!customizationModalOpen);
  const [selectedColumns, setSelectedColumns] = useState(
    DEFAULT_SELECTED_COLUMNS,
  );
  const datePickerRef = useRef(null);
  const toggleFilteradsModalOpen = () =>
    setFilterAdsModalOpen(!filteradsModalOpen);
  const [filteradsModalOpen, setFilterAdsModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [nativeModalOpen, setNativeModalOpen] = useState(false);
  const toggleBannerModal = () => setBannerModalOpen(!bannerModalOpen);
  const toggleAudioModal = () => setAudioModalOpen(!audioModalOpen);
  const toggleVideoModal = () => setVideoModalOpen(!videoModalOpen);
  const toggleNativeModal = () => setNativeModalOpen(!nativeModalOpen);
  const toggle = () => setDropdownOpen(!dropdownOpen);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState(null);
  const [videopreviewModalOpen, setVideoPreviewModalOpen] = useState(false);
  const toggleVideoPreviewModal = () =>
    setVideoPreviewModalOpen(!videopreviewModalOpen);
  const [audiopreviewModalOpen, setAudioPreviewModalOpen] = useState(false);
  const toggleAudioPreviewModal = () =>
    setAudioPreviewModalOpen(!audiopreviewModalOpen);
  const [bannerpreviewModalOpen, setBannerPreviewModalOpen] = useState(false);
  const toggleBannerPreviewModal = () =>
    setBannerPreviewModalOpen(!bannerpreviewModalOpen);
  const [bannereditorModalOpen, setBannereditorModalOpen] = useState(false);
  const toggleBannereditorModal = () =>
    setBannereditorModalOpen(!bannereditorModalOpen);
  const [audioeditorModalOpen, setAudioeditorModalOpen] = useState(false);
  const toggleAudioeditorModal = () =>
    setAudioeditorModalOpen(!audioeditorModalOpen);
  const [videoeditorModalOpen, setVideoeditorModalOpen] = useState(false);
  const toggleVideoeditorModal = () =>
    setVideoeditorModalOpen(!videoeditorModalOpen);
  const [nativeeditorModalOpen, setNativeeditorModalOpen] = useState(false);
  const toggleNativeeditorModal = () =>
    setNativeeditorModalOpen(!nativeeditorModalOpen);
  const [linkToCampaignsModalOpen, setLinkToCampaignsModalOpen] =
    useState(false);
  const toggleLinkToCampaignsModal = () =>
    setLinkToCampaignsModalOpen(!linkToCampaignsModalOpen);
  useEffect(() => {
    if (vx.loggedIn) loadDataOnce();
  }, []);

  const redraw = () => {
    setCount(count + 1);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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

  const [openSearchDropdown, setOpenSearchDropdown] = useState(false);
  const [searchType, setSearchType] = useState("ad_name"); // default
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
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

  // 🔥 FIX: Remove selected IDs that are no longer present in the data
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => rowData.some((item) => item.id === id)),
    );
  }, [rowData]);

  useEffect(() => {
    if (currentBrandId) {
      fetchMyadsList();
    }
  }, [currentBrandId]);

  const fetchMyadsList = async () => {
    setLoading(true);
    try {
      let allCreatives = [];
      if (currentBrandId) {
        console.log("Fetching creatives for brandId:", currentBrandId);
        const res = await listCreativesbrand(currentBrandId);
        console.log("Brand-specific API Response:", res.data);
        allCreatives =
          res.data?.data?.informationCreatives ||
          res.data?.informationCreatives ||
          [];
      } else {
        const res = await getAllMyadslist();
        allCreatives =
          res.data?.data?.informationCreatives ||
          res.data?.informationCreatives ||
          [];
      }
      const formatted = allCreatives.map((item) => {
        const type = (item.type || "").toLowerCase();
        let duration = null;
        if (type === "audio") {
          duration = item.audioDuration || item.duration || item.length || "";
        } else if (type === "video") {
          duration =
            item.vast_video_duration || item.duration || item.length || "";
        }
        return {
          id: item.creativesId,
          name: item.name || "Unnamed Creative",
          status: getStatusText(item.status || 1),
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
          vast_video_duration: item.vast_video_duration,
          originalData: item,
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

  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [rowData, searchTerm]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every((item) => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);

  const handleSelectAllChange = () => {
    const filteredIds = filteredData.map((item) => item.id);
    if (isAllFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const newSelected = [...prev];
        filteredIds.forEach((id) => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const NoDataComponent = () => (
    <div className="nogroupdataavilable">
      <div className="py-4  text-secondary">
        {currentBrandId
          ? "No Ads data available for this brand"
          : "No data available"}
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
      style: {},
    },
    headCells: {
      style: {
        borderRight: "1px solid #d4d4d4",
        borderTop: "1px solid #d4d4d4",
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

  const buildColumns = () => {
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
        cell: (row) => <AudienceActionsCell row={row} />,
        grow: 1,
        width: "100px",
      },
    ];

    selectedColumns.forEach((columnKey) => {
      if (ALL_COLUMNS[columnKey]) {
        columns.push(ALL_COLUMNS[columnKey]);
      }
    });

    return columns;
  };

  const ALL_COLUMNS = {
    ID: {
      name: "ID",
      selector: (row) => row.id,
      cell: (row) => <IDCell row={row} />,
      sortable: true,
      width: "100px",
    },
    Name: {
      name: "Name",
      selector: (row) => row.name,
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 3,
      width: "200px",
    },
    Status: {
      name: "Status",
      selector: (row) => row.status,
      cell: (row) => <ActionStatusCell row={row} />,
      sortable: true,
      width: "90px",
    },
    "Ad Type": {
      name: "Ad Type",
      selector: (row) => row.type,
      cell: (row) => <AddTypeCell row={row} />,
      sortable: true,
      width: "100px",
    },
    "Internal Review": {
      name: "Internal Review",
      selector: (row) =>
        row.external_review
          ?.toLowerCase()
          .includes("waiting on internal approval")
          ? "pending"
          : "approved",
      cell: (row) => <InternalReviewCell row={row} />,
      sortable: true,
      width: "150px",
      center: true,
    },
    "External Review": {
      name: "External Review",
      selector: (row) => row.external_review,
      cell: (row) => <ExternalCell row={row} />,
      sortable: true,
      width: "250px",
    },
    Size: {
      name: "Size",
      selector: (row) => {
        const type = row.type?.toLowerCase();
        if (type === "audio" || type === "video") {
          return row.duration || "30s";
        }
        if (type === "native") {
          return "-";
        }
        return `${row.width ?? 0}x${row.height ?? 0}`;
      },
      cell: (row) => <SizeCell row={row} />,
      sortable: true,
    },
    Preview: {
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

  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: "#e53e3e !important",
        "& .gOorhn": {
          color: "white !important",
        },
      },
    },
  ];

  const handleColumnChange = (newSelectedColumns) => {
    setSelectedColumns(newSelectedColumns);
  };

  const handleRowClicked = (row) => {
    setSelectedIds([row.id]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
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

  const handleCreativeModalCallback = (updatedCreative) => {
    console.log("Creative saved/updated:", updatedCreative);
    setBannerModalOpen(false);
    setAudioModalOpen(false);
    setVideoModalOpen(false);
    setNativeModalOpen(false);
    setSelectedCreative(null);
    refresh();
  };

  const editPreviewCreative = (creativeRow) => {
    const { type, originalData } = creativeRow;
    setSelectedCreative(originalData);
    switch (type?.toLowerCase()) {
      case "banner":
      case "banner":
        toggleBannerPreviewModal();
        break;
      case "audio":
        toggleAudioPreviewModal();
        break;
      case "video":
        toggleVideoPreviewModal();
        break;
      case "native":
        toggleNativeModal();
        break;
      default:
        console.warn("Unknown creative type:", type);
        alert(`Editing not supported for type: ${type}`);
        setSelectedCreative(null);
    }
  };

  const editCreative = (creativeRow) => {
    const { type, originalData } = creativeRow;
    setSelectedCreative(originalData);
    switch (type?.toLowerCase()) {
      case "banner":
      case "banner":
        toggleBannereditorModal();
        break;
      case "audio":
        toggleAudioeditorModal();
        break;
      case "video":
        toggleVideoeditorModal();
        break;
      case "native":
        toggleNativeeditorModal();
        break;
      default:
        console.warn("Unknown creative type:", type);
        alert(`Editing not supported for type: ${type}`);
        setSelectedCreative(null);
    }
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

  const exportToExcel = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = selectedColumns;
    const rows = filteredData.map((item) => {
      const rowObj = {};
      headers.forEach((colName) => {
        const colDef = ALL_COLUMNS[colName];
        if (colDef && typeof colDef.selector === "function") {
          rowObj[colName] = colDef.selector(item);
        } else {
          rowObj[colName] = item[colName] || "";
        }
      });
      return rowObj;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Creatives");
    const fileName = `creatives_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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

  return (
    <div className="content1">
      <div className="content-wrapper">
        {modal && (
          <DecisionModal
            title="Really delete Group?"
            message="Only the db admin can undo this if you delete it!!!"
            name="DELETE"
            callback={modalCallback}
          />
        )}
        {creative === null && (
          <>
            <Row>
              <Col xs="12">
                <div className="row ">
                  <div className="col-xl-12 col-lg-12">
                    <Row className="align-items-center">
                      
                      <Col md="1" className="p-0 ms-2 mt-2" id="maximing">
                        <div className="position-relative ms-4">
                          <Input
                            className="form-control py-1 px-1 mb-2 rounded-0 adsheight custom-select-input"
                            type="text"
                            id="seaching"
                            placeholder="Search"
                            style={{ fontSize: "0.685rem" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                          />
                        </div>
                      </Col>

                      <Col md="2" className="p-0  mt-2">
                        <div className="d-flex position-relative">
                         
                          <div
                            className="position-relative"
                            style={{ width: "220px" }}
                          >
                            <div
                            id="refresh"
                              className="form-control py-1 px-1 mb-2 rounded-0 adsheight normalized-input custom-select-input d-flex justify-content-between align-items-center cursor-pointer"
                              onClick={() =>
                                setOpenSearchDropdown(!openSearchDropdown)
                              }
                            >
                              <span style={{ fontSize: "0.7rem" }}>
                                 Search by:{" "}
                                {
                                  searchOptions.find(
                                    (opt) => opt.value === searchType,
                                  )?.label
                                }
                              </span>
                              <FaCaretDown />
                            </div>

                            {openSearchDropdown && (
                              <div className="custom-dropdown-menu w-100">
                                {searchOptions.map((opt, idx) => (
                                  <div
                                    key={idx}
                                    className={`custom-dropdown-option ${
                                      searchType === opt.value ? "selected" : ""
                                    }`}
                                    onClick={() => {
                                      setSearchType(opt.value);
                                      setOpenSearchDropdown(false);
                                    }}
                                  >
                                    <span className="tick-icon">
                                      {searchType === opt.value && "✓"}
                                    </span>
                                    <span>{opt.label}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>

                      <Col xs="auto" className="p-0 ms-2">
                        <Button
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                          type="button"
                          id="filtersads"
                          onClick={toggleFilteradsModalOpen}
                        >
                          Filter Ads
                        </Button>
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
                      <Col md="2"></Col>
                      <Col xs="auto" className="p-0 me-2 ">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                          id="comeagian"
                          onClick={async () => {
                            if (selectedIds.length === 0) {
                              showValidationError();
                              return;
                            }

                            const targetRows = rowData.filter(item => selectedIds.includes(item.id));
                            const hasNonApproved = targetRows.some(row => {
                              const reviewVal = String(row.external_review || "Approved").trim().toLowerCase();
                              return reviewVal !== "approved" && !reviewVal.includes("waiting");
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

                            toggleLinkToCampaignsModal();
                          }}
                        >
                          <span className="linkto">Link To Campaigns</span>
                        </Button>
                      </Col>
                      <Col xs="auto" className="p-0 me-2 ">
                        <Dropdown
                          isOpen={dropdownOpen}
                          toggle={toggle}
                          className="new-dropdown"
                        >
                          <DropdownToggle
                            className="form-control py-1 px-1 rounded-0 adsheight custom-select-input d-flex justify-content-center align-items-center"
                            id="maindropdowns"
                          >
                            <span className="linkto"> New Ad </span>

                            {dropdownOpen ? (
                              <FaCaretUp
                                style={{
                                  fontSize: "12px",
                                  marginLeft: "5px",
                                  color: "white",
                                }}
                              />
                            ) : (
                              <FaCaretDown
                                style={{
                                  fontSize: "12px",
                                  marginLeft: "5px",
                                  color: "white",
                                }}
                              />
                            )}
                          </DropdownToggle>

                          <DropdownMenu className="dropdown-menu-custom">
                            <DropdownItem>
                              <div className="maindropdown">
                                <div
                                  className="menting"
                                  id=""
                                  onClick={async () => {
                                    toggleBannerModal();
                                  }}
                                >
                                  Image Ad
                                </div>

                                <div
                                  className="menting"
                                  onClick={async () => {
                                    toggleAudioModal();
                                  }}
                                >
                                  Audio Ad
                                </div>

                                <div
                                  className="menting"
                                  onClick={async () => {
                                    toggleVideoModal();
                                  }}
                                >
                                  Video Ad
                                </div>

                                <div
                                  className="menting"
                                  onClick={async () => {
                                    toggleNativeModal();
                                  }}
                                >
                                  Native Ad
                                </div>
                              </div>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </Col>
                      <Col xs="auto" className="p-0">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                          id="export"
                          onClick={exportToExcel}
                        >
                          <span className="lasttime">Export</span>
                        </Button>
                      </Col>
                      <Col xs="auto" className="">
                        <Button
                          type="btn"
                          className="form-control py-1 px-1 rounded-0 adsheight custom-select-input"
                          id="export"
                          onClick={toggleCustomizationModal}
                        >
                          <span className="lasttime">
                            Customization Columns
                          </span>
                        </Button>
                      </Col>
                    </Row>
                    <FilterAdsModal
                      isOpen={filteradsModalOpen}
                      toggle={toggleFilteradsModalOpen}
                    />

                    <CustomizationModal
                      isOpen={customizationModalOpen}
                      toggle={toggleCustomizationModal}
                      selectedColumns={selectedColumns}
                      setSelectedColumns={handleColumnChange}
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
                    <LinkAdspop
                      isOpen={linkToCampaignsModalOpen}
                      toggle={toggleLinkToCampaignsModal}
                      brandId={currentBrandId}
                      creatives={selectedIds}
                      onLinked={refresh}
                    />
                  </div>
                </div>
                <div className="flex-grow-1 position-relative table-container">
                  <DataTable
                    className="groups1datatable"
                    columns={buildColumns()}
                    data={filteredData}
                    progressPending={loading}
                    progressComponent={<CustomLoader />}
                    striped
                    dense
                    fixedHeader
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
            </Row>
          </>
        )}
      </div>
    </div>
  );
};

export default CreativesList;
