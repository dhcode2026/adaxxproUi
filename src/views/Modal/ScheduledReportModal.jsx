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
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import DataTable from "react-data-table-component";
import { getAllCampaign, getAllReportTypes, createScheduleReport } from "../api/Api";

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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: '10px' }}>
      <button type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{"<"}</button>
      <div
        onClick={() => {
          setShowPicker(!showPicker);
          setTempMonth(date.getMonth());
          setTempYear(date.getFullYear());
          setYearPage(date.getFullYear() - 4);
        }}
        style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: '#333' }}
      >
        {date.toLocaleString('default', { month: 'short' })} <span style={{ color: '#888' }}>{date.getFullYear()}</span> <FaChevronDown size={12} style={{ marginLeft: '6px', color: '#888' }} />
      </div>
      <button type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{">"}</button>

      {showPicker && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '300px',
          backgroundColor: '#fff', color: '#333', zIndex: 10, padding: '15px 10px',
          borderRadius: '4px',
          display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '20px', width: '50%', justifyContent: 'center' }}>
              <span style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0 10px', fontSize: '18px' }} onClick={() => setYearPage(p => p - 10)}>{"<"}</span>
              <span style={{ cursor: 'pointer', fontWeight: 'bold', padding: '0 10px', fontSize: '18px' }} onClick={() => setYearPage(p => p + 10)}>{">"}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, fontSize: '14px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              {months1.map((m, i) => (
                <div key={m} onClick={() => setTempMonth(i)} style={{ cursor: 'pointer', padding: '4px 8px', backgroundColor: tempMonth === i ? '#4dabf5' : 'transparent', color: tempMonth === i ? '#fff' : '#333', borderRadius: '2px' }}>{m}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderRight: '1px solid #eee', paddingRight: '10px', textAlign: 'left' }}>
              {months2.map((m, i) => (
                <div key={m} onClick={() => setTempMonth(i + 6)} style={{ cursor: 'pointer', padding: '4px 8px', backgroundColor: tempMonth === i + 6 ? '#4dabf5' : 'transparent', color: tempMonth === i + 6 ? '#fff' : '#333', borderRadius: '2px' }}>{m}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px', textAlign: 'center' }}>
              {leftYears.map(y => (
                <div key={y} onClick={() => setTempYear(y)} style={{ cursor: 'pointer', padding: '4px 8px', backgroundColor: tempYear === y ? '#4dabf5' : 'transparent', color: tempYear === y ? '#fff' : '#333', borderRadius: '2px' }}>{y}</div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
              {rightYears.map(y => (
                <div key={y} onClick={() => setTempYear(y)} style={{ cursor: 'pointer', padding: '4px 8px', backgroundColor: tempYear === y ? '#4dabf5' : 'transparent', color: tempYear === y ? '#fff' : '#333', borderRadius: '2px' }}>{y}</div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '15px' }}>
            <button type="button" onClick={() => { changeMonth(tempMonth); changeYear(tempYear); setShowPicker(false); }} style={{ background: 'none', border: 'none', color: '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>OK</button>
            <button type="button" onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', color: '#333', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ScheduledReportModal = (props) => {
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
    startDate: false,
    endDate: false,
    interval: false,
    duartion: false,
    repeats: false,
    starttime: false,
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hoveredDropdown, setHoveredDropdown] = useState({
    reportType: null,
    dimensions: null,
    interval: null,
    duartion: null,
    repeats: null,
    starttime: null,
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
  const durationRef = useRef(null);
  const repeatsRef = useRef(null);
  const starttimeRef = useRef(null);
  const startDateWrapperRef = useRef(null);
  const endDateWrapperRef = useRef(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [reportTypeOptions, setReportTypeOptions] = useState([
    { value: "", label: "Select Report Type" },
  ]);
  const [allDimensionOptions, setAllDimensionOptions] = useState({});

  useEffect(() => {
    const fetchReportTypes = async () => {
      try {
        const response = await getAllReportTypes();
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

  useEffect(() => {
    if (step === 2 && branddata.length === 0) {
      const loadInitialData = async () => {
        const res = await handleGetAllCampaign();
        setbranddata(res);
      };
      loadInitialData();
    }
  }, [step, branddata.length]);

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
        duartion: "",
        repeats: "",
        starttime: "",
        send_download: "",
      });
      setErrors({});
      setStep(1);
      setIsLoading(false);
      setOpenDropdown(null);
      setHoveredDropdown({
        reportType: null,
        dimensions: null,
        interval: null,
        duartion: null,
        repeats: null,
        starttime: null,
      });
      setScopeType('Campaign');
      setSearchTerm('');
      setShowArchived(true);
      setSelectedScopes([]);
      setExpandedNodes([]);
      setbranddata([]);
    }
  }, [isOpen]);





  const repeatsOptions = [
    { value: "", label: "Select Repeats" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },

  ];
  const starttimeOptions = [
    { value: "", label: "Select Start Time" },
    { value: "8:00 AM", label: "8:00 AM" },
    { value: "9:00 AM", label: "9:00 AM" },
    { value: "10:00 AM", label: "10:00 AM" },
    { value: "11:00 AM", label: "11:00 AM" },
    { value: "12:00 AM", label: "12:00 AM" },
    { value: "1:00 PM", label: "1:00 PM" },
    { value: "2:00 PM", label: "2:00 PM" },
    { value: "3:00 PM", label: "3:00 PM" },

  ];

  const intervalOptions = [
    { value: "", label: "Select Interval" },
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
  const duartionOptions = [
    { value: "", label: "Select Duartion" },
    { value: "Previous day", label: "Previous day" },
    { value: "Previous week", label: "Previous week" },
    { value: "Previous month", label: "Previous month" },
    { value: "Last 7 days", label: "Last 7 days" },
    { value: "Last 14 days", label: "Last 14 days" },
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCustomSelectChange = (fieldName, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [fieldName]: value };
      if (fieldName === "reportType" && prev.reportType !== value) {
        updatedData.dimensions = ""; // Reset dimensions when report type changes
      }
      return updatedData;
    });
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    setHoveredDropdown((prev) => ({ ...prev, [fieldName]: null }));
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const refs = [
        reportTypeRef.current,
        dimensionsRef.current,
        intervalRef.current,
        durationRef.current,
        repeatsRef.current,
        starttimeRef.current,
      ];

      const clickedInside = refs.some((ref) => ref && ref.contains(event.target));
      if (!clickedInside) {
        setOpenDropdown(null);
        setHoveredDropdown({
          reportType: null,
          dimensions: null,
          interval: null,
          duartion: null,
          repeats: null,
          starttime: null,
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
    fieldName,
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
    const isOpen = openDropdown === fieldName;
    const hoveredValue = hoveredDropdown[fieldName];

    return (
      <FormGroup>
        <Label for={id}>
          {label} {required && <span className="text-danger">*</span>}
        </Label>
        <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={!!error}
            onClick={() => {
              if (disabled) return;
              if (isOpen) {
                setHoveredDropdown((prev) => ({ ...prev, [fieldName]: null }));
                setOpenDropdown(null);
              } else {
                setHoveredDropdown({
                  reportType: null,
                  dimensions: null,
                  interval: null,
                  duartion: null,
                  repeats: null,
                  starttime: null,
                });
                setOpenDropdown(fieldName);
              }
            }}
            onMouseEnter={() => error && setTooltipOpen((t) => ({ ...t, [tooltipKey]: true }))}
            onMouseLeave={() => setTooltipOpen((t) => ({ ...t, [tooltipKey]: false }))}
            style={{
              width: "100%",
              minHeight: "30px",
              height: "30px",
              borderRadius: "6px",
              padding: "0 12px",
              border: `1px solid ${error ? "#dc2626" : "#e2e8f0"}`,
              backgroundColor: disabled ? "#f8fafc" : "#fff",
              color: disabled ? "#94a3b8" : "#1e293b",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              cursor: disabled ? "not-allowed" : "pointer",
              outline: "none",
              boxShadow: "none",
            }}
          >
            <span
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: value ? "#1e293b" : "#64748b",
              }}
            >
              {displayLabel}
            </span>
            <FaChevronDown
              style={{
                flex: "0 0 auto",
                fontSize: "12px",
                color: "#64748b",
                pointerEvents: "none",
                transition: "transform 0.2s ease",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
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
            <div
              className="custom-dropdown-menu biddeript-b"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                zIndex: 9999,
                minWidth: "100%",
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
                overflow: "hidden",
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {options.map((option) => {
                const isSelected = value === option.value;
                const isHovered = hoveredValue === option.value;
                const isOptionDisabled = disabledOptions.map(String).includes(String(option.value));

                return (
                  <div
                    key={`${fieldName}-${option.value || "empty"}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!isOptionDisabled) handleCustomSelectChange(fieldName, option.value);
                    }}
                    onMouseEnter={() => {
                      if (!isOptionDisabled) setHoveredDropdown((prev) => ({ ...prev, [fieldName]: option.value }));
                    }}
                    onMouseLeave={() => {
                      if (!isOptionDisabled) setHoveredDropdown((prev) => ({ ...prev, [fieldName]: null }));
                    }}
                    className={`custom-dropdown-option ${isSelected ? "selected" : ""} ${isOptionDisabled ? "disabled" : ""}`}
                    style={{
                      height: "40px",
                      padding: "0 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: isOptionDisabled ? "not-allowed" : "pointer",
                      backgroundColor: isSelected || isHovered ? "#e53e3e" : "transparent",
                      boxSizing: "border-box",
                      opacity: isOptionDisabled ? 0.5 : 1,
                    }}
                  >
                    <span
                      className="tick-icon"
                      style={{
                        minWidth: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSelected || isHovered ? "#ffffff" : "transparent",
                        fontSize: "18px",
                        fontWeight: "700",
                      }}
                    >
                      {isSelected || isHovered ? "\u2713" : ""}
                    </span>
                    <span
                      style={{
                        color: isSelected || isHovered ? "#ffffff" : "#64748b",
                        fontWeight: isSelected || isHovered ? "600" : "500",
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
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

      if (formData.dimensions && !formData.interval) {
        newErrors.interval = "This field is required";
        isValid = false;
      }
      if (formData.dimensions && !formData.duartion) {
        newErrors.duartion = "This field is required";
        isValid = false;
      }
      if (formData.dimensions && !formData.repeats) {
        newErrors.repeats = "This field is required";
        isValid = false;
      }

      if (formData.dimensions && !formData.starttime) {
        newErrors.starttime = "This field is required";
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

  const formatTime = (timeStr) => {
    if (!timeStr) return "00:00";
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const mapRepeatType = (rt) => {
    if (rt === "dayily") return "Daily";
    if (rt === "weekily") return "Weekly";
    if (rt === "monthily") return "Monthly";
    return rt;
  };

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
      const payload = {
        name: formData.name,
        reportType: parseInt(formData.reportType, 10) || 1,
        dimension: parseInt(formData.dimensions, 10) || 2,
        duration: formData.duartion,
        repeatType: mapRepeatType(formData.repeats),
        startDate: formData.startDate,
        startTime: formatTime(formData.starttime),
        endDate: formData.endDate,
        status: "ACTIVE",
        campaignIds: selectedScopes,
        emails: formData.send_download,
        createdAt: new Date().toISOString().substring(0, 19)
      };

      await delay(1000);

      await createScheduleReport(payload);

      if (typeof callback === "function") callback(payload);

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
              {initialReport?.id ? "Edit Scheduled Report" : "New Scheduled Report"}
            </h5>
          </Col>
          <Col md="6" className="text-end">
            <Button close onClick={toggle}></Button>
          </Col>
        </Row>
      </div>

      {/* Stepper */}
      <div className="onetimestepper">
        {[{ number: 1, title: "Details" }, { number: 2, title: "Scope" }].map((s) => (
          <div
            key={s.number}
            className={`step ${step === s.number ? "active" : ""} ${step > s.number ? "completed" : ""
              }`}
          >
            <div className="stepnumbers">
              <div className="step-number">{s.number}</div>
              <div className="step-title">{s.title}</div>
            </div>
          </div>
        ))}
      </div>

      <Form onSubmit={handleSubmit} noValidate autocomplete="off">
        <ModalBody className="pt-3 modal-body-scroll">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <>
              <span className="properties">Report Properties</span>
              <Col md="10">
                <FormGroup className="mt-2">
                  <Label for="name">Name <span className="text-danger">*</span>

                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}

                    invalid={!!errors.name}
                    className="formscontrol"
                    onMouseEnter={() => errors.name && setTooltipOpen((t) => ({ ...t, name: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, name: false }))}
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

              <Col md="10">
                {renderCustomSelect({
                  id: "reportType",
                  fieldName: "reportType",
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

              <Row className={!formData.reportType ? "disabling" : ""}>
                <Col md="10">
                  {renderCustomSelect({
                    id: "dimensions",
                    fieldName: "dimensions",
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
                <Col md="12">
                  <FormGroup check>
                    <Input
                      type="checkbox"
                      id="conversionPixels"
                      name="conversionPixels"
                      checked={formData.conversionPixels || false}
                      onChange={handleChange}
                      disabled={!formData.dimensions}
                    />
                    <Label for="conversionPixels">Report on conversion pixels</Label>
                  </FormGroup>
                </Col>
              </Row>

              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="10">
                  {renderCustomSelect({
                    id: "interval",
                    fieldName: "interval",
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

              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="10">
                  {renderCustomSelect({
                    id: "duration",
                    fieldName: "duartion",
                    label: "Duration",
                    required: true,
                    value: formData.duartion || "",
                    placeholder: "Select Duartion",
                    options: duartionOptions,
                    disabled: !formData.dimensions,
                    error: errors.duartion,
                    wrapperRef: durationRef,
                    tooltipKey: "duartion",
                  })}
                </Col>
              </Row>

              <span className="properties">Report Scheduling</span>

              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="10">
                  {renderCustomSelect({
                    id: "repeats",
                    fieldName: "repeats",
                    label: "Repeats",
                    required: true,
                    value: formData.repeats || "",
                    placeholder: "Select Repeats",
                    options: repeatsOptions,
                    disabled: !formData.dimensions,
                    error: errors.repeats,
                    wrapperRef: repeatsRef,
                    tooltipKey: "repeats",
                  })}
                </Col>
              </Row>

              {/* Dates */}
              <Row className={!formData.dimensions ? "disabling" : ""}>
                <Col md="4">
                  <FormGroup>
                    <Label for="startDate" >Start Date <span className="text-danger">*</span></Label>
                    <div style={{ position: 'relative' }} ref={startDateWrapperRef}>
                      <Input
                        type="text"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate || ""}
                        readOnly
                        onClick={() => {
                          if (formData.dimensions) setShowStartDatePicker(!showStartDatePicker);
                        }}
                        onMouseEnter={() => errors.startDate && setTooltipOpen((t) => ({ ...t, startDate: true }))}
                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, startDate: false }))}
                        invalid={!!errors.startDate}
                        className="formscontrol"
                        disabled={!formData.dimensions}
                        style={{ paddingRight: '35px', cursor: formData.dimensions ? 'pointer' : 'default', backgroundColor: formData.dimensions ? '#fff' : '#e9ecef' }}
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                          cursor: formData.dimensions ? 'pointer' : 'default',
                          pointerEvents: 'auto'
                        }}
                        onClick={() => {
                          if (formData.dimensions) setShowStartDatePicker(!showStartDatePicker);
                        }}
                      />
                      {showStartDatePicker && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          zIndex: 9999,
                          marginBottom: '5px'
                        }}>
                          <DatePicker
                            selected={parseLocalDate(formData.startDate)}
                            onChange={(date) => {
                              setFormData(prev => ({ ...prev, startDate: formatPayloadDate(date) }));
                              setShowStartDatePicker(false);
                            }}
                            minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                            inline
                            renderCustomHeader={(props) => <CustomDatePickerHeader {...props} />}
                          />
                        </div>
                      )}
                    </div>
                    {errors.startDate && (

                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.startDate}
                        target="startDate"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                      >
                        <div className="one"></div>
                        {errors.startDate}
                      </Tooltip>

                    )}
                  </FormGroup>
                </Col>


                <Col md="4">
                  {renderCustomSelect({
                    id: "starttime",
                    fieldName: "starttime",
                    label: "Start Time",
                    required: true,
                    value: formData.starttime || "",
                    placeholder: "Select Start Time",
                    options: starttimeOptions,
                    disabled: !formData.dimensions,
                    error: errors.starttime,
                    wrapperRef: starttimeRef,
                    tooltipKey: "starttime",
                  })}
                </Col>

                <Col md="4">
                  <FormGroup>
                    <Label for="endDate">End Date <span className="text-danger">*</span></Label>
                    <div style={{ position: 'relative' }} ref={endDateWrapperRef}>
                      <Input
                        type="text"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate || ""}
                        readOnly
                        onClick={() => {
                          if (formData.dimensions) setShowEndDatePicker(!showEndDatePicker);
                        }}
                        onMouseEnter={() => errors.endDate && setTooltipOpen((t) => ({ ...t, endDate: true }))}
                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, endDate: false }))}
                        invalid={!!errors.endDate}
                        className="formscontrol"
                        disabled={!formData.dimensions}
                        style={{ paddingRight: '35px', cursor: formData.dimensions ? 'pointer' : 'default', backgroundColor: formData.dimensions ? '#fff' : '#e9ecef' }}
                      />
                      <FaCalendarAlt
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#64748b',
                          cursor: formData.dimensions ? 'pointer' : 'default',
                          pointerEvents: 'auto'
                        }}
                        onClick={() => {
                          if (formData.dimensions) setShowEndDatePicker(!showEndDatePicker);
                        }}
                      />
                      {showEndDatePicker && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          zIndex: 9999,
                          marginBottom: '5px'
                        }}>
                          <DatePicker
                            selected={parseLocalDate(formData.endDate)}
                            onChange={(date) => {
                              setFormData(prev => ({ ...prev, endDate: formatPayloadDate(date) }));
                              setShowEndDatePicker(false);
                            }}
                            minDate={formData.startDate ? parseLocalDate(formData.startDate) : new Date(new Date().setDate(new Date().getDate() + 1))}
                            inline
                            renderCustomHeader={(props) => <CustomDatePickerHeader {...props} />}
                          />
                        </div>
                      )}
                    </div>
                    {errors.endDate && (

                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.endDate}
                        target="endDate"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                      >
                        <div className="one"></div>
                        {errors.endDate}
                      </Tooltip>

                    )}
                  </FormGroup>
                </Col>
              </Row>

              <Col md="10">
                <FormGroup>
                  <Label for="send_download">Send Download Link To </Label>
                  <Input
                    id="send_download"
                    name="send_download"
                    type="text"
                    value={formData.send_download}
                    onChange={handleChange}
                    placeholder="Enter email addresses separated by comma"
                    className="formscontrol"
                  >
                  </Input>
                </FormGroup>
              </Col>
            </>
          )}

          {/* Step 2: Scope */}
          {step === 2 && (() => {
            const flattenData = (data, level = 0, parentVisible = true) => {
              let result = [];
              data.forEach((node, idx) => {
                const nodeIdStr = String(node.treeId || `node-${node.id}`);
                const hasChildren = node.details && node.details.length > 0;

                const matchesSearch = searchTerm ? (
                  node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  String(node.id).includes(searchTerm)
                ) : true;

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

                  // ONLY recurse if expanded. This ensures collapse works even if child matches search.
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
                    <div className={`tree-item ${isLast ? 'last-item' : ''} d-flex align-items-center w-100`} style={{ minHeight: '35px', marginLeft: `${level * 24}px`, position: 'relative' }}>
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
                    <span className={isSelected ? "text-white w-100" : "text-dark w-100"} style={{ fontSize: '11px' }}>
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
                  <span className="selection-label">Select</span>
                  <div className="select-wrapper">
                    <span style={{ fontWeight: "bold", fontSize: "14px", padding: "0 10px", alignSelf: "center", display: "inline-block", paddingTop: "5px" }}>Campaigns</span>
                  </div>


                  <div className="">
                    <Input
                      type="text"
                      placeholder="Search..."
                      bsSize="sm"
                      className=" search-term-one"
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
                      <div className="text-center py-4 text-muted" style={{ fontSize: '11px' }}>
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

                <div className="mt-3 pb-3 border-bottom text-muted" style={{ fontSize: '14px' }}>
                  <strong>{scopeType}s Selected: {selectedScopes.length}</strong>
                </div>
              </div>
            );
          })()}
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle}>Cancel</Button>
          {step === 1 ? (
            <Button color="success" className="savebuttons" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <>
              <Button className="cancels me-2" onClick={handleBack}>Back</Button>
              <Button color="success" className="savebuttons" type="submit" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : initialReport?.id ? "Update Report" : "Create Report"}
              </Button>
            </>
          )}
        </ModalFooter>
      </Form>

    </Modal>
  );
};

export default ScheduledReportModal;
