import React, { useState, useEffect,useRef } from 'react';
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
  FormFeedback,
  Form,
  Spinner,
  Tooltip
} from 'reactstrap';
import Swal from 'sweetalert2';
import BrandcategoriesModal from "./BrandcategoriesModal.jsx";
import { saveCreatives, getAllBannersizes, getAllCreativeAttribute } from "../../views/api/Api.jsx";
import { useViewContext } from "../../ViewContext";
import { FaCaretDown } from "react-icons/fa";

const NativeModal = ({ isOpen, toggle, native: initialNative, callback, brand_id: propBrandId }) => {
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    image: false,
    image_url: false,
    video: false,
    video_url: false,
    brand_name: false,
    destination_url: false,
    impression_tracking_url: false,
    cta_text: false,
    head_line: false,
    body: false,
    sponsored_label: false,
    icon_logo: false,
    brand_domain: false,
    brand_categories: false,
    creative_attribute: false,
  });

  const effectiveBrandId = initialNative?.brand_id || propBrandId || "";
  const [rawImageBase64, setRawImageBase64] = useState("");
  const [rawIconBase64, setRawIconBase64] = useState("");
  const [rawVideoBase64, setRawVideoBase64] = useState("");
  const [bannerSizes, setBannerSizes] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [creativeAttributes, setCreativeAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const imageSizeRef = useRef(null);
  const imageSizePortalRef = useRef(null);
  const creativeAttributeRef = useRef(null);
  const creativeAttributePortalRef = useRef(null);
  const [isImageSizeOpen, setIsImageSizeOpen] = useState(false);
  const [isCreativeAttributeOpen, setIsCreativeAttributeOpen] = useState(false);
  const [imageSizeDropdownPosition, setImageSizeDropdownPosition] = useState({
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
    id: initialNative?.id || '',
    name: initialNative?.name || '',
    media_type: initialNative?.media_type || 'upload',
    creative_attribute: initialNative?.creative_attribute || '',
    brand_id: effectiveBrandId,
  });

  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
  const togglebrandcategoryModal = () => setBrandCategoryModalOpen(prev => !prev);
  const brandCategoriesBtnRef = useRef(null);
  const [selectedCountries, setSelectedCountries] = useState([]);
  useEffect(() => {
    if (isOpen) {
      fetchBannerSizes();
      fetchCreativeAttributes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsImageSizeOpen(false);
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
      const attributeList = response?.data?.data?.informationCreativeAttributes || [];
      setCreativeAttributes(attributeList);
    } catch (error) {
      console.error("Error fetching creative attributes:", error);
      setCreativeAttributes([]);
    } finally {
      setLoadingAttributes(false);
    }
  };

  // Sync with initialNative when editing
  useEffect(() => {
    if (initialNative) {
      let rawImage = "";
      let rawIcon = "";
      let rawVideo = "";

      if (initialNative.image && typeof initialNative.image === 'string' && initialNative.image.startsWith('data:')) {
        const parts = initialNative.image.split(',');
        if (parts.length > 1) rawImage = parts[1];
      }
      if (initialNative.icon_logo && typeof initialNative.icon_logo === 'string' && initialNative.icon_logo.startsWith('data:')) {
        const parts = initialNative.icon_logo.split(',');
        if (parts.length > 1) rawIcon = parts[1];
      }
      if (initialNative.video && typeof initialNative.video === 'string' && initialNative.video.startsWith('data:')) {
        const parts = initialNative.video.split(',');
        if (parts.length > 1) rawVideo = parts[1];
      }

      setRawImageBase64(rawImage);
      setRawIconBase64(rawIcon);
      setRawVideoBase64(rawVideo);

      setFormData(prev => ({
        ...prev,
        ...initialNative,
        brand_id: initialNative.brand_id || effectiveBrandId,
      }));

      setMyImage(initialNative.image || null);
      if (initialNative.icon_logo) setLogoImage(initialNative.icon_logo);
      if (initialNative.video) setUploadedVideo(initialNative.video);
    }
  }, [initialNative, propBrandId]);
  useEffect(() => {
    if (selectedCountries.length > 0 && errors.brand_categories) {
      setErrors(prev => ({ ...prev, brand_categories: null }));
      setTooltipOpen(prev => ({ ...prev, brand_categories: false }));
    }
  }, [selectedCountries]);

  useEffect(() => {
    if (!isImageSizeOpen) return;

    const updatePosition = () => {
      if (!imageSizeRef.current) return;
      const rect = imageSizeRef.current.getBoundingClientRect();
      setImageSizeDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const wrapperNode = imageSizeRef.current;
      const portalNode = imageSizePortalRef.current;

      if (wrapperNode && wrapperNode.contains(event.target)) return;
      if (portalNode && portalNode.contains(event.target)) return;
      setIsImageSizeOpen(false);
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
  }, [isImageSizeOpen]);

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

  const [creative, setCreative] = useState({ isNative: true });
  const context = useViewContext();
  const [html, setHtml] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const vx = useViewContext();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'width_height_list') {
      const selectedBanner = bannerSizes.find(b => b.id.toString() === value);

      setFormData(prev => ({
        ...prev,
        width_height_list: value,
        width_range: selectedBanner?.width.toString() || '',
        height_range: selectedBanner?.height.toString() || '',
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const [myimage, setMyImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [ctaHover, setCtaHover] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 150 * 1024;

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!allowedImageTypes.includes(file.type)) {
        await Swal.fire({
          html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Error</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Only JPG, PNG, GIF, or WEBP images are allowed.
          </div>
        `,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        await Swal.fire({
          html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Error</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Image must be less than or equal to 150 KB.
          </div>
        `,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
        return;
      }

      setErrors(prev => ({ ...prev, image: null }));
      setIsUploading(true);
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64WithPrefix = reader.result;
        const parts = base64WithPrefix.split(',');
        const rawBase64 = parts.length > 1 ? parts[1] : '';
        setRawImageBase64(rawBase64);

        const img = new Image();
        img.src = base64WithPrefix;

        img.onload = () => {
          const updatedFormData = {
            ...formData,
            image: base64WithPrefix,
            contenttype: file.type,
            imageSize: file.size,
            imageWidth: img.width,
            imageHeight: img.height,
          };
          setMyImage(base64WithPrefix);
          setFormData(updatedFormData);
          setIsUploading(false);
        };

        img.onerror = () => {
          Swal.fire({
            html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Error</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
              Invalid image file.
            </div>
          `,
            confirmButtonText: "OK",
            confirmButtonColor: "#62903e",
            width: 300,
            padding: 10,
          });
          setIsUploading(false);
        };
      };

      reader.onerror = () => {
        Swal.fire({
          html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Error</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Invalid image file.
          </div>
        `,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    setFormData({
      ...formData,
      [name]: files ? files[0] : value
    });

    if (name === "head_line" && value.length <= 80) {
      setErrors(prev => ({ ...prev, head_line: "" }));
    }
    if (name === "body" && value.length <= 300) {
      setErrors(prev => ({ ...prev, body: "" }));
    }
    if (name === "cta_text" && value.length <= 20) {
      setErrors(prev => ({ ...prev, cta_text: "" }));
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

  const nativevalidateForm = async () => {
    const newErrors = {};
    let isValid = true;
    const domainRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    const urlRegex = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/\S*)?$/;

    if (!formData.name?.trim()) {
      newErrors.name = "This field is required";
      isValid = false;
    }
    if (!formData.media_type) {
      newErrors.media_type = "This field is required";
      isValid = false;
    } else {
      switch (formData.media_type) {
        case "upload":
          if (!rawImageBase64) {
            newErrors.image = "This field is required";
            isValid = false;
          }
          break;
        case "url":
          if (!formData.image_url?.trim()) {
            newErrors.image_url = "This field is required";
            isValid = false;
          }
          break;
        case "video":
          if (!rawVideoBase64) {
            newErrors.video = "This field is required";
            isValid = false;
          }
          break;
        default:
          break;
      }
    }
    if (!formData.head_line?.trim()) {
      newErrors.head_line = "This field is required";
      isValid = false;
    } else if (formData.head_line.length > 80) {
      newErrors.head_line = "Headline cannot exceed 80 characters";
      isValid = false;
    }
    if (!formData.body?.trim()) {
      newErrors.body = "This field is required";
      isValid = false;
    } else if (formData.body.length > 300) {
      newErrors.body = "Body cannot exceed 300 characters";
      isValid = false;
    }
    if (!formData.cta_text?.trim()) {
      newErrors.cta_text = "This field is required";
      isValid = false;
    } else if (formData.cta_text.length > 20) {
      newErrors.cta_text = "CTA cannot exceed 20 characters";
      isValid = false;
    }
    if (!formData.sponsored_label?.trim()) {
      newErrors.sponsored_label = "This field is required";
      isValid = false;
    }
    if (!formData.impression_tracking_url?.trim()) {
      newErrors.impression_tracking_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.impression_tracking_url.trim())) {
      newErrors.impression_tracking_url =
        "Please enter a valid Impression URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }
    if (!formData.destination_url?.trim()) {
      newErrors.destination_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.destination_url.trim())) {
      newErrors.destination_url =
        "Please enter a valid Click URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }
    if (!formData.brand_domain?.trim()) {
      newErrors.brand_domain = "This field is required";
      isValid = false;
    } else if (!domainRegex.test(formData.brand_domain.trim())) {
      newErrors.brand_domain = "Please enter a valid domain";
      isValid = false;
    }
    if (!rawIconBase64) {
      newErrors.icon_logo = "Logo is required";
      isValid = false;
    }

    // Brand Categories validation
    if (selectedCountries.length === 0) {
      newErrors.brand_categories = "At least one brand category is required";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) {
      await showValidationError();
    }
    return isValid;
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrors(prev => ({ ...prev, icon_logo: null }));

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      await Swal.fire({
        html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
          Only JPG or PNG images are allowed.
        </div>
      `,
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
        width: 300,
        padding: 10,
      });
      return;
    }

    if (file.size > 50 * 1024) {
      await Swal.fire({
        html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
          File size must be ≤ 50 KB.
        </div>
      `,
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
        width: 300,
        padding: 10,
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64WithPrefix = reader.result;
      const parts = base64WithPrefix.split(',');
      const rawBase64 = parts.length > 1 ? parts[1] : '';
      setRawIconBase64(rawBase64);

      const img = new Image();
      img.src = base64WithPrefix;

      img.onload = async () => {
        if (img.width < 128 || img.height < 128) {
          await Swal.fire({
            html: `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                   style="width: 18px; height: 18px;" />
              <span style="font-size:16px; font-weight:bold;">Error</span>
            </div>
            <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
              Image must be at least 128 × 128 pixels.
            </div>
          `,
            confirmButtonText: "OK",
            confirmButtonColor: "#62903e",
            width: 300,
            padding: 10,
          });
          return;
        }

        setLogoImage(base64WithPrefix);
        setFormData(prev => ({
          ...prev,
          icon_logo: base64WithPrefix,
          iconLogoWidth: img.width,
          iconLogoHeight: img.height,
          icon_type: file.type,
          iconLogoName: file.name,
        }));
      };

      img.onerror = async () => {
        await Swal.fire({
          html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Error</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Invalid image file.
          </div>
        `,
          confirmButtonText: "OK",
          confirmButtonColor: "#62903e",
          width: 300,
          padding: 10,
        });
      };
    };

    reader.onerror = async () => {
      await Swal.fire({
        html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
          Invalid image file.
        </div>
      `,
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
        width: 300,
        padding: 10,
      });
    };

    reader.readAsDataURL(file);
  };

  const uploadVideo = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const maxSizeMB = 3;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4")) {
      await Swal.fire({
        html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
          Only MP4 videos are allowed.
        </div>
      `,
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
        width: 300,
        padding: 10,
      });

      setFormData(prev => ({ ...prev, video: "" }));
      setUploadedVideo(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      await Swal.fire({
        html: `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" 
               style="width: 18px; height: 18px;" />
          <span style="font-size:16px; font-weight:bold;">Error</span>
        </div>
        <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
          Video must be less than or equal to ${maxSizeMB} MB.
        </div>
      `,
        confirmButtonText: "OK",
        confirmButtonColor: "#62903e",
        width: 300,
        padding: 10,
      });

      setFormData(prev => ({ ...prev, video: "" }));
      setUploadedVideo(null);
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64WithPrefix = reader.result;
      const parts = base64WithPrefix.split(',');
      const rawBase64 = parts.length > 1 ? parts[1] : '';
      setRawVideoBase64(rawBase64);

      setUploadedVideo(base64WithPrefix); // Preview
      setFormData(prev => ({ ...prev, video: base64WithPrefix, contenttype: file.type }));
      setTimeout(() => setIsUploading(false), 1000);
    };
    reader.readAsDataURL(file);
  };

  const handleOptionChange = (e) => {
    const { value } = e.target;

    setFormData({
      ...formData,
      media_type: value
    });
    if (value !== "upload") setRawImageBase64("");
    if (value !== "video") setRawVideoBase64("");

    if (errors.media_type) {
      setErrors({ ...errors, media_type: "" });
    }
  };

  const selectedImageSize = bannerSizes.find(
    (b) => b.id.toString() === String(formData.width_height_list || ""),
  );
  const imageSizeDisplayValue = loadingSizes
    ? "Loading sizes..."
    : selectedImageSize
      ? `${selectedImageSize.width} * ${selectedImageSize.height}`
      : "-- Select Image Size --";

  const handleImageSizeSelect = (value) => {
    const selectedBanner = bannerSizes.find((b) => b.id.toString() === value);

    setFormData((prev) => ({
      ...prev,
      width_height_list: value,
      width_range: selectedBanner?.width?.toString() || "",
      height_range: selectedBanner?.height?.toString() || "",
    }));

    if (errors.width_height_list) {
      setErrors((prev) => ({ ...prev, width_height_list: "" }));
    }
  };

  const handleCreativeAttributeSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      creative_attribute: value,
    }));

    if (errors.creative_attribute) {
      setErrors((prev) => ({ ...prev, creative_attribute: "" }));
    }
  };

  const selectedCreativeAttribute = creativeAttributes.find(
    (attr) => attr.creativeAttributeId?.toString() === String(formData.creative_attribute || ""),
  );
  const creativeAttributeDisplayValue = loadingAttributes
    ? "Loading attributes..."
    : selectedCreativeAttribute
      ? selectedCreativeAttribute.name
      : "-- Select Creative Attribute --";

  const nativeSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        type: "native",
        destinationUrl: formData.destination_url,
        impressionTrackingUrl: formData.impression_tracking_url,
        mediaType: formData.media_type,
        position: formData.position,
        brandName: formData.brand_domain,
        brandDomain: formData.brand_domain,
        brand: formData.brand,
        nativePlcmtct: 0,
        imageUrl: formData.media_type === "url" ? formData.image_url : "",
        image: formData.media_type === "upload" ? rawImageBase64 : "",
        video: formData.media_type === "video" ? rawVideoBase64 : "",
        videourl: "",
        iconLogo: rawIconBase64,
        iconType: formData.icon_type || "",
        link: formData.destination_url,
        width: parseInt(formData.width_range, 10) || 0,
        height: parseInt(formData.height_range, 10) || 0,
        headLine: formData.head_line,
        body: formData.body,
        ctaText: formData.cta_text,
        sponsoredLabel: formData.sponsored_label,
        bid_ecpm: parseFloat(formData.bid_ecpm) || 0,
        status: formData.status,
        htmltemplate: formData.htmltemplate,
        contenttype: formData.contenttype,
        creativeAttributes: parseInt(formData.creative_attribute || 0),
        brandCategory: selectedCountries,
      };

       console.log("Native Create API data:", nativeSubmit);

      if (initialNative?.creativesId) {
        payload.creativesId = initialNative.creativesId;
      }

      console.log("Submitting native with payload:", payload);
      const response = await saveCreatives(effectiveBrandId, payload);

      if (response.status === 200 || response.status === 201) {
        return { error: false, data: response.data };
      } else {
        return { error: true, message: "Failed to create native ad." };
      }
    } catch (err) {
      console.error("nativeSubmit error:", err);
      return {
        error: true,
        message: err.response?.data?.message || "Unexpected error during submission.",
      };
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      media_type: 'upload',
      brand_id: effectiveBrandId,
      image: '',
      image_url: '',
      video: '',
      destination_url: '',
      impression_tracking_url: '',
      brand_domain: '',
      brand: '',
      head_line: '',
      body: '',
      bid_ecpm: '0',
      htmltemplate: '',
      status: '0',
      cta_text: '',
      icon_logo: '',
      sponsored_label: '',
      contenttype: '',
      position: '',
      width_height_list: '',
      width_range: '',
      height_range: '',
      creative_attribute: '',
    });
    setRawImageBase64("");
    setRawIconBase64("");
    setRawVideoBase64("");
    setMyImage(null);
    setLogoImage(null);
    setUploadedVideo(null);
    setSelectedCountries([]);
    setErrors({});
  };

  const addNewnative = async (e) => {
    e.preventDefault();

    const isValid = await nativevalidateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to save this Native?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await nativeSubmit();

      await delay(1000); 

      if (response.error) {
        Swal.fire('Error!', response.message || 'Something went wrong.', 'error');
      } else {
        Swal.fire('Saved!', 'Native ad has been created.', 'success');
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

  const getSelectedCampaign = () => {
    const items = [<option key="target-none" value="">-- Select Campaign --</option>];

    for (let i = 0; i < vx.campaigns.length; i++) {
      const x = vx.campaigns[i];
      items.push(
        <option key={`target-${i}`} value={x.id}>
          {x.name}
        </option>
      );
    }
    return items;
  };

  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle} id="bannermodal" size="lg" backdrop="static" keyboard={false} centered>
        <Form onSubmit={addNewnative} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}
          <Row className="gx-0">
            <Col
              md="6"
              className="d-flex justify-content-center align-items-center"
              style={{ margin: 0, padding: 0, backgroundColor: "#f5f5f5" }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  border: "1px solid #ddd",
                  padding: "12px",
                  boxSizing: "border-box",
                  margin: "0 auto",
                  backgroundColor: "#fff",
                }}
              >
                {/* Media Preview */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    backgroundColor: "#e4e4e4",
                    border: "1px solid #eee",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {formData.media_type === "upload" && myimage ? (
                    <img
                      src={myimage}
                      alt="Banner Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : formData.media_type === "url" && formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Banner Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : formData.media_type === "video" && uploadedVideo ? (
                    <video
                      width="100%"
                      height="100%"
                      controls
                      style={{
                        objectFit: "contain",
                        borderRadius: "4px",
                      }}
                    >
                      <source src={uploadedVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <span style={{ color: "#aaa", fontSize: "12px" }}>No Media</span>
                  )}

                  {/* Logo */}
                  {logoImage && (
                    <img
                      src={logoImage}
                      alt="Logo Preview"
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "10px",
                        width: "50px",
                        height: "50px",
                        objectFit: "contain",
                        padding: "3px",
                      }}
                    />
                  )}

                  {/* CTA Button */}
                  {formData.cta_text && (
                    <a
                      href={formData.destination_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        padding: "4px 8px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                        backgroundColor: ctaHover ? "rgb(98, 144, 62)" : "white",
                        color: ctaHover ? "white" : "rgb(98, 144, 62)",
                        border: `1px solid ${ctaHover ? "rgb(80, 120, 50)" : "rgb(98, 144, 62)"}`,
                        borderRadius: "0",
                        fontSize: "12px",
                        textDecoration: "none",
                        display: "inline-block",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={() => setCtaHover(true)}
                      onMouseLeave={() => setCtaHover(false)}
                      onClick={(e) => {
                        if (!formData.destination_url) {
                          e.preventDefault();
                          alert("No destination URL provided");
                        }
                      }}
                    >
                      {formData.cta_text}
                    </a>
                  )}
                </div>

                {/* Headline */}
                <h4
                  style={{
                    marginTop: "10px",
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#333",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {formData.head_line || " "}
                </h4>

                {/* Body */}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666",
                    margin: "4px 0 0",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {formData.body || " "}
                </p>
              </div>
            </Col>
            <Col md="6">
              <div className="modal-header border-bottom">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6">
                    <h5 className="modal-title mb-0">New Native Ad</h5>
                  </Col>
                  <Col md="6" className="text-end">
                    <Button close onClick={toggle}></Button>
                  </Col>
                </Row>
              </div>

              <ModalBody className="pt-3 modal-body-scroll">
                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="name">Name <span className="text-danger">*</span></Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name || ''}
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
                </Row>
                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="media_type">
                        Choose Option <span className="valid">*</span>
                      </Label>
                      <div>
                        <Input
                          type="radio"
                          id="upload"
                          name="media_type"
                          value="upload"
                          checked={formData.media_type === "upload"}
                          onChange={handleOptionChange}
                          className="mt-1 me-1"
                          invalid={!!errors.media_type}
                        />
                        <Label className="me-4" htmlFor="upload">
                          Upload Image
                        </Label>
                        <Input
                          type="radio"
                          id="url"
                          name="media_type"
                          value="url"
                          checked={formData.media_type === "url"}
                          onChange={handleOptionChange}
                          className="mt-1 me-1"
                          invalid={!!errors.media_type}
                        />
                        <Label className="me-4" htmlFor="url">
                          Use Image URL
                        </Label>
                        <Input
                          type="radio"
                          id="video"
                          name="media_type"
                          value="video"
                          checked={formData.media_type === "video"}
                          onChange={handleOptionChange}
                          className="mt-1 me-1"
                          invalid={!!errors.media_type}
                        />
                        <Label htmlFor="video">Upload Video</Label>
                      </div>
                      {errors.media_type && <FormFeedback className="d-block">{errors.media_type}</FormFeedback>}
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
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
                            if ((e.key === "Enter" || e.key === " ") && !loadingAttributes) {
                              e.preventDefault();
                              setIsCreativeAttributeOpen((open) => !open);
                            }
                          }}
                          invalid={!!errors.creative_attribute}
                          className="campaign-select-input"
                          style={{
                            height: "38px",
                            minHeight: "38px",
                            borderRadius: "13px",
                            padding: "10px 34px 10px 12px",
                            cursor: loadingAttributes ? "wait" : "pointer",
                            backgroundColor: "#fff",
                            color: loadingAttributes || !selectedCreativeAttribute ? "#64748b" : "#0f172a",
                          }}
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
                              className="custom-dropdown-option"
                              style={{ display: "flex", alignItems: "center", padding: "5px 10px", cursor: "pointer" }}
                              onClick={() => {
                                handleCreativeAttributeSelect("");
                                setIsCreativeAttributeOpen(false);
                              }}
                            >
                              <span className="tick-icon" style={{ width: "14px" }} />
                              <span>-- Select Creative Attribute --</span>
                            </div>
                            {loadingAttributes ? (
                              <div className="custom-dropdown-option" style={{ display: "flex", alignItems: "center", padding: "5px 10px", cursor: "default", color: "#64748b" }}>
                                <span className="tick-icon" style={{ width: "14px" }} />
                                <span>Loading attributes...</span>
                              </div>
                            ) : (
                              creativeAttributes.map((attribute, i) => {
                                const isSelected = String(formData.creative_attribute || "") === String(attribute.creativeAttributeId);
                                return (
                                  <div
                                    key={`creativeAttribute-${i}`}
                                    className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                    style={{ display: "flex", alignItems: "center", padding: "10px 10px", cursor: "pointer" }}
                                    onClick={() => {
                                      handleCreativeAttributeSelect(String(attribute.creativeAttributeId));
                                      setIsCreativeAttributeOpen(false);
                                    }}
                                  >
                                    <span className="tick-icon" style={{ width: "14px" }}>
                                      {isSelected && "✓"}
                                    </span>
                                    <span>{attribute.name}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>,
                          document.body,
                        )}
                      {errors.creative_attribute && (
                        <Tooltip
                          placement="bottom"
                          isOpen={tooltipOpen.creative_attribute}
                          target="creative_attribute"
                          autohide={false}
                          container=".modal-content"
                          popperClassName="custom-tooltip"
                        >
                          <div className="one"></div>
                          {errors.creative_attribute}
                        </Tooltip>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="width_height_list">Image Size  </Label>
                      <div
                        ref={imageSizeRef}
                        className="campaign-select-wrapper"
                        style={{ position: "relative", width: "100%" }}
                      >
                        <Input
                          id="width_height_list"
                          name="width_height_list"
                          type="text"
                          readOnly
                          value={imageSizeDisplayValue}
                          onClick={() => !loadingSizes && setIsImageSizeOpen((open) => !open)}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && !loadingSizes) {
                              e.preventDefault();
                              setIsImageSizeOpen((open) => !open);
                            }
                          }}
                          invalid={!!errors.width_height_list}
                          className="campaign-select-input"
                          style={{
                            height: "38px",
                            minHeight: "38px",
                            borderRadius: "13px",
                            padding: "10px 34px 10px 12px",
                            cursor: loadingSizes ? "wait" : "pointer",
                            backgroundColor: "#fff",
                            color: loadingSizes || !selectedImageSize ? "#64748b" : "#0f172a",
                          }}
                        />
                        <FaCaretDown
                          className={`custom-select-icon campaign-select-icon ${isImageSizeOpen ? "open" : ""}`}
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
                      {isImageSizeOpen &&
                        typeof document !== "undefined" &&
                        ReactDOM.createPortal(
                          <div
                            ref={imageSizePortalRef}
                            className="custom-dropdown-menu biddeript-b"
                            style={{
                              position: "absolute",
                              top: `${imageSizeDropdownPosition.top}px`,
                              left: `${imageSizeDropdownPosition.left}px`,
                              zIndex: 9999,
                              minWidth: `${imageSizeDropdownPosition.width || 120}px`,
                              width: `${imageSizeDropdownPosition.width || 120}px`,
                              pointerEvents: "auto",
                            }}
                          >
                            <div
                              className="custom-dropdown-option"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "5px 10px",
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                handleImageSizeSelect("");
                                setIsImageSizeOpen(false);
                              }}
                            >
                              <span className="tick-icon" style={{ width: "14px" }} />
                              <span>-- Select Image Size --</span>
                            </div>
                            {loadingSizes ? (
                              <div
                                className="custom-dropdown-option"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "5px 10px",
                                  cursor: "default",
                                  color: "#64748b",
                                }}
                              >
                                <span className="tick-icon" style={{ width: "14px" }} />
                                <span>Loading sizes...</span>
                              </div>
                            ) : (
                              bannerSizes.map((size, i) => {
                                const isSelected = String(formData.width_height_list || "") === String(size.id);
                                return (
                                  <div
                                    key={`target-${i}`}
                                    className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      padding: "10px 10px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => {
                                      handleImageSizeSelect(String(size.id));
                                      setIsImageSizeOpen(false);
                                    }}
                                  >
                                    <span className="tick-icon" style={{ width: "14px" }}>
                                      {isSelected && "✓"}
                                    </span>
                                    <span>{size.width} * {size.height}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>,
                          document.body,
                        )}
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="width_range">Width</Label>
                      <Input
                        type="text"
                        id="width_range"
                        name="width_range"
                        value={formData.width_range || ''}
                        onChange={handleChange}
                        className="formscontrol"
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label for="height_range">Height</Label>
                      <Input
                        type="text"
                        id="height_range"
                        name="height_range"
                        value={formData.height_range || ''}
                        onChange={handleChange}
                        className="formscontrol"
                      />
                    </FormGroup>
                  </Col>
                </Row>

                {formData.media_type === "upload" && (
                  <Col md="12">
                    <FormGroup>
                      <Label for="image">Image <span className="valid">*</span></Label>
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
                  </Col>
                )}

                {formData.media_type === "url" && (
                  <Col md="12">
                    <FormGroup>
                      <Label for="image_url">Image URL <span className="text-danger">*</span></Label>
                      <Input
                        type="text"
                        id="image_url"
                        name="image_url"
                        value={formData.image_url || ''}
                        onChange={handleChange}
                        invalid={!!errors.image_url}
                        className="formscontrol"
                        onMouseEnter={() => errors.image_url && setTooltipOpen((t) => ({ ...t, image_url: true }))}
                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, image_url: false }))}
                      />
                      {errors.image_url && (
                        <Tooltip
                          placement="bottom"
                          isOpen={tooltipOpen.image_url}
                          target="image_url"
                          autohide={false}
                          container=".modal-content"
                          popperClassName="custom-tooltip"
                        >
                          <div className="one"></div>
                          {errors.image_url}
                        </Tooltip>
                      )}
                    </FormGroup>
                  </Col>
                )}

                {formData.media_type === "video" && (
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
                      onMouseEnter={() => errors.video && setTooltipOpen((t) => ({ ...t, video: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, video: false }))}
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

                <Col md="12">
                  <FormGroup>
                    <Label for="brand">Brand</Label>
                    <Input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand || ''}
                      onChange={handleInputChange}
                      className="formscontrol"
                    />
                    <small className="form-help-text">25 character limit. Brand name will appear on the ad.</small>
                  </FormGroup>
                </Col>

                <FormGroup>
                  <Label for="icon_logo">Icon / Logo (128×128px minimum) <span className="valid">*</span></Label>
                  <Input
                    type="file"
                    id="icon_logo"
                    name="icon_logo"
                    accept="image/*"
                    onChange={uploadLogo}
                    invalid={!!errors.icon_logo}
                    className="formscontrol"
                    onMouseEnter={() => errors.icon_logo && setTooltipOpen((t) => ({ ...t, icon_logo: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, icon_logo: false }))}
                  />
                  {errors.icon_logo && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.icon_logo}
                      target="icon_logo"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.icon_logo}
                    </Tooltip>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="cta_text">
                    CTA (Call-to-Action) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="cta_text"
                    name="cta_text"
                    value={formData.cta_text || ""}
                    onChange={handleInputChange}
                    invalid={!!errors.cta_text}
                    maxLength={20}
                    className="formscontrol"
                    onMouseEnter={() => errors.cta_text && setTooltipOpen((t) => ({ ...t, cta_text: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, cta_text: false }))}
                  />
                  {errors.cta_text && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.cta_text}
                      target="cta_text"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.cta_text}
                    </Tooltip>
                  )}
                  <small
                    className={`form-help-text ${formData.cta_text && formData.cta_text.length >= 20 ? "text-danger" : "text-muted"}`}
                  >
                    {formData.cta_text ? formData.cta_text.length : 0} / 20 characters
                  </small>
                </FormGroup>

                <FormGroup>
                  <Label for="sponsored_label">Sponsored Label <span className="text-danger">*</span></Label>
                  <Input
                    type="text"
                    id="sponsored_label"
                    name="sponsored_label"
                    value={formData.sponsored_label || ''}
                    onChange={handleChange}
                    invalid={!!errors.sponsored_label}
                    className="formscontrol"
                    onMouseEnter={() => errors.sponsored_label && setTooltipOpen((t) => ({ ...t, sponsored_label: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, sponsored_label: false }))}
                  />
                  {errors.sponsored_label && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.sponsored_label}
                      target="sponsored_label"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.sponsored_label}
                    </Tooltip>
                  )}
                </FormGroup>

                <Col md="12">
                  <FormGroup>
                    <Label for="head_line">
                      Headline <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="head_line"
                      name="head_line"
                      value={formData.head_line || ''}
                      onChange={handleChange}
                      invalid={!!errors.head_line}
                      className="formscontrol"
                      maxLength={80}
                      onMouseEnter={() => errors.head_line && setTooltipOpen((t) => ({ ...t, head_line: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, head_line: false }))}
                    />
                    <small
                      className={`form-help-text ${formData.head_line && formData.head_line.length >= 80 ? "text-danger" : "text-muted"}`}
                    >
                      {formData.head_line ? formData.head_line.length : 0} / 80 characters
                    </small>
                    {errors.head_line && (
                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.head_line}
                        target="head_line"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                      >
                        <div className="one"></div>
                        {errors.head_line}
                      </Tooltip>
                    )}
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label for="body">
                      Body <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="textarea"
                      id="body"
                      name="body"
                      value={formData.body || ''}
                      onChange={handleInputChange}
                      invalid={!!errors.body}
                      maxLength={300}
                      onMouseEnter={() => errors.body && setTooltipOpen((t) => ({ ...t, body: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, body: false }))}
                    />
                    <small
                      className={`form-help-text ${formData.body && formData.body.length >= 300 ? "text-danger" : "text-muted"}`}
                    >
                      {formData.body ? formData.body.length : 0} / 300 characters
                    </small>
                    {errors.body && (
                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.body}
                        target="body"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                      >
                        <div className="one"></div>
                        {errors.body}
                      </Tooltip>
                    )}
                  </FormGroup>
                </Col>

                <Row>
                  <Col md="12">
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
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="impression_tracking_url">Impression Tracking URL <span className="valid">*</span></Label>
                      <Input
                        type="text"
                        id="impression_tracking_url"
                        name="impression_tracking_url"
                        value={formData.impression_tracking_url || ''}
                        onChange={handleChange}
                        invalid={!!errors.impression_tracking_url}
                        className="formscontrol"
                        onMouseEnter={() => errors.impression_tracking_url && setTooltipOpen((t) => ({ ...t, impression_tracking_url: true }))}
                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, impression_tracking_url: false }))}
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
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="brand_domain">Brand Domain <span className="valid">*</span></Label>
                      <Input
                        type="text"
                        id="brand_domain"
                        name="brand_domain"
                        value={formData.brand_domain || ''}
                        onChange={handleChange}
                        invalid={!!errors.brand_domain}
                        className="formscontrol"
                        onMouseEnter={() => errors.brand_domain && setTooltipOpen((t) => ({ ...t, brand_domain: true }))}
                        onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brand_domain: false }))}
                      />
                      {errors.brand_domain && (
                        <Tooltip
                          placement="bottom"
                          isOpen={tooltipOpen.brand_domain}
                          target="brand_domain"
                          autohide={false}
                          container=".modal-content"
                          popperClassName="custom-tooltip"
                        >
                          <div className="one"></div>
                          {errors.brand_domain}
                        </Tooltip>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                <Col md="12">
                  <Label for="brand_name">Brand Categories <span className="valid">*</span></Label>
                  <Button
                    color=""
                    size="md"
                    className={`w-100 choose ${errors.brand_categories ? 'border-danger' : ''}`}
                    onClick={togglebrandcategoryModal}
                    innerRef={brandCategoriesBtnRef}
                    onMouseEnter={() => errors.brand_categories && setTooltipOpen((t) => ({ ...t, brand_categories: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brand_categories: false }))}
                  >
                    Choose categories
                  </Button>
                  {selectedCountries.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap">
                      {selectedCountries.map((item, index) => (
                        <span key={index} className="country-tag me-2 mb-1">
                          {item}
                          <span
                            className="remove-tag ms-1"
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedCountries(selectedCountries.filter((c) => c !== item))}
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                  {errors.brand_categories && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.brand_categories}
                      target={brandCategoriesBtnRef}
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.brand_categories}
                    </Tooltip>
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
                <Button className="savebuttons" type="submit" style={{ backgroundColor: '#62903e', borderColor: '#62903e' }}>
                  Create Ad
                </Button>
                <Button className="cancels" color="secondary" onClick={toggle}>
                  Cancel
                </Button>
              </ModalFooter>
            </Col>
          </Row>
        </Form>
      </Modal>

      {isUploading && (
        <div className="loading">
          <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
        </div>
      )}
    </>
  );
};

export default NativeModal;
