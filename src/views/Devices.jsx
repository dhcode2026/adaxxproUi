import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { Button, Card, Row, Col, Input, Collapse, CardBody } from "reactstrap";
import { useViewContext } from "../ViewContext";
import DecisionModal from "../DecisionModal";
import { FaCaretDown, FaChevronRight, FaChevronDown, FaCaretRight, FaCaretLeft } from "react-icons/fa";
import CountriesModal from "./Modal/CountriesRegionsModal";
import DataTable from "react-data-table-component";
import {
  publisherinventorylist,
  getAllDevices,
  getAllKibanaDeviceArchived,
  getAllExchange,
  getAllkibanapublisher
} from "./api/Api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs, TabHeaderName } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/devices.css";
var undef;

const Devices = (props) => {
  const vx = useViewContext();
  const location = useLocation();
  const [creative, setCreative] = useState(null);
  const [count, setCount] = useState(0);
  const [inventoryData, setInventoryData] = useState([]);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    "Device Type",
    "Make",
    "Model",
    "OS Type",
    "OS Version",
    "Yesterday Auction",
    "Observed CPM",
  ]);
  const toggleCustomizationModal = () =>
    setCustomizationModalOpen(!customizationModalOpen);
  const [loading, setLoading] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [size, setsize] = useState([]);
  const [openExchanges, setopenExchanges] = useState(false);
  const exchangesRef = useRef(null);
  const [exchanges, setExchanges] = useState([]);
  const [selectedExchanges, setSelectedExchanges] = useState([]);
  const [selectedModel, setSelectedModel] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [openModel, setOpenModel] = useState(false);
  const modelRef = useRef(null);
  const [allDevices, setAllDevices] = useState([]);
  const [MakeOptions, setMakeOptions] = useState([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState([]);
  const [selectedMake, setSelectedMake] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCountriesModalOpen, setIsCountriesModalOpen] = useState(false);
  const [selectedCountryItems, setSelectedCountryItems] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState([]);
  const [openFormat, setOpenFormat] = useState(false);
  const formatOptions = ["Audio", "banner", "Native", "Video"];
  const formatRef = useRef(null);
  const [openDeviceType, setOpenDeviceType] = useState(false);
  const [openMake, setOpenMake] = useState(false);
  const deviceRef = useRef(null);
  const makeRef = useRef(null);
  const allowedExchanges = ["pubmatic", "vlion", "eqativ"];
  const [canViewUser, setCanViewUser] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [canDeleteUser, setCanDeleteUser] = useState(false);
  const [canUpdateUser, setCanUpdateUser] = useState(false);
  const [canCreateUser, setCanCreateUser] = useState(false);

  const handleRemoveExchange = (value) => {
    setSelectedExchanges(selectedExchanges.filter((item) => item !== value));
  };

  const handleModelSelect = (input) => {
    const value = typeof input === "string" ? input : input.target.value;
    if (!value) return;

    if (selectedModel.includes(value)) {
      setSelectedModel(selectedModel.filter((item) => item !== value));
    } else {
      setSelectedModel([...selectedModel, value]);
    }
  };

  const handleRemoveModel = (value) => {
    setSelectedModel(selectedModel.filter((item) => item !== value));
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


  // Use global tabs
  const {
    globalTabsList: tabsList,
    addTab,
    removeTab,
    updateTab,
    initializePageTab,
  } = useGlobalTabs();

  useEffect(() => {
    initializePageTab("Devices", "fa fa-laptop", "/admin/Devices");
  }, [initializePageTab]);


  const fetchInventory = async (filterPayload = null) => {
    setLoading(true);
    try {
      let response;
      if (filterPayload) {
        response = await getAllKibanaDeviceArchived(filterPayload);
      } else {
        const initialPayload = {
          domainType: [],
          adType: [],
          deviceType: [],
          make: [],
          model: [],
          exchange: [],
          countryRegions: [],
          filterType: false,
        };
        response = await getAllKibanaDeviceArchived(initialPayload);
      }

      if (
        response.data &&
        response.data.data &&
        response.data.data.kibanaInformationData
      ) {
        const transformed = transformApiResponse(
          response.data.data.kibanaInformationData,
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
    return apiData.map((item) => {
      const stripBrackets = (str) => {
        if (!str) return "-";
        if (typeof str !== "string") return str;
        return str.replace(/[\[\]]/g, "").trim();
      };

      const cpm =
        item.observedCPM !== undefined && item.observedCPM !== null
          ? `$${Number(item.observedCPM).toFixed(2)}`
          : "-";

      const exchangeName = item.exchange || item.exchangeName || "-";
      const auctions = item.yesterdayAuction || item.auctions || "0";

      return {
        id: item.kibanaDevicesId,
        subId: item.kibanaDevicesId,
        ifa: stripBrackets(item.deviceIfa) || "-",
        adzType: stripBrackets(item.adzType) || "",
        make: stripBrackets(item.deviceMake || item.make) || "-",
        model: stripBrackets(item.deviceModel || item.model) || "-",
        osType: stripBrackets(item.deviceOs || item.osType) || "-",
        osVersion: stripBrackets(item.deviceOsVersion || item.osVersion) || "-",
        exchangeName: exchangeName,
        createdAt: item.createdAt || "-",
        updatedAt: item.updatedAt || "-",
        auctions: auctions,
        cpm: cpm,
        store: "-",
        details: [
          {
            subId: `${item.kibanaDevicesId}-exchange`,
            subIfa: exchangeName,
            subDeviceType: "-",
            subMake: "-",
            subModel: "-",
            subOsType: "-",
            subOsVersion: "-",
            subAuctions: auctions,
            subCpm: cpm,
          },
        ],
      };
    });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const hasCreatePermission = canCreate("Devices");
    const hasViewPermission = canView("Devices");
    const hasEditPermission = canEdit("Devices");
    const hasDeletePermission = canDelete("Devices");
    const hasUpdatePermission = canUpdate("Devices");

    setCanCreateUser(hasCreatePermission);
    setCanViewUser(hasViewPermission);
    setCanEditUser(hasEditPermission);
    setCanDeleteUser(hasDeletePermission);
    setCanUpdateUser(hasUpdatePermission);
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
    fetchInventory();
  };

  const handleApplyFilters = () => {
    const adTypeValues = [];
    if (formData.app) adTypeValues.push("app");
    if (formData.anotherCheck) adTypeValues.push("site");
    const domainTypeValues = selectedFormat.map(format => {
      switch (format) {
        case "Display": return "banner";
        case "Video": return "video";
        case "Audio": return "audio";
        case "Native": return "native";
        default: return format.toLowerCase();
      }
    });

    const payload = {
      domainType: domainTypeValues,
      adType: adTypeValues,
      deviceType: selectedDeviceType.map(d => d.toLowerCase()),
      make: selectedMake.map(m => m.toLowerCase()),
      model: selectedModel.map(m => m.toLowerCase()),
      country: Array.from(new Set(selectedCountryItems.map(c => c.iso3))),
      region: selectedCountryItems.flatMap(c => c.regions || []),
      exchange: selectedExchanges.map(ex => ex.toLowerCase()),
      filterType: true,
    };
    fetchInventory(payload);
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
        row?.ifa,
        row?.adzType,
        row?.make,
        row?.model,
        row?.osType,
        row?.osVersion,
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


  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await getAllDevices();
        console.log("API Response for devices:", response);

        const devices = response?.data?.data?.informationDevice || [];
        setAllDevices(devices);

        const formattedOptions = [
          ...new Map(
            devices.map((device) => {
              const cleanName = device.name.replace(/\.$/, "").trim();
              return [
                cleanName,
                {
                  label: cleanName,
                  value: cleanName,
                },
              ];
            }),
          ).values(),
        ];
        console.log("formated :", formattedOptions);

        setMakeOptions(formattedOptions);
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };

    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedMake.length > 0) {
      const filteredModels = allDevices
        .filter((device) => {
          const cleanName = device.name.replace(/\.$/, "").trim();
          return selectedMake.includes(cleanName);
        })
        .flatMap((device) => (device.versions || []).map((v) => v.name));

      const uniqueModels = Array.from(new Set(filteredModels)).sort();
      setModelOptions(uniqueModels);
    } else {
      setModelOptions([]);
      setSelectedModel([]);
    }
  }, [selectedMake, allDevices]);


  const handleRemoveDeviceType = (value) => {
    setSelectedDeviceType(selectedDeviceType.filter((item) => item !== value));
  };

  const handleRemoveMake = (value) => {
    setSelectedMake(selectedMake.filter((item) => item !== value));
  };

  const toggleModal = () => setModalOpen(!modalOpen);
  const toggleCountriesModal = () =>
    setIsCountriesModalOpen(!isCountriesModalOpen);

  const handleRemoveCountry = (name) => {
    setSelectedCountryItems((prev) => prev.filter((c) => c.parent !== name));
  };


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formatRef.current && !formatRef.current.contains(e.target)) {
        setOpenFormat(false);
      }
      if (deviceRef.current && !deviceRef.current.contains(e.target)) {
        setOpenDeviceType(false);
      }
      if (makeRef.current && !makeRef.current.contains(e.target)) {
        setOpenMake(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target)) {
        setOpenModel(false);
      }
      if (exchangesRef.current && !exchangesRef.current.contains(e.target)) {
        setopenExchanges(false);
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

  const handleMakeSelect = (input) => {
    const value = typeof input === "string" ? input : input.label;
    if (!value) return;
    if (selectedMake.includes(value)) {
      setSelectedMake(selectedMake.filter((item) => item !== value));
    } else {
      setSelectedMake([...selectedMake, value]);
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

  const CustomLoader = () => (
    <div className="customloader text-center py-4">
      <div className="loader"></div>
      <div className="ms-2 fw-bold">Loading...</div>
    </div>
  );

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

  const allColumns = [
    {
      name: "Device IFA",
      selector: (row) => row.ifa || "-",
      sortable: true,
      grow: 1,
      minWidth: "200px",
      width:"160px",
      wrap: true,
    },
    {
      name: "Device Type",
      selector: (row) => row.adzType || "",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      name: "Make",
      selector: (row) => row.make || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "460px",
      wrap: true,
    },
    {
      name: "Model",
      selector: (row) => row.model || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "460px",
      wrap: true,
    },
    {
      name: "OS Type",
      selector: (row) => row.osType || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
      wrap: true,
    },
    {
      name: "OS Version",
      selector: (row) => row.osVersion || "-",
      sortable: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
      wrap: true,
    },
    {
      name: "Yesterday Auction",
      selector: (row) => row.auctions,
      sortable: true,
      right: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      name: "Observed CPM",
      selector: (row) => row.cpm,
      sortable: true,
      right: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
    },
  ];

  const expandedColumns = [
    {
      name: "",
      width: "48px",
      cell: () => null,
    },
    {
      selector: (row) => row.subIfa || "-",
      grow: 1,
     minWidth: "120px",
      maxWidth: "160px",
      wrap: true,
    },
    {
      selector: (row) => row.subDeviceType || "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "460px",
    },
    {
      selector: (row) => row.subMake || "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "460px",
    },
    {
      selector: (row) => row.subModel || "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      selector: (row) => row.subOsType || "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      selector: (row) => row.subOsVersion || "-",
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      selector: (row) => row.subAuctions,
      right: true,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      selector: (row) => row.subCpm,
      right: true,
      minWidth: "120px",
      maxWidth: "160px",
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
    const isActive = data.id == clickedRow;
    return (
      <div
        className=" border-bottom"
        style={{
          backgroundColor: isActive ? "#63903f" : "#f8f9fa",
          color: isActive ? "white" : "black",
        }}
      >
        {data.details && data.details.length > 0 && (
          <div className="expanded-datatable">
            <DataTable
              className="inventory-datatable1"
              columns={expandedColumns}
              data={data.details}
              keyField="subId"
              dense
              striped
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
        )}
      </div>
    );
  };

  const columns = allColumns.filter((col) => {
    return typeof col.name === "string" && selectedColumns.includes(col.name);
  });

  const handlerowclick = (id) => {
    setclickedRow((prev) => prev.filter((prev) => prev !== id));
  };

  const exportToExcel = () => {
    if (!inventoryData || inventoryData.length === 0) return;
    const exportData = [];
    inventoryData.forEach((item) => {
      exportData.push({
        "Device IFA": item.ifa || "-",
        "Device Type": item.adzType || "-",
        Make: item.make || "-",
        Model: item.model || "-",
        "OS Type": item.osType || "-",
        "OS Version": item.osVersion || "-",
        "Yesterday Auction": item.auctions || "0",
        "Observed CPM": item.cpm || "-",
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Devices");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, "Devices.xlsx");
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
                      <div className=" mb-1 inventory-sidebar-heading inventoryfilter">
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
                        <label className="appdomaintype">Site</label>
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
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedFormat([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div
                          className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input devices-select-trigger"
                          onClick={() => {
                            setOpenFormat(!openFormat);
                            setOpenDeviceType(false);
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
                          <div className="custom-dropdown-menu devices-dropdown-menu devices-dropdown-menu-scroll">
                            {formatOptions.map((opt) => (
                              <div
                                key={opt}
                                className={`custom-dropdown-option devices-dropdown-option ${selectedFormat.includes(opt) ? "selected" : ""}`}
                                onClick={() => handleFormatSelect(opt)}
                              >
                                {selectedFormat.includes(opt) && (
                                  <span className="devices-dropdown-choice-icon">
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
                        className="mt-2 position-relative custom-select-wrapper"
                        ref={deviceRef}
                      >
                        <div className="d-flex justify-content-between align-items-center ">
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
                        <div className="devices-dropdown-wrapper">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input devices-select-trigger"
                            onClick={() => {
                              setOpenDeviceType(!openDeviceType);
                              setOpenFormat(false);
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
                            <FaCaretDown className={`devices-select-icon custom-select-icon ms-2 ${openDeviceType ? "open" : ""}`} />
                          </div>
                          {openDeviceType && (
                            <div
                              className="custom-dropdown-menu"
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 99999,
                                backgroundColor: "#fff",
                                border: "1px solid #dadada",
                              }}
                            >
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
                            <span key={idx} className="badge me-1 mt-1 devices-chip">
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
                        ref={makeRef}
                      >
                        <div className="d-flex justify-content-between align-items-center ">
                          <label className="form-label mb-0 inventory-label">
                            Make
                          </label>
                          {selectedMake.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedMake([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="devices-dropdown-wrapper">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input devices-select-trigger"
                            onClick={() => {
                              setOpenMake(!openMake);
                              setOpenFormat(false);
                            }}
                            tabIndex={0}
                          >
                            {selectedMake.length > 0 ? (
                              <span className="fw-bold inventory-inputvlaue">
                                {selectedMake.join(", ")}
                              </span>
                            ) : (
                              "Select Make"
                            )}
                            <FaCaretDown className={`devices-select-icon custom-select-icon ms-2 ${openMake ? "open" : ""}`} />
                          </div>
                          {openMake && (
                            <div
                              className="custom-dropdown-menu"
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                zIndex: 99999,
                                backgroundColor: "#fff",
                                border: "1px solid #dadada",
                              }}
                            >
                              {MakeOptions.map((make, idx) => {
                                const isSelected =
                                  selectedMake.includes(make);

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleMakeSelect(make)}
                                    className={`custom-dropdown-option devices-dropdown-option ${isSelected ? "selected" : ""}`}
                                  >
                                    {isSelected && (
                                      <span className="devices-dropdown-choice-icon">
                                        ✔
                                      </span>
                                    )}
                                    <span>{make.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-2">
                          {selectedMake.map((make, idx) => (
                            <span key={idx} className="badge me-1 mt-1 devices-chip">
                              {make}
                              <span
                                className="devices-chip-remove"
                                onClick={() => handleRemoveMake(make)}
                              >
                                ×
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        className="mt-2 position-relative custom-select-wrapper"
                        ref={modelRef}
                      >
                        <div className="d-flex justify-content-between align-items-center ">
                          <label className="form-label mb-0 inventory-label">
                            Model
                          </label>
                          {selectedModel.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-link mt-2 p-0 devices-clear-button"
                              onClick={() => setSelectedModel([])}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="devices-dropdown-wrapper">
                          <div
                            className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input devices-select-trigger"
                            onClick={() => {
                              setOpenModel(!openModel);
                              setOpenMake(false);
                            }}
                            tabIndex={0}
                          >
                            {selectedModel.length > 0 ? (
                              <span className="fw-bold inventory-inputvlaue">
                                {selectedModel.join(", ")}
                              </span>
                            ) : (
                              "Select Model"
                            )}
                            <FaCaretDown className={`devices-select-icon custom-select-icon ms-2 ${openModel ? "open" : ""}`} />
                          </div>
                          {openModel && (
                            <div className="custom-dropdown-menu devices-dropdown-menu devices-dropdown-menu-scroll">
                              {modelOptions.length > 0 ? (
                                modelOptions.map((model, idx) => {
                                  const isSelected =
                                    selectedModel.includes(model);

                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => handleModelSelect(model)}
                                      className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {isSelected && (
                                        <span
                                          style={{
                                            color: "#fff",
                                            backgroundColor: "#4c9eec",
                                            borderRadius: "50%",
                                            padding: "0 6px",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          ✔
                                        </span>
                                      )}
                                      <span className="ms-2">{model}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="p-2 text-muted text-center">
                                  {selectedMake.length > 0
                                    ? "No models found"
                                    : "Select a Make first"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-2">
                          {selectedModel.map((model, idx) => (
                            <span key={idx} className="badge me-1 mt-1 devices-chip">
                              {model}
                              <span
                                className="devices-chip-remove"
                                onClick={() => handleRemoveModel(model)}
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
                          <div className="custom-dropdown-menu devices-dropdown-menu devices-dropdown-menu-scroll">
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
                                  className={`custom-dropdown-option devices-dropdown-option ${isSelected ? "selected" : ""}`}
                                >
                                  {isSelected && (
                                    <span className="devices-dropdown-choice-icon">
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
                          <span key={idx} className="badge me-1 mt-1 devices-chip">
                            {exchange}
                            <span
                              className="devices-chip-remove"
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
                            <span key={idx} className="badge me-1 mt-1 devices-chip devices-chip-accent">
                              {c.parent}
                              {c.childrenCount > 0 &&
                                ` (${c.childrenCount})`}
                              <span
                                className="devices-chip-remove"
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

                      <div className="m-4"></div>
                    </div>
                    <Row className="border-top">
                      <Col md="5"></Col>
                      <Col className="text-end">
                        <button
                          size="sm"
                          className="formatsize mt-2 inventoryfiltes border-0 text-light text-nowrap"
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
                          <div className="devices-pagination-summary">
                            {filteredInventoryData.length ? `${currentPage} of ${totalPages}` : '0 of 0'}
                          </div>
                          <div className="devices-pagination-toolbar">
                            {totalPages > 1 && (
                              <div className="devices-pagination-controls">
                                <button
                                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                  disabled={currentPage === 1}
                                  className="devices-pagination-nav-btn"
                                  type="button"
                                >
                                  <FaChevronRight className="devices-pagination-chevron devices-pagination-chevron-left" />
                                </button>
                                <button
                                  className="devices-pagination-page-btn devices-pagination-page-btn-active"
                                  type="button"
                                >
                                  {currentPage}
                                </button>
                                <span className="devices-pagination-label">of</span>
                                <button className="devices-pagination-page-btn" type="button">
                                  {totalPages}
                                </button>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="devices-pagination-nav-btn" type="button">
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
              </div>
            </Row>
          </div>
        )}
        {creative === null && !canViewUser && (
          <div className="alert alert-warning mt-3" style={{ margin: '20px' }}>
            <i className="fa fa-exclamation-triangle me-2"></i>
            <strong>Access Denied:</strong> You do not have permission to view the Devices.
          </div>
        )}
      </div>
    </div>
  );
};

export default Devices;
