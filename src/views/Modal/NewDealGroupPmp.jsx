import React, { useState } from "react";
import Select from "react-select";
import DataTable from "react-data-table-component";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Tooltip,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button
} from "reactstrap";
import { FaCog, FaCaretDown } from "react-icons/fa";
import Swal from "sweetalert2";
import CategoriesModal from "./categoriesModal";
import SelectDomain from "./SelectDomain";
import DatePickerInput from "./DatePickerInput";
import DealGroupSidebar from "../DealGroupSidebar";
import { getAllExchangeCached, getAllDealsCached, createDeal } from "../api/Api";
const NewDealGroupPmp = ({ isOpen, toggle, onBack, onApplySelectedDeals }) => {

    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState("curated_deals");
    const [modal, setModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [tooltipOpen, setTooltipOpen] = useState({
        dealName: false,
        publisher: false,
        commitmentType: false,
        dealId: false,
        exchangeValue: false,
    });
    const [loadingMap, setLoadingMap] = useState({
        curated_deals: false,
        curated_deal_groups: true,
        my_deals: true,
        my_deal_groups: true,
    });

    const [exchangeOptions, setExchangeOptions] = useState([]);
    const [allDeals, setAllDeals] = useState([]);
    const [exchangeMap, setExchangeMap] = useState({});

    const fetchExchanges = async () => {
        try {
            const response = await getAllExchangeCached();
            if (response.data && response.data.data && response.data.data.informationExchanges) {
                const mappedExchanges = response.data.data.informationExchanges.map(ex => ({
                    value: ex.exchangeId,
                    label: ex.name
                }));
                setExchangeOptions(mappedExchanges.sort((a, b) => a.label.localeCompare(b.label)));

                // Create exchange map for lookup
                const map = {};
                response.data.data.informationExchanges.forEach(ex => {
                    map[ex.exchangeId] = ex.name;
                    map[String(ex.exchangeId)] = ex.name;
                });
                setExchangeMap(map);
            }
        } catch (error) {
            console.error("Error fetching exchanges:", error);
        }
    };

    const fetchAllDealsData = async () => {
        try {
            // First fetch exchanges to build mapping
            const exchangeResponse = await getAllExchangeCached();
            let map = {};
            if (exchangeResponse.data && exchangeResponse.data.data && exchangeResponse.data.data.informationExchanges) {
                exchangeResponse.data.data.informationExchanges.forEach(ex => {
                    map[ex.exchangeId] = ex.name;
                    map[String(ex.exchangeId)] = ex.name;
                });
                setExchangeMap(map);
            }

            // Then fetch deals and map with exchange names
            const response = await getAllDealsCached();
            if (response.data && response.data.data && response.data.data.informationDeal) {
                const mappedDeals = response.data.data.informationDeal.map(deal => {
                    let exchangeName = "-";
                    if (deal.exchange) {
                        exchangeName = map[deal.exchange] || map[String(deal.exchange)] || deal.exchange || "-";
                    }

                    return {
                        id: deal.dealId,
                        name: deal.dealName,
                        lastUpdated: deal.startDate || "N/A",
                        publisher: deal.publisher || "-",
                        exchange: exchangeName,
                        commitmentType: deal.commitmentType || "-",
                        price: deal.price ? `$${deal.price.toFixed(2)} ${deal.priceType || "CPM"}` : "N/A",
                        priceType: deal.priceType || "-",
                        impressions: deal.impressions || "0",
                        inventoryTypes: deal.inventoryTypes?.join(", ") || "-",
                        formats: deal.formats?.join(", ") || "-",
                        deviceTypes: deal.deviceTypes?.join(", ") || "-",
                        auctions: "0",
                        description: deal.description,
                        advertiserDomains: deal.advertiserDomains,
                        mediaCost: deal.mediaCost,
                        countries: deal.countries,
                        additionalNotes: deal.additionalNotes,
                        categories: deal.categories
                    };
                });
                setAllDeals(mappedDeals);
            }
        } catch (error) {
            console.error("Error fetching deals:", error);
        }
    };

    useEffect(() => {
        fetchExchanges();
        fetchAllDealsData();
        setTimeout(() => {
            setLoadingMap(prev => ({
                ...prev,
                curated_deals: false,
                curated_deal_groups: false,
                my_deals: false,
                my_deal_groups: false,
            }));
        }, 1000);
    }, []);
    const Loader = () => <span className="pmp-loader" />;
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectDomainOpen, setSelectDomainOpen] = useState(false);
    const toggleModal = () => setModalOpen(!modalOpen);
    const toggleSelectDomainModal = () => setSelectDomainOpen(!selectDomainOpen);
    const handleRemoveCategory = (parentName) => {
        setSelectedCategories((prev) =>
            prev.filter((item) => item.parent !== parentName)
        );
    };

    const showModal = (e, id) => {
        if (e.ctrlKey) {
            return;
        }
        setDeleteId(id);
        setModal(true);
    };

    const [formErrors, setFormErrors] = useState({});
    const [dealFormData, setDealFormData] = useState({
        dealName: "",
        publisher: "",
        advertiserDomains: "",
        description: "",
        price: "",
        mediaCost: "",
        impressions: "",
        countries: [],
        deviceTypes: [],
        inventoryTypes: [],
        formats: [],
        additionalNotes: "",
    });

    const validateStep1 = () => {
        const errors = {};

        if (!exchangeValue) {
            errors.exchangeValue = "Exchange is required";
        }
        if (!commitmentType) {
            errors.commitmentType = "Commitment Type is required";
        }
        if (!dealIdValue?.trim()) {
            errors.dealId = "Deal ID is required";
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            showValidationError();
            return false;
        }
        return true;
    };

    const parseCurrency = (value) => {
        if (typeof value !== 'string') return value;
        return value.replace(/[^\d.]/g, "");
    };

    const formatCurrency = (value) => {
        if (!value) return "";
        const valStr = typeof value === 'string' ? value : String(value);
        const number = parseFloat(valStr.replace(/[^\d.]/g, ""));
        if (isNaN(number)) return "";
        return `$${number.toFixed(2)} USD`;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setDealFormData((prev) => ({
            ...prev,
            [name]: formatCurrency(value),
        }));
    };

    const handleFocus = (e) => {
        const { name, value } = e.target;
        setDealFormData((prev) => ({
            ...prev,
            [name]: parseCurrency(value),
        }));
    };

    const handleDealChange = (e) => {
        const { name, value } = e.target;
        setDealFormData(prev => ({
            ...prev,
            [name]: name === "price" || name === "mediaCost" ? parseCurrency(value) : value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const validateStep2 = () => {
        const errors = {};

        if (!dealFormData.dealName?.trim()) {
            errors.dealName = "Deal Name is required";
        }
        if (!dealFormData.publisher?.trim()) {
            errors.publisher = "Publisher is required";
        }
        if (!dealFormData.advertiserDomains?.trim()) {
            errors.advertiserDomains = "Advertiser domains are required";
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            showValidationError();
            return false;
        }
        return true;
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
          Please ensure all fields are valid.
        </div>
      `,
            showConfirmButton: true,
            confirmButtonText: "OK",
            confirmButtonColor: "#62903e",
            width: 268,
            padding: 0,
        });
    };

    const handleCreateDeal = async () => {
        if (!validateStep2()) {
            await showValidationError();
            return;
        }

        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to save this Deal?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, save it!",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#62903e",
        });

        if (!result.isConfirmed) return;

        setLoading(true);

        try {
            // Create complete payload from all fields
            const payload = {
                dealId: dealIdValue,
                exchange: exchangeValue?.value,
                commitmentType: commitmentType?.value,
                dealName: dealFormData.dealName,
                description: dealFormData.description,
                price: parseCurrency(dealFormData.price),
                priceType: priceType,
                mediaCost: parseCurrency(dealFormData.mediaCost),
                impressions: dealFormData.impressions,
                startDate: startDate ? new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000)).toISOString() : null,
                endDate: endDate ? new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString() : null,
                publisher: dealFormData.publisher,
                countries: dealFormData.countries.map(c => c.value),
                deviceTypes: dealFormData.deviceTypes,
                inventoryTypes: dealFormData.inventoryTypes,
                formats: dealFormData.formats,
                categories: selectedCategories.map(cat => ({
                    name: cat.parent,
                    descendantsCount: cat.childrenCount
                })),
                advertiserDomains: dealFormData.advertiserDomains,
                additionalNotes: dealFormData.additionalNotes
            };

            console.log("Creating Deal in Group Modal with payload:", payload);


            const response = await createDeal(payload);

            if (response.status === 201 || response.data.status === 201) {
                await Swal.fire({
                    title: "Success!",
                    text: "Deal has been created successfully.",
                    icon: "success",
                    confirmButtonColor: "#62903e"
                });

                setShowNewDeal(false);
                setIsStepTwo(false);
                setFormErrors({});
                // Refresh deals list
                fetchAllDealsData();
            }
        } catch (error) {
            console.error("Error creating deal:", error);
            Swal.fire(
                "Error!",
                "Something went wrong. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleNextStep = () => {
        if (!validateStep1()) {
            return;
        }
        // Clear errors when moving to next step
        setFormErrors({});
        setIsStepTwo(true);
    };


    const [showCustomize, setShowCustomize] = useState(false);
    const [activeTab, setActiveTab] = useState("insights");
    const [checked, setChecked] = useState(true);
    const [columns, setColumns] = useState({
        auctions: true,
        dealId: false,
        lastUpdated: true,
        publisher: true,
        exchange: true,
        commitmentType: false,
        price: true,
        priceType: false,
        impressions: false,
        inventoryTypes: true,
        formats: true,
        deviceTypes: true,
    });
    const [showNewDeal, setShowNewDeal] = useState(false);
    const [isStepTwo, setIsStepTwo] = useState(false);


    const mockCuratedDeals = allDeals;


    const mockDealGroups = [
        { id: 1, name: "CTV_All", status: "Available", lastUpdated: "02/02/2026" },
        { id: 2, name: "Olympics 2026", status: "Available", lastUpdated: "02/01/2026" },
        { id: 3, name: "Basis Community & Culture - General Interest", status: "Available", lastUpdated: "01/29/2026" },
        { id: 4, name: "Basis Community & Culture - Gaming", status: "Available", lastUpdated: "01/29/2026" },
        { id: 5, name: "Basis Community & Culture Package - Youth Media", status: "Available", lastUpdated: "01/29/2026" },
        { id: 6, name: "Basis Community & Culture Package - Faith Based", status: "Available", lastUpdated: "01/29/2026" },
        { id: 7, name: "Basis Community & Cuture Package - Womens Interest", status: "Available", lastUpdated: "01/29/2026" },
        { id: 8, name: "Basis Community & Culture Package - Sports", status: "Available", lastUpdated: "01/29/2026" },
        { id: 9, name: "Basis Community & Culture Package - Social Platforms", status: "Available", lastUpdated: "01/29/2026" },
        { id: 10, name: "Basis Community & Culture Package - CTV/Video", status: "Available", lastUpdated: "01/29/2026" },
        { id: 11, name: "Political_OLV", status: "Available", lastUpdated: "01/28/2026" },
        { id: 12, name: "Political_CTV", status: "Available", lastUpdated: "01/28/2026" },
        { id: 13, name: "CTV_Sports_All", status: "Available", lastUpdated: "01/22/2026" },
        { id: 14, name: "Events_ Live Sports", status: "Available", lastUpdated: "01/22/2026" },
        { id: 15, name: "Language Segment_Spanish Language", status: "Available", lastUpdated: "01/06/2026" },
        { id: 16, name: "Streaming_VOD_Premium", status: "Available", lastUpdated: "12/31/2025" },
        { id: 17, name: "Audience Based_Hispanic_US Region", status: "Available", lastUpdated: "11/07/2025" },
        { id: 18, name: "Performance_High CTR", status: "Available", lastUpdated: "10/22/2025" },
        { id: 19, name: "Basis QnS - In Game - App", status: "Available", lastUpdated: "10/17/2025" },
        { id: 20, name: "Display_High Impact", status: "Available", lastUpdated: "09/16/2025" }
    ];


    const currentData = activeView === "curated_deal_groups" ? mockDealGroups : mockCuratedDeals;


    // const exchangeOptions = [{ value: "rubicon", label: "Rubicon" }, { value: "openx", label: "OpenX" }];
    const commitmentOptions = [
        { value: 'guaranteed', label: 'Guaranteed' },
        { value: 'non_guaranteed', label: 'Non-Guaranteed' },
    ];

    const [commitmentType, setCommitmentType] = useState(null);
    const [exchangeValue, setExchangeValue] = useState(null);
    const [dealIdValue, setDealIdValue] = useState('');
    const [priceType, setPriceType] = useState('private_auction');

    const deviceOptions = [{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }];
    const categoryOptions = [{ value: "news", label: "News" }, { value: "sports", label: "Sports" }];
    const countryOptions = [{ value: "us", label: "United States" }, { value: "ca", label: "Canada" }];
    const adSizeOptions = [{ value: "300x250", label: "300x250" }, { value: "728x90", label: "728x90" }];


    const filterSelectStyles = {
        control: (base) => ({
            ...base,
            minHeight: "30px",
            height: "30px",
            fontSize: "12px",
            borderColor: "#ccc",
            boxShadow: "none",
            borderRadius: "4px"
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
            height: "30px",
            display: "flex",
            alignItems: "center"
        }),
        input: (base) => ({
            ...base,
            margin: 0,
            padding: 0
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: "30px"
        }),
        placeholder: (base) => ({
            ...base,
            fontSize: "12px",
            color: "#999"
        }),
        menu: (base) => ({
            ...base,
            fontSize: "12px"
        })
    };

    const getExchangeSelectStyles = (isError) => ({
        control: (base, state) => ({
            ...base,
            minHeight: "34px",
            height: "34px",
            fontSize: "13px",
            borderColor: isError ? "#ff4d4f" : (state.isFocused ? "#4078ad" : "#ccc"),
            boxShadow: "none",
            borderRadius: "4px",
            padding: "0 4px",
            backgroundColor: "#fff",
            "&:hover": {
                borderColor: isError ? "#ff4d4f" : "#4078ad",
            },
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
            boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.15)",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginBottom: "0px",
            marginTop: "0px",
        }),
        menuList: (base) => ({
            ...base,
            padding: 0,
        }),
        option: (base, state) => ({
            ...base,
            padding: "8px 12px",
            fontSize: "13px",
            backgroundColor: state.isFocused || state.isSelected ? "#35a7e9" : "#fff",
            color: state.isFocused || state.isSelected ? "#fff" : "#333",
            cursor: "pointer",
            "&:active": {
                backgroundColor: "#35a7e9",
            },
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: 4,
            opacity: 0.5,
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
            height: "32px",
            display: "flex",
            alignItems: "center"
        }),
        placeholder: (base) => ({
            ...base,
            fontSize: "13px",
            color: "#bfbfbf"
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: "32px"
        }),
        singleValue: (base) => ({
            ...base,
            fontSize: "13px",
            color: "#333"
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    });

    const getNewDealSelectStyles = (isError) => ({
        control: (base, state) => ({
            ...base,
            minHeight: "32px",
            height: "32px",
            fontSize: "12px",
            borderColor: isError ? "#ff4d4f" : (state.isFocused ? "#40a9ff" : "#d9d9d9"),
            boxShadow: state.isFocused ? "0 0 0 1px rgba(24, 144, 255, 0.2)" : "none",
            borderRadius: "4px",
            padding: "0 4px",
            backgroundColor: "#fff",
            "&:hover": {
                borderColor: isError ? "#ff4d4f" : "#40a9ff",
            },
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            border: "1px solid #d9d9d9",
            borderRadius: "4px",
        }),
        menuList: (base) => ({
            ...base,
            padding: 0,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#f0f0f0" : "#fff",
            color: "#333",
            padding: "8px 12px",
            fontSize: "12px",
            cursor: "pointer",
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: 4,
            opacity: 0.5,
        }),
        indicatorSeparator: () => ({
            display: "none",
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
            height: "30px",
            display: "flex",
            alignItems: "center"
        }),
        placeholder: (base) => ({
            ...base,
            fontSize: "12px",
            color: "#bfbfbf"
        }),
        indicatorsContainer: (base) => ({
            ...base,
            height: "30px"
        }),
        singleValue: (base) => ({
            ...base,
            fontSize: "12px",
            color: "#333"
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 })
    });


    const columnsDeals = [
        {
            name: "Name",
            id: "name",
            selector: row => row.name,
            sortable: true,
            cell: row => <div className="pmp-name-cell">{row.name}</div>,
            grow: 2,
        },
        {
            name: "Deal ID",
            id: "dealId",
            selector: row => row.id,
            sortable: true,
            omit: !columns.dealId
        },
        {
            name: "Last Updated",
            id: "lastUpdated",
            selector: row => row.lastUpdated,
            sortable: true,
            width: "100px",
            omit: !columns.lastUpdated
        },
        { name: "Publisher", id: "publisher", selector: row => row.publisher, sortable: true, grow: 1.5, omit: !columns.publisher },
        { name: "Exchange", id: "exchange", selector: row => row.exchange, sortable: true, omit: !columns.exchange },
        { name: "Commitment Type", id: "commitmentType", selector: row => row.commitmentType || "-", sortable: true, omit: !columns.commitmentType },
        { name: "Inventory Types", id: "inventoryTypes", selector: row => row.inventoryTypes, sortable: true, grow: 1.5, omit: !columns.inventoryTypes },
        { name: "Formats", id: "formats", selector: row => row.formats, sortable: true, omit: !columns.formats },
        { name: "Device Types", id: "deviceTypes", selector: row => row.deviceTypes, sortable: true, grow: 1.5, omit: !columns.deviceTypes },
        { name: "Price (CPM)", id: "price", selector: row => row.price, sortable: true, omit: !columns.price },
        { name: "Price Type", id: "priceType", selector: row => row.priceType || "-", sortable: true, omit: !columns.priceType },
        { name: "Impressions", id: "impressions", selector: row => row.impressions || "0", sortable: true, omit: !columns.impressions },
        { name: "Y'day's Auctions", id: "auctions", selector: row => row.auctions, sortable: true, omit: !columns.auctions },
    ];

    const columnsGroups = [
        {
            name: "Name",
            id: "name",
            selector: row => row.name,
            sortable: true,
            cell: row => <div className="pmp-name-cell">{row.name}</div>,
            grow: 3,
        },
        { name: "Status", selector: row => row.status, sortable: true },
        {
            name: "Last Updated",
            id: "lastUpdated",
            selector: row => row.lastUpdated,
            sortable: true,
        },
    ];

    const baseColumns = [
        {
            name: "Actions",
            id: "actions",
            cell: (row) => <AudienceActionsCell row={row} />,
            grow: 1,
            width: "100px",
        },
    ];

    const currentColumns = [
        ...baseColumns,
        ...(activeView === "curated_deal_groups" ? columnsGroups : columnsDeals),
    ];




    const CustomLoader = () => (
        <div className="pmp-table-loader-container">
            <i className="fa fa-spinner fa-spin pmp-table-loader-icon"></i>
            <div className="pmp-table-loader-text">Loading...</div>
        </div>
    );

    const NoDataComponent = () => (
        <div className="pmp-no-data-msg">
            No Data Found.
        </div>
    );

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: '#fff',
                color: '#888',
                fontWeight: '600',
                borderBottom: '1px solid #e0e0e0',
                fontSize: '12px',
                paddingLeft: '16px',
                paddingRight: '16px',
                borderRight: '1px solid #e0e0e0',
            },
        },
        cells: {
            style: {
                fontSize: '12px',
                paddingLeft: '16px',
                paddingRight: '16px',
            },
        },
        rows: {
            style: {
                minHeight: '48px',
            },
        },
    };

    const conditionalRowStyles = [
        {
            when: row => row.selected,
            style: {
                backgroundColor: '#e6f7ff',
            },
        },
    ];

    const FilterCheckbox = ({ label, checked, onChange }) => {
        const [internalChecked, setInternalChecked] = useState(false);
        const isControlled = checked !== undefined;
        const checkboxValue = isControlled ? checked : internalChecked;

        const handleClick = () => {
            if (isControlled && onChange) {
                onChange();
            } else {
                setInternalChecked(!internalChecked);
            }
        };

        return (
            <div className="pmp-checkbox-row" onClick={handleClick}>
                <div className="pmp-checkbox-box" style={{
                    border: checkboxValue ? "1px solid #62903e" : "1px solid #ccc",
                    backgroundColor: checkboxValue ? "#62903e" : "white",
                }}>
                    {checkboxValue && <i className="fa fa-check pmp-checkbox-icon"></i>}
                </div>
                {label}
            </div>
        );
    };


    const [selectedRows, setSelectedRows] = useState([]);

    const AudienceActionsCell = ({ row }) => {
        const isSelected = selectedRows.includes(row.id);

        const handleCheckboxChange = () => {
            setSelectedRows(prev =>
                prev.includes(row.id)
                    ? prev.filter(id => id !== row.id)
                    : [...prev, row.id]
            );
        };

        return (
            <FilterCheckbox
                label=""
                checked={isSelected}
                onChange={handleCheckboxChange}
            />
        );
    };

    const handlesidebartoggle = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    const handleactiveview = (view) => {
        setActiveView(view)
    }


    return (
        <Modal
            isOpen={isOpen}
            toggle={toggle}
            size="xl"
            centered
            backdrop="static"
            keyboard={false}
            scrollable={true}
            className="pmp-new-deal-modal-standard"
        >
            <ModalHeader toggle={toggle} className="border-bottom">
                <h2 className="pmp-new-deal-title mb-0">Add Deals and Deal Groups</h2>
            </ModalHeader>

            <ModalBody className="p-0">
                <div style={{ display: 'flex', height: '80vh' }}>
                    <div className="pmp-container p-0" style={{ display: 'flex', width: '100%', flex: 1 }}>

                        {/* Sidebar */}
                        <DealGroupSidebar sidebarCollapseddata={sidebarCollapsed} handleactiveview={handleactiveview} />

                        {/* Main Content */}
                        <div className="pmp-main-content" style={{ overflowY: 'auto', flex: 1 }}>
                            {/* <div className="pmp-header-title">
                    <div className="pmp-title-pill">
                        <i className="fa fa-globe pmp-header-globe"></i>
                        Private Marketplace - Parthiban Varamudi
                    </div>
                    <div className="pmp-header-title-close">
                        <i className="fa fa-times"></i>
                    </div>
                </div> */}

                            {/* Top Bar */}
                            <div className="pmp-top-bar">
                                <div className="pmp-back-btn" onClick={() => setSidebarCollapsed(prev => !prev)}>
                                    <i className={`fa ${sidebarCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`} />
                                </div>


                                <div className="pmp-search-wrapper">
                                    <i className="fa fa-search pmp-search-icon"></i>
                                    <input type="text" className="pmp-search-input" placeholder="Search by deal name, id, publisher, or exchange..." />
                                </div>


                                <div className="pmp-refresh-btn" onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await fetchAllDealsData();
                                    } catch (error) {
                                        console.error("Error refreshing deals:", error);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}>
                                    <i className="fa fa-refresh"></i>
                                    <span>Refresh</span>
                                </div>

                                <div className="pmp-top-right-actions">
                                    <button
                                        className="pmp-btn-outline"
                                        onClick={() => {
                                            if (selectedRows.length === currentData.length && currentData.length > 0) {
                                                setSelectedRows([]);
                                            } else {
                                                setSelectedRows(currentData.map(row => row.id));
                                            }
                                        }}>
                                        {selectedRows.length === currentData.length && currentData.length > 0 ? "Deselect All" : "Select All"}
                                    </button>
                                    {activeView === "curated_deals" && (
                                        <button className="pmp-btn-outline" onClick={() => {
                                            setActiveTab("insights");
                                            setShowCustomize(true);
                                        }}>
                                            Customize Columns
                                        </button>

                                    )}
                                    {showCustomize && (
                                        <div className="pmp-modal-overlay" onClick={() => setShowCustomize(false)}>
                                            <div className="pmp-modal" onClick={(e) => e.stopPropagation()}>
                                                <div className="pmp-modal-header">
                                                    <span className="pmp-modal-title">Customize Columns</span>
                                                </div>

                                                <div className="pmp-modal-body">
                                                    <div className="pmp-modal-left">
                                                        <div
                                                            className={`pmp-modal-tab ${activeTab === "insights" ? "active" : ""}`}
                                                            onClick={() => setActiveTab("insights")}
                                                        >
                                                            Insights
                                                        </div>
                                                        <div
                                                            className={`pmp-modal-tab ${activeTab === "overview" ? "active" : ""}`}
                                                            onClick={() => setActiveTab("overview")}
                                                        >
                                                            Overview
                                                        </div>
                                                        <div
                                                            className={`pmp-modal-tab ${activeTab === "pricing" ? "active" : ""}`}
                                                            onClick={() => setActiveTab("pricing")}
                                                        >
                                                            Pricing & Terms
                                                        </div>
                                                        <div
                                                            className={`pmp-modal-tab ${activeTab === "targeting" ? "active" : ""}`}
                                                            onClick={() => setActiveTab("targeting")}
                                                        >
                                                            Targeting
                                                        </div>
                                                    </div>

                                                    <div className="pmp-modal-right">
                                                        {activeTab === "insights" && (
                                                            <>
                                                                <div className="pmp-column-section-header">
                                                                    <span className="pmp-column-section-title">Insights</span>
                                                                    <span
                                                                        className="pmp-column-link"
                                                                        onClick={() =>
                                                                            setColumns((prev) => ({ ...prev, auctions: !prev.auctions }))
                                                                        }
                                                                    >
                                                                        {columns.auctions ? "Deselect All" : "Select All"}
                                                                    </span>
                                                                </div>

                                                                <FilterCheckbox
                                                                    label="Y'day's Auctions"
                                                                    checked={columns.auctions}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({ ...prev, auctions: !prev.auctions }))
                                                                    }
                                                                />
                                                            </>
                                                        )}

                                                        {activeTab === "overview" && (
                                                            <>
                                                                <div className="pmp-column-section-header">
                                                                    <span className="pmp-column-section-title">Overview</span>
                                                                    <span
                                                                        className="pmp-column-link"
                                                                        onClick={() => {
                                                                            const allChecked = columns.dealId && columns.lastUpdated && columns.publisher && columns.exchange;
                                                                            setColumns((prev) => ({
                                                                                ...prev,
                                                                                dealId: !allChecked,
                                                                                lastUpdated: !allChecked,
                                                                                publisher: !allChecked,
                                                                                exchange: !allChecked,
                                                                            }));
                                                                        }}
                                                                    >
                                                                        {columns.dealId && columns.lastUpdated && columns.publisher && columns.exchange ? "Deselect All" : "Select All"}
                                                                    </span>
                                                                </div>

                                                                <FilterCheckbox
                                                                    label="Deal ID"
                                                                    checked={columns.dealId}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({ ...prev, dealId: !prev.dealId }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Last Updated"
                                                                    checked={columns.lastUpdated}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({
                                                                            ...prev,
                                                                            lastUpdated: !prev.lastUpdated,
                                                                        }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Publisher"
                                                                    checked={columns.publisher}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({
                                                                            ...prev,
                                                                            publisher: !prev.publisher,
                                                                        }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Exchange"
                                                                    checked={columns.exchange}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({
                                                                            ...prev,
                                                                            exchange: !prev.exchange,
                                                                        }))
                                                                    }
                                                                />
                                                            </>
                                                        )}

                                                        {activeTab === "pricing" && (
                                                            <>
                                                                <div className="pmp-column-section-header">
                                                                    <span className="pmp-column-section-title">Pricing & Terms</span>
                                                                    <span
                                                                        className="pmp-column-link"
                                                                        onClick={() => {
                                                                            const allChecked = columns.commitmentType && columns.price && columns.priceType && columns.impressions;
                                                                            setColumns((prev) => ({
                                                                                ...prev,
                                                                                commitmentType: !allChecked,
                                                                                price: !allChecked,
                                                                                priceType: !allChecked,
                                                                                impressions: !allChecked,
                                                                            }));
                                                                        }}
                                                                    >
                                                                        {columns.commitmentType && columns.price && columns.priceType && columns.impressions ? "Deselect All" : "Select All"}
                                                                    </span>
                                                                </div>

                                                                <FilterCheckbox
                                                                    label="Commitment Type"
                                                                    checked={columns.commitmentType}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({
                                                                            ...prev,
                                                                            commitmentType: !prev.commitmentType,
                                                                        }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Price (CPM)"
                                                                    checked={columns.price}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({ ...prev, price: !prev.price }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Price Type"
                                                                    checked={columns.priceType}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({ ...prev, priceType: !prev.priceType }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Impressions"
                                                                    checked={columns.impressions}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({
                                                                            ...prev,
                                                                            impressions: !prev.impressions,
                                                                        }))
                                                                    }
                                                                />
                                                            </>
                                                        )}

                                                        {activeTab === "targeting" && (
                                                            <>
                                                                <div className="pmp-column-section-header">
                                                                    <span className="pmp-column-section-title">Targeting</span>
                                                                    <span
                                                                        className="pmp-column-link"
                                                                        onClick={() => {
                                                                            const allChecked = columns.inventoryTypes && columns.formats && columns.deviceTypes;
                                                                            setColumns((prev) => ({
                                                                                ...prev,
                                                                                inventoryTypes: !allChecked,
                                                                                formats: !allChecked,
                                                                                deviceTypes: !allChecked,
                                                                            }));
                                                                        }}
                                                                    >
                                                                        {columns.inventoryTypes && columns.formats && columns.deviceTypes ? "Deselect All" : "Select All"}
                                                                    </span>
                                                                </div>
                                                                <FilterCheckbox
                                                                    label="Inventory Types"
                                                                    checked={columns.inventoryTypes}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({
                                                                            ...prev,
                                                                            inventoryTypes: !prev.inventoryTypes,
                                                                        }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Formats"
                                                                    checked={columns.formats}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({ ...prev, formats: !prev.formats }))
                                                                    }
                                                                />
                                                                <FilterCheckbox
                                                                    label="Device Types"
                                                                    checked={columns.deviceTypes}
                                                                    onChange={() =>
                                                                        setColumns((prev) => ({ ...prev, deviceTypes: !prev.deviceTypes }))
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pmp-modal-footer">
                                                    <button
                                                        className="pmp-btn-reset"
                                                        onClick={() => {
                                                            setColumns({
                                                                auctions: true,
                                                                dealId: false,
                                                                lastUpdated: true,
                                                                publisher: true,
                                                                exchange: true,
                                                                commitmentType: false,
                                                                price: true,
                                                                priceType: false,
                                                                impressions: false,
                                                                inventoryTypes: true,
                                                                formats: true,
                                                                deviceTypes: true,
                                                            });
                                                        }}
                                                    >
                                                        Reset to defaults
                                                    </button>
                                                    <div style={{ flex: 1 }}></div>
                                                    <button className="pmp-btn-outline" onClick={() => setShowCustomize(false)}>
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="pmp-btn-green-fill"
                                                        onClick={() => {
                                                            console.log("Selected Columns:", columns);
                                                            setShowCustomize(false);
                                                        }}
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {showNewDeal && (
                                        <div className="pmp-modal-overlay" onClick={() => setShowNewDeal(false)}>
                                            <div className={`pmp-new-deal-modal ${isStepTwo ? 'step-two' : ''}`} onClick={(e) => e.stopPropagation()}>
                                                <div className="pmp-modal-header" style={{ borderBottom: 'none', paddingBottom: '10px' }}>
                                                    <h2 className="pmp-new-deal-title">New Deal</h2>
                                                </div>

                                                <div className="pmp-modal-header-stepper">
                                                    <div className={`pmp-step ${!isStepTwo ? 'active' : ''}`}>
                                                        <div className="pmp-step-number">1</div>
                                                        ID Verification
                                                    </div>
                                                    <div className={`pmp-step ${isStepTwo ? 'active' : ''}`}>
                                                        <div className="pmp-step-number">2</div>
                                                        Additional Details
                                                    </div>
                                                </div>

                                                {!isStepTwo ? (
                                                    <><div className="pmp-form-body">
                                                        <div className="pmp-form-group">
                                                            <label className="pmp-form-label">Commitment Type <span className="pmp-required">*</span></label>
                                                            <div
                                                                id="commitmentType"
                                                                onMouseEnter={() => formErrors.commitmentType && setTooltipOpen(prev => ({ ...prev, commitmentType: true }))}
                                                                onMouseLeave={() => setTooltipOpen(prev => ({ ...prev, commitmentType: false }))}
                                                            >
                                                                <Select
                                                                    className="pmp-select"
                                                                    classNamePrefix="pmp-select"
                                                                    options={commitmentOptions}
                                                                    styles={getNewDealSelectStyles(!!formErrors.commitmentType)}
                                                                    placeholder="Select a Commitment Type"
                                                                    value={commitmentType}
                                                                    onChange={(val) => {
                                                                        setCommitmentType(val);
                                                                        if (formErrors.commitmentType) {
                                                                            setFormErrors(prev => ({ ...prev, commitmentType: false }));
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {formErrors.commitmentType && (
                                                                <Tooltip
                                                                    placement="bottom"
                                                                    isOpen={tooltipOpen.commitmentType}
                                                                    target="commitmentType"
                                                                    autohide={false}
                                                                    container=".pmp-new-deal-modal"
                                                                    popperClassName="custom-tooltip"
                                                                >
                                                                    <div className="one"></div>
                                                                    {formErrors.commitmentType}
                                                                </Tooltip>
                                                            )}
                                                        </div>



                                                        <div className="pmp-form-group">
                                                            <label className="pmp-form-label">Exchange <span className="pmp-required">*</span></label>
                                                            <div
                                                                id="exchangeValue"
                                                                onMouseEnter={() => formErrors.exchangeValue && setTooltipOpen(prev => ({ ...prev, exchangeValue: true }))}
                                                                onMouseLeave={() => setTooltipOpen(prev => ({ ...prev, exchangeValue: false }))}
                                                            >
                                                                <Select
                                                                    className="pmp-select"
                                                                    classNamePrefix="pmp-select"
                                                                    options={exchangeOptions}
                                                                    menuPortalTarget={document.body}
                                                                    styles={getExchangeSelectStyles(!!formErrors.exchangeValue)}
                                                                    placeholder="Select an Exchange"
                                                                    value={exchangeValue}
                                                                    onChange={(val) => {
                                                                        setExchangeValue(val);
                                                                        if (formErrors.exchangeValue) {
                                                                            setFormErrors((prev) => ({ ...prev, exchangeValue: false }));
                                                                        }
                                                                    }}
                                                                />

                                                            </div>
                                                            {formErrors.exchangeValue && (
                                                                <Tooltip
                                                                    placement="bottom"
                                                                    isOpen={tooltipOpen.exchangeValue}
                                                                    target="exchangeValue"
                                                                    autohide={false}
                                                                    container=".pmp-new-deal-modal"
                                                                    popperClassName="custom-tooltip"
                                                                >
                                                                    <div className="one"></div>
                                                                    {formErrors.exchangeValue}
                                                                </Tooltip>
                                                            )}

                                                        </div>

                                                        <div className="pmp-form-group">
                                                            <label className="pmp-form-label">Deal ID <span className="pmp-required">*</span></label>
                                                            <input
                                                                type="text"
                                                                id="dealId"
                                                                className={`pmp-form-input ${formErrors.dealId ? 'error' : ''}`}
                                                                placeholder="Enter a Deal ID"
                                                                value={dealIdValue}
                                                                onChange={(e) => {
                                                                    setDealIdValue(e.target.value);
                                                                    if (formErrors.dealId) {
                                                                        setFormErrors(prev => ({ ...prev, dealId: false }));
                                                                    }
                                                                }}
                                                                onMouseEnter={() => formErrors.dealId && setTooltipOpen(prev => ({ ...prev, dealId: true }))}
                                                                onMouseLeave={() => setTooltipOpen(prev => ({ ...prev, dealId: false }))}
                                                            />
                                                            {formErrors.dealId && (
                                                                <Tooltip
                                                                    placement="bottom"
                                                                    isOpen={tooltipOpen.dealId}
                                                                    target="dealId"
                                                                    autohide={false}
                                                                    container=".pmp-new-deal-modal"
                                                                    popperClassName="custom-tooltip"
                                                                >
                                                                    <div className="one"></div>
                                                                    {formErrors.dealId}
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    </div>

                                                        <div className="pmp-modal-footer">
                                                            <button className="pmp-btn-outline" onClick={() => setShowNewDeal(false)}>
                                                                Cancel
                                                            </button>
                                                            <button className="pmp-btn-green-next" onClick={handleNextStep}>
                                                                Next
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="pmp-alert">
                                                            <i className="fa fa-exclamation-triangle"></i>
                                                            Deals on this exchange do not support validation
                                                        </div>

                                                        <div className="pmp-form-body" style={{ paddingTop: 0 }}>
                                                            <div className="pmp-summary-container">
                                                                {[
                                                                    { label: "Deal ID:", value: dealIdValue },
                                                                    { label: "Exchange:", value: exchangeValue?.label },
                                                                    { label: "Commitment Type:", value: commitmentType?.label }
                                                                ].map((item, idx) => (
                                                                    <div key={idx} className="pmp-summary-item">
                                                                        {item.label && <div className="pmp-summary-label">{item.label}</div>}
                                                                        {item.value && <div className="pmp-summary-value">{item.value}</div>}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Deal Name <span className="pmp-required">*</span></label>
                                                                <input
                                                                    type="text"
                                                                    id="dealName"
                                                                    name="dealName"
                                                                    className={`pmp-form-input ${formErrors.dealName ? 'error' : ''}`}
                                                                    placeholder="Enter a Deal Name"
                                                                    style={{ height: '32px' }}
                                                                    value={dealFormData.dealName}
                                                                    onChange={handleDealChange}
                                                                    onMouseEnter={() => formErrors.dealName && setTooltipOpen(prev => ({ ...prev, dealName: true }))}
                                                                    onMouseLeave={() => setTooltipOpen(prev => ({ ...prev, dealName: false }))}
                                                                />
                                                                {formErrors.dealName && (
                                                                    <Tooltip
                                                                        placement="bottom"
                                                                        isOpen={tooltipOpen.dealName}
                                                                        target="dealName"
                                                                        autohide={false}
                                                                        container=".pmp-new-deal-modal"
                                                                        popperClassName="custom-tooltip"
                                                                    >
                                                                        <div className="one"></div>
                                                                        {formErrors.dealName}
                                                                    </Tooltip>
                                                                )}
                                                            </div>

                                                            <div className="pmp-form-group" style={{ marginTop: '15px' }}>
                                                                <label className="pmp-form-label">Description</label>
                                                                <textarea
                                                                    name="description"
                                                                    className="pmp-form-textarea"
                                                                    placeholder="Enter description..."
                                                                    value={dealFormData.description}
                                                                    onChange={handleDealChange}
                                                                ></textarea>
                                                            </div>

                                                            <div className="pmp-price-row" style={{ marginTop: '15px' }}>
                                                                <div className="pmp-form-group" style={{ marginBottom: 0 }}>
                                                                    <label className="pmp-form-label">Price (CPM)</label>
                                                                    <input
                                                                        type="text"
                                                                        name="price"
                                                                        className="pmp-price-input"
                                                                        placeholder="USD"
                                                                        style={{ border: '1px solid #40a9ff' }}
                                                                        value={dealFormData.price}
                                                                        onChange={handleDealChange}
                                                                    />
                                                                </div>
                                                                {commitmentType?.value !== 'guaranteed' && (
                                                                    <div className="pmp-form-group" style={{ marginBottom: 0 }} onClick={(e) => e.stopPropagation()}>
                                                                        <label className="pmp-form-label">Price Type</label>
                                                                        <div className="pmp-radio-group">
                                                                            <label className="pmp-radio-option">
                                                                                <input
                                                                                    type="radio"
                                                                                    name="priceType"
                                                                                    value="private_auction"
                                                                                    checked={priceType === 'private_auction'}
                                                                                    onChange={(e) => setPriceType(e.target.value)}
                                                                                />
                                                                                Private Auction
                                                                            </label>

                                                                            <label className="pmp-radio-option">
                                                                                <input
                                                                                    type="radio"
                                                                                    name="priceType"
                                                                                    value="fixed_price"
                                                                                    checked={priceType === 'fixed_price'}
                                                                                    onChange={(e) => setPriceType(e.target.value)}
                                                                                />
                                                                                Fixed Price
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {commitmentType?.value === 'guaranteed' && (
                                                                <div className="pmp-price-row" style={{ marginTop: '15px' }}>
                                                                    <div className="pmp-form-group" style={{ marginBottom: 0 }}>
                                                                        <label className="pmp-form-label">Media Cost </label>
                                                                        <input
                                                                            type="number"
                                                                            name="mediaCost"
                                                                            className="pmp-price-input"
                                                                            placeholder="USD"
                                                                            value={dealFormData.mediaCost}
                                                                            onChange={handleDealChange}
                                                                        />
                                                                    </div>
                                                                    <div className="pmp-form-group" style={{ marginBottom: 0 }}>
                                                                        <label className="pmp-form-label">Impressions </label>
                                                                        <input
                                                                            type="number"
                                                                            name="impressions"
                                                                            className="pmp-price-input"
                                                                            placeholder="Enter impressions"
                                                                            value={dealFormData.impressions}
                                                                            onChange={handleDealChange}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="pmp-date-row" style={{ marginTop: '15px' }}>
                                                                <div className="pmp-form-group">
                                                                    <label className="pmp-form-label">Start Date</label>
                                                                    <DatePickerInput
                                                                        id="startDate"
                                                                        label="Start Date"
                                                                        value={startDate}
                                                                        onChange={(val) => {
                                                                            setStartDate(val);
                                                                            setFormErrors(prev => ({ ...prev, startDate: false }));
                                                                        }}
                                                                        placeholder="start date"
                                                                        error={formErrors.startDate}

                                                                    />


                                                                </div>
                                                                <div className="pmp-form-group">
                                                                    <label className="pmp-form-label">End Date</label>
                                                                    <DatePickerInput
                                                                        id="endDate"
                                                                        label="End Date"
                                                                        value={endDate}
                                                                        onChange={(val) => {
                                                                            setEndDate(val);
                                                                            setFormErrors(prev => ({ ...prev, endDate: false }));
                                                                        }}
                                                                        placeholder="end date"
                                                                        error={formErrors.endDate}

                                                                    />

                                                                </div>
                                                            </div>
                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Publisher </label>
                                                                <input
                                                                    type="text"
                                                                    id="publisher"
                                                                    name="publisher"
                                                                    className={`pmp-form-input ${formErrors.publisher ? 'error' : ''}`}
                                                                    placeholder="Enter a Publisher"
                                                                    style={{ height: '32px' }}
                                                                    value={dealFormData.publisher}
                                                                    onChange={handleDealChange}

                                                                />

                                                            </div>
                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Device Type </label>
                                                                <div className="pmp-checkbox-group" style={{ flexWrap: 'wrap', height: 'auto', gap: '15px 20px' }}>
                                                                    {["Desktop", "Mobile", "Tablet", "Connected TV", "Digital Out of Home"].map(label => (
                                                                        <FilterCheckbox
                                                                            key={label}
                                                                            label={label}
                                                                            checked={dealFormData.deviceTypes.includes(label)}
                                                                            onChange={() => {
                                                                                const current = dealFormData.deviceTypes;
                                                                                const updated = current.includes(label)
                                                                                    ? current.filter(t => t !== label)
                                                                                    : [...current, label];
                                                                                setDealFormData(prev => ({ ...prev, deviceTypes: updated }));
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Inventory Type </label>
                                                                <div className="pmp-checkbox-group" style={{ flexWrap: 'wrap', height: 'auto', gap: '15px 20px' }}>
                                                                    {["Desktop web", "Desktop App", "Mobile web", "Mobile App", "Digital Out of Home"].map(label => (
                                                                        <FilterCheckbox
                                                                            key={label}
                                                                            label={label}
                                                                            checked={dealFormData.inventoryTypes.includes(label)}
                                                                            onChange={() => {
                                                                                const current = dealFormData.inventoryTypes;
                                                                                const updated = current.includes(label)
                                                                                    ? current.filter(t => t !== label)
                                                                                    : [...current, label];
                                                                                setDealFormData(prev => ({ ...prev, inventoryTypes: updated }));
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Formats </label>
                                                                <div className="pmp-checkbox-group" style={{ flexWrap: 'wrap', height: 'auto', gap: '15px 20px' }}>
                                                                    {["Audio", "Display", "Native", "Video"].map(label => (
                                                                        <FilterCheckbox
                                                                            key={label}
                                                                            label={label}
                                                                            checked={dealFormData.formats.includes(label)}
                                                                            onChange={() => {
                                                                                const current = dealFormData.formats;
                                                                                const updated = current.includes(label)
                                                                                    ? current.filter(t => t !== label)
                                                                                    : [...current, label];
                                                                                setDealFormData(prev => ({ ...prev, formats: updated }));
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="pmp-form-group">
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <label className="pmp-form-label" style={{ marginBottom: 0 }}>Advertiser domains </label>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-link p-0"
                                                                        onClick={toggleSelectDomainModal}
                                                                        style={{ fontSize: "11px", color: "#4c9eec", textDecoration: 'none' }}
                                                                    >
                                                                        Select
                                                                    </button>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    id="advertiserDomains"
                                                                    name="advertiserDomains"
                                                                    className={`pmp-form-input`}
                                                                    placeholder="Enter a comma-seperated list of advertiser domains."
                                                                    style={{ height: '32px' }}
                                                                    value={dealFormData.advertiserDomains}
                                                                    onChange={handleDealChange}
                                                                />
                                                                <SelectDomain isOpen={selectDomainOpen} toggle={toggleSelectDomainModal} />
                                                            </div>
                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Countries </label>
                                                                <Select
                                                                    isMulti
                                                                    className="pmp-select"
                                                                    classNamePrefix="pmp-select"
                                                                    options={countryOptions}
                                                                    styles={getNewDealSelectStyles(false)}
                                                                    placeholder="Select Countries"
                                                                    value={dealFormData.countries}
                                                                    onChange={(val) => setDealFormData(prev => ({ ...prev, countries: val || [] }))}
                                                                />
                                                            </div>
                                                            <div className="pmp-form-group" style={{ marginBottom: '5px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <label className="pmp-form-label" style={{ marginBottom: 0 }}>Categories </label>
                                                                    {selectedCategories.length > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-link p-0"
                                                                            onClick={() => setSelectedCategories([])}
                                                                            style={{ fontSize: "11px", color: "#4c9eec", textDecoration: 'none' }}
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div
                                                                className="pmp-form-input"
                                                                style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#fcfcfc', borderStyle: 'dashed' }}
                                                                onClick={toggleModal}
                                                            >
                                                                <span style={{ fontSize: '11px', color: '#666' }}>Select Categories</span>
                                                            </div>

                                                            <div className="mt-2">
                                                                {selectedCategories.map((cat, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="badge me-1 mt-1"
                                                                        style={{
                                                                            backgroundColor: "#ffffff", color: "#52a3e4",
                                                                            border: "1px solid #dadada", borderRadius: "50px",
                                                                            fontSize: "11px", display: "inline-flex",
                                                                            alignItems: "center", gap: "0.25rem",
                                                                            padding: "0.35rem 0.75rem", fontWeight: "600"
                                                                        }}
                                                                    >
                                                                        {cat.parent} {cat.childrenCount > 0 && `(${cat.childrenCount})`}
                                                                        <span style={{ cursor: "pointer", color: "#999999" }} onClick={() => handleRemoveCategory(cat.parent)}>×</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <CategoriesModal modalOpen={modalOpen} toggleModal={toggleModal} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Additional Notes </label>
                                                                <textarea
                                                                    name="additionalNotes"
                                                                    className={`pmp-form-textarea ${formErrors.additionalNotes ? 'error' : ''}`}
                                                                    placeholder="Enter any additional notes..."
                                                                    style={{ height: '60px' }}
                                                                    value={dealFormData.additionalNotes}
                                                                    onChange={handleDealChange}
                                                                ></textarea>
                                                                {formErrors.additionalNotes && <div className="pmp-error-text">Additional Notes is required</div>}
                                                            </div>
                                                        </div>

                                                        <div className="pmp-modal-footer" style={{ borderTop: '1px solid #e0e0e0', marginTop: 'auto' }}>
                                                            <button className="pmp-btn-outline" onClick={() => setIsStepTwo(false)}>
                                                                Back
                                                            </button>
                                                            <button className="pmp-btn-green-fill" onClick={handleCreateDeal}>
                                                                Create Deal
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeView === "my_deals" && (
                                        <>
                                            <button className="pmp-btn-outline">Deselect All </button>
                                            <button className="pmp-btn-green-fill" onClick={() => {
                                                setCommitmentType(null);
                                                setExchangeValue(null);
                                                setDealIdValue('');
                                                setDealFormData({
                                                    dealName: "",
                                                    publisher: "",
                                                    advertiserDomains: "",
                                                    description: "",
                                                    price: "",
                                                    mediaCost: "",
                                                    impressions: "",
                                                    countries: [],
                                                    deviceTypes: [],
                                                    inventoryTypes: [],
                                                    formats: [],
                                                    additionalNotes: "",
                                                });
                                                setFormErrors({});
                                                setShowNewDeal(true);
                                                setIsStepTwo(false);
                                            }}>New Deal</button>
                                            <button className="pmp-btn-outline" onClick={() => setShowCustomize(true)}>Customize Columns</button>
                                        </>
                                    )}

                                    {activeView === "my_deal_groups" && (
                                        <button className="pmp-btn-green-fill">New Deal group</button>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="pmp-table-wrapper">
                                <DataTable
                                    columns={currentColumns}
                                    data={currentData}
                                    progressPending={loading}
                                    progressComponent={<CustomLoader />}
                                    striped
                                    dense
                                    fixedHeader
                                    fixedHeaderScrollHeight="100%"
                                    highlightOnHover
                                    persistTableHead
                                    conditionalRowStyles={conditionalRowStyles}
                                    customStyles={customStyles}
                                    noDataComponent={<NoDataComponent />}
                                    onRowClicked={(row) => {
                                        // handle selection logic if needed
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>

            <ModalFooter className="bg-light">
                {onBack && (
                    <Button color="secondary" className="pmp-btn-outline" onClick={onBack}>
                        Back
                    </Button>
                )}
                <Button color="secondary" className="pmp-btn-outline" onClick={toggle}>
                    Cancel
                </Button>
                <Button color="success" className="pmp-btn-green-fill" onClick={() => {
                    // Build selected deal objects from currentData depending on active view
                    const source = activeView === "curated_deal_groups" ? mockDealGroups : mockCuratedDeals;
                    const selectedData = source.filter(row => selectedRows.includes(row.id));
                    if (onApplySelectedDeals) {
                        try { onApplySelectedDeals(selectedData); } catch (err) { console.error(err); }
                    }
                    toggle();
                }}>
                    Add
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default NewDealGroupPmp;
