import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaCaretDown } from "react-icons/fa";
import {
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  Row,
  Col,
  Badge,
} from "reactstrap";
import DataTable from "react-data-table-component";
import { useViewContext } from "../../ViewContext";
import DecisionModal from "../../DecisionModal";
import InventoryConversionModal from "./InventoryConversionModal";
import CategoriesModal from "./categoriesModal";
import CountriesModal from "./CountriesRegionsModal";
import CurrentDomainModal from "./CurrentDomainModal";
import {
  getAllExchange,
  publisherinventorylist,
  filterPublishInventoryArchivePost,
  getAllCategory,
} from "../api/Api";
const steps = ["Exchanges", "Domains & Apps"];

const formatOptions = ["Audio", "Display", "Native", "Video"];
const DeviceTypeOptions = [
  "Desktop",
  "Phone",
  "Tablet",
  "Connected TV",
  "Digital Out-of-Home",
  "Unknown",
];
const exchangesOptions = [
  "Magnite",
  "Rubicon",
  "OpenX",
  "PubMatic",
  "AppNexus",
  "TripleLift",
];

const domainTypeOptions = ["Banner", "Audio","Video", "Native"];
const adSizeOptions = ["300x250", "728x90", "320x50", "320x480", "300x600"];



const InventoryModal = ({ isOpen, toggle, handlelocation, selectedData }) => {
  const vx = useViewContext();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [selectedInventoryIds, setSelectedInventoryIds] = useState([]);

  const [filterApp, setFilterApp] = useState(false);
  const [filterDomain, setFilterDomain] = useState(false);
  const [selectedDomainType, setSelectedDomainType] = useState([]);
  const [openDomainType, setOpenDomainType] = useState(false);
  const [selectedAdSizes, setSelectedAdSizes] = useState([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState([]);
  const [selectedExchanges, setSelectedExchanges] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [adSize, setAdSize] = useState("");
  const [openAdSize, setOpenAdSize] = useState(false);
  const [openDeviceType, setOpenDeviceType] = useState(false);
  const [openExchanges, setopenExchanges] = useState(false);
  const [categoryLookup, setCategoryLookup] = useState({});
  const [collapsed, setCollapsed] = useState(true);
  const [inventoryDropdownOpen, setInventoryDropdownOpen] = useState(false);
  const toggleInventoryDropdown = () => setInventoryDropdownOpen(prev => !prev);

  const [inventoryData, setInventoryData] = useState([]);
  const [count, setCount] = useState(0);
  const [conversionModalOpen, setConversionModalOpen] = useState(false);
  const toggleconversiontModal = () => setConversionModalOpen(!conversionModalOpen);
  const [currentdomainModalOpen, setCurrentDomainModalOpen] = useState(false);
  const togglecurrentdomainModal = () => setCurrentDomainModalOpen(!currentdomainModalOpen);

  const [modalOpen, setModalOpen] = useState(false);
  const toggleModal = () => setModalOpen(!modalOpen);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCountriesModalOpen, setIsCountriesModalOpen] = useState(false);
  const [selectedCountryItems, setSelectedCountryItems] = useState([]);
  const toggleCountriesModal = () => setIsCountriesModalOpen(!isCountriesModalOpen);
  const [modal, setModal] = useState(false);

  const [clickedRow, setclickedRow] = useState([]);
  const [clickedRowexpandable, setclickedRowexpandable] = useState([]);
  const domainTypeRef = useRef(null);
  const adSizeRef = useRef(null);
  const deviceRef = useRef(null);
  const exchangesRef = useRef(null);
  const [inventoryRow, setInventoryRow] = useState([])
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const filteredInventoryData = useMemo(() => {
    if (!inventorySearchTerm) return inventoryData;
    const term = inventorySearchTerm.toLowerCase();
    return inventoryData.filter((item) => {
      const nameMatch = item.name && item.name !== "Unknown" && item.name.toLowerCase().includes(term);
      const domainMatch = item.domain && item.domain !== "-" && item.domain.toLowerCase().includes(term);
      const subIdMatch = item.subId && item.subId.toString().toLowerCase().includes(term);
      return nameMatch || domainMatch || subIdMatch;
    });
  }, [inventoryData, inventorySearchTerm]);

  const totalPages = Math.ceil(filteredInventoryData.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [inventorySearchTerm]);



  const CustomPagination = () => {
    return (
      <div className="d-none"></div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (domainTypeRef.current && !domainTypeRef.current.contains(e.target)) setOpenDomainType(false);
      if (adSizeRef.current && !adSizeRef.current.contains(e.target)) setOpenAdSize(false);
      if (deviceRef.current && !deviceRef.current.contains(e.target)) setOpenDeviceType(false);
      if (exchangesRef.current && !exchangesRef.current.contains(e.target)) setopenExchanges(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBlur = (value, setValue) => {
    if (value !== "") {
      const num = parseFloat(value.replace("$", ""));
      setValue(isNaN(num) ? "" : `$${num.toFixed(2)}`);
    }
  };

  const handleFocus = (value, setValue) => {
    if (value.startsWith("$")) {
      setValue(value.slice(1));
    }
  };

  const handleMultiSelect = (item, selected, setSelected) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((i) => i !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const redraw = () => setCount(count + 1);

  const refreshInventory = () => {
    fetchInventory();
  };

  useEffect(() => {
    const fetchLookup = async () => {
      try {
        const response = await getAllCategory();
        const json = response.data;
        const lookup = {};
        json.data.informationCategories.forEach((cat) => {
          lookup[cat.name] = { code: cat.categoryCode };
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

  const [formData, setFormData] = useState({
    exchange_scope: "0",
    domain_scope: "1",
    app: false,
    anotherCheck: false,
  });

  const handleFilterCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDomainTypeSelect = (opt) => {
    setSelectedDomainType(prev =>
      prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt]
    );
  };

  const handleAdSizeSelect = (size) => {
    setSelectedAdSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleDeviceTypeSelect = (type) => {
    setSelectedDeviceType(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleRemoveDeviceType = (type) => {
    setSelectedDeviceType(prev => prev.filter(t => t !== type));
  };

  const handleExchangesTypeSelect = (name) => {
    setSelectedExchanges(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleRemoveExchange = (name) => {
    setSelectedExchanges(prev => prev.filter(e => e !== name));
  };

  const handleApplyFilters = () => {
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
      deviceType: selectedDeviceType,
      adSize: selectedAdSizes,
      categories: Array.from(new Set(categoryPayload)),
      exchange: selectedExchanges.map(ex => ex.toLowerCase()),
      country: Array.from(new Set(selectedCountryItems.map((c) => c.parent))),
      region: selectedCountryItems.flatMap((c) => (c.regions ? c.regions : [])),
      filterType: true,
    };

    fetchInventory(payload);
  };

  const handleRemoveCategory = (parentName) => {
    setSelectedCategories((prev) =>
      prev.filter((item) => item.parent !== parentName)
    );
  };

  const handleRemoveCountry = (name) => {
    setSelectedCountryItems((prev) => prev.filter((c) => c.parent !== name));
  };

  const fetchExchangeList = async () => {
    setLoading(true);
    try {
      const res = await getAllExchange();
      const list = res?.data?.data?.informationExchanges || [];
      console.log("API Response:", list);

      // Filter for specific exchanges only
      const allowedExchanges = ["pubmatic", "vlion", "magnite dv+"];
      const filteredList = list.filter(item => {
        const name = (item.name || item.exchangeName || "").toLowerCase().trim();
        return allowedExchanges.includes(name);
      });

      const formatted = filteredList.map((item) => ({
        id: item.id || item._id || item.exchangeId,
        name: item.name || item.exchangeName || "Unnamed Exchange",
        originalData: item
      }));

      console.log("Formatted data:", formatted);
      setRowData(formatted);

      // Initialize selected exchange IDs from selectedData
      if (Array.isArray(selectedData)) {
        const savedExchanges = [...new Set(selectedData.flatMap(item => item.exchanges || []))].map(e => e.toLowerCase().trim());
        const initialExchangeIds = formatted
          .filter(item => savedExchanges.includes(item.name.toLowerCase().trim()))
          .map(item => item.id);
        setSelectedIds(initialExchangeIds);
      }
    } catch (err) {
      console.error("Error fetching exchanges:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen) {
      fetchExchangeList();
      
      if (Array.isArray(selectedData)) {
        const initialIds = [...new Set(selectedData.map(item => item.domainappid).filter(Boolean))];
        setSelectedInventoryIds(initialIds);
        setInventoryRow(selectedData);
        
        const savedExchanges = [...new Set(selectedData.flatMap(item => item.exchanges || []))];
        const isAllExchanges = savedExchanges.includes("All Exchanges");
        const hasSelectedInventory = selectedData.length > 0;
        
        setFormData(prev => ({
          ...prev,
          exchange_scope: isAllExchanges ? "1" : "0",
          domain_scope: hasSelectedInventory ? "0" : "1"
        }));
      }
    }
  }, [isOpen]);
  const filteredData = useMemo(() => {
    return rowData.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rowData, searchTerm]);

  const isAllFilteredSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every(item => selectedIds.includes(item.id));
  }, [filteredData, selectedIds]);
  const exchanges = useMemo(() => {
    return rowData
      .filter(item => selectedIds.includes(item.id))
      .map(item => item.name);
  }, [selectedIds, rowData]);

  const handleCheckboxChange = (row, checked) => {
    const id = row.id;

    if (typeof checked !== "boolean") {
      checked = !selectedIds.includes(id);
    }

    // update selected ids
    setSelectedIds(prev =>
      checked
        ? prev.includes(id) ? prev : [...prev, id]
        : prev.filter(itemId => itemId !== id)
    );
  };

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
  const conditionalRowStyles = [
    {
      when: (row) => selectedIds.includes(row.id),
      style: {
        backgroundColor: '#faebed !important',
        '& .gOorhn': {
          color: 'black !important',
        }
      },
    },
  ];

  const customStyles = {
    table: {
      style: {
        backgroundColor: '#f8f9fa',
        width: '100%',
      },
    },
    headRow: {
      style: {
        border: "1px solid #d4d4d4",
      },
    },
    headCells: {
      style: {
        borderRight: '1px solid #d4d4d4',
        '&:first-of-type': {
          paddingLeft: '16px',
        },
        '&:last-of-type': {
          borderRight: 'none',
        },
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        '&:first-of-type': {
          paddingLeft: '16px',
        },
      },
    },
    rows: {
      style: {
      },
    },
  };
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
              handleCheckboxChange(row, e.target.checked);
            }}
          />
        );
      },
      width: "80px",
      center: true,
    },
    {
      name: "Name",
      cell: (row) => <NameCell row={row} />,
      sortable: true,
      grow: 2,
    },
  ];


  const handleInventoryCheckboxChange = (row, checked) => {
    let id = row.id;

    if (typeof checked !== "boolean") {
      checked = !selectedInventoryIds.includes(id);
    }

    setSelectedInventoryIds(prev => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter(itemId => itemId !== id);
      }
    });

    setclickedRow && setclickedRow();

    setInventoryRow((prev) => {
      if (checked) {
        // Find all records in inventoryData that share the same subId/id
        let matchingRecords = inventoryData.filter(item => item.subId === row.subId);
        if (matchingRecords.length === 0) {
          matchingRecords = [row];
        }
        
        // Transform them to the structure used by inventoryRow
        const newItems = matchingRecords.map(item => ({
          domainappname: item.domain || item.name || item.domainappname || "",
          domainappid: item.subId || item.domainappid,
          appstorename: item.store || item.appstorename || "-",
          cpmbidrange: item.cpm || item.cpmbidrange || "-",
          exchanges: exchanges,
        }));

        // Filter out any items that are already in prev to avoid duplicates
        const uniqueNewItems = newItems.filter(
          newItem => !prev.some(p => p.domainappid === newItem.domainappid && p.domainappname === newItem.domainappname && p.cpmbidrange === newItem.cpmbidrange)
        );

        return [...prev, ...uniqueNewItems];
      } else {
        return prev.filter(
          (item) => item.domainappid !== row.subId
        );
      }
    });

    console.log("Updated inventoryRow:", inventoryRow);
  };
  const inventoryColumns = [
    {
      name: "",
      width: "40px",
      cell: (row) => (
        <Input
          type="checkbox"
          checked={selectedInventoryIds.includes(row.id)}
          onChange={(e) => handleInventoryCheckboxChange(row, e.target.checked)}
        />
      ),
      allowOverflow: true,
      button: true,
    },
    {
      name: "Domain / App Name",
      selector: row => row.domain,
      sortable: true,
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
      wrap: true
    },
    {
      name: "Type",
      selector: (row) => row.adzType || "",
      sortable: true,
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
    },

    {
      name: "Domain / App ID",
      selector: row => row.subId,
      sortable: true,
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
      wrap: true,
    },
    {
      name: "App Store Name",
      selector: row => row.store || "-",
      sortable: true,
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
    },
    {
      name: "Yesterday's Auctions",
      selector: row => row.auctions,
      sortable: true,
      right: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px"
    },
    {
      name: "Observed CPM",
      selector: row => row.cpm,
      sortable: true,
      right: true,
      grow: 1,
      minWidth: "120px",
      maxWidth: "160px"
    },
  ];


  const expandedColumns = [

    {
      selector: row => row.subName,
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
      wrap: true,
      style: {
        paddingLeft: "35px",
      },
    },
    {
      selector: row => row.subDomain,
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
      wrap: true,
    },
    {
      selector: row => row.store ?? "-",
      grow: 1,
      minWidth: "150px",
      maxWidth: "180px",
    },
    {
      selector: row => row.subAuctions,
      right: true,
      minWidth: "120px",
      maxWidth: "160px",
    },
    {
      selector: row => row.subCpm,
      right: true,
      minWidth: "120px",
      maxWidth: "160px",
    },
  ];

  const expandedTableStyles = {
    headRow: {
      style: {
        display: "none",
        minHeight: "0",
      },
    },
  };

  const CustomLoader = () => (
    <div className="customloader">
      <div className="loader" role="status"></div>
      <span className="ms-2 fw-bold">Loading...</span>
    </div>
  );

  const ExpandedComponent = ({ data }) => (
    <div className="expanded-datatable">
      <DataTable
        columns={expandedColumns}
        data={data.details || []}
        keyField="subId"
        dense
        striped
        noHeader
        highlightOnHover
        onRowClicked={(row) => {
          setclickedRowexpandable(row.subId);
        }}
      />
    </div>
  );

  const nextStep = () => {
    if (isNextEnabled) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));
  const isStepClickable = (stepIndex) => {
    if (stepIndex === 1) {
      return isNextEnabled;
    }
    return true;
  };
  useEffect(() => {
    console.log("Selected IDs:", selectedIds);
    console.log("Row Data count:", rowData.length);
    console.log("Filtered Data count:", filteredData.length);
  }, [selectedIds, rowData, filteredData]);

  const NameCell = ({ row }) => {
    const isSelected = selectedIds.includes(row.id);
    return (
      <div className={`gOorhn ${isSelected ? 'selected-row-cell' : ''}`}>
        {row.name}
      </div>
    );
  };
  const isNextEnabled = useMemo(() => {
    if (step === 0) {
      if (formData.exchange_scope === "1") {
        return true;
      } else {
        return selectedIds.length > 0;
      }
    }
    return true;
  }, [step, formData.exchange_scope, selectedIds]);

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

      if (response.data && response.data.data && response.data.data.informationPublishInventoryArchives) {
        const transformed = transformApiResponse(response.data.data.informationPublishInventoryArchives);
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
      const auctions = (item.publisherCount || 0).toLocaleString();
      const cpm =
        item.observedCPM !== undefined && item.observedCPM !== null
          ? `$${Number(item.observedCPM).toFixed(2)}`
          : "-";

      let details = (item.publishInventoryExchangeArchives || []).map(
        (exchange, idx) => ({
          subId:
            exchange.publishInventoryExchangeId || `${item.publisherId}-${idx}`,
          subName: exchange.publisherExchange || "Unknown",
          subDomain: "-",
          subAuctions: exchange.exchangeCount
            ? exchange.exchangeCount.toLocaleString()
            : "0",
          subCpm: "-",
          store: "-",
        }),
      );

      // Fallback for single exchange string from new API
      if (details.length === 0 && item.exchange) {
        details = [
          {
            subId: `${item.publisherId || item.publishInventoryArchiveId}-0`,
            subName: item.exchange,
            subDomain: "-",
            subAuctions: auctions,
            subCpm: cpm,
            store: "-",
          },
        ];
      }

      return {
        id: item.publisherId || item.publishInventoryArchiveId,
        subId: item.publisherId || item.publishInventoryArchiveId,
        name: item.publisherName || item.domain || "Unknown",
        domain: item.domain || item.publisherDomain || "-",
        auctions: auctions,
        cpm: cpm,
        listType: item.adzFormat || "-",
        adzType: item.adzType || "-",
        type:
          item.adzType === "site"
            ? "Domain"
            : item.adzType === "app"
              ? "App"
              : item.adzType === "-"
                ? "App"
                : "Domain",
        store: "-",
        details: details,
      };
    });
  };
  useEffect(() => {
    fetchInventory();
  }, [])
  return (
    <>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        size="xl"
        centered
        backdrop="static"
        keyboard={false}
        onClosed={() => {
          setStep(0);
          setSelectedIds([]);
          setSearchTerm("");
          setInventorySearchTerm("");
          setSelectedInventoryIds([]);
          setFilterApp(false);
          setFilterDomain(false);
          setSelectedFormat([]);
          setSelectedDeviceType([]);
          setSelectedExchanges([]);
          setMinPrice("");
          setMaxPrice("");
          setAdSize("");
          setFormData({ exchange_scope: "0", domain_scope: "1" });
        }}
      >
        <div className="modal-header">
          <h5 className="modal-title">Selected Inventory</h5>
          <Button close onClick={toggle} />
        </div>

        <div className="wizard-header">
          <div className="stepper-demainlist">
            {steps.map((label, i) => (
              <React.Fragment key={i}>
                <div
                  className={`step ${i === step ? "current" : ""} ${!isStepClickable(i) ? "disabled-step" : ""
                    }`}
                  onClick={() => {
                    if (isStepClickable(i)) {
                      setStep(i);
                    }
                  }}
                >
                  <span className="step-number">{i + 1}</span>
                  <span className="step-label">{label}</span>
                </div>
                {i < steps.length - 1 && <div className="step-connector" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <ModalBody className="p-0 domaininventorybody">
          {step === 0 && (
            <>
              <Row className="align-items-center exchange_scoping mt-3">
                <Col md="2" sm="6" className="p-0 ms-2">
                  <Label className="exchange_scope">Exchange Scope</Label>
                </Col>
                <Col md="4" sm="12">
                  <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center gap-2">
                      <Input
                        type="radio"
                        name="exchange_scope"
                        value="1"
                        checked={formData.exchange_scope === "1"}
                        onChange={(e) => setFormData({
                          ...formData,
                          exchange_scope: e.target.value,
                        })} />
                      <span className="text-gray-700 devices">All Exchanges</span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Input
                        type="radio"
                        name="exchange_scope"
                        value="0"
                        checked={formData.exchange_scope === "0"}
                        onChange={(e) => setFormData({
                          ...formData,
                          exchange_scope: e.target.value,
                        })} />
                      <span className="text-gray-700 devices">Select Exchanges</span>
                    </div>
                  </div>
                </Col>
              </Row>

              {formData.exchange_scope === "0" && (
                <>
                  <Row className="mb-2 exchange_scoping">
                    <Col md="4" className="p-0 mt-2" id="maximing">
                      <div className="position-relative ms-2">
                        <Input
                          className="form-control py-1 px-1 mb-2 rounded-0 adsheight custom-select-input text-tiny"
                          type="text"
                          id="seaching"
                          placeholder="Search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                    </Col>
                  </Row>

                  <div className="">
                    <DataTable
                      columns={columns}
                      data={filteredData}
                      progressPending={loading}
                      striped
                      dense
                      fixedHeader
                      fixedHeaderScrollHeight="45vh"
                      highlightOnHover
                      persistTableHead
                      conditionalRowStyles={conditionalRowStyles}
                      customStyles={customStyles}
                      noDataComponent={
                        <div className="py-4 fw-bold text-secondary">
                          {loading ? "Loading..." : "No data available"}
                        </div>}
                      onRowClicked={(row) => {
                        handleCheckboxChange(row);
                      }} />
                  </div>
                </>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <Row className="align-items-center exchange_scoping mt-3">
                <Col md="2" sm="6" className="p-0 ms-2">
                  <Label className="exchange_scope">Domain Scope</Label>
                </Col>
                <Col md="4" sm="12">
                  <div className="d-flex align-items-center gap-4">
                    <div className="d-flex align-items-center gap-2">
                      <Input
                        type="radio"
                        name="domain_scope"
                        value="1"
                        checked={formData.domain_scope === "1"}
                        onChange={(e) => setFormData({ ...formData, domain_scope: e.target.value })}
                      />
                      <span className="text-gray-700 devices">All domains & apps</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Input
                        type="radio"
                        name="domain_scope"
                        value="0"
                        checked={formData.domain_scope === "0"}
                        onChange={(e) => setFormData({ ...formData, domain_scope: e.target.value })}
                      />
                      <span className="text-gray-700 devices">Select domains & apps</span>
                    </div>
                  </div>
                </Col>
              </Row>
              {/* <Row className="align-items-center exchange_scoping">
                <Col md="10" sm="12">
                  <div role="alert" className="waringsicon">
                    <i className="fa fa-warning me-2" id="warningicon"></i>
                    Run on all exchanges and domains targets a wide collection of inventory. Use additional targeting options to avoid spending the campaign's budget too fast.
                  </div>
                </Col>
              </Row> */}
              {formData.domain_scope === "0" && (
                <div className="mt-4 px-3">
                  <div className="d-flex">
                    <div className={`transition-col ${collapsed ? 'collapsed' : 'expanded'}`}>
                      <Card
                        className="border-1 rounded-0 h-100"
                        id="inventorycard"
                      >
                        <div className="p-3">
                          <div
                            className="scrollable-content"
                            style={{
                              height: "60vh",
                              overflowY: "auto",
                              overflowX: "hidden",
                              paddingRight: "5px",
                            }}
                          >
                            <div className="mb-1 inventory-sidebar-heading inventoryfilter">
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
                                onChange={handleFilterCheckboxChange}
                                className="ms-1"
                              />
                              <label className="appdomaintype">App</label>

                              <input
                                className="ms-4"
                                type="checkbox"
                                name="anotherCheck"
                                checked={formData.anotherCheck}
                                onChange={handleFilterCheckboxChange}
                              />
                              <label className="appdomaintype">Site</label>
                            </div>
                            <div
                              className="custom-select-wrapper mt-2"
                              ref={domainTypeRef}
                            >
                              <div className="d-flex flex-row justify-content-between align-items-center">
                                <label className="form-label inventory-label">
                                  Ad Type
                                </label>
                                {selectedDomainType.length > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-link mt-2 p-0"
                                    onClick={() => setSelectedDomainType([])}
                                    style={{
                                      fontSize: "0.69rem",
                                      color: "#4c9eec",
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div
                                className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input"
                                onClick={() => {
                                  setOpenDomainType(!openDomainType);
                                  setOpenAdSize(false);
                                  setOpenDeviceType(false);
                                }}
                                tabIndex={0}
                                style={{ fontSize: "0.7rem", cursor: "pointer" }}
                              >
                                {selectedDomainType.length > 0 ? (
                                  <span className="inventory-inputvlaue fw-bold">
                                    {selectedDomainType.join(", ")}
                                  </span>
                                ) : (
                                  "Select Domain Type"
                                )}
                                <FaCaretDown
                                  className={`custom-select-icon ${openDomainType ? "open" : ""}`}
                                />
                              </div>
                              {openDomainType && (
                                <div className="custom-dropdown-menu">
                                  {domainTypeOptions.map((opt) => (
                                    <div
                                      key={opt}
                                      className={`custom-dropdown-option ${selectedDomainType.includes(opt) ? "selected" : ""}`}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                      }}
                                      onClick={() =>
                                        handleDomainTypeSelect(opt)
                                      }
                                    >
                                      {selectedDomainType.includes(opt) && (
                                        <span
                                          style={{
                                            color: "#fff",
                                            backgroundColor: "#4c9eec",
                                            borderRadius: "50%",
                                            padding: "0 6px",
                                            fontWeight: "bold",
                                            marginRight: "6px",
                                          }}
                                        >
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
                                    className="badge me-1 mt-1"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      color: "rgb(102, 102, 102)",
                                      border: "1px solid #dadada",
                                      borderRadius: "50px",
                                      fontSize: "11px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      padding: "0.35rem 0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {type}
                                    <span
                                      style={{ cursor: "pointer", color: "#999999" }}
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
                                    className="btn btn-link mt-2 p-0"
                                    onClick={() => setSelectedAdSizes([])}
                                    style={{
                                      fontSize: "0.69rem",
                                      color: "#4c9eec",
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div
                                className="custom-dropdown form-control py-1 px-1 rounded-0 formatsize custom-select-input"
                                onClick={() => {
                                  setOpenAdSize(!openAdSize);
                                  setOpenDomainType(false);
                                  setOpenDeviceType(false);
                                }}
                                tabIndex={0}
                                style={{ fontSize: "0.7rem", cursor: "pointer" }}
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
                                <div className="custom-dropdown-menu">
                                  {adSizeOptions.map((size) => (
                                    <div
                                      key={size}
                                      className={`custom-dropdown-option ${selectedAdSizes.includes(size) ? "selected" : ""}`}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "5px 10px",
                                        cursor: "pointer",
                                      }}
                                      onClick={() => handleAdSizeSelect(size)}
                                    >
                                      {selectedAdSizes.includes(size) && (
                                        <span
                                          style={{
                                            color: "#fff",
                                            backgroundColor: "#4c9eec",
                                            borderRadius: "50%",
                                            padding: "0 6px",
                                            fontWeight: "bold",
                                            marginRight: "6px",
                                          }}
                                        >
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
                                    className="badge me-1 mt-1"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      color: "rgb(102, 102, 102)",
                                      border: "1px solid #dadada",
                                      borderRadius: "50px",
                                      fontSize: "11px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      padding: "0.35rem 0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {size}
                                    <span
                                      style={{ cursor: "pointer", color: "#999999" }}
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
                                    className="btn btn-link mt-2 p-0"
                                    onClick={() => setSelectedDeviceType([])}
                                    style={{
                                      fontSize: "0.69rem",
                                      color: "#4c9eec",
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="position-relative">
                                <div
                                  className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input"
                                  onClick={() => {
                                    setOpenDeviceType(!openDeviceType);
                                    setOpenDomainType(false);
                                    setOpenAdSize(false);
                                  }}
                                  tabIndex={0}
                                  style={{
                                    fontSize: "0.7rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  {selectedDeviceType.length > 0 ? (
                                    <span className="fw-bold inventory-inputvlaue">
                                      {selectedDeviceType.join(", ")}
                                    </span>
                                  ) : (
                                    "Select Device Type"
                                  )}
                                  <FaCaretDown
                                    className={`custom-select-icon ms-2 ${openDeviceType ? "open" : ""}`}
                                    style={{
                                      position: "absolute",
                                      right: "10px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                    }}
                                  />
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
                                    className="badge me-1 mt-1"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      color: "rgb(102, 102, 102)",
                                      border: "1px solid #dadada",
                                      borderRadius: "50px",
                                      fontSize: "11px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      padding: "0.35rem 0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {devicetype}
                                    <span
                                      style={{
                                        cursor: "pointer",
                                        color: "#999999",
                                        fontWeight: "600",
                                        fontSize: "11px",
                                      }}
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
                                    className="btn btn-link mt-2 p-0"
                                    onClick={() => setSelectedExchanges([])}
                                    style={{
                                      fontSize: "0.69rem",
                                      color: "#4c9eec",
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="position-relative">
                                <div
                                  className="form-control py-1 px-2 rounded-0 formatsize custom-dropdown-input"
                                  onClick={() =>
                                    setopenExchanges(!openExchanges)
                                  }
                                  style={{
                                    fontSize: "0.7rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  {selectedExchanges.length > 0 ? (
                                    <span className="fw-bold">
                                      {selectedExchanges.join(", ")}
                                    </span>
                                  ) : (
                                    "Select Exchanges"
                                  )}
                                  <FaCaretDown className="custom-select-icon" />
                                </div>
                              </div>
                              {openExchanges && (
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
                                  {exchangesOptions.map((exchange, idx) => {
                                    const isSelected = selectedExchanges.includes(exchange);
                                    return (
                                      <div
                                        key={idx}
                                        onClick={() =>
                                          handleExchangesTypeSelect(exchange)
                                        }
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
                                              marginRight: "6px",
                                            }}
                                          >
                                            ✔
                                          </span>
                                        )}
                                        <span>{exchange}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <div className="mt-2">
                                {selectedExchanges.map((exchange, idx) => (
                                  <span
                                    key={idx}
                                    className="badge me-1 mt-1"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      color: "rgb(102, 102, 102)",
                                      border: "1px solid #dadada",
                                      borderRadius: "50px",
                                      fontSize: "11px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      padding: "0.35rem 0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {exchange}
                                    <span
                                      style={{
                                        cursor: "pointer",
                                        color: "#999999",
                                      }}
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
                                    className="btn btn-link mt-2 p-0"
                                    onClick={() => setSelectedCategories([])}
                                    style={{
                                      fontSize: "0.69rem",
                                      color: "#4c9eec",
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div
                                className="form-control py-1 px-2 rounded-0 formatsize"
                                style={{
                                  fontSize: "0.7rem",
                                  cursor: "pointer",
                                  textAlign: "center",
                                }}
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
                                      className="badge me-1 mt-1"
                                      style={{
                                        backgroundColor: "#ffffff",
                                        color: "#52a3e4",
                                        border: "1px solid #dadada",
                                        borderRadius: "50px",
                                        fontSize: "11px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                        padding: "0.35rem 0.75rem",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {cat.parent}{" "}
                                      {cat.childrenCount > 0 &&
                                        `(${cat.childrenCount})`}
                                      <span
                                        style={{
                                          cursor: "pointer",
                                          color: "#999999",
                                        }}
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
                                    className="btn btn-link mt-2 p-0"
                                    onClick={() => setSelectedCountryItems([])}
                                    style={{
                                      fontSize: "0.69rem",
                                      color: "#4c9eec",
                                    }}
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div
                                className="form-control py-1 px-1 rounded-0 formatsize"
                                style={{
                                  fontSize: "0.7rem",
                                  cursor: "pointer",
                                  textAlign: "center",
                                }}
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
                                    className="badge me-1 mt-1"
                                    style={{
                                      backgroundColor: "#ffffff",
                                      color: "#52a3e4",
                                      border: "1px solid #dadada",
                                      borderRadius: "50px",
                                      fontSize: "11px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.25rem",
                                      padding: "0.35rem 0.75rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {c.parent}
                                    {c.childrenCount > 0 && ` (${c.childrenCount})`}
                                    <span
                                      style={{
                                        cursor: "pointer",
                                        color: "#999999",
                                      }}
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

                        </div>
                      </Card>
                    </div>
                    <div className="flex-grow-1" style={{ width: collapsed ? "100%" : "calc(100% - 265px)" }}>
                      <Row className="nobita align-items-center g-2 ms-0 me-0">
                        <Col xs="auto" className="p-0">
                          <button
                            className="btn btn-md border border-1 rounded-0 px-2 py-1 d-flex align-items-center bg-white h-26"
                            onClick={() => setCollapsed(!collapsed)}
                          >
                            {collapsed ? <i className="fa fa-caret-right" /> : <i className="fa fa-caret-left" />}
                            <span className="ms-2 inventoryfilter text-11px"> Filters</span>
                          </button>
                        </Col>
                        <Col md="5">
                          <Input
                            type="search"
                            placeholder="Search by domain or app name..."
                            className="border border-1 rounded-0 py-1 h-26 w-300 text-11px"
                            value={inventorySearchTerm}
                            onChange={(e) => setInventorySearchTerm(e.target.value)}
                          />
                        </Col>
                        <Col xs="auto">
                          <button
                            type="button"
                            onClick={refreshInventory}
                            className="form-control py-1 px-2 rounded-0 d-flex align-items-center justify-content-center inventoryrefresh h-26 text-11px"
                          >
                            <i className={`fa fa-repeat me-1 ms-2 ${loading ? "fa-spin" : ""}`}></i>
                            Refresh
                          </button>
                        </Col>
                        <Col xs="auto" className="ms-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInventoryIds([]);
                              setInventoryRow([]);
                            }}
                            className="clear-selection-btn rounded-0 h-26"
                          >
                            Clear Selection
                          </button>
                        </Col>
                        <Col className="text-end p-0">
                          <div className="d-flex justify-content-end align-items-center gap-2">
                            <span className="avg-cpm-text me-2">Average CPM of Selected -</span>

                          </div>
                        </Col>
                      </Row>
                      <DataTable
                        columns={inventoryColumns}
                        data={filteredInventoryData}
                        progressPending={loading}
                        progressComponent={<CustomLoader />}
                        striped dense fixedHeader fixedHeaderScrollHeight="48vh" highlightOnHover persistTableHead
                        expandableRows expandableRowsComponent={ExpandedComponent}
                        expandableIcon={{ collapsed: <i className="fa fa-caret-right" />, expanded: <i className="fa fa-caret-down" /> }}
                        conditionalRowStyles={[{ when: (row) => selectedInventoryIds.includes(row.id), style: { backgroundColor: "#faebed !important", color: "black !important", "& .gOorhn": { color: "white !important" } } }]}
                        customStyles={customStyles}
                        noDataComponent={<div className="py-4 fw-bold text-secondary text-tiny">No inventory matches the filters.</div>}
                        onRowClicked={(row) => handleInventoryCheckboxChange(row)}
                        pagination
                        paginationPerPage={20}
                        paginationComponent={CustomPagination}
                        paginationDefaultPage={currentPage}
                      />
                    </div>
                  </div>
                </div>
              )}

              <InventoryConversionModal modalOpen={conversionModalOpen} toggleModal={toggleconversiontModal} />
              <CurrentDomainModal modalOpen={currentdomainModalOpen} toggleModal={togglecurrentdomainModal} />
              {modal && <DecisionModal title="Delete Item" message="Are you sure?" name="DELETE" callback={() => setModal(false)} />}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <div className="d-flex w-100 justify-content-end align-items-center gap-2">
            {step === 1 && formData.domain_scope === "0" && (
              <>
                <div className="d-flex align-items-center gap-3 me-auto footer-info-text">
                  <Button className="apply-filters-btn apply-filters-btn-small px-3" onClick={handleApplyFilters}>Apply filters</Button>
                  <div className="page-indicator border-left-default pl-12">
                    <i
                      className={`fa fa-caret-left page-arrow ${currentPage === 1 ? 'disabled-arrow' : ''}`}
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      style={{ cursor: currentPage === 1 ? 'default' : 'pointer' }}
                    ></i>
                    <span>Page</span>
                    <Input type="text" value={currentPage} readOnly className="page-input" />
                    <span>of {totalPages || 1}</span>
                    <i
                      className={`fa fa-caret-right page-arrow ${currentPage === totalPages || totalPages === 0 ? 'disabled-arrow' : ''}`}
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      style={{ cursor: (currentPage === totalPages || totalPages === 0) ? 'default' : 'pointer' }}
                    ></i>
                  </div>
                  <div className="border-left-default pl-12">
                    {filteredInventoryData.length} results ({selectedInventoryIds.length} selected)
                  </div>
                </div>
              </>
            )}

            <Button className="cancels inventorycancels" onClick={toggle}>
              Cancel
            </Button>
            {step > 0 && (
              <Button onClick={prevStep} className="cancels">
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                className={`savebuttons ${!isNextEnabled ? "disabled-button" : ""}`}
                onClick={nextStep}
                disabled={!isNextEnabled}
              >
                Next
              </Button>
            ) : (
              <Button className="savebuttons inventorycancels" color="primary" onClick={() => {
                let currentPayload = [];
                const finalExchanges = formData.exchange_scope === "1"
                  ? ["All Exchanges"]
                  : [...new Set([...exchanges, ...selectedExchanges])];

                if (formData.domain_scope === "1") {
                  currentPayload = inventoryData.map((row, index) => ({
                    id: `${row.subId}_${index}_${Date.now()}`,
                    domainappname: row.domain || row.name,
                    domainappid: row.subId,
                    appstorename: row.store || "-",
                    cpmbidrange: row.cpm,
                    exchanges: finalExchanges,
                  }));
                } else {
                  currentPayload = inventoryRow.map((row, index) => ({
                    ...row,
                    id: row.id || `${row.domainappid}_${index}_${Date.now()}`,
                    exchanges: finalExchanges
                  }));
                }
                handlelocation(currentPayload);
                toggle();
              }}>
                Done
              </Button>
            )}
          </div>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default InventoryModal;