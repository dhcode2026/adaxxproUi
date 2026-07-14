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
import { useViewContext } from "../../../ViewContext.jsx";
import Swal from "sweetalert2";
import { BannerPosition } from "../../../Utils.js";
import BrandcategoriesModal from "../BrandcategoriesModal.jsx";
import { FaPlus, FaCaretDown } from "react-icons/fa";
import { IoMdClose, IoMdInformationCircle } from "react-icons/io";
import { editcreatives, updatecreative, getAllCreativeAttribute } from "../../../views/api/Api.jsx";
import { canCreate, canUpdate} from "../../../utils/permissionHelper.js";


const AudioModaleditor = ({
  isOpen,
  toggle,
  audio: initialAudio,
  callback,
  brand_id: propBrandId,
}) => {
  const [impurlinputcount, setimpurlinputcount] = useState([
    { id: crypto.randomUUID(), value: "" },
  ]);
  const effectiveBrandId = initialAudio?.brand_id || propBrandId || "";
  const getCreativeId = (item) => item?.id || item?.creativesId || "";
  const [formData, setFormData] = useState({
    id: getCreativeId(initialAudio),
    name: initialAudio?.name || "",
    audio: initialAudio?.audio || "",
    destination_url: initialAudio?.destination_url || initialAudio?.destinationUrl || "",
    impression_tracking_url: initialAudio?.impression_tracking_url || initialAudio?.impressionTrackingUrl || "",
    brand_name: initialAudio?.brand_name || initialAudio?.brandName || "",
    audio_url: initialAudio?.audio_url || initialAudio?.audioUrl || "",
    bid_ecpm: initialAudio?.bid_ecpm || initialAudio?.bidEcpm || "0",
    htmltemplate: initialAudio?.htmltemplate || "dighir",
    status: initialAudio?.status || "0",
    audio_api: initialAudio?.audio_api || initialAudio?.audioApi || "2",
    contenttype: initialAudio?.contenttype || "",
    audio_upload: initialAudio?.audio_upload || initialAudio?.audioUpload || "upload",
    position: initialAudio?.position || "",
    audioFileName: initialAudio?.audioFileName || "",
    brand_id: effectiveBrandId,
    audio_duration: initialAudio?.audio_duration || initialAudio?.audioDuration || initialAudio?.duration || "",
    creative_attribute: initialAudio?.creative_attribute || initialAudio?.creativeAttributes || "",
  });
  const [errors, setErrors] = useState({});
  const context = useViewContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [activeRow, setActiveRow] = useState(null);
  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const brandCategoriesBtnRef = useRef(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [openTypeIndex, setOpenTypeIndex] = useState(null);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [creativeAttributes, setCreativeAttributes] = useState([]);
  const [isCreativeAttributeOpen, setIsCreativeAttributeOpen] = useState(false);
  const creativeAttributeRef = useRef(null);
  const creativeAttributePortalRef = useRef(null);
  const [creativeAttributeDropdownPosition, setCreativeAttributeDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isUploading, setIsUploading] = React.useState(false);
     const [creativeCreateUser, setcreativeCreateUser] = useState(false);
  const [creativeUpdateUser, setcreativeUpdateUser] = useState(false);

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
  const [creative] = useState({ isAudio: true });
  const [trackingEvents, setTrackingEvents] = useState([
    { url: "", type: "Click Tracking" },
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchCreativeAttributes();
    }
    if (isOpen && getCreativeId(initialAudio)) {
      fetchAudioDetails(getCreativeId(initialAudio));
    }
  }, [isOpen, initialAudio]);

  const fetchAudioDetails = async (id) => {
    setIsFetchingAudio(true);
    try {
      const response = await editcreatives(id);
      if (response.data?.status === 200 && response.data.data?.informationCreatives?.length > 0) {
        const audioData = response.data.data.informationCreatives[0];
        setFormData({
          id: audioData.creativesId,
          name: audioData.name || "",
          audio: audioData.audio || "",
          destination_url: audioData.destinationUrl || "",
          impression_tracking_url: audioData.impressionTrackingUrl || "",
          brand_name: audioData.brandName || "",
          audio_url: audioData.audioUrl || "",
          bid_ecpm: audioData.bidEcpm || "0",
          htmltemplate: audioData.htmltemplate || "dighir",
          status: audioData.status || "0",
          audio_api: audioData.audioApi || "2",
          contenttype: audioData.contenttype || "",
          audio_upload: audioData.audioUpload || "upload",
          position: audioData.position || "",
          brand_id: effectiveBrandId,
          audioFileName: "",
          audio_duration: audioData.audioDuration || audioData.duration || "",
        });
        if (audioData.brandCategory && Array.isArray(audioData.brandCategory)) {
          setSelectedCountries(audioData.brandCategory);
        } else {
          setSelectedCountries([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch audio details", error);
      Swal.fire("Error", "Failed to load audio details", "error");
    } finally {
      setIsFetchingAudio(false);
    }
  };

  useEffect(() => {
    if (initialAudio) {
      setFormData((prev) => ({
        ...prev,
        id: getCreativeId(initialAudio),
        name: initialAudio.name || "",
        audio: initialAudio.audio || "",
        impression_tracking_url: initialAudio.impressionTrackingUrl || initialAudio.impression_tracking_url || "",
        destination_url: initialAudio.destinationUrl || initialAudio.destination_url || "",
        brand_name: initialAudio.brandName || initialAudio.brand_name || "",
        audio_url: initialAudio.audioUrl || initialAudio.audio_url || "",
        audio_upload: initialAudio.audioUpload || initialAudio.audio_upload || "upload",
        position: initialAudio.position || "",
        brand_id: initialAudio.brand_id || propBrandId || "",
        audio_duration: initialAudio.audioDuration || initialAudio.duration || initialAudio.audio_duration || "",
      }));
      if (initialAudio.brandCategory && Array.isArray(initialAudio.brandCategory)) {
        setSelectedCountries(initialAudio.brandCategory);
      }
    }
  }, [initialAudio, propBrandId]);
    useEffect(() => {
    const hasCreatePermission = canCreate("Creatives");
    const hasUpdatePermission = canUpdate("Creatives");
    setcreativeCreateUser(hasCreatePermission);
    setcreativeUpdateUser(hasUpdatePermission);
  }, []);
  useEffect(() => {
    if (selectedCountries.length > 0 && errors.brandCategory) {
      setErrors((prev) => ({ ...prev, brandCategory: null }));
      setTooltipOpen((prev) => ({ ...prev, brandCategory: false }));
    }
  }, [selectedCountries]);

  const fetchCreativeAttributes = async () => {
    setLoadingAttributes(true);
    try {
      const response = await getAllCreativeAttribute();
      if (response.data?.status === 200) {
        setCreativeAttributes(response.data.data?.informationCreativeAttributes || []);
      }
    } catch (error) {
      console.error("Error fetching creative attributes:", error);
    } finally {
      setLoadingAttributes(false);
    }
  };

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
      if (wrapperNode?.contains(event.target)) return;
      if (portalNode?.contains(event.target)) return;
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleCreativeAttributeSelect = (value) => {
    setFormData((prev) => ({ ...prev, creative_attribute: value }));
    if (errors.creative_attribute) {
      setErrors((prev) => ({ ...prev, creative_attribute: null }));
    }
  };

  const selectedCreativeAttribute = creativeAttributes.find(
    (attr) => attr.creativeAttributeId?.toString() === String(formData.creative_attribute),
  );
  const creativeAttributeDisplayValue = loadingAttributes
    ? "Loading attributes..."
    : selectedCreativeAttribute
      ? selectedCreativeAttribute.name
      : "-- Select Creative Attribute --";

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
      if (!formData.audio?.trim()) {
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

    // Validate brand categories
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

  const addNewaudio = async (e) => {
    e.preventDefault();
    const isValid = await audiovalidateForm();
    if (!isValid) return;

    const action = formData.id ? "update" : "save";
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${action} this Audio?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await audioSubmit();
      if (response.error) {
        Swal.fire("Error!", response.message || "Something went wrong.", "error");
      } else {
        Swal.fire("Success!", `Audio has been ${action}d.`, "success");
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
      if (formData.id) {
        // Update existing audio
        const payload = {
          name: formData.name,
          type: "audio",
          audio: formData.audio,
          audioUpload: formData.audio_upload,
          audioUrl: formData.audio_url,
          position: formData.position,
          brandName: formData.brand_name,
          audioDuration: Number(formData.audio_duration) || 30,
          contenttype: formData.contenttype,
          bid_ecpm: Number(formData.bid_ecpm),
          status: formData.status,
          htmltemplate: formData.htmltemplate,
          destinationUrl: formData.destination_url,
          impressionTrackingUrl: formData.impression_tracking_url,
          brandCategory: selectedCountries,
          creativeAttributes: parseInt(formData.creative_attribute || 0, 10) || 0,
        };
        const response = await updatecreative(formData.id, payload);
        if (response.status === 200 || response.data?.status === 200) {
          if (callback) callback(response.data?.data || response.data);
          return { error: false };
        } else {
          return { error: true, message: response.data?.message || "Update failed" };
        }
      } else {
        // Create new audio via context
        const x = { ...initialAudio, ...formData, type: "audio", brandCategory: selectedCountries, creativeAttributes: parseInt(formData.creative_attribute || 0, 10) || 0 };
        const newId = await context.addNewCreative(x);
        if (newId) {
          if (callback) callback({ ...x, id: newId });
          return { error: false };
        } else {
          return { error: true, message: "Failed to create Audio." };
        }
      }
    } catch (err) {
      console.error("audiosubmit error:", err);
      return { error: true, message: err.response?.data?.message || "Unexpected error during submission." };
    }
  };

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
    setimpurlinputcount((prev) =>
      prev.length < 3 ? [...prev, { id: Date.now(), value: "" }] : prev
    );
  };

  const setimpurlinputcountdelete = (rowid) => {
    setimpurlinputcount((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== rowid) : prev
    );
  };

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
            <Input
              type="select"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
            >
              {BannerPosition()}
            </Input>
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
                style={{
                  height: "38px",
                  minHeight: "38px",
                  borderRadius: "13px",
                  padding: "10px 34px 10px 12px",
                  cursor: "pointer",
                  backgroundColor: "#fff",
                  color: loadingAttributes || !selectedCreativeAttribute ? "#64748b" : "#0f172a",
                }}
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
                    onClick={() => {
                      handleCreativeAttributeSelect("");
                      setIsCreativeAttributeOpen(false);
                    }}
                    className="custom-dropdown-option"
                    style={{ display: "flex", alignItems: "center", padding: "12px 10px", cursor: "pointer" }}
                  >
                    <span className="tick-icon editvideo-w" style={{ width: "14px" }}>
                      {!formData.creative_attribute && "✓"}
                    </span>
                    <span>-- Select Creative Attribute --</span>
                  </div>
                  {!loadingAttributes && creativeAttributes.length === 0 && (
                    <div className="custom-dropdown-option" style={{ padding: "12px 10px", color: "#64748b" }}>
                      No creative attributes found.
                    </div>
                  )}
                  {creativeAttributes.map((attribute) => {
                    const isSelected = String(formData.creative_attribute) === String(attribute.creativeAttributeId);
                    return (
                      <div
                        key={attribute.creativeAttributeId}
                        onClick={() => {
                          handleCreativeAttributeSelect(String(attribute.creativeAttributeId));
                          setIsCreativeAttributeOpen(false);
                        }}
                        className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                        style={{ display: "flex", alignItems: "center", padding: "12px 10px", cursor: "pointer" }}
                      >
                        <span className="tick-icon editvideo-w" style={{ width: "14px" }}>
                          {isSelected && "✓"}
                        </span>
                        <span>{attribute.name}</span>
                      </div>
                    );
                  })}
                </div>,
                document.body,
              )}
          </FormGroup>

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
          </Col>
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
                            setOpenTypeIndex(openTypeIndex === index ? null : index)
                          }
                          tabIndex={0}
                        >
                          <span className="audio-option">{row.type || "Select Event"}</span>
                          <FaCaretDown
                            className={`custom-select-icon ${openTypeIndex === index ? "open" : ""}`}
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
              onMouseLeave={() => setTooltipOpen((t) => ({ ...t, image: false }))}
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
            <span className="audiomodal-filesize">
              Hover for max file size, type, and supported image dimensions.
            </span>
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
                          setimpurlinputcount((prev) =>
                            prev.map((row) =>
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
                    {impurlinputcount.length > 1 && (
                      <Col xs="1">
                        <span onClick={() => setimpurlinputcountdelete(item.id)}>
                          <IoMdClose />
                        </span>
                      </Col>
                    )}
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

  return (
    <>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        id="audiomodal"
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Form onSubmit={addNewaudio} autoComplete="off">
          {(isLoading || isFetchingAudio) && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}

          <Row className="gx-0">
            <Col md="12">
              <div className="modal-header" id="audiomodalheader">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6">
                    <h5 className="modal-title mb-0">
                      Edit Audio Ad : {formData.name}
                    </h5>
                  </Col>
                  <Col md="6" className="text-end">
                    <Button close onClick={toggle} />
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
    </>
  );
};

export default AudioModaleditor;
