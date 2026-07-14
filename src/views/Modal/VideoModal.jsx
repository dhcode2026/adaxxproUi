import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from "react-dom";
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
import { useViewContext } from "../../ViewContext";
import Swal from 'sweetalert2';
import BrandcategoriesModal from "./BrandcategoriesModal.jsx";
import { FaPlus } from "react-icons/fa";
import { FaCaretDown } from "react-icons/fa";
import { IoMdClose, IoMdInformationCircle } from "react-icons/io";
import { saveCreatives,getAllCreativeAttribute } from "../../views/api/Api.jsx";

const VideoModal = ({ isOpen, toggle, video: initialVideo, callback, brand_id: propBrandId }) => {
  const [trackingEvents, setTrackingEvents] = useState([
    { url: "", type: "Click Tracking" },
  ]);
  const [activeRow, setActiveRow] = useState(null);
  const [openTypeIndex, setOpenTypeIndex] = useState(null);
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
    brandCategory: false,
    creative_attribute: false,
  });
  const [rawVideoBase64, setRawVideoBase64] = useState('');
  const [formData, setFormData] = useState({
    id: initialVideo?.id || '',
    carrier: initialVideo?.carrier || [],
    video_upload: initialVideo?.video_upload || 'upload',
    creative_attribute: initialVideo?.creative_attribute || '',
  });
  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const togglebrandcategoryModal = () => setBrandCategoryModalOpen(prev => !prev);
  const brandCategoriesBtnRef = useRef(null);
  const positionRef = useRef(null);
  const positionPortalRef = useRef(null);
  const creativeAttributeRef = useRef(null);
  const creativeAttributePortalRef = useRef(null);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [creativeAttributes, setCreativeAttributes] = useState([]);
  const [isPositionOpen, setIsPositionOpen] = useState(false);
  const [isCreativeAttributeOpen, setIsCreativeAttributeOpen] = useState(false);
  const [positionDropdownPosition, setPositionDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [creativeAttributeDropdownPosition, setCreativeAttributeDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    if (initialVideo) {
      let rawBase64 = '';
      if (initialVideo.video && typeof initialVideo.video === 'string' && initialVideo.video.startsWith('data:')) {
        const parts = initialVideo.video.split(',');
        if (parts.length > 1) {
          rawBase64 = parts[1];
        }
      }
      setRawVideoBase64(rawBase64);
      setFormData({
        id: initialVideo.id || '',
        name: initialVideo.name || '',
        video: initialVideo.video || '',
        impression_tracking_url: initialVideo.impression_tracking_url || '',
        destination_url: initialVideo.destination_url || '',
        brand_name: initialVideo.brand_name || '',
        banner_size: initialVideo.banner_size || '',
        video_url: initialVideo.video_url || '',
        video_upload: initialVideo.video_upload || 'upload',
        contenttype: initialVideo.contenttype || '',
        position: initialVideo.position || '',
        carrier: initialVideo.carrier || [],
        brand_id: initialVideo.brand_id || propBrandId || "",
        htmltemplate: initialVideo.htmltemplate || '',
        vastVideoDuration: initialVideo.vastVideoDuration || '',
        bid_ecpm: initialVideo.bid_ecpm || '0',
        status: initialVideo.status || '0',
        width: initialVideo.width || '',
        height: initialVideo.height || '',
        vast_video_protocol: initialVideo.vast_video_protocol || '',
        mime_type: initialVideo.mime_type || '',
        vast_video_bitrate: initialVideo.vast_video_bitrate || '',
        vast_video_linearity: initialVideo.vast_video_linearity || '',
        videoFileName: initialVideo.videoFileName || '',
        creative_attribute: initialVideo.creative_attribute || '',
      });
      setUploadedVideo(initialVideo.video || null);
      setVideo(initialVideo);
    }
  }, [initialVideo, propBrandId]);

  useEffect(() => {
    if (isOpen) {
      fetchCreativeAttributes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsPositionOpen(false);
      setIsCreativeAttributeOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCountries.length > 0 && errors.brandCategory) {
      setErrors(prev => ({ ...prev, brandCategory: null }));
      setTooltipOpen(prev => ({ ...prev, brandCategory: false }));
    }
  }, [selectedCountries]);

  const [creative, setCreative] = useState({ isVideo: true });
  const [html, setHtml] = useState('');
  const [errors, setErrors] = useState({});
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [video, setVideo] = useState();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
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

  const positionOptions = [
    { value: "", label: "Select Position" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" },
    { value: "top", label: "Top" },
    { value: "bottom", label: "Bottom" },
  ];

  const selectedPosition = positionOptions.find(
    (opt) => opt.value === String(formData.position || ""),
  );
  const positionDisplayValue = selectedPosition?.label || "Select Position";

  const handlePositionSelect = (value) => {
    setFormData({ ...formData, position: value });
    if (errors.position) {
      setErrors({ ...errors, position: '' });
    }
  };

  const handleCreativeAttributeSelect = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      creative_attribute: value,
    }));

    if (errors.creative_attribute) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        creative_attribute: null,
      }));
    }
  };

  const selectedCreativeAttribute = creativeAttributes.find(
    (attr) => attr.creativeAttributeId.toString() === String(formData.creative_attribute),
  );
  const creativeAttributeDisplayValue = loadingAttributes
    ? "Loading attributes..."
    : selectedCreativeAttribute
      ? selectedCreativeAttribute.name
      : "-- Select Creative Attribute --";

  useEffect(() => {
    if (!isPositionOpen) return;

    const updatePosition = () => {
      if (!positionRef.current) return;
      const rect = positionRef.current.getBoundingClientRect();
      setPositionDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const wrapperNode = positionRef.current;
      const portalNode = positionPortalRef.current;

      if (wrapperNode && wrapperNode.contains(event.target)) return;
      if (portalNode && portalNode.contains(event.target)) return;
      setIsPositionOpen(false);
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
  }, [isPositionOpen]);

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

  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const url = URL.createObjectURL(file);
      video.src = url;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
    });
  };
  const uploadVideo = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSizeMB = 500;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        await Swal.fire({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Error</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
              Video file must be less than ${maxSizeMB} MB.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
        setFormData(prev => ({ ...prev, video: "", contenttype: "" }));
        setRawVideoBase64('');
        setUploadedVideo(null);
        e.target.value = "";
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64WithPrefix = reader.result;
        const parts = base64WithPrefix.split(',');
        const rawBase64 = parts.length > 1 ? parts[1] : '';
        setRawVideoBase64(rawBase64);
        setUploadedVideo(base64WithPrefix);
        setFormData(prev => ({
          ...prev,
          video: base64WithPrefix,
          videoFileName: file.name,
          contenttype: file.type,
        }));
        setErrors(prev => ({ ...prev, video: "" }));
        setTimeout(() => setIsUploading(false), 1000);
      };
      reader.readAsDataURL(file);
      try {
        const duration = await getVideoDuration(file);
        setFormData(prev => ({ ...prev, vastVideoDuration: `${Math.round(duration)}` }));
      } catch (error) {
        console.error("Could not get video duration:", error);
      }
    }
  };

  const handleOptionChange = (e) => {
    setFormData({ ...formData, video_upload: e.target.value });
    if (e.target.value === "url") {
      setRawVideoBase64('');
    }
  };

  const showValidationError = async () => {
    await Swal.fire({
      html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
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

  const videovalidateForm = async () => {
    const newErrors = {};
    let isValid = true;

    const domainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    const urlRegex = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/\S*)?$/;
    if (!formData.name?.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }
    if (!formData.destination_url?.trim()) {
      newErrors.destination_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.destination_url.trim())) {
      newErrors.destination_url = "Please enter a valid Click URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }

    if (formData.video_upload === "upload") {
      if (!rawVideoBase64) {
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

    if (!formData.brand_name?.trim()) {
      newErrors.brand_name = "This field is required";
      isValid = false;
    } else if (!domainRegex.test(formData.brand_name.trim())) {
      newErrors.brand_name = "Please enter a valid domain (e.g., http://example.com)";
      isValid = false;
    }
    setErrors(newErrors);

    if (!isValid) {
      await showValidationError();
    }

    return isValid;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      video: '',
      impression_tracking_url: '',
      destination_url: '',
      brand_name: '',
      banner_size: '',
      video_url: '',
      video_upload: 'upload',
      contenttype: '',
      position: '',
      brand_id: effectiveBrandId,
      htmltemplate: '',
      vastVideoDuration: '',
      bid_ecpm: '0',
      status: '0',
      width: '',
      height: '',
      vast_video_protocol: '',
      mime_type: '',
      vast_video_bitrate: '',
      vast_video_linearity: '',
      videoFileName: '',
      creative_attribute: '',
    });
    setRawVideoBase64('');
    setUploadedVideo(null);
    setSelectedCountries([]);
    setErrors({});
    setTrackingEvents([{ url: "", type: "Click Tracking" }]);
    setimpurlinputcount([{ id: crypto.randomUUID(), value: "" }]);
    setActiveTab("Details");
    setActiveRow(null);
    setOpenTypeIndex(null);
    setIsCreativeAttributeOpen(false);
  };

  const addNewvideo = async (e) => {
    e.preventDefault();
    const isValid = await videovalidateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to save this Video?',
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
        Swal.fire('Error!', response.message || 'Something went wrong.', 'error');
      } else {
        Swal.fire('Saved!', 'Video has been created.', 'success');
        resetForm();
        if (callback) callback(response.data);
        toggle();
      }
    } catch (error) {
      Swal.fire('Error!', 'Unexpected error occurred.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const videoSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        type: 'video',
        video: formData.video_upload === 'upload' ? rawVideoBase64 : formData.video,
        destinationUrl: formData.destination_url,
        impressionTrackingUrl: formData.impression_tracking_url,
        videoUpload: formData.video_upload,
        videoUrl: formData.video_url,
        position: formData.position,
        htmltemplate: formData.htmltemplate,
        brandName: formData.brand_name,
        contenttype: formData.contenttype,
        bid_ecpm: parseFloat(formData.bid_ecpm) || 0,
        status: formData.status,
        vastVideoDuration: formData.vastVideoDuration,
        vast_video_protocol: formData.vast_video_protocol,
        mime_type: formData.mime_type,
        vast_video_bitrate: formData.vast_video_bitrate,
        vast_video_linearity: formData.vast_video_linearity,
        width: parseInt(formData.width, 10) || 0,
        height: parseInt(formData.height, 10) || 0,
        brandCategory: selectedCountries,
        creativeAttributes: parseInt(formData.creative_attribute || 0),
      };
      if (initialVideo?.creativesId) {
        payload.creativesId = initialVideo.creativesId;
      }
      const response = await saveCreatives(effectiveBrandId, payload);
      if (response.status === 200 || response.status === 201) {
        return { error: false, data: response.data };
      } else {
        return { error: true, message: 'Failed to create video.' };
      }
    } catch (err) {
      console.error('videoSubmit error:', err);
      return {
        error: true,
        message: err.response?.data?.message || 'Unexpected error during submission.',
      };
    }
  };

  const getSelectedCampaign = () => [
    <option key="target-none" value="">-- Select Campaign --</option>,
    ...vx.campaigns.map((x, i) => (
      <option key={`target-${i}`} value={x.id}>{x.name}</option>
    )),
  ];

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
    setimpurlinputcount(prev =>
      prev.length > 1 ? prev.filter(item => item.id !== rowindex) : prev
    );
  };

  const addimptrackurlinput = () => {
    setimpurlinputcount(prev =>
      prev.length < 3 ? [...prev, { id: Date.now(), value: "" }] : prev
    );
  };

    const fetchCreativeAttributes = async () => {
    setLoadingAttributes(true);
    try {
      const response = await getAllCreativeAttribute();
      if (response.data.status === 200) {
        setCreativeAttributes(response.data.data.informationCreativeAttributes || []);
      } else {
        console.error("Failed to fetch creative attributes");
      }
    } catch (error) {
      console.error("Error fetching creative attributes:", error);
    } finally {
      setLoadingAttributes(false);
    }
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
              value={formData.name || ''}
              onChange={handleChange}
              invalid={!!errors.name}
              className="formscontrol"
              onMouseEnter={() => errors.name && setTooltipOpen(t => ({ ...t, name: true }))}
              onMouseLeave={() => setTooltipOpen(t => ({ ...t, name: false }))}
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

          <Row>
            <Col md="12">
              <FormGroup>
                <Label>Choose Option</Label><br />
                <Input
                  type="radio"
                  id="upload"
                  name="uploadOption"
                  value="upload"
                  checked={formData.video_upload === 'upload'}
                  onChange={handleOptionChange}
                  className='mt-1 me-1'
                />
                <Label className='me-4' htmlFor="upload">Upload Video</Label>
                <Input
                  type="radio"
                  id="url"
                  name="uploadOption"
                  value="url"
                  checked={formData.video_upload === 'url'}
                  onChange={handleOptionChange}
                  className='mt-1 me-1'
                />
                <Label htmlFor="url">Video URL</Label>
              </FormGroup>
            </Col>
          </Row>

          {formData.video_upload === 'upload' && (
            <FormGroup>
              <Label for="video">Upload Video <span className="valid">*</span></Label>
              <Input
                type="file"
                id="video"
                name="video"
                accept="video/*"
                onChange={uploadVideo}
                invalid={!!errors.video}
                className="formscontrol"
                onMouseEnter={() => errors.video && setTooltipOpen(t => ({ ...t, video: true }))}
                onMouseLeave={() => setTooltipOpen(t => ({ ...t, video: false }))}
              />
              {errors.video && (
                <Tooltip
                  placement="bottom"
                  isOpen={tooltipOpen.video}
                  target="video"
                  autohide={false}
                  container=".modal-content"
                  popperClassName="custom-tooltip"
                >
                  <div className="one"></div>
                  {errors.video}
                </Tooltip>
              )}
            </FormGroup>
          )}

          {formData.video_upload === 'url' && (
            <FormGroup>
              <Label for="video_url">Video URL <span className="valid">*</span></Label>
              <Input
                type="text"
                id="video_url"
                name="video_url"
                value={formData.video_url || ''}
                onChange={handleChange}
                invalid={!!errors.video_url}
                className="formscontrol"
                onMouseEnter={() => errors.video_url && setTooltipOpen(t => ({ ...t, video_url: true }))}
                onMouseLeave={() => setTooltipOpen(t => ({ ...t, video_url: false }))}
              />
              {errors.video_url && (
                <Tooltip
                  placement="bottom"
                  isOpen={tooltipOpen.video_url}
                  target="video_url"
                  autohide={false}
                  container=".modal-content"
                  popperClassName="custom-tooltip"
                >
                  <div className="one"></div>
                  {errors.video_url}
                </Tooltip>
              )}
            </FormGroup>
          )}

          <FormGroup>
            <Label for="destination_url">Click URL <span className="valid">*</span></Label>
            <Input
              type="text"
              id="destination_url"
              name="destination_url"
              value={formData.destination_url || ''}
              onChange={handleChange}
              invalid={!!errors.destination_url}
              className="formscontrol"
              onMouseEnter={() => errors.destination_url && setTooltipOpen(t => ({ ...t, destination_url: true }))}
              onMouseLeave={() => setTooltipOpen(t => ({ ...t, destination_url: false }))}
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
            <Label for="position">Position </Label>
            <div
              ref={positionRef}
              className="campaign-select-wrapper"
              style={{ position: "relative", width: "100%" }}
            >
              <Input
                id="position"
                name="position"
                type="text"
                readOnly
                value={positionDisplayValue}
                onClick={() => setIsPositionOpen((open) => !open)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsPositionOpen((open) => !open);
                  }
                }}
                className="campaign-select-input dropdown-input-edvideo"
              />
              <FaCaretDown
                className={`custom-select-icon campaign-select-icon ${isPositionOpen ? "open" : ""}`}
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
            {isPositionOpen &&
              typeof document !== "undefined" &&
              ReactDOM.createPortal(
                <div
                  ref={positionPortalRef}
                  className="custom-dropdown-menu biddeript-b"
                  style={{
                    position: "absolute",
                    top: `${positionDropdownPosition.top}px`,
                    left: `${positionDropdownPosition.left}px`,
                    zIndex: 9999,
                    minWidth: `${positionDropdownPosition.width || 120}px`,
                    width: `${positionDropdownPosition.width || 120}px`,
                    pointerEvents: "auto",
                  }}
                >
                  {positionOptions.map((opt) => {
                    const isSelected = String(formData.position || "") === opt.value;
                    return (
                      <div
                        key={opt.value || "default"}
                        onClick={() => {
                          handlePositionSelect(opt.value);
                          setIsPositionOpen(false);
                        }}
                        className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 10px",
                          cursor: "pointer",
                        }}
                      >
                        <span className="tick-icon editvideo-w">
                          {isSelected && "✓"}
                        </span>
                        <span>{opt.label}</span>
                      </div>
                    );
                  })}
                </div>,
                document.body,
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
                onMouseEnter={() => errors.creative_attribute && setTooltipOpen(t => ({ ...t, creative_attribute: true }))}
                onMouseLeave={() => setTooltipOpen(t => ({ ...t, creative_attribute: false }))}
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

          <FormGroup>
            <Label for="htmltemplate">Outgoing File</Label>
            <Input
              type="textarea"
              id="htmltemplate"
              name="htmltemplate"
              value={formData.htmltemplate || ''}
              onChange={handleChange}
              invalid={!!errors.htmltemplate}
              className="formscontrol"
              maxLength={300}
            />
          </FormGroup>

          <FormGroup>
            <Label for="impression_tracking_url">Impression </Label>
            <Input
              type="text"
              id="impression_tracking_url"
              name="impression_tracking_url"
              value={formData.impression_tracking_url || ''}
              onChange={handleChange}
              invalid={!!errors.impression_tracking_url}
              className="formscontrol"
            />
          
          </FormGroup>

          <FormGroup>
            <Label for="brand_name">Brand Domain <span className="valid">*</span></Label>
            <Input
              type="text"
              id="brand_name"
              name="brand_name"
              value={formData.brand_name || ''}
              onChange={handleChange}
              invalid={!!errors.brand_name}
              className="formscontrol"
              onMouseEnter={() => errors.brand_name && setTooltipOpen(t => ({ ...t, brand_name: true }))}
              onMouseLeave={() => setTooltipOpen(t => ({ ...t, brand_name: false }))}
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
            <FaPlus size={13} />&nbsp;&nbsp; Add Tracking URL
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
                  <tr key={index} className={`vast-row border-0`} onClick={() => setActiveRow(index)}>
                    <td className="vast-cell">
                      <span className="track-input" contentEditable suppressContentEditableWarning onClick={(e) => e.stopPropagation()}>
                        <em>Enter a Tracking URL</em>
                      </span>
                    </td>
                    <td>
                      <div className="position-relative" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="form-control rounded-0 track-select d-flex justify-content-between align-items-center"
                          onClick={() => setOpenTypeIndex(openTypeIndex === index ? null : index)}
                          tabIndex={0}
                        >
                          <span className="audio-option">{row.type || "Select Event"}</span>
                          <FaCaretDown className={`custom-select-icon ${openTypeIndex === index ? "open" : ""}`} />
                        </div>
                        {openTypeIndex === index && (
                          <div className="custom-dropdown-menu">
                            {["Click Tracking", "Start", "First Quartile", "Midpoint", "Third Quartile", "Complete"].map((opt, i) => {
                              const isSelected = row.type === opt;
                              return (
                                <div
                                  key={i}
                                  className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                  onClick={() => {
                                    updateTrackingRow(index, "type", opt);
                                    setOpenTypeIndex(null);
                                  }}
                                >
                                  <span className="tick-icon">{isSelected && "✓"}</span>
                                  <span>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center vast-remove">
                      <Button close className="remove-btn" onClick={(e) => { e.stopPropagation(); removeTrackingRow(index); }} />
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
            <Label for="image">Upload Image </Label>
            <Input
              type="file"
              id="image"
              name="image"
              accept="image/*"

              className="formscontrol"

            />
            <span>
              <IoMdInformationCircle id="locationInfoIcon" size={20} className="info-icon ms-1" />
              <UncontrolledTooltip placement="top" target="locationInfoIcon" className="black-tooltip">
                Target only impressions where the mobile advertising ID or DSP cookie ID is available in the bid request.
              </UncontrolledTooltip>
            </span>
            <span className="audiomodal-filesize">Hover for max file size, type, and supported image dimensions.</span>
            {isUploading && (
              <div className="progress mt-2" style={{ height: "6px" }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" />
              </div>
            )}

          </FormGroup>
          <FormGroup>
            <Label for="destination_url">Destination URL </Label>
            <Input
              type="text"
              id="destination_url"
              name="destination_url"

              className="formscontrol"

            />

          </FormGroup>
          <FormGroup>
            <Label for="impression_tracking_url">Impression Tracking URL </Label>
            {impurlinputcount.map((item, index) => (
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
                          prev.map(row => row.id === item.id ? { ...row, value: e.target.value } : row)
                        );
                      }}

                      className="formscontrol mt-2"
                      onMouseEnter={() => errors.impression_tracking_url && setTooltipOpen(t => ({ ...t, impression_tracking_url: true }))}
                      onMouseLeave={() => setTooltipOpen(t => ({ ...t, impression_tracking_url: false }))}
                    />
                  </Col>
                  <Col>
                    {impurlinputcount.length > 1 && (
                      <span onClick={() => setimpurlinputcountdelete(item.id)}><IoMdClose /></span>
                    )}
                  </Col>
                </Row>
                {index === impurlinputcount.length - 1 && index !== 2 && (
                  <span className="audiomodal-filesize-blue" onClick={addimptrackurlinput}>
                    Add another image impression tracking URL
                  </span>
                )}
              </div>
            ))}

          </FormGroup>
        </>
      );
    }
    return null;
  };
  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle} centered id="bannermodal" size="lg" backdrop="static" keyboard={false}>
        <Form onSubmit={addNewvideo} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}
          <Row className="gx-0">
            <Col md="6">
              <div className="bannering">
                {uploadedVideo ? (
                  <video src={uploadedVideo} controls style={{ maxHeight: '100%', width: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="text-center text-muted pt-5">No video uploaded</div>
                )}
              </div>
            </Col>
            <Col md="6">
              <div className="modal-header border-bottom">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6"><h5 className="modal-title mb-0">New Video Ad</h5></Col>
                  <Col md="6" className="text-end"><Button close onClick={toggle} /></Col>
                </Row>
              </div>
              <div className="d-flex border-bottom ps-3 pt-0">
                <div onClick={() => setActiveTab("Details")} className="activetabdetalis" style={{ borderBottom: activeTab === "Details" ? "2px solid #4d4d4d" : "none" }}>General</div>
                <div onClick={() => setActiveTab("Goals")} className="activetabdetalis" style={{ borderBottom: activeTab === "Goals" ? "2px solid #4d4d4d" : "none" }}>Event Tracking URL</div>
                <div onClick={() => setActiveTab("Ad")} className="activetabdetalis" style={{ borderBottom: activeTab === "Ad" ? "2px solid #4d4d4d" : "none" }}>Companion Ad</div>
              </div>
              <ModalBody className="pt-3 modal-body-scroll">{renderTabContent()}</ModalBody>
              <ModalFooter>
                <Button className="cancels" onClick={toggle}>Cancel</Button>
                <Button type="submit" className="savebuttons">Create Ad</Button>
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

export default VideoModal;
