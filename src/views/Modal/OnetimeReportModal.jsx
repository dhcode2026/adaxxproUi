import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  Spinner,
  Form,
  Tooltip
} from "reactstrap";
import { FaChevronDown, FaCalendarAlt } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import { useViewContext } from "../../ViewContext";
import DataTable from "react-data-table-component";
import { getAllCampaign, getAllReportTypes, oneTimeReportCreate } from "../api/Api";
import "../../assets/css/reports.css";

const CustomDatePickerHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(date.getMonth());
  const [tempYear, setTempYear] = useState(date.getFullYear());
  const [yearPage, setYearPage] = useState(date.getFullYear() - 4);

  const months1 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const months2 = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const leftYears = Array.from({ length: 5 }, (_, i) => yearPage + i);
  const rightYears = Array.from({ length: 5 }, (_, i) => yearPage + 5 + i);

  return (
    <div className="reports-datepicker-header">
      <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} className="reports-datepicker-nav-btn">{"<"}</button>
      <div
        className="reports-datepicker-trigger"
        onClick={() => {
          setShowPicker(!showPicker);
          setTempMonth(date.getMonth());
          setTempYear(date.getFullYear());
          setYearPage(date.getFullYear() - 4);
        }}
      >
        {date.toLocaleString('default', { month: 'short' })}
        <span className="reports-datepicker-trigger-year">{date.getFullYear()}</span>
        <FaChevronDown size={12} className="reports-datepicker-trigger-icon" />
      </div>
      <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} className="reports-datepicker-nav-btn">{">"}</button>

      {showPicker && (
        <div className="reports-datepicker-picker-panel">
          <div className="reports-datepicker-nav-row">
            <div className="reports-datepicker-year-nav">
              <span className="reports-datepicker-year-nav-btn" onClick={() => setYearPage(p => p - 10)}>{"<"}</span>
              <span className="reports-datepicker-year-nav-btn" onClick={() => setYearPage(p => p + 10)}>{">"}</span>
            </div>
          </div>

          <div className="reports-datepicker-grid">
            <div className="reports-datepicker-month-column">
              {months1.map((m, i) => (
                <div key={m} onClick={() => setTempMonth(i)} className={`reports-datepicker-option ${tempMonth === i ? "reports-datepicker-option-active" : ""}`}>{m}</div>
              ))}
            </div>
            <div className="reports-datepicker-month-column reports-datepicker-month-column-divider">
              {months2.map((m, i) => (
                <div key={m} onClick={() => setTempMonth(i + 6)} className={`reports-datepicker-option ${tempMonth === i + 6 ? "reports-datepicker-option-active" : ""}`}>{m}</div>
              ))}
            </div>
            <div className="reports-datepicker-year-column">
              {leftYears.map(y => (
                <div key={y} onClick={() => setTempYear(y)} className={`reports-datepicker-option ${tempYear === y ? "reports-datepicker-option-active" : ""}`}>{y}</div>
              ))}
            </div>
            <div className="reports-datepicker-year-column">
              {rightYears.map(y => (
                <div key={y} onClick={() => setTempYear(y)} className={`reports-datepicker-option ${tempYear === y ? "reports-datepicker-option-active" : ""}`}>{y}</div>
              ))}
            </div>
          </div>

          <div className="reports-datepicker-action-row">
            <button type="button" onClick={() => { changeMonth(tempMonth); changeYear(tempYear); setShowPicker(false); }} className="reports-datepicker-action-btn reports-datepicker-action-btn-primary">OK</button>
            <button type="button" onClick={() => setShowPicker(false)} className="reports-datepicker-action-btn">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const OnetimeReportModal = (props) => {
  const { isOpen, toggle, report: initialReport, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const context = useViewContext();
  const [step, setStep] = useState(1);
  const [focusedField, setFocusedField] = useState(null);
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    reportType: false,
    dimensions: false,
    groupBy: false,
    interval: false,
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState({
    reportType: null,
    dimensions: null,
    interval: null,
  });

  const [scopeType, setScopeType] = useState('Campaign');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(true);
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [branddata, setbranddata] = useState([]);
  const reportTypeRef = useRef(null);
  const dimensionsRef = useRef(null);
  const intervalRef = useRef(null);
  const startDateWrapperRef = useRef(null);
  const endDateWrapperRef = useRef(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const formatPayloadDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };

  const steps = [
    { number: 1, title: "Details" },
    { number: 2, title: "Scope" },
  ];

  const [reportTypeOptions, setReportTypeOptions] = useState([
    { value: "", label: "Select Report Type" },
  ]);
  const [allDimensionOptions, setAllDimensionOptions] = useState({});

  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        const response = await getAllReportTypes();
        // Handle variations in response structure
        const types =
          response?.data?.data?.informationReportType ||
          response?.data?.informationReportType ||
          response?.informationReportType ||
          [];

        const formattedOptions = types.map((type) => ({
          value: type.reporttypeId,
          label: type.name,
        }));

        const dynamicDimensions = {};
        types.forEach((type) => {
          if (type.reportDimensions && type.reportDimensions.length > 0) {
            dynamicDimensions[type.reporttypeId] = type.reportDimensions.map((dim) => ({
              value: dim.reportdimensionsId,
              label: dim.name,
            }));
          }
        });

        setReportTypeOptions([
          { value: "", label: "Select Report Type" },
          ...formattedOptions,
        ]);
        setAllDimensionOptions(dynamicDimensions);
      } catch (error) {
        console.error("Error fetching report types:", error);
      }
    };

    fetchReportTypes();
  }, []);

  const groupByOptions = [
    { value: "", label: "Select Grouping" },
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "campaign", label: "Campaign" },
  ];

  const intervalOptions = [
    { value: "", label: "Select Interval" },
    { value: "lifetime", label: "Lifetime" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const categoryOptions = [
    { value: "connected_tv", label: "Connected TV" },
    { value: "desktop", label: "Desktop" },
    { value: "phone", label: "Phone" },
    { value: "tablet", label: "Tablet" },

  ];



  const [formData, setFormData] = useState({
    id: initialReport?.id || "",
    name: initialReport?.name || "",
    reportType: initialReport?.reportType || "",
    dimensions: initialReport?.dimensions || "",
    conversionPixels: initialReport?.conversionPixels || false,
    groupBy: initialReport?.groupBy || "",
    startDate: initialReport?.startDate || "",
    endDate: initialReport?.endDate || "",
    interval: initialReport?.interval || "",
    categories: initialReport?.categories || [],
  });



  const dimensionOptions = [
    { value: "", label: "Select Dimensions" },
    ...(formData.reportType && allDimensionOptions[formData.reportType]
      ? allDimensionOptions[formData.reportType]
      : [])
  ];


  // Loading initial data for Step 2
  useEffect(() => {
    if (step === 2 && branddata.length === 0) {
      const loadInitialData = async () => {
        const res = await handleGetAllCampaign();
        setbranddata(res);
      };
      loadInitialData();
    }
  }, [step, branddata.length]);


  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: "",
        name: "",
        reportType: "",
        dimensions: "",
        conversionPixels: false,
        groupBy: "",
        startDate: "",
        endDate: "",
        interval: "",
        categories: [],
      });
      setErrors({});
      setStep(1);
      setTooltipOpen({
        name: false,
        reportType: false,
        dimensions: false,
        groupBy: false,
        interval: false,
      });
      setOpenDropdown(null);
      setHoveredDropdown({
        reportType: null,
        dimensions: null,
        interval: null,
      });
      setScopeType('Campaign');
      setSearchTerm('');
      setShowArchived(true);
      setSelectedScopes([]);
      setExpandedNodes([]);
      setbranddata([]); // Clear data on close
    }
  }, [isOpen]);


  useEffect(() => {
    if (initialReport) {
      setFormData({
        id: initialReport.id || "",
        name: initialReport.name || "",
        reportType: initialReport.reportType || "",
        dimensions: initialReport.dimensions || "",
        conversionPixels: initialReport.conversionPixels || false,
        groupBy: initialReport.groupBy || "",
        startDate: initialReport.startDate || "",
        endDate: initialReport.endDate || "",
        interval: initialReport.interval || "",
        categories: initialReport.categories || [],
      });
    } else {
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      setFormData((prev) => ({
        ...prev,
        startDate: oneWeekAgo.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        categories: [],
      }));
    }
  }, [initialReport]);

  // Handle input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCustomSelectChange = (name, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      if (name === "reportType" && prev.reportType !== value) {
        updatedData.dimensions = ""; // Reset dimensions when report type changes
      }
      return updatedData;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setHoveredDropdown((prev) => ({ ...prev, [name]: null }));
    setOpenDropdown(null);
  };

  // Handle categories
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const newCategories = checked
        ? [...prev.categories, value]
        : prev.categories.filter((cat) => cat !== value);
      return { ...prev, categories: newCategories };
    });
  };

  const handleSelectAll = () => {
    const allValues = categoryOptions.map((option) => option.value);
    setFormData((prev) => ({ ...prev, categories: allValues }));
  };

  const handleClearAll = () => {
    setFormData((prev) => ({ ...prev, categories: [] }));
  };

  // ✅ Validation
  const validateStep = async (stepNumber) => {
    const newErrors = {};
    let isValid = true;

    if (stepNumber === 1) {
      if (!formData.name?.trim()) {
        newErrors.name = "This field is required";
        isValid = false;
      }

      if (!formData.reportType) {
        newErrors.reportType = "This field is required";
        isValid = false;
      }

      if (formData.reportType && !formData.dimensions) {
        newErrors.dimensions = "This field is required";
        isValid = false;
      }

      if (formData.dimensions && !formData.startDate) {
        newErrors.startDate = "This field is required";
        isValid = false;
      }

      if (formData.dimensions && !formData.endDate) {
        newErrors.endDate = "This field is required";
        isValid = false;
      }

      if (
        formData.startDate &&
        formData.endDate &&
        formData.startDate > formData.endDate
      ) {
        newErrors.endDate = "End date cannot be before start date";
        isValid = false;
      }

      if (formData.dimensions && !formData.interval) {
        newErrors.interval = "This field is required";
        isValid = false;
      }
    }

    setErrors(newErrors);

    if (!isValid) {
      await showValidationError();
    }

    return isValid;
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const refs = [reportTypeRef.current, dimensionsRef.current, intervalRef.current];
      const clickedInside = refs.some((ref) => ref && ref.contains(event.target));

      if (!clickedInside) {
        setOpenDropdown(null);
        setHoveredDropdown({
          reportType: null,
          dimensions: null,
          interval: null,
        });
      }

      if (startDateWrapperRef.current && !startDateWrapperRef.current.contains(event.target)) {
        setShowStartDatePicker(false);
      }
      if (endDateWrapperRef.current && !endDateWrapperRef.current.contains(event.target)) {
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const renderCustomSelect = ({
    id,
    label,
    required = false,
    value,
    placeholder,
    options,
    disabled = false,
    error,
    wrapperRef,
    tooltipKey,
    disabledOptions = [],
  }) => {
    const selectedOption = options.find((option) => option.value === value);
    const displayLabel = selectedOption?.label || placeholder;
    const isOpen = openDropdown === id;
    const hoveredValue = hoveredDropdown[id];

    return (
      <FormGroup>
        <Label for={id}>
          {label} {required && <span className="text-danger">*</span>}
        </Label>
        <div ref={wrapperRef} className="reports-custom-select-wrapper">
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={!!error}
            onClick={() => {
              if (!disabled) {
                if (isOpen) {
                  setHoveredDropdown((prev) => ({ ...prev, [id]: null }));
                  setOpenDropdown(null);
                } else {
                  setHoveredDropdown({
                    reportType: null,
                    dimensions: null,
                    interval: null,
                  });
                  setOpenDropdown(id);
                }
              }
            }}
            onMouseEnter={() => error && setTooltipOpen((t) => ({ ...t, [tooltipKey]: true }))}
            onMouseLeave={() => setTooltipOpen((t) => ({ ...t, [tooltipKey]: false }))}
            className={`reports-custom-select-trigger ${error ? "reports-custom-select-trigger-error" : ""} ${disabled ? "reports-custom-select-trigger-disabled" : ""}`}
          >
            <span className={`reports-custom-select-label ${value ? "has-value" : ""}`}>
              {displayLabel}
            </span>
            <FaChevronDown className={`reports-custom-select-chevron ${isOpen ? "is-open" : ""}`} />
          </button>

          {error && (
            <Tooltip
              placement="bottom"
              isOpen={tooltipOpen[tooltipKey]}
              target={id}
              autohide={false}
              container=".modal-content"
              popperClassName="custom-tooltip"
            >
              <div className="one"></div>
              {error}
            </Tooltip>
          )}

          {isOpen && (
            <div className="custom-dropdown-menu biddeript-b reports-custom-select-menu">
              {options.map((option) => {
                const isSelected = value === option.value;
                const isHovered = hoveredValue === option.value;
                const isOptionDisabled = disabledOptions.map(String).includes(String(option.value));

                return (
                  <div
                    key={`${id}-${option.value || "empty"}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!isOptionDisabled) handleCustomSelectChange(id, option.value);
                    }}
                    onMouseEnter={() => {
                      if (!isOptionDisabled) setHoveredDropdown((prev) => ({ ...prev, [id]: option.value }));
                    }}
                    onMouseLeave={() => {
                      if (!isOptionDisabled) setHoveredDropdown((prev) => ({ ...prev, [id]: null }));
                    }}
                    className={`reports-custom-select-option ${isSelected ? "selected" : ""} ${isOptionDisabled ? "disabled" : ""} ${isHovered ? "hovered" : ""}`}
                  >
                    <span className="reports-custom-select-tick">
                      {isSelected || isHovered ? "✓" : ""}
                    </span>
                    <span className="reports-custom-select-option-label">
                      {option.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FormGroup>
    );
  };

  // ✅ Fixed: Await async validation
  const handleNext = async () => {
    const isValid = await validateStep(1);
    if (isValid) setStep(2);
  };

  const handleBack = () => setStep(1);

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
      customClass: {
        popup: "swal2-custom-size",
        confirmButton: "swal2-small-btn",
      },
    });
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = await validateStep(1);
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: initialReport?.id
        ? "Do you want to update this report?"
        : "Do you want to create this report?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: initialReport?.id ? "Yes, update it!" : "Yes, create it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const reportData = {
        conversionPixels: formData.conversionPixels || false,
        dimensionsId: formData.dimensions ? String(formData.dimensions) : "",
        endDate: formData.endDate,
        interval: formData.interval,
        name: formData.name,
        reportTypeId: formData.reportType ? String(formData.reportType) : "",
        scopeType: scopeType,
        scopes: selectedScopes,
        startDate: formData.startDate,
      };

      if (initialReport?.id) {
        reportData.id = initialReport.id;
        // TODO: Handle update API if needed
      } else {
        await oneTimeReportCreate(reportData);
      }

      if (typeof callback === "function") callback(reportData);

      const successResult = await Swal.fire(
        "Success!",
        initialReport?.id ? "Report has been updated." : "Report has been created.",
        "success"
      );

      if (successResult.isConfirmed) toggle();
    } catch (error) {
      Swal.fire("Error!", "Something went wrong.", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAllCampaign = async () => {
    try {
      const response = await getAllCampaign();
      const campaigns =
        response?.data?.data ||
        response?.data ||
        [];

      const uniqueCampaigns = Array.from(new Map(campaigns.map(c => [c.campaignId, c])).values());

      const mapped = uniqueCampaigns.map(c => ({
        id: c.campaignId,
        treeId: `campaign-${c.campaignId}`,
        name: c.name ?? "Unnamed Campaign",
        isArchived: c.status?.toLowerCase() === 'offline'
      }));

      return mapped;
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return [];
    }
  };

  const BrandIcon = ({ isSelected }) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className="me-2"
      fill={isSelected ? "#fff" : "#a5abb3"}
    >
      <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.47l7-3.11v8.63z" />
    </svg>
  );
  const GroupIcon = ({ isSelected }) => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className="me-2"
      fill={isSelected ? "#fff" : "#a5abb3"}
    >
      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  );

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      size="lg"
      backdrop="static"
      id="onetimemodal"
      keyboard={false}

    >
      <div className="modal-header border-bottom">
        <Row className="w-100 align-items-center m-0">
          <Col md="6">
            <h5 className="modal-title mb-0">
              {initialReport?.id ? "Edit One-Time Report" : "New One-Time Report"}
            </h5>
          </Col>
          <Col md="6" className="text-end">
            <Button close onClick={toggle}></Button>
          </Col>
        </Row>
      </div>

      {/* Stepper */}
      <div className="onetimestepper">
        {steps.map((stepItem) => (
          <div
            key={stepItem.number}
            className={`step ${step === stepItem.number ? "active" : ""} ${step > stepItem.number ? "completed" : ""
              }`}
          >
            <div className="stepnumbers">
              <div className="step-number">{stepItem.number}</div>
              <div className="step-title">{stepItem.title}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <Form onSubmit={handleSubmit} noValidate autocomplete="off">
        <ModalBody className="pt-3 modal-body-scroll">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" className="reports-spinner" />
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <>
              <Row>
                <Col md="10">
                  <FormGroup>
                    <Label for="name">Name <span className="text-danger">*</span></Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      onFocus={() => handleFocus('name')}
                      onBlur={handleBlur}
                      invalid={!!errors.name}
                      onMouseEnter={() => errors.name && setTooltipOpen((t) => ({ ...t, name: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, name: false }))}
                      className="formscontrol reports-modal-input"
                    />
                    {errors.name && (

                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.name}
                        target="name"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                      >
                        <div className="one"></div>
                        {errors.name}
                      </Tooltip>

                    )}
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md="10">
                  {renderCustomSelect({
                    id: "reportType",
                    label: "Report Type",
                    required: true,
                    value: formData.reportType || "",
                    placeholder: "Select Report Type",
                    options: reportTypeOptions,
                    disabledOptions: [2, 3, 4, 5, 6, 7, 8],
                    error: errors.reportType,
                    wrapperRef: reportTypeRef,
                    tooltipKey: "reportType",
                  })}
                </Col>
              </Row>

              <Row className={!formData.reportType ? "disabling" : ""}>
                <Col md="10">
                  {renderCustomSelect({
                    id: "dimensions",
                    label: "Dimensions",
                    required: true,
                    value: formData.dimensions || "",
                    placeholder: "Select Dimensions",
                    options: dimensionOptions,
                    disabled: !formData.reportType,
                    disabledOptions: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
                    error: errors.dimensions,
                    wrapperRef: dimensionsRef,
                    tooltipKey: "dimensions",
                  })}
                </Col>
              </Row>

              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="10">
                  <FormGroup check>
                    <Input
                      type="checkbox"
                      id="conversionPixels"
                      name="conversionPixels"
                      checked={formData.conversionPixels || false}
                      onChange={handleChange}
                      disabled={!formData.dimensions}
                    />
                    <Label className="mt-0" for="conversionPixels">Report on conversion pixels</Label>
                  </FormGroup>
                </Col>
              </Row>
              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="5">
                  <FormGroup>
                    <Label for="startDate">Start Date <span className="text-danger">*</span></Label>
                    <div className="reports-date-input-wrapper" ref={startDateWrapperRef}>
                      <Input
                        type="text"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate || ""}
                        readOnly
                        onClick={() => {
                          if (formData.dimensions) setShowStartDatePicker(!showStartDatePicker);
                        }}
                        invalid={!!errors.startDate}
                        className={`formscontrol reports-date-input ${!formData.dimensions ? "reports-date-input-disabled" : ""}`}
                        disabled={!formData.dimensions}
                      />
                      <FaCalendarAlt
                        className={`reports-date-icon ${!formData.dimensions ? "reports-date-icon-disabled" : ""}`}
                        onClick={() => {
                          if (formData.dimensions) setShowStartDatePicker(!showStartDatePicker);
                        }}
                      />
                      {showStartDatePicker && (
                        <div className="reports-date-picker-panel reports-date-picker-panel-start">
                          <DatePicker
                            selected={parseLocalDate(formData.startDate)}
                            onChange={(date) => {
                              setFormData(prev => ({ ...prev, startDate: formatPayloadDate(date) }));
                              setShowStartDatePicker(false);
                            }}
                            inline
                            renderCustomHeader={(props) => <CustomDatePickerHeader {...props} />}
                          >
                            <div className="reports-date-picker-footer">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, startDate: formatPayloadDate(new Date()) }));
                                  setShowStartDatePicker(false);
                                }}
                                className="reports-date-picker-today-btn"
                              >
                                Today
                              </button>
                            </div>
                          </DatePicker>
                        </div>
                      )}
                    </div>
                  </FormGroup>
                </Col>
                <Col md="5">
                  <FormGroup>
                    <Label for="endDate">End Date <span className="text-danger">*</span></Label>
                    <div className="reports-date-input-wrapper" ref={endDateWrapperRef}>
                      <Input
                        type="text"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate || ""}
                        readOnly
                        onClick={() => {
                          if (formData.dimensions) setShowEndDatePicker(!showEndDatePicker);
                        }}
                        invalid={!!errors.endDate}
                        className={`formscontrol reports-date-input ${!formData.dimensions ? "reports-date-input-disabled" : ""}`}
                        disabled={!formData.dimensions}
                      />
                      <FaCalendarAlt
                        className={`reports-date-icon ${!formData.dimensions ? "reports-date-icon-disabled" : ""}`}
                        onClick={() => {
                          if (formData.dimensions) setShowEndDatePicker(!showEndDatePicker);
                        }}
                      />
                      {showEndDatePicker && (
                        <div className="reports-date-picker-panel reports-date-picker-panel-end">
                          <DatePicker
                            selected={parseLocalDate(formData.endDate)}
                            onChange={(date) => {
                              setFormData(prev => ({ ...prev, endDate: formatPayloadDate(date) }));
                              setShowEndDatePicker(false);
                            }}
                            inline
                            renderCustomHeader={(props) => <CustomDatePickerHeader {...props} />}
                          >
                            <div className="reports-date-picker-footer">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData(prev => ({ ...prev, endDate: formatPayloadDate(new Date()) }));
                                  setShowEndDatePicker(false);
                                }}
                                className="reports-date-picker-today-btn"
                              >
                                Today
                              </button>
                            </div>
                          </DatePicker>
                        </div>
                      )}
                    </div>
                  </FormGroup>
                </Col>
              </Row>

              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="10">
                  {renderCustomSelect({
                    id: "interval",
                    label: "Interval",
                    required: true,
                    value: formData.interval || "",
                    placeholder: "Select Interval",
                    options: intervalOptions,
                    disabled: !formData.dimensions,
                    error: errors.interval,
                    wrapperRef: intervalRef,
                    tooltipKey: "interval",
                  })}
                </Col>
              </Row>
            </>
          )}

          {/* Step 2: Scope */}
          {step === 2 && (() => {
            const flattenData = (data, level = 0, parentVisible = true) => {
              let result = [];

              data.forEach((node, idx) => {
                const nodeIdStr = String(node.treeId || `node-${node.id}`);
                const hasChildren = node.details && node.details.length > 0;

                const matchesSearch = searchTerm
                  ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  String(node.id).includes(searchTerm)
                  : true;

                const matchesArchived = showArchived ? true : !node.isArchived;

                const shouldShowNode = parentVisible && matchesArchived && (matchesSearch || searchTerm === "");

                const isExpanded = expandedNodes.includes(nodeIdStr);

                if (shouldShowNode) {
                  result.push({
                    ...node,
                    level,
                    isLast: idx === data.length - 1,
                    hasChildren,
                    isExpanded
                  });

                  // 🔥 ONLY show children if explicitly expanded
                  if (hasChildren && isExpanded) {
                    result = result.concat(
                      flattenData(node.details, level + 1, true)
                    );
                  }
                }
              });

              return result;
            };

            const scopesToFilter = branddata.map(item => ({ ...item, isLast: false, level: 0, hasChildren: false, isExpanded: false }));

            const finalDisplayData = scopesToFilter.filter(item => {
              const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(item.id).includes(searchTerm);
              const matchesArchived = showArchived ? true : !item.isArchived;
              return matchesSearch && matchesArchived;
            });

            const allSelected = finalDisplayData.length > 0 && selectedScopes.length === finalDisplayData.length;
            const columns = [
              {
                name: "Name",
                selector: row => row.name,
                sortable: true,
                grow: 2,
                cell: (row, index) => {
                  const isLast = index === finalDisplayData.length - 1;
                  const isSelected = selectedScopes.includes(row.id);
                  const level = 0;

                  return (
                    <div
                      className={`tree-item ${isLast ? 'last-item' : ''} d-flex align-items-center w-100 reports-tree-item`}
                      style={{ "--tree-level": `${level * 24}px` }}
                    >
                      <div className="tree-line-connector"></div>
                      <Input
                        type="checkbox"
                        className="shadow-none m-0 me-2 custom-cb"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedScopes(prev =>
                            prev.includes(row.id)
                              ? prev.filter(id => id !== row.id)
                              : [...prev, row.id]
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <BrandIcon isSelected={isSelected} />
                      <span className={isSelected ? "text-white" : "text-dark"}>{row.name}</span>
                    </div>
                  );
                },
              },
              {
                name: "ID",
                selector: row => row.id,
                sortable: true,
                cell: row => {
                  const isSelected = selectedScopes.includes(row.id);
                  return (
                    <span className={`reports-scope-id ${isSelected ? "text-white w-100" : "text-dark w-100"}`}>
                      {row.id}
                    </span>
                  );
                },
              }
            ];

            const customStyles = {
              table: {
                style: {
                  backgroundColor: '#fff',
                },
              },
              headRow: {
                style: {
                  minHeight: '20px',
                  backgroundColor: '#fff',
                  borderBottom: '1px solid #dee2e6',
                },
              },
              headCells: {
                style: {
                  fontSize: '11px',
                  fontWeight: '500',
                  color: '#6c757d',
                  borderRight: '1px solid #dee2e6',
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
                  fontSize: '11px',
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  borderRight: 'none',
                  '&:first-of-type': {
                    paddingLeft: '16px',
                  },
                  '&:last-of-type': {
                    borderRight: 'none',
                  },
                },
              },
              rows: {
                style: {
                  minHeight: '20px !important',
                  borderBottom: 'none !important',
                  '&:not(:last-of-type)': {
                    borderBottom: 'none !important',
                  },
                },
              },
            };

            const conditionalRowStyles = [
              {
                when: row => selectedScopes.includes(row.id),
                style: {
                  backgroundColor: '#62903e',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#62903e',
                  },
                },
              },
            ];

            return (
              <div className="scope-step">

                <div className="selection-header gap-2">
                  <span className="selection-label reports-selection-label">Select</span>
                  <div className="select-wrapper">
                    <span className="reports-selection-scope-name">Campaigns</span>
                  </div>


                  <div className="">
                    <Input
                      type="text"
                      placeholder="Search..."
                      bsSize="sm"
                      className="reports-search-input reports-search-input-modal"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>


                  <FormGroup check className="show-archived-toggle">
                    <Input
                      type="checkbox"
                      id="showArchived"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      className="show-archived-checkbox"
                    />
                    <Label
                      for="showArchived"
                      check
                      className="show-archived-label"
                    >
                      Show Archived
                    </Label>
                  </FormGroup>


                  <Button
                    outline
                    color="secondary"
                    size="sm"
                    className="custom-input"
                    onClick={() => {
                      if (allSelected) {
                        setSelectedScopes([]);
                      } else {
                        setSelectedScopes(finalDisplayData.map(item => item.id));
                      }
                    }}
                  >
                    Select All
                  </Button>
                </div>


                <div className="selection-table-container border rounded-1">
                  <DataTable
                    columns={columns}
                    data={finalDisplayData}
                    keyField="treeId"
                    customStyles={customStyles}
                    conditionalRowStyles={conditionalRowStyles}
                    noDataComponent={
                      <div className="reports-empty-state">
                        No items found.
                      </div>
                    }
                    dense
                    className="custom-tree-table"
                    onRowClicked={(row) => {
                      setSelectedScopes(prev =>
                        prev.includes(row.id)
                          ? prev.filter(id => id !== row.id)
                          : [...prev, row.id]
                      );
                    }}
                    pointerOnHover
                  />
                </div>

                <div className="reports-selection-summary">
                  <strong>{scopeType}s Selected: {selectedScopes.length}</strong>
                </div>
              </div>
            );
          })()}
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle}>
            Cancel
          </Button>

          {step === 1 ? (
            <Button color="success" className="savebuttons" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <>
              <Button className="cancels me-2" onClick={handleBack}>
                Back
              </Button>
              <Button
                color="success"
                className="savebuttons"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : initialReport?.id ? "Update Report" : "Create Report"}
              </Button>
            </>
          )}
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default OnetimeReportModal;