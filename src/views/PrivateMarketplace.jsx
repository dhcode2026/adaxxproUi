import React, { useState } from "react";
import ReactDOM from "react-dom";
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
    Button,
    Card,
    CardBody,
} from "reactstrap";
import { FaCog, FaCaretDown } from "react-icons/fa";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import CategoriesModal from "./Modal/categoriesModal";
import SelectDomain from "./Modal/SelectDomain";
import DatePickerInput from "./Modal/DatePickerInput";
import Pmpsidebar from "./Pmpsidebar";
import NewDealGroupPmp from "./Modal/NewDealGroupPmp";
import { getAllExchange, getcountry, createDeal, getAllDeals } from "./api/Api";
import Tabs from "../components/Tab/Tabs";
import Tab from "../components/Tab/Tab";
import { useGlobalTabs } from "../context/TabContext";
import { useLocation } from "react-router-dom";
import { canCreate, canEdit, canDelete, canView, canUpdate } from "../utils/permissionHelper";
import "../assets/css/privatemarketplace.css";






const PrivateMarketplace = () => {

    const navigate = useNavigate();
    const location = useLocation();
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
        dealGroupName: false,
    });
    const [loadingMap, setLoadingMap] = useState({
        curated_deals: false,
        curated_deal_groups: true,
        my_deals: true,
        my_deal_groups: true,
    });
    const [shownewdealgroup, setShownewdealgroup] = useState(false);
    const [isDealGroupStepTwo, setIsDealGroupStepTwo] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [dealGroupFormData, setDealGroupFormData] = useState({
        dealGroupName: "",
        description: "",
    });
    const [selectedDeals, setSelectedDeals] = useState([]);
    const [exchangeOptions, setExchangeOptions] = useState([]);
    const [countryOptions, setCountryOptions] = useState([]);
    const [allDeals, setAllDeals] = useState([]);
    const currentUsername = localStorage.getItem("username") || "";
    const [canCreateUser, setCanCreateUser] = useState(false);
    const [canViewUser, setCanViewUser] = useState(false);
    const [canEditUser, setCanEditUser] = useState(false);
    const [canDeleteUser, setCanDeleteUser] = useState(false);
    const [canUpdateUser, setCanUpdateUser] = useState(false);
    const { globalTabsList: tabsList, addTab, removeTab, updateTab, initializePageTab, firstName, lastName } = useGlobalTabs();


    useEffect(() => {
        initializePageTab("Private Marketplace", "fa fa-handshake-o", "/admin/private-marketplace");
    }, [initializePageTab]);

    useEffect(() => {
        const displayName = firstName && lastName ? `${firstName} ${lastName}` : (localStorage.getItem("username") || "User");
        updateTab("default", {
            header: (
                <>
                    <i className="fa fa-handshake-o me-2"></i>
                    Private Marketplace - <i>{displayName}</i>
                </>
            ),
        });
    }, [firstName, lastName, updateTab]);;
    useEffect(() => {
        const hasCreatePermission = canCreate("Private Marketplace");
        const hasViewPermission = canView("Private Marketplace");
        const hasEditPermission = canEdit("Private Marketplace");
        const hasDeletePermission = canDelete("Private Marketplace");
        const hasUpdatePermission = canUpdate("Private Marketplace");

        setCanCreateUser(hasCreatePermission);
        setCanViewUser(hasViewPermission);
        setCanEditUser(hasEditPermission);
        setCanDeleteUser(hasDeletePermission);
        setCanUpdateUser(hasUpdatePermission);
    }, []);


    const fetchExchanges = async () => {
        try {
            const response = await getAllExchange();
            if (response.data && response.data.data && response.data.data.informationExchanges) {
                const mappedExchanges = response.data.data.informationExchanges.map(ex => ({
                    value: ex.exchangeId,
                    label: ex.name
                }));
                setExchangeOptions(mappedExchanges.sort((a, b) => a.label.localeCompare(b.label)));
            }
        } catch (error) {
            console.error("Error fetching exchanges:", error);
        }
    };

    const fetchCountries = async () => {
        try {
            const response = await getcountry();
            if (response.data && response.data.data && response.data.data.informationCountries) {
                const mappedCountries = response.data.data.informationCountries.map(country => ({
                    value: country.name,
                    label: country.name
                }));
                setCountryOptions(mappedCountries.sort((a, b) => a.label.localeCompare(b.label)));
            }
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
    };

    const fetchAllDealsData = async () => {
        try {
            // First fetch exchanges to build mapping
            const exchangeResponse = await getAllExchange();
            let map = {};
            if (exchangeResponse.data && exchangeResponse.data.data && exchangeResponse.data.data.informationExchanges) {
                exchangeResponse.data.data.informationExchanges.forEach(ex => {
                    map[ex.exchangeId] = ex.name;
                    map[String(ex.exchangeId)] = ex.name;
                });
            }

            // Then fetch deals and map with exchange names
            const response = await getAllDeals();
            console.log("Deals API Response:", response.data);
            if (response.data && response.data.data && response.data.data.informationDeal) {
                const mappedDeals = response.data.data.informationDeal.map(deal => {
                    // Try to lookup exchange name, handle both numeric and string IDs
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
                console.log("Mapped Deals:", mappedDeals);
                setAllDeals(mappedDeals);
            }
        } catch (error) {
            console.error("Error fetching deals:", error);
        }
    };

    useEffect(() => {
        fetchExchanges();
        fetchCountries();
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

    // Fetch deals when curated_deals view is selected
    useEffect(() => {
        if (activeView === "curated_deals") {
            setLoading(true);
            fetchAllDealsData().finally(() => setLoading(false));
        }
    }, [activeView]);
    const Loader = () => <span className="pmp-loader" />;
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [selectDomainOpen, setSelectDomainOpen] = useState(false);
    const toggleModal = () => setModalOpen(!modalOpen);
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

    const [showFormulaWarning, setShowFormulaWarning] = useState(false);

    const handleDealChange = (e) => {
        const { name, value } = e.target;

        setDealFormData((prev) => ({
            ...prev,
            [name]: name === "price" || name === "mediaCost"
                ? parseCurrency(value)
                : value,
        }));

        if (formErrors[name]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: false,
            }));
        }
        const updatedValue =
            name === "price" || name === "mediaCost" || name === "impressions"
                ? parseCurrency(value)
                : value;

        setDealFormData((prev) => {
            const next = { ...prev, [name]: updatedValue };


            if (name === "impressions") {
                const p = parseFloat(parseCurrency(next.price));
                const i = parseFloat(parseCurrency(next.impressions));
                const m = parseFloat(parseCurrency(next.mediaCost));

                if (p && i && m) {
                    const calculated = (p * i) / 1000;
                    const hasMismatch = Math.abs(calculated - m) > 0.01;
                    setShowFormulaWarning(hasMismatch);
                } else {
                    setShowFormulaWarning(false);
                }
            }

            return next;
        });

        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: false }));
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
        <div class="pmp-swal-content">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png"
               class="pmp-swal-icon" />
          <span class="pmp-swal-title">Error</span>
        </div>
        <div class="pmp-swal-message">
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

            console.log(payload);

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

        setFormErrors({});
        setIsStepTwo(true);
    };


    const [showCustomize, setShowCustomize] = useState(false);
    const [activeTab, setActiveTab] = useState("insights");
    const [searchQuery, setSearchQuery] = useState("");
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

    useEffect(() => {
        if (showCustomize) {
            setSearchQuery("");
        }
    }, [showCustomize]);

    const customizeSections = {
        insights: [
            { key: "auctions", label: "Y'day's Auctions", defaultChecked: true },
        ],
        overview: [
            { key: "dealId", label: "Deal ID", defaultChecked: false },
            { key: "lastUpdated", label: "Last Updated", defaultChecked: true },
            { key: "publisher", label: "Publisher", defaultChecked: true },
            { key: "exchange", label: "Exchange", defaultChecked: true },
        ],
        pricing: [
            { key: "commitmentType", label: "Commitment Type", defaultChecked: false },
            { key: "price", label: "Price (CPM)", defaultChecked: true },
            { key: "priceType", label: "Price Type", defaultChecked: false },
            { key: "impressions", label: "Impressions", defaultChecked: false },
        ],
        targeting: [
            { key: "inventoryTypes", label: "Inventory Types", defaultChecked: true },
            { key: "formats", label: "Formats", defaultChecked: true },
            { key: "deviceTypes", label: "Device Types", defaultChecked: true },
        ],
    };

    const activeCustomizeFields = customizeSections[activeTab] || [];
    const filteredCustomizeFields = activeCustomizeFields.filter((field) =>
        field.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
    const visibleCustomizeFields = filteredCustomizeFields.filter((field) => columns[field.key]);
    const hiddenCustomizeFields = filteredCustomizeFields.filter((field) => !columns[field.key]);
    const allActiveChecked = activeCustomizeFields.length > 0 && activeCustomizeFields.every((field) => columns[field.key]);

    const toggleCustomizeColumn = (key) => {
        setColumns((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const toggleAllCustomizeColumns = () => {
        setColumns((prev) => {
            const next = { ...prev };
            const shouldSelectAll = !allActiveChecked;

            activeCustomizeFields.forEach((field) => {
                next[field.key] = shouldSelectAll;
            });

            return next;
        });
    };

    const resetCustomizeColumns = () => {
        const nextColumns = {};

        Object.values(customizeSections).forEach((section) => {
            section.forEach((field) => {
                nextColumns[field.key] = field.defaultChecked;
            });
        });

        setColumns(nextColumns);
    };

    const validateDealGroupStep1 = () => {
        const errors = {};

        if (!dealGroupFormData.dealGroupName?.trim()) {
            errors.dealGroupName = "Deal Group Name is required";
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            showValidationError();
            return false;
        }
        return true;
    };

    const handleDealGroupChange = (e) => {
        const { name, value } = e.target;
        setDealGroupFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handleDealGroupNextStep = () => {
        if (!validateDealGroupStep1()) {
            return;
        }
        setFormErrors({});
        setIsDealGroupStepTwo(true);
    };

    const handleCreateDealGroup = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to create this Deal Group?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, create it!",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#62903e",
        });

        if (!result.isConfirmed) return;

        setLoading(true);

        try {
            const payload = {
                dealGroupName: dealGroupFormData.dealGroupName,
                description: dealGroupFormData.description,
                selectedDeals: selectedDeals
            };

            console.log("Creating Deal Group with payload:", payload);

            await new Promise(resolve => setTimeout(resolve, 1000));

            await Swal.fire({
                title: "Success!",
                text: "Deal Group has been created successfully.",
                icon: "success",
                confirmButtonColor: "#62903e"
            });

            setShownewdealgroup(false);
            setIsDealGroupStepTwo(false);
            setDealGroupFormData({
                dealGroupName: "",
                description: "",
            });
            setSelectedDeals([]);
            setFormErrors({});
        } catch (error) {
            console.error("Error creating deal group:", error);
            Swal.fire(
                "Error!",
                "Something went wrong. Please try again.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDealSelection = (dealId) => {
        setSelectedDeals(prev =>
            prev.includes(dealId)
                ? prev.filter(id => id !== dealId)
                : [...prev, dealId]
        );
    };



    const overlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    };

    const modalStyle = {
        background: "#fff",
        padding: "20px",
        position: "relative",
        width: "90vw",
        maxWidth: "1400px",
        maxHeight: "85vh",
        overflowY: "auto",
        marginTop: "60px",

    };

    const closeBtnStyle = {
        position: "absolute",
        top: "10px",
        right: "10px",
        border: "none",
        background: "transparent",
        fontSize: "18px",
        cursor: "pointer",
    };



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




    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 1500);
    };

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
                paddingLeft: "14px",
                paddingRight: "14px",
                paddingTop: "10px",
                paddingBottom: "10px",
                borderRight: "1px solid #f1f5f9",
                whiteSpace: "nowrap",
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
                <div className={`pmp-checkbox-box ${checkboxValue ? "pmp-checkbox-box-checked" : "pmp-checkbox-box-unchecked"}`}>
                    {checkboxValue && <i className="fa fa-check pmp-checkbox-icon"></i>}
                </div>
                {label}
            </div>
        );
    };


    const AudienceActionsCell = ({ row }) => {
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const toggle = () => setDropdownOpen(!dropdownOpen);

        return (
            <Dropdown isOpen={dropdownOpen} toggle={toggle}>
                <DropdownToggle tag="span" className="settings pmp-settings-toggle">
                    <FaCog className="pmp-settings-icon" />
                    <FaCaretDown />
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem>
                        View Deal
                    </DropdownItem>
                    <DropdownItem >
                        Add to deal groups
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    };

    const handlesidebartoggle = () => {
        setSidebarCollapsed(!sidebarCollapsed)
    }

    const handleactiveview = (view) => {
        setActiveView(view)
    }


    const formatCurrency = (value) => {
        if (!value) return "";
        const valStr = typeof value === 'string' ? value : String(value);
        const number = parseFloat(valStr.replace(/[^\d.]/g, ""));
        if (isNaN(number)) return "";
        return `$${number.toFixed(2)} USD`;
    };

    const parseCurrency = (value) => {
        if (typeof value !== 'string') return value;
        return value.replace(/[^\d.]/g, "");
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


    return (
        <>
            {canViewUser && (
                <div className="pmp-container">

                    {/* Sidebar */}
                    <Pmpsidebar sidebarCollapseddata={sidebarCollapsed} handleactiveview={handleactiveview} curatedDealsCount={allDeals.length} />

                    {/* Main Content */}
                    <div className="pmp-main-content">

                        {/* Top Bar */}
                        <Card className="mb-3 pmp-main-card">
                            <CardBody className="py-3 pmp-card-body">
                                <div className="pmp-top-bar">
                                    <div className="pmp-back-btn" onClick={() => setSidebarCollapsed(prev => !prev)}>
                                        <i className={`fa ${sidebarCollapsed ? "fa-chevron-right" : "fa-chevron-left"}`} />
                                    </div>


                                    <div className="pmp-search-wrapper">
                                        <i className="fa fa-search pmp-search-icon-pm"></i>
                                        <input type="text" className="pmp-search-input" placeholder="Search by deal name, id, publisher, or exchange..." />
                                    </div>


                                    <div className="pmp-refresh-btn" onClick={handleRefresh}>
                                        <i className="fa fa-refresh"></i>
                                        <span>Refresh</span>
                                    </div>

                                    <div className="pmp-top-right-actions">
                                        {activeView === "curated_deals" && (
                                            <button type="button"
                                                className="cdi-export-btn pmp-customize-columns-btn"
                                                onClick={() => {
                                                    setActiveTab("insights");
                                                    setShowCustomize(true);
                                                }}>
                                                Customize Columns
                                            </button>

                                        )}
                                        {showCustomize &&
                                            ReactDOM.createPortal(
                                                <div className="ccm-overlay" onClick={() => setShowCustomize(false)}>
                                                    <div className="ccm-modal" onClick={(event) => event.stopPropagation()}>
                                                        <div className="ccm-header">
                                                            <div>
                                                                <h2>Customize Columns</h2>
                                                                <p>Choose which Private Marketplace columns show in the table.</p>
                                                            </div>
                                                            <button type="button" className="ccm-close-btn" onClick={() => setShowCustomize(false)}>
                                                                <FaTimes />
                                                            </button>
                                                        </div>

                                                        <div className="ccm-search-bar">
                                                            <FaSearch className="ccm-search-icon" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search columns..."
                                                                value={searchQuery}
                                                                onChange={(event) => setSearchQuery(event.target.value)}
                                                            />
                                                        </div>

                                                        <div className="pmp-customize-tab-row">
                                                            {[
                                                                ["insights", "Insights"],
                                                                ["overview", "Overview"],
                                                                ["pricing", "Pricing & Terms"],
                                                                ["targeting", "Targeting"],
                                                            ].map(([key, label]) => (
                                                                <button
                                                                    key={key}
                                                                    type="button"
                                                                    onClick={() => setActiveTab(key)}
                                                                    className={`pmp-customize-tab-btn ${activeTab === key ? "active" : ""}`}
                                                                >
                                                                    {label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="pmp-customize-section-header">
                                                            <div className="pmp-customize-section-title">
                                                                {activeTab.replace(/^\w/, (char) => char.toUpperCase())}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={toggleAllCustomizeColumns}
                                                                className="pmp-customize-select-all"
                                                            >
                                                                {allActiveChecked ? "Deselect All" : "Select All"}
                                                            </button>
                                                        </div>

                                                        <div className="ccm-body">
                                                            <div className="ccm-column">
                                                                <div className="ccm-column-header">
                                                                    HIDDEN FIELDS ({hiddenCustomizeFields.length})
                                                                </div>
                                                                <div className="ccm-list-container">
                                                                    {hiddenCustomizeFields.length === 0 ? (
                                                                        <div className="pmp-customize-empty-state">
                                                                            No hidden columns match your search.
                                                                        </div>
                                                                    ) : (
                                                                        hiddenCustomizeFields.map((field) => (
                                                                            <div key={field.key} className="ccm-list-item pmp-customize-list-item">
                                                                                <div className="ccm-item-left">
                                                                                    <span>{field.label}</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    className="ccm-item-action add"
                                                                                    onClick={() => toggleCustomizeColumn(field.key)}
                                                                                    aria-label={`Show ${field.label}`}
                                                                                >
                                                                                    <FaPlus />
                                                                                </button>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="ccm-column">
                                                                <div className="ccm-column-header visible-header">
                                                                    VISIBLE FIELDS ({visibleCustomizeFields.length})
                                                                </div>
                                                                <div className="ccm-list-container">
                                                                    {visibleCustomizeFields.length === 0 ? (
                                                                        <div className="pmp-customize-empty-state">
                                                                            No visible columns match your search.
                                                                        </div>
                                                                    ) : (
                                                                        visibleCustomizeFields.map((field) => (
                                                                            <div key={field.key} className="ccm-list-item pmp-customize-list-item">
                                                                                <div className="ccm-item-left">
                                                                                    <span>{field.label}</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    className="ccm-item-action remove"
                                                                                    onClick={() => toggleCustomizeColumn(field.key)}
                                                                                    aria-label={`Hide ${field.label}`}
                                                                                >
                                                                                    <FaTimes />
                                                                                </button>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="ccm-footer pmp-customize-footer">
                                                            <button type="button" className="pmp-btn-reset" onClick={resetCustomizeColumns}>
                                                                Reset to defaults
                                                            </button>
                                                            <div className="pmp-customize-footer-actions">
                                                                <button type="button" className="ccm-cancel-btn" onClick={() => setShowCustomize(false)}>
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ccm-save-btn"
                                                                    onClick={() => {
                                                                        console.log("Selected Columns:", columns);
                                                                        setShowCustomize(false);
                                                                    }}
                                                                >
                                                                    APPLY
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>,
                                                document.body
                                            )}


                                        <Modal
                                            isOpen={showNewDeal}
                                            toggle={() => setShowNewDeal(false)}
                                            size="lg"
                                            centered
                                            scrollable={true}
                                            className={isStepTwo ? 'pmp-new-deal-modal step-two' : 'pmp-new-deal-modal'}
                                        >
                                            <ModalHeader toggle={() => setShowNewDeal(false)} className="border-bottom-0 pb-2">
                                                <h2 className="pmp-new-deal-title mb-0">New Deal</h2>
                                            </ModalHeader>
                                            <ModalBody className="pt-0">
                                                <div className="pmp-modal-header-stepper">
                                                    <div className={`pmp-step ${!isStepTwo ? 'active' : ''}`}>
                                                        <div className="pmp-step-number">1</div>
                                                        ID Verification
                                                    </div>
                                                    <div className={`pmp-step ${isStepTwo ? 'active' : ''}`}>
                                                        <div className="pmp-step-number">2</div>
                                                    </div>
                                                </div>

                                                {!isStepTwo ? (
                                                    <>
                                                        <div className="pmp-form-body">
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

                                                        <ModalFooter className="border-top-0 pt-0">
                                                            <Button color="secondary" className="pmp-btn-outline" onClick={() => setShowNewDeal(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button color="success" className="pmp-btn-green-next" onClick={handleNextStep}>
                                                                Next
                                                            </Button>
                                                        </ModalFooter>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="pmp-alert">
                                                            <i className="fa fa-exclamation-triangle"></i>
                                                            Deals on this exchange do not support validation
                                                        </div>

                                                        <div className="pmp-form-body pmp-form-body-no-padding-top">
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
                                                                    className={`pmp-form-input pmp-input-height-32 ${formErrors.dealName ? 'error' : ''}`}
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

                                                            <div className="pmp-form-group pmp-form-group-spacing-top">
                                                                <label className="pmp-form-label">Description</label>
                                                                <textarea
                                                                    name="description"
                                                                    className="pmp-form-textarea"
                                                                    placeholder="Enter description..."
                                                                    value={dealFormData.description}
                                                                    onChange={handleDealChange}
                                                                ></textarea>
                                                            </div>

                                                            <div className="pmp-price-row pmp-form-group-spacing-top">
                                                                <div className="pmp-form-group pmp-form-group-compact">
                                                                    <label className="pmp-form-label">Price (CPM)1</label>
                                                                    <input
                                                                        type="text"
                                                                        name="price"
                                                                        className="pmp-price-input pmp-price-input-focused"
                                                                        placeholder="USD"
                                                                        value={dealFormData.price}
                                                                        onChange={handleDealChange}
                                                                        onBlur={handleBlur}
                                                                        onFocus={handleFocus}
                                                                        onKeyPress={(e) => {
                                                                            if (!/[0-9.]/.test(e.key)) {
                                                                                e.preventDefault();
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                {commitmentType?.value !== 'guaranteed' && (
                                                                    <div className="pmp-form-group pmp-form-group-compact" onClick={(e) => e.stopPropagation()}>
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
                                                                <div className="pmp-price-row pmp-form-group-spacing-top">
                                                                    <div className="pmp-form-group pmp-form-group-compact">
                                                                        <label className="pmp-form-label">Media Cost </label>
                                                                        <input
                                                                            type="text"
                                                                            name="mediaCost"
                                                                            className="pmp-price-input pmp-price-input-focused"
                                                                            placeholder="USD"
                                                                            value={dealFormData.mediaCost}
                                                                            onChange={handleDealChange}
                                                                            onBlur={handleBlur}
                                                                            onFocus={handleFocus}
                                                                            onKeyPress={(e) => {
                                                                                if (!/[0-9.]/.test(e.key)) {
                                                                                    e.preventDefault();
                                                                                }
                                                                            }}
                                                                        />


                                                                    </div>
                                                                    <div className="pmp-form-group pmp-form-group-compact">
                                                                        <label className="pmp-form-label">Impressions </label>
                                                                        <input
                                                                            type="text"
                                                                            name="impressions"
                                                                            className="pmp-price-input pmp-price-input-focused"
                                                                            placeholder=""
                                                                            value={dealFormData.impressions}
                                                                            onChange={handleDealChange}
                                                                            onBlur={handleBlur}
                                                                            onFocus={handleFocus}
                                                                            onKeyPress={(e) => {
                                                                                if (!/[0-9]/.test(e.key)) {
                                                                                    e.preventDefault();
                                                                                }
                                                                            }}
                                                                        />
                                                                    </div>

                                                                </div>
                                                            )}
                                                            {showFormulaWarning && (
                                                                <div className="pmp-warning">
                                                                    ⚠️ Please verify values based on the formula:<strong>Price (CPM) × Impressions ÷ 1,000 = Media Cost.</strong>
                                                                </div>
                                                            )}

                                                            <div className="pmp-date-row pmp-form-group-spacing-top">
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
                                                                    className={`pmp-form-input pmp-input-height-32 ${formErrors.publisher ? 'error' : ''}`}
                                                                    placeholder="Enter a Publisher"
                                                                    value={dealFormData.publisher}
                                                                    onChange={handleDealChange}
                                                                />
                                                            </div>

                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Device Type </label>
                                                                <div className="pmp-checkbox-group pmp-checkbox-group-wrap">
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
                                                                <div className="pmp-checkbox-group pmp-checkbox-group-wrap">
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
                                                                <div className="pmp-checkbox-group pmp-checkbox-group-wrap">
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
                                                                <div className="pmp-inline-heading-row">
                                                                    <label className="pmp-form-label pmp-inline-heading-label">Advertiser domains </label>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    id="advertiserDomains"
                                                                    name="advertiserDomains"
                                                                    className={`pmp-form-input pmp-input-height-32`}
                                                                    placeholder="Enter a comma-seperated list of advertiser domains."
                                                                    value={dealFormData.advertiserDomains}
                                                                    onChange={handleDealChange}
                                                                />
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

                                                            <div className="pmp-form-group pmp-form-group-spacing-bottom">
                                                                <div className="pmp-inline-heading-row">
                                                                    <label className="pmp-form-label pmp-inline-heading-label">Categories </label>
                                                                    {selectedCategories.length > 0 && (
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-link p-0 pmp-category-clear"
                                                                            onClick={() => setSelectedCategories([])}
                                                                        >
                                                                            Clear
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="pmp-form-input pmp-category-picker"
                                                                onClick={toggleModal}
                                                            >
                                                                <span className="pmp-category-picker-label">Select Categories</span>
                                                            </div>

                                                            <div className="mt-2">
                                                                {selectedCategories.map((cat, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="badge me-1 mt-1 pmp-category-chip"
                                                                    >
                                                                        {cat.parent} {cat.childrenCount > 0 && `(${cat.childrenCount})`}
                                                                        <span className="pmp-category-chip-remove" onClick={() => handleRemoveCategory(cat.parent)}>×</span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <CategoriesModal modalOpen={modalOpen} toggleModal={toggleModal} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

                                                            <div className="pmp-form-group">
                                                                <label className="pmp-form-label">Additional Notes </label>
                                                                <textarea
                                                                    name="additionalNotes"
                                                                    className={`pmp-form-textarea pmp-textarea-height-60 ${formErrors.additionalNotes ? 'error' : ''}`}
                                                                    placeholder="Enter any additional notes..."
                                                                    value={dealFormData.additionalNotes}
                                                                    onChange={handleDealChange}
                                                                ></textarea>
                                                                {formErrors.additionalNotes && <div className="pmp-error-text">Additional Notes is required</div>}
                                                            </div>
                                                        </div>

                                                        <ModalFooter className="border-top pt-3">
                                                            <Button color="secondary" className="pmp-btn-outline" onClick={() => setIsStepTwo(false)}>
                                                                Back
                                                            </Button>
                                                            <Button color="success" className="pmp-btn-green-fill" onClick={handleCreateDeal}>
                                                                Create Deal
                                                            </Button>
                                                        </ModalFooter>
                                                    </>
                                                )}
                                            </ModalBody>
                                        </Modal>

                                        {activeView === "my_deals" && (
                                            <>
                                                <button className="pmp-btn-outline">Bulk Edit <i className="fa fa-caret-down"></i></button>
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
                                            <button className="pmp-btn-green-fill" onClick={() => {
                                                setShownewdealgroup(true);
                                                setIsDealGroupStepTwo(false);
                                                setIsOpen(true);
                                                setDealGroupFormData({
                                                    dealGroupName: "",
                                                    description: "",
                                                });
                                                setSelectedDeals([]);
                                                setFormErrors({});
                                            }}>New Deal group</button>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                        {/* Table */}
                        <div className="campaign-daily-table-wrapper">
                            <div className="pmp-table-shell">
                                <div className="pmp-table-inner">
                                    <DataTable
                                        className="groupsdatatable-pm"
                                        columns={currentColumns}
                                        data={currentData}
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
                                        //   onRowClicked={handleRowClicked}
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
                        {/* <div className="pmp-table-wrapper">
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
                            </div> */}
                    </div>
                    {shownewdealgroup && (
                        !isDealGroupStepTwo ? (
                            <Modal
                                isOpen={shownewdealgroup}
                                toggle={() => setShownewdealgroup(false)}
                                size="md"
                                centered
                                scrollable={true}
                                className="pmp-new-deal-modal"
                            >
                                <ModalHeader toggle={() => setShownewdealgroup(false)} className="border-bottom-0 pb-2">
                                    <h2 className="pmp-new-deal-title mb-0">New Deal Group</h2>
                                </ModalHeader>
                                <ModalBody className="pt-0 pmp-form-body-container">
                                    <div className="pmp-modal-header-stepper px-3">
                                        <div className={`pmp-step active`}>
                                            <div className="pmp-step-number">1</div>
                                            Details
                                        </div>
                                        <div className={`pmp-step`}>
                                            <div className="pmp-step-number">2</div>
                                            Deals
                                        </div>
                                    </div>
                                    <div className="pmp-form-body px-3">
                                        <div className="pmp-form-group">
                                            <label className="pmp-form-label">Deal Group Name <span className="pmp-required">*</span></label>
                                            <input
                                                type="text"
                                                id="dealGroupName"
                                                name="dealGroupName"
                                                className={`pmp-form-input ${formErrors.dealGroupName ? 'error' : ''}`}
                                                placeholder="Enter a Deal Group Name"
                                                value={dealGroupFormData.dealGroupName}
                                                onChange={handleDealGroupChange}
                                                onMouseEnter={() => formErrors.dealGroupName && setTooltipOpen(prev => ({ ...prev, dealGroupName: true }))}
                                                onMouseLeave={() => setTooltipOpen(prev => ({ ...prev, dealGroupName: false }))}
                                            />
                                            {formErrors.dealGroupName && (
                                                <Tooltip
                                                    placement="bottom"
                                                    isOpen={tooltipOpen.dealGroupName}
                                                    target="dealGroupName"
                                                    autohide={false}
                                                    container=".modal-content"
                                                    popperClassName="custom-tooltip"
                                                >
                                                    <div className="one"></div>
                                                    {formErrors.dealGroupName}
                                                </Tooltip>
                                            )}
                                        </div>

                                        <div className="pmp-form-group">
                                            <label className="pmp-form-label">Description</label>
                                            <textarea
                                                name="description"
                                                className="pmp-form-textarea"
                                                placeholder="Enter a description..."
                                                value={dealGroupFormData.description}
                                                onChange={handleDealGroupChange}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <ModalFooter className="border-top-0 pt-0 px-3">
                                        <Button color="secondary" className="pmp-btn-outline" onClick={() => setShownewdealgroup(false)}>
                                            Cancel
                                        </Button>
                                        <Button color="success" className="pmp-btn-green-next" onClick={handleDealGroupNextStep}>
                                            Next
                                        </Button>
                                    </ModalFooter>
                                </ModalBody>
                            </Modal>
                        ) : (
                            <NewDealGroupPmp
                                isOpen={shownewdealgroup}
                                toggle={() => setShownewdealgroup(false)}
                                onBack={() => setIsDealGroupStepTwo(false)}
                            />
                        )
                    )}
                </div>)}
            {!canViewUser && (
                <div className="alert alert-warning mt-3 pmp-access-denied-alert">
                    <i className="fa fa-exclamation-triangle me-2"></i>
                    <strong>Access Denied:</strong> You do not have permission to view the Private Marketplace.
                </div>
            )}
        </>

    );
};

export default PrivateMarketplace;

