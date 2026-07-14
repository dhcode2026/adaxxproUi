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
} from "reactstrap";
import { FaCaretDown } from "react-icons/fa";
import { useViewContext } from "../../ViewContext";
import { saveCreatives, getAllBannersizes, getAllCreativeAttribute } from "../../views/api/Api.jsx";
import Swal from "sweetalert2";
import BrandcategoriesModal from "./BrandcategoriesModal.jsx";

const BannerModal = (props) => {
  const {
    isOpen,
    toggle,
    banner: initialBanner,
    callback,
    brand_id: propBrandId,
  } = props;

  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const togglebrandcategoryModal = () => {
    setBrandCategoryModalOpen((prev) => !prev);
  };
  const brandCategoriesBtnRef = useRef(null);
  const bannerSizeRef = useRef(null);
  const bannerSizePortalRef = useRef(null);
  const creativeAttributeRef = useRef(null);
  const creativeAttributePortalRef = useRef(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    banner_size: false,
    image_upload: false,
    imageurl: false,
    brand_name: false,
    destination_url: false,
    brandCategory: false,
  });
  const vx = useViewContext();
  const effectiveBrandId = initialBanner?.brand_id || propBrandId || "";
  const [bannerSizes, setBannerSizes] = useState([]);
  const [creativeAttributes, setCreativeAttributes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [isBannerSizeOpen, setIsBannerSizeOpen] = useState(false);
  const [isCreativeAttributeOpen, setIsCreativeAttributeOpen] = useState(false);
  const [bannerSizeDropdownPosition, setBannerSizeDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [creativeAttributeDropdownPosition, setCreativeAttributeDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [formData, setFormData] = useState({
    impression_tracking_url: initialBanner?.impression_tracking_url || "",
    brand_name: initialBanner?.brand_name || "",
    banner_size: initialBanner?.banner_size || "",
    position: initialBanner?.position || "",
    contenttype: initialBanner?.contenttype || "",
    htmltemplate: initialBanner?.htmltemplate || "",
    status: initialBanner?.status || "0",
    image_upload: initialBanner?.image_upload || "upload",
    destination_url: initialBanner?.destination_url || "",
    brand_id: effectiveBrandId,
    creative_attribute: initialBanner?.creative_attribute || "",
    width: initialBanner?.width || "",
    height: initialBanner?.height || "",
  });
  const [rawImageBase64, setRawImageBase64] = useState("");
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(initialBanner || {});
  const [creative, setCreative] = useState({
    isBanner: true,
    isVideo: false,
    isAudio: false,
    isNative: false,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [myimage, setMyImage] = useState(initialBanner?.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBannerSizes();
      fetchCreativeAttributes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsBannerSizeOpen(false);
      setIsCreativeAttributeOpen(false);
    }
  }, [isOpen]);

  const fetchBannerSizes = async () => {
    setLoadingSizes(true);
    try {
      const response = await getAllBannersizes();
      if (response.data.status === 200) {
        setBannerSizes(response.data.data.informationBannerSizes || []);
      } else {
        console.error("Failed to fetch banner sizes");
      }
    } catch (error) {
      console.error("Error fetching banner sizes:", error);
    } finally {
      setLoadingSizes(false);
    }
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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      impression_tracking_url: initialBanner?.impression_tracking_url || "",
      brand_name: initialBanner?.brand_name || "",
      banner_size: initialBanner?.banner_size || "",
      imageurl: initialBanner?.imageurl || "",
      width_range: initialBanner?.width_range || "",
      height_range: initialBanner?.height_range || "",
      bid_ecpm: initialBanner?.bid_ecpm || "0",
      position: initialBanner?.position || "",
      contenttype: initialBanner?.contenttype || "",
      htmltemplate: initialBanner?.htmltemplate || "",
      status: initialBanner?.status || "0",
      image_upload: initialBanner?.image_upload || "upload",
      destination_url: initialBanner?.destination_url || "",
      brand_id: initialBanner?.brand_id || propBrandId || "",
      creative_attribute: initialBanner?.creative_attribute || "",
      width: initialBanner?.width || "",
      height: initialBanner?.height || "",
    }));
    if (initialBanner?.brandCategory) {
    } else {
      setSelectedCountries([]);
    }
  }, [initialBanner, propBrandId]);

  useEffect(() => {
    if (selectedCountries.length > 0 && errors.brandCategory) {
      setErrors((prev) => ({ ...prev, brandCategory: null }));
      setTooltipOpen((prev) => ({ ...prev, brandCategory: false }));
    }
  }, [selectedCountries]);

  // Banner Size Dropdown positioning
  useEffect(() => {
    if (!isBannerSizeOpen) return;

    const updatePosition = () => {
      if (!bannerSizeRef.current) return;
      const rect = bannerSizeRef.current.getBoundingClientRect();
      setBannerSizeDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const wrapperNode = bannerSizeRef.current;
      const portalNode = bannerSizePortalRef.current;

      if (wrapperNode && wrapperNode.contains(event.target)) return;
      if (portalNode && portalNode.contains(event.target)) return;
      setIsBannerSizeOpen(false);
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
  }, [isBannerSizeOpen]);

  // Creative Attribute Dropdown positioning
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "banner_size") {
      const selectedBanner = bannerSizes.find((b) => b.id.toString() === value);

      setFormData((prevData) => ({
        ...prevData,
        banner_size: value,
        width: selectedBanner ? selectedBanner.width : "",
        height: selectedBanner ? selectedBanner.height : "",
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: null,
      }));
    }
  };

  const handleBannerSizeSelect = (value) => {
    const selectedBanner = bannerSizes.find((b) => b.id.toString() === value);

    setFormData((prevData) => ({
      ...prevData,
      banner_size: value,
      width: value === "custom" ? prevData.width || "" : selectedBanner ? String(selectedBanner.width) : "",
      height: value === "custom" ? prevData.height || "" : selectedBanner ? String(selectedBanner.height) : "",
    }));

    if (errors.banner_size) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        banner_size: null,
      }));
    }
  };

  const handleCreativeAttributeSelect = (value) => {
    const selectedAttribute = creativeAttributes.find(
      (attr) => attr.creativeAttributeId.toString() === value
    );

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

  const selectedBannerSize = bannerSizes.find(
    (b) => b.id.toString() === String(formData.banner_size),
  );
  const isCustomBannerSize = String(formData.banner_size) === "custom";
  const bannerSizeDisplayValue = loadingSizes
    ? "Loading sizes..."
    : isCustomBannerSize
      ? "Custom (Enter width & Height)"
      : selectedBannerSize
        ? `${selectedBannerSize.width} * ${selectedBannerSize.height}`
        : "-- Select Banner Size --";

  const selectedCreativeAttribute = creativeAttributes.find(
    (attr) => attr.creativeAttributeId.toString() === String(formData.creative_attribute),
  );
  const creativeAttributeDisplayValue = loadingAttributes
    ? "Loading attributes..."
    : selectedCreativeAttribute
      ? selectedCreativeAttribute.name
      : "-- Select Creative Attribute --";

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    const MAX_SIZE = 10 * 1024 * 1024
    if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        await Swal.fire({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Invalid Image Type</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center;">
              Only JPG, PNG, GIF, or WEBP images are allowed.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 312,
          padding: 0,
          customClass: {
            popup: "swal2-custom-size",
            confirmButton: "swal2-small-btn",
          },
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
              <span style="font-size:16px; font-weight:bold;">Image Too Large</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center;">
              Image must be less than or equal to 600KB.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 312,
          padding: 0,
          customClass: {
            popup: "swal2-custom-size",
            confirmButton: "swal2-small-btn",
          },
        });
        e.target.value = "";
        return;
      }

      setErrors((prev) => ({ ...prev, image: null }));
      setIsUploading(true);
      if (!formData.width || !formData.height) {
        await Swal.fire({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Width and Height Required</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center;">
              Please enter width and height before uploading an image.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 312,
          padding: 0,
          customClass: {
            popup: "swal2-custom-size",
            confirmButton: "swal2-small-btn ",
          },
        });

        e.target.value = "";
        setIsUploading(false);
        return;
      }
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = async () => {
        const expectedWidth = parseInt(formData.width, 10);
        const expectedHeight = parseInt(formData.height, 10);

        if (img.width !== expectedWidth || img.height !== expectedHeight) {
          await Swal.fire({
            html: `
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                     style="width: 18px; height: 18px;" />
                <span style="font-size:16px; font-weight:bold;">Banner Size Mismatch</span>
              </div>
              <div style="margin-top: 10px; font-size:13px; text-align:center;">
                Expected <b>${expectedWidth}x${expectedHeight}</b>, but got <b>${img.width}x${img.height}</b>.
              </div>
            `,
            showConfirmButton: true,
            confirmButtonText: "OK",
            confirmButtonColor: "#62903e",
            width: 316,
            padding: 0,
            customClass: {
              popup: "swal2-custom-size",
              confirmButton: "swal2-small-btn",
            },
          });

          e.target.value = "";
          setIsUploading(false);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const fullDataUrl = reader.result;
          const base64 = fullDataUrl.split(',')[1];
          setRawImageBase64(base64);
          setMyImage(fullDataUrl);
          setFormData((prev) => ({
            ...prev,
            contenttype: file.type,
            imageSize: file.size,
          }));
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      };
    }
  };

  const handleOptionChange = (e) => {
    setFormData({
      ...formData,
      image_upload: e.target.value,
    });
    if (e.target.value === "url") {
      setRawImageBase64("");
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
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 312,
      padding: 0,
      customClass: {
        popup: "swal2-custom-size",
        confirmButton: "swal2-small-btn",
      },
    });
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;

    const urlRegex = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/\S*)?$/;
    if (!formData.name?.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }

    if (!formData.brand_name?.trim()) {
      newErrors.brand_name = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.brand_name.trim())) {
      newErrors.brand_name = "Please enter a valid URL (e.g., http://example.com)";
      isValid = false;
    }

    if (!formData.destination_url?.trim()) {
      newErrors.destination_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.destination_url.trim())) {
      newErrors.destination_url = "Please enter a valid Click URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }
    if (formData.image_upload === "upload") {
      if (!rawImageBase64) {
        newErrors.image = "This field is required";
        isValid = false;
      } else if (!allowedImageTypes.includes(formData.contenttype)) {
        newErrors.image = "Only JPG, PNG, GIF, or WEBP images are allowed";
        isValid = false;
      } else if (formData.imageSize > 10 * 1024 * 1024) {
        newErrors.image = "Image must be less than or equal to 10MB";
        isValid = false;
      }
    }
    if (formData.image_upload === "url") {
      if (!formData.imageurl?.trim()) {
        newErrors.imageurl = "This field is required";
        isValid = false;
      }
    }
    const hasSelectedBannerSize = !!formData.banner_size?.trim();
    const hasManualDimensions = !!String(formData.width || "").trim() && !!String(formData.height || "").trim();

    if (!hasSelectedBannerSize && !hasManualDimensions) {
      newErrors.banner_size = "Please select a banner size or enter custom width and height";
      newErrors.width = "Width is required";
      newErrors.height = "Height is required";
      isValid = false;
    }

    if (isCustomBannerSize && (!String(formData.width || "").trim() || !String(formData.height || "").trim())) {
      newErrors.width = "Width is required";
      newErrors.height = "Height is required";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) {
      await showValidationError();
    }
    return isValid;
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const resetForm = () => {
    setFormData({
      impression_tracking_url: "",
      brand_name: "",
      banner_size: "",
      position: "",
      contenttype: "",
      htmltemplate: "",
      status: "0",
      image_upload: "upload",
      destination_url: "",
      brand_id: effectiveBrandId,
      name: "",
      imageurl: "",
      width_range: "",
      height_range: "",
      bid_ecpm: "0",
      width: "",
      height: "",
      creative_attribute: "",
    });
    setRawImageBase64("");
    setMyImage(null);
    setSelectedCountries([]);
    setErrors({});
  };

  const addNewbanner = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save this Banner?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await bannersubmit();
      await delay(1000);
      if (response.error) {
        Swal.fire({
          title: "Error!",
          text: response.message || "Something went wrong.",
          icon: "error",
          iconHtml: '<img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" style="width: 40px; height: 40px;" />',
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 312,
          padding: 0,
          customClass: {
            popup: "swal2-custom-size",
            confirmButton: "swal2-small-btn",
          },
        });
      } else {
        Swal.fire("Saved!", "Banner has been created.", "success");
        resetForm();
        if (callback) callback(response.data);
        toggle();
      }
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "Unexpected error occurred.",
        icon: "error",
        iconHtml: '<img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" style="width: 40px; height: 40px;" />',
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
        width: 312,
        padding: 0,
        customClass: {
          popup: "swal2-custom-size",
          confirmButton: "swal2-small-btn",
        },
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const bannersubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        type: "banner",
        width: parseInt(formData.width, 10) || 0,
        height: parseInt(formData.height, 10) || 0,
        targetId: 0,
        frequencySpec: "",
        frequencyExpire: "",
        frequencyCount: "",
        brandName: formData.brand_name,
        destinationUrl: formData.destination_url,
        image: formData.image_upload === "upload" ? rawImageBase64 : formData.imageurl,
        bannerSize: formData.banner_size === "custom" ? "custom" : formData.banner_size,
        imageUpload: formData.image_upload,
        impressionTrackingUrl: formData.impression_tracking_url,
        htmltemplate: formData.htmltemplate,
        status: initialBanner?.creativesId ? (formData.status || "runnable") : "waiting approval",
        position: formData.position,
        contenttype: formData.contenttype,
        bid_ecpm: parseFloat(formData.bid_ecpm) || 0,
        brandCategory: selectedCountries,
        creativeAttributes: parseInt(formData.creative_attribute || 0),
      };
      if (initialBanner?.creativesId) {
        payload.creativesId = initialBanner.creativesId;
      }

      console.log("Submitting banner with payload:", payload);
      const response = await saveCreatives(effectiveBrandId, payload);
      if (response.status === 200 || response.status === 201) {
        return { error: false, data: response.data };
      } else {
        return { error: true, message: "Failed to create banner." };
      }
    } catch (err) {
      console.error("bannersubmit error:", err);
      return {
        error: true,
        message: err.response?.data?.message || "Unexpected error during submission.",
      };
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle} centered size="lg" backdrop="static" keyboard={false}>
        <Form onSubmit={addNewbanner} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" id="banner_size_option_loading" />
            </div>
          )}
          <Row className="gx-0">
            <Col md="6">
              <div className="bannering">
                {myimage ? (
                  <img
                    src={myimage}
                    alt="Banner Preview"
                    id="banner_preview_image"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    No Image Uploaded
                  </div>
                )}
              </div>
            </Col>

            <Col md="6">
              <div className="modal-header border-bottom">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6">
                    <h5 className="modal-title mb-0 ">New Image Ad</h5>
                  </Col>
                  <Col md="6" className="text-end">
                    <Button close onClick={toggle}></Button>
                  </Col>
                </Row>
              </div>

              <ModalBody className="pt-3 modal-body-scroll">
                <FormGroup>
                  <Label for="name">
                    Name <span className="valid">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ""}
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
                      transition={{ timeout: 150 }}
                    >
                      <div className="one"></div>
                      {errors.name}
                    </Tooltip>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="banner_size">
                    Banner Size <span className="valid">*</span>
                  </Label>
                  <div
                    ref={bannerSizeRef}
                    className="campaign-select-wrapper"
                    style={{ position: "relative", width: "100%" }}
                  >
                    <Input
                      id="banner_size"
                      name="banner_size"
                      type="text"
                      readOnly
                      value={bannerSizeDisplayValue}
                      onClick={() => !loadingSizes && setIsBannerSizeOpen((open) => !open)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && !loadingSizes) {
                          e.preventDefault();
                          setIsBannerSizeOpen((open) => !open);
                        }
                      }}
                      invalid={!!errors.banner_size}
                      className="campaign-select-input formscontrol"
                      style={{
                        color: loadingSizes || !selectedBannerSize ? "#64748b" : "#0f172a",
                      }}
                      onMouseEnter={() =>
                        errors.banner_size && setTooltipOpen((t) => ({ ...t, banner_size: true }))
                      }
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, banner_size: false }))}
                    />
                    <FaCaretDown
                      className={`custom-select-icon campaign-select-icon ${isBannerSizeOpen ? "open" : ""}`}
                      id="banner_size_icon"
                    />
                  </div>
                  {errors.banner_size && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.banner_size}
                      target="banner_size"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                      transition={{ timeout: 150 }}
                    >
                      <div className="one"></div>
                      {errors.banner_size}
                    </Tooltip>
                  )}
                  {isBannerSizeOpen &&
                    typeof document !== "undefined" &&
                    ReactDOM.createPortal(
                      <div
                        ref={bannerSizePortalRef}
                        className="custom-dropdown-menu biddeript-b"
                        style={{
                          position: "absolute",
                          top: `${bannerSizeDropdownPosition.top}px`,
                          left: `${bannerSizeDropdownPosition.left}px`,
                          zIndex: 9999,
                          minWidth: `${bannerSizeDropdownPosition.width || 120}px`,
                          width: `${bannerSizeDropdownPosition.width || 120}px`,
                          pointerEvents: "auto",
                        }}
                      >
                        <div
                          className="custom-dropdown-option"
                          id="banner_size_option_none"
                          onClick={() => {
                            handleBannerSizeSelect("");
                            setIsBannerSizeOpen(false);
                          }}
                        >
                          <span className="tick-icon" style={{ width: "14px" }} />
                          <span>-- Select Banner Size --</span>
                        </div>
                        <div
                          className="custom-dropdown-option"
                          id="banner_size_option_custom"
                          onClick={() => {
                            handleBannerSizeSelect("custom");
                            setIsBannerSizeOpen(false);
                          }}
                        >
                          <span className="tick-icon">
                            {String(formData.banner_size) === "custom" && "✓"}
                          </span>
                          <span>Custom (Enter width & Height)</span>
                        </div>
                        {loadingSizes ? (
                          <div
                            className="custom-dropdown-option"
                            id="banner_size_option_loading"
                          >
                            <span className="tick-icon" style={{ width: "14px" }} />
                            <span>Loading sizes...</span>
                          </div>
                        ) : (
                          bannerSizes.map((size) => {
                            const isSelected = String(formData.banner_size) === String(size.id);

                            return (
                              <div
                                key={size.id}
                                onClick={() => {
                                  handleBannerSizeSelect(String(size.id));
                                  setIsBannerSizeOpen(false);
                                }}
                                className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                id="banner_size_option_size"
                              >
                                <span className="tick-icon">
                                  {isSelected && "✓"}
                                </span>
                                <span>
                                  {size.width} * {size.height}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>,
                      document.body,
                    )}
                </FormGroup>

                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="width">Width</Label>
                      <Input
                        type="text"
                        id="width"
                        name="width"
                        value={formData.width || ""}
                        onChange={handleChange}
                        className="formscontrol"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="height">Height</Label>
                      <Input
                        type="text"
                        id="height"
                        name="height"
                        value={formData.height || ""}
                        onChange={handleChange}
                        className="formscontrol"
                      />
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
                        checked={formData.image_upload === "upload"}
                        onChange={handleOptionChange}
                        className="mt-1 me-1"
                      />
                      <Label className="me-4" htmlFor="allowlist">
                        Upload Image
                      </Label>

                      <Input
                        type="radio"
                        id="url"
                        name="uploadOption"
                        value="url"
                        checked={formData.image_upload === "url"}
                        onChange={handleOptionChange}
                        className="mt-1 me-1"
                      />
                      <Label htmlFor="blocklist">Image URL</Label>
                    </FormGroup>
                  </Col>
                </Row>

                {formData.image_upload === "upload" && (
                  <FormGroup>
                    <Label for="image">
                      Upload Image <span className="valid">*</span>
                    </Label>
                    <Input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={uploadImage}
                      invalid={!!errors.image}
                      className="formscontrol"
                      onMouseEnter={() => errors.image && setTooltipOpen((t) => ({ ...t, image: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, image: false }))}
                    />

                    {isUploading && (
                      <div className="progress mt-2" style={{ height: "6px" }}>
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          role="progressbar"
                          style={{ width: `${uploadProgress}%` }}
                          aria-valuenow={uploadProgress}
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
                        transition={{ timeout: 150 }}
                      >
                        <div className="one"></div>
                        {errors.image}
                      </Tooltip>
                    )}
                  </FormGroup>
                )}

                {formData.image_upload === "url" && (
                  <FormGroup>
                    <Label for="imageurl">
                      Image URL <span className="valid">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="imageurl"
                      name="imageurl"
                      value={formData.imageurl || ""}
                      onChange={handleChange}
                      invalid={!!errors.imageurl}
                      className="formscontrol"
                      onMouseEnter={() => errors.imageurl && setTooltipOpen((t) => ({ ...t, imageurl: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, imageurl: false }))}
                    />
                    {errors.imageurl && (
                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.imageurl}
                        target="imageurl"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                        transition={{ timeout: 150 }}
                      >
                        <div className="one"></div>
                        {errors.imageurl}
                      </Tooltip>
                    )}
                  </FormGroup>
                )}

                <FormGroup>
                  <Label for="htmltemplate">Html Template</Label>
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
                  <Label for="brand_name">
                    Brand Domain <span className="valid">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="brand_name"
                    name="brand_name"
                    value={formData.brand_name || ""}
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
                      transition={{ timeout: 150 }}
                    >
                      <div className="one"></div>
                      {errors.brand_name}
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
                    value={formData.destination_url || ""}
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
                      transition={{ timeout: 150 }}
                    >
                      <div className="one"></div>
                      {errors.destination_url}
                    </Tooltip>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="impression_tracking_url">
                    Impression Tracking URL
                  </Label>
                  <Input
                    type="text"
                    id="impression_tracking_url"
                    name="impression_tracking_url"
                    value={formData.impression_tracking_url || ""}
                    onChange={handleChange}
                    invalid={!!errors.impression_tracking_url}
                    className="formscontrol"
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="creative_attribute">
                    Creative Attribute
                  </Label>
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
                        if ((e.key === "Enter" || e.key === " ") && !loadingAttributes) {
                          e.preventDefault();
                          setIsCreativeAttributeOpen((open) => !open);
                        }
                      }}
                      invalid={!!errors.creative_attribute}
                      className="campaign-select-input formscontrol"
                      style={{
                        color: loadingAttributes || !selectedCreativeAttribute ? "#64748b" : "#0f172a",
                      }}
                      onMouseEnter={() =>
                        errors.creative_attribute && setTooltipOpen((t) => ({ ...t, creative_attribute: true }))
                      }
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, creative_attribute: false }))}
                    />
                    <FaCaretDown
                      className={`custom-select-icon campaign-select-icon ${isCreativeAttributeOpen ? "open" : ""}`}
                      id="creative_attribute_icon"
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
                          className="custom-dropdown-option"
                          id="creative_attribute_option_none"
                          onClick={() => {
                            handleCreativeAttributeSelect("");
                            setIsCreativeAttributeOpen(false);
                          }}
                        >
                          <span className="tick-icon" style={{ width: "14px" }} />
                          <span>-- Select Creative Attribute --</span>
                        </div>
                        {loadingAttributes ? (
                          <div
                            className="custom-dropdown-option"
                            id="creative_attribute_option_loading"
                          >
                            <span className="tick-icon" style={{ width: "14px" }} />
                            <span>Loading attributes...</span>
                          </div>
                        ) : (
                          creativeAttributes.map((attribute) => {
                            const isSelected = String(formData.creative_attribute) === String(attribute.creativeAttributeId);

                            return (
                              <div
                                key={attribute.creativeAttributeId}
                                onClick={() => {
                                  handleCreativeAttributeSelect(String(attribute.creativeAttributeId));
                                  setIsCreativeAttributeOpen(false);
                                }}
                                className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                id="creative_attribute_option_size"
                              >
                                <span className="tick-icon">
                                  {isSelected && "✓"}
                                </span>
                                <span>
                                  {attribute.name}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>,
                      document.body,
                    )}
                </FormGroup>

                <Col md="12">
                  <Label for="brand_name">Brand Categories</Label>
                  <Button
                    color=""
                    size="md"
                    className="w-100 choose"
                    onClick={togglebrandcategoryModal}
                    innerRef={brandCategoriesBtnRef}
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
                  <BrandcategoriesModal
                    modalOpen={brandcategoryModalOpen}
                    toggleModal={togglebrandcategoryModal}
                    selectedCountries={selectedCountries}
                    setSelectedCountries={setSelectedCountries}
                  />
                </Col>
              </ModalBody>

              <ModalFooter>
                <Button className="cancels" onClick={toggle}>
                  Cancel
                </Button>
                <Button className="savebuttons" type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Create Ad"}
                </Button>
              </ModalFooter>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default BannerModal;