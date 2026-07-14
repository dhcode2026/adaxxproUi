import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
  Form,
  Spinner,
  Tooltip,
  Table,
  UncontrolledTooltip,
} from 'reactstrap';
import { useViewContext } from "../../../ViewContext.jsx";
import Swal from 'sweetalert2';
import BrandcategoriesModal from "../BrandcategoriesModal.jsx";
import { FaPlus } from "react-icons/fa";
import { FaCaretDown, FaCaretRight, FaCaretUp } from "react-icons/fa";
import { IoMdClose, IoMdInformationCircle } from "react-icons/io";
import { editcreatives, updatecreative, getAllCreativeAttribute } from "../../../views/api/Api.jsx";
import { canCreate, canUpdate } from "../../../utils/permissionHelper.js";

const videoErrorIcon =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg width="92" height="92" viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="46" cy="46" r="43" fill="none" stroke="#f57c7c" stroke-width="4"/>
      <path d="M28 28 L64 64 M64 28 L28 64" stroke="#f57c7c" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `);

const VideoModaleditor = ({ isOpen, toggle, video: initialVideo, callback, brand_id: propBrandId }) => {
  const [trackingEvents, setTrackingEvents] = useState([
    { url: "", type: "Click Tracking" },
  ]);
  const [activeRow, setActiveRow] = useState(null);
  const [openTypeIndex, setOpenTypeIndex] = useState(null);
  const [isPositionOpen, setIsPositionOpen] = useState(false);
  const [impurlinputcount, setimpurlinputcount] = useState([
    { id: crypto.randomUUID(), value: "" }
  ]);
  const [myAudio, setmyAudio] = useState(null);
  const [activeTab, setActiveTab] = useState("Details");
  const vx = useViewContext();
  const effectiveBrandId = initialVideo?.brand_id || propBrandId || "";
  const context = useViewContext();
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    video: false,
    video_url: false,
    brand_name: false,
    destination_url: false,
    impression_tracking_url: false,
    creative_attribute: false,
  });
  const [formData, setFormData] = useState({
    name: initialVideo?.name || '',
    video: initialVideo?.video || '',
    destination_url: initialVideo?.destination_url || '',
    impression_tracking_url: initialVideo?.impression_tracking_url || '',
    brand_name: initialVideo?.brand_name || '',
    bid_ecpm: initialVideo?.bid_ecpm || '0',
    width: initialVideo?.width || '',
    height: initialVideo?.height || '',
    width_range: initialVideo?.width_range || '',
    height_range: initialVideo?.height_range || '',
    vast_video_width: initialVideo?.vast_video_width || '',
    vast_video_height: initialVideo?.vast_video_height || '',
    htmltemplate: initialVideo?.htmltemplate || '',
    status: initialVideo?.status || '0',
    vast_video_duration: initialVideo?.vast_video_duration || '',
    vast_video_protocol: initialVideo?.vast_video_protocol || '',
    mime_type: initialVideo?.mime_type || '',
    vast_video_bitrate: initialVideo?.vast_video_bitrate || '2',
    vast_video_linearity: initialVideo?.vast_video_linearity || '2',
    width_height_list: initialVideo?.width_height_list || '',
    video_url: initialVideo?.video_url || '',
    video_upload: initialVideo?.video_upload || 'upload',
    contenttype: initialVideo?.contenttype || '',
    position: initialVideo?.position || '',
    carrier: initialVideo?.carrier || [],
    brand_id: effectiveBrandId,
    creative_attribute: initialVideo?.creative_attribute || initialVideo?.creativeAttributes || '',
  });
  useEffect(() => {
    if (initialVideo) {
      setFormData({
        id: initialVideo.id || '',
        name: initialVideo.name || '',
        video: initialVideo.video || '',
        destination_url: initialVideo.destinationUrl || '',
        impression_tracking_url: initialVideo.impressionTrackingUrl || '',
        brand_name: initialVideo.brandName || '',
        campaign_id: initialVideo.campaignId || '',
        bid_ecpm: initialVideo.bidEcpm?.toString() || '0',
        width: initialVideo.vastVideoWidth?.toString() || '300',
        height: initialVideo.vastVideoHeight?.toString() || '200',
        width_range: initialVideo.widthRange?.toString() || '400',
        height_range: initialVideo.heightRange?.toString() || '200',
        vast_video_width: initialVideo.vastVideoWidth?.toString() || '300',
        vast_video_height: initialVideo.vastVideoHeight?.toString() || '500',
        htmltemplate: initialVideo.htmltemplate || '',
        status: initialVideo.status || '0',
        vast_video_duration: initialVideo.vastVideoDuration?.toString() || '',
        vast_video_protocol: initialVideo.vastVideoProtocol?.toString() || '',
        mime_type: initialVideo.mimeType || 'testing',
        vast_video_bitrate: initialVideo.vastVideoBitrate?.toString() || '2',
        vast_video_linearity: initialVideo.vastVideoLinearity?.toString() || '2',
        width_height_list: initialVideo.widthHeightList || '300x50',
        video_url: initialVideo.videoUrl || '',
        video_upload: initialVideo.videoUpload || 'upload',
        contenttype: initialVideo.contenttype || '',
        position: initialVideo.position || '',
        brand_id: initialVideo.brand_id || propBrandId || '',
      });
      setUploadedVideo(initialVideo.video || null);
      setVideo(initialVideo);
    }
  }, [initialVideo, propBrandId]);

  

  const [creative, setCreative] = useState({ isVideo: true });
  const [html, setHtml] = useState('');
  const [errors, setErrors] = useState({});
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
    const getCreativeId = (item) => item?.id || item?.creativesId || "";
  const [video, setVideo] = useState();
  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const brandCategoriesBtnRef = useRef(null);
    const [isFetching, setIsFetching] = useState(false);
  const [creativeCreateUser, setCreativeCreateUser] = useState(false);
  const [creativeUpdateUser, setCreativeUpdateUser] = useState(false);
  const positionRef = useRef(null);
  const positionOptions = [
    { label: "Select Position", value: "" },
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
    { label: "Top", value: "top" },
    { label: "Bottom", value: "bottom" },
  ];
  const selectedPositionLabel =
    positionOptions.find((option) => option.value === String(formData.position || ""))?.label ||
    "Select Position";

  const togglebrandcategoryModal = () => {
    setBrandCategoryModalOpen((prev) => !prev);
  };
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [creativeAttributes, setCreativeAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const creativeAttributeRef = useRef(null);
  const creativeAttributePortalRef = useRef(null);
  const [isCreativeAttributeOpen, setIsCreativeAttributeOpen] = useState(false);
  const [creativeAttributeDropdownPosition, setCreativeAttributeDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const carrierWrapperRef = useRef(null);
  const carrierInputRef = useRef(null);
  const [carrierSearchQuery, setCarrierSearchQuery] = useState("");
  const [openCarriers, setOpenCarriers] = useState(false);
  const [carrierOptions] = useState([
    { label: "Verizon", value: "verizon" },
    { label: "AT&T", value: "att" },
    { label: "T-Mobile", value: "tmobile" },
    { label: "Sprint", value: "sprint" },
    { label: "MetroPCS", value: "metropcs" },
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handlePositionSelect = (value) => {
    setFormData((prev) => ({ ...prev, position: value }));
    setErrors((prev) => ({ ...prev, position: "" }));
    setIsPositionOpen(false);
  };

  const handleCreativeAttributeSelect = (value) => {
    setFormData((prev) => ({ ...prev, creative_attribute: value }));
    setErrors((prev) => ({ ...prev, creative_attribute: "" }));
  };

  const selectedCreativeAttribute = creativeAttributes.find(
    (attribute) => String(attribute.creativeAttributeId) === String(formData.creative_attribute)
  );
  const creativeAttributeDisplayValue = loadingAttributes
    ? "Loading attributes..."
    : selectedCreativeAttribute
      ? selectedCreativeAttribute.name
      : "-- Select Creative Attribute --";

  const getFilteredCarrierOptions = () => {
    return carrierOptions.filter((option) =>
      option.label.toLowerCase().includes(carrierSearchQuery.toLowerCase())
    );
  };

  const toggleCarrierSelection = (optionValue) => {
    setFormData((prev) => {
      const selected = prev.carrier || [];
      const updated = selected.includes(optionValue)
        ? selected.filter((value) => value !== optionValue)
        : [...selected, optionValue];

      return {
        ...prev,
        carrier: updated,
      };
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (positionRef.current && !positionRef.current.contains(event.target)) {
        setIsPositionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutsideCarriers = (event) => {
      if (carrierWrapperRef.current && !carrierWrapperRef.current.contains(event.target)) {
        setOpenCarriers(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideCarriers);
    return () => document.removeEventListener("mousedown", handleClickOutsideCarriers);
  }, []);

  useEffect(() => {
    if (openCarriers && carrierInputRef.current) {
      try {
        carrierInputRef.current.focus();
      } catch (e) {}
    }
  }, [openCarriers]);

  useEffect(() => {
    if (!isCreativeAttributeOpen) return;

    const updatePosition = () => {
      if (!creativeAttributeRef.current) return;
      const rect = creativeAttributeRef.current.getBoundingClientRect();
      setCreativeAttributeDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const wrapperNode = creativeAttributeRef.current;
      const portalNode = creativeAttributePortalRef.current;

      if (wrapperNode && wrapperNode.contains(event.target)) return;
      if (portalNode && portalNode.contains(event.target)) return;
      setIsCreativeAttributeOpen(false);
    };

    updatePosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isCreativeAttributeOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchCreativeAttributes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && getCreativeId(initialVideo)) {
      fetchVideoDetails(getCreativeId(initialVideo));
    }
  }, [isOpen, initialVideo]);

  const fetchCreativeAttributes = async () => {
    setLoadingAttributes(true);
    try {
      const response = await getAllCreativeAttribute();
      if (response.data?.status === 200) {
        setCreativeAttributes(response.data?.data?.informationCreativeAttributes || []);
      }
    } catch (error) {
      console.error("Error fetching creative attributes:", error);
    } finally {
      setLoadingAttributes(false);
    }
  };

    const fetchVideoDetails = async (id) => {
      setIsFetching(true);
      try {
        const response = await editcreatives(id);
        if (response.data?.status === 200 && response.data.data?.informationCreatives?.length > 0) {
          const videoData = response.data.data.informationCreatives[0];
          setFormData({
            id: videoData.creativesId,
            name: videoData.name || '',
            video: videoData.video || '',
            destination_url: videoData.destinationUrl || '',
            impression_tracking_url: videoData.impressionTrackingUrl || '',
            brand_name: videoData.brandName || '',
            bid_ecpm: videoData.bidEcpm?.toString() || '0',
            width: videoData.width?.toString() || '300',
            height: videoData.height?.toString() || '200',
            width_range: videoData.widthRange?.toString() || '400',
            height_range: videoData.heightRange?.toString() || '200',
            vast_video_width: videoData.vastVideoWidth?.toString() || '300',
            vast_video_height: videoData.vastVideoHeight?.toString() || '500',
            htmltemplate: videoData.htmltemplate || '',
            status: videoData.status || '0',
            vast_video_duration: videoData.vastVideoDuration?.toString() || '5',
            vast_video_protocol: videoData.vastVideoProtocol?.toString() || '',
            mime_type: videoData.mimeType || 'video/mp4',
            vast_video_bitrate: videoData.vastVideoBitrate?.toString() || '2',
            vast_video_linearity: videoData.vastVideoLinearity?.toString() || '2',
            width_height_list: videoData.widthHeightList || '300x50',
            video_url: videoData.videoUrl || '',
            video_upload: videoData.videoUpload || 'upload',
            contenttype: videoData.contenttype || '',
            position: videoData.position || '',
            carrier: videoData.carrier || [],
            brand_id: effectiveBrandId,
            creative_attribute: videoData.creativeAttributes?.toString() || videoData.creativeAttribute?.toString() || '',
          });
          setUploadedVideo(videoData.video || null);

          setSelectedCountries(videoData.brandCategory || []);
        }
      } catch (error) {
        console.error("Failed to fetch video details", error);
        Swal.fire("Error", "Failed to load video details", "error");
      } finally {
        setIsFetching(false);
      }
    };

  const showValidationError = async (messages) => {
    await Swal.fire({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="${videoErrorIcon}" 
              style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
        Please ensure all fields are correct.
        </div>
      `,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 300,
      padding: 10,
    });
  };

    useEffect(() => {
      if (selectedCountries.length > 0 && errors.brandCategory) {
        setErrors((prev) => ({ ...prev, brandCategory: null }));
        setTooltipOpen((prev) => ({ ...prev, brandCategory: false }));
      }
    }, [selectedCountries]);

  useEffect(() => {
    setCreativeCreateUser(canCreate("Creatives"));
    setCreativeUpdateUser(canUpdate("Creatives"));
  }, []);

  const videovalidateForm = async () => {
    const newErrors = {};
    let isValid = true;
    const domainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    const urlRegex = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/\S*)?$/;

    if (!formData.name.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }
    if (!formData.destination_url.trim()) {
      newErrors.destination_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.destination_url.trim())) {
      newErrors.destination_url =
        "Please enter a valid Click URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }

    if (formData.video_upload === "upload") {
      if (!formData.video?.trim()) {
        newErrors.video = "This field is required";
        isValid = false;
      }
    }

    if (formData.video_upload === "url") {
      if (!formData.video_url?.trim()) {
        newErrors.video_url = "This field is required";
        isValid = false;
      }
    }

    if (!formData.brand_name.trim()) {
      newErrors.brand_name = "This field is required";
      isValid = false;
    } else if (!domainRegex.test(formData.brand_name.trim())) {
      newErrors.brand_name =
        "Please enter a valid domain (e.g., http://example.com)";
      isValid = false;
    }

    // if (!formData.impression_tracking_url.trim()) {
    //   newErrors.impression_tracking_url = "This field is required";
    //   isValid = false;
    // } else if (!urlRegex.test(formData.impression_tracking_url.trim())) {
    //   newErrors.impression_tracking_url =
    //     "Please enter a valid Impression URL (e.g., https://up.gov.in/en)";
    //   isValid = false;
    // }

    setErrors(newErrors);

    if (!isValid) {
      await showValidationError(Object.values(newErrors));
    }

    return isValid;
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const videoSubmit = async () => {
    try {
      // For update, we use formData.id which is set correctly from fetch/initial
      if (formData.id) {
        // Build payload in snake_case as expected by the API (based on the provided sample)
        const payload = {
          name: formData.name,
          type: "video",
          videoUpload: formData.video_upload,
          videoUrl: formData.video_url,
          position: formData.position,
          brandName: formData.brand_name,
          vastVideoDuration: Number(formData.vast_video_duration) || 30,
          contenttype: formData.contenttype,
          bid_ecpm: Number(formData.bid_ecpm),
          status: formData.status,
          htmltemplate: formData.htmltemplate,
          destinationUrl: formData.destination_url,
          impressionTrackingUrl: formData.impression_tracking_url,
          // Additional fields that may be needed (match the keys used in your API)
          vastVideoWidth: Number(formData.vast_video_width) || 300,
          vastVideoHeight: Number(formData.vast_video_height) || 500,
          vastVideoProtocol: formData.vast_video_protocol,
          mimeType: formData.mime_type,
          vastVideoBitrate: Number(formData.vast_video_bitrate) || 2,
          vastVideoLinearity: Number(formData.vast_video_linearity) || 2,
          widthHeightList: formData.width_height_list,
          // The actual video content: if uploaded, it's base64 in formData.video; otherwise empty
          video: formData.video_upload === 'upload' ? formData.video : '',
          brandCategory: selectedCountries, // Include brand categories
          creativeAttributes: parseInt(formData.creative_attribute, 10) || 0,
        };

        const response = await updatecreative(formData.id, payload);
        // Check success based on your API response structure
        if (response.status === 200 || response.data?.status === 200) {
          if (callback) callback(response.data?.data || response.data);
          return { error: false };
        } else {
          return { error: true, message: response.data?.message || "Update failed" };
        }
      } else {
        // Create new video (fallback – should not happen in edit modal, but kept for completeness)
        const payload = {
          name: formData.name,
          type: "video",
          videoUpload: formData.video_upload,
          videoUrl: formData.video_url,
          position: formData.position,
          brandName: formData.brand_name,
          vastVideoDuration: Number(formData.vast_video_duration) || 30,
          contenttype: formData.contenttype,
          bid_ecpm: Number(formData.bid_ecpm),
          status: formData.status,
          htmltemplate: formData.htmltemplate,
          destinationUrl: formData.destination_url,
          impressionTrackingUrl: formData.impression_tracking_url,
          vastVideoWidth: Number(formData.vast_video_width) || 300,
          vastVideoHeight: Number(formData.vast_video_height) || 500,
          vastVideoProtocol: formData.vast_video_protocol,
          mimeType: formData.mime_type,
          vastVideoBitrate: Number(formData.vast_video_bitrate) || 2,
          vastVideoLinearity: Number(formData.vast_video_linearity) || 2,
          widthHeightList: formData.width_height_list,
          video: formData.video_upload === 'upload' ? formData.video : '',
          creativeAttributes: parseInt(formData.creative_attribute, 10) || 0,
        };
        const newId = await context.addNewCreative(payload);
        if (newId) {
          if (callback) callback({ ...payload, id: newId });
          return { error: false };
        } else {
          return { error: true, message: "Failed to create video" };
        }
      }
    } catch (err) {
      console.error("videoSubmit error:", err);
      return { error: true, message: err.response?.data?.message || "Unexpected error" };
    }
  };


  const addNewvideo = async (e) => {
    e.preventDefault();

    const isValid = await videovalidateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: initialVideo?.id ? 'Do you want to update this Video?' : 'Do you want to save this Video?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await videoSubmit();

      await delay(1000);

      if (response.error) {
        Swal.fire({
          title: "Error!",
          text: response.message || "Something went wrong.",
          imageUrl: videoErrorIcon,
          imageWidth: 92,
          imageHeight: 92,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
        });
      } else {
        Swal.fire({
          title: "Saved!",
          text: `Video has been ${initialVideo?.id ? "updated" : "created"}.`,
          imageUrl:
            "data:image/svg+xml;utf8," +
            encodeURIComponent(`
              <svg width="92" height="92" viewBox="0 0 92 92" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="46" cy="46" r="38" fill="none" stroke="#92d36e" stroke-width="4"/>
                <path d="M30 47 L41 58 L63 34" fill="none" stroke="#92d36e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `),
          imageWidth: 92,
          imageHeight: 92,
          confirmButtonText: "OK",
          confirmButtonColor: "#ee4444",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Unexpected error occurred.",
        imageUrl: videoErrorIcon,
        imageWidth: 92,
        imageHeight: 92,
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCampaign = () => {
    return [
      <option key="target-none" value="">-- Select Campaign --</option>,
      ...vx.campaigns.map((x, i) => (
        <option key={`target-${i}`} value={x.id}>
          {x.name}
        </option>
      )),
    ];
  };

  const renderTabContent = () => {
    if (activeTab === "Details") {
      return (
        <>
          <FormGroup>
            <Label for="name">Name <span className="valid">*</span></Label>
            <Input
              type="text"
              id="name"
              name="name"
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

          <FormGroup>
            <Label for="destination_url">Click URL <span className="valid">*</span></Label>
            <Input
              type="text"
              id="destination_url"
              name="destination_url"
              value={formData.destination_url}
              onChange={handleChange}
              invalid={!!errors.destination_url}
              className="formscontrol"
              onMouseEnter={() => errors.destination_url && setTooltipOpen((t) => ({ ...t, destination_url: true }))}
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, destination_url: false }))}
            />
            {errors.destination_url && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.destination_url}
                target="destination_url"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.destination_url}
              </Tooltip>
            )}
          </FormGroup>

          <FormGroup>
            <Label for="creative_attribute">Creative Attribute</Label>
            <div
              ref={creativeAttributeRef}
              className="campaign-select-wrapper"
              style={{ position: "relative", width: "100%" }}
            >
              <Input
                id="creative_attribute"
                name="creative_attribute"
                type="text"
                readOnly
                value={creativeAttributeDisplayValue}
                onClick={() => !loadingAttributes && setIsCreativeAttributeOpen((open) => !open)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsCreativeAttributeOpen((open) => !open);
                  }
                }}
                className="campaign-select-input dropdown-input-edvideo"
                invalid={!!errors.creative_attribute}
                onMouseEnter={() => errors.creative_attribute && setTooltipOpen((t) => ({ ...t, creative_attribute: true }))}
                onMouseLeave={() => setTooltipOpen((t) => ({ ...t, creative_attribute: false }))}
              />
              <FaCaretDown
                className={`custom-select-icon campaign-select-icon ${isCreativeAttributeOpen ? "open" : ""}`}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              />
            </div>
            {isCreativeAttributeOpen &&
              typeof document !== "undefined" &&
              ReactDOM.createPortal(
                <div
                  ref={creativeAttributePortalRef}
                  className="custom-dropdown-menu biddeript-b"
                  style={{
                    position: "absolute",
                    top: `${creativeAttributeDropdownPosition.top}px`,
                    left: `${creativeAttributeDropdownPosition.left}px`,
                    zIndex: 9999,
                    minWidth: `${creativeAttributeDropdownPosition.width || 120}px`,
                    width: `${creativeAttributeDropdownPosition.width || 120}px`,
                    pointerEvents: "auto",
                  }}
                >
                  <div
                    key="creative_attribute_option_none"
                    onClick={() => {
                      handleCreativeAttributeSelect("");
                      setIsCreativeAttributeOpen(false);
                    }}
                    className="custom-dropdown-option"
                    style={{ display: "flex", alignItems: "center", padding: "12px 10px", cursor: "pointer" }}
                  >
                    <span className="tick-icon editvideo-w"></span>
                    <span>-- Select Creative Attribute --</span>
                  </div>
                  {loadingAttributes ? (
                    <div id="creative_attribute_option_loading" className="custom-dropdown-option" style={{ padding: "12px 10px" }}>
                      Loading attributes...
                    </div>
                  ) : (
                    creativeAttributes.map((attribute) => {
                      const isSelected = String(formData.creative_attribute) === String(attribute.creativeAttributeId);
                      return (
                        <div
                          key={attribute.creativeAttributeId}
                          id={`creative_attribute_option_${attribute.creativeAttributeId}`}
                          onClick={() => {
                            handleCreativeAttributeSelect(String(attribute.creativeAttributeId));
                            setIsCreativeAttributeOpen(false);
                          }}
                          className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                          style={{ display: "flex", alignItems: "center", padding: "12px 10px", cursor: "pointer" }}
                        >
                          <span className="tick-icon editvideo-w">{isSelected && "✓"}</span>
                          <span>{attribute.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>,
                document.body,
              )}
          </FormGroup>

          {/* <FormGroup>
            <Label>Carriers</Label>
            <div
              ref={carrierWrapperRef}
              className="position-relative edvideo-width"
            >
              <div
                className="campaign-currency position-relative edvideo-width"
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="form-control campaign-button-edvideo campaign-btn placeholder-xs d-flex align-items-center justify-content-between"
                  onClick={() => setOpenCarriers((prev) => !prev)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setOpenCarriers((prev) => !prev); }}
                >
                  <span>{(formData.carrier || []).length > 0 ? `${(formData.carrier || []).length} selected` : 'Search'}</span>
                  <FaCaretDown className={`custom-select-icon ${openCarriers ? "open" : ""}`} />
                </div>

                {openCarriers && (
                  <div
                    className="custom-dropdown-menu dropdown-menu-edvideo"
                  >
                    <div className="dropdown-item-edvideo">
                      <input
                        ref={carrierInputRef}
                        type="text"
                        className="form-control edvideo-height"
                        placeholder="Search"
                        value={carrierSearchQuery}
                        onChange={(e) => setCarrierSearchQuery(e.target.value)}
                      />
                    </div>
                    {getFilteredCarrierOptions().map((option, idx) => {
                      const isSelected = (formData.carrier || []).includes(option.value);

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            toggleCarrierSelection(option.value);
                            setOpenCarriers(false);
                          }}
                          className={`custom-dropdown-option dropdown-option-edvideo ${isSelected ? "selected" : ""}`}
                          
                        >
                         <span className="tick-icon editvideo-w">
                            {isSelected && "✓"}
                          </span>
                          <span>{option.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="selected-items-edvideo">
                <p className="devies-targetedBroswere">Targeted Carriers</p>
                {(formData.carrier || []).length > 0 && (
                  <div className="d-flex flex-wrap gap-2">
                    {(formData.carrier || []).map((carrier) => (
                      <span
                        key={carrier}
                       className="selected-tag-edvideo"
                      >
                        {carrier}
                        <span
                          onClick={() => {
                            const updated = (formData.carrier || []).filter((c) => c !== carrier);
                            setFormData((prev) => ({
                              ...prev,
                              carrier: updated,
                            }));
                          }}
                          className="remove-icon-edvideo"
                        >
                          ✕
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FormGroup> */}

          <FormGroup>
            <Label for="position">Position </Label>
            <div
              id="position"
              className="position-relative"
              ref={positionRef}
            >
              <div className="campaign-select-wrapper">
                <Input
                  readOnly
                  name="position"
                  value={selectedPositionLabel}
                  className="campaign-select-input formscontrol dropdown-input-edvideo"
                  onClick={() => setIsPositionOpen((prev) => !prev)}
                  tabIndex={0}
                />
                <FaCaretDown
                  className={`custom-select-icon campaign-select-icon ${isPositionOpen ? "open" : ""}`}
                />
              </div>
              {isPositionOpen && (
                <div
                  className="custom-dropdown-menu biddeript-b dropdown-list-edvideo"
                 
                >
                  {positionOptions.map((option) => {
                    const isSelected =
                      String(formData.position || "") === option.value;

                    return (
                      <div
                        key={option.value || "empty-position"}
                        onClick={() => handlePositionSelect(option.value)}
                        className={`custom-dropdown-option dropdown-option-edvideo ${isSelected ? "selected" : ""}`}
                      >
                        <span className="tick-icon">
                          {isSelected && "\u2713"}
                        </span>
                        <span>{option.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FormGroup>

          <FormGroup>
            <Label for="htmltemplate">Outgoing File</Label>
            <Input
              type="textarea"
              id="htmltemplate"
              name="htmltemplate"
              value={formData.htmltemplate}
              onChange={handleChange}
              invalid={!!errors.htmltemplate}
              className="formscontrol"
              maxLength={300}
              onMouseEnter={() => errors.htmltemplate && setTooltipOpen((t) => ({ ...t, htmltemplate: true }))}
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, htmltemplate: false }))}
            />
            {errors.htmltemplate && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.htmltemplate}
                target="htmltemplate"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.htmltemplate}
              </Tooltip>
            )}
          </FormGroup>

          <FormGroup>
            <Label for="impression_tracking_url">Impression </Label>
            <Input
              type="text"
              id="impression_tracking_url"
              name="impression_tracking_url"
              value={formData.impression_tracking_url}
              onChange={handleChange}
              invalid={!!errors.impression_tracking_url}
              className="formscontrol"
             
            />
            {/* {errors.impression_tracking_url && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.impression_tracking_url}
                target="impression_tracking_url"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.impression_tracking_url}
              </Tooltip>
            )} */}
          </FormGroup>

          <FormGroup>
            <Label for="brand_name">Brand Domain <span className="valid">*</span></Label>
            <Input
              type="text"
              id="brand_name"
              name="brand_name"
              value={formData.brand_name}
              onChange={handleChange}
              invalid={!!errors.brand_name}
              className="formscontrol"
              onMouseEnter={() => errors.brand_name && setTooltipOpen((t) => ({ ...t, brand_name: true }))}
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brand_name: false }))}
            />
            {errors.brand_name && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.brand_name}
                target="brand_name"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.brand_name}
              </Tooltip>
            )}
          </FormGroup>


          {/* <Col md="12">
            <Label for="brand_name">Brand Categories <span className="valid">*</span></Label>
            <Button
              color=""
              size="md"
              className={`w-100 choose ${errors.brandCategory ? 'border-danger' : ''}`}
              onClick={() => setBrandCategoryModalOpen((prev) => !prev)}
              innerRef={brandCategoriesBtnRef}
              onMouseEnter={() => errors.brandCategory && setTooltipOpen((t) => ({ ...t, brandCategory: true }))}
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brandCategory: false }))}
            >
              Choose categories
            </Button>
            {selectedCountries.length > 0 && (
              <div className="mt-2 d-flex flex-wrap">
                {selectedCountries.map((item, index) => (
                  <span key={index} className="country-tag me-2 mb-1 reportenable">
                    {item}
                    <span
                      className="remove-tag ms-1"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedCountries(
                          selectedCountries.filter((c) => c !== item)
                        )
                      }
                    >
                      ×
                    </span>
                  </span>
                ))}
              </div>
            )}
            {errors.brandCategory && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.brandCategory}
                target={brandCategoriesBtnRef}
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.brandCategory}
              </Tooltip>
            )}
            <BrandcategoriesModal
              modalOpen={brandcategoryModalOpen}
              toggleModal={() => setBrandCategoryModalOpen((prev) => !prev)}
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
            />
          </Col> */}
        </>
      );
    }

    if (activeTab === "Goals") {
      return (
        <>
          <label className="vast-events-title">Vast Events</label>

          <Button
            color="success"
            size="sm"
            className="mb-3 add-track-btn d-flex align-items-center"
            onClick={addTrackingRow}
          >
            <FaPlus size={13} />
            &nbsp;&nbsp; Add Tracking URL
          </Button>

          <div className="table-responsive vast-table-wrapper">
            <Table bordered striped className="m-0 vast-table">
              <thead>
                <tr>
                  <th className="vast-header">Tracking URL</th>
                  <th className="vast-header">Event Type</th>
                  <th className="vast-header vastwd"></th>
                </tr>
              </thead>

              <tbody className="vast-body">
                {trackingEvents.map((row, index) => (
                  <tr
                    key={index}
                    className={`vast-row ${activeRow === index ? "" : ""}border-0`}
                    onClick={() => setActiveRow(index)}
                  >
                    <td className="vast-cell">
                      <span
                        className="track-input"
                        contentEditable
                        suppressContentEditableWarning
                        onClick={(e) => e.stopPropagation()}
                      >
                        <em>Enter a Tracking URL</em>
                      </span>
                    </td>

                    <td className="">
                      <div
                        className="position-relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="form-control rounded-0 track-select d-flex justify-content-between align-items-center"
                          onClick={() =>
                            setOpenTypeIndex(
                              openTypeIndex === index ? null : index
                            )
                          }
                          tabIndex={0}
                        >
                          <span className="audio-option">{row.type || "Select Event"}</span>
                          <FaCaretDown
                            className={`custom-select-icon ${openTypeIndex === index ? "open" : ""
                              }`}
                          />
                        </div>

                        {openTypeIndex === index && (
                          <div className="custom-dropdown-menu">
                            {[
                              "Click Tracking",
                              "Start",
                              "First Quartile",
                              "Midpoint",
                              "Third Quartile",
                              "Complete",
                            ].map((opt, i) => {
                              const isSelected = row.type === opt;
                              return (
                                <div
                                  key={i}
                                  className={`custom-dropdown-option ${isSelected ? "selected" : ""
                                    }`}
                                  onClick={() => {
                                    updateTrackingRow(index, "type", opt);
                                    setOpenTypeIndex(null);
                                  }}
                                >
                                  <span className="tick-icon">
                                    {isSelected && "✓"}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="text-center vast-remove">
                      <Button
                        close
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrackingRow(index);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      );
    }

    if (activeTab === "Ad") {
      return (
        <>
          <FormGroup>
            <Label for="image">
              Upload Image <span className="valid">*</span>
            </Label>
            <Input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              invalid={!!errors.image}
              className="formscontrol"
              onMouseEnter={() =>
                errors.image && setTooltipOpen((t) => ({ ...t, image: true }))
              }
              onMouseLeave={() =>
                setTooltipOpen((t) => ({ ...t, image: false }))
              }
            />
            <span className=" ">
              <IoMdInformationCircle
                id="locationInfoIcon"
                size={20}
                className="info-icon ms-1"
              />
              <UncontrolledTooltip
                placement="top"
                target="locationInfoIcon"
                className="black-tooltip"
              >
                Target only impressions where the mobile advertising ID or DSP cookie ID is available in the bid request.
              </UncontrolledTooltip>
            </span>
            <span className="audiomodal-filesize">Hover for max file size, type, and supported image dimensions.</span>
            {isUploading && (
              <div className="progress mt-2 edvideo-h">
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            )}
            {errors.image && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.image}
                target="image"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.image}
              </Tooltip>
            )}
          </FormGroup>

          <FormGroup>
            <Label for="destination_url">
              Destination URL <span className="valid">*</span>
            </Label>
            <Input
              type="text"
              id="destination_url"
              name="destination_url"
              invalid={!!errors.destination_url}
              className="formscontrol"
              onMouseEnter={() =>
                errors.destination_url &&
                setTooltipOpen((t) => ({ ...t, destination_url: true }))
              }
              onMouseLeave={() =>
                setTooltipOpen((t) => ({ ...t, destination_url: false }))
              }
            />
            {errors.destination_url && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.destination_url}
                target="destination_url"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.destination_url}
              </Tooltip>
            )}
          </FormGroup>

          <FormGroup>
            <Label for="impression_tracking_url">
              Impression Tracking URL <span className="valid">*</span>
            </Label>
            {impurlinputcount?.map((item, index) => {
              return (
                <div key={item.id}>
                  <Row className="align-items-center">
                    <Col xs={impurlinputcount.length > 1 ? 11 : 12}>
                      <Input
                        value={item.value}
                        type="text"
                        id="impression_tracking_url"
                        name="impression_tracking_url"
                        onChange={(e) => {
                          setimpurlinputcount(prev =>
                            prev.map(row =>
                              row.id === item.id
                                ? { ...row, value: e.target.value }
                                : row
                            )
                          );
                        }}
                        invalid={!!errors.impression_tracking_url}
                        className="formscontrol mt-2"
                        onMouseEnter={() =>
                          errors.impression_tracking_url &&
                          setTooltipOpen((t) => ({ ...t, impression_tracking_url: true }))
                        }
                        onMouseLeave={() =>
                          setTooltipOpen((t) => ({
                            ...t,
                            impression_tracking_url: false,
                          }))
                        }
                      />
                    </Col>
                    <Col>
                      {impurlinputcount.length > 1 && (
                        <span onClick={() => setimpurlinputcountdelete(item.id)}>
                          <IoMdClose />
                        </span>
                      )}
                    </Col>
                  </Row>
                  {index === impurlinputcount.length - 1 && index !== 2 && (
                    <span className="audiomodal-filesize-blue" onClick={addimptrackurlinput}>
                      Add another image impression tracking URL
                    </span>
                  )}
                </div>
              );
            })}

            {errors.impression_tracking_url && (
              <Tooltip
                placement="bottom"
                isOpen={tooltipOpen.impression_tracking_url}
                target="impression_tracking_url"
                autohide={false}
                container=".modal-content"
                popperClassName="custom-tooltip"
              >
                <div className="one"></div>
                {errors.impression_tracking_url}
              </Tooltip>
            )}
          </FormGroup>
        </>
      );
    }

    return null;
  };

  const uploadAudio = async (e) => {
    const file = e.target.files[0];
    const MAX_SIZE = 3 * 1024 * 1024;
    const allowedTypes = ["audio/mpeg"];

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        await Swal.fire({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="${videoErrorIcon}" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Error</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
              Only MP3 files are allowed.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
        e.target.value = "";
        return;
      }

      if (file.size > MAX_SIZE) {
        await Swal.fire({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="${videoErrorIcon}" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Error</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
              Audio file must be less than 3 MB.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
        e.target.value = "";
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64WithPrefix = reader.result;
        setmyAudio({
          data: base64WithPrefix,
          contentType: file.type,
        });
        setFormData((prev) => ({
          ...prev,
          audio: base64WithPrefix,
          contenttype: file.type,
          audioFileName: file.name,
        }));

        setTimeout(() => {
          setIsUploading(false);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTrackingRow = () => {
    setTrackingEvents([...trackingEvents, { url: "", type: "Click Tracking" }]);
  };

  const updateTrackingRow = (index, field, value) => {
    const updated = [...trackingEvents];
    updated[index][field] = value;
    setTrackingEvents(updated);
  };

  const removeTrackingRow = (index) => {
    setTrackingEvents(trackingEvents.filter((_, i) => i !== index));
  };

  const setimpurlinputcountdelete = (rowindex) => {
    console.log(rowindex);
    setimpurlinputcount(prev =>
      prev.length > 1
        ? prev.filter((pre, index) => pre.id !== rowindex)
        : prev
    );
  };

  const addimptrackurlinput = () => {
    setimpurlinputcount(prev =>
      prev.length < 3
        ? [...prev, { id: Date.now(), value: "" }]
        : prev
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle} centered id="audiomodal" size="lg" backdrop="static" keyboard={false}>
        <Form onSubmit={addNewvideo} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" className="profile-image-edvideo" />
            </div>
          )}

          <Row className="gx-0">
            <Col md="12">
              <div className="modal-header border-bottom">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6">
                    <h5 className="modal-title mb-0">
                      {formData.id ? `Edit Video Ad: ${formData.name}` : 'Create Video Ad'}
                    </h5>
                  </Col>
                  <Col md="6" className="text-end">
                    <Button close onClick={toggle}></Button>
                  </Col>
                </Row>
              </div>
              <div className="d-flex border-bottom ps-3 pt-0">
                <div
                  onClick={() => setActiveTab("Details")}
                  className="activetabdetalis"
                  style={{
                    color: activeTab === "Details" ? "#4d4d4d" : "#4d4d4d",
                    borderBottom:
                      activeTab === "Details" ? "2px solid #4d4d4d" : "none",
                  }}
                >
                  General
                </div>
                <div
                  onClick={() => setActiveTab("Goals")}
                  className="activetabdetalis"
                  style={{
                    color: activeTab === "Goals" ? "#4d4d4d" : "#4d4d4d",
                    borderBottom:
                      activeTab === "Goals" ? "2px solid #4d4d4d" : "none",
                  }}
                >
                  Event Tracking URL
                </div>
                <div
                  onClick={() => setActiveTab("Ad")}
                  className="activetabdetalis"
                  style={{
                    color: activeTab === "Ad" ? "#4d4d4d" : "#4d4d4d",
                    borderBottom:
                      activeTab === "Ad" ? "2px solid #4d4d4d" : "none",
                  }}
                >
                  Companion Ad
                </div>
              </div>

              <ModalBody className="pt-3 modal-body-scroll">
                {renderTabContent()}
              </ModalBody>

              <ModalFooter>
                <Button className="cancels" onClick={toggle}>
                  Cancel
                </Button>
                {((formData.id && creativeUpdateUser) || (!formData.id && creativeCreateUser)) && (
                  <Button type="submit" className="savebuttons">
                    {formData.id ? "Update Ad" : "Create Ad"}
                  </Button>
                )}
              </ModalFooter>
            </Col>
          </Row>
        </Form>
      </Modal>

      {isUploading && (
        <div className="loading">
          <Spinner color="primary" className="icon-box-edvideo" />
        </div>
      )}
    </>
  );
};

export default VideoModaleditor;
