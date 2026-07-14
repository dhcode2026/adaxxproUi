import React, { useState, useEffect, useRef } from "react";
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
} from "reactstrap";
import { useViewContext } from "../../ViewContext";
import AudioEditor from "../../../src/views/editors/AudioEditor";
import Swal from "sweetalert2";
import BrandcategoriesModal from "./BrandcategoriesModal.jsx";
import { FaPlus } from "react-icons/fa";
import { FaCaretDown } from "react-icons/fa";
import { IoMdClose, IoMdInformationCircle } from "react-icons/io";
import { saveCreatives, getAllCreativeAttribute } from "../../views/api/Api.jsx";

const AudioModal = ({ isOpen, toggle, audio: initialAudio, callback, brand_id: propBrandId }) => {
  const [impurlinputcount, setimpurlinputcount] = useState([
    { id: crypto.randomUUID(), value: "" }
  ]);
  const effectiveBrandId = initialAudio?.brand_id || propBrandId || "";
  const [rawAudioBase64, setRawAudioBase64] = useState("");
  const defaultFormData = {
    id: "",
    name: "",
    destination_url: "",
    impression_tracking_url: "",
    brand_name: "",
    audio_url: "",
    audio_upload: "upload",
    position: "",
    audio_duration: "",
    contenttype: "",
    bid_ecpm: 0,
    status: "",
    htmltemplate: "",
    audio: "",
    creative_attribute: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    const extractBase64 = (audioData) => {
      if (typeof audioData === 'string' && audioData.startsWith('data:')) {
        const parts = audioData.split(',');
        return parts.length > 1 ? parts[1] : '';
      }
      return '';
    };

    if (initialAudio) {
      const rawBase64 = extractBase64(initialAudio.audio);
      setRawAudioBase64(rawBase64);
      setFormData({
        id: initialAudio.id || '',
        name: initialAudio.name || '',
        destination_url: initialAudio.destinationUrl || '',
        impression_tracking_url: initialAudio.impressionTrackingUrl || '',
        brand_name: initialAudio.brandName || '',
        audio_url: initialAudio.audio_url || '',
        audio_upload: initialAudio.audio_upload || 'upload',
        position: initialAudio.position || '',
        audio_duration: initialAudio.audioDuration || '',
        contenttype: initialAudio.contenttype || '',
        bid_ecpm: initialAudio.bid_ecpm || 0,
        status: initialAudio.status || '',
        htmltemplate: initialAudio.htmltemplate || '',
        audio: initialAudio.audio || '',
        creative_attribute: initialAudio.creative_attribute || '',
      });
      if (initialAudio.audio) {
        setmyAudio({
          data: initialAudio.audio,
          contentType: initialAudio.contenttype || 'audio/mpeg',
        });
      } else {
        setmyAudio(null);
      }

      setIsUploading(false);
    } else {
      setFormData(defaultFormData);
      setRawAudioBase64('');
      setmyAudio(null);
      setIsUploading(false);
    }
  }, [initialAudio, propBrandId]);

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

  const infoRef = useRef(null);
  const [creative, setCreative] = useState({ isAudio: true });
  const [errors, setErrors] = useState({});
  const [html, setHtml] = useState("");
  const context = useViewContext();
  const [isLoading, setIsLoading] = useState(false);
  const [myAudio, setmyAudio] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [activeRow, setActiveRow] = useState(null);
  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const togglebrandcategoryModal = () => {
    setBrandCategoryModalOpen((prev) => !prev);
  };
  const [selectedCountries, setSelectedCountries] = useState([]);
  const positionRef = useRef(null);
  const positionPortalRef = useRef(null);
  const creativeAttributeRef = useRef(null);
  const creativeAttributePortalRef = useRef(null);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
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

  const [openTypeIndex, setOpenTypeIndex] = useState(null);

  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    banner_size: false,
    audio_upload: false,
    audio: false,
    audio_url: false,
    brand_name: false,
    destination_url: false,
    impression_tracking_url: false,
    brandCategory: false,
    creative_attribute: false,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
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
      setErrors({ ...errors, position: "" });
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

  const getAudioDuration = (file) => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';

      const url = URL.createObjectURL(file);
      audio.src = url;

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      };
    });
  };

  const uploadAudio = async (e) => {
    const file = e.target.files[0];
    const MAX_SIZE = 3 * 1024 * 1024;
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/x-m4a",
      "audio/m4a"
    ];

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        await Swal.fire({
          html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Error</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Only MP3 and MP4 audio files are allowed.
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
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
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
        const parts = base64WithPrefix.split(',');
        const rawBase64 = parts.length > 1 ? parts[1] : '';
        setRawAudioBase64(rawBase64);
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
      try {
        const duration = await getAudioDuration(file);
        const durationStr = `${Math.round(duration)}`;
        setFormData((prev) => ({
          ...prev,
          audio_duration: durationStr,
        }));
      } catch (error) {
        console.error("Could not get audio duration:", error);
      }
    }
  };

  const handleOptionChange = (e) => {
    setFormData({
      ...formData,
      audio_upload: e.target.value,
    });
    if (e.target.value === "url") {
      setRawAudioBase64("");
    }
  };

  const showValidationError = async (messages) => {
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
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 300,
      padding: 10,
    });
  };

  const audiovalidateForm = async () => {
    const newErrors = {};
    let isValid = true;
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
    if (formData.audio_upload === "upload") {
      if (!rawAudioBase64) {
        newErrors.audio = "This field is required";
        isValid = false;
      }
    }
    if (formData.audio_upload === "url") {
      if (!formData.audio_url?.trim()) {
        newErrors.audio_url = "This field is required";
        isValid = false;
      }
    }
    if (!formData.brand_name.trim()) {
      newErrors.brand_name = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.brand_name.trim())) {
      newErrors.brand_name =
        "Please enter a valid URL (e.g., http://example.com)";
      isValid = false;
    }
    if (!formData.impression_tracking_url.trim()) {
      newErrors.impression_tracking_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.impression_tracking_url.trim())) {
      newErrors.impression_tracking_url =
        "Please enter a valid Impression URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }
    // Brand Categories validation
    if (selectedCountries.length === 0) {
      newErrors.brandCategory = "At least one brand category is required";
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      await showValidationError(Object.values(newErrors));
    }

    return isValid;
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const resetForm = () => {
    setFormData(defaultFormData);
    setRawAudioBase64("");
    setmyAudio(null);
    setSelectedCountries([]);
    setErrors({});
    setTrackingEvents([{ url: "", type: "Click Tracking" }]);
    setimpurlinputcount([{ id: crypto.randomUUID(), value: "" }]);
    setActiveTab("Details");
    setActiveRow(null);
    setOpenTypeIndex(null);
  };

  const addNewaudio = async (e) => {
    e.preventDefault();

    const isValid = await audiovalidateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save this Audio?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await audioSubmit();

      await delay(1000);

      if (response.error) {
        Swal.fire(
          "Error!",
          response.message || "Something went wrong.",
          "error"
        );
      } else {
        Swal.fire("Saved!", "Audio has been created.", "success");
        resetForm();
        if (callback) callback(response.data);
        toggle();
      }
    } catch (error) {
      Swal.fire("Error!", "Unexpected error occurred.", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const audioSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        type: "audio",
        audio: formData.audio_upload === "upload" ? rawAudioBase64 : formData.audio_url,
        destinationUrl: formData.destination_url,
        impressionTrackingUrl: formData.impression_tracking_url,
        audioUpload: formData.audio_upload,
        audioUrl: formData.audio_url,
        position: formData.position,
        brandName: formData.brand_name,
        audioDuration: parseInt(formData.audio_duration, 10) || 0,
        contenttype: formData.contenttype,
        bid_ecpm: parseFloat(formData.bid_ecpm) || 0,
        status: formData.status,
        htmltemplate: formData.htmltemplate,
        brandCategory: selectedCountries,
        creativeAttributes: parseInt(formData.creative_attribute || 0),
      };
      if (initialAudio?.creativesId) {
        payload.creativesId = initialAudio.creativesId;
      }
      console.log("Submitting audio with payload:", payload);
      const response = await saveCreatives(effectiveBrandId, payload);
      if (response.status === 200 || response.status === 201) {
        return { error: false, data: response.data };
      } else {
        return { error: true, message: "Failed to create audio." };
      }
    } catch (err) {
      console.error("audioSubmit error:", err);
      return {
        error: true,
        message: err.response?.data?.message || "Unexpected error during submission.",
      };
    }
  };

  const getSelectedCampaign = () => {
    const items = [
      <option key="target-none" value="">
        -- Select Campaign --
      </option>,
    ];
    for (let i = 0; i < context.campaigns.length; i++) {
      const x = context.campaigns[i];
      items.push(
        <option key={`target-${i}`} value={x.id}>
          {x.name}
        </option>
      );
    }
    return items;
  };

  const [trackingEvents, setTrackingEvents] = useState([
    { url: "", type: "Click Tracking" },
  ]);

  const addTrackingRow = () => {
    setTrackingEvents([...trackingEvents, { url: "", type: "Click Tracking" }]);
  };

  const removeTrackingRow = (index) => {
    setTrackingEvents(trackingEvents.filter((_, i) => i !== index));
  };

  const updateTrackingRow = (index, field, value) => {
    const updated = [...trackingEvents];
    updated[index][field] = value;
    setTrackingEvents(updated);
  };

  const addimptrackurlinput = () => {
    setimpurlinputcount(prev =>
      prev.length < 3
        ? [...prev, { id: Date.now(), value: "" }]
        : prev
    );
  };

  const setimpurlinputcountdelete = (rowindex) => {
    console.log(rowindex)
    setimpurlinputcount(prev =>
      prev.length > 1
        ? prev.filter((pre, index) => pre.id !== rowindex)
        : prev
    );
  };

  useEffect(() => {
    if (selectedCountries.length > 0 && errors.brandCategory) {
      setErrors((prev) => ({ ...prev, brandCategory: null }));
      setTooltipOpen((prev) => ({ ...prev, brandCategory: false }));
    }
  }, [selectedCountries]);

  const renderTabContent = () => {
    if (activeTab === "Details") {
      return (
        <>
          <Row>
            <Col md="12">
              <FormGroup>
                <Label for="name">
                  Name <span className="valid">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  invalid={!!errors.name}
                  className="formscontrol"
                  onMouseEnter={() =>
                    errors.name && setTooltipOpen((t) => ({ ...t, name: true }))
                  }
                  onMouseLeave={() =>
                    setTooltipOpen((t) => ({ ...t, name: false }))
                  }
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
            <Col md="12">
              <FormGroup>
                <Label for="List_type">Choose Option</Label>
                <br />
                <Input
                  type="radio"
                  id="upload"
                  name="uploadOption"
                  value="upload"
                  checked={formData.audio_upload === "upload"}
                  onChange={handleOptionChange}
                  className="mt-1 me-1"
                />
                <Label className="me-4" htmlFor="upload">
                  Upload Audio
                </Label>

                <Input
                  type="radio"
                  id="url"
                  name="uploadOption"
                  value="url"
                  checked={formData.audio_upload === "url"}
                  onChange={handleOptionChange}
                  className="mt-1 me-1"
                />
                <Label htmlFor="url">Audio URL</Label>
              </FormGroup>
            </Col>
          </Row>

          {/* Upload Audio */}
          {formData.audio_upload === "upload" && (
            <FormGroup>
              <Label for="audio">
                Upload Audio <span className="valid">*</span>
              </Label>
              <Input
                type="file"
                id="audio"
                accept="audio/*"
                invalid={!!errors.audio}
                onChange={uploadAudio}
                className="formscontrol"
                onMouseEnter={() =>
                  errors.audio && setTooltipOpen((t) => ({ ...t, audio: true }))
                }
                onMouseLeave={() =>
                  setTooltipOpen((t) => ({ ...t, audio: false }))
                }
              />
              {errors.audio && (
                <Tooltip
                  placement="bottom"
                  isOpen={tooltipOpen.audio}
                  target="audio"
                  autohide={false}
                  container=".modal-content"
                  popperClassName="custom-tooltip"
                >
                  <div className="one"></div>
                  {errors.audio}
                </Tooltip>
              )}
            </FormGroup>
          )}
          {formData.audio_upload === "url" && (
            <FormGroup>
              <Label for="audio_url">
                Audio URL <span className="valid">*</span>
              </Label>
              <Input
                type="text"
                id="audio_url"
                name="audio_url"
                value={formData.audio_url}
                onChange={handleChange}
                invalid={!!errors.audio_url}
                className="formscontrol"
                onMouseEnter={() =>
                  errors.audio_url &&
                  setTooltipOpen((t) => ({ ...t, audio_url: true }))
                }
                onMouseLeave={() =>
                  setTooltipOpen((t) => ({ ...t, audio_url: false }))
                }
              />

              {errors.audio_url && (
                <Tooltip
                  placement="bottom"
                  isOpen={tooltipOpen.audio_url}
                  target="audio_url"
                  autohide={false}
                  container=".modal-content"
                  popperClassName="custom-tooltip"
                >
                  <div className="one"></div>
                  {errors.audio_url}
                </Tooltip>
              )}
            </FormGroup>
          )}
          <FormGroup>
            <Label for="impression_tracking_url">
              Impression Tracking URL <span className="valid">*</span>
            </Label>
            <Input
              type="text"
              id="impression_tracking_url"
              name="impression_tracking_url"
              value={formData.impression_tracking_url}
              onChange={handleChange}
              invalid={!!errors.impression_tracking_url}
              className="formscontrol"
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
          <FormGroup>
            <Label for="destination_url">
              Click URL <span className="valid">*</span>
            </Label>
            <Input
              type="text"
              id="destination_url"
              name="destination_url"
              value={formData.destination_url}
              onChange={handleChange}
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
            <Label for="position">Position</Label>
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
                className="campaign-select-input"
                style={{
                  height: "38px",
                  minHeight: "38px",
                  borderRadius: "13px",
                  padding: "10px 34px 10px 12px",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                  color: formData.position ? "#0f172a" : "#64748b",
                }}
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
                        <span className="tick-icon" style={{ width: "14px" }}>
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
                className="campaign-select-input"
                style={{
                  height: "38px",
                  minHeight: "38px",
                  borderRadius: "13px",
                  padding: "10px 34px 10px 12px",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                  color: formData.creative_attribute ? "#0f172a" : "#64748b",
                }}
                invalid={!!errors.creative_attribute}
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
                    <span className="tick-icon" style={{ width: "14px" }}></span>
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
                          <span className="tick-icon" style={{ width: "14px" }}>{isSelected && "✓"}</span>
                          <span>{attribute.name}</span>
                        </div>
                      );
                    })
                  )}
                </div>,
                document.body,
              )}
          </FormGroup>

          {/* Brand Domain */}
          <FormGroup>
            <Label for="brand_name" className="d-flex align-items-center">
              Brand Domain <span className="valid">*</span>
            </Label>

            <Input
              type="text"
              id="brand_name"
              name="brand_name"
              value={formData.brand_name}
              onChange={handleChange}
              invalid={!!errors.brand_name}
              className="formscontrol"
              onMouseEnter={() =>
                errors.brand_name &&
                setTooltipOpen((t) => ({ ...t, brand_name: true }))
              }
              onMouseLeave={() =>
                setTooltipOpen((t) => ({ ...t, brand_name: false }))
              }
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

          <Col md="12">
            <Label for="brand_name">Brand Categories <span className="valid">*</span></Label>
            <Button
              color=""
              size="md"
              className={`w-100 choose ${errors.brandCategory ? 'border-danger' : ''}`}
              onClick={togglebrandcategoryModal}
              id="brand-categories-btn"
              onMouseEnter={() => errors.brandCategory && setTooltipOpen((t) => ({ ...t, brandCategory: true }))}
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brandCategory: false }))}
            >
              Choose categories
            </Button>
            {selectedCountries.length > 0 && (
              <div className="mt-2 d-flex flex-wrap">
                {selectedCountries.map((item, index) => (
                  <span
                    key={index}
                    className="country-tag me-2 mb-1"
                  >
                    {item}
                    <span
                      className="remove-tag ms-1"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setSelectedCountries(selectedCountries.filter((c) => c !== item))
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
                target="brand-categories-btn"
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
              toggleModal={togglebrandcategoryModal}
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
            />
          </Col>
          <Row>
            {creative.isAudio && (
              <AudioEditor
                key={`audio-creative-${creative.id}`}
                creative={creative}
                callback={setHtml}
              />
            )}
          </Row>
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
                        <em>  Enter a Tracking URL </em>
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
              <div className="progress mt-2" style={{ height: "6px" }}>
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
                <div className="">
                  <Row className="align-items-center">
                    <Col xs={impurlinputcount.length > 1 ? 11 : 12}>
                      <Input
                        key={item.id}
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
                      {impurlinputcount.length > 1 && (<span onClick={() => (setimpurlinputcountdelete(item.id))}> <IoMdClose></IoMdClose> </span>)}
                    </Col>
                  </Row>
                  {(index == impurlinputcount.length - 1 && index != 2) && (<span className="audiomodal-filesize-blue" onClick={addimptrackurlinput}>Add another image impression tracking URL</span>)}
                </div>
              )
            })
            }
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        id="bannermodal"
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Form onSubmit={addNewaudio} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner
                color="primary"
                style={{ width: "4rem", height: "4rem" }}
              />
            </div>
          )}

          <Row className="gx-0">
            <Col md="6">
              <div className="bannering">
                {myAudio && (
                  <audio controls style={{ width: "100%" }}>
                    <source src={myAudio.data} type={myAudio.contentType} />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            </Col>

            <Col md="6">
              <div className="modal-header" id="audiomodalheader">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6">
                    <h5 className="modal-title mb-0">New Audio Ad</h5>
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
                    color: activeTab === "Ad" ? "#4d4d4d" : "4d4d4d",
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
                <Button
                  type="submit"
                  className="savebuttons"
                >
                  Create Ad
                </Button>
              </ModalFooter>
            </Col>
          </Row>
        </Form>
      </Modal>
      {isUploading && (
        <div className="loading">
          <Spinner color="primary" style={{ width: "3rem", height: "3rem" }} />
        </div>
      )}
    </>
  );
};

export default AudioModal;
