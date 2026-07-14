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
} from "reactstrap";
import { FaCog, FaCaretDown } from "react-icons/fa";
import Swal from "sweetalert2";
import CategoriesModal from "./Modal/categoriesModal";
import DatePickerInput from "./Modal/DatePickerInput";
import { getAllExchange, getcountry, getAllDeals, createDeal } from "./api/Api";




const DealGroupSidebar = ({ sidebarCollapseddata, handleactiveview }) => {

    const [exchangeOptions, setExchangeOptions] = useState([]);
    const [exchangeMap, setExchangeMap] = useState({});
    const [allDeals, setAllDeals] = useState([]);
    const deviceOptions = [{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }];
    const categoryOptions = [{ value: "news", label: "News" }, { value: "sports", label: "Sports" }];
    const [countryOptions, setCountryOptions] = useState([]);
    const adSizeOptions = [
        { value: "160x600", label: "160x600" },
        { value: "970x250", label: "970x250" },
        { value: "300x600", label: "300x600" },
        { value: "320x100", label: "320x100" },
        { value: "300x50", label: "300x50" },
        { value: "300x250", label: "300x250" },
        { value: "300x200", label: "300x200" },
        { value: "300x100", label: "300x100" },
        { value: "200x200", label: "200x200" },
        { value: "320x50", label: "320x50" },
        { value: "250x250", label: "250x250" },
        { value: "400x200", label: "400x200" },
        { value: "728x90", label: "728x90" }
    ];

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
    const Loader = () => <span className="pmp-loader" />;
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const toggleModal = () => setModalOpen(!modalOpen);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
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

    const fetchExchanges = async () => {
        try {
            const response = await getAllExchange();
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
            const response = await getAllDeals();
            if (response.data && response.data.data && response.data.data.informationDeal) {
                const mappedDeals = response.data.data.informationDeal.map(deal => {
                    let exchangeName = "-";
                    if (deal.exchange) {
                        exchangeName = exchangeMap[deal.exchange] || exchangeMap[String(deal.exchange)] || deal.exchange || "-";
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

    const fetchCountries = async () => {
        try {
            const response = await getcountry();

            const countries = response?.data?.data?.informationCountries || [];

            const mappedCountries = countries
                .filter(c => c.type === "country")
                .map(c => ({
                    value: c.countryId,
                    label: c.name,
                }))
                .sort((a, b) => a.label.localeCompare(b.label));

            setCountryOptions(mappedCountries);
            console.log(mappedCountries);
        } catch (error) {
            console.error("Error fetching countries:", error);
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

    return (
        <div className={`pmp-sidebar ${sidebarCollapseddata ? "collapsed" : "open"}`}>
            <div className="pmp-sidebar-content">
                {/* Available Section */}
                <div className="pmp-section-title">Available</div>
                {[
                    { id: "curated_deals", label: "Curated Deals", count: allDeals.length },
                    { id: "my_deals", label: "My Deals", count: 0 },
                    { id: "selected", label: "selected", count: 0 }
                ].map((item) => (
                    <div
                        key={item.id}
                        className={`pmp-nav-item ${activeView === item.id ? "active" : ""}`}
                        onClick={() => {
                            setActiveView(item.id);
                            handleactiveview(item.id);
                            setLoadingMap(prev => ({ ...prev, [item.id]: true }));
                            setTimeout(() => {
                                setLoadingMap(prev => ({ ...prev, [item.id]: false }));
                            }, 1000);
                        }}
                    >
                        <span>{item.label}</span>
                        <span className="pmp-count">
                            {loadingMap[item.id] ? <Loader /> : item.count}
                        </span>
                    </div>


                ))}
                <div className="pmp-section-title">Pending</div>

                <div className="pmp-nav-item">
                    Deals
                    <span className="pmp-count">0</span>
                </div>

                <div className="pmp-nav-item">
                    Proposals
                    <span className="pmp-count">0</span>
                </div>


                {/* Pending Section */}
                <div className="pmp-section-title">filters</div>
                {(activeView === "curated_deals" || activeView === "my_deals") && (
                    <>
                        {activeView === "my_deals" && (
                            <div className="pmp-filter-group">
                                <div className="pmp-filter-label">Commitment Type</div>
                                <FilterCheckbox label="Guaranteed" />
                                <FilterCheckbox label="Non-Guaranteed" />
                            </div>
                        )}

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Exchanges</div>
                            <Select options={exchangeOptions} styles={filterSelectStyles} placeholder="Select exchanges" />
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Formats</div>
                            {["Audio", "Display", "Native", "Video"].map(label => (
                                <FilterCheckbox key={label} label={label} />
                            ))}
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Device Types</div>
                            <Select options={deviceOptions} styles={filterSelectStyles} placeholder="Select device types" />
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Inventory Types</div>
                            {["Desktop Web", "Desktop App", "Mobile Web", "Mobile App", "Digital Out of Home"].map(label => (
                                <FilterCheckbox key={label} label={label} />
                            ))}
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Categories</div>
                            <button
                                type="button"
                                className="btn btn-sm"
                                onClick={toggleModal}
                                style={{ 
                                    width: "100%", 
                                    padding: "6px 8px", 
                                    fontSize: "12px", 
                                    backgroundColor: "#f0f0f0",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    marginBottom: "8px"
                                }}
                            >
                                Select Categories
                            </button>
                            {selectedCategories.length > 0 && (
                                <div style={{ marginBottom: "8px" }}>
                                    <button
                                        type="button"
                                        className="btn btn-link p-0"
                                        onClick={() => setSelectedCategories([])}
                                        style={{ fontSize: "11px", color: "#4c9eec", textDecoration: 'none' }}
                                    >
                                        Clear All
                                    </button>
                                    <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                                        {selectedCategories.length} selected
                                    </div>
                                </div>
                            )}
                        </div>
                        <CategoriesModal modalOpen={modalOpen} toggleModal={toggleModal} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Countries</div>
                            <Select options={countryOptions} styles={filterSelectStyles} placeholder="Select Countries" />
                        </div>

                        <div className="pmp-filter-group">




                            <div className="pmp-filter-label">Min Price</div>
                            <input type="text" style={{ width: "100%", height: "30px", border: "1px solid #ccc", borderRadius: "4px", padding: "0 8px", fontSize: "12px", marginBottom: "10px" }} />
                            <div className="pmp-filter-label">Max Price</div>
                            <input type="text" style={{ width: "100%", height: "30px", border: "1px solid #ccc", borderRadius: "4px", padding: "0 8px", fontSize: "12px", marginBottom: "10px" }} />
                            <button style={{ width: "100%", padding: "6px", backgroundColor: "white", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>Apply</button>
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Ad Sizes</div>
                            <Select options={adSizeOptions} styles={filterSelectStyles} placeholder="Select Ad Sizes" />
                        </div>

                        <div className="pmp-filter-group">
                            <FilterCheckbox label="Show Archived Deals" />
                        </div>
                    </>
                )}

                {(activeView === "curated_deal_groups" || activeView === "my_deal_groups") && (
                    <div className="pmp-filter-group">
                        <FilterCheckbox label="Show Archived Deal Groups" />
                    </div>
                )}
                <div className="pmp-bottom-spacer"></div> {/* Bottom spacer */}
            </div>
        </div>
    )
}

export default DealGroupSidebar