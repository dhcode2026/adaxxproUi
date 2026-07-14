import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Tooltip,
    Input,
} from "reactstrap";
import { FaCog, FaCaretDown } from "react-icons/fa";
import Swal from "sweetalert2";
import CategoriesModal from "./Modal/categoriesModal";
import DatePickerInput from "./Modal/DatePickerInput";
import { getAllExchange, getcountry } from "./api/Api";
import "../assets/css/pmpsidebar.css";

const FilterSelect = ({ options, placeholder, value, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const wrapperRef = useRef(null);
    const portalRef = useRef(null);

    const selectedOption = options.find((option) => option.value === value) || null;

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            const clickedInsideWrapper = wrapperRef.current?.contains(event.target);
            const clickedInsidePortal = portalRef.current?.contains(event.target);
            if (!clickedInsideWrapper && !clickedInsidePortal) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleOpen = () => {
        if (!isOpen) {
            const rect = wrapperRef.current?.getBoundingClientRect();
            setDropdownPosition({
                top: rect ? rect.bottom + window.scrollY + 4 : 0,
                left: rect ? rect.left + window.scrollX : 0,
            });
        }
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="pmp-filter-dropdown-wrapper" ref={wrapperRef}>
            <div className="pmp-filter-select-control">
                <Input
                    readOnly
                    value={selectedOption ? selectedOption.label : placeholder}
                    className={`pmp-filter-select-input ${isOpen ? "open" : ""}`}
                    onClick={toggleOpen}
                    tabIndex={0}
                />
                <FaCaretDown className={`pmp-filter-select-icon ${isOpen ? "open" : ""}`} />
            </div>
            {isOpen && typeof document !== "undefined" && ReactDOM.createPortal(
                <div
                    ref={portalRef}
                    className="pmp-dropdown-portal"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                    }}
                >
                    {options.map((option) => {
                        const isSelected = selectedOption?.value === option.value;
                        return (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onSelect(option);
                                    setIsOpen(false);
                                }}
                                className={`pmp-dropdown-option ${isSelected ? "selected" : ""}`}
                            >
                                <span className="pmp-dropdown-tick">{isSelected ? "✓" : ""}</span>
                                <span>{option.label}</span>
                            </div>
                        );
                    })}
                </div>,
                document.body,
            )}
        </div>
    );
};

const Pmpsidebar = ({ sidebarCollapseddata, handleactiveview, curatedDealsCount = 0 }) => {

    const [exchangeOptions, setExchangeOptions] = useState([]);
    const [exchangeMap, setExchangeMap] = useState({});
    const deviceOptions = [{ value: "desktop", label: "Desktop" }, { value: "mobile", label: "Mobile" }];
    const [countryOptions, setCountryOptions] = useState([]);
    const [selectedExchange, setSelectedExchange] = useState("");
    const [selectedDeviceType, setSelectedDeviceType] = useState("");
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedAdSize, setSelectedAdSize] = useState("");
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

    const handleRemoveCategory = (parentName) => {
        setSelectedCategories((prev) =>
            prev.filter((item) => item.parent !== parentName)
        );
    };

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
                });
                setExchangeMap(map);
            }
        } catch (error) {
            console.error("Error fetching exchanges:", error);
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
                <div className={`pmp-checkbox-box ${checkboxValue ? "checked" : ""}`}>
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
                    { id: "curated_deals", label: "Curated Deals", count: curatedDealsCount },
                    { id: "curated_deal_groups", label: "Curated Deal Groups", count: 30 },
                    { id: "my_deals", label: "My Deals", count: 0 },
                    { id: "my_deal_groups", label: "My Deal Groups", count: 0 }
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
                            <FilterSelect
                                options={exchangeOptions}
                                placeholder="Select exchanges"
                                value={selectedExchange}
                                onSelect={(option) => setSelectedExchange(option.value)}
                            />
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Formats</div>
                            {["Audio", "Display", "Native", "Video"].map(label => (
                                <FilterCheckbox key={label} label={label} />
                            ))}
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Device Types</div>
                            <FilterSelect
                                options={deviceOptions}
                                placeholder="Select device types"
                                value={selectedDeviceType}
                                onSelect={(option) => setSelectedDeviceType(option.value)}
                            />
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
                                className="btn btn-sm pmp-category-select-btn"
                                onClick={toggleModal}
                            >
                                Select Categories
                            </button>
                            {selectedCategories.length > 0 && (
                                <div className="pmp-category-summary">
                                    <button
                                        type="button"
                                        className="btn btn-link p-0 pmp-clear-categories-btn"
                                        onClick={() => setSelectedCategories([])}
                                    >
                                        Clear All
                                    </button>
                                    <div className="pmp-category-count">
                                        {selectedCategories.length} selected
                                    </div>
                                </div>
                            )}
                        </div>
                         <CategoriesModal modalOpen={modalOpen} toggleModal={toggleModal} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Countries</div>
                            <FilterSelect
                                options={countryOptions}
                                placeholder="Select Countries"
                                value={selectedCountry}
                                onSelect={(option) => setSelectedCountry(option.value)}
                            />
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Min Price</div>
                            <input type="text" className="pmp-price-input" />
                            <div className="pmp-filter-label">Max Price</div>
                            <input type="text" className="pmp-price-input" />
                            <button className="pmp-price-apply-btn">Apply</button>
                        </div>

                        <div className="pmp-filter-group">
                            <div className="pmp-filter-label">Ad Sizes</div>
                            <FilterSelect
                                options={adSizeOptions}
                                placeholder="Select Ad Sizes"
                                value={selectedAdSize}
                                onSelect={(option) => setSelectedAdSize(option.value)}
                            />
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

export default Pmpsidebar