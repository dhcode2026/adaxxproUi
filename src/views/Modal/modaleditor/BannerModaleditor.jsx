import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { FaCaretDown } from "react-icons/fa";
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
import { useViewContext } from "../../../ViewContext.jsx";
import Swal from "sweetalert2";
import BrandcategoriesModal from "../BrandcategoriesModal.jsx";
import { editcreatives, updatecreative,getAllCreativeAttribute } from "../../../views/api/Api.jsx";
import { canCreate, canUpdate } from "../../../utils/permissionHelper.js";
const BannerModaleditor = (props) => {
  const {
    isOpen,
    toggle,
    banner: initialBanner,
    callback,
    brand_id: propBrandId,
  } = props;

  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const togglebrandcategoryModal = () => setBrandCategoryModalOpen(prev => !prev);
  const brandCategoriesBtnRef = useRef(null);
  const [selectedCountries, setSelectedCountries] = useState([]); // Initialize empty
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    banner_size: false,
    image_upload: false,
    imageurl: false,
    brand_name: false,
    destination_url: false,
    impression_tracking_url: false,
    brandCategory: false, // Add tooltip for brand categories
  });

  const vx = useViewContext();
  const effectiveBrandId = initialBanner?.brand_id || propBrandId || "";
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    image: "",
    impression_tracking_url: "",
    brand_name: "",
    banner_size: "",
    imageurl: "",
    width: "",
    height: "",
    width_range: "300",
    height_range: "400",
    width_height_list: "300x50",
    bid_ecpm: "0",
    position: "",
    contenttype: "",
    htmltemplate: "",
    status: "Active",
    image_upload: "upload",
    destination_url: "",
    customer_id: "dizhooh",
    interval_start: "",
    interval_end: "",
    frequency_expire: "",
    createdAt: "",
    updatedAt: "",
    brand_id: effectiveBrandId,
    creative_attribute: "",
  });

  const [errors, setErrors] = useState({});
  const [banner] = useState(initialBanner || {});
  const [myimage, setMyImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [rawImageBase64, setRawImageBase64] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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
  const [creativeCreateUser, setcreativeCreateUser] = useState(false);
  const [creativeUpdateUser, setcreativeUpdateUser] = useState(false);

  useEffect(() => {
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

    if (isOpen) {
      fetchCreativeAttributes();
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchBannerData = async () => {
      const bannerId = initialBanner?.id || initialBanner?.creativesId;
      if (!bannerId || !isOpen) return;

      setIsFetching(true);
      try {
        const response = await editcreatives(bannerId);
        console.log("Fetched banner data:", response.data);
        const bannerData = response.data?.data?.informationCreatives?.[0];
        if (bannerData) {
          setFormData({
            id: bannerData.creativesId || "",
            name: bannerData.name || "",
            image: bannerData.image || "",
            impression_tracking_url: bannerData.impressionTrackingUrl || "",
            brand_name: bannerData.brandName || "",
            banner_size: bannerData.bannerSize || "",
            imageurl: bannerData.imageUrl || "",
            width: bannerData.width?.toString() || "",
            height: bannerData.height?.toString() || "",
            width_range: bannerData.widthRange || "300",
            height_range: bannerData.heightRange || "400",
            width_height_list: bannerData.widthHeightList || "",
            bid_ecpm: bannerData.bidEcpm?.toString() || "0",
            position: bannerData.position || "",
            contenttype: bannerData.contenttype || "",
            htmltemplate: bannerData.htmltemplate || "",
            status: bannerData.status || "Active",
            image_upload: bannerData.imageUpload || "upload",
            destination_url: bannerData.destinationUrl || "",
            customer_id: bannerData.customerId || "dizhooh",
            interval_start: bannerData.intervalStart || "",
            interval_end: bannerData.intervalEnd || "",
            frequency_expire: bannerData.frequencyExpire || "",
            createdAt: bannerData.createdAt || "",
            updatedAt: bannerData.updatedAt || "",
            brand_id: bannerData.brandId || effectiveBrandId,
            creative_attribute: bannerData.creativeAttributes?.toString() || bannerData.creativeAttribute?.toString() || "",
          });
          setMyImage(bannerData.image || null);
          // Set selected countries from brandCategory
          if (bannerData.brandCategory && Array.isArray(bannerData.brandCategory)) {
            setSelectedCountries(bannerData.brandCategory);
          } else {
            setSelectedCountries([]);
          }
          if (!bannerData.bannerSize && bannerData.width && bannerData.height) {
            const matchedSize = vx.bannersize.find(
              (size) => size.width === bannerData.width && size.height === bannerData.height
            );
            if (matchedSize) {
              setFormData((prev) => ({ ...prev, banner_size: matchedSize.id.toString() }));
            }
          }
        } else {
          console.warn("No banner data found in response");
        }
      } catch (error) {
        console.error("Error fetching banner data:", error);
        Swal.fire("Error", "Failed to load banner data", "error");
      } finally {
        setIsFetching(false);
      }
    };

    if (isOpen) {
      fetchBannerData();
    } else {
      setFormData({
        id: "",
        name: "",
        image: "",
        impression_tracking_url: "",
        brand_name: "",
        banner_size: "",
        imageurl: "",
        width: "",
        height: "",
        width_range: "300",
        height_range: "400",
        width_height_list: "300x50",
        bid_ecpm: "0",
        position: "",
        contenttype: "",
        htmltemplate: "",
        status: "Active",
        image_upload: "upload",
        destination_url: "",
        customer_id: "dizhooh",
        interval_start: "",
        interval_end: "",
        frequency_expire: "",
        createdAt: "",
        updatedAt: "",
        brand_id: effectiveBrandId,
        creative_attribute: "",
      });
      setMyImage(null);
      setRawImageBase64("");
      setSelectedCountries([]);
      setErrors({});
    }
  }, [isOpen, initialBanner?.id, effectiveBrandId, vx.bannersize]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "banner_size") {
      const selectedBanner = vx.bannersize.find((b) => b.id.toString() === value);
      setFormData((prevData) => ({
        ...prevData,
        banner_size: value,
        width: selectedBanner ? selectedBanner.width : "",
        height: selectedBanner ? selectedBanner.height : "",
      }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleCreativeAttributeSelect = (value) => {
    setFormData((prevData) => ({ ...prevData, creative_attribute: value }));
    if (errors.creative_attribute) {
      setErrors((prevErrors) => ({ ...prevErrors, creative_attribute: null }));
    }
  };

  const selectedCreativeAttribute = creativeAttributes.find(
    (attribute) => String(attribute.creativeAttributeId) === String(formData.creative_attribute)
  );
  const creativeAttributeDisplayValue = loadingAttributes
    ? "Loading attributes..."
    : selectedCreativeAttribute
      ? selectedCreativeAttribute.name
      : "-- Select Creative Attribute --";

  // Clear brandCategory error when selectedCountries changes
  useEffect(() => {
    if (selectedCountries.length > 0 && errors.brandCategory) {
      setErrors((prev) => ({ ...prev, brandCategory: null }));
      setTooltipOpen((prev) => ({ ...prev, brandCategory: false }));
    }
  }, [selectedCountries]);
  useEffect(() => {
    const hasCreatePermission = canCreate("Creatives");
    const hasUpdatePermission = canUpdate("Creatives");
    setcreativeCreateUser(hasCreatePermission);
    setcreativeUpdateUser(hasUpdatePermission);
  }, []);

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

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const uploadImage = async (e) => {
    const file = e.target.files[0];
    const MAX_SIZE = 150 * 1024;
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
          width: 268,
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
              Image must be less than or equal to 150KB.
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
              <span style="font-size:16px; font-weight:bold;">Banner Size Required</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center;">
              Please select a banner size before uploading an image.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 268,
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
            width: 278,
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
          const base64WithPrefix = reader.result;
          const parts = base64WithPrefix.split(',');
          const rawBase64 = parts.length > 1 ? parts[1] : '';
          setRawImageBase64(rawBase64);
          setMyImage(base64WithPrefix);
          setFormData((prev) => ({
            ...prev,
            image: base64WithPrefix,
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
      html: `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Error</span>
             </div>
             <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
              Please ensure all required fields are correct.
             </div>`,
      showConfirmButton: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      width: 268,
      padding: 0,
      customClass: { popup: "swal2-custom-size", confirmButton: "swal2-small-btn" },
    });
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;
    const urlRegex = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/\S*)?$/;

    if (!formData.name.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }

    if (!formData.brand_name.trim()) {
      newErrors.brand_name = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.brand_name.trim())) {
      newErrors.brand_name = "Please enter a valid URL (e.g., http://example.com)";
      isValid = false;
    }
    if (!formData.destination_url.trim()) {
      newErrors.destination_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.destination_url.trim())) {
      newErrors.destination_url = "Please enter a valid Click URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }

    if (formData.image_upload === "upload") {
      if (!rawImageBase64 && !formData.image) {
        newErrors.image = "This field is required";
        isValid = false;
      } else if (rawImageBase64 && !allowedImageTypes.includes(formData.contenttype)) {
        newErrors.image = "Only JPG, PNG, GIF, or WEBP images are allowed";
        isValid = false;
      } else if (rawImageBase64 && formData.imageSize > 150 * 1024) {
        newErrors.image = "Image must be less than or equal to 150kb";
        isValid = false;
      }
    }
    if (formData.image_upload === "url") {
      if (!formData.imageurl.trim()) {
        newErrors.imageurl = "This field is required";
        isValid = false;
      }
    }
    if (!formData.banner_size.trim()) {
      newErrors.banner_size = "This field is required";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) await showValidationError();
    return isValid;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
        Swal.fire("Error!", response.message || "Something went wrong.", "error");
      } else {
        Swal.fire({
          html: `
            <div style="display:flex;justify-content:center;margin-bottom:20px;">
              <svg width="90" height="90" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="23"  fill="none"  stroke="#8bd16a" stroke-width="2.5"/>
                <path
                  d="M16 27l7 7 14-15"  fill="none"  stroke="#8bd16a"  stroke-width="3.8"  stroke-linecap="round"  stroke-linejoin="round"/>
              </svg>
            </div>
            <div style="font-size:42px;font-weight:200;color:#3c4453;">Saved!</div>
            <div style="margin-top:12px;font-size:18px;color:#3c4453;">
              Banner has been updated.
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "OK",
          confirmButtonColor: "#d73232",
          icon: undefined
        });
        // Swal.fire("Saved!", "Banner has been updated.", "success");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      Swal.fire("Error!", "Unexpected error occurred.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const bannersubmit = async () => {
    try {
      const creativeId = formData.id || initialBanner?.id || initialBanner?.creativesId;
      if (!creativeId) {
        console.error("No creative ID found");
        return { error: true, message: "Creative ID missing. Cannot update." };
      }
      const payload = {
        creativesId: creativeId,
        customerId: formData.customer_id,
        type: "banner",
        intervalStart: formData.interval_start,
        intervalEnd: formData.interval_end,
        width: parseInt(formData.width) || 0,
        height: parseInt(formData.height) || 0,
        contenttype: formData.contenttype,
        imageurl: formData.imageurl || "",
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: formData.name,
        frequencyExpire: formData.frequency_expire,
        image: formData.image_upload === "upload"
          ? (rawImageBase64 || formData.image)
          : (formData.imageurl || formData.image),
        bannerSize: formData.banner_size,
        impressionTrackingUrl: formData.impression_tracking_url,
        imageUpload: formData.image_upload,
        destinationUrl: formData.destination_url,
        status: formData.status,
        brandName: formData.brand_name,
        brandId: formData.brand_id,
        position: formData.position,
        bidEcpm: parseFloat(formData.bid_ecpm) || 0,
        htmltemplate: formData.htmltemplate,
        widthRange: formData.width_range,
        heightRange: formData.height_range,
        widthHeightList: formData.width_height_list,
        brandCategory: selectedCountries,
        creativeAttributes: parseInt(formData.creative_attribute, 10) || 0,
      };
      if (formData.image_upload === "upload" && rawImageBase64) {
        payload.image = rawImageBase64;
        payload.contenttype = formData.contenttype;
      }

      console.log("Updating banner with payload:", payload);

      const response = await updatecreative(creativeId, payload);
      console.log("Update response:", response);

      if (response.status === 200 || response.data?.status === 200) {
        const updatedBanner = response.data?.data?.informationCreatives?.[0] || {
          ...banner,
          ...payload,
        };
        callback(updatedBanner);
        toggle();
        return { error: false };
      } else {
        return { error: true, message: response.data?.message || "Failed to update banner." };
      }
    } catch (err) {
      console.error("bannersubmit error:", err);
      return { error: true, message: err.response?.data?.message || err.message };
    }
  };

  const getSelectedBannersize = () => {
    const items = [<option key="target-none" value="">-- Select Banner Size --</option>];
    for (let i = 0; i < vx.bannersize.length; i++) {
      const x = vx.bannersize[i];
      items.push(
        <option key={`target-${i}`} value={x.id}>
          {x.width} * {x.height}
        </option>
      );
    }
    return items;
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered id="bannermodal" size="lg" backdrop="static" keyboard={false}>
      <Form onSubmit={addNewbanner} autoComplete="off">
        {(isLoading || isFetching || isUploading) && (
          <div className="loader-overlay">
            <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
          </div>
        )}
        <Row className="gx-0">
          <Col md="6">
            <div className="bannering">
              {myimage ? (
                <img
                  src={myimage}
                  alt="Banner Preview"
                  style={{ maxHeight: "100%", width: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#aaa",
                  }}
                >
                  No Image Uploaded
                </div>
              )}
            </div>
          </Col>

          <Col md="6">
            <div className="modal-header border-bottom">
              <Row className="w-100 align-items-center m-0">
                <Col md="6">
                  <h5 className="modal-title mb-0">Edit Image Ad: {formData.name}</h5>
                </Col>
                <Col md="6" className="text-end">
                  <Button close onClick={toggle} />
                </Col>
              </Row>
            </div>
            <ModalBody className="pt-3 modal-body-scroll">
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
                    <div className="one" />
                    {errors.name}
                  </Tooltip>
                )}
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
                    <div className="one" />
                    {errors.brand_name}
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
                    <div className="one" />
                    {errors.destination_url}
                  </Tooltip>
                )}
              </FormGroup>
              <FormGroup>
                <Label for="impression_tracking_url">Impression Tracking URL</Label>
                <Input
                  type="text"
                  id="impression_tracking_url"
                  name="impression_tracking_url"
                  value={formData.impression_tracking_url}
                  onChange={handleChange}
                  invalid={!!errors.impression_tracking_url}
                  className="formscontrol"
                />
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
            </ModalBody>

            <ModalFooter>
              <Button className="cancels" onClick={toggle}>
                Cancel
              </Button>
              {(formData.id && creativeUpdateUser) && (
                <Button className="savebuttons" type="submit" disabled={isLoading || isFetching || isUploading}>
                  {isLoading ? "Saving..." : "Update Ad"}
                </Button>
              )}
            </ModalFooter>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default BannerModaleditor;
