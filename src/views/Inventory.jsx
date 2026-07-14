import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { Button, Card, Row, Col, Input, Collapse, CardBody } from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import InventoryConversionModal from "./Modal/InventoryConversionModal";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { FaCaretDown, FaChevronRight, FaChevronDown, FaCaretRight, FaCaretLeft } from "react-icons/fa";
import CategoriesModal from "../../src/views/Modal/categoriesModal";
import CountriesModal from "../../src/views/Modal/CountriesRegionsModal";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import DataTable from "react-data-table-component";
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import CurrentDomainModal from "./Modal/CurrentDomainModal";
import {
  publisherinventorylist,
  getAllExchange,
  filterPublishInventoryArchive,
  filterPublishInventoryArchivePost,
  getAllCategory,
  getAllkibanapublisher,
} from "../views/api/Api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "../assets/css/devices.css";

ModuleRegistry.registerModules([AllCommunityModule]);
var undef;

const Inventory = (props) => {
  const currentUsername = localStorage.getItem("username") || "";
  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const toggleconversiontModal = () =>
    setConversionModalOpen(!conversionModalOpen);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const [currentdomainModalOpen, setCurrentDomainModalOpen] = useState(false);
  const togglecurrentdomainModal = () =>
    setCurrentDomainModalOpen(!currentdomainModalOpen);
  const toggleInventoryDropdown = () =>
    setInventoryDropdownOpen((prev) => !prev);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryLookup, setCategoryLookup] = useState({});
  const [canCreateUser, setCanCreateUser] = useState(false);
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);

  // Domain Type (banner, audio, native)
  const [selectedDomainType, setSelectedDomainType] = useState([]);
  const [openDomainType, setOpenDomainType] = useState(false);
  const domainTypeOptions = ["Banner", "Audio", "Video", "Native"];
  const domainTypeRef = useRef(null);

  // Ad Size multi-select
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
  const [selectedAdSizes, setSelectedAdSizes] = useState([]);
  const [openAdSize, setOpenAdSize] = useState(false);
  const adSizeRef = useRef(null);

  useEffect(() => {
    const fetchLookup = async () => {
      try {
        const response = await getAllCategory();
        const json = response.data;
        const lookup = {};
        json.data.informationCategories.forEach((cat) => {
          lookup[cat.name] = {
            code: cat.categoryCode,
          };
          cat.categoryValues?.forEach((v) => {
            lookup[v.name] = { code: v.value };
          });
        });
        setCategoryLookup(lookup);
      } catch (err) {
        console.error("Error fetching category lookup", err);
      }
    };
    fetchLookup();
  }, []);
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
    initializePageTab("Inventory", "fa fa-cube", "/admin/inventory");
  }, [initializePageTab]);
  useEffect(() => {
    const hasCreatePermission = canCreate("Inventory");
    const hasViewPermission = canView("Inventory");
    const hasEditPermission = canEdit("Inventory");
    const hasDeletePermission = canDelete("Inventory");
    const hasUpdatePermission = canUpdate("Inventory");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
  }, []);

  useEffect(() => {
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : localStorage.getItem("username") || "User";
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-cube me-2"></i>
          Inventory - <i>{displayName}</i>
        </>
      ),
    });
  }, [firstName, lastName, updateTab]);

  useEffect(() => {
    const displayName =
      firstName && lastName
        ? `${firstName} ${lastName}`
        : localStorage.getItem("username") || "User";
    updateTab("default", {
      header: (
        <>
          <i className="fa fa-cube me-2"></i>
          Inventory - <i>{selectedInventory?.name || displayName}</i>
        </>
      ),
    });
  }, [selectedInventory, updateTab, firstName, lastName]);



  const CustomLoader = () => (
    <div className="customloader text-center py-4">
      <div className="loader"></div>
      <div className="ms-2 fw-bold">Loading...</div>
    </div>
  );

  const fetchInventory = async (filterPayload = null) => {
    setLoading(true);
    try {
      let response;
      if (filterPayload) {
        response = await filterPublishInventoryArchivePost(filterPayload);
      } else {
        const emptyPayload = {
          domainType: [],
          adType: [],
          deviceType: [],
          adSize: [],
          categories: [],
          country: [],
          region: [],
          exchange: [],
          filterType: false,
        };
        response = await publisherinventorylist(emptyPayload);
      }

      if (
        response.data &&
        response.data.data &&
        response.data.data.informationPublishInventoryArchives
      ) {
        const transformed = transformApiResponse(
          response.data.data.informationPublishInventoryArchives
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

  const transformApiResponse = (apiData) => {
    return apiData.map((item, index) => {
      const auctions = (
        item.yesterdayAuction ||
        item.publisherCount ||
        0
      ).toLocaleString();
      const cpm = item.observedCPM ? `$${item.observedCPM.toFixed(2)}` : "-";

      const details = [];
      if (Array.isArray(item.publisherExchange)) {
        const exchangeNames = item.publisherExchange;
        const exchangeCounts = Array.isArray(item.exchangeCount)
          ? item.exchangeCount
          : [];
        const maxLen = Math.min(exchangeNames.length, exchangeCounts.length);
        for (let i = 0; i < maxLen; i++) {
          details.push({
            subId: `${item.publisherId}-${i}`,
            subName: exchangeNames[i] || "Unknown",
            subDomain: "-",
            subAuctions: exchangeCounts[i]
              ? exchangeCounts[i].toLocaleString()
              : "1",
            subCpm: "-",
            store: "-",
          });
        }
      } else if (item.exchange) {
        details.push({
          subId: `${item.publisherId || item.publishInventoryArchiveId}-0`,
          subName: item.exchange,
          subDomain: "-",
          subAuctions: auctions,
          subCpm: cpm,
          store: "-",
        });
      }

      return {
        rowKey: `${item.publisherId || "publisher"}-${item.publishInventoryArchiveId || "archive"}-${index}`,
        id: item.publisherId || item.publishInventoryArchiveId,
        subId: item.publisherId || item.publishInventoryArchiveId,
        name: item.publisherName || item.domain || "Unknown",
        domain: item.domain || item.publisherDomain || "-",
        adzType: item.adzType || "",
        type:
          item.adzType === "site"
            ? "Domain"
            : item.adzType === "app"
              ? "App"
              : item.adzType === "-"
                ? "App"
                : "Domain",
        auctions: auctions,
        cpm: cpm,
        store: "-",
        details: details,
      };
    });
  };

  useEffect(() => {
    fetchInventory();
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

  const [collapsed, setCollapsed] = useState(true);
  const handleClick = () => {
    setCollapsed(!collapsed);
  };



  const refresh = async () => {
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
  const refreshInventoryOnly = () => {
    fetchInventory();
  };

  const getLowerCaseDeviceType = (deviceType) => {
    if (!deviceType) return '';                 // handle null/undefined
    if (typeof deviceType === 'string') return deviceType.toLowerCase();
    if (Array.isArray(deviceType)) return deviceType.map(v => String(v).toLowerCase()).join(','); // or just first item
    return String(deviceType).toLowerCase();    // fallback for numbers, etc.
  };
  const handleApplyFilters = async () => {
    const categoryPayload = [];
    selectedCategories.forEach((cat) => {
      if (cat.isParent) {
        const entry = categoryLookup[cat.parent];
        if (entry && entry.code) {
          categoryPayload.push(entry.code);
        }
      }
    });

    const adTypeValues = [];
    if (formData.app) adTypeValues.push("app");
    if (formData.anotherCheck) adTypeValues.push("site");

    const payload = {

      domainType: (selectedDomainType || []).map(domain => domain.toLowerCase()),
      adType: adTypeValues,
      deviceType: (selectedDeviceType || []).map(device => device.toLowerCase()),
      adSize: selectedAdSizes,
      categories: Array.from(new Set(categoryPayload)),
      exchange: selectedExchanges.map(ex => ex.toLowerCase()),
      country: Array.from(new Set(selectedCountryItems.map((c) => c.iso3))),
      region: selectedCountryItems.flatMap((c) => (c.regions ? c.regions : [])),
      filterType: true,
    };

    fetchInventory(payload);
  };

  const clearSelection = () => {
    setSelectedRows([]);
    setclickedRow([]);
    setclickedRowexpandable([]);
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
    await fetchInventory();
    setCreative(null);
    redraw();
  };

  const [selectedRows, setSelectedRows] = useState([]);
  const [clickedRow, setclickedRow] = useState([]);
  const [clickedRowexpandable, setclickedRowexpandable] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const perPageRef = useRef(null);
  const [perPageDropdownPosition, setPerPageDropdownPosition] = useState({ top: 0, left: 0 });
  const perPagePortalRef = useRef(null);
  const selectAllRef = useRef(null);

  const onSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const filteredInventoryData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return inventoryData;

    return inventoryData.filter((row) => {
      const searchableValues = [
        row?.domain,
        row?.adzType,
        row?.subId,
        row?.store,
        row?.auctions,
        row?.cpm,
      ];

      return searchableValues.some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(term)
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

  const visibleRowIds = useMemo(
    () => paginatedInventoryData.map((row) => row.id).filter(Boolean),
    [paginatedInventoryData]
  );

  const visibleSelectedCount = useMemo(
    () => visibleRowIds.filter((id) => selectedRows.includes(id)).length,
    [visibleRowIds, selectedRows]
  );

  const [categoryModalOpen, setcategoryModalOpen] = useState(false);
  const togglecategorytModal = () => setcategoryModalOpen(!categoryModalOpen);
  const [countriesModalOpen, setcountriesModalOpen] = useState(false);
  const togglecountriestModal = () =>
    setcountriesModalOpen(!countriesModalOpen);

  const totalSelectableRows = visibleRowIds.length;
  const allRowsSelected =
    totalSelectableRows > 0 && visibleSelectedCount === totalSelectableRows;
  const someRowsSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < totalSelectableRows;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someRowsSelected;
    }
  }, [someRowsSelected, totalSelectableRows]);

  useEffect(() => {
    setSelectedRows((prev) =>
      prev.filter((id) => inventoryData.some((row) => row.id === id))
    );
  }, [inventoryData]);

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
      return () => window.removeEventListener("scroll", updatePosition);
    }
  }, [isPerPageOpen]);

  const handleSelectAllRows = (checked) => {
    if (checked) {
      setSelectedRows((prev) =>
        Array.from(new Set([...prev, ...visibleRowIds]))
      );
    } else {
      const visibleSet = new Set(visibleRowIds);
      setSelectedRows((prev) => prev.filter((id) => !visibleSet.has(id)));
    }
    setclickedRow([]);
    setclickedRowexpandable([]);
  };

  const DeviceTypeOptions = [
    "Desktop",
    "Phone",
    "Tablet",
    "Connected TV",
    "Unknown",
  ];
  const [selectedDeviceType, setSelectedDeviceType] = useState([]);
  const [selectedExchanges, setSelectedExchanges] = useState([]);

  const handleRemoveExchange = (value) => {
    setSelectedExchanges(selectedExchanges.filter((item) => item !== value));
  };
  const handleRemoveDeviceType = (value) => {
    setSelectedDeviceType(selectedDeviceType.filter((item) => item !== value));
  };
  const handleRemoveAdSize = (value) => {
    setSelectedAdSizes(selectedAdSizes.filter((item) => item !== value));
  };

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);
  const handleRemoveCategory = (parentName) => {
    setSelectedCategories((prev) =>
      prev.filter((item) => item.parent !== parentName)
    );
  };

  const [isCountriesModalOpen, setIsCountriesModalOpen] = useState(false);
  const [selectedCountryItems, setSelectedCountryItems] = useState([]);
  const toggleCountriesModal = () =>
    setIsCountriesModalOpen(!isCountriesModalOpen);
  const handleRemoveCountry = (name) => {
    setSelectedCountryItems((prev) => prev.filter((c) => c.parent !== name));
  };

  const [openDeviceType, setOpenDeviceType] = useState(false);
  const [openExchanges, setopenExchanges] = useState(false);
  const deviceRef = useRef(null);
  const exchangesRef = useRef(null);
  const [exchanges, setExchanges] = useState([]);
  const allowedExchanges = ["pubmatic", "vlion", "eqativ"];
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
              (allowed) => allowed.toLowerCase() === ex.name?.toLowerCase()
            )
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
            allowedExchanges.map((name, idx) => ({ exchangeId: idx, name }))
          );
        }
      } catch (error) {
        console.error("Error fetching exchanges:", error);
        setExchanges(
          allowedExchanges.map((name, idx) => ({ exchangeId: idx, name }))
        );
      }
    };
    fetchExchanges();
  }, []);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        domainTypeRef.current &&
        !domainTypeRef.current.contains(e.target) &&
        adSizeRef.current &&
        !adSizeRef.current.contains(e.target) &&
        deviceRef.current &&
        !deviceRef.current.contains(e.target) &&
        exchangesRef.current &&
        !exchangesRef.current.contains(e.target)
      ) {
        setOpenDomainType(false);
        setOpenAdSize(false);
        setOpenDeviceType(false);
        setopenExchanges(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeviceTypeSelect = (input) => {
    const value = typeof input === "string" ? input : input.target.value;
    if (!value) return;

    if (selectedDeviceType.includes(value)) {
      setSelectedDeviceType(selectedDeviceType.filter((item) => item !== value));
    } else {
      setSelectedDeviceType([...selectedDeviceType, value]);
    }
  };

  const handleExchangesTypeSelect = (input) => {
    const value = typeof input === "string" ? input : input.target.value;
    if (!value) return;

    if (selectedExchanges.includes(value)) {
      setSelectedExchanges(selectedExchanges.filter((item) => item !== value));
    } else {
      setSelectedExchanges([...selectedExchanges, value]);
    }
  };

  const handleDomainTypeSelect = (value) => {
    if (selectedDomainType.includes(value)) {
      setSelectedDomainType(selectedDomainType.filter((item) => item !== value));
    } else {
      setSelectedDomainType([...selectedDomainType, value]);
    }
  };

  const handleAdSizeSelect = (value) => {
    if (selectedAdSizes.includes(value)) {
      setSelectedAdSizes(selectedAdSizes.filter((item) => item !== value));
    } else {
      setSelectedAdSizes([...selectedAdSizes, value]);
    }
  };

  const conditionalRowStyles = [
    {
      when: (row) => row.id == clickedRow,
      classNames: ["row-active"],
      style: {
        backgroundColor: "#FBEDEF !important",
        color: "#1e293b",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#FBEDEF !important",
        },
      },
    },
  ];

  const conditionalRowStylesexpandabale = [
    {
      when: (row) => row.subId == clickedRowexpandable,
      classNames: ["row-active1"],
      style: {
        backgroundColor: "#FBEDEF !important",
        color: "#1e293b",
        cursor: "pointer",
        "& td, & span, & div": {
          color: "#1e293b",
        },
        "&:hover": {
          backgroundColor: "#FBEDEF !important",
        },
      },
    },
  ];

  const ALL_COLUMNS = {
    name: {
      name: "Domain / App Name",
      selector: (row) => row.name || "-",
      sortable: true,
      grow: 2,
      minWidth: "220px",
      width:"290px",
      wrap: true,
    },
    domain: {
      name: "Domain / App ID",
      selector: (row) => row.domain || "-",
      sortable: true,
      grow: 2,
      minWidth: "220px",
      width:"290px",
      wrap: true,
    },
    type: {
      name: "Type",
      selector: (row) => row.type || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      width:"135px",
    },
    auctions: {
      name: "Yesterday's Auctions",
      selector: (row) => row.auctions || "-",
      right: true,
      sortable: true,
      minWidth: "160px",
      width:"160px",
    },
    cpm: {
      name: "Observed CPM",
      selector: (row) => row.cpm || "-",
      right: true,
      sortable: true,
      minWidth: "140px",
      width:"135px",
    },
    store: {
      name: "App Store Name",
      selector: (row) => row.store || "-",
      sortable: true,
      grow: 1,
      minWidth: "160px",
      width:"150px",
      wrap: true,
    },
  };

  const DEFAULT_SELECTED_COLUMNS = [
    "name",
    "domain",
    "type",
    "auctions",
    "cpm",
    "store",
  ];

  const [selectedColumns, setSelectedColumns] = useState(
    DEFAULT_SELECTED_COLUMNS
  );

  const buildColumns = () => {
    const columns = [];

    selectedColumns.forEach((columnKey) => {
      if (ALL_COLUMNS[columnKey]) {
        columns.push(ALL_COLUMNS[columnKey]);
      }
    });

    return columns;
  };

  const handleSelectRow = (checked, row) => {
    if (checked) {
      setSelectedRows((prev) => [...prev, row.id]);
      setclickedRow();
    } else {
      setSelectedRows((prev) => prev.filter((id) => id !== row.id));
    }
  };

  const handlerowclick = (id) => {
    setclickedRow((prev) => prev.filter((prev) => prev !== id));
  };

  const expandedColumns = [
    {
      width: "48px",
      cell: () => null,
      style: {
        backgroundColor: "transparent",
      },
    },
    {
      name: "Exchange Name",
      selector: (row) => row.subName,
      grow: 1,
      minWidth: "220px",
      width: "290px",
      wrap: true,
      style: {
        fontWeight: "600",
        color: "#2c3e50",
      },
    },
    {
      name: "Type",
      selector: (row) => row.subDomain || "-",
      grow: 1,
      minWidth: "220px",
      width:"290px",
      style: {
        color: "#7f8c8d",
      },
    },

    {
      name: "Store",
      selector: (row) => row.store || "-",
      grow: 1,
      minWidth: "140px",
      width:"155px",
      style: {
        color: "#7f8c8d",
      },
    },
    {
      name: "Auctions",
      selector: (row) => row.subAuctions,
      right: true,
      minWidth: "160px",
      width:"160px",
      style: {
        fontWeight: "500",
        color: "#2c3e50",
      },
    },
    {
      name: "CPM",
      selector: (row) => row.subCpm,
      right: true,
      minWidth: "140px",
      width:"155px",
      style: {
        fontWeight: "400",
      },
    },
        {
      name: "Sub ID",
      selector: (row) => row.ss || "-",
      grow: 1,
      minWidth: "160px",
      width:"160px",
      wrap: true,
      style: {
        color: "#7f8c8d",
      },
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

  const exportToExcel = () => {
    if (!inventoryData || inventoryData.length === 0) return;
    const exportData = [];
    inventoryData.forEach((item) => {
      exportData.push({
        "Domain / App Name": item.domain,
        "Domain / App ID": item.subId,
        Type: item.type,
        "App Store Name": item.store,
        "Yesterday's Auctions": item.auctions,
        "Observed CPM": item.cpm,
        "Exchange Name": "",
      });
      if (item.details && item.details.length > 0) {
        item.details.forEach((detail) => {
          exportData.push({
            "Domain / App Name": "",
            "Domain / App ID": detail.subId,
            Type: detail.type,
            "App Store Name": detail.store,
            "Yesterday's Auctions": detail.subAuctions,
            "Observed CPM": detail.subCpm,
            "Exchange Name": detail.subName,
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, "Inventory.xlsx");
  };

  const ExpandedComponent = ({ data }) => {
    return (
      <div className="expanded-datatable">
        <DataTable
          className="inventory-datatable1"
          columns={expandedColumns}
          data={data.details}
          keyField="subId"
          dense
          highlightOnHover
          noHeader
          customStyles={expandedTableStyles}
          // conditionalRowStyles={conditionalRowStylesexpandabale}
          onRowClicked={(row) => {
            setclickedRowexpandable(row.subId);
            setclickedRow([]);
          }}
        />
      </div>
    );
  };

  const CustomPagination = ({
    rowsPerPage,
    rowCount,
    onChangePage,
    currentPage,
  }) => {
    const totalPages = Math.ceil(rowCount / rowsPerPage);
    const [goToPage, setGoToPage] = useState("");
    let debounceTimer = useRef(null);
    const handleGoToPage = (e) => {
      const value = e.target.value;
      setGoToPage(value);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const page = parseInt(value, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          onChangePage(page);
          setGoToPage("");
        }
      }, 500);
    };

    return (
      <div className="inventory-pagination-shell">
        <span className="inventory-pagination-summary-text">
          {(currentPage - 1) * rowsPerPage + 1}-
          {Math.min(currentPage * rowsPerPage, rowCount)} of {rowCount}
        </span>
        <button
          className="btn btn-sm border rounded-0 px-2 py-0 inventory-pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onChangePage(1)}
        >
          {"<<"}
        </button>
        <button
          className="btn btn-sm border rounded-0 px-2 py-0 inventory-pagination-btn"
          disabled={currentPage === 1}
          onClick={() => onChangePage(currentPage - 1)}
        >
          {"<"}
        </button>
        <span className="inventory-pagination-summary-text">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-sm border rounded-0 px-2 py-0 inventory-pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(currentPage + 1)}
        >
          {">"}
        </button>
        <button
          className="btn btn-sm border rounded-0 px-2 py-0 inventory-pagination-btn"
          disabled={currentPage === totalPages}
          onClick={() => onChangePage(totalPages)}
        >
          {">>"}
        </button>
        <div className="d-flex align-items-center gap-1 inventory-go-to-wrapper">
          <span className="inventory-go-to-label">Go to:</span>
          <input
            className="pagination-number-inventory"
            type="text"
            min="1"
            max={totalPages}
            value={goToPage}
            onChange={(e) => setGoToPage(Number(e.target.value))}
            onKeyUp={handleGoToPage}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="content1">
      <div class="content-wrapper">
        {modal && (
          <DecisionModal
            title="Really delete creative?"
            message="Only the db admin can undo this if you delete it!!!"
            name="DELETE"
            callback={modalCallback}
          />
        )}
        {creative === null && canViewUser && (
          // <Tabs>
          //   {tabsList.map((tab) => (
          //     <Tab
          //       key={tab.value}
          //       value={tab.value}
          //       header={tab.header}
          //       route={tab.route}
          //       state={tab.state}
          //     >
          <div>
            <Row className="inventory-row m-0 p-0">
              <Col xs="12" className="m-0 p-0">
                {/* Original header replaced by Tabs */}
              </Col>
            </Row>

            <Row className="g-0 m-0 p-0">
              {/* Sidebar filter panel */}
              <div className={`devices-sidebar-panel ${collapsed ? "devices-sidebar-collapsed" : "devices-sidebar-expanded"}`}>
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
                        <label className="appdomaintype">Domain Type</label>
                      </div>
                      <div className="sq-checkbox mt-1">
                        <input
                          type="checkbox"
                          name="app"
                          checked={formData.app}
                          onChange={handleCheckboxChange}
                          className="ms-1"
                        />
                        <label className="appdomaintype">App</label>

                        <input
                          className="ms-4"
                          type="checkbox"
                          name="anotherCheck"
                          checked={formData.anotherCheck}
                          onChange={handleCheckboxChange}
                        />
                        <label className="appdomaintype">Site</label>
                      </div>
                      <div
                        className="custom-select-wrapper mt-2"
                        ref={domainTypeRef}
                      >
                        <div className="d-flex flex-row justify-content-between align-items-center">
                          <label className="form-label inventory-label">
                            Add Type
                          </label>
                          {selectedDomainType.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedDomainType([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div
                          className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input devices-select-trigger"
                          onClick={() => {
                            setOpenDomainType(!openDomainType);
                            setOpenAdSize(false);
                            setOpenDeviceType(false);
                          }}
                          tabIndex={0}
                        >
                          {selectedDomainType.length > 0 ? (
                            <span className="inventory-inputvlaue fw-bold">
                              {selectedDomainType.join(", ")}
                            </span>
                          ) : (
                            "Select Add Type"
                          )}
                          <FaCaretDown
                            className={`custom-select-icon ${openDomainType ? "open" : ""}`}
                          />
                        </div>
                        {openDomainType && (
                          <div className="custom-dropdown-menu devices-dropdown-menu">
                            {domainTypeOptions.map((opt) => (
                              <div
                                key={opt}
                                className={`custom-dropdown-option devices-dropdown-option ${selectedDomainType.includes(opt) ? "selected" : ""}`}
                                onClick={() =>
                                  handleDomainTypeSelect(opt)
                                }
                              >
                                {selectedDomainType.includes(opt) && (
                                  <span className="devices-dropdown-choice-icon">
                                    ✔
                                  </span>
                                )}
                                <span>{opt}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2">
                          {selectedDomainType.map((type, idx) => (
                            <span
                              key={idx}
                              className="badge me-1 mt-1 devices-chip"
                            >
                              {type}
                              <span
                                className="devices-chip-remove"
                                onClick={() => handleDomainTypeSelect(type)}
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Ad Size Multi-Select */}
                      <div
                        className="custom-select-wrapper mt-2"
                        ref={adSizeRef}
                      >
                        <div className="d-flex flex-row justify-content-between align-items-center">
                          <label className="form-label inventory-label">
                            Ad Size
                          </label>
                          {selectedAdSizes.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedAdSizes([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div
                          className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input devices-select-trigger"
                          onClick={() => {
                            setOpenAdSize(!openAdSize);
                            setOpenDomainType(false);
                            setOpenDeviceType(false);
                          }}
                          tabIndex={0}
                        >
                          {selectedAdSizes.length > 0 ? (
                            <span className="inventory-inputvlaue fw-bold">
                              {selectedAdSizes.join(", ")}
                            </span>
                          ) : (
                            "Select Ad Size"
                          )}
                          <FaCaretDown
                            className={`custom-select-icon ${openAdSize ? "open" : ""}`}
                          />
                        </div>
                        {openAdSize && (
                          <div className="custom-dropdown-menu devices-dropdown-menu">
                            {adSizeOptions.map((size) => (
                              <div
                                key={size}
                                className={`custom-dropdown-option devices-dropdown-option ${selectedAdSizes.includes(size) ? "selected" : ""}`}
                                onClick={() => handleAdSizeSelect(size)}
                              >
                                {selectedAdSizes.includes(size) && (
                                  <span className="devices-dropdown-choice-icon">
                                    ✔
                                  </span>
                                )}
                                <span>{size}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2">
                          {selectedAdSizes.map((size, idx) => (
                            <span
                              key={idx}
                              className="badge me-1 mt-1 devices-chip"
                            >
                              {size}
                              <span
                                className="devices-chip-remove"
                                onClick={() => handleAdSizeSelect(size)}
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Device Type */}
                      <div
                        className="mt-2 position-relative custom-select-wrapper"
                        ref={deviceRef}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label mb-0 inventory-label">
                            Device Type
                          </label>
                          {selectedDeviceType.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedDeviceType([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="position-relative">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input devices-select-trigger"
                            onClick={() => {
                              setOpenDeviceType(!openDeviceType);
                              setOpenDomainType(false);
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
                                      <span
                                        className="devices-dropdown-choice-icon"
                                      >
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
                              className="badge me-1 mt-1 devices-chip"
                            >
                              {devicetype}
                              <span
                                className="devices-chip-remove"
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
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label mb-0 inventory-label">
                            Exchanges
                          </label>
                          {selectedExchanges.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedExchanges([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="position-relative">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input devices-select-trigger"
                            onClick={() =>
                              setopenExchanges(!openExchanges)
                            }
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
                          <div className="custom-dropdown-menu devices-dropdown-menu">
                            {exchanges.map((exchange) => {
                              const isSelected = selectedExchanges.includes(
                                exchange.name
                              );
                              return (
                                <div
                                  key={exchange.exchangeId}
                                  onClick={() =>
                                    handleExchangesTypeSelect(exchange.name)
                                  }
                                  className={`custom-dropdown-option devices-dropdown-option ${isSelected ? "selected" : ""}`}
                                >
                                  {isSelected && (
                                    <span
                                      className="devices-dropdown-choice-icon"
                                    >
                                      ✔
                                    </span>
                                  )}
                                  <span>{exchange.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div className="mt-2">
                          {selectedExchanges.map((exchange, idx) => (
                            <span
                              key={idx}
                              className="badge me-1 mt-1 devices-chip"
                            >
                              {exchange}
                              <span
                                className="devices-chip-remove"
                                onClick={() =>
                                  handleRemoveExchange(exchange)
                                }
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="mt-2 position-relative custom-select-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label mb-0 inventory-label">
                            Categories
                          </label>
                          {selectedCategories.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedCategories([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div
                          className="form-control py-1 px-2 rounded-0 formatsize devices-select-trigger devices-select-trigger-center"
                          onClick={toggleModal}
                        >
                          <span className="inventory-input-text">
                            Select Categories
                          </span>
                        </div>
                        <div className="mt-2 text-start">
                          {selectedCategories
                            .filter(
                              (cat) =>
                                cat.isParent &&
                                !selectedCategories.some(
                                  (other) =>
                                    other.parent === cat.grandparent
                                )
                            )
                            .map((cat, idx) => (
                              <span
                                key={idx}
                                className="badge me-1 mt-1 devices-chip devices-chip-accent"
                              >
                                {cat.parent}{" "}
                                {cat.childrenCount > 0 &&
                                  `(${cat.childrenCount})`}
                                <span
                                  className="devices-chip-remove"
                                  onClick={() =>
                                    handleRemoveCategory(cat.parent)
                                  }
                                >
                                  ×
                                </span>
                              </span>
                            ))}
                        </div>
                        <CategoriesModal
                          modalOpen={modalOpen}
                          toggleModal={toggleModal}
                          selectedCategories={selectedCategories}
                          setSelectedCategories={setSelectedCategories}
                        />
                      </div>

                      {/* Countries/Regions */}
                      <div className="mt-2 position-relative custom-select-wrapper">
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label mb-0 inventory-label">
                            Countries/Regions
                          </label>
                          {selectedCountryItems.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
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
                              {c.childrenCount > 0 && ` (${c.childrenCount})`}
                              <span
                                className="devices-chip-remove"
                                onClick={() => handleRemoveCountry(c.parent)}
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
                          onKeyUp={(e) =>
                            e.key === "Enter" && handleApplyFilters()
                          }
                        />

                        <button
                          type="button"
                          onClick={refreshInventoryOnly}
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
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="cd-pagination-nav-btn devices-pagination-nav-btn" type="button">
                                  <FaChevronRight className="devices-pagination-chevron devices-pagination-chevron-right" />
                                </button>
                                <div
                                  id="items-per-page-wrapper"
                                  ref={perPageRef}
                                  className="devices-per-page-wrapper"
                                >
                                  <div className="campaign-select-wrapper inventory-select-wrapper">
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
                                            className={`custom-dropdown-option devices-dropdown-option ${isSelected ? "selected" : ""}`}
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
                          onClick={refresh}
                          className="inventory-toolbar-btn inventory-toolbar-secondary d-flex align-items-center justify-content-center"
                          id="newaudience"
                        >
                          <i className="fa fa-repeat me-1" id="datarefresh"></i>
                          <span className="linkto">Data Refresh</span>
                        </button> */}

                        <Dropdown
                          isOpen={inventoryDropdownOpen}
                          toggle={toggleInventoryDropdown}
                        >
                          {canCreateUser && (
                            <DropdownToggle
                              size="sm"
                              className="btn-fill rounded-0 no-active-style d-flex align-items-center inventory-add-to-toggle"
                              color="success"
                              caret={false}
                              id="newaudience"
                            >
                              <span className="linkto">Add to</span>
                              <FaCaretDown size={14} />
                            </DropdownToggle>
                          )}
                          <DropdownMenu end>
                            <DropdownItem
                              onClick={() => {
                                toggleconversiontModal("");
                              }}
                            >
                              <span className="inventorydomain">
                                New Domain List
                              </span>
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                togglecurrentdomainModal("");
                              }}
                            >
                              <span className="inventorydomain">
                                Current Domain List
                              </span>
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>

                        <InventoryConversionModal
                          isOpen={conversionModalOpen}
                          toggle={toggleconversiontModal}
                          inventory={selectedInventory}
                        />
                        <CurrentDomainModal
                          isOpen={currentdomainModalOpen}
                          toggle={togglecurrentdomainModal}
                          inventory={selectedInventory}
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
                <div className="campaign-daily-table-wrapper">
                  <div className="devices-table-shell">
                    <div className="devices-table-inner">
                      <DataTable
                        keyField="rowKey"
                        className="inventory-datatable"
                        columns={buildColumns()}
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
              </div>
            </Row>
          </div>
          //     </Tab>
          //   ))}
          // </Tabs>
        )}
        {creative === null && !canViewUser && (
          <div className="alert alert-warning mt-3 inventory-access-denied">
            <i className="fa fa-exclamation-triangle me-2"></i>
            <strong>Access Denied:</strong> You do not have permission to view the Inventory.
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
