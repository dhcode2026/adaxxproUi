import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { Button, Card, CardBody, Row, Col, Input, Collapse } from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import { FaCaretDown, FaChevronRight, FaChevronDown, FaCaretRight, FaCaretLeft } from "react-icons/fa";
import CountriesModal from "./Modal/CountriesRegionsModal";
import DataTable from "react-data-table-component";
import { getAllKibanaCountry, getAllExchange, getAllkibanapublisher } from "./api/Api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/devices.css";
const allowedExchanges = ["pubmatic", "vlion", "eqativ"];

var undef;

const Locations = (props) => {
  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [inventoryData, setInventoryData] = useState([]);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    "Type",
    "Country",
    "State",
    "City",
    "Yesterday Auction",
    "Observed CPM",
  ]);
  const toggleCustomizationModal = () =>
    setCustomizationModalOpen(!customizationModalOpen);
  const [loading, setLoading] = useState(false);
  const [sortLoading, setSortLoading] = useState(false);
  const sortLoaderTimerRef = useRef(null);
  const [selectedInventory, setSelectedInventory] = useState(null);

  // Ad Size - now an array for multi-select
  const [size, setSize] = useState([]);
  const [openAdSize, setOpenAdSize] = useState(false);
  const adSizeRef = useRef(null);

  const [openExchanges, setopenExchanges] = useState(false);
  const exchangesRef = useRef(null);
  const [exchanges, setExchanges] = useState([]);

  const [selectedExchanges, setSelectedExchanges] = useState([]);
  const handleRemoveExchange = (value) => {
    setSelectedExchanges(selectedExchanges.filter((item) => item !== value));
  };
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const [canCreateUser, setCanCreateUser] = useState(false);

  const handleExchangesTypeSelect = (input) => {
    const value = typeof input === "string" ? input : input.target.value;
    if (!value) return;

    if (selectedExchanges.includes(value)) {
      setSelectedExchanges(selectedExchanges.filter((item) => item !== value));
    } else {
      setSelectedExchanges([...selectedExchanges, value]);
    }
  };

  // Use global tabs
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
    firstName,
    lastName,
  } = useGlobalTabs();

  useEffect(() => {
    initializePageTab("Locations", "fa fa-map-marker", "/admin/Locations");
  }, [initializePageTab]);

  useEffect(() => {
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : localStorage.getItem("username") || "User";
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-map-marker me-2"></i>
          Locations - <i>{selectedInventory?.name || displayName}</i>
        </>
      ),
    });
  }, [selectedInventory, updateTab, firstName, lastName]);
  useEffect(() => {
    const hasCreatePermission = canCreate("Locations");
    const hasViewPermission = canView("Locations");
    const hasEditPermission = canEdit("Locations");
    const hasDeletePermission = canDelete("Locations");
    const hasUpdatePermission = canUpdate("Locations");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);

  const stripBrackets = (str) => {
    if (!str) return "-";
    if (typeof str === "string" && str.startsWith("[") && str.endsWith("]")) {
      return str.slice(1, -1);
    }
    return str;
  };

  const buildPayload = () => {
    const adType = [];
    if (formData.app) adType.push("app");
    if (formData.anotherCheck) adType.push("site");

    return {
      adType,
      deviceType: [],
      exchange: [],
      country: [],
      region: [],
      format: [],
      adSize: [],
      filterType: false,
    };
  };

  const fetchLocation = async (filterPayload = null) => {
    setLoading(true);
    try {
      const payload = filterPayload || buildPayload();
      const response = await getAllKibanaCountry(payload);
      if (
        response.data &&
        response.data.data &&
        response.data.data.kibanaCountryList
      ) {
        const transformed = transformApiResponse(
          response.data.data.kibanaCountryList,
        );
        setInventoryData(transformed);
      } else {
        setInventoryData([]);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomLoader = () => (
    <div className="customloader locations-loader">
      <div className="locations-loader-inner">
        <div className="loader" aria-label="Loading" />
        <div className="ms-2 fw-bold locations-loader-label">Loading...</div>
      </div>
    </div>
  );

  useEffect(() => {
    return () => {
      if (sortLoaderTimerRef.current) {
        clearTimeout(sortLoaderTimerRef.current);
      }
    };
  }, []);

  const triggerSortLoader = () => {
    if (sortLoaderTimerRef.current) {
      clearTimeout(sortLoaderTimerRef.current);
    }

    setSortLoading(true);

    const durationMs = 2500; // 2–3 sec requested UX delay
    sortLoaderTimerRef.current = setTimeout(() => {
      setSortLoading(false);
    }, durationMs);
  };

  const transformApiResponse = (apiData) => {
    return apiData.map((item) => {
      // const cpm =
      //   item.observedCPM !== undefined && item.observedCPM !== null
      //     ? `$${Number(item.observedCPM).toFixed(2)}`
      //     : "-";
      // const auctions = item.yesterdayAuction || item.auctions || "0";

      const cpmValue =
        item.observedCPM !== undefined && item.observedCPM !== null
          ? Number(item.observedCPM)
          : null;

      const auctionsValue = Number(item.yesterdayAuction || item.auctions || 0);

      return {
        id: item.kibanaCountryId,
        country: stripBrackets(item.country),
        region: stripBrackets(item.region),
        state: stripBrackets(item.region),
        city: stripBrackets(item.city),
        deviceIfa: item.deviceIfa || "-",
        adzType: item.adzType || "",
        exchangeName: item.exchange || item.exchangeName || "-",
        createdAt: item.createdAt || "-",
        updatedAt: item.updatedAt || "-",
        // auctions: auctions,
        // cpm: cpm,
        auctions: auctionsValue, // number
        cpm: cpmValue !== null ? `$${cpmValue.toFixed(2)}` : "-", // display
        cpmValue: cpmValue, // 🔥 for sorting
        details: [
          {
            subId: `${item.kibanaCountryId}-0`,
            subName: item.exchange || item.exchangeName || "Unknown",
            // subAuctions: auctions,
            // subCpm: cpm,
            subAuctions: auctionsValue,
            subCpm: cpmValue !== null ? `$${cpmValue.toFixed(2)}` : "-",
            subCpmValue: cpmValue,
          },
        ],
      };
    });
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const redraw = () => {
    setCount(count + 1);
  };
  const [formData, setFormData] = useState({
    app: false,
    anotherCheck: false,
  });
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const handleBlur = (value, setValue) => {
    if (value !== "") {
      const num = parseFloat(value);
      setValue(isNaN(num) ? "" : `$${num.toFixed(2)}`);
    }
  };
  const handleFocus = (value, setValue) => {
    if (value.startsWith("$")) {
      setValue(value.slice(1));
    }
  };
  const [collapsed, setCollapsed] = useState(true);
  const handleClick = () => {
    setCollapsed(!collapsed);
  };

  const refresh = () => {
    fetchLocation();
  };

  const [modal, setModal] = useState(false);
  const [id, setId] = useState(0);
  const [type, setType] = useState("");

  const modalCallback = (doit) => {
    if (doit) {
      deleteInventory(id, type);
    }
    setModal(!modal);
  };

  const deleteInventory = async (id, key) => {
    await vx.deleteInventory(id, key);
    await fetchLocation();
    setCreative(null);
    redraw();
  };
  const [clickedRow, setclickedRow] = useState([]);
  const [clickedRowExpandable, setclickedRowexpandable] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const filteredInventoryData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return inventoryData;

    return inventoryData.filter((row) => {
      const searchableValues = [
        row?.adzType,
        row?.country,
        row?.state,
        row?.city,
        row?.auctions,
        row?.cpm,
      ];

      return searchableValues.some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(term),
      );
    });
  }, [inventoryData, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredInventoryData.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedInventoryData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredInventoryData.slice(startIndex, startIndex + perPage);
  }, [filteredInventoryData, currentPage, perPage]);

  const [categoryModalOpen, setcategoryModalOpen] = useState(false);
  const togglecategorytModal = () => setcategoryModalOpen(!categoryModalOpen);
  const [countriesModalOpen, setcountriesModalOpen] = useState(false);
  const togglecountriestModal = () =>
    setcountriesModalOpen(!countriesModalOpen);

  const DeviceTypeOptions = [
    "Desktop",
    "Phone",
    "Tablet",
    "Connected TV",
    "Unknown",
  ];
  const [selectedDeviceType, setSelectedDeviceType] = useState([]);
  const handleRemoveDeviceType = (value) => {
    setSelectedDeviceType(selectedDeviceType.filter((item) => item !== value));
  };

  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);
  const [isCountriesModalOpen, setIsCountriesModalOpen] = useState(false);
  const [selectedCountryItems, setSelectedCountryItems] = useState([]);
  const toggleCountriesModal = () =>
    setIsCountriesModalOpen(!isCountriesModalOpen);

  const handleRemoveCountry = (name) => {
    setSelectedCountryItems((prev) => prev.filter((c) => c.parent !== name));
  };
  const [selectedFormat, setSelectedFormat] = useState([]);
  const [openFormat, setOpenFormat] = useState(false);
  const formatOptions = ["Audio", "Banner", "Native", "Video"];
  const formatRef = useRef(null);
  const [openDeviceType, setOpenDeviceType] = useState(false);
  const deviceRef = useRef(null);

  // Ad Size options
  const adSizeOptions = [
    "160x600",
    "970x250",
    "300x600",
    "320x100",
    "300x50",
    "300x250",
    "300x200",
    "300x100",
    "200x200",
    "320x50",
    "250x250",
    "400x200",
    "728x90",
  ];

  const handleAdSizeSelect = (adSizeValue) => {
    if (!adSizeValue) return;
    if (size.includes(adSizeValue)) {
      setSize(size.filter((item) => item !== adSizeValue));
    } else {
      setSize([...size, adSizeValue]);
    }
  };

  const handleRemoveAdSize = (value) => {
    setSize(size.filter((item) => item !== value));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        formatRef.current &&
        !formatRef.current.contains(e.target) &&
        deviceRef.current &&
        !deviceRef.current.contains(e.target) &&
        exchangesRef.current &&
        !exchangesRef.current.contains(e.target) &&
        adSizeRef.current &&
        !adSizeRef.current.contains(e.target)
      ) {
        setOpenFormat(false);
        setOpenDeviceType(false);
        setopenExchanges(false);
        setOpenAdSize(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const response = await getAllExchange();
        if (
          response.data &&
          response.data.data &&
          response.data.data.informationExchanges
        ) {
          const allExchanges = response.data.data.informationExchanges;
          const filtered = allExchanges.filter((ex) =>
            allowedExchanges.some(
              (allowed) => allowed.toLowerCase() === ex.name?.toLowerCase(),
            ),
          );
          const existingNames = filtered.map((ex) => ex.name.toLowerCase());
          allowedExchanges.forEach((allowed) => {
            if (!existingNames.includes(allowed.toLowerCase())) {
              filtered.push({ exchangeId: allowed, name: allowed });
            }
          });
          setExchanges(filtered);
        } else {
          setExchanges(
            allowedExchanges.map((name, idx) => ({ exchangeId: idx, name })),
          );
        }
      } catch (error) {
        console.error("Error fetching exchanges:", error);
        setExchanges(
          allowedExchanges.map((name, idx) => ({ exchangeId: idx, name })),
        );
      }
    };
    fetchExchanges();
  }, []);

  const handleDeviceTypeSelect = (input) => {
    const value = typeof input === "string" ? input : input.target.value;
    if (!value) return;

    if (selectedDeviceType.includes(value)) {
      setSelectedDeviceType(
        selectedDeviceType.filter((item) => item !== value),
      );
    } else {
      setSelectedDeviceType([...selectedDeviceType, value]);
    }
  };
  const handleFormatSelect = (input) => {
    const value = typeof input === "string" ? input : input.target.value;
    if (!value) return;

    if (selectedFormat.includes(value)) {
      setSelectedFormat(selectedFormat.filter((item) => item !== value));
    } else {
      setSelectedFormat([...selectedFormat, value]);
    }
  };
  const conditionalRowStyles = [
    {
      when: (row) => row.id == clickedRow,
      classNames: ["row-active"],
      style: {
        backgroundColor: "#63903f",
        color: "white",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#63903f",
        },
      },
    },
  ];

  const conditionalRowStylesExpandable = [
    {
      when: (row) => row.subId == clickedRowExpandable,
      style: {
        backgroundColor: "#63903f",
        color: "white",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#63903f",
        },
      },
    },
  ];

  useEffect(() => {
    fetchLocation();
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const allColumns = [
    {
      name: "Type",
      selector: (row) => row.adzType || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
      wrap: true,
    },
    {
      name: "Country",
      selector: (row) => row.country || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
      wrap: true,
    },
    {
      name: "State",
      selector: (row) => row.state || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
      wrap: true,
    },
    {
      name: "City",
      selector: (row) => row.city || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
      wrap: true,
    },
    {
      name: "Yesterday Auction",
      selector: (row) => row.auctions,
      sortable: true,
      sortFunction: (a, b) => a.auctions - b.auctions,
      right: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
    },
    {
      name: "Observed CPM",
      selector: (row) => row.cpm,
      sortable: true,
      sortFunction: (a, b) => {
        return (a.cpmValue || 0) - (b.cpmValue || 0);
      },
      right: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
    },
  ];

  const expandedColumns = [
    {
      width: "48px",
      cell: () => null,
    },
    {
      name: "Exchange",
      selector: (row) => row.subName,
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
      style: {
        fontWeight: "600",
        color: "#2c3e50",
        fontSize: "13px",
      },
    },
    {
      name: "Country",
      selector: () => "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
    },
    {
      name: "State",
      selector: () => "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
    },
    {
      name: "City",
      selector: () => "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "170px",
    },
    {
      name: "Auctions",
      selector: (row) => row.subAuctions,
      right: true,
      minWidth: "120px",
      maxWidth: "170px",
    },
    {
      name: "CPM",
      selector: (row) => row.subCpm,
      right: true,
      minWidth: "120px",
      maxWidth: "170px",
    },
  ];

  const expandedTableStyles = {
    table: {
      style: {},
    },
    headRow: {
      style: {
        display: "none",
        minHeight: "0",
      },
    },
    rows: {
      style: {
        minHeight: "40px",
        borderBottom: "1px solid #eef2f7",
        height: "40px"
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
        minHeight: "40px",
        borderBottom: "1px solid #eef2f7",
        height: "40px",
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

  const ExpandedComponent = ({ data }) => {
    return (
      <div
        className="expanded-datatable"
      >
        <DataTable
          className="inventory-datatable1"
          columns={expandedColumns}
          data={data.details}
          keyField="subId"
          dense
          highlightOnHover
          noHeader
          customStyles={expandedTableStyles}
          // conditionalRowStyles={conditionalRowStylesExpandable}
          onRowClicked={(row) => {
            setclickedRowexpandable(row.subId);
            setclickedRow([]);
          }}
        />
      </div>
    );
  };

  const columns = allColumns.filter((col) => {
    return typeof col.name === "string" && selectedColumns.includes(col.name);
  });

  const handlerowclick = (id) => {
    setclickedRow((prev) => prev.filter((prev) => prev !== id));
  };

  const paginationComponentOptions = {
    noRowsPerPage: true,
    selectAllRowsItemText: "Todos",
  };

  const exportToExcel = () => {
    if (!inventoryData || inventoryData.length === 0) return;
    const exportData = [];
    inventoryData.forEach((item) => {
      exportData.push({
        Country: item.country || "-",
        Region: item.region || "-",
        State: item.state || "-",
        City: item.city || "-",
        "Yesterday Auction": item.auctions || "0",
        "Observed CPM": item.cpm || "-",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, "Locations.xlsx");
  };

  const handleApplyFilters = () => {
    const adType = [];
    if (formData.app) adType.push("app");
    if (formData.anotherCheck) adType.push("site");
    const format = selectedFormat.map((f) => f.toLowerCase());
    const deviceType = selectedDeviceType.map((d) => d.toLowerCase());
    const payload = {
      adType,
      deviceType,
      exchange: selectedExchanges.map((ex) => ex.toLowerCase()),
      country: Array.from(new Set(selectedCountryItems.map((c) => c.iso3))),
      region: selectedCountryItems.flatMap((c) => (c.regions ? c.regions : [])),
      format,
      adSize: size,
      filterType: true,
    };

    fetchLocation(payload);
  };


  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await getAllkibanapublisher();
      console.log("Data sync completed successfully", response);

      if (response?.data?.message?.includes("already executed") ||
        response?.data?.alreadyExecuted === true ||
        response?.data?.status === "already_executed") {
        Swal.fire({
          icon: 'info',
          title: 'Already Executed',
          text: 'This API has already been executed today. Data is up to date.',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Data Refresh Completed',
          text: 'Inventory data has been successfully refreshed from Kibana.',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
      }
      await getAllkibanapublisher();

    } catch (error) {
      console.error("Error during data refresh:", error);
      Swal.fire({
        icon: 'info',
        title: 'Already Executed',
        text: 'This Data has Already been executed today. Data is up to date.',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="content1">
      <div className="content-wrapper">
        {modal && (
          <DecisionModal
            title="Really delete creative?"
            message="Only the db admin can undo this if you delete it!!!"
            name="DELETE"
            callback={modalCallback}
          />
        )}
        {creative === null && canViewUser && (
          <div>
            <Row className="inventory-row m-0 p-0">
              <Col xs="12" className="m-0 p-0">
                {/* Original header replaced by Tabs */}
              </Col>
            </Row>

            <Row className="g-0 m-0 p-0">
              {/* Sidebar filter panel */}
              <div
                className={`devices-sidebar-panel ${collapsed ? "devices-sidebar-collapsed" : "devices-sidebar-expanded"}`}
              >
                <Card
                  className="border-1 rounded-0 h-100"
                  id="inventorycard"
                >
                  <div className="p-3">
                    <div className="devices-sidebar-scroll-area">
                      <div className="mb-1 inventoryfilter">
                        FILTERS
                      </div>
                      <div>
                        <label className="appdomaintype">
                          App/Domain Type
                        </label>
                      </div>
                      <div className="sq-checkbox mt-1">
                        <input
                          type="checkbox"
                          name="app"
                          checked={formData.app}
                          onChange={handleCheckboxChange}
                          className="ms-1"
                        />
                        <label className="appdomaintype ">App</label>

                        <input
                          className="ms-4"
                          type="checkbox"
                          name="anotherCheck"
                          checked={formData.anotherCheck}
                          onChange={handleCheckboxChange}
                        />
                        <label className="appdomaintype">Domain</label>
                      </div>

                      <div
                        className="custom-select-wrapper mt-2"
                        ref={formatRef}
                      >
                        <div className="d-flex flex-row justify-content-between align-items-center">
                          <label className="form-label inventory-label">
                            Ad Type
                          </label>
                          {selectedFormat.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 locations-clear-button"
                              onClick={() => setSelectedFormat([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div
                          className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input locations-select-trigger"
                          onClick={() => {
                            setOpenFormat(!openFormat);
                            setOpenDeviceType(false);
                            setOpenAdSize(false);
                          }}
                          tabIndex={0}
                        >
                          {selectedFormat.length > 0 ? (
                            <span className="inventory-inputvlaue fw-bold">
                              {selectedFormat.join(", ")}
                            </span>
                          ) : (
                            "Select Ad Type"
                          )}

                          <FaCaretDown
                            className={`custom-select-icon ${openFormat ? "open" : ""}`}
                          />
                        </div>
                        {openFormat && (
                          <div className="custom-dropdown-menu ">
                            {formatOptions.map((opt) => (
                              <div
                                key={opt}
                                className={`custom-dropdown-option devices-dropdown-option ${selectedFormat.includes(opt) ? "selected" : ""}`}
                                onClick={() => handleFormatSelect(opt)}
                              >
                                {selectedFormat.includes(opt) && (
                                  <span className="locations-dropdown-choice-icon">
                                    ✔
                                  </span>
                                )}
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div
                        className="mt-3 position-relative custom-select-wrapper"
                        ref={deviceRef}
                      >
                        <div className="d-flex justify-content-between align-items-center ">
                          <label className="form-label mb-0 inventory-label">
                            Device Type
                          </label>
                          {selectedDeviceType.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 locations-clear-button"
                              onClick={() => setSelectedDeviceType([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="position-relative locations-dropdown-wrapper">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input locations-select-trigger"
                            onClick={() => {
                              setOpenDeviceType(!openDeviceType);
                              setOpenFormat(false);
                              setOpenAdSize(false);
                            }}
                            tabIndex={0}
                          >
                            {selectedDeviceType.length > 0 ? (
                              <span className="fw-bold inventory-inputvlaue">
                                {selectedDeviceType.join(", ")}
                              </span>
                            ) : (
                              "Select Device Type"
                            )}
                            <FaCaretDown
                              className={`custom-select-icon ms-2 devices-select-icon ${openDeviceType ? "open" : ""}`}
                            />
                          </div>
                          {openDeviceType && (
                            <div className="custom-dropdown-menu devices-dropdown-menu">
                              {DeviceTypeOptions.map((devicetype, idx) => {
                                const isSelected =
                                  selectedDeviceType.includes(devicetype);

                                return (
                                  <div
                                    key={idx}
                                    onClick={() =>
                                      handleDeviceTypeSelect(devicetype)
                                    }
                                    className={`custom-dropdown-option devices-dropdown-option ${isSelected ? "selected" : ""}`}
                                  >
                                    {isSelected && (
                                      <span className="devices-dropdown-choice-icon">
                                        ✔
                                      </span>
                                    )}
                                    <span>{devicetype}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-2">
                          {selectedDeviceType.map((devicetype, idx) => (
                            <span
                              key={idx}
                              className="badge me-1 mt-1 locations-chip"
                            >
                              {devicetype}
                              <span
                                className="locations-chip-remove"
                                onClick={() =>
                                  handleRemoveDeviceType(devicetype)
                                }
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="mt-2 position-relative custom-select-wrapper"
                        ref={exchangesRef}
                      >
                        <div className="d-flex justify-content-between align-items-center ">
                          <label className="form-label mb-0 inventory-label">
                            Exchanges
                          </label>
                          {selectedExchanges.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 locations-clear-button"
                              onClick={() => setSelectedExchanges([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div className="position-relative">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input locations-select-trigger"
                            onClick={() => setopenExchanges(!openExchanges)}
                          >
                            {selectedExchanges.length > 0 ? (
                              <span className="fw-bold">
                                {selectedExchanges.join(", ")}
                              </span>
                            ) : (
                              "Select Exchanges"
                            )}
                          </div>
                          <FaCaretDown className="custom-select-icon" />
                        </div>

                        {openExchanges && (
                          <div className="custom-dropdown-menu locations-dropdown-menu">
                            {exchanges.map((exchange) => {
                              const isSelected = selectedExchanges.includes(
                                exchange.name,
                              );

                              return (
                                <div
                                  key={exchange.exchangeId}
                                  onClick={() =>
                                    handleExchangesTypeSelect(exchange.name)
                                  }
                                  className={`custom-dropdown-option locations-dropdown-option ${isSelected ? "selected" : ""}`}
                                >
                                  {isSelected && (
                                    <span className="locations-dropdown-choice-icon">
                                      ✔
                                    </span>
                                  )}
                                  <span>{exchange.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        {selectedExchanges.map((exchange, idx) => (
                          <span
                            key={idx}
                            className="badge me-1 mt-1 locations-chip"
                          >
                            {exchange}
                            <span
                              className="locations-chip-remove"
                              onClick={() => handleRemoveExchange(exchange)}
                            >
                              ×
                            </span>
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 position-relative custom-select-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label mb-0 inventory-label">
                            Countries/Regions
                          </label>
                          {selectedCountryItems.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 locations-clear-button"
                              onClick={() => setSelectedCountryItems([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div
                          className="form-control py-1 px-1 rounded-0 formatsize devices-select-trigger devices-select-trigger-center"
                          onClick={toggleCountriesModal}
                        >
                          <span className="p-0 text-start inventory-input-text">
                            Select Countries/Regions
                          </span>
                        </div>

                        <div className="mt-2">
                          {selectedCountryItems.map((c, idx) => (
                            <span
                              key={idx}
                              className="badge me-1 mt-1 devices-chip devices-chip-accent"
                            >
                              {c.parent}
                              {c.childrenCount > 0 &&
                                ` (${c.childrenCount})`}
                              <span
                                className="locations-chip-remove"
                                onClick={() =>
                                  handleRemoveCountry(c.parent)
                                }
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>

                        <CountriesModal
                          modalOpen={isCountriesModalOpen}
                          toggleModal={toggleCountriesModal}
                          selectedCountries={selectedCountryItems}
                          setSelectedCountries={setSelectedCountryItems}
                        />
                      </div>

                      {/* Ad Size Multi-Select */}
                      <div
                        className="mt-2 position-relative custom-select-wrapper"
                        ref={adSizeRef}
                      >
                        <div className="d-flex flex-row justify-content-between align-items-center">
                          <label className="form-label inventory-label">
                            Ad Size
                          </label>
                          {size.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 locations-clear-button"
                              onClick={() => setSize([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div
                          className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input locations-select-trigger"
                          onClick={() => {
                            setOpenAdSize(!openAdSize);
                            setOpenFormat(false);
                            setOpenDeviceType(false);
                            setopenExchanges(false);
                          }}
                          tabIndex={0}
                        >
                          {size.length > 0 ? (
                            <span className="inventory-inputvlaue fw-bold">
                              {size.join(", ")}
                            </span>
                          ) : (
                            "Select Ad Size"
                          )}
                          <FaCaretDown
                            className={`custom-select-icon ${openAdSize ? "open" : ""}`}
                          />
                        </div>

                        {openAdSize && (
                          <div className="custom-dropdown-menu">
                            {adSizeOptions.map((adSize) => (
                              <div
                                key={adSize}
                                className={`custom-dropdown-option devices-dropdown-option ${size.includes(adSize) ? "selected" : ""}`}
                                onClick={() => handleAdSizeSelect(adSize)}
                              >
                                {size.includes(adSize) && (
                                  <span className="locations-dropdown-choice-icon">
                                    ✔
                                  </span>
                                )}
                                <span>{adSize}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-2">
                          {size.map((adSize, idx) => (
                            <span
                              key={idx}
                              className="badge me-1 mt-1 locations-chip"
                            >
                              {adSize}
                              <span
                                className="locations-chip-remove"
                                onClick={() => handleRemoveAdSize(adSize)}
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="m-4"></div>
                    </div>
                    <Row className="border-top">
                      <Col md="5"></Col>
                      <Col className="text-end">
                        <button
                          size="sm"
                          className="formatsize mt-3 inventoryfiltes border-0 text-light text-nowrap"
                          onClick={handleApplyFilters}
                        >
                          Apply Filters
                        </button>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </div>

              {/* Main table area */}
              <div
                className={`devices-main-table-area flex-grow-1 p-0 ${collapsed ? "devices-main-table-area-collapsed" : "devices-main-table-area-expanded"}`}
              >
                <Card className="mb-3 devices-card">
                  <CardBody className="py-3 devices-card-body">
                    <div className="mt-2 mx-0 px-2">
                      <div className="d-flex flex-wrap align-items-center justify-content-start w-100 devices-toolbar-row">
                        <button
                          className="inventory-toolbar-btn inventory-toolbar-filter d-flex align-items-center"
                          onClick={handleClick}
                        >
                          {collapsed ? <FaCaretRight /> : <FaCaretLeft />}
                          <span className="me-2 inventoryfilter"> Filters</span>
                        </button>

                        <Input
                          type="text"
                          placeholder="Search..."
                          className="inventory-search-input"
                          value={searchTerm}
                          id="seaching"
                          onChange={onSearchChange}
                        />

                        <button
                          type="button"
                          onClick={refresh}
                          className="inventory-toolbar-btn inventory-toolbar-secondary d-flex align-items-center justify-content-center"
                          id="refresh"
                        >
                          <i className="fa fa-repeat me-1"></i>
                          Refresh
                        </button>

                        <Button
                          type="btn"
                          className="inventory-toolbar-btn inventory-toolbar-primary"
                          id="export"
                          onClick={exportToExcel}
                        >
                          <span className="lasttime devices-export-label">Export</span>
                        </Button>

                        <div className="d-flex align-items-center flex-wrap devices-pagination-group">
                          <div className="cd-pagination-summary devices-pagination-summary">
                            {filteredInventoryData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                          </div>
                          <div className="cd-pagination-toolbar devices-pagination-toolbar">
                            {totalPages > 1 && (
                              <div className="cd-pagination-controls devices-pagination-controls">
                                <button
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                  className="cd-pagination-nav-btn devices-pagination-nav-btn"
                                  type="button"
                                >
                                  <FaChevronRight className="devices-pagination-chevron devices-pagination-chevron-left" />
                                </button>
                                <button
                                  className="cd-pagination-page-btn is-active devices-pagination-page-btn devices-pagination-page-btn-active"
                                  type="button"
                                >
                                  {currentPage}
                                </button>
                                <span className="devices-pagination-label">of</span>
                                <button className="cd-pagination-page-btn devices-pagination-page-btn" type="button">
                                  {totalPages}
                                </button>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="cd-pagination-nav-btn locations-pagination-nav-btn" type="button">
                                  <FaChevronRight className="devices-pagination-chevron devices-pagination-chevron-right" />
                                </button>
                                <div
                                  id="items-per-page-wrapper"
                                  ref={perPageRef}
                                  className="devices-per-page-wrapper"
                                >
                                  <div className="campaign-select-wrapper">
                                    <Input
                                      readOnly
                                      value={`${perPage} per page`}
                                      className="campaign-select-input devices-per-page-input"
                                      onClick={() =>
                                        setIsPerPageOpen(!isPerPageOpen)
                                      }
                                      tabIndex={0}
                                    />
                                    <FaCaretDown
                                      className={`custom-select-icon campaign-select-icon ${isPerPageOpen ? "open" : ""}`}
                                    />
                                  </div>
                                </div>
                                {isPerPageOpen &&
                                  typeof document !== "undefined" &&
                                  ReactDOM.createPortal(
                                    <div
                                      ref={perPagePortalRef}
                                      className="custom-dropdown-menu biddeript-b devices-dropdown-portal"
                                      style={{
                                        top: `${perPageDropdownPosition.top}px`,
                                        left: `${perPageDropdownPosition.left}px`,
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
                                            className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
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

                        {/* <button
                          type="button"
                          onClick={refreshData}
                          className="inventory-toolbar-btn inventory-toolbar-secondary d-flex align-items-center justify-content-center"
                          id="newaudience"
                        >
                          <i className="fa fa-repeat me-1" id="datarefresh"></i>
                          <span className="linkto">Data Refresh</span>
                        </button> */}
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <div className="campaign-daily-table-wrapper">
                  <div className="devices-table-shell">
                    <div className="devices-table-inner">
                      <DataTable
                        keyField="id"
                        className="inventory-datatable"
                        columns={columns}
                        data={paginatedInventoryData}
                        customStyles={customStyles}
                        highlightOnHover
                        pointerOnHover
                        persistTableHead
                        fixedHeader
                        fixedHeaderScrollHeight="100%"
                        responsive={false}
                        // conditionalRowStyles={conditionalRowStyles}
                        onRowClicked={(row) => {
                          setclickedRow(row.id);
                          setclickedRowexpandable([]);
                        }}
                        progressPending={loading}
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                        expandableIcon={{
                          collapsed: <FaCaretRight />,
                          expanded: <FaCaretDown />,
                        }}
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
                {/* <div className="inventory-table-wrapper inventory-domainlist-wrapper" style={{ height: "auto" }}>
                      <DataTable
                        className="inventory-datatable"
                        columns={columns}
                        data={paginatedInventoryData}
                        progressPending={loading || sortLoading}
                        progressComponent={<CustomLoader />}
                        onSort={triggerSortLoader}
                        highlightOnHover
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                        expandableIcon={{
                          collapsed: <FaCaretRight />,
                          expanded: <FaCaretDown />,
                        }}
                        conditionalRowStyles={conditionalRowStyles}
                        onRowClicked={(row) => {
                          setclickedRow(row.id);
                          setclickedRowexpandable([]);
                        }}
                        persistTableHead
                        customStyles={customStyles}
                      />
                    </div> */}
              </div>
            </Row>
          </div>
        )}
        {creative === null && !canViewUser && (
          <div className="alert alert-warning mt-3 locations-access-denied">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <strong>Access Denied:</strong> You do not have permission to view the Locations.
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;
