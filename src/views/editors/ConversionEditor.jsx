import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Button,
  Row,
  Col,
  Table,
  Input,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Label,
} from "reactstrap";
import { useViewContext } from "../../ViewContext";
import { useGlobalTabs } from "../../context/TabContext";
import {
  FaEdit,
  FaTrash,
  FaCog,
  FaCaretUp,
  FaCaretDown,
  FaRegWindowClose,
} from "react-icons/fa";
import ConversionModal from "../Modal/ConversionModal";
import ConversionGetCodeModal from "../Modal/ConversionGetCodeModal";
import DataTable from "react-data-table-component";
import { getConversionlist, editConversion, getConversionEvent } from "../api/Api";
import Swal from "sweetalert2";

const DEFAULT_BRAND_ID = 39;
const normalizeBrandId = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getMmpTypeValue = (item) =>
  item?.mmType ??
  item?.mmpType ??
  item?.mmp_type ??
  item?.mm_type ??
  item?.mmpName ??
  item?.mmp_name ??
  item?.mmtype ??
  item?.name ??
  item?.type ??
  null;

const getMmpIdValue = (item) =>
  item?.conversionId ??
  item?.conversion_id ??
  item?.mmpId ??
  item?.mmp_id ??
  item?.id ??
  null;

const getTrackedMmpIdValue = (item) =>
  item?.mmpId ?? item?.mmp_id ?? item?.conversionId ?? item?.id ?? null;

const getConversionBaseUrlValue = (item) =>
  item?.baseUrl ??
  item?.base_url ??
  item?.baseurl ??
  item?.conversionUrl ??
  item?.conversion_url ??
  item?.url ??
  "";

const getConversionImpressionUrlValue = (item) =>
  item?.impressionUrl ??
  item?.impression_url ??
  item?.viewthroughConversionUrl ??
  item?.viewthrough_conversion_url ??
  item?.viewThroughConversionUrl ??
  "";

const ConversionEditor = (props) => {
  const onMmpSelectionChangeRef = useRef(props.onMmpSelectionChange);
  const onMmpIdChangeRef = useRef(props.onMmpIdChange);

  useEffect(() => {
    onMmpSelectionChangeRef.current = props.onMmpSelectionChange;
  }, [props.onMmpSelectionChange]);

  useEffect(() => {
    onMmpIdChangeRef.current = props.onMmpIdChange;
  }, [props.onMmpIdChange]);

  useEffect(() => {
    settrackedconversion(props.trackeddata || []);
  }, [props.trackeddata]);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [rowData, setRowData] = useState([]);
  const guideLineRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const tableScrollRef = useRef(null);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const [getCodeModalOpen, setGetCodeModalOpen] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [selectedConversionForCode, setSelectedConversionForCode] = useState(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [codePidValue, setCodePidValue] = useState("");
  const [selectedMmpType, setSelectedMmpType] = useState(null);
  const [mmpDropdownOpen, setMmpDropdownOpen] = useState(false);

  const toggleconversiontModal = () =>
    setConversionModalOpen(!conversionModalOpen);

  const toggleGetCodeModal = () => {
    setGetCodeModalOpen(!getCodeModalOpen);
    if (getCodeModalOpen) {
      setSelectedConversionForCode(null);
      setCodePidValue("");
    }
  };

  const [conversiondata, setconversiondata] = useState();
  const [trackedconversion, settrackedconversion] = useState(props.trackeddata || []);
  const [resolvedConversionList, setResolvedConversionList] = useState([]);
  const [allConversionList, setAllConversionList] = useState([]);
  const vx = useViewContext();
  const { addTab } = useGlobalTabs();

  useEffect(() => {
    if (Array.isArray(props.conversionlist) && props.conversionlist.length > 0) {
      setResolvedConversionList(props.conversionlist);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getConversionlist();
        const data = res?.data;
        const list =
          data?.data?.informationConversion ||
          data?.informationConversion ||
          data?.data?.data?.informationConversion ||
          [];
        if (!cancelled) setResolvedConversionList(list);
      } catch (e) {
        if (!cancelled) setResolvedConversionList([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.conversionlist]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getConversionlist();
        const data = res?.data;
        const list =
          data?.data?.informationConversion ||
          data?.informationConversion ||
          data?.data?.data?.informationConversion ||
          [];

        if (!cancelled) {
          setAllConversionList(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAllConversionList([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // If a brand has only one MMP type (e.g., brandId=39 => AppsFlyer),
  // auto-select it so the UI doesn't show unrelated options or an empty state.
  useEffect(() => {
    if (selectedMmpType) return;
    const sourceList =
      Array.isArray(allConversionList) && allConversionList.length > 0
        ? allConversionList
        : resolvedConversionList;
    const realTypes = [...new Set((sourceList || []).map(getMmpTypeValue).filter(Boolean))];
    if (realTypes.length === 1) {
      setSelectedMmpType(realTypes[0]);
    }
  }, [allConversionList, resolvedConversionList, selectedMmpType]);

  const [columnWidths, setColumnWidths] = useState({
    actions: "10%",
    name: "30%",
    default_value: "20%",
  });

  const loadDataOnce = async () => {
    await vx.getDbConversion();
  };

  useEffect(() => {
    const fetchEvents = async () => {
      if (selectedMmpType && selectedMmpType !== "All" && selectedMmpType !== "Select MMP") {
        const mmpSourceList =
          Array.isArray(allConversionList) && allConversionList.length > 0
            ? allConversionList
            : resolvedConversionList;
        const selectedMmp = (mmpSourceList || []).find(
          (mmp) => getMmpTypeValue(mmp) === selectedMmpType
        );
        const selectedMmpId = selectedMmp ? getMmpIdValue(selectedMmp) : null;
        if (selectedMmpId) {
          onMmpIdChangeRef.current?.(selectedMmpId);
          onMmpSelectionChangeRef.current?.({
            mmpId: selectedMmpId,
            mmType: selectedMmpType,
            pid: selectedMmp?.pid ?? "",
            baseUrl: getConversionBaseUrlValue(selectedMmp),
            impressionUrl: getConversionImpressionUrlValue(selectedMmp),
          });
          try {
            const res = await getConversionEvent(selectedMmpId);
            if (
              res &&
              res.data &&
              res.data.status === 200 &&
              res.data.data &&
              res.data.data.conversionEvents
            ) {
              const events = res.data.data.conversionEvents.map((event) => ({
                ...event,
                name: event.eventName,
                conversionId: event.conversionEventId,
                defaultValue: event.eventValue,
                mmType: selectedMmpType,
                mmpId: selectedMmpId,
              }));
              setconversiondata(events);
            } else {
              setconversiondata([]);
            }
          } catch (error) {
            setconversiondata([]);
          }
        }
      } else {
        setconversiondata(resolvedConversionList);
        if (selectedMmpType === "Select MMP" || selectedMmpType === "All") {
          onMmpIdChangeRef.current?.("");
          onMmpSelectionChangeRef.current?.({
            mmpId: "",
            mmType: "",
            pid: "",
            baseUrl: "",
            impressionUrl: "",
          });
        }
      }
    };

    if (vx.loggedIn) {
      loadDataOnce();
    }
    fetchEvents();
  }, [allConversionList, resolvedConversionList, selectedMmpType]);

  useEffect(() => {
    const conversionData = sortedCreatives()
      .filter((e) => e != null)
      .map((row, index) => ({
        index: index + 1,
        name: row.name,
        customer_id: row.customer_id,
        default_value: row.default_value,
        id: row.id,
        row,
      }));
    setRowData(conversionData);
  }, [vx]);

  const redraw = () => {
    setCount(count + 1);
  };

  const ConversionActionsCell = ({ data }) => {
    const row = data.row;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="editbrand">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem
            onClick={() => {
              handleGetTags(row);
            }}
          >
            Get Tags
          </DropdownItem>
          <DropdownItem>Audience Capture</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };

  const handleGetTags = async (row) => {
    setLoadingCode(true);
    setGetCodeModalOpen(true);
    setSelectedConversionForCode(row);

    try {
      const response = await editConversion(row.conversionId || row.id);

      const conversionDetail =
        response?.data?.data?.informationConversion?.[0] || {};

      const conversionWithDetails = {
        ...row,
        name: row.name || conversionDetail.name || "Conversion",
        securityToken:
          conversionDetail.securityToken || row.securityToken || "",
        pid: conversionDetail.pid || "",
      };

      setCodePidValue(conversionWithDetails.pid);
      setSelectedConversionForCode(conversionWithDetails);
    } catch (err) {
      setCodePidValue("");
    } finally {
      setLoadingCode(false);
    }
  };

  const ConversionTrackCell = ({ data }) => {
    const row = data.row;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggle = () => setDropdownOpen(!dropdownOpen);
    return (
      <Dropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle tag="span" className="editbrand">
          <FaCog style={{ marginRight: "5px" }} />
          <FaCaretDown />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => handlePrimaryChange(row, true)}>
            Primary Conversion
          </DropdownItem>
          <DropdownItem onClick={() => handlePrimaryChange(row, false)}>
            Secondary Conversion
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  };
  const handleMouseDown = (e, colKey) => {
    e.preventDefault();
    resizingCol.current = colKey;
    startX.current = e.clientX;
    // Extract numeric value from width string (e.g., "10%" -> 10)
    const currentWidth = parseInt(columnWidths[colKey]);
    startWidth.current = currentWidth;
    const tableRect = tableWrapperRef.current.getBoundingClientRect();
    const guideLine = guideLineRef.current;
    guideLine.style.top = "0px";
    guideLine.style.height = tableWrapperRef.current.offsetHeight + "px";
    guideLine.style.left = `${e.clientX - tableRect.left}px`;
    guideLine.style.display = "block";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";
  };

  const sortRows = (key) => {
    setLoading(true);
    setTimeout(() => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc")
        direction = "desc";
      const sorted = [...rowData].sort((a, b) => {
        let valA = a[key]?.toString().toLowerCase() || "";
        let valB = b[key]?.toString().toLowerCase() || "";
        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
      });

      setRowData(sorted);
      setSortConfig({ key, direction });
      setLoading(false);
    }, 900);
  };

  const handleHeaderClick = (index) => {
    setSelectedHeader(index);
  };

  const handleMouseUp = (e) => {
    if (!resizingCol.current) return;
    const dx = e.clientX - startX.current;
    const tableRect = tableWrapperRef.current.getBoundingClientRect();
    const tableWidth = tableRect.width;
    // Calculate percentage change based on table width
    const widthChangePercent = (dx / tableWidth) * 100;
    const newWidthPercent = Math.max(
      startWidth.current + widthChangePercent,
      5,
    ); // Minimum 5%
    setColumnWidths((prev) => ({
      ...prev,
      [resizingCol.current]: `${newWidthPercent}%`,
    }));
    guideLineRef.current.style.display = "none";
    resizingCol.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
  };

  const handleMouseMove = (e) => {
    if (!resizingCol.current) return;
    const tableRect = tableWrapperRef.current.getBoundingClientRect();
    let posX = e.clientX - tableRect.left;
    posX = Math.max(0, Math.min(posX, tableRect.width));
    guideLineRef.current.style.left = `${posX}px`;
  };

  const sortedCreatives = () => {
    const conversion = vx.conversion || [];
    const sorted = [...conversion];
    sorted.sort((a, b) => {
      const valA = a.customer_id + a.name;
      const valB = b.customer_id + b.name;
      return (valA > valB) - (valA < valB);
    });
    return sorted;
  };

  const tableStyle = {
    // tableLayout: 'fixed',
    // width: '100%',
    // minWidth: '600px'
  };

  const cellStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    verticalAlign: "middle",
  };

  const columns = useMemo(() => [
    {
      name: " Event Name",
      selector: (row) => row.name || row.eventName || row.mmType,
      sortable: true,
      center: true,
      width: "40%",
    },
    {
      name: "ID",
      selector: (row) => row.conversionId,
      sortable: true,
      center: true,
      width: "20%",
    },
    {
      name: "Default Value",
      selector: (row) => row.defaultValue,
      sortable: true,
      center: true,
      width: "20%",
    },
    {
      name: "",
      width: "20%",
      button: true,
      ignoreRowClick: true,
      cell: (row) => {
        let istracked = trackedconversion.some(
          (data) => data.conversionId == row.conversionId,
        );
        return istracked ? (
          <span className="device-targettext  text-nowrap">Tracking</span>
        ) : (
          <div className="d-flex align-items-center h-100">
            <button
              className="conversion-track-btn text-nowrap mt-1 mb-1"
              type="button"
              onClick={() => {
                handletrackdata(row);
              }}
            >
              Track
            </button>
          </div>
        );
      },
    },
  ], [trackedconversion]);
  const Trackedcolumns = useMemo(() => [
    {
      name: "Primary",
      selector: (row) => row.isPrimary,
      sortable: true,
      center: true,
      width: "15%",
      cell: (row) => (
        <Input
          type="checkbox"
          className="rounded-0"
          checked={!!row.isPrimary}
          onChange={() => handlePrimaryChange(row)}
        />
      ),
    },

    {
      name: "Event Name",
      selector: (row) => row.name || row.eventName || row.mmType,
      sortable: true,
      center: true,
      width: "35%",
    },

    {
      name: "$ Default Value",
      selector: (row) => row.defaultValue,
      sortable: true,
      center: true,
      width: "20%",
    },
    {
      name: "Actions",
      selector: (row) => row.actions,
      sortable: false,
      center: true,
      width: "15%",
      cell: (row) => <ConversionTrackCell data={{ row }} />,
    },
    {
      name: "",
      width: "15%",
      button: true,
      center: true,

      cell: (row) => {
        return (
          <button
            className=" ms-auto device-targetbutton border-0 bg-transparent text-nowrap"
            type="button"
            onClick={() => handleTrackeddelete(row)}
          >
            <FaRegWindowClose size={15} />
          </button>
        );
      },
    },
  ], []);

  const handletrackdata = async (row) => {
    let isPrimary = false;

    const hasPrimary = trackedconversion.some((c) => c.isPrimary);

    if (!hasPrimary) {
      const result = await Swal.fire({
        title: "Primary Conversion",
        text: "Do you want to make this a Primary Conversion?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      });
      if (result.isConfirmed) {
        isPrimary = true;
      }
    }

    const newRow = { ...row, isPrimary };

    settrackedconversion((prev) => {
      const updated = prev.some(
        (old) => old.conversionId === row.conversionId
      )
        ? prev
        : [...prev, newRow];

      // send updated list of names to parent
      props.handletraceddata(updated.map((r) => r.name));
      props.h_trackedconversion(updated);

      return updated;
    });
  };

  const handlePrimaryChange = (row, status) => {
    settrackedconversion((prev) => {
      // If status is not provided, it's a toggle from the checkbox
      const targetItem = prev.find(
        (item) => item.conversionId === row.conversionId,
      );
      const willBePrimary = status !== undefined ? status : !targetItem?.isPrimary;

      const updated = prev.map((item) => ({
        ...item,
        isPrimary:
          item.conversionId === row.conversionId
            ? willBePrimary
            : willBePrimary
              ? false // If we are setting a new primary, unset everyone else
              : item.isPrimary,
      }));

      // update parent
      props.h_trackedconversion(updated);
      return updated;
    });
  };

  const handleTrackeddelete = (row) => {
    settrackedconversion((prev) => {
      const updated = prev.filter(
        (old_data) => old_data.conversionId != row.conversionId,
      );
      // update parent with the new list
      props.handletraceddata(updated.map((r) => r.name));
      props.h_trackedconversion(updated);
      return updated;
    });
  };

  const customStyles = {
    table: {
      style: {
        border: "1px solid #e5e7eb",
      },
    },
    tableWrapper: {
      style: {
        height: "auto",
      },
    },
    headRow: {
      style: {
        fontSize: "12px",
        minHeight: "23px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: "0px",
        paddingRight: "0px",
        backgroundColor: "#F2F2F2",
        "&:hover": {
          backgroundColor: "#F2F2F2",
        },
        borderRight: "1px solid #dee2e6",
      },
    },
    rows: {
      style: {
        minHeight: "23px",
      },
      stripedStyle: {
        backgroundColor: "#F2F2F2",
      },
      highlightOnHoverStyle: {
        backgroundColor: "#F2F2F2",
        cursor: "pointer",
      },
    },
    cells: {
      style: {
        paddingRight: "7px",
        paddingTop: "2px",
        paddingBottom: "2px",
        fontSize: "12px",
        fontWeight: 400,
        color: "rgb(48, 48, 48)",
      },
    },
  };

  const mmpOptionsSource =
    Array.isArray(allConversionList) && allConversionList.length > 0
      ? allConversionList
      : resolvedConversionList;

  const uniqueMmpTypes = [
    "Select MMP",
    ...new Set(
      (mmpOptionsSource || [])
        .map((item) => getMmpTypeValue(item))
        .filter(Boolean)
    ),
  ];

  // Initialize MMP type based on mmpId passed from parent
  useEffect(() => {
    if (props.mmpId && ((allConversionList && allConversionList.length > 0) || (resolvedConversionList && resolvedConversionList.length > 0))) {
      const selectedConversion = (allConversionList.length > 0 ? allConversionList : resolvedConversionList).find((item) => (
        Number(getMmpIdValue(item)) === Number(props.mmpId) ||
        Number(item?.id) === Number(props.mmpId) ||
        Number(item?.mmpId) === Number(props.mmpId)
      ));

      const mmpType = selectedConversion ? getMmpTypeValue(selectedConversion) : null;
      if (mmpType) {
        setSelectedMmpType(mmpType);
        onMmpSelectionChangeRef.current?.({
          mmpId: props.mmpId,
          mmType: mmpType,
          pid: selectedConversion?.pid ?? "",
          baseUrl: getConversionBaseUrlValue(selectedConversion),
          impressionUrl: getConversionImpressionUrlValue(selectedConversion),
        });
        return;
      }
    }
  }, [props.mmpId, allConversionList, resolvedConversionList]);

  // On full page refresh, edit campaigns can load tracked events before `mmpId` is set/known.
  // Auto-select the MMP based on the first tracked event so the tracked table doesn't look empty.
  useEffect(() => {
    if (props.mmpId) return;
    if (selectedMmpType) return;
    if (!Array.isArray(trackedconversion) || trackedconversion.length === 0) return;

    const firstTracked = trackedconversion.find((e) => e != null) || null;
    const trackedMmpId = getTrackedMmpIdValue(firstTracked);
    const trackedMmpType = getMmpTypeValue(firstTracked);

    if (trackedMmpId) {
      onMmpIdChangeRef.current?.(trackedMmpId);
    }

    if (trackedMmpType) {
      setSelectedMmpType(trackedMmpType);
      return;
    }

    if (trackedMmpId && ((Array.isArray(allConversionList) && allConversionList.length > 0) || (Array.isArray(resolvedConversionList) && resolvedConversionList.length > 0))) {
      const matched = (allConversionList.length > 0 ? allConversionList : resolvedConversionList).find(
        (m) => String(getMmpIdValue(m)) === String(trackedMmpId),
      );
      const mmpType = matched ? getMmpTypeValue(matched) : null;
      if (mmpType) setSelectedMmpType(mmpType);
    }
  }, [allConversionList, props.mmpId, resolvedConversionList, selectedMmpType, trackedconversion]);

  const filteredConversionData = (conversiondata || []).filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item?.name?.toLowerCase().includes(term) ||
      String(item?.conversionId).includes(term) ||
      String(item?.defaultValue).includes(term);

    const matchesMmpType =
      selectedMmpType === "All" || getMmpTypeValue(item) === selectedMmpType;

    return matchesSearch && matchesMmpType;
  });

  const filteredTrackedConversionData = trackedconversion.filter((item) => {
    if (!selectedMmpType || selectedMmpType === "Select MMP") {
      return false;
    }
    if (selectedMmpType === "All") return true;
    const matchedMmp = (allConversionList.length > 0 ? allConversionList : resolvedConversionList).find(
      (m) => String(getMmpIdValue(m)) === String(getTrackedMmpIdValue(item))
    );
    const itemMmpType = getMmpTypeValue(item) || getMmpTypeValue(matchedMmp);
    return itemMmpType === selectedMmpType;
  });

  const handleRemoveAll = () => {
    settrackedconversion([]);
    props.handletraceddata([]);
    props.h_trackedconversion([]);
  };

  return (
    <Row className="">
    
        <Row className="pl-md-1 mb-2 mt-3 campaign-basics-top-row">
          {props.renderTrackConversions && props.renderTrackConversions()}

          <Col md="4" sm="12" className="campaign-field mb-3">
            <Label className="forms-labels">Search</Label>
            <div className="mt-2" style={{ height: "42px" }}>
              <Input
                className="form-control normalized-input campagineditor  form-control"
                placeholder="search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Col>

          <Col md="4" sm="12" className="campaign-field mb-3">
            <Label className="forms-labels">Select MMP</Label>
            <div className="mt-2 position-relative" id="mmp-status-wrapper" style={{ height: "42px" }}>
              <div
                className="form-control normalized-input campaign-btn campagineditor d-flex align-items-center justify-content-between"
                onClick={() => setMmpDropdownOpen(!mmpDropdownOpen)}
                tabIndex={0}
              >
                <span className="text-truncate">
                  {selectedMmpType && selectedMmpType !== "All"
                    ? selectedMmpType
                    : "Select MMP"}
                </span>
                <FaCaretDown
                  className={`custom-select-icon ${mmpDropdownOpen ? "open" : ""}`}
                  style={{ color: "black" }}
                />
              </div>

              {mmpDropdownOpen && (
                <div
                  className="custom-dropdown-menu biddeript-b"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    zIndex: 1000,
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    marginTop: "2px",
                  }}
                >
                  {uniqueMmpTypes.map((type, idx) => {
                    const isSelected = type === "Select MMP"
                      ? (selectedMmpType === null || selectedMmpType === "Select MMP")
                      : selectedMmpType === type;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const newMmpType = type;
                          setSelectedMmpType(newMmpType);
                          setMmpDropdownOpen(false);

                          const mmpSourceList = Array.isArray(allConversionList) && allConversionList.length > 0
                            ? allConversionList
                            : resolvedConversionList;
                          const selectedMmp = (mmpSourceList || []).find(
                            (mmp) => getMmpTypeValue(mmp) === newMmpType
                          );
                          const selectedMmpId = selectedMmp ? getMmpIdValue(selectedMmp) : null;

                          const updated = (trackedconversion || []).filter((item) => {
                            if (!newMmpType || newMmpType === "Select MMP") return false;
                            const itemMmpId = getTrackedMmpIdValue(item);
                            const itemMmpType = getMmpTypeValue(item);
                            if (String(itemMmpId) === String(selectedMmpId) || itemMmpType === newMmpType) {
                              return true;
                            }
                            const matchedMmp = mmpSourceList.find(
                              (m) => String(getMmpIdValue(m)) === String(itemMmpId)
                            );
                            const resolvedType = getMmpTypeValue(matchedMmp);
                            return resolvedType === newMmpType;
                          });

                          settrackedconversion(updated);
                          props.handletraceddata?.(updated.map((r) => r.name));
                          props.h_trackedconversion?.(updated);
                        }}
                        className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                        style={{ border: "none" }}
                      >
                        <span
                          className="tick-icon"
                          style={{
                            width: "15px",
                            display: "inline-block",
                            fontSize: "12px",
                          }}
                        >
                          {isSelected && "✓"}
                        </span>
                        <span>{type}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Col>
        </Row>

        <Row className="linkads mt-2">
          <Col style={{ padding: "0 31px" }}>
            <Row className="align-items-center mb-3">
              <Col sm="6">
                <div className="py-1 selinv-header p-0">
                  <label className="fw-semibold ftlink mb-0">
                    Available Events
                  </label>
                </div>
              </Col>
              <Col sm="6" className="d-flex align-items-center justify-content-between">
                <div className="py-1 selinv-header p-0">
                  <label className="fw-semibold ftlink mb-0">
                    Tracked Events
                  </label>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <span className="device-match m-0 p-0" style={{ fontSize: "12px" }}>
                    {filteredTrackedConversionData.length} Conversion
                  </span>
                  <button
                    className="device-targetall conversion-track-btn border m-0"
                    type="button"
                    onClick={handleRemoveAll}
                  >
                    Remove All
                  </button>
                </div>
              </Col>
            </Row>
            <ConversionModal
              isOpen={conversionModalOpen}
              toggle={toggleconversiontModal}
              conversion={selectedConversion}
              brandId={props.brandId}
              callback={(updatedBanner) => {
                props.onUpdate?.();
              }}
            />
            <ConversionGetCodeModal
              isOpen={getCodeModalOpen}
              toggle={toggleGetCodeModal}
              conversion={selectedConversionForCode}
              pid={codePidValue}
              loading={loadingCode}
            />
            <Row className="mt-2">
              <Col
                sm="12"
                md="12"
                className="table-responsive"
                style={{ overflowX: "auto" }}
              >
                <div ref={tableWrapperRef}>
                  <Row className="">
                    <Col sm="6" className="p-0">
                      <DataTable
                        onRowClicked={(row) =>
                          setSelectedRowId(row.conversionId)
                        }
                        className="p-0"
                        key={"bidders-table-" + count}
                        columns={columns}
                        data={filteredConversionData}
                        progressPending={loading}
                        striped
                        highlightOnHover
                        pointerOnHover
                        persistTableHead
                        fixedHeader
                        fixedHeaderScrollHeight="200px"
                        customStyles={customStyles}
                        noDataComponent={
                          <div
                            className="text-secondary py-5"
                            style={{ fontSize: "12px" }}
                          >
                            No data available
                          </div>
                        }
                        progressComponent={
                          <div className="py-5 d-flex align-items-center">
                            <div className="loader" />
                            <span className="ms-2 fw-bold">Loading...</span>
                          </div>
                        }
                        conditionalRowStyles={[
                          {
                            when: (row) => row.id === selectedRowId,
                            style: {
                              backgroundColor: "#eef4ff",
                            },
                          },
                        ]}
                      />
                    </Col>
                    <Col sm="6" className="pe-0">
                      <DataTable
                        className=""
                        columns={Trackedcolumns}
                        data={filteredTrackedConversionData}
                        customStyles={customStyles}
                        persistTableHead
                        striped
                        highlightOnHover
                        fixedHeader
                        fixedHeaderScrollHeight="200px"
                        noDataComponent={
                          <div
                            className="text-secondary py-5"
                            style={{ fontSize: "12px" }}
                          >
                            No Event found
                          </div>
                        }
                      ></DataTable>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md="9" sm="12" className="p-0">
                <div role="alert" className="hows ">
                  <i
                    className="fa fa-info-circle me-2"
                    id="mesaasgeicon"
                  ></i>
                  "Target only impressions with an ID" was turned on for
                  best performance (in the Devices tab).{" "}
                  <span className="maxbiding">Trun off</span>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>


    
    </Row>
  );
};

export default ConversionEditor;
