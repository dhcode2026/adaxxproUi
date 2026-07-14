import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  CardBody,
  Form,
  Input,
  Label,
  Row,
  Col,
  Spinner,
  Tooltip,
  UncontrolledTooltip,
} from "reactstrap";
import "./campcreate.css";
import { useViewContext } from "../../ViewContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "sweetalert2/dist/sweetalert2.min.css";
import DayPartEditor from "./DayPartEditor";
import { FaCaretDown, FaCaretRight, FaEdit, FaSave, FaSlidersH, FaTimes, } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { useNavigate, useParams, useLocation, json } from "react-router-dom";
import { ssp, OsOptions, ssb, goalstrOptions, goalOptions, smartgoalOptions, impressionCapOptions, pacingOptions, captureaudienceOptions, evalutiongroupOptions, evalutionperiodOptions, samplevalueOptions, } from "../../Utils.js";
import "react-form-wizard-component/dist/style.css";
import AudienceModal from "../Modal/AudienceModal.jsx";
import ConversionParametersModal from "../Modal/ConversionParametersModal.jsx";
import GeoEditor from "./GeoEditor.jsx";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Swal from "sweetalert2";
import ConversionEditor from "../editors/ConversionEditor.jsx";
import DealsEditor from "../editors/DealsEditor.jsx";
import LinkedAdsEditor from "../editors/LinkedAdsEditor.jsx";
import InventoryEditor from "../editors/InventoryEditor.jsx";
import Location from "../editors/Location.jsx";
import Devices from "./Devices.jsx";
import AudienceEditor from "./AudienceEditor.jsx";
import {
  getAudiencelist, editAudiencebrand, getConversionlist, getConversionEvent, getAllCategory,
  getcampaign, listCreativesbrand, updatecampaign, createCampaign, editcreatives, listUnLinkCampaign,
} from "../api/Api.jsx";
import BrandcategoryModal from "../Modal/BrandcategoryModal.jsx";
import { canCreate, canEdit, canDelete, canView, canUpdate, canReporting, canApprove, } from "../../utils/permissionHelper.js";
var undef;
const DEFAULT_BRAND_ID = 39;
const normalizeBrandId = (value) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const getConversionIdValue = (item) =>
  item?.conversionId ?? item?.conversion_id ?? item?.id ?? null;
const getConversionBaseUrlValue = (item) =>
  item?.baseUrl ??
  item?.base_url ??
  item?.baseurl ??
  item?.conversionUrl ??
  item?.conversion_url ??
  item?.url ??
  "";
const getConversionImpressionUrlValue = (item) =>
  item?.impressionUrl ??
  item?.impression_url ??
  item?.viewthroughConversionUrl ??
  item?.viewthrough_conversion_url ??
  item?.viewThroughConversionUrl ??
  "";
const parseCurrencyNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const normalizeImpressionCapValue = (value, fallback = "10000") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};
const getCampaignImpressionCapValue = (campaign, fallback = "10000") =>
  normalizeImpressionCapValue(
    campaign?.impressionCapValue ??
    campaign?.impressionType ??
    campaign?.impressionCaps ??
    campaign?.impression_caps,
    fallback,
  );

const applyImpressionTypePayload = (payload, value) => {
  const impressionValue = normalizeImpressionCapValue(value);
  payload.impressionType = impressionValue;
  payload.impressionCapValue = impressionValue;
  payload.impressionCaps = impressionValue;
  payload.impression_caps = impressionValue;
  return payload;
};

const serializeCarrierValue = (value) => {
  if (Array.isArray(value)) {
    const carriers = value.map((item) => String(item).trim()).filter(Boolean);
    return carriers.length > 0 ? carriers.join(",") : "all";
  }

  const carrier = String(value ?? "").trim();
  return carrier || "all";
};

const getCampaignExternalName = (campaign) =>
  String(
    campaign?.externdName ??
    campaign?.externalName ??
    campaign?.externalname ??
    campaign?.external_name ??
    "",
  );

const DEFAULT_BID_MULTIPLIER = 1.0;
const BID_MULTIPLIER_OPTIONS = ["1.0", "1.2", "1.4", "1.6", "1.8", "2.0"];

const normalizeBidMultiplier = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : DEFAULT_BID_MULTIPLIER;
};

const getAudienceCapturePayload = (formDataArg, campaignArg) => {
  const defaults = {
    captureClicks: "",
    captureConversion: "",
    complete_25: "",
    complete_50: "",
    complete_75: "",
    complete_100: "",
  };

  try {
    if (typeof formDataArg !== "undefined" && formDataArg !== null) {
      return {
        captureClicks:
          formDataArg.Capture_Clicks ||
            formDataArg.capture_clicks ||
            formDataArg.Capture_Clicks === ""
            ? formDataArg.Capture_Clicks
            : formDataArg.Capture_Clicks ||
            formDataArg.captureClicks ||
            formDataArg.Capture_Clicks ||
            defaults.captureClicks,
        captureConversion:
          formDataArg.Capture_Conversions ||
            formDataArg.capture_conversion ||
            formDataArg.Capture_Conversions === ""
            ? formDataArg.Capture_Conversions
            : formDataArg.Capture_Conversions ||
            formDataArg.captureConversion ||
            formDataArg.Capture_Conversions ||
            defaults.captureConversion,
        complete_25:
          formDataArg.complete_25 ||
          formDataArg.complete25 ||
          defaults.complete_25,
        complete_50:
          formDataArg.complete_50 ||
          formDataArg.complete50 ||
          defaults.complete_50,
        complete_75:
          formDataArg.complete_75 ||
          formDataArg.complete75 ||
          defaults.complete_75,
        complete_100:
          formDataArg.complete_100 ||
          formDataArg.complete100 ||
          defaults.complete_100,
      };
    }
  } catch (e) {
    // ignore and use campaign/catchall defaults below
  }

  // If formData not available or missing keys, try campaign
  if (typeof campaignArg !== "undefined" && campaignArg !== null) {
    return {
      captureClicks:
        campaignArg.captureClicks ||
        campaignArg.capture_clicks ||
        defaults.captureClicks,
      captureConversion:
        campaignArg.captureConversion ||
        campaignArg.capture_conversion ||
        defaults.captureConversion,
      complete_25:
        campaignArg.complete25 ||
        campaignArg.complete_25 ||
        defaults.complete_25,
      complete_50:
        campaignArg.complete50 ||
        campaignArg.complete_50 ||
        defaults.complete_50,
      complete_75:
        campaignArg.complete75 ||
        campaignArg.complete_75 ||
        defaults.complete_75,
      complete_100:
        campaignArg.complete100 ||
        campaignArg.complete_100 ||
        defaults.complete_100,
    };
  }

  return defaults;
};

const buildConversionTrackingUrl = ({
  baseUrl,
  clickLookback,
  viewLookback,
  campaignName,
  campaignExternalName,
  appWebName,
} = {}) => {
  const normalizedBase = String(baseUrl || "")
    .trim()
    .replace(/\?.*$/, "")
    .replace(/\/+$/, "");
  if (!normalizedBase) return "";
  const hasAppIdPlaceholder =
    normalizedBase.includes("{app_id}") ||
    normalizedBase.toLowerCase().includes("%7bapp_id%7d");

  let normalizedBaseWithAppId = hasAppIdPlaceholder
    ? normalizedBase
    : `${normalizedBase}/{app_id}`;

  if (appWebName) {
    normalizedBaseWithAppId = normalizedBaseWithAppId
      .replace(/{app_id}/gi, appWebName)
      .replace(/%7bapp_id%7d/gi, appWebName)
      .replace(/%7Bapp_id%7D/gi, appWebName);
  }

  const clickLookbackValue =
    String(clickLookback || "").trim() || "{click_lookback}";
  const viewLookbackValue =
    String(viewLookback || "").trim() || "{view_lookback}";

  const cValue = campaignExternalName
    ? campaignExternalName
    : campaignName
      ? campaignName
      : "{c}";

  const trackingParams = [
    "pid=maibiztecnx_int",
    `click_lookback=${clickLookbackValue}`,
    "device_ip={device_ip}",
    "event_name={event_name}",
    "user_agent={user_agent}",
    `view_lookback=${viewLookbackValue}`,
    "af_siteid={publisher_id}",
    "af_sub_siteid={source}",
    `c=${cValue}`,
    "af_c_id={campaign_id}",
    "af_ad={creative_name}",
    "af_ad_id={creative_id}",
    "af_adset={af_adset}",
    "af_media_type={device_type}",
    "clickid={click_id}",
    "advertising_id={advertising_id}",
    "android_id={android_id}",
    "af_os_version={os_version}",
  ].join("&");

  const finalUrl = `${normalizedBaseWithAppId}?${trackingParams}`;
  return finalUrl.replace(/%7Bapp_id%7D/gi, "{app_id}");
};

const getUserDefaultBrandId = () => {
  try {
    const stored = localStorage.getItem("brandId");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return normalizeBrandId(parsed[0]);
    }
    return normalizeBrandId(parsed);
  } catch {
    return null;
  }
};

const renderValidationSwalHtml = (title, message) => `
  <div class="campaign-swal-card">
    <div class="campaign-swal-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="presentation" focusable="false">
        <path
          d="M12 8.5v5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17" r="1.25" fill="currentColor" />
        <path
          d="M12 3.75C7.4 3.75 3.75 7.4 3.75 12S7.4 20.25 12 20.25 20.25 16.6 20.25 12 16.6 3.75 12 3.75Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    </div>
    <div class="campaign-swal-title">${title}</div>
    <div class="campaign-swal-message">${message}</div>
  </div>
`;

function CheckIcon() {
  return (
    <div
      className="camp-style-1"
    >
      <svg width="10" height="10" viewBox="0 0 10 10">
        <polyline
          points="2,5 4,7.5 8,2.5"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

const steps = [
  "General",
  "Deals",
  "Locations",
  "Devices",
  "Inventory",
  "Linked Ads",
];

const updateUrlCParameter = (url, externalCampaignName, campaignName) => {
  if (!url) return "";
  try {
    const questionIndex = url.indexOf("?");
    if (questionIndex < 0) return url;

    const baseUrl = url.slice(0, questionIndex);
    const queryString = url.slice(questionIndex + 1);

    const params = queryString.split("&");
    const updatedParams = params.map((pair) => {
      const equalsIndex = pair.indexOf("=");
      const key = equalsIndex >= 0 ? pair.slice(0, equalsIndex) : pair;
      let val = equalsIndex >= 0 ? pair.slice(equalsIndex + 1) : "";

      if (key === "c") {
        val = externalCampaignName
          ? externalCampaignName
          : campaignName
            ? campaignName
            : "{c}";
      }
      return equalsIndex >= 0 ? `${key}=${val}` : key;
    });

    return `${baseUrl}?${updatedParams.join("&")}`;
  } catch (e) {
    return url;
  }
};

const updateUrlQueryParameter = (
  url,
  paramName,
  paramValue,
  fallbackValue = "",
) => {
  if (!url) return "";
  try {
    const questionIndex = url.indexOf("?");
    if (questionIndex < 0) return url;

    const baseUrl = url.slice(0, questionIndex);
    const queryString = url.slice(questionIndex + 1);

    const params = queryString.split("&");
    const updatedParams = params.map((pair) => {
      const equalsIndex = pair.indexOf("=");
      const key = equalsIndex >= 0 ? pair.slice(0, equalsIndex) : pair;
      let val = equalsIndex >= 0 ? pair.slice(equalsIndex + 1) : "";

      if (key === paramName) {
        val = String(paramValue || "").trim() || fallbackValue;
      }
      return equalsIndex >= 0 ? `${key}=${val}` : key;
    });

    return `${baseUrl}?${updatedParams.join("&")}`;
  } catch (e) {
    return url;
  }
};

const updateUrlAppId = (url, oldAppWebName, newAppWebName) => {
  if (!url) return "";
  try {
    const questionIndex = url.indexOf("?");
    const baseUrl = questionIndex >= 0 ? url.slice(0, questionIndex) : url;
    const queryString = questionIndex >= 0 ? url.slice(questionIndex + 1) : "";

    const parsedUrl = new URL(baseUrl);
    const pathname = parsedUrl.pathname;

    const targetOld = oldAppWebName ? oldAppWebName : "{app_id}";
    const targetNew = newAppWebName ? newAppWebName : "{app_id}";

    const segments = pathname.split("/");
    const updatedSegments = segments.map((seg) => {
      let decodedSeg = seg;
      try {
        decodedSeg = decodeURIComponent(seg);
      } catch (e) { }

      if (decodedSeg === targetOld || decodedSeg === "{app_id}") {
        return targetNew;
      }
      return seg;
    });

    parsedUrl.pathname = updatedSegments.join("/");
    const updatedBaseUrl = parsedUrl.toString().replace(/\/$/, "");

    const finalUrl = queryString
      ? `${updatedBaseUrl}?${queryString}`
      : updatedBaseUrl;
    return finalUrl.replace(/%7Bapp_id%7D/gi, "{app_id}");
  } catch (e) {
    const questionIndex = url.indexOf("?");
    let baseUrl = questionIndex >= 0 ? url.slice(0, questionIndex) : url;
    const queryString = questionIndex >= 0 ? url.slice(questionIndex + 1) : "";

    const targetOld = oldAppWebName ? oldAppWebName : "{app_id}";
    const targetNew = newAppWebName ? newAppWebName : "{app_id}";

    const segments = baseUrl.split("/");
    const updatedSegments = segments.map((seg, idx) => {
      const isDomainSegment = idx === 0 && seg.includes(".");

      let decodedSeg = seg;
      try {
        decodedSeg = decodeURIComponent(seg);
      } catch (e) { }

      if (
        !isDomainSegment &&
        (decodedSeg === targetOld || decodedSeg === "{app_id}")
      ) {
        return targetNew;
      }
      return seg;
    });
    baseUrl = updatedSegments.join("/");

    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    return finalUrl.replace(/%7Bapp_id%7D/gi, "{app_id}");
  }
};

const DatePickerCustomHeader = ({
  date,
  changeYear,
  changeMonth,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
}) => {
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const headerRef = useRef(null);
  const monthScrollRef = useRef(null);
  const yearScrollRef = useRef(null);

  const monthsAbbr = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthsFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 30; // 1996
  const endYear = currentYear + 30; // 2056
  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
        setShowYearDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (showMonthDropdown && monthScrollRef.current) {
      setTimeout(() => {
        const selectedEl = monthScrollRef.current?.querySelector(".selected");
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: "nearest" });
        }
      }, 50);
    }
  }, [showMonthDropdown]);

  useEffect(() => {
    if (showYearDropdown && yearScrollRef.current) {
      setTimeout(() => {
        const selectedEl = yearScrollRef.current?.querySelector(".selected");
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: "nearest" });
        }
      }, 50);
    }
  }, [showYearDropdown]);

  const handleMonthSelect = (idx) => {
    changeMonth(idx);
    setShowMonthDropdown(false);
  };

  const handleYearSelect = (year) => {
    changeYear(year);
    setShowYearDropdown(false);
  };

  const toggleMonthDropdown = (e) => {
    e.preventDefault();
    setShowMonthDropdown(!showMonthDropdown);
    setShowYearDropdown(false);
  };

  const toggleYearDropdown = (e) => {
    e.preventDefault();
    setShowYearDropdown(!showYearDropdown);
    setShowMonthDropdown(false);
  };

  return (
    <div className="react-datepicker__custom-header-container" ref={headerRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          decreaseMonth();
        }}
        disabled={prevMonthButtonDisabled}
        type="button"
        className="react-datepicker__custom-nav-btn"
      >
        <i className="fa fa-caret-left" />
      </button>

      <div className="react-datepicker__custom-select-group">
        <div className="react-datepicker__custom-select-wrapper">
          <div
            onClick={toggleMonthDropdown}
            className={`react-datepicker__custom-header-trigger ${showMonthDropdown ? "active" : ""
              }`}
          >
            {date
              ? monthsAbbr[date.getMonth()]
              : monthsAbbr[new Date().getMonth()]}
            <i className="fa fa-caret-down ms-1" />
          </div>
          {showMonthDropdown && (
            <div className="react-datepicker__custom-dropdown-card">
              <div
                className="react-datepicker__dropdown-scroll-container"
                ref={monthScrollRef}
              >
                {monthsFull.map((month, idx) => {
                  const isSelected = date && date.getMonth() === idx;
                  return (
                    <div
                      key={month}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMonthSelect(idx);
                      }}
                      className={`react-datepicker__dropdown-option ${isSelected ? "selected" : ""
                        }`}
                    >
                      {month}
                      <span className="tick-icon">✓</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="react-datepicker__custom-select-wrapper">
          <div
            onClick={toggleYearDropdown}
            className={`react-datepicker__custom-header-trigger ${showYearDropdown ? "active" : ""
              }`}
          >
            {date ? date.getFullYear() : currentYear}
            <i className="fa fa-caret-down ms-1" />
          </div>
          {showYearDropdown && (
            <div className="react-datepicker__custom-dropdown-card">
              <div
                className="react-datepicker__dropdown-scroll-container"
                ref={yearScrollRef}
              >
                {years.map((year) => {
                  const isSelected = date && date.getFullYear() === year;
                  return (
                    <div
                      key={year}
                      onClick={(e) => {
                        e.preventDefault();
                        handleYearSelect(year);
                      }}
                      className={`react-datepicker__dropdown-option ${isSelected ? "selected" : ""
                        }`}
                    >
                      {year}
                      <span className="tick-icon">✓</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          increaseMonth();
        }}
        disabled={nextMonthButtonDisabled}
        type="button"
        className="react-datepicker__custom-nav-btn"
      >
        <i className="fa fa-caret-right" />
      </button>
    </div>
  );
};

const CreateCampaign = (props) => {
  const { id, campaign_id } = useParams();
  const isEditMode = Boolean(campaign_id);
  const [originalCreativeIds, setOriginalCreativeIds] = useState([]);
  const location = useLocation();
  const [campaignType, setCampaignType] = useState(() => {
    return location.state?.campaignType || (isEditMode ? "" : "Advanced Campaign");
  });
  const [groupid, setgroupid] = useState(id);
  const [brandId, setBrandId] = useState(
    () =>
      normalizeBrandId(location.state?.brandId) ||
      getUserDefaultBrandId() ||
      normalizeBrandId(localStorage.getItem("userBrandId")) ||
      normalizeBrandId(localStorage.getItem("currentBrandId")) ||
      normalizeBrandId(DEFAULT_BRAND_ID),
  );
  const [groupName, setGroupName] = useState(location.state?.groupName || "");
  const modalRef = useRef();
  const mainScrollRef = useRef(null);
  const [error, setError] = useState("");
  const inventoryref = useRef();
  const bidMultiplierMenuRef = useRef(null);
  const bidShadingMultiplierMenuRef = useRef(null);
  const goalStatusMenuRef = useRef(null);
  const smartGoalStatusMenuRef = useRef(null);
  const [camCreateUser, setCamCreateUser] = useState(() =>
    canCreate("Create Campaign"),
  );
  const [camViewUser, setCamViewUser] = useState(() =>
    canView("Create Campaign"),
  );
  const [camEditUser, setCamEditUser] = useState(() =>
    canEdit("Create Campaign"),
  );
  const [camDeleteUser, setCamDeleteUser] = useState(() =>
    canDelete("Create Campaign"),
  );
  const [camUpdateUser, setCamUpdateUser] = useState(() =>
    canUpdate("Create Campaign"),
  );
  const [camReportingUser, setCamReportingUser] = useState(() =>
    canReporting("Create Campaign"),
  );
  const [camApproveUser, setCamApproveUser] = useState(() =>
    canApprove("Create Campaign"),
  );
  useEffect(() => {
    loadCategoryMappings();
  }, []);

  useEffect(() => {
    const pageClass = "campaign-page-scroll-fix";
    const body = document.body;
    const html = document.documentElement;
    body.classList.add(pageClass);
    html.classList.add(pageClass);

    const containerScroller = document.querySelector(".container-scroller");
    const mainPanel = document.querySelector(".main-panel");
    const contentWrapper = document.querySelector(".content-wrapper");

    if (containerScroller) containerScroller.classList.add(pageClass);
    if (mainPanel) mainPanel.classList.add(pageClass);
    if (contentWrapper) contentWrapper.classList.add(pageClass);

    return () => {
      body.classList.remove(pageClass);
      html.classList.remove(pageClass);
      if (containerScroller) containerScroller.classList.remove(pageClass);
      if (mainPanel) mainPanel.classList.remove(pageClass);
      if (contentWrapper) contentWrapper.classList.remove(pageClass);
    };
  }, []);

  useEffect(() => {
    const handleScrollEvent = (event) => {
      const target = event?.target;
      if (
        target &&
        target !== mainScrollRef.current &&
        target !== window &&
        target !== document &&
        target !== document.documentElement &&
        target !== document.body
      ) {
        return;
      }

      const sections = [
        { id: "campaign-section-basics", step: 0, sub: "basics" },
        { id: "campaign-section-budget", step: 0, sub: "budget" },
        { id: "campaign-section-optimization", step: 0, sub: "optimization" },
        { id: "campaign-section-conversions", step: 0, sub: "conversions" },
        { id: "campaign-section-viewability", step: 0, sub: "viewability" },
        { id: "campaign-section-advanced", step: 0, sub: "advanced" },
        { id: "campaign-section-step-1", step: 1, sub: null },
        { id: "location-section-geographic", step: 2, sub: "geographic" },
        { id: "location-section-dma", step: 2, sub: "dma" },
        { id: "location-section-zip", step: 2, sub: "zip" },
        { id: "location-section-selected", step: 2, sub: "selected" },
        { id: "location-section-hyperlocal", step: 2, sub: "hyperlocal" },
        { id: "campaign-section-step-2", step: 2, sub: null },
        { id: "devices-section-type", step: 3, sub: "type" },
        { id: "devices-section-id", step: 3, sub: "id" },
        { id: "devices-section-make", step: 3, sub: "make" },
        { id: "devices-section-model", step: 3, sub: "model" },
        { id: "devices-section-os", step: 3, sub: "os" },
        { id: "devices-section-browser", step: 3, sub: "browser" },
        { id: "devices-section-language", step: 3, sub: "language" },
        { id: "devices-section-ua", step: 3, sub: "ua" },
        { id: "campaign-section-step-3", step: 3, sub: null },
        { id: "campaign-section-step-4", step: 4, sub: null },
        { id: "campaign-section-step-5", step: 5, sub: null },
        { id: "campaign-section-step-6", step: 5, sub: null },
        { id: "campaign-section-step-7", step: 5, sub: null },
      ];

      let isAtBottom = false;
      if (target) {
        let scrollHeight, scrollTop, clientHeight;
        if (
          target === document ||
          target === window ||
          target === document.documentElement ||
          target === document.body
        ) {
          const docEl = document.documentElement;
          scrollHeight = docEl.scrollHeight;
          scrollTop = window.scrollY || docEl.scrollTop;
          clientHeight = window.innerHeight;
        } else {
          scrollHeight = target.scrollHeight;
          scrollTop = target.scrollTop;
          clientHeight = target.clientHeight;
        }
        if (scrollHeight && clientHeight) {
          const scrollDifference = scrollHeight - scrollTop - clientHeight;
          if (scrollDifference < 35) {
            // Check with 35px safety margin for different zoom levels
            isAtBottom = true;
          }
        }
      }

      let currentSection = null;
      if (isAtBottom) {
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          const el = document.getElementById(section.id);
          if (el) {
            currentSection = section;
            break;
          }
        }
      }

      if (!currentSection) {
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i];
          const el = document.getElementById(section.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            // First section from the bottom whose top has scrolled past or is near the top of the viewport
            if (rect.top <= 200) {
              currentSection = section;
              break;
            }
          }
        }
      }

      if (!currentSection && sections.length > 0) {
        currentSection = sections[0];
      }

      if (currentSection) {
        setStep((prevStep) => {
          if (prevStep !== currentSection.step) {
            return currentSection.step;
          }
          return prevStep;
        });
        setActiveSubTab((prevSubTab) => {
          if (currentSection.sub && prevSubTab !== currentSection.sub) {
            return currentSection.sub;
          }
          return prevSubTab;
        });
      }
    };

    const scrollContainer = mainScrollRef.current;
    window.addEventListener("scroll", handleScrollEvent, { capture: true });
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScrollEvent, {
        capture: true,
      });
    }
    return () => {
      window.removeEventListener("scroll", handleScrollEvent, {
        capture: true,
      });
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScrollEvent, {
          capture: true,
        });
      }
    };
  }, []);

  useEffect(() => {
    if (campaign_id) {
      fetchapi();
    }
  }, [campaign_id]);
  const safeJsonParse = (value, defaultValue = {}) => {
    if (!value) return defaultValue;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return defaultValue;
    }
  };
  const toBoolean = (value) =>
    value === true || value === "true" || value === 1 || value === "1";
  const toBinaryString = (value, defaultValue = "0") => {
    if (value === undefined || value === null || value === "")
      return defaultValue;
    if (value === false || value === 0 || value === "0" || value === "false")
      return "0";
    if (value === true || value === 1 || value === "1" || value === "true")
      return "1";
    return defaultValue;
  };
  const normalizePagePosition = (value, enabledFallback = false) => {
    const parsed = safeJsonParse(value, {});

    return {
      above_fold: parsed?.above_fold === true,
      below_fold: parsed?.below_fold === true,
      page_unknown: parsed?.page_unknown === true,
      _enabled:
        typeof parsed?._enabled === "boolean"
          ? parsed._enabled
          : enabledFallback,
    };
  };
  const normalizeAudienceCapture = (value, completionValues = {}) => {
    const rawObject =
      value && typeof value === "object" && !Array.isArray(value)
        ? value
        : null;
    const rawArray =
      typeof value === "string"
        ? value.split(",")
        : Array.isArray(value)
          ? value
          : [];

    const clicksEnabled = rawObject
      ? rawObject.Clicks === true ||
      rawObject.Clicks === "true" ||
      rawObject.Clicks === "Capture Clicks"
      : rawArray[0] === true || rawArray[0] === "true";
    const conversionsEnabled = rawObject
      ? rawObject.Conversions === true ||
      rawObject.Conversions === "true" ||
      rawObject.Conversions === "Capture conversion"
      : rawArray[1] === true || rawArray[1] === "true";
    const audioEnabled = rawObject
      ? rawObject.Audio === true ||
      rawObject.Audio === "true" ||
      rawObject.Audio === "Capture Audio/Video Events"
      : rawArray[2] === true || rawArray[2] === "true";

    const normalized = {
      Clicks: clicksEnabled ? "Capture Clicks" : "",
      Conversions: conversionsEnabled ? "Capture conversion" : "",
      Audio: audioEnabled ? "Capture Audio/Video Events" : "",
      complete_25: completionValues.complete_25 ? "Capture conversion" : "",
      complete_50: completionValues.complete_50 ? "Capture conversion" : "",
      complete_75: completionValues.complete_75 ? "Capture conversion" : "",
      complete_100: completionValues.complete_100 ? "Capture conversion" : "",
    };

    return {
      ...normalized,
      _enabled: Boolean(
        normalized.Clicks ||
        normalized.Conversions ||
        normalized.Audio ||
        normalized.complete_25 ||
        normalized.complete_50 ||
        normalized.complete_75 ||
        normalized.complete_100,
      ),
    };
  };
  const sanitizePagePosition = (value) => ({
    above_fold: value?.above_fold === true,
    below_fold: value?.below_fold === true,
    page_unknown: value?.page_unknown === true,
  });
  const sanitizeAudienceCapture = (value) => ({
    Clicks: value?.Clicks === true || value?.Clicks === "Capture Clicks",
    Conversions:
      value?.Conversions === true ||
      value?.Conversions === "Capture conversion",
    Audio:
      value?.Audio === true || value?.Audio === "Capture Audio/Video Events",
  });
  const isPagePositionEnabled = (value) =>
    value === true ||
    (typeof value === "object" &&
      value !== null &&
      (value._enabled === true ||
        value.above_fold === true ||
        value.below_fold === true ||
        value.page_unknown === true));
  const isAudienceCaptureEnabled = (value) =>
    value === true ||
    (typeof value === "object" &&
      value !== null &&
      (value._enabled === true ||
        value.Clicks === true ||
        value.Clicks === "Capture Clicks" ||
        value.Conversions === true ||
        value.Conversions === "Capture conversion" ||
        value.Audio === true ||
        value.Audio === "Capture Audio/Video Events" ||
        value.complete_25 === "Capture conversion" ||
        value.complete_50 === "Capture conversion" ||
        value.complete_75 === "Capture conversion" ||
        value.complete_100 === "Capture conversion"));
  const [tooltipOpen, setTooltipOpen] = useState({
    name: "",
    capspec: "",
    cpm_bid: "",
    capcount: "",
    capexpire: "",
    minimum_bid: "",
    bid_step: "",
    learn_budget: "",
    sample_size_value: "",
    control_group_size: "",
    control_group_sov: "",
    dollar_goal: "",
    dollar_goal1: "",
    total_budget: "",
    ad_domain: false,
    iab_category: false,
    blocked_advertiser: false,
    viewthroughConversionUrl: false,
  });
  const [isLoading, setIsLoading] = useState(Boolean(campaign_id));
  const [isLocationHydrated, setIsLocationHydrated] = useState(false);
  const [count, setCount] = useState(0);
  const [primaryPopupShown, setPrimaryPopupShown] = useState(false);
  const [campaign, setCampaign] = useState(props.campaign);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const navigate = useNavigate();
  const [daypartSchedule, setDaypartSchedule] = useState(
    props.campaign?.daypartSchedule,
  );
  const [selectedCountryItems, setSelectedCountryItems] = useState([]);
  const [initialCampaignLocations, setInitialCampaignLocations] = useState([]);
  const vx = useViewContext();
  const [selectedValue, setSelectedValue] = useState([]);
  const [selected, setSelected] = useState([]);
  const [rulesselected, rulessetSelected] = useState([]);
  const [languageselected, languagesetSelected] = useState([]);
  const [creativeselected, creativesetSelected] = useState([]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [brandcategorysModalOpen, setBrandcategorysModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedBlockedCategory, setSelectedBlockedCategory] = useState([]);
  const [blockedCategoryModalOpen, setBlockedCategoryModalOpen] =
    useState(false);
  const [categoriesDataMap, setCategoriesDataMap] = useState({});
  const [categoriesNameMap, setCategoriesNameMap] = useState({});

  const [isCategoryMappingsLoading, setIsCategoryMappingsLoading] =
    useState(true);
  const currentIabCategory = Array.isArray(selectedCategory)
    ? selectedCategory.filter((item) => item && String(item).trim()).join(",")
    : "";
  const currentBlockedCategory = Array.isArray(selectedBlockedCategory)
    ? selectedBlockedCategory.filter((item) => item && String(item).trim())
    : [];
  const normalizeStringList = (input) => {
    if (input === null || input === undefined) return [];

    if (Array.isArray(input)) {
      return input
        .flatMap((item) =>
          String(item ?? "")
            .replace(/[{}]/g, "")
            .split(","),
        )
        .map((value) => value.trim())
        .filter(Boolean);
    }

    if (typeof input === "string") {
      return input
        .replace(/[{}]/g, "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return [];
  };

  useEffect(() => {
    setFormData((prev) => {
      const blockedAdvertiser = Array.isArray(prev.blocked_advertiser)
        ? prev.blocked_advertiser.filter(Boolean).join(",")
        : typeof prev.blocked_advertiser === "string"
          ? prev.blocked_advertiser
          : String(prev.blocked_advertiser ?? "");

      const blockedCategory = Array.isArray(prev.blocked_category)
        ? prev.blocked_category
        : normalizeStringList(prev.blocked_category);

      if (
        typeof prev.blocked_advertiser === "string" &&
        Array.isArray(prev.blocked_category)
      ) {
        return prev;
      }

      return {
        ...prev,
        blocked_advertiser: blockedAdvertiser,
        blocked_category: blockedCategory,
      };
    });
  }, []);

  const loadCategoryMappings = async () => {
    setIsCategoryMappingsLoading(true);
    try {
      const response = await getAllCategory();
      const { informationCategories } = response.data.data;
      const transformed = {};
      const nameMap = {};

      const normalizeCategoryKey = (value) => String(value ?? "").trim();
      const pickCategoryKey = (obj) =>
        obj?.categoryCode ??
        obj?.category_code ??
        obj?.code ??
        obj?.value ??
        obj?.id ??
        obj?.name;
      const pickCategoryName = (obj) =>
        obj?.name ??
        obj?.displayName ??
        obj?.label ??
        obj?.categoryName ??
        obj?.value ??
        obj?.categoryCode ??
        obj?.code;

      informationCategories.forEach((category) => {
        const parentKey = normalizeCategoryKey(pickCategoryKey(category));
        if (!parentKey) return;

        nameMap[parentKey] =
          normalizeCategoryKey(pickCategoryName(category)) || parentKey;

        const rawChildren = category?.categoryValues ?? category?.values ?? [];
        transformed[parentKey] = (Array.isArray(rawChildren) ? rawChildren : [])
          .map((sub) => {
            const childKey = normalizeCategoryKey(pickCategoryKey(sub));
            if (!childKey) return null;
            nameMap[childKey] =
              normalizeCategoryKey(pickCategoryName(sub)) || childKey;
            return childKey;
          })
          .filter(Boolean);
      });

      setCategoriesDataMap(transformed);
      setCategoriesNameMap(nameMap);
    } catch (error) {
      console.error("Failed to load category mappings:", error);
    } finally {
      setIsCategoryMappingsLoading(false);
    }
  };
  const normalizeLinkedCreative = (creative) => ({
    ...creative,
    creativesId: creative?.creativesId ?? creative?.id,
    type:
      creative?.type ??
      creative?.creativeType ??
      creative?.adType ??
      creative?.creative_type ??
      "",
    name: creative?.name ?? creative?.creativeName ?? creative?.adName ?? "",
    destinationUrl:
      creative?.destinationUrl ??
      creative?.destination_url ??
      creative?.landingPageUrl ??
      creative?.landing_page_url ??
      creative?.url ??
      "",
    status: creative?.status ?? 1,
  });
  const resolveLinkedAdsDetails = async (campaignData) => {
    let rawLinkedAds = campaignData?.linkedAds;
    let linkedAdIds = [];
    if (Array.isArray(rawLinkedAds)) {
      linkedAdIds = rawLinkedAds
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return Number(item.creativesId || item.id);
          }
          return Number(item);
        })
        .filter(Boolean);
    } else if (typeof rawLinkedAds === "string") {
      try {
        const parsed = JSON.parse(rawLinkedAds);
        if (Array.isArray(parsed)) {
          linkedAdIds = parsed
            .map((item) => {
              if (typeof item === "object" && item !== null) {
                return Number(item.creativesId || item.id);
              }
              return Number(item);
            })
            .filter(Boolean);
        } else {
          linkedAdIds = String(rawLinkedAds)
            .split(",")
            .map(Number)
            .filter(Boolean);
        }
      } catch (e) {
        linkedAdIds = String(rawLinkedAds)
          .split(",")
          .map(Number)
          .filter(Boolean);
      }
    }

    linkedAdIds = [...new Set(linkedAdIds)];

    if (linkedAdIds.length === 0) return [];

    const resolvedBrandId =
      normalizeBrandId(campaignData?.brandId) ||
      normalizeBrandId(campaignData?.brand_id) ||
      normalizeBrandId(campaignData?.groups?.brandId) ||
      normalizeBrandId(campaignData?.groups?.brand_id) ||
      normalizeBrandId(brandId) ||
      normalizeBrandId(location.state?.brandId) ||
      normalizeBrandId(localStorage.getItem("currentBrandId")) ||
      normalizeBrandId(DEFAULT_BRAND_ID);

    let creativeMap = new Map();

    if (resolvedBrandId) {
      try {
        const creativesResponse = await listCreativesbrand(resolvedBrandId);
        const rawData = creativesResponse?.data;
        let creativeList = [];

        if (rawData?.data?.informationCreatives) {
          creativeList = rawData.data.informationCreatives;
        } else if (rawData?.informationCreatives) {
          creativeList = rawData.informationCreatives;
        } else if (Array.isArray(rawData)) {
          creativeList = rawData;
        }

        creativeMap = new Map(
          creativeList
            .map(normalizeLinkedCreative)
            .filter((creative) => creative.creativesId)
            .map((creative) => [Number(creative.creativesId), creative]),
        );
      } catch (error) {
        console.error(
          "Failed to load brand creatives list in resolveLinkedAdsDetails:",
          error,
        );
      }
    }

    try {
      const resolved = await Promise.all(
        linkedAdIds.map(async (id) => {
          const match = creativeMap.get(Number(id));
          if (match) return match;

          try {
            const res = await editcreatives(Number(id));
            const creativeData = res.data?.data?.informationCreatives?.[0];
            if (creativeData) {
              return normalizeLinkedCreative(creativeData);
            }
          } catch (e) {
            console.error(
              `Failed to fetch creative ${id} directly in resolveLinkedAdsDetails:`,
              e,
            );
          }
          return normalizeLinkedCreative({ creativesId: Number(id) });
        }),
      );
      return resolved;
    } catch (error) {
      console.error("Failed to resolve linked ads details:", error);
      return linkedAdIds.map((id) =>
        normalizeLinkedCreative({ creativesId: id }),
      );
    }
  };
  const getGroupedCategoryDisplay = (selectedItems = []) => {
    if (!Array.isArray(selectedItems) || selectedItems.length === 0) return [];
    if (isCategoryMappingsLoading) return [];

    const selectedSet = new Set(selectedItems);
    const parentKeys = Object.keys(categoriesDataMap);
    const grouped = [];
    const consumed = new Set();

    const inferredChildrenByParent = selectedItems.reduce((acc, item) => {
      if (typeof item !== "string") return acc;
      const match = item.match(/^IAB(\d+)-/i);
      if (!match) return acc;

      const inferredParentKey = `IAB${match[1]}`;
      if (!categoriesDataMap[inferredParentKey]) return acc;

      if (!acc[inferredParentKey]) acc[inferredParentKey] = new Set();
      acc[inferredParentKey].add(item);
      return acc;
    }, {});

    parentKeys.forEach((parent) => {
      const children = categoriesDataMap[parent] || [];
      const selectedChildren = children.filter((child) =>
        selectedSet.has(child),
      );
      const inferredChildren = inferredChildrenByParent[parent]
        ? Array.from(inferredChildrenByParent[parent]).filter(
          (child) => selectedSet.has(child) && !children.includes(child),
        )
        : [];
      const uniqueSelectedChildren = Array.from(
        new Set([...selectedChildren, ...inferredChildren]),
      );
      const isParentSelected = selectedSet.has(parent);

      if (!isParentSelected && uniqueSelectedChildren.length === 0) return;

      const effectiveSelectedCount = isParentSelected
        ? Math.max(children.length, uniqueSelectedChildren.length)
        : uniqueSelectedChildren.length;

      grouped.push({
        key: parent,
        label:
          effectiveSelectedCount > 0
            ? `${categoriesNameMap[parent] || parent} (${effectiveSelectedCount})`
            : categoriesNameMap[parent] || parent,
        itemsToRemove: [parent, ...children, ...inferredChildren],
      });

      consumed.add(parent);
      children.forEach((child) => consumed.add(child));
      inferredChildren.forEach((child) => consumed.add(child));
    });

    selectedItems.forEach((item) => {
      if (!consumed.has(item)) {
        grouped.push({
          key: item,
          label: categoriesNameMap[item] || item,
          itemsToRemove: [item],
        });
      }
    });

    return grouped;
  };
  const [conversiondata, setconversiondata] = useState();
  const toggleLocationModal = () => setLocationModalOpen(!locationModalOpen);
  const toggletargetModal = () => setTargetModalOpen(!targetModalOpen);
  const togglebrandcategorysModal = () =>
    setBrandcategorysModalOpen(!brandcategorysModalOpen);
  useState("option1");
  const toggleBlockedCategoryModal = () => {
    setBlockedCategoryModalOpen((prev) => !prev);
  };
  const [selectedDevices, setSelectedDevices] = useState({
    desktop: false,
  });
  const [errors, setErrors] = useState({});
  const [activePopup, setActivePopup] = useState({ type: null, index: null });
  const [expanded, setExpanded] = useState({
    region: null,
    subregion: null,
    country: null,
  });
  const [selection, setSelection] = useState({
    regionId: null,
    subregionId: null,
    countryId: null,
    stateId: null,
    cityId: null,
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    cpm_bid: "",
    minimum_bid: "",
    bid_step: "",
    learn_budget: "",
    sample_size_value: "",
    control_group_size: "",
    control_group_sov: "",
    capcount: "",
    capexpire: "",
    dollar_goal: "",
    dollar_goal1: "",
    total_budget: "",
    ad_domain: "",
    iab_category: "",
    blocked_category: "",
    blocked_advertiser: "",
    viewthroughConversionUrl: "",
  });
  const [deviceData, setDevicedata] = useState(() => {
    const selectedDevices = {
      desktop: campaignType === "Desktop (WEB)" ? true : (campaignType === "Advanced Campaign" ? "" : false),
      phone: campaignType === "Mobile (APP)" ? true : (campaignType === "Advanced Campaign" ? "" : false),
      tablet: campaignType === "Mobile (APP)" ? true : (campaignType === "Advanced Campaign" ? "" : false),
      connected_tv: campaignType === "Advanced Campaign" ? "" : false,
    };
    return {
      selectedDevices,
      device_type: (campaignType === "Desktop (WEB)" || campaignType === "Mobile (APP)") ? "specific" : "all",
      make: [],
      model: [],
      model_option: "all",
      all_makes: "all",
      browsers: [],
      browser_option: "all",
      browser_language_option: "all",
      browser_languages: [],
      iab_category: [],
      blocked_category: [],
      blocked_advertiser: [],
      targetwithimpression: false,
      osversion_option: "all",
      os: {
        updated: [
          {
            ostype: campaign?.ostype || "Windows Phone",
            minVersion: "",
            maxVersion: "",
          },
        ],
      },
      pattern: "",
      targetuser: "",
    };
  });
  const [trackedconversion, settrackedconversion] = useState([]);
  const getSelectedConversionNames = () => {
    if (String(formData?.track_conversions ?? "0") !== "1") return [];
    if (Array.isArray(trackedconversion) && trackedconversion.length > 0) {
      return trackedconversion
        .map((item) => item?.name)
        .filter((name) => typeof name === "string" && name.trim());
    }
    if (Array.isArray(formData?.consversion)) return formData.consversion;

    if (Array.isArray(formData?.conversion) && formData.conversion.length > 0) {
      return formData.conversion;
    }
    if (
      typeof formData?.conversion === "string" &&
      formData.conversion.trim()
    ) {
      return formData.conversion
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };
  const handleconversion = (data) => {
    console.log(data);
    setFormData((prev) => ({
      ...prev,
      consversion: data,
    }));

    console.log(formData.consversion);
    setconversiondata(data);
  };
  const handletrackedconversion = (data) => {
    console.log("Tracked conversion data received:", data);
    settrackedconversion(data);
  };
  const handleChangess = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };
  const CustomReactstrapInput = React.forwardRef(({ value, onClick }, ref) => (
    <Input onClick={onClick} value={value} innerRef={ref} />
  ));
  const handleNext = async () => {
    if (step == 3) {
      handledevicedata();
    }
    if (step == 5) {
      handleinventorydata();
    }
    console.log(formData);
    const stepErrors = {};
    if (step === 0) {
      stepErrors.name = (formData.name || "").trim()
        ? ""
        : "This field is required";
      const domainVal = (formData.ad_domain || "").trim();
      if (!domainVal) {
        stepErrors.ad_domain = "Domain Name is required";
      } else {
        const urlPattern = /^(https?:\/\/)?([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,63})(:[0-9]{1,5})?(\/.*)?$/i;
        if (!urlPattern.test(domainVal)) {
          stepErrors.ad_domain = "Please enter a valid URL or Domain name";
        } else {
          stepErrors.ad_domain = "";
        }
      }

      const priceValue = String(formData.price || "").trim();
      if (!priceValue) {
        stepErrors.price = "This field is required";
      } else {
        const n = Number(priceValue);
        stepErrors.price = Number.isFinite(n)
          ? n <= 0
            ? "Value must be greater than 0"
            : n > 100
              ? "Maximum value of the field is $100"
              : ""
          : "Please enter a valid number";
      }
    }

    console.log("stepErrors:", stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...stepErrors }));
    }

    const hasErrors = Object.values(stepErrors).some((error) => error !== "");
    if (hasErrors) {
      await showValidationError();
      return;
    }
    if (
      step === 0 &&
      formData.track_conversions === "1" &&
      trackedconversion.length > 0
    ) {
      const hasPrimary = trackedconversion.some((c) => c.isPrimary);
      if (!hasPrimary) {
        if (!primaryPopupShown) {
          const result = await Swal.fire({
            title: "Primary Conversion",
            text: "There Is No Primary Conversion in the Tracked Events Table. Do You Want To Select A Primary Conversion?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
          });

          if (result.isConfirmed) {
            setPrimaryPopupShown(false);
            return;
          } else {
            setPrimaryPopupShown(true);
            return;
          }
        }
      }
    }
    setPrimaryPopupShown(false);
    nextStep();
  };
  const [geo, setGeo] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [oldValues, setOldValues] = useState(() => {
    const geo = props.campaign?.geo ?? {};
    return JSON.parse(JSON.stringify(geo));
  });

  const [center, setCenter] = useState([44.414165, 8.942184]);
  const [regionss, setRegions] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [subregions, setSubRegions] = useState([]);
  const [country, setCountry] = useState([]);
  const [state, setState] = useState([]);
  const [city, setCity] = useState([]);
  const [showSubRegions, setShowSubRegions] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [showState, setShowState] = useState(false);
  const [showCity, setShowCity] = useState(false);
  const [geoPoints, setGeoPoints] = useState([]);
  const [hyperlocalType, setHyperlocalType] = useState("1");
  const [radiusUnits, setRadiusUnits] = useState("Kilometers");
  const [fileName, setFileName] = useState("");
  const [conversionlist, setconversionlist] = useState([]);
  const [audiencecapturedropdown, setaudiencecapturedropdown] = useState([]);
  const [campaignEdit, setcampaignEdit] = useState(false);

  useEffect(() => {
    console.log("Campaign Editor - geoPoints state:", geoPoints);
  }, [geoPoints]);

  useEffect(() => {
    const wrapper = document.querySelector(".page-body-wrapper");
    if (wrapper) {
      wrapper.style.marginLeft = "0px";
    }
    return () => {
      if (wrapper) {
        wrapper.style.marginLeft = "";
      }
    };
  }, []);
  let campaign_edit_formdata = {};
  const fetchapi = async () => {
    const isEditMode = Boolean(campaign_id);
    const startTime = Date.now();
    if (isEditMode) {
      setIsLoading(true);
    }
    try {
      let loadedEventsToSet = null;
      let hasStructuredConversionEvents = false;
      let mmpIdFromEvents = "";
      if (campaign_id) {
        setcampaignEdit(true);
        const campaign_response = await getcampaign(campaign_id);
        console.log(
          "campaign response : ",
          campaign_response.data.data.informationCampaigns[0],
        );
        let campaign = campaign_response.data.data.informationCampaigns[0];
        let forceEmptyTrackedEvents = false;
        try {
          const clearedKey = `campaignClearedConversions_${campaign_id}`;
          forceEmptyTrackedEvents = sessionStorage.getItem(clearedKey) === "1";
        } catch (e) {
          forceEmptyTrackedEvents = false;
        }

        console.log(
          "audienceCapture:",
          campaign?.campaignVideos?.audienceCapture,
        );
        console.log("impressionCap:", campaign.campaignVideos.audio);
        console.log("campaign  : ", campaign.complete_25);

        if (
          !forceEmptyTrackedEvents &&
          campaign.campaignConversionEvents &&
          Array.isArray(campaign.campaignConversionEvents) &&
          campaign.campaignConversionEvents.length > 0
        ) {
          console.log(
            "Loading existing conversion events:",
            campaign.campaignConversionEvents,
          );
          const uniqueMmpIds = [
            ...new Set(
              campaign.campaignConversionEvents
                .map((e) => e?.mmpId)
                .filter(
                  (v) => v !== undefined && v !== null && String(v).trim(),
                ),
            ),
          ];
          mmpIdFromEvents =
            uniqueMmpIds.length > 0 ? String(uniqueMmpIds[0]) : "";
          const mmpEventsMap = {};

          for (const mmpId of uniqueMmpIds) {
            try {
              const res = await getConversionEvent(mmpId);
              mmpEventsMap[mmpId] = res?.data?.data?.conversionEvents || [];
            } catch (e) {
              console.warn(
                `Failed to fetch conversion events for mmpId=${mmpId}`,
                e,
              );
              mmpEventsMap[mmpId] = [];
            }
          }

          const campaignMmpId = String(campaign.mmpId || "").trim();
          const filteredEvents = (
            campaign.campaignConversionEvents || []
          ).filter(
            (event) =>
              !campaignMmpId ||
              String(event?.mmpId || "").trim() === campaignMmpId,
          );

          const loadedEvents = filteredEvents.map((event) => {
            const mmpId = event?.mmpId;
            const eventId =
              event?.eventId ?? event?.conversionEventId ?? event?.conversionId;
            const eventsForMmp = mmpEventsMap[mmpId] || [];
            const eventDetail = eventsForMmp.find(
              (e) =>
                String(e?.conversionEventId ?? e?.eventId ?? e?.id) ===
                String(eventId),
            );

            return {
              conversionId: eventId,
              isPrimary: Boolean(event?.primaryConversion ?? event?.isPrimary),
              mmpId,
              mmType: eventDetail?.mmType || event?.mmType || "",
              name:
                eventDetail?.eventName ||
                eventDetail?.name ||
                event?.eventName ||
                event?.name ||
                `Event ${eventId}`,
              defaultValue:
                eventDetail?.eventValue ||
                eventDetail?.defaultValue ||
                event?.eventValue ||
                event?.defaultValue ||
                "",
            };
          });

          loadedEventsToSet = loadedEvents;
          hasStructuredConversionEvents = true;
        } else if (forceEmptyTrackedEvents) {
          loadedEventsToSet = [];
          hasStructuredConversionEvents = true;
        }

        const resolvedLinkedAds = await resolveLinkedAdsDetails(campaign);

        const normalizeDeals = (value) => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          if (typeof value === "string") {
            const trimmed = value.trim();
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) return parsed;
            } catch (e) {
            }
            const ids = trimmed
              .replace(/[^0-9,]/g, "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((n) => Number(n));
            return ids;
          }
          return [];
        };

        campaign_edit_formdata = {
          customerId: "",
          advanced_audio: campaign.advancedAudio,
          advanced_video: campaign.advancedVideo,

          page_position: normalizePagePosition(
            campaign.pagePosition || campaign?.campaignVideos?.page_position,
            false,
          ),

          brand_id:
            campaign.brandId ||
            campaign.brand_id ||
            campaign?.groups?.brandId ||
            campaign?.groups?.brand_id ||
            brandId ||
            location.state?.brandId ||
            localStorage.getItem("currentBrandId") ||
            "",
          devices_data: {},
          consversion: forceEmptyTrackedEvents
            ? []
            : campaign.conversion
              ? campaign.conversion.split(",")
              : [],
          bid_shading: campaign.bidShading,

          status:
            campaign.status?.toLowerCase() === "offline" ||
              campaign.status === "OFF"
              ? "Offline"
              : "runnable",
          campaign_type: campaign?.campaignType || "CPA",
          bidshading_Multiplier: normalizeBidMultiplier(
            campaign?.bidshadingMultiplier,
          ),
          bid_Multiplier: normalizeBidMultiplier(campaign?.bidMultiplier), // bidMultiplier
          forensiq: "",
          regions: "",
          cpm_bid: campaign.cpmBid,
          app_web_id: campaign.appWebId,
          app_web_name: campaign.appWebName,
          externalname: getCampaignExternalName(campaign),
          target_id: "",
          total_budget: campaign.totalBudget,
          budget_limit_daily: "",
          budget_limit_hourly: "",
          rules: [],
          goal: "",
          dollar_goal: "",
          dollar_goal1: "",
          creatives: [],
          region_id: "",
          subregion_id: "",
          country_id: "",
          state_id: "",
          city_id: "",
          price: campaign.price,
          usebid: campaign.usebid,
          cross_device: campaign.crossDevice,
          capspec: String(campaign.capspec),
          capcount: campaign.capcount,
          capexpire: campaign.capexpire,
          capunit: campaign.capunit,
          all_time: campaign.allTime,
          impression_cap: campaign.impressionCap,
          impressionCap_Type: campaign.impressionCap,
          impressionCapValue: getCampaignImpressionCapValue(campaign),
          flight_date: campaign.flightDate,
          Flight_startdate: campaign.activateTime,
          Flight_enddate: campaign.expireTime,
          name: campaign.name,
          ad_domain: campaign.adDomain,
          // Map deals from API into the form as an array of IDs
          deals: normalizeDeals(campaign.deals || campaign.deals),
          click_through_conversion: campaign.click_through_conversion,
          view_through_conversion: campaign.view_through_conversion,
          look_back_window: campaign.lookBackWindow || "24",
          look_back_window1: campaign.lookBackWindow1 || "24",
          conversion_at:
            campaign.conversionAt ?? campaign.conversion_at ?? "100",
          chrome_privacy: campaign.chromePrivacy,
          sandbox_attribution: campaign.sandboxAttribution,
          conversion_user: campaign.conversionUser,
          count_conversion: campaign.countConversion,
          optimize: campaign.optimize,
          goal_status: campaign.goalStatus,
          dollar_goal: campaign.dollarGoal,
          dollar_goal1: campaign.dollarGoal1,
          primary_conversion: campaign.primaryConversion,
          optimize_domain: campaign.optimizeDomain,
          optimization_settings: campaign.optimizationSettings,
          minimum_bid: campaign.minimumBid,
          bid_step: campaign.bidStep,
          learn_budget: campaign.learnBudget,
          learning_scope: campaign.learningScope,
          track_conversions: toBinaryString(
            campaign.trackConversions ??
            campaign.track_conversions ??
            campaign.trackconversion,
            "0",
          ),
          service_provider: campaign.serviceProvider,
          impression_threshold: campaign.impressionThreshold,
          smart_disable: campaign.smartDisable,
          measure_viewability: campaign.measureViewability,
          provider: campaign.provider,
          sampling_rate: campaign.samplingRate,
          standard: campaign.standard,
          brand_protection: campaign.brandProtection,

          Capture_Clicks:
            campaign.captureClicks || campaign.capture_clicks || "",
          Capture_Conversions:
            campaign.captureConversion || campaign.capture_conversion || "",
          complete_25: campaign.complete_25 || "",
          complete_50: campaign.complete_50 || "",
          complete_75: campaign.complete_75 || "",
          complete_100: campaign.complete_100 || "",
          mmpId: campaign.mmpId || mmpIdFromEvents || "",
          mmpType: campaign.mmpType || campaign.mmpName || "",
          conversionUrl: campaign.mmpClickTrackingUrl || "",
          viewthroughConversionUrl: campaign.mmpImpressionTrackingUrl || "",

          ad_optimization: campaign.addOptimization,
          conversion: forceEmptyTrackedEvents
            ? []
            : campaign.conversion
              ? campaign.conversion.split(",")
              : [],
          orientation_matching:
            campaign?.campaignVideos?.orientationMatching || "",

          pacing: String(
            campaign?.pacing?.pacingstatus ?? campaign.pacingstatus ?? "1",
          ),
          pacingstatus: String(
            campaign?.pacing?.pacingstatus ?? campaign.pacingstatus ?? "1",
          ),
          even_spend: String(
            campaign?.pacing?.pacingMode || campaign.even_spend || "1",
          ),
          flight_date: String(
            campaign?.pacing?.flightDate ?? campaign.flightDate ?? "0",
          ),
          Flight_startdate:
            campaign?.pacing?.flightStartDate ||
            campaign.flightStartdate ||
            campaign.flightStartDate ||
            startDate,
          Flight_enddate:
            campaign?.pacing?.flightEndDate ||
            campaign.flightEnddate ||
            campaign.flightEndDate ||
            endDate,
          pacingType:
            campaign?.pacing?.pacingtype || campaign.pacingtype || "Budget",
          placement_type: safeJsonParse(
            campaign?.campaignVideos?.placementType,
            {},
          ),

          roll_position: safeJsonParse(
            campaign?.campaignVideos?.rollPosition,
            {},
          ),

          capture_conversion: {
            Conversions: "",
          },
          player_size: safeJsonParse(campaign?.campaignVideos?.playerSize, {}),

          skippable_ads: safeJsonParse(
            campaign?.campaignVideos?.skippableAds,
            {},
          ),

          playback_method: safeJsonParse(
            campaign?.campaignVideos?.playbackMethod,
            {},
          ),

          playback_method: safeJsonParse(
            campaign?.campaignVideos?.playbackMethod,
            {},
          ),

          audio: (() => {
            const apiAudio = safeJsonParse(campaign?.campaignVideos?.audio, {});

            return {
              music: apiAudio.music || false,
              fm_am: apiAudio.fm_am || false,
              Podcast: apiAudio.Podcast || false,
              catch_up: apiAudio.catch_up || false,

              Webradio: apiAudio.web || false,
              Videogame: apiAudio.video || false,
              Textto_speech: apiAudio.text || false,
              Feedtype_unknown: apiAudio.feed || false,
            };
          })(),

          page_position: normalizePagePosition(
            campaign.pagePosition || campaign?.campaignVideos?.page_position,
            false,
          ),

          audience_capture: normalizeAudienceCapture(
            campaign?.campaignVideos?.audienceCapture ||
            campaign?.audience_capture,
            {
              complete_25: campaign.complete_25,
              complete_50: campaign.complete_50,
              complete_75: campaign.complete_75,
              complete_100: campaign.complete_100,
            },
          ),

          inventory_exchange: campaign.campaignInventories
            ? campaign.campaignInventories.map((item) => ({
              campaignInventoryId: item.campaignInventoryId,
              domainappname: item.domainappname,
              domainappid: item.domainappid,
              appstorename: item.appstorename,
              cpmbidrange: item.cpmbidrange,
              exchanges: item.exchanges || [],
            }))
            : [],

          inventory_domain: campaign.campaignDomains
            ? campaign.campaignDomains.map((item) => ({
              campaignDomainId: item.campaignDomainId,
              domainListId: item.domainListId,
              name: item.name,
              listType: item.listType,
              domainListCount: item.domainListCount,
              domains: item.domains || [],
              checked: item.checked || false,
            }))
            : [],

          inventory_exclude_ads_txt:
            campaign.excludeAdsTxt ??
            campaign?.groups?.campaigns?.[0]?.excludeAdsTxt ??
            false,

          inventory_target_direct:
            campaign.targetDirect ??
            campaign?.groups?.campaigns?.[0]?.targetDirect ??
            false,

          inventory_opt_supply:
            campaign.optSupply ??
            campaign?.groups?.campaigns?.[0]?.optSupply ??
            false,

          inventory_opt_made:
            campaign.optMade ??
            campaign?.groups?.campaigns?.[0]?.optMade ??
            false,

          linkedAds: resolvedLinkedAds,

          goal_str: campaign.goalStr,
          evalution_group: campaign.evalutionGroup,
          sample_size_value: campaign.sampleSizeValue,
          evalution_period: campaign.evalutionPeriod,
          sample_value: campaign.sampleValue,
          control_group_size: campaign.controlGroupSize,
          control_group_sov: campaign.controlGroupSov,
          notes: campaign.notes,
          reward_status: safeJsonParse(
            campaign?.campaignVideos?.rewardStatus,
            {},
          ),
        };

        console.log("🔥 BEFORE setFormData:", {
          exclude: campaign.excludeAdsTxt,
          target: campaign.targetDirect,
          supply: campaign.optSupply,
          made: campaign.optMade,
        });

        console.log(
          "campaign brand_id:",
          campaign.brandId || campaign.brand_id,
        );
        console.log("🔥 campaign_edit_formdata URL values:", {
          conversionUrl: campaign_edit_formdata.conversionUrl,
          viewthroughConversionUrl:
            campaign_edit_formdata.viewthroughConversionUrl,
        });
        setCampaign(campaign); // Set the campaign state so effects can run
        setFormData(campaign_edit_formdata);
        if (resolvedLinkedAds) {
          setOriginalCreativeIds(
            resolvedLinkedAds
              .map((ad) => Number(ad.creativesId))
              .filter(Boolean),
          );
        }
        setConversionUrlTouched({
          conversionUrl: false,
          viewthroughConversionUrl: false,
        });
        if (loadedEventsToSet !== null) {
          settrackedconversion(loadedEventsToSet);
        }

        // Initialize audience dropdown states from API data
        if (campaign.captureClicks || campaign.capture_clicks)
          setAudienceType(campaign.captureClicks || campaign.capture_clicks);
        if (campaign.captureConversion || campaign.capture_conversion)
          setAudienceType1(
            campaign.captureConversion || campaign.capture_conversion,
          );
        if (campaign.complete_25) setAudienceType_25(campaign.complete_25);
        if (campaign.complete_50) setAudienceType_50(campaign.complete_50);
        if (campaign.complete_75) setAudienceType_75(campaign.complete_75);
        if (campaign.complete_100) setAudienceType_100(campaign.complete_100);

        const rawCat =
          campaign.iabCategory ||
          campaign.iab_category ||
          campaign.brandCategory;
        if (rawCat) {
          setSelectedCategory(normalizeStringList(rawCat));
        } else {
          setSelectedCategory([]);
        }
        const pacingPayload = campaign.pacing || {};
        const payloadStart =
          pacingPayload.flightStartDate ||
          campaign.flightStartdate ||
          campaign.flightStartDate;
        const payloadEnd =
          pacingPayload.flightEndDate ||
          campaign.flightEnddate ||
          campaign.flightEndDate;
        setPacingType(
          pacingPayload.pacingtype || campaign.pacingtype || "Budget",
        );
        setStartDate(payloadStart ? new Date(payloadStart) : startDate);
        setEndDate(payloadEnd ? new Date(payloadEnd) : endDate);
        console.log(formData);
        console.log(trackedconversion);
        smartsetGoalType(campaign.goalStatus);
        setGoalType(campaign.goalStatus);
        setImpressionCapType(campaign.impressionCap || "None");

        setImpressionCapValue(
          campaign.impressionCap !== "None"
            ? getCampaignImpressionCapValue(campaign)
            : "",
        );
        setFormData((prev) => ({
          ...prev,
          impression_cap: campaign.impressionCap || "None",
          impressionCap_Type: campaign.impressionCap || "None",
          impressionCapValue: getCampaignImpressionCapValue(campaign),
        }));

        const daypartRaw =
          campaign.day_parting_utc ||
          campaign.dayPartingUtc ||
          campaign.daypartSchedule;

        const hasDaypartingToggle =
          campaign.dayparting === true ||
          campaign.dayparting === "1" ||
          campaign.dayparting === 1 ||
          campaign.dayParting === true ||
          campaign.dayParting === "1" ||
          campaign.dayParting === 1;

        if (daypartRaw) {
          try {
            const parsed =
              typeof daypartRaw === "string"
                ? JSON.parse(daypartRaw)
                : daypartRaw;
            if (parsed && typeof parsed === "object") {
              const hasData = Array.isArray(parsed)
                ? parsed.length > 0
                : Object.keys(parsed).length > 0;
              if (hasData) {
                setDaypartSchedule(parsed);
                setShowDaypart(true);
              } else {
                setDaypartSchedule(null);
                setShowDaypart(hasDaypartingToggle);
              }
            } else {
              setDaypartSchedule(null);
              setShowDaypart(hasDaypartingToggle);
            }
          } catch (e) {
            console.warn("Failed to parse day_parting_utc:", e);
            setDaypartSchedule(null);
            setShowDaypart(hasDaypartingToggle);
          }
        } else {
          setDaypartSchedule(null);
          setShowDaypart(hasDaypartingToggle);
        }
        console.log(campaign.campaignTargetDevices.make);
        console.log(typeof campaign.campaignTargetDevices.make);

        const persistedDeviceId =
          campaign?.campaignTargetDevices?.deviceId ?? campaign?.deviceId;

        let devicedata = {
          selectedDevices: {
            desktop: campaign.campaignTargetDevices.desktop,
            phone: campaign.campaignTargetDevices.phone,
            tablet: campaign.campaignTargetDevices.tablet,
            connected_tv: campaign.campaignTargetDevices.connectedTv,
          },
          device_type: campaign.campaignTargetDevices.deviceType,
          targetwithimpression: toBoolean(persistedDeviceId),
          osversion_option: campaign.osversionOption,

          make: campaign?.campaignTargetDevices?.make?.split(",") || [],
          model: campaign?.campaignTargetDevices?.model?.split(",") || [],
          model_option: campaign.campaignTargetDevices.modelOption,
          all_makes: campaign.campaignTargetDevices.all_makes,
          browsers: (campaign?.campaignTargetDevices?.browsers || "")
            .replace(/[{}]/g, "")
            .split(",")
            .filter(Boolean),
          browser_option: campaign.campaignTargetDevices.browserOption,
          browser_language_option:
            campaign.campaignTargetDevices.browserLanguageOption,
          browser_languages:
            campaign?.campaignTargetDevices?.browserLanguages?.split(",") || [],
          iab_category: campaign.campaignTargetDevices.iabWhitelist,
          blocked_category: campaign.campaignTargetDevices.blockedCategory,
          blocked_advertiser: campaign.campaignTargetDevices.blockedAdvertiser,
          os: {
            updated: (campaign.campaignOsVersions || []).map((item) => ({
              id: item.id,
              ostype: item.ostype,
              minVersion: item.minVersion || "",
              maxVersion: item.maxVersion || "",
            })),
          },

          pattern: "",
          targetuser: "",
        };
        if (campaign.campaignTargetDevices) {
          const { desktop, phone, tablet, connectedTv } = campaign.campaignTargetDevices;
          let type = "Advanced Campaign";
          if (desktop && !phone && !tablet && !connectedTv) {
            type = "Desktop (WEB)";
          } else if (!desktop && (phone || tablet) && !connectedTv) {
            type = "Mobile (APP)";
          }
          setCampaignType(type);
        }
        setDevicedata(devicedata);
      }
      const targetBrandId =
        normalizeBrandId(
          campaign_id ? campaign_edit_formdata.brand_id : brandId,
        ) ||
        normalizeBrandId(location.state?.brandId) ||
        normalizeBrandId(localStorage.getItem("currentBrandId")) ||
        normalizeBrandId(DEFAULT_BRAND_ID);
      const response = await getConversionlist();
      const response2 = targetBrandId
        ? await editAudiencebrand(targetBrandId)
        : await getAudiencelist();

      console.log(response2);
      if (
        response &&
        response.data &&
        response.data.data &&
        response.data.data.informationConversion
      ) {
        setconversionlist(response.data.data.informationConversion);
        if (!hasStructuredConversionEvents) {
          try {
            const legacyNames = Array.isArray(campaign_edit_formdata.conversion)
              ? campaign_edit_formdata.conversion
              : [];
            const legacyNameSet = new Set(
              legacyNames.map((n) => String(n || "").trim()).filter(Boolean),
            );
            const mmpId = String(campaign_edit_formdata.mmpId || "").trim();
            if (mmpId) {
              const res = await getConversionEvent(mmpId);
              const events = res?.data?.data?.conversionEvents || [];
              const hydrated = events
                .filter(
                  (e) =>
                    legacyNameSet.has(
                      String(e?.eventName || e?.name || "").trim(),
                    ) ||
                    legacyNameSet.has(
                      String(
                        e?.conversionEventId ?? e?.eventId ?? e?.id ?? "",
                      ).trim(),
                    ),
                )
                .map((e) => ({
                  conversionId: e.conversionEventId || e.eventId || e.id,
                  isPrimary: false,
                  mmpId,
                  mmType: e.mmType || "",
                  name: (e.eventName || e.name || "").trim(),
                  defaultValue: e.eventValue || e.defaultValue || "",
                }));
              settrackedconversion(hydrated);
            }
          } catch (e) {
            console.warn("Legacy conversion hydration failed:", e);
          }
        }
      }
      if (
        response2 &&
        response2.data &&
        response2.data.data &&
        response2.data.data.informationAudiences
      ) {
        const audiences = response2?.data?.data?.informationAudiences;
        setaudiencecapturedropdown(Array.isArray(audiences) ? audiences : []);
      }
    } finally {
      if (isEditMode) {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      }
    }
  };
  const [searchTerms, setSearchTerms] = useState({
    region: "",
    subregion: "",
    country: "",
    state: "",
    city: "",
  });

  useEffect(() => {
    console.log("trackedconversion updated:", trackedconversion);
  }, [trackedconversion]);

  const [showNoSubregionPopup, setShowNoSubregionPopup] = useState(false);
  const [showNoCountryPopup, setShowNoCountryPopup] = useState(false);
  const [showNoStatePopup, setShowNoStatePopup] = useState(false);
  const [showNoCityPopup, setShowNoCityPopup] = useState(false);
  const [selectedCities, setSelectedCities] = useState([]);
  const [showDaypart, setShowDaypart] = useState(false);
  const [impressionCapType, setImpressionCapType] = useState("None");
  const [impressionCapValue, setImpressionCapValue] = useState("10000");
  const [goalType, setGoalType] = useState("Cost Per Click (eCPC)");
  const [goalValue, setGoalValue] = useState("");
  const [pacingType, setPacingType] = useState("Budget");
  const [pacingValue, setPacingValue] = useState("");
  const [smartgoalType, smartsetGoalType] = useState("Cost Per Click (eCPC)");
  const [smartgoalValue, smartsetGoalValue] = useState("");
  const [audienceType, setAudienceType] = useState("");
  const [audienceType_25, setAudienceType_25] = useState("");
  const [audienceType_50, setAudienceType_50] = useState("");
  const [audienceType_75, setAudienceType_75] = useState("");
  const [audienceType_100, setAudienceType_100] = useState("");
  const [audienceType1, setAudienceType1] = useState("");
  const [goalstr, setGoalStr] = useState("CTR");
  const [evalutiongroup, setEvalutionGroup] = useState("");
  const [evalutionperiod, setEvalutionPeriod] = useState("");
  const [samplevalue, setSamplevalue] = useState("");

  const evalutiongroupOptions = [
    { label: "Control Group", value: "Control Group" },
    { label: "Challange Group", value: "Challange Group" },
  ];

  const filteredRegions = regionss.filter((region) =>
    region.name.toLowerCase().includes(searchTerms.region.toLowerCase()),
  );

  const filteredSubregions = subregions.filter((sub) =>
    sub.name.toLowerCase().includes(searchTerms.subregion.toLowerCase()),
  );

  const filteredCountry = country.filter((country) =>
    country.name.toLowerCase().includes(searchTerms.country.toLowerCase()),
  );

  const filteredStates = state.filter((state) =>
    state?.name.toLowerCase().includes(searchTerms.state.toLowerCase()),
  );

  const filteredCities = city.filter((city) =>
    city.name.toLowerCase().includes(searchTerms.city.toLowerCase()),
  );

  useEffect(() => {
    const hasValidIds = filteredSubregions.some((s) => s.id);
    if (!hasValidIds && selection.regionId) {
      const timer = setTimeout(() => {
        setShowNoSubregionPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoSubregionPopup(false);
    }
  }, [filteredSubregions, selection.regionId]);

  useEffect(() => {
    const hasValidIds = filteredCountry.some((c) => c.id);
    if (!hasValidIds && selection.subregionId) {
      const timer = setTimeout(() => {
        setShowNoCountryPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCountryPopup(false);
    }
  }, [filteredCountry, selection.subregionId]);
  useEffect(() => {
    const hasValidIds = filteredSubregions.some((s) => s.id);
    if (!hasValidIds && selection.regionId) {
      const timer = setTimeout(() => {
        setShowNoSubregionPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoSubregionPopup(false);
    }
  }, [filteredSubregions, selection.regionId]);

  useEffect(() => {
    const hasValidIds = filteredStates.some((s) => s.id);
    if (!hasValidIds && selection.countryId) {
      const timer = setTimeout(() => {
        setShowNoStatePopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoStatePopup(false);
    }
  }, [filteredStates, selection.countryId]);

  useEffect(() => {
    const hasValidIds = filteredCities.some((c) => c.id);
    if (!hasValidIds && selection.stateId) {
      const timer = setTimeout(() => {
        setShowNoCityPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCityPopup(false);
    }
  }, [filteredCities, selection.stateId]);

  const substeps = [
    { key: "video", label: "Video" },
    { key: "audio", label: "Audio" },
    { key: "capture", label: "Audience Capture" },
  ];

  const [activeStep, setActiveStep] = useState("video");
  const initialGoal = 1;
  const initialGoal1 = 1;

  const goalValues = {
    0: "$1.00",
    1: "$5.00",
    2: "$10.00",
    3: "$15.00",
    4: "$20.00",
    5: "$25.00",
  };

  const goalValues1 = {
    0: "$1.00",
    1: "$5.00",
    2: "$10.00",
    3: "$15.00",
    4: "$20.00",
    5: "$25.00",
    6: "$8.00",
  };

  useEffect(() => {
    const hasValidIds = filteredCountry.some((c) => c.id);
    if (!hasValidIds && selection.subregionId) {
      const timer = setTimeout(() => {
        setShowNoCountryPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCountryPopup(false);
    }
  }, [filteredCountry, selection.subregionId]);

  useEffect(() => {
    const hasValidIds = filteredStates.some((s) => s.id);
    if (!hasValidIds && selection.countryId) {
      const timer = setTimeout(() => {
        setShowNoStatePopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoStatePopup(false);
    }
  }, [filteredStates, selection.countryId]);

  useEffect(() => {
    const hasValidIds = filteredCities.some((c) => c.id);
    if (!hasValidIds && selection.stateId) {
      const timer = setTimeout(() => {
        setShowNoCityPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowNoCityPopup(false);
    }
  }, [filteredCities, selection.stateId]);

  const initialFormData = {
    customerId: "",
    advanced_audio: "",
    advanced_video: "",
    page_position: "",
    ad_optimization: "",

    devices_data: {},
    groupid: groupid,
    brand_id:
      normalizeBrandId(brandId) || normalizeBrandId(campaign?.brand_id) || normalizeBrandId(DEFAULT_BRAND_ID),
    consversion: [],
    sample_value: "Conversion",
    evalution_period: "18",
    evalution_group: "Challange_group",
    goal_str: "CTR",
    initialStatus: "On",
    campaign_type: "CPA",
    name: "",
    ad_domain: "",
    app_web_id: "",
    app_web_name: "",
    status: "Offline",
    forensiq: "true",
    regions: "US",
    cpm_bid: "0.01",
    target_id: "",
    total_budget: "$ 100.00",
    budget_limit_daily: "",
    budget_limit_hourly: "",
    capspec: "0",
    capcount: "1",
    capexpire: "3",
    capunit: "Hours",
    rules: [],
    optimize: "0",
    goal: initialGoal.toString(),
    goal1: initialGoal1.toString(),
    dollar_goal: goalValues[initialGoal],
    dollar_goal1: goalValues1[initialGoal1],
    creatives: [],
    region_id: "",
    subregion_id: "",
    end_date: "",
    country_id: "",
    state_id: "",
    city_id: "",
    device_type: (campaignType === "Desktop (WEB)" || campaignType === "Mobile (APP)") ? "specific" : "all",
    all_time: "1",
    pacing: "1",
    service_provider: "0",
    even_spend: "1",
    provider: "1",
    optimize_domain: "0",
    minimum_bid: "$ 100.00",
    bid_step: "$0.01",
    learn_budget: "$400.00",
    track_conversions: "0",
    learning_scope: "1",
    measure_viewability: "0",
    standard: "1",
    orientation_matching: "1",

    usebid: false,
    bid_shading: "",
    smart_disable: "1",
    impression_threshold: "1000",
    bid_Multiplier: DEFAULT_BID_MULTIPLIER,
    bidshading_Multiplier: DEFAULT_BID_MULTIPLIER,

    make: [],
    model: [],
    category: [],
    carrier: "all",

    flight_date: "0",
    impressionCapValue: "$100.00",
    sample_size_value: "10,000",
    control_group_size: "20%",
    control_group_sov: "78%",

    placement_type: {
      instream: "",
      Accompanying: "",
      Standalone: "",
      Unknown: "",
      Interstitial: "",
    },
    roll_position: {
      preroll: "",
      midroll: "",
      postroll: "",
      unknown: "",
    },
    capture_conversion: {
      Conversions: "",
    },
    player_size: {
      small_player: "",
      unknown_player: "",
    },
    skippable_ads: {
      Skippable: "",
      Non_skippable: "",
      Skippability: "",
    },
    playback_method: {
      soundOn: "",
      soundOff: "",
      click_to_play: "",
      Mouseover: "",
      Playback: "",
    },
    reward_status: {
      Rewarded: "",
      Unrewarded: "",
      UnknownReward: "",
    },
    orientation_matching: "0",

    audience_capture: {
      Clicks: "",
      Conversions: "",
      Audio: "",
      complete_25: "",
      complete_50: "",
      complete_75: "",
      complete_100: "",
      _enabled: false,
    },
    audio: {
      music: "",
      fm_am: "",
      Podcast: "",
      catch_up: "",
      Webradio: "",
      Videogame: "",
      Textto_speech: "",
      Feedtype_unknown: "",
    },

    page_position: {
      above_fold: false,
      below_fold: false,
      page_unknown: false,
      _enabled: false,
    },

    price: 0,
    iab_category: [],
    blocked_category: [],
    blocked_advertiser: "",
    location_targets: [],
    latitude: [],
    longitude: [],
    range: [],
    language: [],
    click_through_conversion: true,
    look_back_window: "24",
    look_back_window1: "24",
    view_through_conversion: true,
    conversion_at: "100",
    chrome_privacy: true,
    count_conversion: "1",
    conversion_user: "2 Days",
    conversionUrl: "",
    viewthroughConversionUrl: "",
    cross_device: false,
    impression_cap: "None",
    impressionCap_Type: "None",
    impressionCapValue: "10000",
    Flight_startdate: startDate,
    Flight_enddate: endDate,
    goal_status: "",
    sampling_rate: "",

    Capture_Clicks: "",
    Capture_Conversions: "",
    complete_25: "",
    complete_50: "",
    complete_75: "",
    complete_100: "",

    inventory_data: {},
    inventory_exchange: [],
    inventory_domain: [],
    inventory_exclude_ads_txt: false,
    inventory_target_direct: false,
    inventory_opt_supply: false,
    inventory_opt_made: false,
    linkedAds: [],
    mmpId: "",
    mmpType: "",
  };

  const [openExchanges, setOpenExchanges] = useState(false);
  const [isAllExchangesSelected, setIsAllExchangesSelected] = useState(false);
  const toggleSelectAllExchanges = () => {
    if (isAllExchangesSelected) {
      setFormData({ ...formData, exchanges: [] });
      setIsAllExchangesSelected(false);
    } else {
      const allValues = getSelectedExchangeOptions().map((o) => o.value);
      setFormData({ ...formData, exchanges: allValues });
      setIsAllExchangesSelected(true);
    }
  };

  const storageKey = `campaignEditorForm_${id || campaign_id || "new"}`;
  const stepStorageKey = `campaignEditorStep_${id || campaign_id || "new"}`;
  const [formData, setFormData] = useState(() => {
    if (!isEditMode) {
      return initialFormData;
    }

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialFormData,
          ...parsed,
          brand_id: initialFormData.brand_id,
        };
      }
    } catch (e) { }
    return initialFormData;
  });
  const [openRules, setOpenRules] = useState(false);
  const [urlEditor, setUrlEditor] = useState({
    isOpen: false,
    field: "",
    label: "",
    value: "",
  });
  const [isEditingConversionUrls, setIsEditingConversionUrls] = useState(false);
  const [conversionUrlDraft, setConversionUrlDraft] = useState({
    conversionUrl: "",
    viewthroughConversionUrl: "",
  });
  const [conversionUrlTouched, setConversionUrlTouched] = useState({
    conversionUrl: false,
    viewthroughConversionUrl: false,
  });
  const [conversionParametersModal, setConversionParametersModal] = useState({
    isOpen: false,
    field: "",
    title: "",
  });
  const hasNonEmptyUrl = (value) => Boolean(String(value || "").trim());

  const getLoadedConversionUrlValue = (field) => {
    if (field === "conversionUrl") {
      return String(
        campaign?.mmpClickTrackingUrl || campaign?.conversionUrl || "",
      );
    }

    if (field === "viewthroughConversionUrl") {
      return String(
        campaign?.mmpImpressionTrackingUrl ||
        campaign?.viewthroughConversionUrl ||
        "",
      );
    }

    return "";
  };

  const getConversionUrlValue = (field) => {
    if (!field) return "";
    const draftValue = String(
      isEditingConversionUrls
        ? conversionUrlDraft?.[field] || ""
        : formData?.[field] || "",
    );

    if (draftValue.trim()) {
      return draftValue;
    }

    if (conversionUrlTouched?.[field]) {
      return "";
    }

    return getLoadedConversionUrlValue(field);
  };

  const getCurrentConversionUrlValue = (field) =>
    String(formData?.[field] || "").trim()
      ? String(formData?.[field] || "")
      : conversionUrlTouched?.[field]
        ? ""
        : getLoadedConversionUrlValue(field);

  const markConversionUrlTouched = (field) => {
    setConversionUrlTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };
  const openUrlEditor = (field, label) => {
    setUrlEditor({
      isOpen: true,
      field,
      label,
      value: getCurrentConversionUrlValue(field),
    });
  };

  const closeUrlEditor = () => {
    setUrlEditor({
      isOpen: false,
      field: "",
      label: "",
      value: "",
    });
  };

  const saveUrlEditor = () => {
    const { field, value } = urlEditor;
    if (!field) {
      closeUrlEditor();
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
    closeUrlEditor();
  };

  const startEditingConversionUrls = () => {
    setConversionUrlDraft({
      conversionUrl: getCurrentConversionUrlValue("conversionUrl"),
      viewthroughConversionUrl: getCurrentConversionUrlValue(
        "viewthroughConversionUrl",
      ),
    });
    setIsEditingConversionUrls(true);
  };

  const cancelEditingConversionUrls = () => {
    setConversionUrlDraft({
      conversionUrl: getCurrentConversionUrlValue("conversionUrl"),
      viewthroughConversionUrl: getCurrentConversionUrlValue(
        "viewthroughConversionUrl",
      ),
    });
    setIsEditingConversionUrls(false);
  };
  const saveEditingConversionUrls = () => {
    setFormData((prev) => ({
      ...prev,
      conversionUrl: conversionUrlDraft.conversionUrl,
      viewthroughConversionUrl: conversionUrlDraft.viewthroughConversionUrl,
    }));
    setFormErrors((prev) => ({
      ...prev,
      conversionUrl: "",
      viewthroughConversionUrl: "",
    }));
    setIsEditingConversionUrls(false);
  };

  const openConversionParametersModal = (field, title) => {
    setConversionParametersModal({
      isOpen: true,
      field,
      title: title || "Edit Parameters",
    });
  };

  const closeConversionParametersModal = () => {
    setConversionParametersModal({
      isOpen: false,
      field: "",
      title: "",
    });
  };

  const applyConversionParameters = ({ url }) => {
    const field = conversionParametersModal.field;
    if (!field) return;

    const nextValue = String(url || "");

    if (isEditingConversionUrls) {
      setConversionUrlDraft((prev) => ({
        ...prev,
        [field]: nextValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: nextValue,
      }));
    }

    setFormErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  useEffect(() => {
    const isEditMode = Boolean(campaign_id);
    if (isEditMode && !campaign) {
      return;
    }

    if (
      isEditMode &&
      campaign &&
      String(formData.mmpId || "").trim() ===
      String(campaign.mmpId || "").trim()
    ) {
      return;
    }

    const selectedMmpId = String(formData.mmpId || "").trim();
    if (!selectedMmpId) {
      setFormData((prev) => {
        if (
          isEditMode &&
          (prev.conversionUrl ||
            prev.viewthroughConversionUrl ||
            campaign?.mmpClickTrackingUrl ||
            campaign?.mmpImpressionTrackingUrl)
        ) {
          return {
            ...prev,
            conversionUrl:
              prev.conversionUrl || campaign?.mmpClickTrackingUrl || "",
            viewthroughConversionUrl:
              prev.viewthroughConversionUrl ||
              campaign?.mmpImpressionTrackingUrl ||
              "",
          };
        }

        if (!prev.conversionUrl && !prev.viewthroughConversionUrl) {
          return prev;
        }
        return {
          ...prev,
          conversionUrl: "",
          viewthroughConversionUrl: "",
        };
      });
      return;
    }

    const selectedConversion = (
      Array.isArray(conversionlist) ? conversionlist : []
    ).find(
      (item) =>
        String(getConversionIdValue(item) || "").trim() === selectedMmpId,
    );
    if (!selectedConversion) return;

    const resolvedPid = selectedConversion?.pid || "maibiztecnx_int";
    const nextConversionUrl = buildConversionTrackingUrl({
      baseUrl: selectedConversion?.baseUrl,
      pid: resolvedPid,
      campaignName: formData.name,
      campaignExternalName: formData.externalname,
      appWebName: formData.app_web_name,
      clickLookback: formData.look_back_window,
      viewLookback: formData.look_back_window1,
    });
    const nextViewthroughUrl = buildConversionTrackingUrl({
      baseUrl: selectedConversion?.impressionUrl || selectedConversion?.baseUrl,
      pid: resolvedPid,
      campaignName: formData.name,
      campaignExternalName: formData.externalname,
      appWebName: formData.app_web_name,
      clickLookback: formData.look_back_window,
      viewLookback: formData.look_back_window1,
    });
    setFormData((prev) =>
      prev.conversionUrl === nextConversionUrl &&
        (prev.viewthroughConversionUrl || "") === nextViewthroughUrl
        ? prev
        : {
          ...prev,
          conversionUrl: nextConversionUrl,
          viewthroughConversionUrl: nextViewthroughUrl,
        },
    );
  }, [
    conversionlist,
    formData.mmpId,
    formData.name,
    formData.externalname,
    formData.look_back_window,
    formData.look_back_window1,
    campaign,
  ]);

  useEffect(() => {
    console.log("🔥 FINAL formData:", {
      exclude: formData.inventory_exclude_ads_txt,
      target: formData.inventory_target_direct,
      supply: formData.inventory_opt_supply,
      made: formData.inventory_opt_made,
    });
  }, [formData]);

  useEffect(() => {
    if (isEditMode) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (e) { }
    }
    setGoalStr(formData.goal_str || "CTR");
    setEvalutionGroup(formData.evalution_group || "Control Group");
    setEvalutionPeriod(formData.evalution_period || "18 hours");
    setSamplevalue(formData.sample_value || "conversion");
  }, [formData, isEditMode, storageKey]);

  useEffect(() => {
    if (isEditMode) return;

    setFormData(initialFormData);
    setStep(0);
    setActiveSubTab("basics");

    try {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(stepStorageKey);
    } catch (e) { }
  }, [isEditMode, storageKey, stepStorageKey]);
  useEffect(() => {
    if (deviceData && Object.keys(deviceData).length > 0) {
      console.log("Syncing deviceData to formData.devices_data");
      setFormData((prev) => ({
        ...prev,
        devices_data: deviceData,
        targetwithimpression: Boolean(deviceData.targetwithimpression),
      }));
    }
  }, [deviceData]);

  const handleInputChange = (e, nameOverride = null) => {
    if (Array.isArray(e)) {
      const name = nameOverride;
      setFormData((prev) => ({
        ...prev,
        [name]: e,
      }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e, cityId) => {
    const isChecked = e.target.checked;
    const cityIdStr = String(cityId);
    setSelectedCities((prevSelected) => {
      let updatedCities;
      if (isChecked) {
        updatedCities = [...prevSelected, cityIdStr];
      } else {
        updatedCities = prevSelected.filter((id) => id !== cityIdStr);
      }
      setFormData((prev) => {
        const existing = prev.location_targets || [];

        const updated = existing.map((entry) => {
          if (entry.region_id === selection.regionId) {
            return {
              ...entry,
              city_id: updatedCities,
            };
          }
          return entry;
        });

        return {
          ...prev,
          location_targets: updated,
        };
      });

      return updatedCities;
    });
  };

  const toArray = (val) => {
    if (Array.isArray(val)) return val.map((s) => String(s).trim());
    if (typeof val === "string") return val.split(",").map((s) => s.trim());
    return [];
  };

  const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

  useEffect(() => {
    const camp = props?.campaign; // safer
    if (
      camp &&
      camp.geo !== undefined &&
      camp.geo.length !== 0 &&
      camp.geo[0] !== 0
    ) {
      setGeo(camp.geo);
      setZoom(8);
      setCenter([camp.geo[0], camp.geo[1]]);
    } else {
      setGeo([]);
      setZoom(1);
      setCenter([44.414165, 8.942184]);
    }
  }, [props.campaign]);

  const updateGeo = (pos) => {
    if (pos === undef) {
      if (oldValues === undef) pos = [];
      else pos = oldValues;
    }

    for (var i = pos.length - 3; i >= 0; i -= 3) {
      if (pos[i] === 0) {
        pos.splice(i, 3);
      }
    }
    campaign.geo = pos;
    setCampaign(campaign);
    redraw();
  };




  const handledevicedata = () => {
    if (!modalRef.current) {
      return;
    }

    if (typeof modalRef.current.handledevicedata !== "function") {
      console.warn(
        "❌ handledevicedata method not found on Devices component",
        {
          ref: modalRef.current,
          methods: Object.getOwnPropertyNames(modalRef.current),
        },
      );
      return;
    }

    try {
      console.log("✓ Calling handledevicedata from parent");
      const data = modalRef.current.handledevicedata();
      console.log("✓ Received device data from child:", data);

      if (data && Object.keys(data).length > 0) {
        setFormData((prev) => ({
          ...prev,
          devices_data: {
            ...data,
          },
        }));
        console.log("✓ Form data updated with fresh device data");
      }
    } catch (error) {
      console.error("❌ Error getting device data:", error);
    }
  };

  const handleinventorydata = () => {
    const inventorydata = inventoryref.current.inventorydata();
    console.log("received:", inventorydata);
    setFormData((prev) => ({
      ...prev,
      inventory_data: { ...inventorydata },
      inventory_exchange: inventorydata.data || prev.inventory_exchange,
      inventory_domain: inventorydata.domain || prev.inventory_domain,
      inventory_exclude_ads_txt:
        inventorydata.exclude_ads_txt ?? prev.inventory_exclude_ads_txt,
      inventory_target_direct:
        inventorydata.target_direct ?? prev.inventory_target_direct,
      inventory_opt_supply:
        inventorydata.opt_supply ?? prev.inventory_opt_supply,
      inventory_opt_made: inventorydata.opt_made ?? prev.inventory_opt_made,
    }));
    console.log(formData);
  };

  const handleInventoryChange = (inventoryData) => {
    setFormData((prev) => ({
      ...prev,
      inventory_data: { ...inventoryData },
      inventory_exchange: inventoryData.data || prev.inventory_exchange,
      inventory_domain: inventoryData.domain || prev.inventory_domain,
      inventory_exclude_ads_txt:
        inventoryData.exclude_ads_txt ?? prev.inventory_exclude_ads_txt,
      inventory_target_direct:
        inventoryData.target_direct ?? prev.inventory_target_direct,
      inventory_opt_supply:
        inventoryData.opt_supply ?? prev.inventory_opt_supply,
      inventory_opt_made: inventoryData.opt_made ?? prev.inventory_opt_made,
    }));
  };

  const [selectedIndex, setSelectedIndex] = useState(0);

  const rows = ["Deals (0)", "Deals Groups (0)"];

  const [selectedSupply, setSelectedSupply] = useState({
    desktops: false,
  });

  const [selectedModelOption, setSelectedModelOption] = useState("allmodels");

  const [selectedModelosOption, setSelectedModelosOption] =
    useState("osspecificModels");
  const [selectedModelbrowserOption, setSelectedModelbrowserOption] =
    useState("browserallmodels");
  const [selectedModellanguageOption, setSelectedModellanguageOption] =
    useState("languagespecificModels");

  const [entries, setEntries] = useState([
    {
      ostype: campaign?.ostype || "Windows Phone",
      minVersion: "",
      maxVersion: "",
    },
  ]);

  const handleAddEntry = () => {
    setEntries([
      ...entries,
      { ostype: campaign?.ostype, minVersion: "", maxVersion: "" },
    ]);
  };

  const handleChanges = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleRemoveEntry = (index) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);
    setEntries(newEntries);
  };
  const onSelect = (selectedList, selectedItem) => {
    setSelectedValue(selectedList);
  };

  const onRemove = (selectedList, removedItem) => {
    setSelectedValue(selectedList);
  };

  const [step, setStep] = useState(() => {
    if (!isEditMode) {
      return 0;
    }

    try {
      const savedStep = sessionStorage.getItem(stepStorageKey);
      return savedStep ? Number(savedStep) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [activeSubTab, setActiveSubTab] = useState("basics");

  useEffect(() => {
    if (step === 0) {
      setActiveSubTab("basics");
    }
  }, [step]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    try {
      sessionStorage.setItem(stepStorageKey, String(step));
    } catch (e) {
      /* ignore */
    }
  }, [step, isEditMode, stepStorageKey]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "radio" ? (checked ? value : prev[name]) : value,
    }));
    console.log("formdata", formData);
  };

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));
  const handleCancel = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to cancel this campaign? Your changes will not be saved.",
      icon: "warning",
      width: 520,
      showCancelButton: true,
      buttonsStyling: true,
      confirmButtonColor: "#d11f37",
      cancelButtonColor: "#f3f4f6",
      confirmButtonText: "Yes, cancel",
      cancelButtonText: "No, continue",
      customClass: {
        popup: "swal2-custom-popup",
        icon: "swal2-custom-icon",
        title: "swal2-custom-title",
        htmlContainer: "swal2-custom-text",
        actions: "swal2-custom-actions",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setStep(0);

        try {
          sessionStorage.removeItem(storageKey);
          sessionStorage.removeItem(
            `campaignEditorStep_${id || campaign_id || "new"}`,
          );
        } catch (e) {
          /* ignore */
        }

        navigate("/admin/campaign-details");
      }
    });
  };
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      city_id: selectedCities,
    }));
  }, [selectedCities]);

  useEffect(() => {
    if (campaign?.exchanges) {
      const initSelected = campaign.exchanges.map((e) => ({
        label: e.toUpperCase(),
        value: e,
      }));
      setSelected(initSelected);
    }
  }, [campaign]);

  const [locationInfo, setLocationInfo] = useState({
    latitude: "",
    longitude: "",
    range: "",
  });

  const change = (e, key, index) => {
    let value = e.target.value;

    if (["lat", "lon", "range"].includes(key)) {
      value = parseFloat(value);
      if (isNaN(value)) value = "";
    }

    setGeoPoints((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [key]: value,
      };
      return updated;
    });
  };

  useEffect(() => {
    if (!campaign) return;

    const parsedCampaign =
      typeof campaign === "string"
        ? safeJsonParse(campaign, campaign)
        : campaign;
    console.log("Parsed Campaign:", parsedCampaign);

    const bId =
      parsedCampaign.brandId ||
      parsedCampaign.brand_id ||
      parsedCampaign?.groups?.brandId ||
      parsedCampaign?.groups?.brand_id ||
      brandId ||
      localStorage.getItem("currentBrandId");
    if (bId) {
      if (!brandId) {
        setBrandId(bId);
      }
      setFormData((prev) => ({ ...prev, brand_id: bId }));
    } else if (brandId) {
      setFormData((prev) => ({ ...prev, brand_id: brandId }));
    }

    const locationTargets = parsedCampaign.location_targets || [];
    const campaignLocations = Array.isArray(parsedCampaign.campaignLocations)
      ? parsedCampaign.campaignLocations
      : Array.isArray(parsedCampaign.locations)
        ? parsedCampaign.locations
        : [];
    const campaignGeoLocations = Array.isArray(
      parsedCampaign.campaignGeoLocations,
    )
      ? parsedCampaign.campaignGeoLocations
      : Array.isArray(parsedCampaign.geoLocations)
        ? parsedCampaign.geoLocations
        : [];
    console.log("Parsed location:", locationTargets);

    const mappedLocationTargets = locationTargets.map((loc) => ({
      ...loc,
      latitudes: loc.latitudes || [],
      longitudes: loc.longitudes || [],
      ranges: loc.ranges || [],
    }));
    console.log("Mapped location:", mappedLocationTargets);

    setInitialCampaignLocations(campaignLocations);

    const geoPoints =
      campaignGeoLocations.length > 0
        ? campaignGeoLocations.map((point) => ({
          id:
            point.id ??
            `${point.latitude}-${point.longitude}-${point.radius ?? ""}`,
          lat: Number(point.latitude ?? ""),
          lon: Number(point.longitude ?? ""),
          range: Number(point.radius ?? ""),
          address: point.address || "-",
          target: point.target ? "Target" : "Exclude",
        }))
        : mappedLocationTargets.flatMap((loc) => {
          const points = [];
          const latitudes = loc.latitudes || [];
          const longitudes = loc.longitudes || [];
          const ranges = loc.ranges || [];

          for (let i = 0; i < latitudes.length; i++) {
            const lat = latitudes[i];
            const lon = longitudes[i] ?? "";
            const range = ranges[i] ?? "";
            points.push({ lat, lon, range });
          }
          return points;
        });

    setGeoPoints(geoPoints);
    if (
      parsedCampaign?.hyperlocalType !== undefined &&
      parsedCampaign?.hyperlocalType !== null
    ) {
      const savedHyperlocalType = String(
        parsedCampaign.hyperlocalType,
      ).toLowerCase();
      setHyperlocalType(savedHyperlocalType === "upload" ? "0" : "1");
    }

    if (parsedCampaign?.radiusUnits) {
      setRadiusUnits(parsedCampaign.radiusUnits);
    } else if (parsedCampaign?.radiusUnit) {
      setRadiusUnits(parsedCampaign.radiusUnit);
    }

    if (parsedCampaign?.fileName) {
      setFileName(parsedCampaign.fileName);
    } else if (parsedCampaign?.filename) {
      setFileName(parsedCampaign.filename);
    }

    if (mappedLocationTargets.length > 0) {
      const firstTarget = mappedLocationTargets[0];

      setLocationInfo({
        latitude: firstTarget.latitudes?.[0] ?? "",
        longitude: firstTarget.longitudes?.[0] ?? "",
        range: firstTarget.ranges?.[0] ?? "",
      });

      setSelection({
        regionId: firstTarget.region_id,
        subregionId: firstTarget.subregion_id ?? null,
        countryId: firstTarget.country_id ?? null,
        stateId: firstTarget.state_id ?? null,
        cityId: firstTarget.city_id?.[0] ?? null,
        latitude: firstTarget.latitudes?.[0] ?? null,
        longitude: firstTarget.longitudes?.[0] ?? null,
        range: firstTarget.ranges?.[0] ?? null,
      });
    }
    const regionIds = mappedLocationTargets.map((loc) => loc.region_id);
    const subregionIds = mappedLocationTargets.map((loc) => loc.subregion_id);
    const countryIds = mappedLocationTargets.map((loc) => loc.country_id);
    const stateIds = mappedLocationTargets.map((loc) => loc.state_id);
    const cityIds = mappedLocationTargets.flatMap((loc) => loc.city_id);

    const budget = parsedCampaign.budget ?? {};
    const apiLanguages = (parsedCampaign.browser_languages || []).map(Number);
    const cleanIabCategories = (parsedCampaign.iab_category || []).map(
      (cat) => cat.replace(/[{}]/g, ""),
    );
    const cleanBlockedCategories = normalizeStringList(
      parsedCampaign.blocked_category ??
      parsedCampaign.blockedCategory ??
      parsedCampaign?.campaignTargetDevices?.blockedCategory ??
      parsedCampaign?.campaignTargetDevices?.blocked_category,
    );
    const blockedAdvertiserValue =
      parsedCampaign.blocked_advertiser ??
      parsedCampaign.blockedAdvertiser ??
      parsedCampaign?.campaignTargetDevices?.blockedAdvertiser ??
      parsedCampaign?.campaignTargetDevices?.blocked_advertiser ??
      "";

    setSelectedBlockedCategory(cleanBlockedCategories);
    setFormData((prev) => ({
      ...prev,
      blocked_category: cleanBlockedCategories,
      blocked_advertiser: Array.isArray(blockedAdvertiserValue)
        ? blockedAdvertiserValue.filter(Boolean).join(",")
        : String(blockedAdvertiserValue || ""),
    }));
    const placementArr = toArray(parsedCampaign.placement_type);
    const rollArr = toArray(parsedCampaign.roll_position).map((v) =>
      v.trim().toLowerCase(),
    );
    const playerSizeArr = toArray(parsedCampaign.player_size);
    const playbackArr = toArray(parsedCampaign.playback_method);
    const rewardArr = toArray(parsedCampaign.reward_status);

    const audioArr = parsedCampaign.audio
      ? parsedCampaign.audio.split(",").map((v) => v.trim())
      : [];

    const audienceArr = Array.isArray(parsedCampaign.audience_capture)
      ? parsedCampaign.audience_capture
      : typeof parsedCampaign.audience_capture === "string"
        ? parsedCampaign.audience_capture.split(",").map((v) => v.trim())
        : [];

    const skippableArr =
      typeof parsedCampaign.skippable_ads === "string"
        ? parsedCampaign.skippable_ads.split(",").map((item) => item.trim())
        : [];

    const targetId = Array.isArray(parsedCampaign.target_id)
      ? parsedCampaign.target_id
      : [parsedCampaign.target_id ?? ""];

    setSelectedCities(
      mappedLocationTargets.flatMap((loc) =>
        Array.isArray(loc.city_id) ? loc.city_id.map((id) => String(id)) : [],
      ),
    );

    const geoArray = geoPoints.flatMap((p) => [p.lat, p.lon, p.range]);
    setGeo(geoArray);
  }, [campaign]);

  const handleGeoChange = (updatedGeo) => {
    console.log("Updated geo from editor:", updatedGeo);
    setGeo(updatedGeo);
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      latitude: geoPoints.map((p) => p.lat),
      longitude: geoPoints.map((p) => p.lon),
      range: geoPoints.map((p) => p.range),
    }));
  }, [geoPoints]);

  useEffect(() => {
    if (campaign?.os_versions && Array.isArray(campaign.os_versions)) {
      setEntries(
        campaign.os_versions.map((os) => ({
          ostype: os.ostype || "Windows Phone",
          minVersion: os.minVersion || "",
          maxVersion: os.maxVersion || "",
        })),
      );
    }
  }, [campaign]);

  const getSelectedExchangeOptions = () => {
    return ssp.map((x) => ({
      label: x,
      value: x.toLowerCase(),
    }));
  };

  const defaultCampaign = { browser: [] };
  useEffect(() => {
    if (campaign?.browser && Array.isArray(campaign.browser)) {
      const initSelected = campaign.browser.map((e) => ({
        label: e.toUpperCase(),
        value: e,
      }));
      setSelected(initSelected);
    }
  }, [campaign]);

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [rowData, setRowData] = useState([]);
  const [selectedHeader, setSelectedHeader] = useState(null);

  const handleHeaderClick = (index) => {
    setSelectedHeader(index);
  };
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loading, setLoading] = useState(false);

  const sortRows = (key) => {
    setLoading(true);

    setTimeout(() => {
      let direction = "asc";
      if (sortConfig.key === key && sortConfig.direction === "asc") {
        direction = "desc";
      }
      const sorted = [...rowData].sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        valA =
          valA !== null && valA !== undefined
            ? valA.toString().toLowerCase()
            : "";
        valB =
          valB !== null && valB !== undefined
            ? valB.toString().toLowerCase()
            : "";
        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
      });
      setRowData(sorted);
      setSortConfig({ key, direction });
      setLoading(false);
    }, 900);
  };

  const [columnWidths, setColumnWidths] = useState({
    actions: 120,
    name: 150,
    list_type: 150,
    domain_count: 100,
  });

  const guideLineRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const resizingCol = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = (e, colKey) => {
    e.preventDefault();
    resizingCol.current = colKey;
    startX.current = e.clientX;
    startWidth.current = columnWidths[colKey];

    const tableRect = tableWrapperRef.current.getBoundingClientRect();
    const guideLine = guideLineRef.current;

    guideLine.style.top = "0px";
    guideLine.style.height = tableWrapperRef.current.offsetHeight + "px";
    guideLine.style.left = `${e.clientX - tableRect.left}px`;
    guideLine.style.display = "block";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!resizingCol.current) return;

    const tableRect = tableWrapperRef.current.getBoundingClientRect();
    let posX = e.clientX - tableRect.left;
    posX = Math.max(0, Math.min(posX, tableRect.width));

    guideLineRef.current.style.left = `${posX}px`;
  };

  const handleMouseUp = (e) => {
    if (!resizingCol.current) return;

    const dx = e.clientX - startX.current;
    const newWidth = Math.max(startWidth.current + dx, 50);

    setColumnWidths((prev) => ({
      ...prev,
      [resizingCol.current]: newWidth,
    }));

    guideLineRef.current.style.display = "none";
    resizingCol.current = null;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    if (!loading && rowData.length > 0) {
      setSelectedRowId(rowData[0].id);
    }
  }, [loading, rowData]);

  const addNewCampaign = async () => {
    const buildCommonPayloadFields = (payloadType = "new") => {
      const commonFields = {
        impression_cap: formData.impression_cap,
        impressionCap_Type: formData.impressionCap_Type,
        impressionCapValue: normalizeImpressionCapValue(
          formData.impressionCapValue,
        ),
        impressionType: normalizeImpressionCapValue(
          formData.impressionCapValue,
        ),
        flight_startdate: formData.Flight_startdate,
        flight_enddate: formData.Flight_enddate,
        all_time: formData.all_time,
        dollar_goal: formData.dollar_goal,
        dollar_goal1: formData.dollar_goal1,
        optimize: formData.optimize,
        goal_status: formData.goal_status,
      };
      if (payloadType === "edit") {
        return {
          impressionCap: commonFields.impression_cap,
          impressionCapType: commonFields.impressionCap_Type,
          impressionCapValue: commonFields.impressionCapValue,
          impressionType: commonFields.impressionType,
          flightStartdate: commonFields.flight_startdate,
          flightEnddate: commonFields.flight_enddate,
          allTime: commonFields.all_time,
          pacing: commonFields.pacing,
          dollarGoal: commonFields.dollar_goal,
          dollarGoal1: commonFields.dollar_goal1,
          optimize: commonFields.optimize,
          goalStatus: commonFields.goal_status,
        };
      }

      return commonFields;
    };

    const buildLocationPayload = (items) => {
      const map = {};
      const existingByCountryId = new Map(
        (Array.isArray(initialCampaignLocations)
          ? initialCampaignLocations
          : []
        )
          .map((loc) => ({
            id: loc?.id ?? loc?.campaignLocationId ?? null,
            countryId: loc?.countryId ?? loc?.country_id ?? null,
          }))
          .filter(
            (entry) =>
              entry.countryId !== null && entry.countryId !== undefined,
          )
          .map((entry) => [String(entry.countryId), entry.id]),
      );

      const readId = (value) => {
        if (value === null || value === undefined || value === "") return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : value;
      };

      const normalizeType = (value) =>
        String(value || "")
          .trim()
          .toLowerCase();

      items.forEach((item) => {
        const countryIdRaw = item?.country_id ?? item?.countryId;
        if (
          countryIdRaw === null ||
          countryIdRaw === undefined ||
          countryIdRaw === ""
        ) {
          return;
        }
        const countryKey = String(countryIdRaw);
        const countryId = readId(countryIdRaw);

        if (!map[countryKey]) {
          const existingId =
            item?.id ?? existingByCountryId.get(countryKey) ?? null;
          const next = {
            countryId,
            selectAll: false,
            states: [],
            cities: [],
          };
          if (
            existingId !== null &&
            existingId !== undefined &&
            existingId !== ""
          ) {
            next.id = readId(existingId);
          }
          map[countryKey] = next;
        }

        const itemType = normalizeType(item?.type);

        if (itemType === "country") {
          map[countryKey].selectAll = true;
          map[countryKey].states = [];
          map[countryKey].cities = [];
          return;
        }

        if (itemType === "state") {
          const stateId = readId(item?.state_id ?? item?.stateId);
          if (stateId !== null && stateId !== undefined) {
            if (!map[countryKey].states.includes(stateId)) {
              map[countryKey].states.push(stateId);
            }
          }
        }

        if (itemType === "city") {
          const cityId = readId(item?.city_id ?? item?.cityId);
          const stateId = readId(item?.state_id ?? item?.stateId);

          if (cityId !== null && cityId !== undefined) {
            if (!map[countryKey].cities.includes(cityId)) {
              map[countryKey].cities.push(cityId);
            }
          }

          if (stateId !== null && stateId !== undefined) {
            if (!map[countryKey].states.includes(stateId)) {
              map[countryKey].states.push(stateId);
            }
          }
        }
      });

      return Object.values(map);
    };

    const getCampaignLocationsPayload = () =>
      selectedCountryItems.length > 0
        ? buildLocationPayload(selectedCountryItems)
        : initialCampaignLocations;

    const buildGeoLocationsPayload = (geoPoints) => {
      if (!geoPoints || geoPoints.length === 0) return [];

      return geoPoints.map((item) => ({
        address: item.address || "",
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        radius: Number(item.range),
        target: item.target === "Target" ? true : false,
      }));
    };

    const getLatestDeviceData = () => {
      if (
        modalRef.current &&
        typeof modalRef.current.handledevicedata === "function"
      ) {
        try {
          const latestData = modalRef.current.handledevicedata();
          if (latestData && Object.keys(latestData).length > 0) {
            return latestData;
          }
        } catch (error) {
          console.error("Failed to read latest device data from ref:", error);
        }
      }

      return formData.devices_data || deviceData || {};
    };

    const buildSpringBootPayload = (devicesData) => {
      const carrier = serializeCarrierValue(
        devicesData?.carrier ?? formData.carrier,
      );
      const addOptimizationEnabled = toBool(
        formData.ad_optimization ?? formData.add_optimization,
      );
      const pagePosition = sanitizePagePosition(formData.page_position);
      const pagePositionEnabled = isPagePositionEnabled(formData.page_position);
      const audienceCaptureEnabled = isAudienceCaptureEnabled(
        formData.audience_capture,
      );
      const audienceCapture = audienceCaptureEnabled
        ? sanitizeAudienceCapture(formData.audience_capture)
        : {
          Clicks: false,
          Conversions: false,
          Audio: false,
        };
      const campaignVideos = {
        placementType: JSON.stringify(formData.placement_type),
        rollPosition: JSON.stringify(formData.roll_position),
        playerSize: JSON.stringify(formData.player_size),
        skippableAds: JSON.stringify(formData.skippable_ads),
        playbackMethod: JSON.stringify(formData.playback_method),
        rewardStatus: JSON.stringify(formData.reward_status),
        orientationMatching: formData.orientation_matching,
        audienceCapture: [
          !!audienceCapture.Clicks,
          !!audienceCapture.Conversions,
          !!audienceCapture.Audio,
        ].join(","),
        audio: JSON.stringify({
          music: formData.audio?.music || false,
          fm_am: formData.audio?.fm_am || false,
          Podcast: formData.audio?.Podcast || false,
          catch_up: formData.audio?.catch_up || false,
          web: formData.audio?.Webradio || false,
          video: formData.audio?.Videogame || false,
          text: formData.audio?.Textto_speech || false,
          feed: formData.audio?.Feedtype_unknown || false,
        }),
        pagePosition: JSON.stringify(pagePosition),
      };

      const deviceTypeList = Array.isArray(latestDeviceData.device_type_list)
        ? latestDeviceData.device_type_list
          .map((item) => Number(item))
          .filter((item) => !Number.isNaN(item) && item > 0)
        : [];

      // Ensure we include selected checkboxes (desktop/phone/tablet/connected_tv)
      const computedDeviceTypeList = deviceTypeList.length > 0
        ? deviceTypeList
        : [
          latestDeviceData?.selectedDevices?.desktop ? 2 : null,
          latestDeviceData?.selectedDevices?.connected_tv ? 3 : null,
          latestDeviceData?.selectedDevices?.phone ? 4 : null,
          latestDeviceData?.selectedDevices?.tablet ? 5 : null,
        ].filter(Boolean);

      const campaignTargetDevices = {
        id: latestDeviceData.id ?? null,
        deviceType: latestDeviceData.device_type,
        deviceTypeList: computedDeviceTypeList,
        deviceId: Boolean(latestDeviceData.targetwithimpression),
        carrier,
        browserOption: latestDeviceData.browser_option,
        all_makes: latestDeviceData.all_makes,
        make: latestDeviceData.make?.map((m) => m.company || m).join(",") || "",
        modelOption: latestDeviceData.model_option,
        model: latestDeviceData.model?.map((m) => m.name || m).join(",") || "",
        browsers: latestDeviceData.browsers?.join(",") || "",
        desktop: latestDeviceData.selectedDevices.desktop,
        phone: latestDeviceData.selectedDevices.phone,
        tablet: latestDeviceData.selectedDevices.tablet,
        connectedTv: latestDeviceData.selectedDevices.connected_tv,
        browserLanguageOption: latestDeviceData.browser_language_option,
        browserLanguages:
          (latestDeviceData.browser_languages || [])
            .map((item) => item?.language || item)
            .join(",") || "",
      };

      const targetting = {
        ...latestDeviceData,
        carrier,
        targetwithimpression: Boolean(latestDeviceData.targetwithimpression),
        make: (latestDeviceData?.make || []).map(
          (item) => item?.company || item,
        ),
        model: (latestDeviceData?.model || []).map(
          (item) => item?.name || item,
        ),
        browser_languages: (latestDeviceData?.browser_languages || []).map(
          (item) => item?.language || item,
        ),
      };
      const osVersionOption = latestDeviceData.osversion_option;
      const campaignOsVersions = latestDeviceData.os?.updated || [];
      const conversion = getSelectedConversionNames().join(",");
      const campaignInventories = (formData.inventory_exchange || []).map(
        (item) => ({
          campaignInventoryId: item.campaignInventoryId
            ? Number(item.campaignInventoryId)
            : 0,
          domainappname: item.domainappname,
          domainappid: item.domainappid,
          appstorename: item.appstorename,
          cpmbidrange: item.cpmbidrange,
          exchanges: item.exchanges || [],
        }),
      );
      const campaignDomains = (formData.inventory_domain || []).map((item) => ({
        campaignDomainId: Number(item.campaignDomainId ?? item.id ?? 0),
        domainListId: item.domainListId,
        name: item.name,
        listType: item.listType,
        domainListCount: item.domainListCount,
        domains: item.domains || [],
        checked: item.checked || false,
      }));
      const resolvedBrandId =
        normalizeBrandId(formData.brand_id) ||
        normalizeBrandId(brandId) ||
        normalizeBrandId(campaign?.brand_id) ||
        normalizeBrandId(DEFAULT_BRAND_ID);

      return {
        name: formData.name,
        adDomain: formData.ad_domain,
        price: formData.price,
        activateTime: formData.Flight_startdate,
        expireTime: formData.Flight_enddate,
        cpmBid: formData.cpm_bid,
        status: formData.status,
        iabCategory: currentIabCategory,
        crossDevice: formData.cross_device,
        capspec: Number(formData.capspec),
        capexpire:
          formData.capexpire === "" ? undefined : Number(formData.capexpire),
        capcount:
          formData.capcount === "" ? undefined : Number(formData.capcount),
        capunit: formData.capunit,
        usebid: formData.usebid,
        bidShading: formData.bid_shading,
        notes: formData.notes,
        totalBudget: parseCurrencyNumber(formData.total_budget),
        allTime: formData.all_time,
        impressionCap: formData.impression_cap,
        customerId: formData.customerId || "CUST12345",
        impressionType: normalizeImpressionCapValue(
          formData.impressionCapValue,
        ),
        impressionCapValue: normalizeImpressionCapValue(
          formData.impressionCapValue,
        ),
        serviceProvider: formData.service_provider,
        deviceId: devicesData.targetwithimpression,
        userAgent: formData.true,
        learningScope: formData.learning_scope,
        blockedCategory: currentBlockedCategory,
        blockedAdvertiser: formData.blocked_advertiser,
        appWebName: formData.app_web_name,
        appWebId: formData.app_web_id,
        externdName: formData.externalname,
        externalName: formData.externalname,
        externalname: formData.externalname,
        campaignType: formData.campaign_type,
        bidshadingMultiplier: normalizeBidMultiplier(
          formData.bidshading_Multiplier,
        ),
        bidMultiplier: normalizeBidMultiplier(formData.bid_Multiplier),
        optimize: formData.optimize,
        goalStatus: formData.goal_status,
        eddollarGoal: formData.dollar_goal,
        dollarGoal1: formData.dollar_goal1,
        primaryConversion: formData.primary_conversion,
        optimizeDomain: formData.optimize_domain,
        optimizationSettings: formData.optimization_settings,
        minimumBid: formData.minimum_bid,
        bidStep: formData.bid_step,
        impressionThreshold: formData.impression_threshold,
        smartDisable: formData.smart_disable,
        learnBudget: formData.learn_budget,
        learningScope: formData.learning_scope,
        trackConversions: formData.track_conversions,
        measureViewability: formData.measure_viewability,
        provider: formData.provider,
        standard: formData.standard,
        samplingRate: formData.sampling_rate,
        advancedVideo: formData.advanced_video,
        advancedAudio: formData.advanced_audio,
        click_through_conversion: formData.click_through_conversion,
        view_through_conversion: formData.view_through_conversion,
        mmpClickTrackingUrl: formData.conversionUrl || "",
        mmpImpressionTrackingUrl: formData.viewthroughConversionUrl || "",
        conversionUrl: formData.conversionUrl || "",
        viewthroughConversionUrl: formData.viewthroughConversionUrl || "",
        lookBackWindow: formData.look_back_window,
        lookBackWindow1: formData.look_back_window1,
        conversionAt: formData.conversion_at,
        conversionUser: formData.conversion_user,
        countConversion: formData.count_conversion,
        chromePrivacy: formData.chrome_privacy,
        sandboxAttribution: formData.sandbox_attribution,
        brandProduction: formData.brand_protection,
        excludeAdsTxt: formData.inventory_exclude_ads_txt,
        targetDirect: formData.inventory_target_direct,
        optSupply: formData.inventory_opt_supply,
        optMade: formData.inventory_opt_made,
        forensiq: formData.forensiq,
        addOptimization: addOptimizationEnabled,
        // audience capture values come from the current form selections
        ...(() => {
          const p = getAudienceCapturePayload(formData, campaign);
          return {
            captureClicks: p.captureClicks,
            captureConversion: p.captureConversion,
            complete_25: p.complete_25,
            complete_50: p.complete_50,
            complete_75: p.complete_75,
            complete_100: p.complete_100,
          };
        })(),
        dollarGoal: formData.dollar_goal,
        dollarGoal1: formData.dollar_goal1,
        goalStr: formData.goal_str,
        evalutionGroup: formData.evalution_group,
        evalutionPeriod: formData.evalution_period,
        sampleSizeValue: formData.sample_size_value,
        sampleValue: formData.sample_value,
        controlGroupSize: formData.control_group_size,
        controlGroupSov: formData.control_group_sov,
        // include deals as an array of selected deal ids (expected format)
        deals: (() => {
          const d = formData.deals;
          if (!d) return [];
          if (Array.isArray(d)) return d;
          if (typeof d === "string") {
            const m = d.match(/deals\[(.*)\]/);
            if (!m) return [];
            const inner = m[1].trim();
            if (!inner) return [];
            return inner
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((s) => (isNaN(s) ? s : Number(s)));
          }
          return [];
        })(),

        audienceCapture: audienceCapture,
        page_position: pagePosition,
        pagePosition: JSON.stringify(pagePosition),
        page_fold: pagePosition,
        pageFold: JSON.stringify(pagePosition),
        aboveFold: pagePositionEnabled ? pagePosition.above_fold : false,
        belowFold: pagePositionEnabled ? pagePosition.below_fold : false,
        pageUnknown: pagePositionEnabled ? pagePosition.page_unknown : false,
        campaignVideos: campaignVideos,
        pacing: {
          updatestatus: false,
          pacingstatus: formData.pacing === "1" ? 1 : 0,
          pacingtype: pacingType,
          pacingMode: parseInt(formData.even_spend, 10),
          flightDate: formData.flight_date,
          flightStartDate: formData.Flight_startdate,
          flightEndDate: formData.Flight_enddate,
        },
        campaignInventories,
        campaignDomains,
        campaignInventory: campaignInventories,
        campaignDomain: campaignDomains,
        excludeAdsTxt: formData.inventory_exclude_ads_txt || false,
        targetDirect: formData.inventory_target_direct || false,
        optSupply: formData.inventory_opt_supply || false,
        optMade: formData.inventory_opt_made || false,
        creativeId: [
          ...new Set(
            (formData.linkedAds || [])
              .map((ad) => Number(ad.creativesId))
              .filter(Boolean),
          ),
        ],
        campaignLocations: getCampaignLocationsPayload(),
        campaignGeoLocations: buildGeoLocationsPayload(geoPoints),
        hyperlocalType: String(hyperlocalType) === "1" ? "enter" : "upload",
        radiusUnits: radiusUnits,
        radiusUnit: radiusUnits,
        fileName: fileName || "",
        filename: fileName || "",
        osversionOption: latestDeviceData.osversion_option,
        osVersionOption,
        campaignOsVersions,
        campaignTargetDevices,
        targetting,
        conversion,
        mmpId: formData.mmpId || "",
        mmpType: formData.mmpType || "",
        mmpName: formData.mmpType || "",
        mmpClickTrackingUrl: formData.conversionUrl || "",
        mmpImpressionTrackingUrl: formData.viewthroughConversionUrl || "",
        campaignConversionEvents: (trackedconversion || []).map((event) => ({
          mmpId: Number(formData.mmpId || event.mmpId),
          eventId: Number(event.conversionId || event.conversionEventId),
          primaryConversion: !!event.isPrimary,
        })),
        dayparting: showDaypart,
        dayParting: showDaypart,
        day_parting_utc:
          !showDaypart ||
            daypartSchedule === undefined ||
            daypartSchedule === null ||
            (Array.isArray(daypartSchedule)
              ? daypartSchedule.length === 0
              : Object.keys(daypartSchedule).length === 0)
            ? null
            : JSON.stringify(daypartSchedule),
        dayPartingUtc:
          !showDaypart ||
            daypartSchedule === undefined ||
            daypartSchedule === null ||
            (Array.isArray(daypartSchedule)
              ? daypartSchedule.length === 0
              : Object.keys(daypartSchedule).length === 0)
            ? null
            : JSON.stringify(daypartSchedule),
      };
    };
    const latestDeviceData = getLatestDeviceData();
    const latestCarrier = serializeCarrierValue(
      latestDeviceData.carrier ?? formData.carrier,
    );

    if (step === 3 && modalRef.current) {
      console.log("Step 3 - Using fresh device data from ref");
    } else {
      console.log("Using latest synced device data for save");
    }

    console.log("formdata", formData);

    const errors = {};
    if (!(formData.name || "").trim()) {
      errors.name = "Campaign Name is required";
    }
    const domainVal = (formData.ad_domain || "").trim();
    if (!domainVal) {
      errors.ad_domain = "Domain Name is required";
    } else {
      const urlPattern = /^(https?:\/\/)?([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,63})(:[0-9]{1,5})?(\/.*)?$/i;
      if (!urlPattern.test(domainVal)) {
        errors.ad_domain = "Please enter a valid URL or Domain name";
      }
    }

    const priceValue = String(formData.price || "").trim();
    if (!priceValue) {
      errors.price = "Default CPM Bid is required";
    } else {
      const n = Number(priceValue);
      if (!Number.isFinite(n)) {
        errors.price = "Please enter a valid number for Default CPM Bid";
      } else if (n <= 0) {
        errors.price = "Default CPM Bid must be greater than 0";
      } else if (n > 100) {
        errors.price = "Maximum value of Default CPM Bid is $100";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, ...errors }));

      const messages = [];
      if (errors.name) messages.push(errors.name);
      if (errors.ad_domain) messages.push(errors.ad_domain);
      if (errors.price) messages.push(errors.price);

      await showValidationError(messages.join("<br/>"));
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save this Campaign?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: campaignEdit ? "Yes, update it!" : "Yes, save it!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        popup: "campaign-save-swal-popup",
        title: "campaign-save-swal-title",
        htmlContainer: "campaign-save-swal-message",
        actions: "campaign-save-swal-actions",
        confirmButton: "campaign-save-swal-confirm",
        cancelButton: "campaign-save-swal-cancel",
      },
    });

    if (!result.isConfirmed) {
      return;
    }
    setIsLoading(true);
    try {
      let isCreateResponseFalse = false;
      const findAvailableFund = (obj) => {
        if (!obj || typeof obj !== "object") return null;
        if ("availableFund" in obj) return obj.availableFund;
        if (Array.isArray(obj)) {
          for (const item of obj) {
            const val = findAvailableFund(item);
            if (val !== null) return val;
          }
        } else {
          for (const k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              const val = findAvailableFund(obj[k]);
              if (val !== null) return val;
            }
          }
        }
        return null;
      };
      if (!campaign_id) {
        const springPayload = applyImpressionTypePayload(
          buildSpringBootPayload(latestDeviceData),
          formData.impressionCapValue || impressionCapValue,
        );
        const res = await createCampaign(springPayload);
        const avFund = res && res.data ? findAvailableFund(res.data) : null;
        if (
          res &&
          (res.data === true ||
            res.data === "true" ||
            avFund === true ||
            avFund === "true")
        ) {
          isCreateResponseFalse = true;
        }
      } else {
        const missingInventoryId = (formData.inventory_exchange || []).some(
          (item) => !item.campaignInventoryId,
        );
        const missingDomainId = (formData.inventory_domain || []).some(
          (item) => !item.campaignDomainId,
        );

        if (missingInventoryId || missingDomainId) {
          console.warn("⚠️ Missing IDs — treating as new entries");
        }

        const edit = { ...campaign };
        edit.customerId = formData.customerId;
        edit.ad_domain = formData.ad_domain;
        edit.appWebId = formData.app_web_id;
        edit.appWebName = formData.app_web_name;
        edit.status = formData.status;
        edit.type = formData.campaign_type;
        edit.campaignType = formData.campaign_type;
        edit.externdName = formData.externalname;
        edit.externalName = formData.externalname;
        edit.externalname = formData.externalname;
        edit.bidshadingMultiplier = normalizeBidMultiplier(
          formData.bidshading_Multiplier,
        );
        edit.bidMultiplier = normalizeBidMultiplier(formData.bid_Multiplier);

        edit.name = formData.name;
        edit.iab_category = currentIabCategory;
        edit.blocked_category = currentBlockedCategory;
        edit.blocked_advertiser = formData.blocked_advertiser;
        edit.iabCategory = currentIabCategory;
        edit.blockedCategory = currentBlockedCategory;
        edit.blockedAdvertiser = formData.blocked_advertiser;

        edit.cpmBid = formData.cpm_bid;
        edit.price = parseFloat(formData.price);
        edit.usebid = formData.usebid;
        edit.bidShading = formData.bid_shading;
        edit.crossDevice = formData.cross_device;
        edit.mmpId = formData.mmpId || "";
        edit.mmpType = formData.mmpType || "";
        edit.mmpName = formData.mmpType || "";
        edit.deviceId = Boolean(latestDeviceData.targetwithimpression);
        edit.capspec = Number(formData.capspec);
        edit.capcount = parseInt(formData.capcount, 10);
        edit.capexpire = parseInt(formData.capexpire, 10);
        edit.capunit = formData.capunit;
        edit.totalBudget = parseCurrencyNumber(formData.total_budget);
        edit.total_budget = edit.totalBudget;
        edit.allTime = formData.all_time;
        edit.impressionCap = formData.impression_cap;
        edit.impressionCapType = formData.impressionCap_Type;
        edit.impressionCapValue = normalizeImpressionCapValue(formData.impressionCapValue,);
        edit.impressionType = normalizeImpressionCapValue(formData.impressionCapValue,);
        edit.flightDate = parseInt(formData.flight_date, 10);
        edit.activateTime = formData.Flight_startdate;
        edit.expireTime = formData.Flight_enddate;
        edit.serviceProvider = formData.service_provider;
        edit.optimize = formData.optimize;
        edit.goalStatus = formData.goal_status;
        edit.dollarGoal = formData.dollar_goal;
        edit.dollarGoal1 = formData.dollar_goal1;
        edit.primaryConversion = formData.primary_conversion;
        edit.optimizeDomain = formData.optimize_domain;
        edit.optimizationSettings = formData.optimization_settings;
        edit.minimumBid = formData.minimum_bid;
        edit.bidStep = formData.bid_step;
        edit.impressionThreshold = formData.impression_threshold;
        edit.smartDisable = formData.smart_disable;
        edit.learnBudget = formData.learn_budget;
        edit.learningScope = formData.learning_scope;
        edit.trackConversions = formData.track_conversions;
        edit.measureViewability = formData.measure_viewability;
        edit.provider = formData.provider;
        edit.standard = formData.standard;
        edit.samplingRate = formData.sampling_rate;
        edit.advancedVideo = formData.advanced_video;
        edit.advancedAudio = formData.advanced_audio;
        edit.click_through_conversion = formData.click_through_conversion;
        edit.view_through_conversion = formData.view_through_conversion;
        edit.mmpClickTrackingUrl = formData.conversionUrl || "";
        edit.mmpImpressionTrackingUrl = formData.viewthroughConversionUrl || "";
        edit.conversionUrl = formData.conversionUrl || "";
        edit.viewthroughConversionUrl = formData.viewthroughConversionUrl || "";
        edit.lookBackWindow = formData.look_back_window;
        edit.lookBackWindow1 = formData.look_back_window1;
        edit.conversionAt = formData.conversion_at;
        edit.conversionUser = formData.conversion_user;
        edit.countConversion = formData.count_conversion;
        edit.chromePrivacy = formData.chrome_privacy;
        edit.sandboxAttribution = formData.sandbox_attribution;
        edit.brand_protection = formData.brand_protection;
        const pagePosition = sanitizePagePosition(formData.page_position);
        const pagePositionEnabled = isPagePositionEnabled(
          formData.page_position,
        );
        const audienceCaptureEnabled = isAudienceCaptureEnabled(
          formData.audience_capture,
        );
        const _p2 = getAudienceCapturePayload(formData, campaign);
        edit.captureClicks = _p2.captureClicks;
        edit.captureConversion = _p2.captureConversion;
        edit.complete25 = _p2.complete_25;
        edit.complete50 = _p2.complete_50;
        edit.complete75 = _p2.complete_75;
        edit.complete100 = _p2.complete_100;
        const audienceCapture = audienceCaptureEnabled
          ? sanitizeAudienceCapture(formData.audience_capture)
          : {
            Clicks: false,
            Conversions: false,
            Audio: false,
          };
        edit.audience_capture = audienceCapture;
        edit.page_position = pagePosition;
        edit.pagePosition = JSON.stringify(pagePosition);
        edit.page_fold = pagePosition;
        edit.pageFold = JSON.stringify(pagePosition);
        edit.above_fold = pagePositionEnabled ? pagePosition.above_fold : false;
        edit.below_fold = pagePositionEnabled ? pagePosition.below_fold : false;
        edit.page_unknown = pagePositionEnabled
          ? pagePosition.page_unknown
          : false;
        edit.campaignVideos = {
          placementType: JSON.stringify(formData.placement_type),
          rollPosition: JSON.stringify(formData.roll_position),
          playerSize: JSON.stringify(formData.player_size),
          skippableAds: JSON.stringify(formData.skippable_ads),
          playbackMethod: JSON.stringify(formData.playback_method),
          rewardStatus: JSON.stringify(formData.reward_status),
          orientationMatching: formData.orientation_matching,
          audienceCapture: [
            !!audienceCapture.Clicks,
            !!audienceCapture.Conversions,
            !!audienceCapture.Audio,
          ].join(","),
          audio: JSON.stringify({
            music: formData.audio?.music || false,
            fm_am: formData.audio?.fm_am || false,
            Podcast: formData.audio?.Podcast || false,
            catch_up: formData.audio?.catch_up || false,
            web: formData.audio?.Webradio || false,
            video: formData.audio?.Videogame || false,
            text: formData.audio?.Textto_speech || false,
            feed: formData.audio?.Feedtype_unknown || false,
          }),
          page_position: JSON.stringify(pagePosition),
          pagePosition: JSON.stringify(pagePosition),
        };
        const editDeviceTypeList = Array.isArray(latestDeviceData?.device_type_list)
          ? latestDeviceData.device_type_list
            .map((item) => Number(item))
            .filter((item) => !Number.isNaN(item) && item > 0)
          : [];

        const editComputedDeviceTypeList = editDeviceTypeList.length > 0
          ? editDeviceTypeList
          : [
            latestDeviceData?.selectedDevices?.desktop ? 2 : null,
            latestDeviceData?.selectedDevices?.connected_tv ? 3 : null,
            latestDeviceData?.selectedDevices?.phone ? 4 : null,
            latestDeviceData?.selectedDevices?.tablet ? 5 : null,
          ].filter(Boolean);

        edit.device_type_list = editComputedDeviceTypeList;

        edit.campaignTargetDevices = {
          deviceType: latestDeviceData.device_type,
          deviceId: Boolean(latestDeviceData.targetwithimpression),
          carrier: latestCarrier,
          browserOption: latestDeviceData.browser_option,
          all_makes: latestDeviceData.all_makes,
          make:
            latestDeviceData.make?.map((m) => m.company || m).join(",") || "",
          modelOption: latestDeviceData.model_option,
          model:
            latestDeviceData.model?.map((m) => m.name || m).join(",") || "",
          browsers: latestDeviceData.browsers?.join(",") || "",
          desktop: latestDeviceData.selectedDevices.desktop,
          phone: latestDeviceData.selectedDevices.phone,
          tablet: latestDeviceData.selectedDevices.tablet,
          connectedTv: latestDeviceData.selectedDevices.connected_tv,
          browserLanguageOption: latestDeviceData.browser_language_option,
          browserLanguages:
            (latestDeviceData.browser_languages || [])
              .map((item) => item?.language || item)
              .join(",") || "",
          deviceTypeList: editComputedDeviceTypeList,
          id: latestDeviceData.id ?? null,
        };

        edit.targetting = {
          ...latestDeviceData,
          carrier: latestCarrier,
          targetwithimpression: Boolean(latestDeviceData.targetwithimpression),
          make: (latestDeviceData?.make || []).map(
            (item) => item?.company || item,
          ),
          model: (latestDeviceData?.model || []).map(
            (item) => item?.name || item,
          ),
          browser_languages: (latestDeviceData?.browser_languages || []).map(
            (item) => item?.language || item,
          ),
        };
        edit.osVersionOption = latestDeviceData.osversion_option;
        edit.campaignOsVersions = latestDeviceData.os?.updated || [];
        edit.conversion = getSelectedConversionNames().join(",");
        edit.excludeAdsTxt = formData.inventory_exclude_ads_txt;
        edit.targetDirect = formData.inventory_target_direct;
        edit.optSupply = formData.inventory_opt_supply;
        edit.optMade = formData.inventory_opt_made;

        edit.campaignInventories = (formData.inventory_exchange || []).map(
          (item) => ({
            campaignInventoryId: item.campaignInventoryId
              ? Number(item.campaignInventoryId)
              : 0,
            domainappname: item.domainappname,
            domainappid: item.domainappid,
            appstorename: item.appstorename,
            cpmbidrange: item.cpmbidrange,
            exchanges: item.exchanges || [],
          }),
        );

        edit.campaignDomains = (formData.inventory_domain || []).map(
          (item) => ({
            campaignDomainId: Number(item.campaignDomainId ?? item.id ?? 0),
            domainListId: item.domainListId,
            name: item.name,
            listType: item.listType,
            domainListCount: item.domainListCount,
            domains: item.domains || [],
            fileData: item.fileData || "",
            checked: item.checked || false,
          }),
        );

        // ------------------ EXPERIMENT ------------------
        edit.addOptimization = toBool(formData.ad_optimization);
        edit.add_optimization = toBool(formData.ad_optimization);
        edit.goal_str = formData.goal_str;
        edit.evalutionGroup = formData.evalution_group;
        edit.evalutionPeriod = formData.evalution_period;
        edit.sampleSizeValue = formData.sample_size_value;
        edit.sampleValue = formData.sample_value;
        edit.controlGroupSize = formData.control_group_size;
        edit.controlGroupSov = formData.control_group_sov;

        // ------------------ NOTES ------------------
        edit.notes = formData.notes;

        // ------------------ PACING (FIXED KEYS) ------------------
        edit.pacing = {
          updatestatus: true, // ✅ REQUIRED
          pacingstatus: formData.pacing === "1" ? 1 : 0,
          pacingtype: pacingType,
          pacingMode: parseInt(formData.even_spend, 10),
          flightDate: formData.flight_date,
          flightStartDate: formData.Flight_startdate,
          flightEndDate: formData.Flight_enddate,
        };

        edit.campaignConversionEvents = (trackedconversion || []).map(
          (event) => ({
            mmpId: Number(formData.mmpId || event.mmpId),
            eventId: Number(event.conversionId || event.conversionEventId),
            primaryConversion: !!event.isPrimary,
          }),
        );

        edit.campaignLocations = getCampaignLocationsPayload();
        edit.campaignGeoLocations = buildGeoLocationsPayload(geoPoints);
        edit.locations = edit.campaignLocations;
        edit.geoLocations = edit.campaignGeoLocations;
        edit.hyperlocalType =
          String(hyperlocalType) === "1" ? "enter" : "upload";
        edit.radiusUnits = radiusUnits;
        edit.radiusUnit = radiusUnits;
        edit.fileName = fileName || "";
        edit.filename = fileName || "";
        const currentCreativeIds = [
          ...new Set(
            (formData.linkedAds || [])
              .map((ad) => Number(ad.creativesId))
              .filter(Boolean),
          ),
        ];

        const removedIds = originalCreativeIds.filter(
          (id) => !currentCreativeIds.includes(id),
        );
        const addedIds = currentCreativeIds.filter(
          (id) => !originalCreativeIds.includes(id),
        );

        if (removedIds.length > 0) {
          try {
            await Promise.all(
              removedIds.map((id) => listUnLinkCampaign(id, campaign_id)),
            );
            console.log("Successfully unlinked removed creatives:", removedIds);
          } catch (e) {
            console.error("Failed to unlink some creatives:", e);
          }
        }

        edit.creativeId = addedIds;

        edit.dayparting = showDaypart;
        edit.dayParting = showDaypart;

        if (
          !showDaypart ||
          daypartSchedule === undefined ||
          daypartSchedule === null ||
          (Array.isArray(daypartSchedule)
            ? daypartSchedule.length === 0
            : Object.keys(daypartSchedule).length === 0)
        ) {
          edit.day_parting_utc = null;
          edit.dayPartingUtc = null;
        } else {
          const daypartStr = JSON.stringify(daypartSchedule);
          edit.day_parting_utc = daypartStr;
          edit.dayPartingUtc = daypartStr;
        }

        console.log("FINAL INVENTORY SENT:", edit.campaignInventories);
        console.log("FINAL DOMAIN SENT:", edit.campaignDomains);

        edit.adDomain = formData.ad_domain;
        edit.blocked_category = currentBlockedCategory;
        edit.blocked_advertiser = formData.blocked_advertiser;
        edit.iabCategory = currentIabCategory;
        edit.blockedCategory = currentBlockedCategory;
        edit.blockedAdvertiser = formData.blocked_advertiser;

        delete edit.linkedAds;
        delete edit.linkedads;

        applyImpressionTypePayload(
          edit,
          formData.impressionCapValue || impressionCapValue,
        );

        const res = await updatecampaign(campaign_id, edit);
        console.log(
          "updatecampaign response res.data:",
          res ? res.data : "null",
        );
        const avFund = res && res.data ? findAvailableFund(res.data) : null;
        console.log("Found availableFund value in update:", avFund);
        if (
          res &&
          (res.data === true ||
            res.data === "true" ||
            avFund === true ||
            avFund === "true")
        ) {
          isCreateResponseFalse = true;
        }
        try {
          await vx.statusUpdateCampaign?.();
        } catch (e) {
        }
      }
      if (!campaign_id) {
        setCampaign(null);
        setFormData(initialFormData);
        setSelectedCategory([]);
        setDaypartSchedule(null);
      } else {
        console.log("🔥 BEFORE fetchapi in submit handler");
        await fetchapi();
        console.log("🔥 AFTER fetchapi in submit handler");
      }
      setIsLoading(false);
      try {
        sessionStorage.removeItem(storageKey);
        sessionStorage.removeItem(
          `campaignEditorStep_${id || campaign_id || "new"}`,
        );
      } catch (e) { }
      const targetBrandId = formData.brand_id || location.state?.brandId || "";
      const targetGroupId = formData.groupid || id || "";
      navigate("/admin/campaign-details", {
        replace: true,
        state: {
          brandId: targetBrandId || "32",
          groupId: targetGroupId,
          showSavedPopup: true,
          showFundAlert: isCreateResponseFalse,
        },
      });
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      Swal.fire({
        html: renderValidationSwalHtml(
          "Save Failed",
          "Unable to save the campaign. Please try again.",
        ),
        showConfirmButton: true,
        confirmButtonText: "OK",
        width: 500,
        padding: 0,
        background: "#ffffff",
        allowOutsideClick: false,
        buttonsStyling: false,
        customClass: {
          popup: "campaign-swal-popup",
          htmlContainer: "campaign-swal-body",
          actions: "campaign-swal-actions",
          confirmButton: "campaign-swal-confirm",
        },
      });
    }
  };
  const [openFraud, setOpenFraud] = useState(false);
  const [openInitialStatusDropdown, setOpenInitialStatusDropdown] =
    useState(false);
  const [openImpressionCap, setOpenImpressionCap] = useState(false);
  const [openCampaignType, setOpenCampaignType] = useState(false);

  const [openTimebase, setOpenTimebase] = useState(false);
  const [openPacingStatus, setOpenPacingStatus] = useState(false);
  const [openGoalStatus, setOpenGoalStatus] = useState(false);
  const [smartopenGoalStatus, smartsetOpenGoalStatus] = useState(false);
  const [openaudienceStatus, setOpenAudienceStatus] = useState(false);
  const [openaudienceStatus1, setOpenAudienceStatus1] = useState(false);
  const [open25audienceStatus, setOpen25AudienceStatus] = useState(false);
  const [open50audienceStatus, setOpen50AudienceStatus] = useState(false);
  const [open75audienceStatus, setOpen75AudienceStatus] = useState(false);
  const [open100audienceStatus, setOpen100AudienceStatus] = useState(false);
  const [opengoalstar, setOpenGoalstr] = useState(false);
  const [openevalutiongroup, setOpenEvalutiongroup] = useState(false);
  const [openevalutionperiod, setOpenEvalutionperiod] = useState(false);
  const [opensamplevalue, setOpenSampleValue] = useState(false);
  const [openBidMultiplier, setOpenBidMultiplier] = useState(false);
  const [openBidShadingMultiplier, setOpenBidShadingMultiplier] =
    useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      const wrappers = [
        "bidder-status-wrapper",
        "campaign-type-wrapper",
        "fraud-dropdown-wrapper",
        "rules-wrapper",
        "audiencepercentage",
        "audience50percentage",
        "audience75percentage",
        "audience100percentage",
        "goal_ctr",
        "evalution_group",
        "evalution_period",
        "sample_value",
        "optimizestatus",
        "optimizestatussmartbid",
        "exchanges-wrapper",
        "timebase-wrapper",
        "model-wrapper",
        "make-wrapper",
        "browser-wrapper",
        "language-wrapper",
        "iab-wrapper",
        "pacedelivery",
        "impressioncap",
        "bidmultiplier-wrapper",
        "bidshadingmultiplier-wrapper",
      ];

      const clickedInsideAny = wrappers.some((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        return (
          el.contains(event.target) ||
          event.target.closest(".custom-dropdown-option")
        );
      });
      if (!clickedInsideAny) {
        setOpenInitialStatusDropdown(false);
        setOpenCampaignType(false);
        setOpenImpressionCap(false);
        setOpenPacingStatus(false);
        setOpenGoalStatus(false);
        smartsetOpenGoalStatus(false);
        setOpenAudienceStatus(false);
        setOpen25AudienceStatus(false);
        setOpen50AudienceStatus(false);
        setOpen75AudienceStatus(false);
        setOpen100AudienceStatus(false);
        setOpenGoalstr(false);
        setOpenEvalutiongroup(false);
        setOpenEvalutionperiod(false);
        setOpenSampleValue(false);
        setOpenFraud(false);
        setOpenRules(false);
        setOpenExchanges(false);
        setOpenTimebase(false);
        setOpenModels(false);
        setOpenMakes(false);
        setOpenBrowsers(false);
        setOpenLanguages(false);
        setOpenIab(false);
        setOpenBidMultiplier(false);
        setOpenBidShadingMultiplier(false);
      }
    }
    function handleEsc(event) {
      if (event.key === "Escape") {
        setOpenInitialStatusDropdown(false);
        setOpenCampaignType(false);
        setOpenImpressionCap(false);
        setOpenPacingStatus(false);
        setOpenGoalStatus(false);
        smartsetOpenGoalStatus(false);
        setOpenAudienceStatus(false);
        setOpen25AudienceStatus(false);
        setOpen50AudienceStatus(false);
        setOpen75AudienceStatus(false);
        setOpen100AudienceStatus(false);
        setOpenGoalstr(false);
        setOpenEvalutiongroup(false);
        setOpenEvalutionperiod(false);
        setOpenSampleValue(false);
        setOpenRules(false);
        setOpenExchanges(false);
        setOpenTimebase(false);
        setOpenModels(false);
        setOpenMakes(false);
        setOpenBrowsers(false);
        setOpenLanguages(false);
        setOpenIab(false);
        setOpenBidMultiplier(false);
        setOpenBidShadingMultiplier(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (openBidMultiplier && bidMultiplierMenuRef.current) {
      setTimeout(() => {
        const menu = bidMultiplierMenuRef.current;
        const selectedItem = menu?.querySelector(
          ".custom-dropdown-option.selected",
        );
        if (selectedItem && menu) {
          menu.scrollTop = selectedItem.offsetTop;
        }
      }, 50);
    }
  }, [openBidMultiplier]);

  useEffect(() => {
    if (openBidShadingMultiplier && bidShadingMultiplierMenuRef.current) {
      setTimeout(() => {
        const menu = bidShadingMultiplierMenuRef.current;
        const selectedItem = menu?.querySelector(
          ".custom-dropdown-option.selected",
        );
        if (selectedItem && menu) {
          menu.scrollTop = selectedItem.offsetTop;
        }
      }, 50);
    }
  }, [openBidShadingMultiplier]);

  useEffect(() => {
    if (openGoalStatus && goalStatusMenuRef.current) {
      setTimeout(() => {
        const menu = goalStatusMenuRef.current;
        const selectedItem = menu?.querySelector(
          ".custom-dropdown-option.selected",
        );
        if (selectedItem && menu) {
          menu.scrollTop = selectedItem.offsetTop;
        }
      }, 50);
    }
  }, [openGoalStatus]);

  useEffect(() => {
    if (smartopenGoalStatus && smartGoalStatusMenuRef.current) {
      setTimeout(() => {
        const menu = smartGoalStatusMenuRef.current;
        const selectedItem = menu?.querySelector(
          ".custom-dropdown-option.selected",
        );
        if (selectedItem && menu) {
          menu.scrollTop = selectedItem.offsetTop;
        }
      }, 50);
    }
  }, [smartopenGoalStatus]);

  const getStatusOptions = (status) => {
    if (status === "runnable") {
      return [
        { label: "runnable", value: "runnable" },
        { label: "Offline", value: "Offline" },
      ];
    }
    return [
      { label: "Offline", value: "Offline" },
      { label: "runnable", value: "runnable" },
    ];
  };

  //getCampaignType

  const getCampaignType = (selectedType) => {
    const options = [
      { label: "CPA", value: "CPA" },
      { label: "CPC", value: "CPC" },
      { label: "CPM", value: "CPM" },
      { label: "CPI", value: "CPI" },
    ];

    const selectedIndex = options.findIndex(
      (opt) => opt.value === selectedType,
    );

    if (selectedIndex <= 0) {
      return options;
    }

    return [
      options[selectedIndex],
      ...options.filter((_, idx) => idx !== selectedIndex),
    ];
  };
  useEffect(() => {
    const now = new Date();
    setStartDate(now);
    setEndDate(new Date(now.getTime() + 60 * 60 * 1000));
  }, []);
  const [openModels, setOpenModels] = useState(false);

  const [openMakes, setOpenMakes] = useState(false);

  const [openBrowsers, setOpenBrowsers] = useState(false);

  const [openLanguages, setOpenLanguages] = useState(false);

  const [openIab, setOpenIab] = useState(false);
  const [isAllIabSelected, setIsAllIabSelected] = useState(false);
  const getLabel = () => {
    if (campaign.sqlid === -1) return <div>Save</div>;
    return <div>Update</div>;
  };


  const handleUseBidChange = (e) => {
    const checked = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      usebid: checked,
    }));
  };

  const handlebidshadingChange = (e) => {
    const checked = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      bid_shading: checked,
    }));
  };

  const handlecros_device = (e) => {
    setFormData((prev) => {
      const checked = e.target.checked;
      return {
        ...prev,
        cross_device: checked,
      };
    });
  };

  const showValidationError = async (errorFields = []) => {
    let validationMessage = "";
    if (typeof errorFields === "string") {
      validationMessage = errorFields;
    } else if (Array.isArray(errorFields) && errorFields.length) {
      validationMessage = `${errorFields.join(", ")} ${errorFields.length > 1 ? "are" : "is"
        } mandatory fields.`;
    } else {
      validationMessage = "Please ensure all fields are valid.";
    }

    await Swal.fire({
      html: renderValidationSwalHtml("Validation Error", validationMessage),
      showConfirmButton: true,
      confirmButtonText: "OK",
      width: 500,
      padding: 0,
      background: "#ffffff",
      allowOutsideClick: false,
      buttonsStyling: false,
      customClass: {
        popup: "campaign-swal-popup",
        htmlContainer: "campaign-swal-body",
        actions: "campaign-swal-actions",
        confirmButton: "campaign-swal-confirm",
      },
    });
  };

  const getBasicsIncompleteCount = () => {
    let count = 0;
    if (!String(formData.name || "").trim()) count++;
    const domainVal = String(formData.ad_domain || "").trim();
    if (!domainVal) {
      count++;
    } else {
      const urlPattern = /^(https?:\/\/)?([a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,63})(:[0-9]{1,5})?(\/.*)?$/i;
      if (!urlPattern.test(domainVal)) {
        count++;
      }
    }
    if (!String(formData.price || "").trim()) count++;
    return count;
  };

  const isPacingModeEnabled =
    impressionCapType === "AllTime" && pacingType === "Impressions";

  const getStepProgress = () => {
    const basicsIncomplete = getBasicsIncompleteCount();
    const basicsComplete = 3 - basicsIncomplete;
    return Math.round((basicsComplete / 3) * 100);
  };
  const stepProgress = getStepProgress();

  const isStepCompleted = (idx) => {
    if (getBasicsIncompleteCount() > 0) {
      return false;
    }
    if (idx < step) return true;
    if (idx === step && step === steps.length - 1) return true;
    return false;
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const offset = 75;
    let scrollContainer = null;
    let parent = section.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }
    if (
      scrollContainer &&
      scrollContainer !== document.body &&
      scrollContainer !== document.documentElement
    ) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = section.getBoundingClientRect();
      const targetScrollTop =
        scrollContainer.scrollTop +
        (elementRect.top - containerRect.top) -
        offset;
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    } else {
      // Fallback to window scroll
      const targetScrollTop =
        window.scrollY + section.getBoundingClientRect().top - offset;
      window.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  };
  const redraw = () => {
    setCount(count + 1);
  };
  return (
    <>
      {camViewUser && (
        <>
          <div className="campaign-wrap">
            <div className={`campaign-loader-overlay ${isLoading ? "show" : ""}`} >
              <Spinner className="campaign-loader-spinner camp-style-2" />
            </div>
            <Row className="g-3 align-items-start">
              <Col xl="10" lg="9" md="12">
                <div className="campaign-main mt-5" ref={mainScrollRef}>
                  <div className="campaign-page-header mb-4 camp-style-3" >
                    <h3 className="campaign-page-title camp-style-4" >
                      <span>{campaignEdit ? "Edit Campaign" : "Create Campaign"}</span>
                      {campaignType && (
                        <>
                          <span className="camp-style-5">/</span>
                          <span className="camp-style-6">
                            {campaignType}
                          </span>
                        </>
                      )}
                    </h3>
                  </div>
                  <div className="campaign-card">
                    <div className="step-scroll">
                      <div id="campaign-section-basics" className="campaign-section-target">
                        <div className="campaign-section-card">
                          <div
                            className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${activeSubTab === "basics" ? "active-header" : ""} camp-style-7`}>
                            <div>
                              <div className="fw-bold mb-1 camp-style-8">
                                Basics
                              </div>
                              <span className="text-muted camp-style-9"></span>
                            </div>
                          </div>
                          <Row className="pl-md-1  mb-3 campaign-basics-top-row">
                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Initial Status
                                <i className="fa fa-info-circle ms-2 offcircle" id="tooltip-status" />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-status">
                                  Choose whether your campaign starts in an
                                  online or offline state. You can change your
                                  status at any time throughout your campaign.
                                </UncontrolledTooltip>
                              </Label>
                              <div id="bidder-status-wrapper" className="position-relative">
                                <div className="campaign-select-wrapper">
                                  <Input
                                    readOnly
                                    value={
                                      formData.status ? formData.status : ""
                                    }
                                    className="form-control normalized-input campaign-select-input camp-style-10"

                                    onClick={() => {
                                      setOpenInitialStatusDropdown(
                                        !openInitialStatusDropdown,
                                      );
                                      setOpenRules(false);
                                      setOpenCampaignType(false);
                                    }}
                                    tabIndex={0}
                                  />
                                  <FaCaretDown
                                    className={`custom-select-icon campaign-select-icon ${openInitialStatusDropdown ? "open" : ""
                                      }`}
                                  />
                                </div>

                                {openInitialStatusDropdown && (
                                  <div className="custom-dropdown-menu biddeript-b">
                                    {(
                                      getStatusOptions(campaign?.status) || []
                                    ).map((opt, idx) => {
                                      const isSelected =
                                        formData.status === opt.value;
                                      return (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              status: opt.value,
                                            }));
                                            setOpenInitialStatusDropdown(false);
                                            setOpenCampaignType(false);
                                          }}
                                          className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                            }`}
                                        >
                                          <span className="tick-icon">
                                            {isSelected && "✓"}
                                          </span>

                                          <span>{opt.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </Col>

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Campaign Type
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-campaign-type"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-campaign-type"
                                >
                                  Select the pricing model for your campaign
                                  (e.g., CPA, CPC, CPM).
                                </UncontrolledTooltip>
                              </Label>
                              <div
                                id="campaign-type-wrapper"
                                className="position-relative"
                              >
                                <div className="campaign-select-wrapper">
                                  <Input
                                    readOnly
                                    value={
                                      formData.campaign_type
                                        ? formData.campaign_type
                                        : ""
                                    }
                                    className="form-control normalized-input campaign-select-input camp-style-10"

                                    onClick={() => {
                                      setOpenCampaignType(!openCampaignType);
                                      setOpenRules(false);
                                      setOpenInitialStatusDropdown(false);
                                    }}
                                    tabIndex={0}
                                  />
                                  <FaCaretDown
                                    className={`custom-select-icon campaign-select-icon ${openCampaignType ? "open" : ""
                                      }`}
                                  />
                                </div>

                                {openCampaignType && (
                                  <div className="custom-dropdown-menu biddeript-b">
                                    {(
                                      getCampaignType(formData.campaign_type) ||
                                      []
                                    ).map((opt, idx) => {
                                      const isSelected =
                                        formData.campaign_type === opt.value;
                                      return (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            setFormData((prev) => ({
                                              ...prev,
                                              campaign_type: opt.value,
                                            }));
                                            setOpenCampaignType(false);
                                          }}
                                          className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                            }`}
                                        >
                                          <span className="tick-icon">
                                            {isSelected && "✓"}
                                          </span>

                                          <span>{opt.label}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </Col>

                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="mb-0 forms-labels">
                                Campaign Name{" "}
                                <span className="text-danger">*</span>
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-campaign-name"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-campaign-name"
                                >
                                  Enter a unique name to identify this campaign
                                  in your reports and dashboard.
                                </UncontrolledTooltip>
                              </Label>
                              <Input
                                id="name"
                                onMouseEnter={() => {
                                  setTooltipOpen((t) => ({
                                    ...t,
                                    name: true,
                                  }));
                                }}
                                onMouseLeave={() => {
                                  setTooltipOpen((t) => ({
                                    ...t,
                                    name: false,
                                  }));
                                }}
                                value={formData.name}
                                onChange={(e) => {
                                  const { value } = e.target;

                                  // Allow only letters, spaces and underscore
                                  const regex = /^[A-Za-z_ ]*$/;

                                  if (!regex.test(value)) {
                                    setFormErrors({
                                      ...formErrors,
                                      name: "Only letters, spaces, and underscore (_) are allowed",
                                    });
                                    return;
                                  }

                                  setFormErrors({
                                    ...formErrors,
                                    name: "",
                                  });

                                  const newValue = value;

                                  setFormData((prev) => {
                                    const hasExternalName = Boolean(
                                      String(prev.externalname || "").trim(),
                                    );

                                    let nextConversionUrl = prev.conversionUrl;
                                    let nextViewthroughUrl =
                                      prev.viewthroughConversionUrl;

                                    if (!hasExternalName) {
                                      nextConversionUrl = updateUrlCParameter(
                                        prev.conversionUrl,
                                        "",
                                        newValue,
                                      );

                                      nextViewthroughUrl = updateUrlCParameter(
                                        prev.viewthroughConversionUrl,
                                        "",
                                        newValue,
                                      );
                                    }

                                    return {
                                      ...prev,
                                      name: newValue,
                                      conversionUrl: nextConversionUrl,
                                      viewthroughConversionUrl:
                                        nextViewthroughUrl,
                                    };
                                  });
                                }}
                                className={`form-control normalized-input campaign-btn ${formErrors.name
                                  ? "custom-error  border-danger"
                                  : ""
                                  }`}
                                placeholder="Campaign Name"
                                type="text"
                                autoComplete="off"
                              />
                              {formErrors.name && (
                                <Tooltip
                                  placement="bottom"
                                  isOpen={tooltipOpen.name}
                                  target="name"
                                  autohide={false}
                                  popperClassName="custom-tooltip"
                                >
                                  <div className="one"></div>
                                  {formErrors.name}
                                </Tooltip>
                              )}
                            </Col>

                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="mb-0 forms-labels">
                                External Campaign Name
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-External-campaign-name"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-External-campaign-name"
                                >
                                  Optional name used for mapping or syncing
                                  with external tracking systems.
                                </UncontrolledTooltip>
                              </Label>
                              <Input
                                id="externalname"
                                onMouseEnter={() => {
                                  setTooltipOpen((t) => ({
                                    ...t,
                                    externalname: true,
                                  }));
                                }}
                                onMouseLeave={() => {
                                  setTooltipOpen((t) => ({
                                    ...t,
                                    externalname: false,
                                  }));
                                }}
                                value={formData.externalname}
                                onChange={(e) => {
                                  const { value } = e.target;

                                  const regex = /^[A-Za-z_ ]*$/;

                                  if (!regex.test(value)) {
                                    setFormErrors({
                                      ...formErrors,
                                      externalname:
                                        "Only letters, spaces, and underscore (_) are allowed",
                                    });
                                    return;
                                  }

                                  setFormErrors({
                                    ...formErrors,
                                    externalname: "",
                                  });

                                  const newValue = value;

                                  setFormData((prev) => {
                                    const nextConversionUrl =
                                      updateUrlCParameter(
                                        prev.conversionUrl,
                                        newValue,
                                        prev.name,
                                      );

                                    const nextViewthroughConversionUrl =
                                      updateUrlCParameter(
                                        prev.viewthroughConversionUrl,
                                        newValue,
                                        prev.name,
                                      );

                                    return {
                                      ...prev,
                                      externalname: newValue,
                                      conversionUrl: nextConversionUrl,
                                      viewthroughConversionUrl:
                                        nextViewthroughConversionUrl,
                                    };
                                  });
                                }}
                                className={`form-control normalized-input campaign-btn ${formErrors.externalname
                                  ? "custom-error  border-danger"
                                  : ""
                                  }`}
                                placeholder="External Campaign"
                                type="text"
                                autoComplete="off"
                              />
                              {formErrors.externalname && (
                                <Tooltip
                                  placement="bottom"
                                  isOpen={tooltipOpen.externalname}
                                  target="externalname"
                                  autohide={false}
                                  popperClassName="custom-tooltip"
                                >
                                  <div className="one"></div>
                                  {formErrors.externalname}
                                </Tooltip>
                              )}
                            </Col>
                          </Row>

                          <Row className="pl-md-1 mb-3">
                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="mb-0 forms-labels">
                                App/Bundle Id
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-App-Bundle-Id"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-App-Bundle-Id"
                                >
                                  The unique package name or bundle identifier
                                  of the application (e.g., com.example.app).
                                </UncontrolledTooltip>
                              </Label>
                              <Input
                                id="app_web_id"
                                value={formData.app_web_id}
                                type="text"
                                autoComplete="off"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    app_web_id: value,
                                  }));
                                }}
                                className="form-control campaign-btn"
                              />
                            </Col>

                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="mb-0 forms-labels">
                                App/Web Name
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-App-Web-Name"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-App-Web-Name"
                                >
                                  The user-facing name of the application or
                                  website where ads will be shown.
                                </UncontrolledTooltip>
                              </Label>
                              <Input
                                id="app_web_name"
                                value={formData.app_web_name}
                                type="text"
                                autoComplete="off"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData((prev) => {
                                    const oldAppWebName = prev.app_web_name;
                                    const nextConversionUrl = updateUrlAppId(
                                      prev.conversionUrl,
                                      oldAppWebName,
                                      value,
                                    );
                                    const nextViewthroughConversionUrl =
                                      updateUrlAppId(
                                        prev.viewthroughConversionUrl,
                                        oldAppWebName,
                                        value,
                                      );
                                    return {
                                      ...prev,
                                      app_web_name: value,
                                      conversionUrl: nextConversionUrl,
                                      viewthroughConversionUrl:
                                        nextViewthroughConversionUrl,
                                    };
                                  });
                                }}
                                className="form-control campaign-btn"
                              />
                            </Col>

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Default CPM Bid{" "}
                                <span className="text-danger">*</span>
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-default-cpm"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-default-cpm"
                                >
                                  The default cost per mille (thousand
                                  impressions) bid you are willing to pay.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="campaign-currency position-relative">
                                <Input
                                  type="text"
                                  id="price"
                                  value={formData.price || ""}
                                  onMouseEnter={() => {
                                    setTooltipOpen((t) => ({
                                      ...t,
                                      price: true,
                                    }));
                                  }}
                                  onMouseLeave={() => {
                                    setTooltipOpen((t) => ({
                                      ...t,
                                      price: false,
                                    }));
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    setFormErrors((prev) => ({
                                      ...prev,
                                      price: "",
                                    }));

                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                      {
                                        setFormData((prev) => ({
                                          ...prev,
                                          price: value,
                                        }));
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    if (formData.price) {
                                      const n = parseFloat(formData.price);
                                      if (!isNaN(n))
                                        setFormData((prev) => ({
                                          ...prev,
                                          price: n.toFixed(2),
                                        }));
                                    }
                                  }}
                                  className={`form-control campaign-btn form-control ${formErrors.price
                                    ? "custom-error border-danger"
                                    : ""
                                    }`}
                                  placeholder=""
                                />
                                <span className="usd">USD</span>
                              </div>
                              {formErrors.price && (
                                <Tooltip
                                  placement="bottom"
                                  isOpen={tooltipOpen.price}
                                  target="price"
                                  autohide={false}
                                  popperClassName="custom-tooltip"
                                >
                                  <div className="one"></div>
                                  {formErrors.price}
                                </Tooltip>
                              )}
                            </Col>

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Max Bid
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-max-bid"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-max-bid"
                                >
                                  Max Bid is the highest price that the campaign
                                  can bid on impressions, taking into account
                                  any adjustments such as multipliers,
                                  optimization, or adaptive deal bidding.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="campaign-currency position-relative">
                                <Input
                                  type="text"
                                  id="cpm_bid"
                                  value={formData.cpm_bid}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                      {
                                        setFormData((prev) => ({
                                          ...prev,
                                          cpm_bid: value,
                                        }));
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    if (formData.cpm_bid) {
                                      const n = parseFloat(formData.cpm_bid);
                                      if (!isNaN(n))
                                        setFormData((prev) => ({
                                          ...prev,
                                          cpm_bid: n.toFixed(2),
                                        }));
                                    }
                                  }}
                                  className={`form-control campaign-btn form-control ${formErrors.cpm_bid
                                    ? "custom-error border-danger"
                                    : ""
                                    }`}
                                  placeholder=""
                                />
                                <span className="usd">USD</span>
                              </div>

                              {formErrors.cpm_bid && (
                                <div
                                  className="custom-feedback camp-style-11"

                                >
                                  {formErrors.cpm_bid}
                                </div>
                              )}
                            </Col>
                          </Row>
                          <Row className="pl-md-1 mb-3">
                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="mb-0 forms-labels">
                                Brand Categories
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-brand-category"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-brand-category"
                                >
                                  Select the categories that best describe your
                                  brand or campaign to ensure proper ad placement.
                                </UncontrolledTooltip>
                              </Label>
                              <Button
                                color=""
                                size="md"
                                className={`w-100 choose ${formErrors.iab_category ? "border-danger" : ""}`}
                                onClick={() => {
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    iab_category: "",
                                  }));
                                  togglebrandcategorysModal();
                                }}
                              >
                                Choose categories
                              </Button>
                              {formErrors.iab_category && (
                                <div
                                  className="text-danger mt-1 small camp-style-12"

                                >
                                  {formErrors.iab_category}
                                </div>
                              )}
                              {!isCategoryMappingsLoading &&
                                selectedCategory.length > 0 && (
                                  <div className="mt-2 d-flex flex-wrap">
                                    {getGroupedCategoryDisplay(
                                      selectedCategory,
                                    ).map((item) => (
                                      <span
                                        key={item.key}
                                        className="country-tag me-2 mb-1"
                                      >
                                        {item.label}
                                        <span
                                          className="remove-tag ms-1 camp-style-13"

                                          onClick={() => {
                                            setSelectedCategory(
                                              selectedCategory.filter(
                                                (category) =>
                                                  !item.itemsToRemove.includes(
                                                    category,
                                                  ),
                                              ),
                                            );
                                          }}
                                        >
                                          ×
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                            </Col>

                            {/* <Col md="2" sm="12" className="campaign-field">
                      <Label className="forms-labels">
                        Use bid multipliers
                        <i
                          className="fa fa-info-circle offcircle ms-2 editor-tooltip"
                          id="tooltip-bid-multi"
                        />
                        <UncontrolledTooltip
                          placement="right"
                          target="tooltip-bid-multi"
                        >
                          Video ad plays as the primary focus without video
                          content.
                        </UncontrolledTooltip>
                      </Label>
                      <div className="d-flex align-items-center">
                        <Input
                          type="checkbox"
                          id="usebid-multipliers"
                          checked={formData.usebid}
                          onChange={handleUseBidChange}
                        />
                        <Label for="usebid-multipliers" className="ms-2 mb-0">
                          <span className="usebid">Enable</span>
                        </Label>
                      </div>
                    </Col> */}

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Use bid multipliers
                                <i
                                  className="fa fa-info-circle offcircle ms-2 editor-tooltip"
                                  id="tooltip-bid-multi"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-bid-multi"
                                >
                                  Adjust bids dynamically based on device,
                                  location, or publisher.
                                </UncontrolledTooltip>
                              </Label>

                              <div className="d-flex align-items-center gap-2">
                                <Input
                                  type="checkbox"
                                  id="usebid-multipliers"
                                  checked={formData.usebid}
                                  onChange={handleUseBidChange}
                                />

                                <Label
                                  for="usebid-multipliers"
                                  className="mb-0"
                                >
                                  <span className="usebid">Enable</span>
                                </Label>

                                {formData.usebid && (
                                  <div
                                    id="bidmultiplier-wrapper"
                                    className="position-relative camp-style-14"

                                  >
                                    <div
                                      className="campaign-select-wrapper camp-style-15"

                                    >
                                      <Input
                                        readOnly
                                        value={String(
                                          normalizeBidMultiplier(
                                            formData.bid_Multiplier,
                                          ).toFixed(1),
                                        )}
                                        className="form-control campaign-select-input camp-style-16"

                                        onClick={() => {
                                          setOpenBidMultiplier(
                                            !openBidMultiplier,
                                          );
                                          setOpenBidShadingMultiplier(false);
                                        }}
                                        tabIndex={0}
                                      />
                                      <FaCaretDown
                                        className={`custom-select-icon campaign-select-icon camp-multiplier-select-icon ${openBidMultiplier ? "open" : ""}`}
                                      />
                                    </div>

                                    {openBidMultiplier && (
                                      <div
                                        ref={bidMultiplierMenuRef}
                                        className="custom-dropdown-menu position-absolute camp-style-17"

                                      >
                                        {BID_MULTIPLIER_OPTIONS.map((val) => {
                                          const isSelected =
                                            String(
                                              normalizeBidMultiplier(
                                                formData.bid_Multiplier,
                                              ).toFixed(1),
                                            ) === val;
                                          return (
                                            <div
                                              key={val}
                                              onClick={() => {
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  bid_Multiplier:
                                                    normalizeBidMultiplier(val),
                                                }));
                                                setOpenBidMultiplier(false);
                                              }}
                                              className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                            >
                                              <span className="tick-icon">
                                                {isSelected && "✓"}
                                              </span>
                                              <span>{val}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Col>

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Cross-Device
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-cross-device"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-cross-device"
                                >
                                  Enable targeting users across different
                                  devices they own.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex align-items-center">
                                <Input
                                  type="checkbox"
                                  id="cross-device"
                                  checked={formData.cross_device}
                                  onChange={handlecros_device}
                                />
                                <Label for="cross-device" className="ms-2 mb-0">
                                  <span className="usebid">
                                    Enable cross-device
                                  </span>
                                </Label>
                              </div>
                            </Col>

                            {/* <Col md="2" sm="12" className="campaign-field">
                      <Label className="forms-labels">
                        Bid Shading
                        <i
                          className="fa fa-info-circle offcircle ms-2"
                          id="tooltip-bid-shading"
                        />
                        <UncontrolledTooltip
                          placement="right"
                          target="tooltip-bid-shading"
                        >
                          Choose the type of placements where you want to play
                          your video ad.
                        </UncontrolledTooltip>
                      </Label>
                      <div className="d-flex align-items-center gap-4 mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <Input
                            type="radio"
                            name="bid_shading"
                            value="1"
                            checked={formData.bid_shading === "1"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bid_shading: e.target.value,
                                make: [],
                              })
                            }
                          />
                          <span className="text-gray-700 devices">On</span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <Input
                            type="radio"
                            name="bid_shading"
                            value="0"
                            checked={formData.bid_shading === "0"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bid_shading: e.target.value,
                              })
                            }
                          />
                          <span className="text-gray-700 devices">Off</span>
                        </div>
                      </div>
                    </Col> */}

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Bid Shading
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-bid-shading"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-bid-shading"
                                >
                                  Enable automatic bid optimization to pay the
                                  lowest possible price for an impression.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex align-items-center gap-2">
                                <Input
                                  type="checkbox"
                                  id="bidshading-multipliers"
                                  checked={formData.bid_shading}
                                  onChange={handlebidshadingChange}
                                />

                                <Label
                                  for="bidshading-multipliers"
                                  className="mb-0"
                                >
                                  <span className="usebid">Enable</span>
                                </Label>

                                {formData.bid_shading && (
                                  <div
                                    id="bidshadingmultiplier-wrapper"
                                    className="position-relative camp-style-14"

                                  >
                                    <div
                                      className="campaign-select-wrapper camp-style-15"

                                    >
                                      <Input
                                        readOnly
                                        value={String(
                                          normalizeBidMultiplier(
                                            formData.bidshading_Multiplier,
                                          ).toFixed(1),
                                        )}
                                        className="form-control campaign-select-input camp-style-16"

                                        onClick={() => {
                                          setOpenBidShadingMultiplier(
                                            !openBidShadingMultiplier,
                                          );
                                          setOpenBidMultiplier(false);
                                        }}
                                        tabIndex={0}
                                      />
                                      <FaCaretDown
                                        className={`custom-select-icon campaign-select-icon camp-multiplier-select-icon ${openBidShadingMultiplier ? "open" : ""}`}
                                      />
                                    </div>

                                    {openBidShadingMultiplier && (
                                      <div
                                        ref={bidShadingMultiplierMenuRef}
                                        className="custom-dropdown-menu position-absolute camp-style-17"

                                      >
                                        {BID_MULTIPLIER_OPTIONS.map((val) => {
                                          const isSelected =
                                            String(
                                              normalizeBidMultiplier(
                                                formData.bidshading_Multiplier,
                                              ).toFixed(1),
                                            ) === val;
                                          return (
                                            <div
                                              key={val}
                                              onClick={() => {
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  bidshading_Multiplier:
                                                    normalizeBidMultiplier(val),
                                                }));
                                                setOpenBidShadingMultiplier(
                                                  false,
                                                );
                                              }}
                                              className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                            >
                                              <span className="tick-icon">
                                                {isSelected && "✓"}
                                              </span>
                                              <span>{val}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Col>

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Frequency Cap{" "}
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-freq-cap"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-freq-cap"
                                >
                                  Limit the number of times a single user sees
                                  your ad within a given timeframe.
                                </UncontrolledTooltip>
                              </Label>

                              <div className="d-flex align-items-center gap-4 mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="capspec_on"
                                    id="capspec_on"
                                    value="1"
                                    checked={formData.capspec === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        capspec: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    On
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="capspec_off"
                                    id="capspec_off"
                                    value="0"
                                    checked={formData.capspec === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        capspec: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    Off
                                  </span>
                                </div>
                              </div>
                            </Col>

                            <BrandcategoryModal
                              modalOpen={brandcategorysModalOpen}
                              toggleModal={togglebrandcategorysModal}
                              selectedCategory={selectedCategory}
                              setSelectedCategory={setSelectedCategory}
                              onCategoriesLoaded={(dataMap, nameMap) => {
                                setCategoriesDataMap(dataMap);
                                setCategoriesNameMap(nameMap);
                                setIsCategoryMappingsLoading(false);
                              }}
                            />
                          </Row>

                          <Row className="pl-md-1 mb-3 align-items-start">
                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="mb-0 forms-labels">
                                Ad Domain <span className="text-danger">*</span>
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-ad-domain"
                                />
                                <UncontrolledTooltip
                                  placement="bottom"
                                  target="tooltip-ad-domain"
                                >
                                  The destination domain name of your
                                  advertisement (e.g., example.com).
                                </UncontrolledTooltip>
                              </Label>
                              <Input
                                id="ad_domain"
                                value={formData.ad_domain}
                                placeholder="Domain name (example.com or example.com/page)"
                                type="text"
                                autoComplete="off"
                                onMouseEnter={() => {
                                  setTooltipOpen((t) => ({
                                    ...t,
                                    ad_domain: true,
                                  }));
                                }}
                                onMouseLeave={() => {
                                  setTooltipOpen((t) => ({
                                    ...t,
                                    ad_domain: false,
                                  }));
                                }}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  setFormData((prev) => ({
                                    ...prev,
                                    ad_domain: value,
                                  }));

                                  // Clear any existing errors
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    ad_domain: "",
                                  }));
                                }}
                                className={`form-control campaign-btn ${formErrors.ad_domain
                                  ? "custom-error border-danger"
                                  : ""
                                  }`}
                              />

                              {formErrors.ad_domain && (
                                <Tooltip
                                  placement="bottom"
                                  isOpen={tooltipOpen.ad_domain}
                                  target="ad_domain"
                                  autohide={false}
                                  popperClassName="custom-tooltip"
                                >
                                  <div className="one"></div>
                                  {formErrors.ad_domain}
                                </Tooltip>
                              )}
                            </Col>

                            {formData.capspec === "1" && (
                              <Col
                                md="8"
                                sm="12"
                                className="campaign-field d-flex flex-column align-items-end"
                              >
                                <Label
                                  className="mb-0 forms-labels d-none d-md-block camp-style-18"

                                >
                                  Spacer
                                </Label>
                                <div className="d-flex flex-wrap flex-md-nowrap align-items-center gap-3 mt-md-2 justify-content-end">
                                  <div
                                    className="d-flex align-items-center gap-2 frequency-item camp-style-19"

                                  >
                                    <Label
                                      for="capcount"
                                      className="mb-0 text-nowrap forms-labels"
                                    >
                                      Show my ad
                                    </Label>

                                    <Input
                                      placeholder="0"
                                      onMouseEnter={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          capcount: true,
                                        }));
                                      }}
                                      onMouseLeave={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          capcount: false,
                                        }));
                                      }}
                                      type="text"
                                      id="capcount"
                                      name="capcount"
                                      autoComplete="off"
                                      value={formData.capcount}
                                      onChange={(e) => {
                                        const { value } = e.target;
                                        setFormErrors((prev) => ({
                                          ...prev,
                                          capcount: "",
                                        }));
                                        if (/^\d*$/.test(value)) {
                                          setFormData((prev) => ({
                                            ...prev,
                                            capcount: value
                                              ? parseInt(value, 10)
                                              : "",
                                          }));
                                        }
                                      }}
                                      className={`normalized-input countipt campagineditor ${formErrors.capcount ? "border-danger" : ""}`}
                                    />
                                    {formErrors.capcount && (
                                      <>
                                        <Tooltip
                                          placement="bottom"
                                          isOpen={tooltipOpen.capcount}
                                          target="capcount"
                                          autohide={false}
                                          popperClassName="custom-tooltip"
                                        >
                                          <div className="one"></div>
                                          {formErrors.capcount}
                                        </Tooltip>
                                      </>
                                    )}
                                  </div>

                                  <div className="d-flex align-items-center gap-2 frequency-item">
                                    <Label
                                      for="capexpire"
                                      className="mb-0 text-nowrap forms-labels"
                                    >
                                      Times every
                                    </Label>

                                    <Input
                                      placeholder="0"
                                      type="text"
                                      id="capexpire"
                                      name="capexpire"
                                      autoComplete="off"
                                      value={formData.capexpire}
                                      onMouseEnter={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          capexpire: true,
                                        }));
                                      }}
                                      onMouseLeave={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          capexpire: false,
                                        }));
                                      }}
                                      onChange={(e) => {
                                        setFormErrors((prev) => ({
                                          ...prev,
                                          capexpire: "",
                                        }));
                                        const { value } = e.target;
                                        if (/^\d*$/.test(value)) {
                                          setFormData((prev) => ({
                                            ...prev,
                                            capexpire: value,
                                          }));
                                        }
                                      }}
                                      className={`normalized-input countipt campagineditor${formErrors.capexpire ? " border-danger" : ""}`}
                                    />
                                    {formErrors.capexpire && (
                                      <>
                                        <Tooltip
                                          placement="bottom"
                                          isOpen={tooltipOpen.capexpire}
                                          target="capexpire"
                                          autohide={false}
                                          popperClassName="custom-tooltip"
                                        >
                                          <div className="one"></div>
                                          {formErrors.capexpire}
                                        </Tooltip>
                                      </>
                                    )}
                                  </div>

                                  <div className="d-flex align-items-center gap-2 frequency-item">
                                    <Label className="mb-0 text-nowrap forms-labels">
                                      Timebase
                                    </Label>
                                    <div
                                      id="timebase-wrapper"
                                      className="position-relative"
                                    >
                                      <div
                                        className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center timebipt-a"
                                        onClick={() =>
                                          setOpenTimebase(!openTimebase)
                                        }
                                        tabIndex={0}
                                      >
                                        {formData.capunit || "Select Timebase"}
                                        <FaCaretDown
                                          className={`custom-select-icon ${openTimebase ? "open" : ""
                                            }`}
                                        />
                                      </div>

                                      {openTimebase && (
                                        <div className="custom-dropdown-menu timebipt-b">
                                          {["Hours"].map((unit, index) => {
                                            const isSelected =
                                              formData.capunit === unit;
                                            return (
                                              <div
                                                key={index}
                                                onClick={() => {
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    capunit: unit,
                                                  }));
                                                  setOpenTimebase(false);
                                                }}
                                                className={`custom-dropdown-option timebipt-c ${isSelected ? "selected" : ""
                                                  } `}
                                              >
                                                <span className="tick-icon">
                                                  {isSelected && "✓"}
                                                </span>
                                                <span>{unit}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            )}
                          </Row>

                          {/* <Row>
                     <Col md="2" sm="12" className="campaign-field">
                      <Label className="forms-labels">
                        Target CPC <span className="text-danger">*</span>
                        <i
                          className="fa fa-info-circle offcircle ms-2"
                          id="tooltip-default-cpm"
                        />
                        <UncontrolledTooltip
                          placement="right"
                          target="tooltip-default-cpm"
                        >
                          
                        </UncontrolledTooltip>
                      </Label>
                      <div className="campaign-currency">
                        <Input
                          type="text"
                          id="cpc"
                          value={formData.cpc || ""}
                          onMouseEnter={() => {
                            setTooltipOpen((t) => ({
                              ...t,
                              cpc: true,
                            }));
                          }}
                          onMouseLeave={() => {
                            setTooltipOpen((t) => ({
                              ...t,
                              cpc: false,
                            }));
                          }}
                          onChange={(e) => {
                            const value = e.target.value;

                            setFormErrors((prev) => ({
                              ...prev,
                              cpc: "",
                            }));

                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                              {
                                setFormData((prev) => ({
                                  ...prev,
                                  cpc: value,
                                }));
                              }
                            }
                          }}
                          onBlur={() => {
                            if (formData.cpc) {
                              const n = parseFloat(formData.cpc);
                              if (!isNaN(n))
                                setFormData((prev) => ({
                                  ...prev,
                                  cpc: n.toFixed(2),
                                }));
                            }
                          }}
                          className={`form-control campaign-btn form-control ${
                            formErrors.cpc ? "custom-error border-danger" : ""
                          }`}
                          placeholder=""
                        />
                        <span className="usd">USD</span>
                      </div>
                      {formErrors.cpc && (
                        <Tooltip
                          placement="bottom"
                          isOpen={tooltipOpen.cpc}
                          target="price"
                          autohide={false}
                          popperClassName="custom-tooltip"
                        >
                          <div className="one"></div>
                          {formErrors.cpc}
                        </Tooltip>
                      )}
                    </Col>
                  </Row> */}

                          {false && (
                            <Row className="pl-md-1">
                              <Col
                                md="6"
                                sm="12"
                                id="maxbid"
                                className="campaign-field"
                              >
                                <Label className="forms-labels">
                                  Default CPM Bid{" "}
                                  <span className="text-danger">*</span>
                                  <i
                                    className="fa fa-info-circle offcircle ms-2"
                                    id="tooltip-default-cpm"
                                  />
                                  <UncontrolledTooltip
                                    placement="right"
                                    target="tooltip-default-cpm"
                                  >
                                    Choose the type of placements where you want
                                    to play your video ad.
                                  </UncontrolledTooltip>
                                </Label>
                                <Input
                                  type="text"
                                  id="price"
                                  value={formData.price || ""}
                                  onMouseEnter={() => {
                                    setTooltipOpen((t) => ({
                                      ...t,
                                      price: true,
                                    }));
                                  }}
                                  onMouseLeave={() => {
                                    setTooltipOpen((t) => ({
                                      ...t,
                                      price: false,
                                    }));
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    setFormErrors((prev) => ({
                                      ...prev,
                                      price: "",
                                    }));

                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                      {
                                        setFormData((prev) => ({
                                          ...prev,
                                          price: value,
                                        }));
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    if (formData.price) {
                                      const n = parseFloat(formData.price);
                                      if (!isNaN(n))
                                        setFormData((prev) => ({
                                          ...prev,
                                          price: n.toFixed(2),
                                        }));
                                    }
                                  }}
                                  className={`form-control campaign-btn bidipt ${formErrors.price
                                    ? "custom-error border-danger"
                                    : ""
                                    }`}
                                  placeholder=""
                                />
                                {formErrors.price && (
                                  <Tooltip
                                    placement="bottom"
                                    isOpen={tooltipOpen.price}
                                    target="price"
                                    autohide={false}
                                    popperClassName="custom-tooltip"
                                  >
                                    <div className="one"></div>
                                    {formErrors.price}
                                  </Tooltip>
                                )}
                                <span className="usd">USD</span>
                              </Col>

                              <Col
                                md="6"
                                sm="12"
                                id="maxbid"
                                className="campaign-field"
                              >
                                <Label className="forms-labels">
                                  Max Bid
                                  <i
                                    className="fa fa-info-circle offcircle ms-2"
                                    id="tooltip-max-bid"
                                  />
                                  <UncontrolledTooltip
                                    placement="right"
                                    target="tooltip-max-bid"
                                  >
                                    Choose the type of placements where you want
                                    to play your video ad.
                                  </UncontrolledTooltip>
                                </Label>
                                <Input
                                  type="text"
                                  id="cpm_bid"
                                  value={formData.cpm_bid}
                                  onChange={(e) => {
                                    const value = e.target.value;

                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                      {
                                        setFormData((prev) => ({
                                          ...prev,
                                          cpm_bid: value,
                                        }));
                                      }
                                    }
                                  }}
                                  onBlur={() => {
                                    if (formData.cpm_bid) {
                                      const n = parseFloat(formData.cpm_bid);
                                      if (!isNaN(n))
                                        setFormData((prev) => ({
                                          ...prev,
                                          cpm_bid: n.toFixed(2),
                                        }));
                                    }
                                  }}
                                  className={`form-control campaign-btn bidipt ${formErrors.cpm_bid
                                    ? "custom-error border-danger"
                                    : ""
                                    }`}
                                  placeholder=""
                                />

                                {formErrors.cpm_bid && (
                                  <div
                                    className="custom-feedback camp-style-11"

                                  >
                                    {formErrors.cpm_bid}
                                  </div>
                                )}

                                <span className="usd">USD</span>
                              </Col>
                            </Row>
                          )}

                          <Row className="pl-md-1"></Row>
                          {/* {formData.usebid && (
                        <Row className="pl-md-1">
                          <Col md="12" sm="12" className="campaign-field-help">
                            <div role="alert" className="how">
                              <i
                                className="fa fa-info-circle me-2"
                                id="mesaasgeicon"
                              ></i>
                              Make sure to set a Max Bid that's high enough to
                              bid on all selected deals when bid multipliers
                              take effect. See Campaign Max Bid
                            </div>
                          </Col>
                        </Row>
                      )} */}
                        </div>
                      </div>

                      <div
                        id="campaign-section-budget"
                        className="campaign-section-target"
                      >
                        <div className="campaign-section-card mt-4">
                          <div
                            className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${activeSubTab === "budget" ? "active-header" : ""} camp-style-7`}

                          >
                            <div>
                              <div
                                className="fw-bold mb-1 camp-style-8"

                              >
                                Budget
                              </div>
                              <span
                                className="text-muted camp-style-9"

                              ></span>
                            </div>
                          </div>

                          <Row className="pl-md-1 mb-3 campaign-basics-top-row">
                            <Col md="4" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Budget
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-budget"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tooltip-budget"
                                >
                                  A budget change may take up to 60 seconds to
                                  take effect. High volume sites sometimes cause
                                  overspend.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex flex-wrap align-items-center gap-3 mt-2">
                                <div
                                  className="campaign-currency position-relative camp-style-20"

                                >
                                  <Input
                                    placeholder=" "
                                    onMouseEnter={() => {
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        total_budget: true,
                                      }));
                                    }}
                                    onMouseLeave={() => {
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        total_budget: false,
                                      }));
                                    }}
                                    type="text"
                                    name="total_budget"
                                    id="total_budget"
                                    autoComplete="off"
                                    value={formData.total_budget || ""}
                                    onChange={(e) => {
                                      let value = e.target.value;
                                      value = value.replace("$", "").trim();
                                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          total_budget: `$${value}`,
                                        }));
                                        setFormErrors((prev) => ({
                                          ...prev,
                                          total_budget: "",
                                        }));
                                      }
                                      if (
                                        value &&
                                        formData.budget_limit_daily
                                      ) {
                                        if (
                                          Number(value) <
                                          Number(formData.budget_limit_daily)
                                        ) {
                                          setFormErrors((prev) => ({
                                            ...prev,
                                            total_budget:
                                              "Total Budget Greater Than Daily Budget & Hourly Budget",
                                          }));
                                        }
                                      }
                                    }}
                                    onBlur={() => {
                                      if (formData.total_budget) {
                                        const cleanValue = String(
                                          formData.total_budget || "",
                                        )
                                          .replace("$", "")
                                          .trim();

                                        const n = parseFloat(cleanValue);

                                        if (!isNaN(n)) {
                                          setFormData((prev) => ({
                                            ...prev,
                                            total_budget: `$${n.toFixed(2)}`,
                                          }));
                                        }
                                      }
                                    }}
                                    className={`form-control campaign-btn ${formErrors.total_budget
                                      ? "border-danger"
                                      : ""
                                      }`}
                                  />
                                  <span className="usd">USD</span>
                                  {formErrors.total_budget && (
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={tooltipOpen.total_budget}
                                      target="total_budget"
                                      autohide={false}
                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.total_budget}
                                    </Tooltip>
                                  )}
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <div className="d-flex align-items-center gap-1">
                                    <Input
                                      name="all_time"
                                      type="radio"
                                      value="1"
                                      checked={formData.all_time == "1"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          all_time: e.target.value,
                                          make: [],
                                        })
                                      }
                                    />
                                    <span
                                      className="text-gray-700 devices camp-style-21"

                                    >
                                      Daily
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-1">
                                    <Input
                                      type="radio"
                                      name="all_time"
                                      value="0"
                                      checked={formData.all_time == "0"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          all_time: e.target.value,
                                        })
                                      }
                                    />
                                    <span
                                      className="text-gray-700 devices camp-style-21"

                                    >
                                      All Time
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Col>

                            <Col md="3" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Impression Cap
                                <i
                                  className="fa fa-info-circle ms-2 offcircle"
                                  id="tooltip-impression-cap"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tooltip-impression-cap"
                                >
                                  Select impression cap type
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                                <div
                                  className="position-relative camp-style-22"
                                  id="impressioncap"

                                >
                                  <div className="campaign-select-wrapper">
                                    <Input
                                      readOnly
                                      value={impressionCapType}
                                      className="form-control normalized-input campaign-select-input camp-style-10"

                                      onClick={() =>
                                        setOpenImpressionCap(!openImpressionCap)
                                      }
                                      tabIndex={0}
                                    />
                                    <FaCaretDown
                                      className={`custom-select-icon campaign-select-icon ${openImpressionCap ? "open" : ""
                                        }`}
                                    />
                                  </div>

                                  {openImpressionCap && (
                                    <div className="custom-dropdown-menu">
                                      {impressionCapOptions.map((opt, idx) => (
                                        <div
                                          key={idx}
                                          className={`custom-dropdown-option  ${impressionCapType === opt.value
                                            ? "selected"
                                            : ""
                                            }`}
                                          onClick={(e) => {
                                            setImpressionCapType(opt.value);
                                            if (opt.value === "None") {
                                              setImpressionCapValue("");
                                              setFormData((prev) => ({
                                                ...prev,
                                                impression_cap: "None",
                                                impressionCap_Type: "None",
                                                impressionCapValue: "",
                                              }));
                                            } else {
                                              setFormData((prev) => ({
                                                ...prev,
                                                impression_cap: opt.value,
                                                impressionCap_Type: opt.value,
                                              }));
                                            }
                                            setOpenImpressionCap(false);
                                          }}
                                        >
                                          <span className="tick-icon">
                                            {impressionCapType === opt.value &&
                                              "✓"}
                                          </span>
                                          <span>{opt.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {impressionCapType !== "None" && (
                                  <div className="camp-style-22">
                                    <Input
                                      type="number"
                                      className="form-control campaign-btn"
                                      value={impressionCapValue}
                                      onChange={(e) => {
                                        setImpressionCapValue(e.target.value);
                                        setFormData((prev) => ({
                                          ...prev,
                                          impressionCapValue: e.target.value,
                                          impressionCap_Type: impressionCapType,
                                        }));
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </Col>

                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Pacing
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-pacing"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tooltip-pacing"
                                >
                                  Choose how the budget should be distributed throughout the day or campaign duration.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex flex-wrap align-items-center gap-4 mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="pacing"
                                    value="0"
                                    checked={formData.pacing === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        pacing: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    Off
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="pacing"
                                    value="1"
                                    checked={formData.pacing === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        pacing: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    On
                                  </span>
                                </div>
                              </div>
                            </Col>

                            {formData.pacing === "1" && (
                              <Col md="2" sm="12" className="campaign-field">
                                {/* <Label
                        for="capcount"
                        className="forms-labels text-nowrap"
                        id="pacingdelivery"
                      >
                        Pace delivery based on the campaign's
                      </Label> */}

                                <Label className="forms-labels text-nowrap">
                                  Pace delivery based on the campaign's
                                </Label>
                                <div
                                  className="position-relative dropdown-width pacingmode mt-2 camp-style-20"
                                  id="pacedelivery"

                                >
                                  <div className="campaign-select-wrapper">
                                    <Input
                                      readOnly
                                      value={pacingType}
                                      className="form-control normalized-input campaign-select-input camp-style-10"

                                      onClick={() =>
                                        setOpenPacingStatus(!openPacingStatus)
                                      }
                                      tabIndex={0}
                                    />
                                    <FaCaretDown
                                      className={`custom-select-icon campaign-select-icon ${openPacingStatus ? "open" : ""}`}
                                    />
                                  </div>

                                  {openPacingStatus && (
                                    <div className="custom-dropdown-menu w-100">
                                      {pacingOptions.map((opt, idx) => (
                                        <div
                                          key={idx}
                                          className={`custom-dropdown-option ${pacingType === opt.value ? "selected" : ""}`}
                                          onClick={() => {
                                            setPacingType(opt.value);
                                            if (opt.value === "None") {
                                              setPacingValue("");
                                            }
                                            setOpenPacingStatus(false);
                                          }}
                                        >
                                          <span className="tick-icon">
                                            {pacingType === opt.value && "✓"}
                                          </span>
                                          <span>{opt.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </Col>
                            )}
                          </Row>

                          <Row className="pl-md-1 mb-3 campaign-basics-top-row mt-3">
                            {formData.pacing === "1" && (
                              <Col md="9" sm="12" className="campaign-field">
                                <Label className="forms-labels text-nowrap">
                                  Pacing Mode
                                  <i
                                    className="fa fa-info-circle offcircle ms-2"
                                    id="tooltip-pacing-mode"
                                  />
                                  <UncontrolledTooltip
                                    placement="right"
                                    target="tooltip-pacing-mode"
                                  >
                                    An All Time budget must be set in order to
                                    select Pace Ahead.
                                  </UncontrolledTooltip>
                                </Label>
                                <div className="d-flex flex-wrap align-items-start mt-2 gap-5">
                                  <div
                                    className={`d-flex align-items-start gap-2 ${!isPacingModeEnabled ? "enabled" : ""
                                      }`}
                                  >
                                    <Input
                                      type="radio"
                                      name="even_spend"
                                      value="1"
                                      disabled={!isPacingModeEnabled}
                                      checked={formData.even_spend === "1"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          even_spend: e.target.value,
                                        })
                                      }
                                      className="mt-1"
                                    />
                                    <div>
                                      <span
                                        className="text-gray-700 devices camp-style-21"

                                      >
                                        <span className="fw-semibold">
                                          Even
                                        </span>{" "}
                                        Spend evenly across all days in the
                                        flight.
                                      </span>
                                    </div>
                                  </div>

                                  <div
                                    className={`d-flex align-items-start gap-2 ${!isPacingModeEnabled ? "enabled" : ""
                                      }`}
                                  >
                                    <Input
                                      type="radio"
                                      name="even_spend"
                                      value="2"
                                      checked={formData.even_spend === "2"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          even_spend: e.target.value,
                                        })
                                      }
                                      className="mt-1"
                                    />
                                    <div>
                                      <span
                                        className="text-gray-700 devices camp-style-21"

                                      >
                                        <span className="fw-semibold">
                                          Ahead
                                        </span>{" "}
                                        Spend at a higher rate at the beginning
                                        of the flight.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </Col>
                            )}

                            <Col md="3" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Flight Dates
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-flight-dates"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tooltip-flight-dates"
                                >
                                  Define the start and end dates for your campaign flight.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex flex-column gap-3 mt-2">
                                <div className="d-flex flex-wrap align-items-center gap-4">
                                  <div className="d-flex align-items-center gap-2">
                                    <Input
                                      type="radio"
                                      name="flight_date"
                                      id="flight_date"
                                      value="0"
                                      checked={formData.flight_date == "0"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          flight_date: e.target.value,
                                          make: [],
                                        })
                                      }
                                    />
                                    <span className="text-gray-700 devices">
                                      All Days
                                    </span>
                                  </div>

                                  <div className="d-flex align-items-center gap-2">
                                    <Input
                                      type="radio"
                                      name="flight_date"
                                      id="flightdate"
                                      value="1"
                                      checked={formData.flight_date == "1"}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          flight_date: e.target.value,
                                        })
                                      }
                                    />
                                    <span className="text-gray-700 devices">
                                      Date Range
                                    </span>
                                  </div>
                                </div>

                                {formData.flight_date == "1" && (
                                  <div className="d-flex flex-wrap align-items-center gap-3">
                                    <div
                                      className="date-picker-wrapper camp-style-22"

                                    >
                                      <DatePicker
                                        id="start"
                                        selected={startDate || new Date()}
                                        onChange={(e) => {
                                          setStartDate(e);
                                          setFormData((prev) => ({
                                            ...prev,
                                            Flight_startdate: e,
                                          }));
                                        }}
                                        dateFormat="MM/d/yyyy"
                                        className="form-control normalized-input campaign-btn date-input"
                                        autoComplete="off"
                                        wrapperClassName=""
                                        popperPlacement="bottom-start"
                                        renderCustomHeader={(headerProps) => (
                                          <DatePickerCustomHeader
                                            {...headerProps}
                                          />
                                        )}
                                      />
                                    </div>
                                    <div
                                      className="date-picker-wrapper camp-style-22"

                                    >
                                      <DatePicker
                                        id="end"
                                        selected={endDate}
                                        onChange={(e) => {
                                          setEndDate(e);
                                          setFormData((prev) => ({
                                            ...prev,
                                            Flight_enddate: e,
                                          }));
                                        }}
                                        dateFormat="MM/d/yyyy"
                                        className="form-control normalized-input campaign-btn date-input"
                                        autoComplete="off"
                                        wrapperClassName=""
                                        popperPlacement="bottom-end"
                                        renderCustomHeader={(headerProps) => (
                                          <DatePickerCustomHeader
                                            {...headerProps}
                                          />
                                        )}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Col>
                          </Row>

                          <Row className="pl-md-1 mb-3 campaign-basics-top-row mt-3">
                            <Col md="2" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Daypartying
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-dayparting"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tooltip-dayparting"
                                >
                                  Configure specific hours or days of the week for ad delivery.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex align-items-center gap-4 mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="daypartSwitch"
                                    id="daypart_on"
                                    value="1"
                                    checked={showDaypart === true}
                                    onChange={() => setShowDaypart(true)}
                                  />
                                  <span className="text-gray-700 devices">
                                    On
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="daypartSwitch"
                                    id="daypart_off"
                                    value="0"
                                    checked={showDaypart === false}
                                    onChange={() => setShowDaypart(false)}
                                  />
                                  <span className="text-gray-700 devices">
                                    Off
                                  </span>
                                </div>
                              </div>
                            </Col>

                            <Col md="3" sm="12" className="campaign-field">
                              <Label className="forms-labels">
                                Service Provider Add-Ons
                                <i
                                  className="fa fa-info-circle offcircle ms-2"
                                  id="tooltip-addons"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tooltip-addons"
                                >
                                  Enable or disable third-party service provider tools.
                                </UncontrolledTooltip>
                              </Label>
                              <div className="d-flex align-items-center gap-4 mt-2">
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="service_provider"
                                    value="1"
                                    checked={formData.service_provider === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        service_provider: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    On
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="service_provider"
                                    value="0"
                                    checked={formData.service_provider === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        service_provider: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    Off
                                  </span>
                                </div>
                              </div>
                            </Col>
                          </Row>

                          {showDaypart && (
                            <DayPartEditor
                              key={"day-part-" + count}
                              daypart={daypartSchedule}
                              redraw={redraw}
                              callback={setDaypartSchedule}
                            />
                          )}
                        </div>
                      </div>
                      <div
                        id="campaign-section-optimization"
                        className="campaign-section-target"
                      >
                        <div className="campaign-section-card mt-4">
                          <div
                            className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${activeSubTab === "optimization" ? "active-header" : ""} camp-style-7`}

                          >
                            <div>
                              <div
                                className="fw-bold mb-1 camp-style-8"

                              >
                                Optimization
                              </div>
                              <span
                                className="text-muted camp-style-9"

                              ></span>
                            </div>
                          </div>

                          <Row className="pl-md-1 align-items-center mt-3 mb-3">
                            <Col md="12" sm="12">
                              <div
                                className="d-flex flex-wrap align-items-center camp-style-23"

                              >
                                {/* None */}
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="optimize"
                                    id="optimize_none"
                                    value="0"
                                    checked={formData.optimize === "0"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        optimize: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    None
                                  </span>
                                </div>

                                {/* Simple Bid */}
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="optimize"
                                    id="optimize_simple"
                                    value="1"
                                    checked={formData.optimize === "1"}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        optimize: e.target.value,
                                        make: [],
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    Simple Bid
                                  </span>
                                </div>

                                {/* Smart Bid */}
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="optimize"
                                    id="optimize_smart"
                                    value="2"
                                    checked={formData.optimize === "2"}
                                    onChange={(e) => {
                                      setFormData({
                                        ...formData,
                                        optimize: e.target.value,
                                      });
                                    }}
                                  />
                                  <span className="text-gray-700 devices">
                                    Smart Bid
                                  </span>
                                </div>
                              </div>
                            </Col>
                          </Row>

                          {formData.optimize === "1" && (
                            <>
                              <Col md="12">
                                <Row className="pl-md-1 mb-3 campaign-basics-top-row mt-3">
                                  <Col
                                    md="5"
                                    sm="12"
                                    className="campaign-field"
                                  >
                                    <Label className="forms-labels">Goal</Label>
                                    <div className="d-flex align-items-center gap-3 mt-2">
                                      <div
                                        className="position-relative camp-style-24"
                                        id="optimizestatus"

                                      >
                                        <div className="campaign-select-wrapper">
                                          <Input
                                            readOnly
                                            value={goalType}
                                            className="form-control normalized-input campaign-select-input camp-style-10"

                                            onClick={() => {
                                              setOpenGoalStatus(
                                                !openGoalStatus,
                                              );
                                            }}
                                            tabIndex={0}
                                          />
                                          <FaCaretDown
                                            className={`custom-select-icon campaign-select-icon ${openGoalStatus ? "open" : ""}`}
                                          />
                                        </div>

                                        {openGoalStatus && (
                                          <div
                                            ref={goalStatusMenuRef}
                                            className="custom-dropdown-menu"
                                          >
                                            {goalOptions.map((opt, idx) => (
                                              <div
                                                key={idx}
                                                className={`custom-dropdown-option ${goalType === opt.value ? "selected" : ""}`}
                                                onClick={() => {
                                                  setGoalType(opt.value);
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    dollar_goal:
                                                      opt.defaultValue,
                                                    goal_status: opt.value,
                                                  }));
                                                  setOpenGoalStatus(false);
                                                }}
                                              >
                                                <span className="tick-icon">
                                                  {goalType === opt.value &&
                                                    "✓"}
                                                </span>
                                                <span>{opt.label}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className="campaign-currency position-relative camp-style-25"

                                      >
                                        <Input
                                          placeholder="0"
                                          type="text"
                                          id="dollar_goal"
                                          name="dollar_goal"
                                          onMouseEnter={() =>
                                            formErrors.dollar_goal &&
                                            setTooltipOpen((t) => ({
                                              ...t,
                                              dollar_goal: true,
                                            }))
                                          }
                                          onMouseLeave={() =>
                                            setTooltipOpen((t) => ({
                                              ...t,
                                              dollar_goal: false,
                                            }))
                                          }
                                          value={formData.dollar_goal || ""}
                                          onChange={(e) => {
                                            const input = e.target;
                                            let val = input.value || "";
                                            const start = input.selectionStart;
                                            const isDollar = goalType === "Cost Per Click (eCPC)" || goalType === "Cost Per Acquisition (eCPA)" || goalType === "Viewable CPM (VCPM)";
                                            let newVal = val;
                                            let prepended = false;
                                            let clean = "";
                                            if (isDollar) {
                                              if (!val.startsWith("$")) {
                                                clean = val.replace(/\$/g, "");
                                                newVal = "$" + clean;
                                                prepended = true;
                                              } else {
                                                clean = val.slice(1).replace(/\$/g, "");
                                                newVal = "$" + clean;
                                              }
                                            } else {
                                              if (!val.endsWith("%")) {
                                                clean = val.replace(/%/g, "");
                                                newVal = clean + "%";
                                              } else {
                                                clean = val.slice(0, -1).replace(/%/g, "");
                                                newVal = clean + "%";
                                              }
                                            }
                                            if (!/^\d*\.?\d*$/.test(clean)) {
                                              return;
                                            }
                                            setFormData((prev) => ({
                                              ...prev,
                                              dollar_goal: newVal,
                                            }));
                                            setFormErrors((prev) => ({
                                              ...prev,
                                              dollar_goal: "",
                                            }));
                                            setTimeout(() => {
                                              try {
                                                let newCursor = start;
                                                if (prepended) {
                                                  newCursor = start + 1;
                                                }
                                                input.setSelectionRange(newCursor, newCursor);
                                              } catch (err) { }
                                            }, 0);
                                          }}

                                          onBlur={(e) => {
                                            const val = e.target.value;
                                            const isDollar = goalType === "Cost Per Click (eCPC)" || goalType === "Cost Per Acquisition (eCPA)" || goalType === "Viewable CPM (VCPM)";
                                            if (val) {
                                              let cleanStr = val.replace(/[^\d\.]/g, "");
                                              const n = parseFloat(cleanStr);
                                              if (!isNaN(n)) {
                                                const dotIndex = cleanStr.indexOf(".");
                                                let decimals = 2;
                                                if (dotIndex !== -1) {
                                                  const typedDecimals = cleanStr.length - dotIndex - 1;
                                                  if (typedDecimals > 2) {
                                                    decimals = typedDecimals;
                                                  }
                                                }
                                                const formatted = isDollar ? "$" + n.toFixed(decimals) : n.toFixed(decimals) + "%";
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  dollar_goal: formatted,
                                                }));
                                              }
                                            }
                                          }}
                                          className={`campaign-btn ${formErrors.dollar_goal ? " border-danger" : ""} camp-style-26`}
                                        />
                                        <span className="usd">USD</span>
                                        {formErrors.dollar_goal && (
                                          <>
                                            <Tooltip
                                              placement="bottom"
                                              isOpen={tooltipOpen.dollar_goal}
                                              target="dollar_goal"
                                              autohide={false}
                                              popperClassName="custom-tooltip"
                                            >
                                              <div className="one"></div>
                                              {formErrors.dollar_goal}
                                            </Tooltip>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </Col>

                                  {goalType ===
                                    "Cost Per Acquisition (eCPA)" && (
                                      <Col
                                        md="3"
                                        sm="12"
                                        className="campaign-field"
                                      >
                                        <Label className="forms-labels">
                                          Primary Conversion
                                          <i
                                            className="fa fa-info-circle offcircle ms-2"
                                            id="tooltip-primary-conversion"
                                          />
                                          <UncontrolledTooltip
                                            placement="right"
                                            target="tooltip-primary-conversion"
                                          >
                                            Choose the main conversion goal to optimize campaign performance.
                                          </UncontrolledTooltip>
                                        </Label>
                                        <div
                                          className="d-flex align-items-center gap-2 mt-2 camp-style-27"

                                        >
                                          <Input
                                            type="checkbox"
                                            id="primary_conversion"
                                            checked={
                                              !!formData.primary_conversion
                                            }
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                ...prev,
                                                primary_conversion:
                                                  e.target.checked,
                                              }))
                                            }
                                          />
                                          <Label
                                            for="primary_conversion"
                                            className="ms-2 mb-0 advancedvideo"
                                          >
                                            Optimize for primary conversion
                                          </Label>
                                        </div>
                                      </Col>
                                    )}

                                  <Col
                                    md={
                                      goalType === "Cost Per Acquisition (eCPA)"
                                        ? "2"
                                        : "3"
                                    }
                                    sm="12"
                                    className={`campaign-field ${goalType !== "Cost Per Acquisition (eCPA)" ? "" : ""}`}
                                  >
                                    <Label className="forms-labels">
                                      Optimize
                                      <i
                                        className="fa fa-info-circle offcircle ms-2"
                                        id="tooltip-optimize"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tooltip-optimize"
                                      >
                                        Select whether to optimize targeting at the domain level or placement level.
                                      </UncontrolledTooltip>
                                    </Label>
                                    <div
                                      className="d-flex align-items-center gap-4 mt-2 camp-style-27"

                                    >
                                      <div className="d-flex align-items-center gap-2">
                                        <Input
                                          type="radio"
                                          name="optimize_domain"
                                          value="1"
                                          checked={
                                            formData.optimize_domain === "1"
                                          }
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              optimize_domain: e.target.value,
                                            })
                                          }
                                          className="camp-style-28"
                                        />
                                        <span className="text-gray-700 devices">
                                          Domains
                                        </span>
                                      </div>

                                      <div className="d-flex align-items-center gap-2">
                                        <Input
                                          type="radio"
                                          name="optimize_domain"
                                          value="0"
                                          checked={
                                            formData.optimize_domain === "0"
                                          }
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              optimize_domain: e.target.value,
                                            })
                                          }
                                          className="camp-style-28"
                                        />
                                        <span className="text-gray-700 devices">
                                          Placements
                                        </span>
                                      </div>
                                    </div>
                                  </Col>

                                  <Col
                                    md={
                                      goalType === "Cost Per Acquisition (eCPA)"
                                        ? "3"
                                        : "4"
                                    }
                                    sm="12"
                                    className="campaign-field"
                                  >
                                    <Label className="forms-labels">
                                      Advanced Settings
                                    </Label>
                                    <div
                                      className="d-flex align-items-center mt-2 camp-style-27"

                                    >
                                      <Input
                                        type="checkbox"
                                        id="optimization_settings"
                                        checked={
                                          !!formData.optimization_settings
                                        }
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            optimization_settings:
                                              e.target.checked,
                                          }))
                                        }
                                        className="camp-style-28"
                                      />
                                      <Label
                                        for="optimization_settings"
                                        className="ms-2 mb-0 text-gray-700 devices fw-semibold camp-style-29"

                                      >
                                        Advanced optimization settings
                                      </Label>
                                    </div>
                                  </Col>
                                </Row>
                              </Col>

                              {formData.optimization_settings && (
                                <Col md="12">
                                  <Row className="pl-md-1 mb-3 campaign-basics-top-row mt-3">
                                    {(goalType === "Cost Per Click (eCPC)" ||
                                      goalType ===
                                      "Cost Per Acquisition (eCPA)" ||
                                      goalType ===
                                      "Cost Per Completed Video (eCPCV)") && (
                                        <>
                                          <Col
                                            md="2"
                                            sm="12"
                                            className="campaign-field mb-3"
                                          >
                                            <Label className="forms-labels">
                                              Minimum Bid
                                              <i
                                                className="fa fa-info-circle offcircle ms-2 mt-1"
                                                id="tt-58ea28cb"
                                              />
                                              <UncontrolledTooltip
                                                placement="right"
                                                target="tt-58ea28cb"
                                              >
                                                Set the minimum bid threshold for the campaign.
                                              </UncontrolledTooltip>
                                            </Label>
                                            <div className="d-flex align-items-center mt-2">
                                              <div
                                                className="campaign-currency position-relative camp-style-25"

                                              >
                                                <Input
                                                  type="text"
                                                  id="minimum_bid"
                                                  name="minimum_bid"
                                                  value={formData.minimum_bid}
                                                  onChange={(e) => {
                                                    const val = e.target.value || "";
                                                    const clean = val.replace(/[$\s]/g, "");
                                                    if (!/^\d*(\.\d{0,2})?$/.test(clean)) {
                                                      return;
                                                    }
                                                    setFormErrors((prev) => ({
                                                      ...prev,
                                                      minimum_bid: "",
                                                    }));
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      minimum_bid: val.startsWith("$") ? val : "$" + clean,
                                                    }));
                                                  }}

                                                  onBlur={(e) => {
                                                    const val = e.target.value;
                                                    if (val) {
                                                      let cleanStr = val.replace(/[^\d\.]/g, "");
                                                      const n = parseFloat(cleanStr);
                                                      if (!isNaN(n)) {
                                                        setFormData((prev) => ({
                                                          ...prev,
                                                          minimum_bid: "$" + n.toFixed(2),
                                                        }));
                                                      }
                                                    }
                                                  }}
                                                  className={`campaign-btn ${formErrors.minimum_bid ? " border-danger" : ""} camp-style-26`}
                                                  onMouseEnter={() => {
                                                    setTooltipOpen((t) => ({
                                                      ...t,
                                                      minimum_bid: true,
                                                    }));
                                                  }}
                                                  onMouseLeave={() =>
                                                    setTooltipOpen((t) => ({
                                                      ...t,
                                                      minimum_bid: false,
                                                    }))
                                                  }
                                                />
                                                <span className="usd">USD</span>
                                                {formErrors.minimum_bid && (
                                                  <Tooltip
                                                    placement="bottom"
                                                    isOpen={
                                                      tooltipOpen.minimum_bid
                                                    }
                                                    target="minimum_bid"
                                                    autohide={false}
                                                    popperClassName="custom-tooltip"
                                                  >
                                                    <div className="one"></div>
                                                    {formErrors.minimum_bid}
                                                  </Tooltip>
                                                )}
                                              </div>
                                            </div>
                                          </Col>
                                          <Col
                                            md="5"
                                            sm="12"
                                            className="campaign-field mb-3"
                                          >
                                            <Label
                                              className="forms-labels camp-style-30"

                                            >
                                              Placeholder
                                            </Label>
                                            <div
                                              className="d-flex align-items-center mt-2 camp-style-27"

                                            >
                                              <Input
                                                type="checkbox"
                                                id="optimization_settings_min_bid"
                                                checked={
                                                  !!formData.optimization_settings
                                                }
                                                onChange={(e) =>
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    optimization_settings:
                                                      e.target.checked,
                                                  }))
                                                }
                                                className="camp-style-28"
                                              />
                                              <Label
                                                for="optimization_settings_min_bid"
                                                className="ms-2 mb-0 text-gray-700 devices fw-semibold text-nowrap camp-style-29"

                                              >
                                                Turn off domains or placements at
                                                minimum bid
                                              </Label>
                                            </div>
                                          </Col>
                                        </>
                                      )}

                                    <Col
                                      md={
                                        goalType === "Cost Per Click (eCPC)" ||
                                          goalType ===
                                          "Cost Per Acquisition (eCPA)" ||
                                          goalType ===
                                          "Cost Per Completed Video (eCPCV)"
                                          ? "2"
                                          : "4"
                                      }
                                      sm="12"
                                      className="campaign-field mb-3"
                                    >
                                      <Label className="forms-labels">
                                        Bid Step
                                        <i
                                          className="fa fa-info-circle offcircle ms-2 mt-1"
                                          id="tt-bf7808a2"
                                        />
                                        <UncontrolledTooltip
                                          placement="right"
                                          target="tt-bf7808a2"
                                        >
                                          Set the incremental value by which bid amounts will be adjusted.
                                        </UncontrolledTooltip>
                                      </Label>
                                      <div className="d-flex align-items-center mt-2">
                                        <div
                                          className="campaign-currency position-relative camp-style-25"

                                        >
                                          <Input
                                            type="text"
                                            id="bid_step"
                                            name="bid_step"
                                            value={formData.bid_step}
                                            onChange={(e) => {
                                              const val = e.target.value || "";
                                              const clean = val.replace(/[$\s]/g, "");
                                              if (!/^\d*(\.\d{0,2})?$/.test(clean)) {
                                                return;
                                              }
                                              setFormErrors((p) => ({
                                                ...p,
                                                bid_step: "",
                                              }));
                                              setFormData((prev) => ({
                                                ...prev,
                                                bid_step: val.startsWith("$") ? val : "$" + clean,
                                              }));
                                            }}

                                            onBlur={(e) => {
                                              const val = e.target.value;
                                              if (val) {
                                                let cleanStr = val.replace(/[^\d\.]/g, "");
                                                const n = parseFloat(cleanStr);
                                                if (!isNaN(n)) {
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    bid_step: "$" + n.toFixed(2),
                                                  }));
                                                }
                                              }
                                            }}
                                            className={`campaign-btn ${formErrors.bid_step ? " border-danger" : ""} camp-style-26`}
                                            onMouseEnter={() => {
                                              setTooltipOpen((t) => ({
                                                ...t,
                                                bid_step: true,
                                              }));
                                            }}
                                            onMouseLeave={() =>
                                              setTooltipOpen((t) => ({
                                                ...t,
                                                bid_step: false,
                                              }))
                                            }
                                          />
                                          <span className="usd">USD</span>
                                          {formErrors.bid_step && (
                                            <>
                                              <Tooltip
                                                placement="bottom"
                                                isOpen={tooltipOpen.bid_step}
                                                target="bid_step"
                                                autohide={false}
                                                popperClassName="custom-tooltip"
                                              >
                                                <div className="one"></div>
                                                {formErrors.bid_step}
                                              </Tooltip>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </Col>

                                    {(goalType === "Viewable Rate (VR)" ||
                                      goalType === "Click-Thru Rate (CTR)" ||
                                      goalType ===
                                      "Video Completion Rate (VCR)") && (
                                        <>
                                          <Col
                                            md="4"
                                            sm="12"
                                            className="campaign-field mb-3"
                                          >
                                            <Label className="forms-labels">
                                              Impression Threshold
                                              <i
                                                className="fa fa-info-circle offcircle ms-2 mt-1"
                                                id="tt-54463399"
                                              />
                                              <UncontrolledTooltip
                                                placement="right"
                                                target="tt-54463399"
                                              >
                                                Define the minimum number of impressions required before optimization metrics are calculated.
                                              </UncontrolledTooltip>
                                            </Label>
                                            <div className="d-flex align-items-center mt-2">
                                              <div
                                                className="campaign-currency position-relative camp-style-25"

                                              >
                                                <Input
                                                  type="text"
                                                  id="impression_threshold"
                                                  name="impression_threshold"
                                                  value={
                                                    formData.impression_threshold
                                                  }
                                                  onChange={(e) => {
                                                    const val = e.target.value || "";
                                                    const clean = val.replace(/[$\s]/g, "");
                                                    if (!/^\d*$/.test(clean)) {
                                                      return;
                                                    }
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      impression_threshold: clean,
                                                    }));
                                                  }}

                                                  className="campaign-btn camp-style-26"
                                                />
                                                <span className="usd">USD</span>
                                              </div>
                                            </div>
                                          </Col>
                                          <Col
                                            md="4"
                                            sm="12"
                                            className="campaign-field mb-3"
                                          >
                                            <Label className="forms-labels">
                                              Smart Disable
                                              <i
                                                className="fa fa-info-circle offcircle ms-2 mt-1"
                                                id="tt-7372233a"
                                              />
                                              <UncontrolledTooltip
                                                placement="right"
                                                target="tt-7372233a"
                                              >
                                                Enable or disable automated filtering of low-performing placements.
                                              </UncontrolledTooltip>
                                            </Label>
                                            <div
                                              className="d-flex align-items-center gap-4 mt-2 camp-style-27"

                                            >
                                              <div className="d-flex align-items-center gap-2">
                                                <Input
                                                  type="radio"
                                                  name="smart_disable"
                                                  value="1"
                                                  checked={
                                                    formData.smart_disable === "1"
                                                  }
                                                  onChange={(e) =>
                                                    setFormData({
                                                      ...formData,
                                                      smart_disable:
                                                        e.target.value,
                                                      make: [],
                                                    })
                                                  }
                                                  className="camp-style-28"
                                                />
                                                <span className="text-gray-700 devices">
                                                  On
                                                </span>
                                              </div>

                                              <div className="d-flex align-items-center gap-2">
                                                <Input
                                                  type="radio"
                                                  name="smart_disable"
                                                  value="0"
                                                  checked={
                                                    formData.smart_disable === "0"
                                                  }
                                                  onChange={(e) =>
                                                    setFormData({
                                                      ...formData,
                                                      smart_disable:
                                                        e.target.value,
                                                    })
                                                  }
                                                  className="camp-style-28"
                                                />
                                                <span className="text-gray-700 devices">
                                                  Off
                                                </span>
                                              </div>
                                            </div>
                                          </Col>
                                        </>
                                      )}
                                    {(goalType === "Cost Per Click (eCPC)" ||
                                      goalType ===
                                      "Cost Per Acquisition (eCPA)" ||
                                      goalType ===
                                      "Cost Per Completed Video (eCPCV)") && (
                                        <Col
                                          md="3"
                                          sm="12"
                                          className="campaign-field mb-3"
                                        >
                                          <Label className="forms-labels">
                                            Learn Budget
                                            <i
                                              className="fa fa-info-circle offcircle ms-2 mt-1"
                                              id="tt-4a43aaa8"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-4a43aaa8"
                                            >
                                              Allocate a specific budget portion to gather data during the learning phase.
                                            </UncontrolledTooltip>
                                          </Label>
                                          <div className="d-flex align-items-center mt-2">
                                            <div
                                              className="campaign-currency position-relative camp-style-25"

                                            >
                                              <Input
                                                type="text"
                                                id="learn_budget"
                                                name="learn_budget"
                                                value={formData.learn_budget}
                                                onChange={(e) => {
                                                  const val = e.target.value || "";
                                                  const clean = val.replace(/[$\s]/g, "");
                                                  if (!/^\d*(\.\d{0,2})?$/.test(clean)) {
                                                    return;
                                                  }
                                                  setFormErrors((p) => ({
                                                    ...p,
                                                    learn_budget: "",
                                                  }));
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    learn_budget: val.startsWith("$") ? val : "$" + clean,
                                                  }));
                                                }}

                                                onBlur={(e) => {
                                                  const val = e.target.value;
                                                  if (val) {
                                                    let cleanStr = val.replace(/[^\d\.]/g, "");
                                                    const n = parseFloat(cleanStr);
                                                    if (!isNaN(n)) {
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        learn_budget: "$" + n.toFixed(2),
                                                      }));
                                                    }
                                                  }
                                                }}
                                                className={`campaign-btn ${formErrors.learn_budget ? " border-danger" : ""} camp-style-26`}
                                                onMouseEnter={() => {
                                                  setTooltipOpen((t) => ({
                                                    ...t,
                                                    learn_budget: true,
                                                  }));
                                                }}
                                                onMouseLeave={() =>
                                                  setTooltipOpen((t) => ({
                                                    ...t,
                                                    bid_step: false,
                                                  }))
                                                }
                                              />
                                              <span className="usd">USD</span>
                                              {formErrors.learn_budget && (
                                                <>
                                                  <Tooltip
                                                    placement="bottom"
                                                    isOpen={
                                                      tooltipOpen.learn_budget
                                                    }
                                                    target="learn_budget"
                                                    autohide={false}
                                                    popperClassName="custom-tooltip"
                                                  >
                                                    <div className="one"></div>
                                                    {formErrors.learn_budget}
                                                  </Tooltip>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </Col>
                                      )}
                                  </Row>
                                </Col>
                              )}
                            </>
                          )}

                          {formData.optimize === "2" && (
                            <>
                              <Col md="12">
                                <Row className="pl-md-1 mb-3 campaign-basics-top-row mt-3">
                                  <Col
                                    md={
                                      smartgoalType ===
                                        "Cost Per Acquisition (eCPA)"
                                        ? "4"
                                        : "12"
                                    }
                                    sm="12"
                                    className="campaign-field"
                                  >
                                    <Label className="forms-labels">Goal</Label>
                                    <div className="d-flex align-items-center gap-2 mt-2">
                                      <div
                                        className="position-relative camp-style-24"
                                        id="optimizestatussmartbid"

                                      >
                                        <div className="campaign-select-wrapper">
                                          <Input
                                            readOnly
                                            value={smartgoalType}
                                            className="form-control normalized-input campaign-select-input camp-style-10"

                                            onClick={() =>
                                              smartsetOpenGoalStatus(
                                                !smartopenGoalStatus,
                                              )
                                            }
                                            tabIndex={0}
                                          />
                                          <FaCaretDown
                                            className={`custom-select-icon campaign-select-icon ${smartopenGoalStatus ? "open" : ""}`}
                                          />
                                        </div>
                                        {smartopenGoalStatus && (
                                          <div
                                            ref={smartGoalStatusMenuRef}
                                            className="custom-dropdown-menu"
                                          >
                                            {smartgoalOptions.map(
                                              (opt, idx) => (
                                                <div
                                                  key={idx}
                                                  className={`custom-dropdown-option ${smartgoalType === opt.value ? "selected" : ""}`}
                                                  onClick={() => {
                                                    smartsetGoalType(opt.value);
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      dollar_goal1:
                                                        opt.defaultValue,
                                                      goal_status: opt.value,
                                                    }));
                                                    smartsetOpenGoalStatus(
                                                      false,
                                                    );
                                                  }}
                                                >
                                                  <span className="tick-icon">
                                                    {smartgoalType ===
                                                      opt.value && "✓"}
                                                  </span>
                                                  <span>{opt.label}</span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className="campaign-currency position-relative camp-style-25"

                                      >
                                        <Input
                                          placeholder="0"
                                          type="text"
                                          id="dollar_goal_smart"
                                          name="dollar_goal_smart"
                                          onMouseEnter={() =>
                                            formErrors.dollar_goal1 &&
                                            setTooltipOpen((t) => ({
                                              ...t,
                                              dollar_goal1: true,
                                            }))
                                          }
                                          onMouseLeave={() =>
                                            setTooltipOpen((t) => ({
                                              ...t,
                                              dollar_goal1: false,
                                            }))
                                          }
                                          value={formData.dollar_goal1 || ""}
                                          onChange={(e) => {
                                            const input = e.target;
                                            let val = input.value || "";
                                            const start = input.selectionStart;
                                            const isDollar = smartgoalType === "Cost Per Click (eCPC)" || smartgoalType === "Cost Per Acquisition (eCPA)" || smartgoalType === "Viewable CPM (VCPM)";
                                            let newVal = val;
                                            let prepended = false;
                                            let clean = "";
                                            if (isDollar) {
                                              if (!val.startsWith("$")) {
                                                clean = val.replace(/\$/g, "");
                                                newVal = "$" + clean;
                                                prepended = true;
                                              } else {
                                                clean = val.slice(1).replace(/\$/g, "");
                                                newVal = "$" + clean;
                                              }
                                            } else {
                                              if (!val.endsWith("%")) {
                                                clean = val.replace(/%/g, "");
                                                newVal = clean + "%";
                                              } else {
                                                clean = val.slice(0, -1).replace(/%/g, "");
                                                newVal = clean + "%";
                                              }
                                            }
                                            if (!/^\d*\.?\d*$/.test(clean)) {
                                              return;
                                            }
                                            setFormData((prev) => ({
                                              ...prev,
                                              dollar_goal1: newVal,
                                            }));
                                            setFormErrors((prev) => ({
                                              ...prev,
                                              dollar_goal1: "",
                                            }));
                                            setTimeout(() => {
                                              try {
                                                let newCursor = start;
                                                if (prepended) {
                                                  newCursor = start + 1;
                                                }
                                                input.setSelectionRange(newCursor, newCursor);
                                              } catch (err) { }
                                            }, 0);
                                          }}

                                          onBlur={(e) => {
                                            const val = e.target.value;
                                            const isDollar = smartgoalType === "Cost Per Click (eCPC)" || smartgoalType === "Cost Per Acquisition (eCPA)" || smartgoalType === "Viewable CPM (VCPM)";
                                            if (val) {
                                              let cleanStr = val.replace(/[^\d\.]/g, "");
                                              const n = parseFloat(cleanStr);
                                              if (!isNaN(n)) {
                                                const dotIndex = cleanStr.indexOf(".");
                                                let decimals = 2;
                                                if (dotIndex !== -1) {
                                                  const typedDecimals = cleanStr.length - dotIndex - 1;
                                                  if (typedDecimals > 2) {
                                                    decimals = typedDecimals;
                                                  }
                                                }
                                                const formatted = isDollar ? "$" + n.toFixed(decimals) : n.toFixed(decimals) + "%";
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  dollar_goal1: formatted,
                                                }));
                                              }
                                            }
                                          }}
                                          className={`campaign-btn ${formErrors.dollar_goal1 ? " border-danger" : ""} camp-style-26`}
                                        />
                                        <span className="usd">USD</span>
                                        {formErrors.dollar_goal1 && (
                                          <>
                                            <Tooltip
                                              placement="bottom"
                                              isOpen={tooltipOpen.dollar_goal1}
                                              target="dollar_goal_smart"
                                              autohide={false}
                                              popperClassName="custom-tooltip"
                                            >
                                              <div className="one"></div>
                                              {formErrors.dollar_goal1}
                                            </Tooltip>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </Col>

                                  {smartgoalType ===
                                    "Cost Per Acquisition (eCPA)" && (
                                      <>
                                        <Col
                                          md="4"
                                          sm="12"
                                          className="campaign-field"
                                        >
                                          <Label className="forms-labels">
                                            Primary Conversion
                                            <i
                                              className="fa fa-info-circle offcircle ms-2"
                                              id="tt-ce91f00e"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-ce91f00e"
                                            >
                                              Specify the primary conversion event to optimize the Smart Bid algorithm.
                                            </UncontrolledTooltip>
                                          </Label>
                                          <div
                                            className="d-flex align-items-center gap-2 mt-2 camp-style-27"

                                          >
                                            <Input
                                              type="checkbox"
                                              id="primary_conversion"
                                              checked={
                                                !!formData.primary_conversion
                                              }
                                              onChange={(e) =>
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  primary_conversion:
                                                    e.target.checked,
                                                }))
                                              }
                                            />
                                            <Label
                                              for="primary_conversion"
                                              className="ms-2 mb-0 advancedvideo"
                                            >
                                              Optimize for primary conversion
                                            </Label>
                                          </div>
                                        </Col>

                                        <Col
                                          md="4"
                                          sm="12"
                                          className="campaign-field"
                                        >
                                          <Label className="forms-labels">
                                            Learning Scope
                                            <i
                                              className="fa fa-info-circle offcircle ms-2"
                                              id="tt-15115162"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-15115162"
                                            >
                                              Select whether the model learns from the campaign or the entire pixel.
                                            </UncontrolledTooltip>
                                          </Label>
                                          <div
                                            className="d-flex align-items-center gap-4 mt-2 camp-style-27"

                                          >
                                            <div className="d-flex align-items-center gap-2">
                                              <Input
                                                type="radio"
                                                name="learning_scope"
                                                value="1"
                                                checked={
                                                  formData.learning_scope === "1"
                                                }
                                                onChange={(e) =>
                                                  setFormData({
                                                    ...formData,
                                                    learning_scope:
                                                      e.target.value,
                                                    make: [],
                                                  })
                                                }
                                                className="camp-style-28"
                                              />
                                              <span className="text-gray-700 devices">
                                                Pixel{" "}
                                              </span>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                              <Input
                                                type="radio"
                                                name="learning_scope"
                                                value="0"
                                                checked={
                                                  formData.learning_scope === "0"
                                                }
                                                onChange={(e) =>
                                                  setFormData({
                                                    ...formData,
                                                    learning_scope:
                                                      e.target.value,
                                                  })
                                                }
                                                className="camp-style-28"
                                              />
                                              <span className="text-gray-700 devices">
                                                Campaign
                                              </span>
                                            </div>
                                          </div>
                                        </Col>
                                      </>
                                    )}
                                </Row>
                              </Col>
                            </>
                          )}
                        </div>
                      </div>
                      <div
                        id="campaign-section-conversions"
                        className="campaign-section-target"
                      >
                        <div className="campaign-section-card mt-4">
                          <div
                            className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${activeSubTab === "conversions" ? "active-header" : ""} camp-style-7`}

                          >
                            <div>
                              <div
                                className="fw-bold mb-1 camp-style-8"

                              >
                                Conversions
                              </div>
                              <span
                                className="text-muted camp-style-9"

                              ></span>
                            </div>
                          </div>

                          {formData.track_conversions !== "1" && (
                            <Row className="pl-md-1 align-items-center mb-3 mt-3">
                              <Col
                                md="4"
                                sm="12"
                                className="campaign-field mb-3"
                              >
                                <Label className="forms-labels">
                                  Track Conversions
                                  <i
                                    className="fa fa-info-circle offcircle ms-2 mt-1"
                                    id="tt-9e3986a7"
                                  />
                                  <UncontrolledTooltip
                                    placement="right"
                                    target="tt-9e3986a7"
                                  >
                                    Enable conversion tracking to measure the actions users take after viewing or clicking your ad.
                                  </UncontrolledTooltip>
                                </Label>
                                <div
                                  className="d-flex align-items-center gap-4 mt-2 camp-style-27"

                                >
                                  <div className="d-flex align-items-center gap-2">
                                    <Input
                                      type="radio"
                                      name="track_conversions"
                                      value="1"
                                      checked={
                                        formData.track_conversions === "1"
                                      }
                                      className="camp-style-28"
                                      onChange={(e) => {
                                        setFormData({
                                          ...formData,
                                          track_conversions: e.target.value,
                                        });
                                      }}
                                    />
                                    <span className="text-gray-700 devices">
                                      On
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    <Input
                                      type="radio"
                                      name="track_conversions"
                                      value="0"
                                      checked={
                                        formData.track_conversions === "0"
                                      }
                                      className="camp-style-28"
                                      onChange={(e) => {
                                        settrackedconversion([]);
                                        setconversiondata([]);
                                        setFormData((prev) => ({
                                          ...prev,
                                          track_conversions: e.target.value,
                                          consversion: [],
                                          conversion: [],
                                          primary_conversion: "",
                                        }));
                                      }}
                                    />
                                    <span className="text-gray-700 devices">
                                      Off
                                    </span>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          )}
                          {formData.track_conversions === "1" && (
                            <>
                              <Row className="">
                                <Col sm="12">
                                  <ConversionEditor
                                    renderTrackConversions={() => (
                                      <Col
                                        md="4"
                                        sm="12"
                                        className="campaign-field mb-3"
                                      >
                                        <Label className="forms-labels">
                                          Track Conversions
                                          <i
                                            className="fa fa-info-circle offcircle ms-2 mt-1"
                                            id="tt-9e3986a7"
                                          />
                                          <UncontrolledTooltip
                                            placement="right"
                                            target="tt-9e3986a7"
                                          >
                                            Enable conversion tracking to measure the actions users take after viewing or clicking your ad.
                                          </UncontrolledTooltip>
                                        </Label>
                                        <div
                                          className="d-flex align-items-center gap-4 mt-2 camp-style-27"

                                        >
                                          <Label
                                            className="d-flex align-items-center gap-2 mb-0 cursor-pointer camp-style-13"

                                          >
                                            <Input
                                              type="radio"
                                              name="track_conversions"
                                              value="1"
                                              checked={
                                                formData.track_conversions ===
                                                "1"
                                              }
                                              className="camp-style-28"
                                              onChange={(e) => {
                                                setFormData({
                                                  ...formData,
                                                  track_conversions:
                                                    e.target.value,
                                                });
                                              }}
                                            />
                                            <span className="text-gray-700 devices">
                                              On
                                            </span>
                                          </Label>
                                          <Label
                                            className="d-flex align-items-center gap-2 mb-0 cursor-pointer camp-style-13"

                                          >
                                            <Input
                                              type="radio"
                                              name="track_conversions"
                                              value="0"
                                              checked={
                                                formData.track_conversions ===
                                                "0"
                                              }
                                              className="camp-style-28"
                                              onChange={(e) => {
                                                settrackedconversion([]);
                                                setconversiondata([]);
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  track_conversions:
                                                    e.target.value,
                                                  consversion: [],
                                                  conversion: [],
                                                  primary_conversion: "",
                                                }));
                                              }}
                                            />
                                            <span className="text-gray-700 devices">
                                              Off
                                            </span>
                                          </Label>
                                        </div>
                                      </Col>
                                    )}
                                    mmpId={formData.mmpId}
                                    conversionlist={conversionlist}
                                    handletraceddata={handleconversion}
                                    h_trackedconversion={
                                      handletrackedconversion
                                    }
                                    trackeddata={trackedconversion}
                                    brandId={
                                      normalizeBrandId(formData.brand_id) ||
                                      normalizeBrandId(brandId) ||
                                      normalizeBrandId(DEFAULT_BRAND_ID)
                                    }
                                    onUpdate={fetchapi}
                                    onMmpSelectionChange={(selection) => {
                                      const selectedMmpId = String(
                                        selection?.mmpId || "",
                                      ).trim();
                                      if (!selectedMmpId) {
                                        setFormData((prev) => ({
                                          ...prev,
                                          mmpId: "",
                                          mmpType: "",
                                          conversionUrl: "",
                                          viewthroughConversionUrl: "",
                                        }));
                                        return;
                                      }

                                      setFormData((prev) => {
                                        const isEditMode = Boolean(campaign_id);
                                        if (
                                          isEditMode &&
                                          (String(selectedMmpId).trim() ===
                                            String(prev.mmpId || "").trim() ||
                                            (campaign &&
                                              String(selectedMmpId).trim() ===
                                              String(
                                                campaign.mmpId || "",
                                              ).trim()))
                                        ) {
                                          return {
                                            ...prev,
                                            mmpId: selectedMmpId,
                                            mmpType: selection?.mmType || "",
                                          };
                                        }

                                        const resolvedPid =
                                          selection?.pid || "maibiztecnx_int";
                                        const conversionUrl =
                                          buildConversionTrackingUrl({
                                            baseUrl: selection?.baseUrl,
                                            pid: resolvedPid,
                                            campaignName: prev.name,
                                            campaignExternalName:
                                              prev.externalname,
                                            appWebName: prev.app_web_name,
                                            clickLookback:
                                              prev.look_back_window,
                                            viewLookback:
                                              prev.look_back_window1,
                                          });
                                        const viewthroughConversionUrl =
                                          buildConversionTrackingUrl({
                                            baseUrl:
                                              selection?.impressionUrl ||
                                              selection?.baseUrl,
                                            pid: resolvedPid,
                                            campaignName: prev.name,
                                            campaignExternalName:
                                              prev.externalname,
                                            appWebName: prev.app_web_name,
                                            clickLookback:
                                              prev.look_back_window,
                                            viewLookback:
                                              prev.look_back_window1,
                                          });

                                        return {
                                          ...prev,
                                          mmpId: selectedMmpId,
                                          mmpType: selection?.mmType || "",
                                          conversionUrl,
                                          viewthroughConversionUrl,
                                        };
                                      });
                                    }}
                                    onMmpIdChange={(mmpId) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        mmpId: String(mmpId || ""),
                                      }));
                                    }}
                                  />
                                </Col>
                              </Row>

                              <Row className="pl-md-1 mb-3 mt-3 campaign-basics-top-row">
                                {/* Clickthrough Type */}
                                <Col
                                  md="3"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <Label className="forms-labels">Type</Label>
                                  <div
                                    className="d-flex align-items-center mt-2 camp-style-27"

                                  >
                                    <Input
                                      type="checkbox"
                                      id="clickthrough"
                                      checked={
                                        formData.click_through_conversion
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          click_through_conversion:
                                            e.target.checked,
                                        }))
                                      }
                                    />
                                    <Label
                                      for="clickthrough"
                                      className="ms-2 mb-0 text-nowrap"
                                    >
                                      <span className="forms-labels">
                                        Clickthrough Conversions
                                      </span>
                                    </Label>
                                  </div>
                                </Col>

                                {/* Clickthrough Lookback */}
                                <Col
                                  md="3"
                                  sm="12"
                                  className={`campaign-field mb-3 ${!formData.click_through_conversion ? "disabled-section" : ""}`}
                                >
                                  <Label className="forms-labels">
                                    Lookback Window:
                                  </Label>
                                  <div className="campaign-currency position-relative mt-2">
                                    <Input
                                      type="text"
                                      id="look_back_window"
                                      value={formData.look_back_window || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => {
                                          const nextConversionUrl =
                                            updateUrlQueryParameter(
                                              prev.conversionUrl,
                                              "click_lookback",
                                              value,
                                              "{click_lookback}",
                                            );
                                          const nextViewthroughConversionUrl =
                                            updateUrlQueryParameter(
                                              prev.viewthroughConversionUrl,
                                              "click_lookback",
                                              value,
                                              "{click_lookback}",
                                            );
                                          return {
                                            ...prev,
                                            look_back_window: value,
                                            conversionUrl: nextConversionUrl,
                                            viewthroughConversionUrl:
                                              nextViewthroughConversionUrl,
                                          };
                                        });
                                      }}
                                      className="form-control campaign-btn w-100"
                                    />
                                    <span className="usd">Days</span>
                                  </div>
                                </Col>

                                {/* Viewthrough Type */}
                                <Col
                                  md="3"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <Label className="forms-labels">Type</Label>
                                  <div
                                    className="d-flex align-items-center mt-2 camp-style-27"

                                  >
                                    <Input
                                      type="checkbox"
                                      id="viewthrough"
                                      checked={formData.view_through_conversion}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          view_through_conversion:
                                            e.target.checked,
                                        }))
                                      }
                                    />
                                    <Label
                                      for="viewthrough"
                                      className="ms-2 mb-0 text-nowrap"
                                    >
                                      <span className="forms-labels">
                                        Viewthrough Conversions
                                      </span>
                                    </Label>
                                  </div>
                                </Col>

                                {/* Viewthrough Lookback */}
                                <Col
                                  md="3"
                                  sm="12"
                                  className={`campaign-field mb-3 ${!formData.view_through_conversion ? "disabled-section" : ""}`}
                                >
                                  <Label className="forms-labels">
                                    Lookback Window:
                                  </Label>
                                  <div className="campaign-currency position-relative mt-2">
                                    <Input
                                      type="text"
                                      id="look_back_window1"
                                      value={formData.look_back_window1 || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setFormData((prev) => {
                                          const nextConversionUrl =
                                            updateUrlQueryParameter(
                                              prev.conversionUrl,
                                              "view_lookback",
                                              value,
                                              "{view_lookback}",
                                            );
                                          const nextViewthroughConversionUrl =
                                            updateUrlQueryParameter(
                                              prev.viewthroughConversionUrl,
                                              "view_lookback",
                                              value,
                                              "{view_lookback}",
                                            );
                                          return {
                                            ...prev,
                                            look_back_window1: value,
                                            conversionUrl: nextConversionUrl,
                                            viewthroughConversionUrl:
                                              nextViewthroughConversionUrl,
                                          };
                                        });

                                        if (value && Number(value) > 24) {
                                          setFormErrors((prev) => ({
                                            ...prev,
                                            look_back_window1:
                                              "Maximum value is 24 hours (1 day)",
                                          }));
                                        } else {
                                          setFormErrors((prev) => ({
                                            ...prev,
                                            look_back_window1: "",
                                          }));
                                        }
                                      }}
                                      className={`form-control campaign-btn w-100 ${formErrors.look_back_window1 ? "custom-error border-danger" : ""}`}
                                    />
                                    <span className="usd">Hours</span>
                                  </div>
                                  {formErrors.look_back_window1 && (
                                    <div
                                      className="camp-style-31"
                                    >
                                      {formErrors.look_back_window1}
                                    </div>
                                  )}
                                </Col>
                              </Row>

                              <Row>
                                <Col md="12" sm="12" className="campaign-field">
                                  <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                    <Label className="mb-0 forms-labels">
                                      Clickthrough Conversion Url
                                      <i
                                        className="fa fa-info-circle ms-2 offcircle"
                                        id="tooltip-clickthrough-url"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tooltip-clickthrough-url"
                                      >
                                        Enter the tracking URL to count conversions when a user clicks your ad.
                                      </UncontrolledTooltip>
                                    </Label>
                                    {formData.mmpId && (
                                      <Button
                                        type="button"
                                        color="link"
                                        className="campaign-conversion-parameters-btn"
                                        onClick={() =>
                                          openConversionParametersModal(
                                            "conversionUrl",
                                            "Edit Parameters",
                                          )
                                        }
                                        aria-label="Parameters"
                                        title="Parameters"
                                      >
                                        <FaSlidersH className="campaign-conversion-parameters-icon" />
                                        Parameters
                                      </Button>
                                    )}
                                  </div>
                                  <div className="position-relative campaign-url-field-wrap">
                                    <Input
                                      id="conversionUrl"
                                      onMouseEnter={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          conversionUrl: true,
                                        }));
                                      }}
                                      onMouseLeave={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          conversionUrl: false,
                                        }));
                                      }}
                                      value={getConversionUrlValue(
                                        "conversionUrl",
                                      )}
                                      onChange={(e) => {
                                        const { value } = e.target;
                                        markConversionUrlTouched(
                                          "conversionUrl",
                                        );
                                        setFormErrors({
                                          ...formErrors,
                                          conversionUrl: "",
                                        });
                                        setFormData((prev) => ({
                                          ...prev,
                                          conversionUrl: value,
                                        }));
                                      }}
                                      className={`form-control normalized-input campaign-btn pe-5 ${formErrors.conversionUrl
                                        ? "custom-error  border-danger"
                                        : ""
                                        } camp-style-32`}
                                      placeholder=""
                                      type="text"
                                      autoComplete="off"

                                    />
                                    {urlEditor.isOpen &&
                                      urlEditor.field === "conversionUrl" && (
                                        <div className="campaign-url-editor-card">
                                          <div className="campaign-url-editor-header">
                                            <div className="campaign-url-editor-title">
                                              {urlEditor.label || "Edit URL"}
                                            </div>
                                            <Button
                                              type="button"
                                              color="link"
                                              className="p-0 border-0 shadow-none campaign-url-editor-close"
                                              onClick={closeUrlEditor}
                                              aria-label="Close editor"
                                            >
                                              <FaTimes size={14} />
                                            </Button>
                                          </div>
                                          <Input
                                            type="textarea"
                                            rows="6"
                                            value={urlEditor.value}
                                            onChange={(e) =>
                                              setUrlEditor((prev) => ({
                                                ...prev,
                                                value: e.target.value,
                                              }))
                                            }
                                            placeholder="Paste or edit the full URL"
                                            className="campaign-btn campaign-url-editor-textarea campaign-url-editor-textarea-lg"
                                          />
                                          <div className="campaign-url-editor-footer">
                                            <Button
                                              color="secondary"
                                              size="sm"
                                              onClick={closeUrlEditor}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              color="primary"
                                              size="sm"
                                              onClick={saveUrlEditor}
                                            >
                                              Save
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                  {formErrors.conversionUrl && (
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={tooltipOpen.conversionUrl}
                                      target="conversionUrl"
                                      autohide={false}
                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.conversionUrl}
                                    </Tooltip>
                                  )}
                                </Col>
                              </Row>

                              <Row>
                                <Col md="12" sm="12" className="campaign-field">
                                  <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                    <Label className="mb-0 forms-labels">
                                      Viewthrough Conversion Url
                                      <i
                                        className="fa fa-info-circle ms-2 offcircle"
                                        id="tooltip-viewthrough-url"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tooltip-viewthrough-url"
                                      >
                                        Enter the tracking URL to count conversions when a user views your ad.
                                      </UncontrolledTooltip>
                                    </Label>
                                    {formData.mmpId && (
                                      <Button
                                        type="button"
                                        color="link"
                                        className="campaign-conversion-parameters-btn"
                                        onClick={() =>
                                          openConversionParametersModal(
                                            "viewthroughConversionUrl",
                                            "Edit Parameters",
                                          )
                                        }
                                        aria-label="Parameters"
                                        title="Parameters"
                                      >
                                        <FaSlidersH className="campaign-conversion-parameters-icon" />
                                        Parameters
                                      </Button>
                                    )}
                                  </div>
                                  <div className="position-relative campaign-url-field-wrap">
                                    <Input
                                      id="viewthroughConversionUrl"
                                      onMouseEnter={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          viewthroughConversionUrl: true,
                                        }));
                                      }}
                                      onMouseLeave={() => {
                                        setTooltipOpen((t) => ({
                                          ...t,
                                          viewthroughConversionUrl: false,
                                        }));
                                      }}
                                      value={getConversionUrlValue(
                                        "viewthroughConversionUrl",
                                      )}
                                      onChange={(e) => {
                                        const { value } = e.target;
                                        markConversionUrlTouched(
                                          "viewthroughConversionUrl",
                                        );
                                        setFormErrors({
                                          ...formErrors,
                                          viewthroughConversionUrl: "",
                                        });
                                        setFormData((prev) => ({
                                          ...prev,
                                          viewthroughConversionUrl: value,
                                        }));
                                      }}
                                      className={`form-control normalized-input campaign-btn pe-5 ${formErrors.viewthroughConversionUrl
                                        ? "custom-error  border-danger"
                                        : ""
                                        } camp-style-32`}
                                      placeholder=""
                                      type="text"
                                      autoComplete="off"

                                    />
                                    {urlEditor.isOpen &&
                                      urlEditor.field ===
                                      "viewthroughConversionUrl" && (
                                        <div className="campaign-url-editor-card">
                                          <div className="campaign-url-editor-header">
                                            <div className="campaign-url-editor-title">
                                              {urlEditor.label || "Edit URL"}
                                            </div>
                                            <Button
                                              type="button"
                                              color="link"
                                              className="p-0 border-0 shadow-none campaign-url-editor-close"
                                              onClick={closeUrlEditor}
                                              aria-label="Close editor"
                                            >
                                              <FaTimes size={14} />
                                            </Button>
                                          </div>
                                          <Input
                                            type="textarea"
                                            rows="6"
                                            value={urlEditor.value}
                                            onChange={(e) =>
                                              setUrlEditor((prev) => ({
                                                ...prev,
                                                value: e.target.value,
                                              }))
                                            }
                                            placeholder="Paste or edit the full URL"
                                            className="campaign-btn campaign-url-editor-textarea campaign-url-editor-textarea-lg"
                                          />
                                          <div className="campaign-url-editor-footer">
                                            <Button
                                              color="secondary"
                                              size="sm"
                                              onClick={closeUrlEditor}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              color="primary"
                                              size="sm"
                                              onClick={saveUrlEditor}
                                            >
                                              Save
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                  {formErrors.viewthroughConversionUrl && (
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={
                                        tooltipOpen.viewthroughConversionUrl
                                      }
                                      target="viewthroughConversionUrl"
                                      autohide={false}
                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.viewthroughConversionUrl}
                                    </Tooltip>
                                  )}
                                </Col>
                              </Row>

                              <Row className="pl-md-1 mb-3 mt-3 campaign-basics-top-row">
                                {/* Value viewthrough */}
                                <Col
                                  md="4"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <Label className="forms-labels">
                                    Value viewthrough conversions at:
                                  </Label>
                                  <div
                                    className="campaign-currency position-relative mt-2 camp-style-33"

                                  >
                                    <Input
                                      type="text"
                                      id="conversion_at"
                                      value={formData.conversion_at}
                                      onChange={(e) => {
                                        let value = e.target.value
                                          .replace(/%/g, "")
                                          .trim();
                                        setFormData((prev) => ({
                                          ...prev,
                                          conversion_at: value,
                                        }));
                                      }}
                                      onBlur={(e) => {
                                        let value = e.target.value
                                          .replace(/%/g, "")
                                          .trim();
                                        if (value === "") {
                                          setError("");
                                          return;
                                        }
                                        const num = Number(value);
                                        if (isNaN(num))
                                          setError("Only numbers are allowed");
                                        else if (num < 0)
                                          setError(
                                            "Negative values are not allowed",
                                          );
                                        else if (num === 0)
                                          setError(
                                            "Value must be greater than 0",
                                          );
                                        else if (num > 100)
                                          setError("Value cannot exceed 100%");
                                        else setError("");
                                      }}
                                      className={`form-control campaign-btn w-100 ${error ? "is-invalid" : ""}`}
                                    />
                                    <span className="usd">%</span>
                                  </div>
                                  {error && (
                                    <div
                                      className="invalid-feedback camp-style-34"

                                    >
                                      {error}
                                    </div>
                                  )}
                                </Col>

                                {/* Chrome Privacy Sandbox Attribution */}
                                {/* <Col
                                  md="4"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <div
                                    className="d-flex align-items-center mb-3 gap-2"
                                    style={{ height: "24px" }}
                                  >
                                    <Input
                                      type="checkbox"
                                      id="chrome_privacy"
                                      checked={formData.chrome_privacy}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          chrome_privacy: e.target.checked,
                                        }))
                                      }
                                      style={{ marginTop: 0 }}
                                    />
                                    <Label
                                      for="chrome_privacy"
                                      className="forms-labels ms-2 mb-0"
                                    >
                                      Chrome Privacy Sandbox Attribution
                                    </Label>
                                  </div>
                                  <div
                                    className={`mt-2 ${!formData.chrome_privacy ? "disabled-section" : ""}`}
                                    style={{ height: "42px" }}
                                  >
                                    <Input
                                      type="text"
                                      id="sandbox_attribution"
                                      value={formData.sandbox_attribution || ""}
                                      placeholder="Select a tracked conversion"
                                      className="form-control campaign-btn w-100 h-100"
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          sandbox_attribution: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                </Col> */}

                                {/* Deduplication */}
                                <Col
                                  md="4"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <Label className="forms-labels">
                                    Deduplication
                                  </Label>
                                  <div className="mt-2 d-flex flex-column gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                      <Label
                                        className="d-flex align-items-center gap-2 mb-0 cursor-pointer camp-style-13"

                                      >
                                        <Input
                                          type="radio"
                                          name="count_conversion"
                                          value="1"
                                          checked={
                                            formData.count_conversion === "1"
                                          }
                                          className="camp-style-28"
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              count_conversion: e.target.value,
                                            })
                                          }
                                        />
                                        <span className="text-gray-700 devices">
                                          Count one conversion per user every
                                        </span>
                                      </Label>
                                      <Input
                                        type="text"
                                        value={formData.conversion_user || ""}
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            conversion_user: e.target.value,
                                          }))
                                        }
                                        className={`form-control campaign-btn ms-2 ${formData.count_conversion === "2" || formData.count_conversion === "3" ? "input-disabled" : ""} camp-style-35`}

                                      />
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                      <Label
                                        className="d-flex align-items-center gap-2 mb-0 cursor-pointer camp-style-13"

                                      >
                                        <Input
                                          type="radio"
                                          name="count_conversion"
                                          value="2"
                                          checked={
                                            formData.count_conversion === "2"
                                          }
                                          className="camp-style-28"
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              count_conversion: e.target.value,
                                            })
                                          }
                                        />
                                        <span className="text-gray-700 devices">
                                          Count first conversion only
                                        </span>
                                      </Label>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                      <Label
                                        className="d-flex align-items-center gap-2 mb-0 cursor-pointer camp-style-13"

                                      >
                                        <Input
                                          type="radio"
                                          name="count_conversion"
                                          value="3"
                                          checked={
                                            formData.count_conversion === "3"
                                          }
                                          className="camp-style-28"
                                          onChange={(e) =>
                                            setFormData({
                                              ...formData,
                                              count_conversion: e.target.value,
                                            })
                                          }
                                        />
                                        <span className="text-gray-700 devices">
                                          Count every conversion
                                        </span>
                                      </Label>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                            </>
                          )}
                        </div>
                      </div>
                      <div
                        id="campaign-section-viewability"
                        className="campaign-section-target"
                      >
                        <div className="campaign-section-card mt-4">
                          <div
                            className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${activeSubTab === "viewability" ? "active-header" : ""} camp-style-7`}

                          >
                            <div>
                              <div
                                className="fw-bold mb-1 camp-style-8"

                              >
                                Viewability
                              </div>
                              <span
                                className="text-muted camp-style-9"

                              ></span>
                            </div>
                          </div>

                          <Row className="pl-md-1 align-items-center mb-3 mt-3">
                            <Col md="4" sm="12" className="campaign-field mb-3">
                              <Label className="forms-labels">
                                Measure Viewability
                                <i
                                  className="fa fa-info-circle offcircle ms-2 mt-1"
                                  id="tt-aac85020"
                                />
                                <UncontrolledTooltip
                                  placement="right"
                                  target="tt-aac85020"
                                >
                                  Enable viewability tracking to measure how many ad impressions are actually seen.
                                </UncontrolledTooltip>
                              </Label>
                              <div
                                className="d-flex align-items-center gap-4 mt-2 camp-style-27"

                              >
                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="measure_viewability"
                                    value="1"
                                    checked={
                                      formData.measure_viewability === "1"
                                    }
                                    className="camp-style-28"
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        measure_viewability: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    On
                                  </span>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                  <Input
                                    type="radio"
                                    name="measure_viewability"
                                    value="0"
                                    checked={
                                      formData.measure_viewability === "0"
                                    }
                                    className="camp-style-28"
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        measure_viewability: e.target.value,
                                      })
                                    }
                                  />
                                  <span className="text-gray-700 devices">
                                    Off
                                  </span>
                                </div>
                              </div>
                            </Col>
                          </Row>
                          {formData.measure_viewability === "1" && (
                            <>
                              <Row className="pl-md-1 mb-3 mt-3">
                                {/* Provider Column */}
                                <Col
                                  md="12"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <Label className="forms-labels">
                                    Provider
                                    <i
                                      className="fa fa-info-circle offcircle ms-2 mt-1"
                                      id="tt-5e02994d"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-5e02994d"
                                    >
                                      Select a third-party partner to verify and measure viewability.
                                    </UncontrolledTooltip>
                                  </Label>
                                  <div className="d-flex align-items-start gap-4 mt-2">
                                    <div
                                      className="d-flex align-items-start gap-2 camp-style-24"

                                    >
                                      <Input
                                        type="radio"
                                        name="provider"
                                        value="1"
                                        checked={formData.provider === "1"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            provider: e.target.value,
                                          })
                                        }
                                        className="camp-style-36"
                                      />
                                      <div>
                                        <span className="text-gray-700 devices fw-semibold">
                                          DoubleVerify
                                        </span>
                                        <br />
                                        <span className="text-gray-700 doubleabilty">
                                          Measure viewability on display ($0.12
                                          CPM) and video ($0.20 CPM) creatives.
                                        </span>
                                        <br />
                                        <span className="text-gray-700 doubleabilty">
                                          {" "}
                                          DoubleVerify's viewability fees will
                                          be waived if you also use DoubleVerify
                                          Brand Protection viewability segments.
                                        </span>
                                      </div>
                                    </div>
                                    <div
                                      className="d-flex align-items-start gap-2 camp-style-24"

                                    >
                                      <Input
                                        type="radio"
                                        name="provider"
                                        value="2"
                                        checked={formData.provider === "2"}
                                        onChange={(e) =>
                                          setFormData({
                                            ...formData,
                                            provider: e.target.value,
                                          })
                                        }
                                        className="camp-style-36"
                                      />
                                      <div>
                                        <span className="text-gray-700 devices fw-semibold">
                                          Pixalate
                                        </span>
                                        <br />
                                        <span className="text-gray-700 doubleabilty">
                                          Measure viewability on display ($0.03
                                          CPM) creatives
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>

                              <Row className="pl-md-1 mb-3 mt-3">
                                {/* Standard Column */}
                                <Col
                                  md="4"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  {formData.provider === "1" && (
                                    <>
                                      <Label className="forms-labels">
                                        Standard
                                        <i
                                          className="fa fa-info-circle offcircle ms-2 mt-1"
                                          id="tt-96d78b1e"
                                        />
                                        <UncontrolledTooltip
                                          placement="right"
                                          target="tt-96d78b1e"
                                        >
                                          Select the viewability measurement standard (e.g. GroupM, PMX, IAB/MRC).
                                        </UncontrolledTooltip>
                                      </Label>
                                      <div className="d-flex align-items-center gap-4 mt-2">
                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="standard"
                                            value="1"
                                            checked={formData.standard === "1"}
                                            className="camp-style-28"
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                standard: e.target.value,
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices fw-semibold">
                                            GroupM
                                            <i
                                              className="fa fa-info-circle offcircle ms-2"
                                              id="tt-a0fc5ca0"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-a0fc5ca0"
                                            >
                                              Viewability criteria defined by the GroupM standard.
                                            </UncontrolledTooltip>
                                          </span>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="standard"
                                            value="2"
                                            checked={formData.standard === "2"}
                                            className="camp-style-28"
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                standard: e.target.value,
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices fw-semibold">
                                            PMX
                                            <i
                                              className="fa fa-info-circle offcircle ms-2"
                                              id="tt-734ef5f0"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-734ef5f0"
                                            >
                                              Viewability criteria defined by the PMX standard.
                                            </UncontrolledTooltip>
                                          </span>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="standard"
                                            value="3"
                                            checked={formData.standard === "3"}
                                            className="camp-style-28"
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                standard: e.target.value,
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices fw-semibold">
                                            IAB/MRC
                                            <i
                                              className="fa fa-info-circle offcircle ms-2"
                                              id="tt-2b4fb506"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-2b4fb506"
                                            >
                                              Standard industry viewability criteria defined by IAB and MRC.
                                            </UncontrolledTooltip>
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  {formData.provider === "0" && (
                                    <>
                                      <Label className="forms-labels">
                                        Standard
                                        <i
                                          className="fa fa-info-circle offcircle ms-2 mt-1"
                                          id="tt-e3eb714e"
                                        />
                                        <UncontrolledTooltip
                                          placement="right"
                                          target="tt-e3eb714e"
                                        >
                                          Select the standard viewability requirements.
                                        </UncontrolledTooltip>
                                      </Label>
                                      <div
                                        className="d-flex align-items-center mt-2 camp-style-27"

                                      >
                                        <span className="text-gray-700 devices fw-semibold">
                                          IAB/MRC
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </Col>

                                {/* Sampling Rate Column */}
                                <Col
                                  md="4"
                                  sm="12"
                                  className="campaign-field mb-3"
                                >
                                  <Label className="forms-labels">
                                    Sampling Rate
                                    <i
                                      className="fa fa-info-circle ms-2 mt-1 offcircle"
                                      id="tt-5f528d8a"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-5f528d8a"
                                    >
                                      Define the percentage of impressions that will be measured for viewability verification.
                                    </UncontrolledTooltip>
                                  </Label>
                                  <div
                                    className="mt-2 camp-style-27"

                                  >
                                    <Input
                                      id="sampling_rate"
                                      value={formData.sampling_rate}
                                      onChange={(e) => {
                                        setFormData((prev) => {
                                          return {
                                            ...prev,
                                            sampling_rate: e.target.value,
                                          };
                                        });
                                      }}
                                      className="form-control campaign-btn w-100"
                                      placeholder="100%"
                                      type="text"
                                      autoComplete="off"
                                    />
                                  </div>
                                </Col>
                              </Row>
                            </>
                          )}
                        </div>
                      </div>
                      <div
                        id="campaign-section-advanced"
                        className="campaign-section-target"
                      >
                        <div className="campaign-section-card mt-4">
                          <div
                            className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${activeSubTab === "advanced" ? "active-header" : ""} camp-style-7`}

                          >
                            <div>
                              <div
                                className="fw-bold mb-1 camp-style-8"

                              >
                                Advanced
                              </div>
                              <span
                                className="text-muted camp-style-9"

                              ></span>
                            </div>
                          </div>
                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="advanced_video"
                                    checked={!!formData.advanced_video}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        advanced_video: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label
                                    for="advanced_video"
                                    className="ms-2 mb-0"
                                  >
                                    <span className="forms-labels">Video</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>

                          {formData.advanced_video && (
                            <>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Placement Type
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-e0022965"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-e0022965"
                                    >
                                      Select the types of video placements (such as instream or interstitial) where your video ads will play.
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.placement_type.instream ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            instream: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="instream"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Instream
                                      <i
                                        className="fa fa-info-circle ms-2 offcircle"
                                        id="tt-fd908c5f"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tt-fd908c5f"
                                      >
                                        Video ad plays within non-primary video
                                        content.
                                      </UncontrolledTooltip>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.placement_type.Accompanying ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Accompanying: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Accompanying Content
                                      <i
                                        className="fa fa-info-circle ms-2 offcircle"
                                        id="tt-22a42c22"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tt-22a42c22"
                                      >
                                        Video ad appears alongside related
                                        content.
                                      </UncontrolledTooltip>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="interstitial"
                                      checked={
                                        formData?.placement_type
                                          ?.Interstitial === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Interstitial: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="interstitial"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Interstitial
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-d008da37"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-d008da37"
                                    >
                                      Video ad appears between content
                                      transitions.
                                    </UncontrolledTooltip>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="standalone"
                                      checked={
                                        formData?.placement_type?.Standalone ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Standalone: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="standalone"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Standalone
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-a4e8914f"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-a4e8914f"
                                    >
                                      Video ad plays independently without
                                      related content.
                                    </UncontrolledTooltip>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Unknown"
                                      checked={
                                        formData?.placement_type?.Unknown ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          placement_type: {
                                            ...prev.placement_type,
                                            Unknown: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="Unknown"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Unknown
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-b06f1ac0"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-b06f1ac0"
                                    >
                                      Video ad plays independently without
                                      related content.
                                    </UncontrolledTooltip>
                                  </div>
                                </Col>
                              </Row>

                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Roll Position
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-f64d13f4"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-f64d13f4"
                                    >
                                      Select when the video ad should play relative to the video content (pre-roll, mid-roll, post-roll).
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col xl="2" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.roll_position.preroll ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                preroll: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="instream"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Pre-Roll
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col xl="2" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center">
                                        <Input
                                          type="checkbox"
                                          id="accompanying"
                                          checked={
                                            formData.roll_position.midroll ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                midroll: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="accompanying"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Mid-Roll
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col xl="2" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.roll_position.postroll ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                postroll: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="instream"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Post-Roll
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col xl="2" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="unknown"
                                          checked={
                                            formData.roll_position.unknown ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              roll_position: {
                                                ...prev.roll_position,
                                                unknown: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="unknown"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Unknown
                                        </Label>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>
                              </Row>

                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Player Size
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tooltip-player-size"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tooltip-player-size"
                                    >
                                      Choose which video player sizes to target or exclude.
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col xl="4" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.player_size
                                              .small_player === true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              player_size: {
                                                ...prev.player_size,
                                                small_player: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="instream"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Exclude small player size
                                          <i
                                            className="fa fa-info-circle ms-2 offcircle"
                                            id="tooltip-small-player"
                                          />
                                          <UncontrolledTooltip
                                            placement="right"
                                            target="tooltip-small-player"
                                          >
                                            Exclude smaller video players from displaying your ad.
                                          </UncontrolledTooltip>
                                        </Label>
                                      </div>
                                    </Col>

                                    <Col xl="4" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.player_size
                                              .unknown_player === true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              player_size: {
                                                ...prev.player_size,
                                                unknown_player:
                                                  e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="instream"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Exclude unknown player size
                                        </Label>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Skippable Ads
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tooltip-skippable"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tooltip-skippable"
                                    >
                                      Specify whether your video ad impressions can be skipped by the viewer.
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.skippable_ads.Skippable ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          skippable_ads: {
                                            ...prev.skippable_ads,
                                            Skippable: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="instream"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Skippable video impressions
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.skippable_ads.Non_skippable ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          skippable_ads: {
                                            ...prev.skippable_ads,
                                            Non_skippable: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Non-skippable video impressions
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.skippable_ads.Skippability ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          skippable_ads: {
                                            ...prev.skippable_ads,
                                            Skippability: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Skippability unknown
                                    </Label>
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Playback Method
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tooltip-playback"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tooltip-playback"
                                    >
                                      Choose how the video ad playback is initiated (e.g. auto-play with sound, click-to-play).
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={
                                        formData.playback_method.soundOn ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            soundOn: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="instream"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Auto-play with sound on
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.playback_method.soundOff ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            soundOff: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Auto-play with sound off
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.playback_method
                                          .click_to_play === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            click_to_play: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Click to play
                                    </Label>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.playback_method.Mouseover ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            Mouseover: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Mouseover to play
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="accompanying"
                                      checked={
                                        formData.playback_method.Playback ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          playback_method: {
                                            ...prev.playback_method,
                                            Playback: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="accompanying"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Playback method unknown
                                    </Label>
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Reward Status
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-5ff06425"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-5ff06425"
                                    >
                                      Choose whether to display ads on rewarded placements where users opt-in to view ads for a reward.
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col xl="3" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.reward_status?.Rewarded ===
                                            true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              reward_status: {
                                                ...prev.reward_status,
                                                Rewarded: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="instream"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Rewarded
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col xl="3" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center">
                                        <Input
                                          type="checkbox"
                                          id="accompanying"
                                          checked={
                                            formData.reward_status
                                              ?.Unrewarded === true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              reward_status: {
                                                ...prev.reward_status,
                                                Unrewarded: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="accompanying"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Unrewarded
                                        </Label>
                                      </div>
                                    </Col>
                                    <Col xl="3" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center mb-1">
                                        <Input
                                          type="checkbox"
                                          id="instream"
                                          checked={
                                            formData.reward_status
                                              ?.UnknownReward === true
                                          }
                                          onChange={(e) =>
                                            setFormData((prev) => ({
                                              ...prev,
                                              reward_status: {
                                                ...prev.reward_status,
                                                UnknownReward: e.target.checked,
                                              },
                                            }))
                                          }
                                        />
                                        <Label
                                          for="instream"
                                          className="ms-2 mb-0 advancedvideo"
                                        >
                                          Unknown
                                        </Label>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>
                              </Row>

                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Orientation Matching
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-5216b4d3"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-5216b4d3"
                                    >
                                      Enable matching the ad creative's orientation with the video player's orientation.
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <Row>
                                    <Col xl="4" lg="6" md="6" sm="12">
                                      <div className="d-flex align-items-center gap-4">
                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="orientation_matching"
                                            value="1"
                                            checked={
                                              formData.orientation_matching ===
                                              "1"
                                            }
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                orientation_matching:
                                                  e.target.value,
                                                make: [],
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices">
                                            On
                                          </span>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                          <Input
                                            type="radio"
                                            name="orientation_matching"
                                            value="0"
                                            checked={
                                              formData.orientation_matching ===
                                              "0"
                                            }
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                orientation_matching:
                                                  e.target.value,
                                              })
                                            }
                                          />
                                          <span className="text-gray-700 devices">
                                            Off
                                          </span>
                                        </div>
                                      </div>
                                    </Col>
                                  </Row>
                                </Col>
                              </Row>
                            </>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="advanced_audio"
                                    checked={!!formData.advanced_audio}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        advanced_audio: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label
                                    for="advanced_audio"
                                    className="ms-2 mb-0 "
                                  >
                                    <span className=" forms-labels">Audio</span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.advanced_audio && (
                            <>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Label className="mb-0 forms-labels">
                                    Feed Types
                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-8c5dc313"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-8c5dc313"
                                    >
                                      Select the audio feed types (such as music streaming or podcasts) where your audio ads will play.
                                    </UncontrolledTooltip>
                                  </Label>
                                </Col>

                                <Col md="6" sm="12">
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="instream"
                                      checked={formData?.audio?.music === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...(prev.audio || {}),
                                            music: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="instream"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Music streaming service
                                      <i
                                        className="fa fa-info-circle ms-2 offcircle"
                                        id="tt-6213db78"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tt-6213db78"
                                      >
                                        Audio ad plays within a music streaming service.
                                      </UncontrolledTooltip>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="fm_am"
                                      checked={formData?.audio?.fm_am === true}
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...(prev.audio || {}),
                                            fm_am: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="fm_am"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      FM/AM broadcast
                                      <i
                                        className="fa fa-info-circle ms-2 offcircle"
                                        id="tt-32ab9759"
                                      />
                                      <UncontrolledTooltip
                                        placement="right"
                                        target="tt-32ab9759"
                                      >
                                        Audio ad plays within an FM/AM broadcast.
                                      </UncontrolledTooltip>
                                    </Label>
                                  </div>
                                  <div className="d-flex align-items-center mb-1">
                                    <Input
                                      type="checkbox"
                                      id="Podcast"
                                      checked={
                                        formData?.audio?.Podcast === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Podcast: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="Podcast"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Podcast
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-a75f149b"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-a75f149b"
                                    >
                                      Audio ad plays within a podcast.
                                    </UncontrolledTooltip>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="catch_up"
                                      checked={
                                        formData?.audio?.catch_up === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            catch_up: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="catch_up"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Catch-up radio
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-a94b7c14"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-a94b7c14"
                                    >
                                      Audio ad plays within catch-up radio.
                                    </UncontrolledTooltip>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Webradio"
                                      checked={
                                        formData?.audio?.Webradio === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Webradio: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="Webradio"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Web radio
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-a61ce3d0"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-a61ce3d0"
                                    >
                                      Audio ad plays within internet or web radio.
                                    </UncontrolledTooltip>
                                  </div>

                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Videogame"
                                      checked={
                                        formData?.audio?.Videogame === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Videogame: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="Videogame"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Video game
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-ba9cc127"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-ba9cc127"
                                    >
                                      Audio ad plays within a video game.
                                    </UncontrolledTooltip>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Videogame"
                                      checked={
                                        formData?.audio?.Textto_speech === true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Textto_speech: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="Textto_speech"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Text To Speech
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-cea51c98"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-cea51c98"
                                    >
                                      Audio ad plays during text-to-speech content.
                                    </UncontrolledTooltip>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Input
                                      type="checkbox"
                                      id="Videogame"
                                      checked={
                                        formData?.audio?.Feedtype_unknown ===
                                        true
                                      }
                                      onChange={(e) =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          audio: {
                                            ...prev.audio,
                                            Feedtype_unknown: e.target.checked,
                                          },
                                        }))
                                      }
                                    />
                                    <Label
                                      for="Feedtype_unknown"
                                      className="ms-2 mb-0 advancedvideo"
                                    >
                                      Feed type unknown
                                    </Label>

                                    <i
                                      className="fa fa-info-circle ms-2 offcircle"
                                      id="tt-99431699"
                                    />
                                    <UncontrolledTooltip
                                      placement="right"
                                      target="tt-99431699"
                                    >
                                      Audio ad plays in an unknown feed type.
                                    </UncontrolledTooltip>
                                  </div>
                                </Col>
                              </Row>
                            </>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="page_position"
                                    checked={isPagePositionEnabled(
                                      formData.page_position,
                                    )}
                                    onChange={(e) =>
                                      setFormData((prev) => {
                                        const currentPos = prev.page_position || {};
                                        const isAnyChecked = currentPos.above_fold || currentPos.below_fold || currentPos.page_unknown;
                                        return {
                                          ...prev,
                                          page_position: e.target.checked
                                            ? {
                                              above_fold: isAnyChecked ? !!currentPos.above_fold : true,
                                              below_fold: isAnyChecked ? !!currentPos.below_fold : true,
                                              page_unknown: isAnyChecked ? !!currentPos.page_unknown : true,
                                              _enabled: true,
                                            }
                                            : {
                                              above_fold: false,
                                              below_fold: false,
                                              page_unknown: false,
                                              _enabled: false,
                                            },
                                        };
                                      })
                                    }
                                  />
                                  <Label
                                    for="page_position"
                                    className="ms-2 mb-0"
                                  >
                                    <span className="forms-labels">
                                      Page Position
                                    </span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {isPagePositionEnabled(formData.page_position) && (
                            <Row className="align-items-start mb-3">
                              <Col md="1" className="d-none d-md-block" />
                              <Col md="1" sm="12" />

                              <Col md="6" sm="12">
                                <Row>
                                  <Col xl="4" lg="4" md="4" sm="12">
                                    <div className="d-flex align-items-center mb-1">
                                      <Input
                                        type="checkbox"
                                        id="above_fold"
                                        checked={
                                          formData?.page_position
                                            ?.above_fold === true
                                        }
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            page_position: {
                                              ...prev.page_position,
                                              above_fold: e.target.checked,
                                              _enabled: true,
                                            },
                                          }))
                                        }
                                      />
                                      <Label
                                        for="above_fold"
                                        className="ms-2 mb-0 advancedvideo camp-style-37"

                                      >
                                        Above the Fold (ATF)
                                      </Label>
                                    </div>
                                  </Col>
                                  <Col xl="4" lg="4" md="4" sm="12">
                                    <div className="d-flex align-items-center">
                                      <Input
                                        type="checkbox"
                                        id="below_fold"
                                        checked={
                                          formData?.page_position
                                            ?.below_fold === true
                                        }
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            page_position: {
                                              ...prev.page_position,
                                              below_fold: e.target.checked,
                                              _enabled: true,
                                            },
                                          }))
                                        }
                                      />
                                      <Label
                                        for="below_fold"
                                        className="ms-2 mb-0 advancedvideo camp-style-37"

                                      >
                                        Below the Fold (BTF)
                                      </Label>
                                    </div>
                                  </Col>
                                  <Col xl="4" lg="4" md="4" sm="12">
                                    <div className="d-flex align-items-center mb-1">
                                      <Input
                                        type="checkbox"
                                        id="page_unknown"
                                        checked={
                                          formData?.page_position
                                            ?.page_unknown === true
                                        }
                                        onChange={(e) =>
                                          setFormData((prev) => ({
                                            ...prev,
                                            page_position: {
                                              ...prev.page_position,
                                              page_unknown: e.target.checked,
                                              _enabled: true,
                                            },
                                          }))
                                        }
                                      />
                                      <Label
                                        for="page_unknown"
                                        className="ms-2 mb-0 advancedvideo camp-style-37"

                                      >
                                        Unknown
                                      </Label>
                                    </div>
                                  </Col>
                                </Row>
                              </Col>
                            </Row>
                          )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="brand_protection"
                                    checked={!!formData.brand_protection}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        brand_protection: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label
                                    for="brand_protection"
                                    className="ms-2 mb-0"
                                  >
                                    <span className="forms-labels">
                                      Brand Protection
                                    </span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.brand_protection && (
                            <>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col md="1" sm="12" />

                                <Col md="8" sm="12">
                                  <span className="ssnote">
                                    Target segments by adding them as an{" "}
                                    <span className="font-bold">AND</span> or{" "}
                                    <span className="font-bold">OR</span> from
                                    the list on the left. You can switch the
                                    rules on the right by clicking on any of the{" "}
                                    <span className="font-bold">AND</span> or
                                    <span className="font-bold">OR</span>{" "}
                                    buttons. You can also rearrange the order of
                                    your target conditions using the up and down
                                    arrows on each targeted segment.
                                  </span>
                                </Col>
                              </Row>
                            </>
                          )}
                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="audience_capture"
                                    checked={isAudienceCaptureEnabled(
                                      formData.audience_capture,
                                    )}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        audience_capture: e.target.checked
                                          ? {
                                            ...sanitizeAudienceCapture(
                                              prev.audience_capture,
                                            ),
                                            _enabled: true,
                                          }
                                          : {
                                            Clicks: "",
                                            Conversions: "",
                                            Audio: "",
                                            complete_25: "",
                                            complete_50: "",
                                            complete_75: "",
                                            complete_100: "",
                                            _enabled: false,
                                          },
                                        Capture_Clicks: e.target.checked
                                          ? prev.Capture_Clicks
                                          : "",
                                        Capture_Conversions: e.target.checked
                                          ? prev.Capture_Conversions
                                          : "",
                                        complete_25: e.target.checked
                                          ? prev.complete_25
                                          : "",
                                        complete_50: e.target.checked
                                          ? prev.complete_50
                                          : "",
                                        complete_75: e.target.checked
                                          ? prev.complete_75
                                          : "",
                                        complete_100: e.target.checked
                                          ? prev.complete_100
                                          : "",
                                      }))
                                    }
                                  />
                                  <Label
                                    for="audience_capture"
                                    className="ms-2 mb-0"
                                  >
                                    <span className="forms-labels">
                                      Audience Capture
                                    </span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {isAudienceCaptureEnabled(
                            formData.audience_capture,
                          ) && (
                              <>
                                <Row className="align-items-start mb-3">
                                  <Col md="1" className="d-none d-md-block" />
                                  <Col xl="2" lg="6" md="6" sm="12"></Col>

                                  <Col md="6" sm="12">
                                    <Row>
                                      <Col md="5" sm="12">
                                        <div className="d-flex align-items-center mb-1">
                                          <Input
                                            type="checkbox"
                                            id="capture_clicks"
                                            checked={
                                              formData.audience_capture.Clicks ===
                                              "Capture Clicks"
                                            }
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                ...prev,
                                                audience_capture: {
                                                  ...prev.audience_capture,
                                                  Clicks: e.target.checked
                                                    ? "Capture Clicks"
                                                    : "",
                                                  _enabled:
                                                    e.target.checked ||
                                                    isAudienceCaptureEnabled({
                                                      ...prev.audience_capture,
                                                      Clicks: "",
                                                    }),
                                                },
                                                Capture_Clicks: e.target.checked
                                                  ? prev.Capture_Clicks
                                                  : "",
                                              }))
                                            }
                                          />
                                          <Label
                                            for="capture_clicks"
                                            className="ms-2 mb-0 advancedvideo"
                                          >
                                            Capture Clicks
                                            <i
                                              className="fa fa-info-circle ms-2 offcircle"
                                              id="tt-0d849efc"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-0d849efc"
                                            >
                                              Users that click your ad will
                                              automatically be added to a
                                              retargeting list of your choice.
                                            </UncontrolledTooltip>
                                          </Label>
                                        </div>
                                      </Col>
                                      <Col md="6" sm="12">
                                        {formData.audience_capture.Clicks ===
                                          "Capture Clicks" && (
                                            <>
                                              <div className="position-relative">
                                                <div
                                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                  onClick={() =>
                                                    setOpenAudienceStatus(
                                                      !openaudienceStatus,
                                                    )
                                                  }
                                                  tabIndex={0}
                                                >
                                                  {audienceType}
                                                </div>

                                              </div>
                                            </>
                                          )}
                                      </Col>
                                    </Row>
                                    <Row>
                                      <Col md="5" sm="12">
                                        <div className="d-flex align-items-center mb-1">
                                          <Input
                                            type="checkbox"
                                            id="capture_conversions"
                                            checked={
                                              formData.audience_capture
                                                .Conversions ===
                                              "Capture conversion"
                                            }
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                ...prev,
                                                audience_capture: {
                                                  ...prev.audience_capture,
                                                  Conversions: e.target.checked
                                                    ? "Capture conversion"
                                                    : "",
                                                  _enabled:
                                                    e.target.checked ||
                                                    isAudienceCaptureEnabled({
                                                      ...prev.audience_capture,
                                                      Conversions: "",
                                                    }),
                                                },
                                                Capture_Conversions: e.target
                                                  .checked
                                                  ? prev.Capture_Conversions
                                                  : "",
                                              }))
                                            }
                                          />
                                          <Label
                                            for="capture_conversions"
                                            className="ms-2 mb-0 advancedvideo"
                                          >
                                            Capture Conversions
                                            <i
                                              className="fa fa-info-circle ms-2 offcircle"
                                              id="tt-7b4387f0"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-7b4387f0"
                                            >
                                              Any users that trigger a conversion
                                              for your campaign can also be
                                              automatically added to your own
                                              retargeting list. Naturally, you
                                              must have conversion tracking
                                              configured properly for this feature
                                              to take effect.
                                            </UncontrolledTooltip>
                                          </Label>
                                        </div>
                                      </Col>

                                      <Col md="6" sm="12">
                                        {formData.audience_capture.Conversions ===
                                          "Capture conversion" && (
                                            <>
                                              <div className="position-relative mt-2">
                                                <div
                                                  className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                  onClick={() =>
                                                    setOpenAudienceStatus1(
                                                      !openaudienceStatus1,
                                                    )
                                                  }
                                                  tabIndex={0}
                                                >
                                                  {audienceType1}

                                                </div>
                                              </div>
                                            </>
                                          )}
                                      </Col>
                                    </Row>
                                    <Row>
                                      <Col md="5" sm="12">
                                        <div className="d-flex align-items-center mb-1">
                                          <Input
                                            type="checkbox"
                                            id="capture_audio"
                                            checked={
                                              formData.audience_capture.Audio ===
                                              "Capture Audio/Video Events"
                                            }
                                            onChange={(e) =>
                                              setFormData((prev) => ({
                                                ...prev,
                                                audience_capture: {
                                                  ...prev.audience_capture,
                                                  Audio: e.target.checked
                                                    ? "Capture Audio/Video Events"
                                                    : "",
                                                  _enabled:
                                                    e.target.checked ||
                                                    isAudienceCaptureEnabled({
                                                      ...prev.audience_capture,
                                                      Audio: "",
                                                    }),
                                                },
                                                complete_25: e.target.checked
                                                  ? prev.complete_25
                                                  : "",
                                                complete_50: e.target.checked
                                                  ? prev.complete_50
                                                  : "",
                                                complete_75: e.target.checked
                                                  ? prev.complete_75
                                                  : "",
                                                complete_100: e.target.checked
                                                  ? prev.complete_100
                                                  : "",
                                              }))
                                            }
                                          />
                                          <Label
                                            for="capture_audio"
                                            className="ms-2 mb-0 advancedvideo"
                                          >
                                            Capture Audio/Video Events
                                            <i
                                              className="fa fa-info-circle ms-2 offcircle"
                                              id="tt-b8e86bd4"
                                            />
                                            <UncontrolledTooltip
                                              placement="right"
                                              target="tt-b8e86bd4"
                                            >
                                              Any users that trigger a conversion
                                              for your campaign can also be
                                              automatically added to your own
                                              retargeting list. Naturally, you
                                              must have conversion tracking
                                              configured properly for this feature
                                              to take effect.
                                            </UncontrolledTooltip>
                                          </Label>
                                        </div>
                                      </Col>
                                    </Row>

                                    {formData.audience_capture.Audio ===
                                      "Capture Audio/Video Events" && (
                                        <>
                                          <Row>
                                            <Col md="5" sm="12">
                                              <div className="d-flex align-items-center mb-1"></div>
                                            </Col>
                                            <Col md="6" sm="12"></Col>
                                            <div role="alert" className="how">
                                              <i
                                                className="fa fa-info-circle me-2"
                                                id="mesaasgeicon"
                                              ></i>
                                              There are no audio or video ads linked
                                              to this campaign.
                                              <span className="gotolinked">
                                                {" "}
                                                Go to Linked Ads
                                              </span>{" "}
                                              to add creatives.
                                            </div>
                                          </Row>
                                          <Row>
                                            <Col md="5" sm="12">
                                              <div className="d-flex align-items-center mb-1">
                                                <Input
                                                  type="checkbox"
                                                  id="capture_25"
                                                  checked={
                                                    formData.audience_capture
                                                      .complete_25 ===
                                                    "Capture conversion"
                                                  }
                                                  onChange={(e) =>
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      audience_capture: {
                                                        ...prev.audience_capture,
                                                        complete_25: e.target
                                                          .checked
                                                          ? "Capture conversion"
                                                          : "",
                                                        _enabled:
                                                          e.target.checked ||
                                                          isAudienceCaptureEnabled({
                                                            ...prev.audience_capture,
                                                            complete_25: "",
                                                          }),
                                                      },
                                                      complete_25: e.target.checked
                                                        ? prev.complete_25
                                                        : "",
                                                    }))
                                                  }
                                                />
                                                <Label for="capture_25" className="ms-2 mb-0 advancedvideo">
                                                  25% Complete
                                                </Label>
                                              </div>
                                            </Col>

                                            <Col md="6" sm="12">
                                              {formData.audience_capture
                                                .complete_25 ===
                                                "Capture conversion" && (
                                                  <>
                                                    <div
                                                      id="audiencepercentage"
                                                      className="position-relative mt-2"
                                                    >
                                                      <div
                                                        className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                        onClick={() =>
                                                          setOpen25AudienceStatus(
                                                            !open25audienceStatus,
                                                          )
                                                        }
                                                        tabIndex={0}
                                                      >
                                                        {audienceType_25}
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                            </Col>
                                          </Row>

                                          <Row>
                                            <Col md="5" sm="12">
                                              <div className="d-flex align-items-center mb-1">
                                                <Input
                                                  type="checkbox"
                                                  id="capture_50"
                                                  checked={
                                                    formData.audience_capture
                                                      .complete_50 ===
                                                    "Capture conversion"
                                                  }
                                                  onChange={(e) =>
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      audience_capture: {
                                                        ...prev.audience_capture,
                                                        complete_50: e.target
                                                          .checked
                                                          ? "Capture conversion"
                                                          : "",
                                                        _enabled:
                                                          e.target.checked ||
                                                          isAudienceCaptureEnabled({
                                                            ...prev.audience_capture,
                                                            complete_50: "",
                                                          }),
                                                      },
                                                      complete_50: e.target.checked
                                                        ? prev.complete_50
                                                        : "",
                                                    }))
                                                  }
                                                />
                                                <Label for="capture_50" className="ms-2 mb-0 advancedvideo">
                                                  50% Complete
                                                </Label>
                                              </div>
                                            </Col>

                                            <Col md="6" sm="12">
                                              {formData.audience_capture
                                                .complete_50 ===
                                                "Capture conversion" && (
                                                  <>
                                                    <div
                                                      id="audience50percentage"
                                                      className="position-relative mt-2"
                                                    >
                                                      <div
                                                        className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                        onClick={() =>
                                                          setOpen50AudienceStatus(
                                                            !open50audienceStatus,
                                                          )
                                                        }
                                                        tabIndex={0}
                                                        placeholder="Select Audience Type"
                                                      >
                                                        {audienceType_50}
                                                        {/* <FaCaretDown
                                                    className={`custom-select-icon ${open50audienceStatus ? "open" : ""}`}
                                                  /> */}
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                            </Col>
                                          </Row>

                                          <Row>
                                            <Col md="5" sm="12">
                                              <div className="d-flex align-items-center mb-1">
                                                <Input
                                                  type="checkbox"
                                                  id="capture_75"
                                                  checked={
                                                    formData.audience_capture
                                                      .complete_75 ===
                                                    "Capture conversion"
                                                  }
                                                  onChange={(e) =>
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      audience_capture: {
                                                        ...prev.audience_capture,
                                                        complete_75: e.target
                                                          .checked
                                                          ? "Capture conversion"
                                                          : "",
                                                        _enabled:
                                                          e.target.checked ||
                                                          isAudienceCaptureEnabled({
                                                            ...prev.audience_capture,
                                                            complete_75: "",
                                                          }),
                                                      },
                                                      complete_75: e.target.checked
                                                        ? prev.complete_75
                                                        : "",
                                                    }))
                                                  }
                                                />
                                                <Label for="capture_75" className="ms-2 mb-0 advancedvideo">
                                                  75% Complete
                                                </Label>
                                              </div>
                                            </Col>

                                            <Col md="6" sm="12">
                                              {formData.audience_capture
                                                .complete_75 ===
                                                "Capture conversion" && (
                                                  <>
                                                    <div
                                                      id="audience75percentage"
                                                      className="position-relative mt-2"
                                                    >
                                                      <div
                                                        className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                        onClick={() =>
                                                          setOpen75AudienceStatus(
                                                            !open75audienceStatus,
                                                          )
                                                        }
                                                        tabIndex={0}

                                                      >
                                                        {audienceType_75}
                                                        {/* <FaCaretDown
                                                    className={`custom-select-icon ${open75audienceStatus ? "open" : ""}`}
                                                  /> */}
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col md="5" sm="12">
                                              <div className="d-flex align-items-center mb-1">
                                                <Input
                                                  type="checkbox"
                                                  id="capture_100"
                                                  checked={
                                                    formData.audience_capture
                                                      .complete_100 ===
                                                    "Capture conversion"
                                                  }
                                                  onChange={(e) =>
                                                    setFormData((prev) => ({
                                                      ...prev,
                                                      audience_capture: {
                                                        ...prev.audience_capture,
                                                        complete_100: e.target
                                                          .checked
                                                          ? "Capture conversion"
                                                          : "",
                                                        _enabled:
                                                          e.target.checked ||
                                                          isAudienceCaptureEnabled({
                                                            ...prev.audience_capture,
                                                            complete_100: "",
                                                          }),
                                                      },
                                                      complete_100: e.target.checked
                                                        ? prev.complete_100
                                                        : "",
                                                    }))
                                                  }
                                                />
                                                <Label for="capture_100" className="ms-2 mb-0 advancedvideo">
                                                  100% Complete
                                                </Label>
                                              </div>
                                            </Col>

                                            <Col md="6" sm="12">
                                              {formData.audience_capture
                                                .complete_100 ===
                                                "Capture conversion" && (
                                                  <>
                                                    <div
                                                      id="audience100percentage"
                                                      className="position-relative mt-2"
                                                    >
                                                      <div
                                                        className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                                        onClick={() =>
                                                          setOpen100AudienceStatus(
                                                            !open100audienceStatus,
                                                          )
                                                        }
                                                        tabIndex={0}
                                                      >
                                                        {audienceType_100}
                                                        {/* <FaCaretDown
                                                    className={`custom-select-icon ${open100audienceStatus ? "open" : ""}`}
                                                  /> */}
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col xl="3" lg="6" md="6" sm="12">
                                              <div className="d-flex align-items-center mb-1">
                                                <Button
                                                  id="newaudience"
                                                  className="form-control py-1 px-2  rounded-0 "
                                                  onClick={toggletargetModal}
                                                >
                                                  <span class="linkto">
                                                    Create new Audience
                                                  </span>
                                                </Button>
                                                <AudienceModal
                                                  isOpen={targetModalOpen}
                                                  toggle={toggletargetModal}
                                                />
                                              </div>
                                            </Col>
                                          </Row>
                                        </>
                                      )}
                                  </Col>
                                </Row>
                              </>
                            )}

                          <Col sm="12" md="3">
                            <Row>
                              <Col
                                md="1"
                                sm="12"
                                className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                              ></Col>
                              <Col md="9" sm="12">
                                <div className="d-flex align-items-center">
                                  <Input
                                    type="checkbox"
                                    id="ad_optimization"
                                    checked={formData.ad_optimization}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        ad_optimization: e.target.checked,
                                      }))
                                    }
                                  />
                                  <Label
                                    for="ad_optimization"
                                    className="ms-2 mb-0"
                                  >
                                    <span className="forms-labels">
                                      Ad Optimization{" "}
                                    </span>
                                  </Label>
                                </div>
                              </Col>
                            </Row>
                          </Col>
                          {formData.ad_optimization && (
                            <>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Goal:
                                  </Label>
                                </Col>

                                <Col xl="2" lg="6" md="6" sm="12">
                                  <div
                                    id="goal_ctr"
                                    className="position-relative"
                                  >
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenGoalstr(!opengoalstar)
                                      }
                                      tabIndex={0}
                                    >
                                      {goalstr}
                                      <FaCaretDown
                                        className={`custom-select-icon ${opengoalstar ? "open" : ""}`}
                                      />
                                    </div>

                                    {opengoalstar && (
                                      <div className="custom-dropdown-menu">
                                        {goalstrOptions.map((opt, idx) => (
                                          <div
                                            key={idx}
                                            className={`custom-dropdown-option ${goalstr === opt.value ? "selected" : ""}`}
                                            onClick={() => {
                                              setGoalStr(opt.value);
                                              setFormData((prev) => ({
                                                ...prev,
                                                goal_str: opt.defaultValue,
                                              }));
                                              setOpenGoalstr(false);
                                            }}
                                          >
                                            <span className="tick-icon">
                                              {goalstr === opt.value && "✓"}
                                            </span>
                                            <span>{opt.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Evaluation Group:
                                  </Label>
                                </Col>

                                <Col xl="2" lg="6" md="6" sm="12">
                                  <div
                                    id="evalution_group"
                                    className="position-relative"
                                  >
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenEvalutiongroup(
                                          !openevalutiongroup,
                                        )
                                      }
                                      tabIndex={0}
                                    >
                                      {evalutiongroup}
                                      <FaCaretDown
                                        className={`custom-select-icon ${openevalutiongroup ? "open" : ""}`}
                                      />
                                    </div>

                                    {openevalutiongroup && (
                                      <div className="custom-dropdown-menu">
                                        {evalutiongroupOptions.map(
                                          (opt, idx) => (
                                            <div
                                              key={idx}
                                              className={`custom-dropdown-option ${evalutiongroup === opt.value ? "selected" : ""}`}
                                              onClick={() => {
                                                setEvalutionGroup(opt.value);
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  evalution_group: opt.value,
                                                }));
                                                setOpenEvalutiongroup(false);
                                              }}
                                            >
                                              <span className="tick-icon">
                                                {evalutiongroup === opt.value &&
                                                  "✓"}
                                              </span>
                                              <span>{opt.label}</span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-3">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Evaluation Period:
                                  </Label>
                                </Col>

                                <Col xl="2" lg="6" md="6" sm="12">
                                  <div
                                    id="evalution_period"
                                    className="position-relative"
                                  >
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenEvalutionperiod(
                                          !openevalutionperiod,
                                        )
                                      }
                                      tabIndex={0}
                                    >
                                      {evalutionperiod}
                                      <FaCaretDown
                                        className={`custom-select-icon ${openevalutionperiod ? "open" : ""}`}
                                      />
                                    </div>

                                    {openevalutionperiod && (
                                      <div className="custom-dropdown-menu">
                                        {evalutionperiodOptions.map(
                                          (opt, idx) => (
                                            <div
                                              key={idx}
                                              className={`custom-dropdown-option ${evalutionperiod === opt.value ? "selected" : ""}`}
                                              onClick={() => {
                                                setEvalutionPeriod(opt.value);
                                                setFormData((prev) => ({
                                                  ...prev,
                                                  evalution_period: opt.value,
                                                }));
                                                setOpenEvalutionperiod(false);
                                              }}
                                            >
                                              <span className="tick-icon">
                                                {evalutionperiod ===
                                                  opt.value && "✓"}
                                              </span>
                                              <span>{opt.label}</span>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                              <Row className="align-items-start mb-1">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Sample Size:
                                  </Label>
                                </Col>
                                <Col xl="2" lg="6" md="6" sm="12">
                                  <Input
                                    type="text"
                                    id="sample_size_value"
                                    name="sample_size_value"
                                    value={formData.sample_size_value}
                                    onChange={(e) => {
                                      setFormErrors((p) => ({
                                        ...p,
                                        sample_size_value: "",
                                      }));
                                      handleChange(e);
                                    }}
                                    className={`formscontrol ${formErrors.sample_size_value ? "border-danger" : ""}`}
                                    onMouseEnter={() =>
                                      formErrors.sample_size_value &&
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        sample_size_value: true,
                                      }))
                                    }
                                    onMouseLeave={() =>
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        sample_size_value: false,
                                      }))
                                    }
                                  />
                                  {formErrors.sample_size_value && (
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={tooltipOpen.sample_size_value}
                                      target="sample_size_value"
                                      autohide={false}
                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.sample_size_value}
                                    </Tooltip>
                                  )}
                                </Col>

                                <Col xl="2" lg="6" md="6" sm="12">
                                  <div
                                    id="sample_value"
                                    className="position-relative"
                                  >
                                    <div
                                      className="form-control rounded-0 normalized-input d-flex justify-content-between align-items-center campagineditor"
                                      onClick={() =>
                                        setOpenSampleValue(!opensamplevalue)
                                      }
                                      tabIndex={0}
                                    >
                                      {samplevalue}
                                      <FaCaretDown
                                        className={`custom-select-icon ${opensamplevalue ? "open" : ""}`}
                                      />
                                    </div>

                                    {opensamplevalue && (
                                      <div className="custom-dropdown-menu">
                                        {samplevalueOptions.map((opt, idx) => (
                                          <div
                                            key={idx}
                                            className={`custom-dropdown-option ${samplevalue === opt.value ? "selected" : ""}`}
                                            onClick={() => {
                                              setSamplevalue(opt.value);
                                              setFormData((prev) => ({
                                                ...prev,
                                                sample_value: opt.value,
                                              }));
                                              setOpenSampleValue(false);
                                            }}
                                          >
                                            <span className="tick-icon">
                                              {samplevalue === opt.value && "✓"}
                                            </span>
                                            <span>{opt.label}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Col>
                              </Row>

                              <Row className="align-items-start ">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Control Group Size:
                                  </Label>
                                </Col>
                                <Col md="1" sm="12">
                                  <Input
                                    type="text"
                                    id="control_group_size"
                                    name="control_group_size"
                                    value={formData.control_group_size}
                                    onChange={(e) => {
                                      setFormErrors((p) => ({
                                        ...p,
                                        control_group_size: "",
                                      }));
                                      handleChange(e);
                                    }}
                                    className={`formscontrol ${formErrors.control_group_size ? "border-danger" : ""}`}
                                    onMouseEnter={() =>
                                      formErrors.control_group_size &&
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        control_group_size: true,
                                      }))
                                    }
                                    onMouseLeave={() =>
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        control_group_size: false,
                                      }))
                                    }
                                  />
                                  {formErrors.control_group_size && (
                                    <>
                                      <Tooltip
                                        placement="bottom"
                                        isOpen={tooltipOpen.control_group_size}
                                        target="control_group_size"
                                        autohide={false}
                                        popperClassName="custom-tooltip"
                                      >
                                        <div className="one"></div>
                                        {formErrors.control_group_size}
                                      </Tooltip>
                                    </>
                                  )}
                                </Col>
                              </Row>
                              <Row className="align-items-start mt-2">
                                <Col md="1" className="d-none d-md-block" />
                                <Col
                                  md="3"
                                  sm="12"
                                  className="d-flex justify-content-md-end justify-content-start mb-1 mb-md-0 col-max-sm"
                                >
                                  <Label className="forms-labels adoptimaizegoal">
                                    Control Group SOV:
                                  </Label>
                                </Col>
                                <Col md="1" sm="12">
                                  <Input
                                    type="text"
                                    id="control_group_sov"
                                    name="control_group_sov"
                                    value={formData.control_group_sov}
                                    onChange={(e) => {
                                      setFormErrors((p) => ({
                                        ...p,
                                        control_group_sov: "",
                                      }));
                                      handleChange(e);
                                    }}
                                    className={`formscontrol${formErrors.control_group_sov ? " border-danger" : ""}`}
                                    onMouseEnter={() =>
                                      formErrors.control_group_sov &&
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        control_group_sov: true,
                                      }))
                                    }
                                    onMouseLeave={() =>
                                      setTooltipOpen((t) => ({
                                        ...t,
                                        control_group_sov: false,
                                      }))
                                    }
                                  />
                                </Col>
                                {formErrors.control_group_sov && (
                                  <>
                                    <Tooltip
                                      placement="bottom"
                                      isOpen={tooltipOpen.control_group_sov}
                                      target="control_group_sov"
                                      autohide={false}
                                      popperClassName="custom-tooltip"
                                    >
                                      <div className="one"></div>
                                      {formErrors.control_group_sov}
                                    </Tooltip>
                                  </>
                                )}
                              </Row>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      id="campaign-section-step-1"
                      className="campaign-section-target"
                    >
                      <div className="campaign-section-card mt-4">
                        <div
                          className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${step === 1 ? "active-header" : ""} camp-style-7`}

                        >
                          <div>
                            <div
                              className="fw-bold mb-1  camp-style-8"

                            >
                              Deals
                            </div>
                            <span
                              className="text-muted camp-style-9"

                            ></span>
                          </div>
                        </div>
                        <DealsEditor
                          formData={formData}
                          setFormData={setFormData}
                        />
                      </div>
                    </div>

                    <div
                      id="campaign-section-step-2"
                      className="campaign-section-target"
                    >
                      <div className="campaign-section-card mt-4">
                        <div
                          className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${step === 2 ? "active-header" : ""} camp-style-7`}

                        >
                          <div>
                            <div
                              className="fw-bold mb-1 camp-style-8"

                            >
                              Location
                            </div>
                            <span
                              className="text-muted camp-style-9"

                            ></span>
                          </div>
                        </div>
                        <Location
                          {...props}
                          campaign={campaign}
                          selectedCountryItems={selectedCountryItems}
                          setSelectedCountryItems={setSelectedCountryItems}
                          geoPoints={geoPoints}
                          hyperlocalType={hyperlocalType}
                          radiusUnits={radiusUnits}
                          fileName={fileName}
                          onGeoPointsChange={(points) => setGeoPoints(points)}
                          onHyperlocalChange={(val) => setHyperlocalType(val)}
                          onRadiusUnitsChange={(val) => setRadiusUnits(val)}
                          onFileNameChange={(name) => setFileName(name)}
                          isLocationHydrated={isLocationHydrated}
                          setIsLocationHydrated={setIsLocationHydrated}
                          isCampaignLoading={isLoading}
                        />
                      </div>
                    </div>

                    <div
                      id="campaign-section-step-3"
                      className="campaign-section-target"
                    >
                      <div className="campaign-section-card mt-4">
                        <div
                          className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${step === 3 ? "active-header" : ""} camp-style-7`}

                        >
                          <div>
                            <div
                              className="fw-bold mb-1 camp-style-8"

                            >
                              Devices
                            </div>
                            <span
                              className="text-muted camp-style-9"

                            ></span>
                          </div>
                        </div>

                        <Devices
                          props={props}
                          ref={modalRef}
                          deviceData={deviceData}
                          handledevice={setDevicedata}
                        />
                      </div>
                    </div>
                    <div
                      id="campaign-section-step-4"
                      className="campaign-section-target"
                    >
                      <div className="campaign-section-card mt-4">
                        <div
                          className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${step === 4 ? "active-header" : ""} camp-style-7`}

                        >
                          <div>
                            <div
                              className="fw-bold mb-1 camp-style-8"

                            >
                              Inventory
                            </div>
                            <span
                              className="text-muted camp-style-9"

                            ></span>
                          </div>
                        </div>

                        <InventoryEditor
                          props={props}
                          ref={inventoryref}
                          initialData={{
                            data: formData.inventory_exchange || [],
                            domain: formData.inventory_domain || [],
                            exclude_ads_txt: formData.inventory_exclude_ads_txt,
                            target_direct: formData.inventory_target_direct,
                            opt_supply: formData.inventory_opt_supply,
                            opt_made: formData.inventory_opt_made,
                          }}
                          onInventoryChange={handleInventoryChange}
                        />
                      </div>
                    </div>

                    <div
                      id="campaign-section-step-5"
                      className="campaign-section-target"
                    >
                      <div className="campaign-section-card mt-4">
                        <div
                          className={`d-flex justify-content-between align-items-center pb-3 mb-4 campaign-card-header ${step === 5 ? "active-header" : ""} camp-style-7`}

                        >
                          <div>
                            <div
                              className="fw-bold mb-1 camp-style-8"
                            >
                              Linked Ads
                            </div>
                            <span
                              className="text-muted camp-style-9"

                            ></span>
                          </div>
                        </div>

                        <LinkedAdsEditor
                          brandId={
                            formData?.brand_id ||
                            brandId ||
                            localStorage.getItem("currentBrandId")
                          }
                          linkedAds={formData.linkedAds || []}
                          campaignId={id || campaign_id}
                          onLinkedAdsChange={(ads) =>
                            setFormData((prev) => ({
                              ...prev,
                              linkedAds: ads,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div
                      id="campaign-section-step-7"
                      className="campaign-section-target camp-style-38"

                    >
                      <div></div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xl="2" lg="3" md="12">
                <div
                  className="campaign-sidebar mt-5 camp-style-39"

                >
                  <div className="campaign-sidebar-title">Campaign Preview</div>
                  <div className="campaign-sidebar-actions">
                    <button
                      className="campaign-btn campaign-btn-cancel"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    {(campaignEdit ? camUpdateUser : camCreateUser) && (
                      <button
                        className="campaign-btn campaign-btn-create"
                        onClick={addNewCampaign}
                        disabled={campaign?.readOnly}
                      >
                        {campaignEdit ? "Update" : "Save"}
                      </button>
                    )}
                  </div>
                  <div className="campaign-preview-card">
                    <div className="campaign-preview-header">
                      <div className="campaign-preview-icon">📢</div>
                      <div className="camp-style-40">
                        <div className="campaign-preview-name">
                          {formData.name || "Untitled Campaign"}
                        </div>
                        <div className="campaign-preview-id">
                          {campaignType || "Advanced Campaign"}
                        </div>
                      </div>
                    </div>
                    <div
                      className="camp-style-41"
                    >
                      <div className="campaign-preview-key">Campaign Name</div>

                      <div
                        className={`campaign-preview-val camp-preview-val-name ${formData.name ? "has-value" : ""}`}
                      >
                        {formData.name || "----"}
                      </div>
                    </div>
                    <div className="campaign-preview-row">
                      <div>
                        <div className="campaign-preview-key">Status</div>
                        <div className="camp-style-36">
                          <span className="campaign-goal-badge">
                            <span className="campaign-dot" />
                            {formData.status || "Offline"}
                          </span>
                        </div>
                      </div>
                      <div className="camp-style-42">
                        <div className="campaign-preview-key">CPM Bid</div>
                        <div
                          className={`campaign-preview-val camp-preview-val-price ${formData.price ? "has-value" : ""}`}
                        >
                          {formData.price ? `$${formData.price}` : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="camp-style-43">
                      <div className="campaign-progress-label">
                        <span className="campaign-progress-text">Progress</span>
                        <span className="campaign-progress-pct">
                          {getStepProgress()}%
                        </span>
                      </div>
                      <div className="campaign-progress-bar">
                        <div
                          className="campaign-progress-fill"
                          style={{ width: `${getStepProgress()}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="camp-style-44" >
                  </div>

                  <div className="campaign-quick-nav-card mt-5">
                    <div className="campaign-quick-nav-list">
                      {steps.map((label, i) => {
                        const isCurrentStep = i === step;

                        const subMenus = {
                          0: [
                            {
                              key: "basics",
                              label: "Basics",
                              icon: "📋",
                              id: "campaign-section-basics",
                            },
                            {
                              key: "budget",
                              label: "Budget",
                              icon: "💰",
                              id: "campaign-section-budget",
                            },
                            {
                              key: "optimization",
                              label: "Optimization",
                              icon: "⚡",
                              id: "campaign-section-optimization",
                            },
                            {
                              key: "conversions",
                              label: "Conversions",
                              icon: "🔄",
                              id: "campaign-section-conversions",
                            },
                            {
                              key: "viewability",
                              label: "Viewability",
                              icon: "👁️",
                              id: "campaign-section-viewability",
                            },
                            {
                              key: "advanced",
                              label: "Advanced",
                              icon: "⚙️",
                              id: "campaign-section-advanced",
                            },
                          ],
                        };
                        return (
                          <div
                            key={i}
                            className="camp-style-45"
                          >
                            <div
                              onClick={() => {
                                setStep(i);
                                if (i === 0) setActiveSubTab("basics");
                                setTimeout(() => {
                                  const sectionId =
                                    i === 0
                                      ? "campaign-section-basics"
                                      : `campaign-section-step-${i}`;
                                  scrollToSection(sectionId);
                                }, 100);
                              }}
                              className={`camp-quick-nav-link ${isCurrentStep ? "active" : ""} ${i < step ? "completed" : ""}`}
                            >
                              <span
                                className={`camp-quick-nav-label ${isCurrentStep ? "active" : ""} ${i < step ? "completed" : ""}`}
                              >
                                {label}
                              </span>
                              <div
                                className="camp-style-46"
                              >
                                {isStepCompleted(i) ? (
                                  <CheckIcon />
                                ) : isCurrentStep ||
                                  (i === 0 &&
                                    getBasicsIncompleteCount() > 0) ? (
                                  <div
                                    className="camp-style-47"
                                  />
                                ) : (
                                  <span
                                    className="camp-style-48"
                                  >
                                    ›
                                  </span>
                                )}
                              </div>
                            </div>
                            {isCurrentStep && subMenus[i] && (
                              <div
                                className="camp-style-49"
                              >
                                {subMenus[i].map((subItem) => {
                                  const isSubActive =
                                    activeSubTab === subItem.key;
                                  return (
                                    <div
                                      key={subItem.key}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setStep(i);
                                        setActiveSubTab(subItem.key);
                                        setTimeout(() => {
                                          scrollToSection(subItem.id);
                                        }, 100);
                                      }}
                                      className={`campaign-sidebar-sub-item ${isSubActive ? "active" : ""} camp-style-50`}

                                    >
                                      <span>{subItem.label}</span>
                                      {subItem.key === "basics" &&
                                        getBasicsIncompleteCount() > 0 && (
                                          <span
                                            className="camp-style-51"
                                          >
                                            ({getBasicsIncompleteCount()} *)
                                          </span>
                                        )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
          <ConversionParametersModal
            isOpen={conversionParametersModal.isOpen}
            toggle={closeConversionParametersModal}
            title={conversionParametersModal.title || "Edit Parameters"}
            initialUrl={getConversionUrlValue(conversionParametersModal.field)}
            externalCampaignName={formData.externalname}
            campaignName={formData.name}
            onApply={applyConversionParameters}
          />
        </>
      )}
      {!camViewUser && (
        <div className="alert alert-warning mt-3 camp-style-52" >
          <i className="fa fa-exclamation-triangle me-2"></i>
          <strong>Access Denied:</strong> You do not have permission to view the
          Create Campaign.
        </div>
      )}
    </>
  );
};

export default CreateCampaign;