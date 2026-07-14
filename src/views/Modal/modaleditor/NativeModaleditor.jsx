import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Input,
  Label,
  Row,
  Col,
  Tooltip,
  Spinner,
  Form
} from 'reactstrap';
import Swal from 'sweetalert2';
import BrandcategoriesModal from "../BrandcategoriesModal.jsx";
import { useViewContext } from "../../../ViewContext.jsx";
import { updatecreative,editcreatives } from "../../../views/api/Api.jsx";
import { canUpdate } from "../../../utils/permissionHelper.js";
const NativeModaleditor = ({ isOpen, toggle, native: initialNative, callback, brand_id: propBrandId }) => {
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
  });

  const effectiveBrandId = initialNative?.brand_id || propBrandId || "";
  const [formData, setFormData] = useState({
    name: '',
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
    htmltemplate: 'dighir',
    status: '0',
    cta_text: '',
    sponsored_label: '',
    icon_logo: '',
    media_type: 'upload',
    contenttype: '',
    position: 'top',
    width_height_list: '',
    width_range: '',
    height_range: '',
    brand_id: effectiveBrandId,
  });
  const [myimage, setMyImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [ctaHover, setCtaHover] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const brandCategoriesBtnRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [brandcategoryModalOpen, setBrandCategoryModalOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
  const [nativeUpdateUser, setNativeUpdateUser] = useState(false);
  const vx = useViewContext();
  const getCreativeId = (item) => item?.id || item?.creativesId || "";
  useEffect(() => {
    if (initialNative) {
      console.log("Initial native data:", initialNative);
      setFormData({
        id: initialNative.id || '',
        name: initialNative.name || '',
        image: initialNative.image || '',
        impression_tracking_url: initialNative.impressionTrackingUrl || '',
        destination_url: initialNative.destinationUrl || '',
        brand_domain: initialNative.brandDomain || '',
        brand: initialNative.brand || '',
        head_line: initialNative.headLine || '',
        body: initialNative.body || '',
        image_url: initialNative.imageUrl || '',
        cta_text: initialNative.ctaText || '',
        sponsored_label: initialNative.sponsoredLabel || '',
        media_type: initialNative.mediaType || 'upload',
        video: initialNative.video || '',
        icon_logo: initialNative.iconLogo || '',
        width_height_list: initialNative.widthHeightList || '',
        width_range: initialNative.widthRange || '',
        height_range: initialNative.heightRange || '',
        brand_id: initialNative.brand_id || propBrandId || "",
      });
      if (initialNative.image) setMyImage(initialNative.image);
      if (initialNative.iconLogo) setLogoImage(initialNative.iconLogo);
      if (initialNative.video) setUploadedVideo(initialNative.video);
    }
  }, [initialNative, propBrandId]);

  useEffect(() => {
    if (isOpen && getCreativeId(initialNative)) {
      fetchNativeDetails(getCreativeId(initialNative));
    }
  }, [isOpen, initialNative]);

  const fetchNativeDetails = async (id) => {
    setIsFetching(true);
    try {
      const response = await editcreatives(id);
      if (response.data?.status === 200 && response.data.data?.informationCreatives?.length > 0) {
        const nativeData = response.data.data.informationCreatives[0];
        setFormData({
          id: nativeData.creativesId,
          name: nativeData.name || '',
          image: nativeData.image || '',
          image_url: nativeData.imageUrl || '',
          video: nativeData.video || '',
          video_url: nativeData.videoUrl || '',
          destination_url: nativeData.destinationUrl || '',
          impression_tracking_url: nativeData.impressionTrackingUrl || '',
          brand_domain: nativeData.brandDomain || '',
          brand: nativeData.brand || '',
          head_line: nativeData.headLine || '',
          body: nativeData.body || '',
          bid_ecpm: nativeData.bidEcpm?.toString() || '0',
          htmltemplate: nativeData.htmltemplate || 'dighir',
          status: nativeData.status || '0',
          cta_text: nativeData.ctaText || '',
          sponsored_label: nativeData.sponsoredLabel || '',
          icon_logo: nativeData.iconLogo || '',
          media_type: nativeData.mediaType || 'upload',
          contenttype: nativeData.contenttype || '',
          position: nativeData.position || '',
          width_height_list: nativeData.widthHeightList || '',
          width_range: nativeData.widthRange || '',
          height_range: nativeData.heightRange || '',
          brand_id: effectiveBrandId,
        });

     

        // Set previews
        if (nativeData.image) setMyImage(nativeData.image);
        if (nativeData.iconLogo) setLogoImage(nativeData.iconLogo);
        if (nativeData.video) setUploadedVideo(nativeData.video);

           console.log("Native API data:", nativeData);

        setSelectedCountries(
          Array.isArray(nativeData.brandCategory) ? nativeData.brandCategory : [],
        );
      }
    } catch (error) {
      console.error("Failed to fetch native details", error);
      Swal.fire("Error", "Failed to load native details", "error");
    } finally {
      setIsFetching(false);
    }
  };

   useEffect(() => {
      if (selectedCountries.length > 0 && errors.brandCategory) {
        setErrors((prev) => ({ ...prev, brandCategory: null }));
        setTooltipOpen((prev) => ({ ...prev, brandCategory: false }));
      }
    }, [selectedCountries]);

  useEffect(() => {
    setNativeUpdateUser(canUpdate("Creatives"));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'width_height_list') {
      const selectedBanner = vx.bannersize?.find(b => b.id.toString() === value);
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

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const togglebrandcategoryModal = () => setBrandCategoryModalOpen(prev => !prev);
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
          if (!formData.image?.trim()) {
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
          if (!formData.video?.trim()) {
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
      newErrors.impression_tracking_url = "Please enter a valid Impression URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }
    if (!formData.destination_url?.trim()) {
      newErrors.destination_url = "This field is required";
      isValid = false;
    } else if (!urlRegex.test(formData.destination_url.trim())) {
      newErrors.destination_url = "Please enter a valid Click URL (e.g., https://up.gov.in/en)";
      isValid = false;
    }

    if (!formData.brand_domain?.trim()) {
      newErrors.brand_domain = "This field is required";
      isValid = false;
    } else if (!domainRegex.test(formData.brand_domain.trim())) {
      newErrors.brand_domain = "Please enter a valid domain";
      isValid = false;
    }
    if (!formData.icon_logo) {
      newErrors.icon_logo = "Logo is required";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) {
      await Swal.fire({
        html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_small.png" style="width: 18px; height: 18px;" />
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
    }
    return isValid;
  };
 const nativeSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        type: "native",
        mediaType: formData.media_type,
        position: formData.position,
        brandName: formData.brand,          
        brandDomain: formData.brand_domain, 
        brand: formData.brand,
        image: formData.media_type === 'upload' ? formData.image : '',
        imageUrl: formData.media_type === 'url' ? formData.image_url : '',
        video: formData.media_type === 'video' && formData.video ? formData.video : '',
        videoUrl: formData.media_type === 'video' && formData.video_url ? formData.video_url : '',
        iconLogo: formData.icon_logo,
        headLine: formData.head_line,
        body: formData.body,
        ctaText: formData.cta_text,
        sponsoredLabel: formData.sponsored_label,
        destinationUrl: formData.destination_url,
        impressionTrackingUrl: formData.impression_tracking_url,
        widthHeightList: formData.width_height_list,
        widthRange: formData.width_range,
        heightRange: formData.height_range,
        bid_ecpm: Number(formData.bid_ecpm),
        status: formData.status,
        htmltemplate: formData.htmltemplate,
        contenttype: formData.contenttype,
        brandCategory: selectedCountries, // Include brand categories
      };
      if (formData.id) {
        const response = await updatecreative(formData.id, payload);
        if (response.status === 200 || response.data?.status === 200) {
          if (callback) callback(response.data?.data || response.data);
          return { error: false };
        } else {
          return { error: true, message: response.data?.message || "Update failed" };
        }
      } else {
        const newId = await vx.addNewCreative(payload);
        if (newId) {
          if (callback) callback({ ...payload, id: newId });
          return { error: false };
        } else {
          return { error: true, message: "Failed to create native ad" };
        }
      }
    } catch (err) {
      console.error("nativeSubmit error:", err);
      return { error: true, message: err.response?.data?.message || "Unexpected error during submission." };
    }
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
        Swal.fire('Saved!', 'Native has been saved.', 'success');
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
            <Col md="6" className="d-flex justify-content-center align-items-center" style={{ margin: 0, padding: 0, backgroundColor: "#f5f5f5" }}>
              <div style={{ width: "100%", maxWidth: "300px", border: "1px solid #ddd", padding: "12px", boxSizing: "border-box", margin: "0 auto", backgroundColor: "#fff" }}>

                <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#e4e4e4", border: "1px solid #eee", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {formData.media_type === "upload" && myimage ? (
                    <img src={myimage} alt="Banner Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : formData.media_type === "url" && formData.image_url ? (
                    <img src={formData.image_url} alt="Banner Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : formData.media_type === "video" && uploadedVideo ? (
                    <video width="100%" height="100%" controls style={{ objectFit: "contain", borderRadius: "4px" }}>
                      <source src={uploadedVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <span style={{ color: "#aaa", fontSize: "12px" }}>No Media</span>
                  )}

                  {/* Logo */}
                  {logoImage && (
                    <img src={logoImage} alt="Logo Preview" style={{ position: "absolute", top: "5px", right: "10px", width: "50px", height: "50px", objectFit: "contain", padding: "3px" }} />
                  )}

                  {/* CTA Button */}
                  {formData.cta_text && (
                    <a href={formData.destination_url || "#"} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: "10px", right: "10px", padding: "4px 8px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)", backgroundColor: ctaHover ? "rgb(98, 144, 62)" : "white", color: ctaHover ? "white" : "rgb(98, 144, 62)", border: `1px solid ${ctaHover ? "rgb(80, 120, 50)" : "rgb(98, 144, 62)"}`, borderRadius: "0", fontSize: "12px", textDecoration: "none", display: "inline-block", wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal", transition: "all 0.3s ease" }}
                      onMouseEnter={() => setCtaHover(true)}
                      onMouseLeave={() => setCtaHover(false)}
                      onClick={(e) => !formData.destination_url && e.preventDefault()}
                    >
                      {formData.cta_text}
                    </a>
                  )}
                </div>

                {/* Headline */}
                <h4 style={{ marginTop: "10px", fontSize: "16px", fontWeight: "600", color: "#333", wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                  {formData.head_line || " "}
                </h4>

                {/* Body */}
                <p style={{ fontSize: "14px", color: "#666", margin: "4px 0 0", wordWrap: "break-word", overflowWrap: "break-word", whiteSpace: "normal" }}>
                  {formData.body || " "}
                </p>
              </div>
            </Col>

            <Col md="6">
              <div className="modal-header border-bottom">
                <Row className="w-100 align-items-center m-0">
                  <Col md="6">
                    <h5 className="modal-title mb-0">{initialNative?.id ? 'Edit Native Ad' : 'New Native Ad'}</h5>
                  </Col>
                  <Col md="6" className="text-end">
                    <Button close onClick={toggle} />
                  </Col>
                </Row>
              </div>

              <ModalBody className="pt-3 modal-body-scroll">

                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="name">Name <span className="text-danger">*</span></Label>
                      <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} invalid={!!errors.name} className="formscontrol"
                        onMouseEnter={() => errors.name && setTooltipOpen(t => ({ ...t, name: true }))}
                        onMouseLeave={() => setTooltipOpen(t => ({ ...t, name: false }))}
                      />
                      {errors.name && (
                        <Tooltip placement="bottom" isOpen={tooltipOpen.name} target="name" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
                          <div className="one"></div>
                          {errors.name}
                        </Tooltip>
                      )}
                    </FormGroup>
                  </Col>

                  <Col md="12">
                    <FormGroup>
                      <Label for="brand">Brand</Label>
                      <Input type="text" id="brand" name="brand" value={formData.brand} onChange={handleInputChange} className="formscontrol" />
                      <small className="form-help-text">25 character limit. Brand name will appear on the ad.</small>
                    </FormGroup>
                  </Col>

                  <FormGroup>
                    <Label for="cta_text">CTA (Call-to-Action) <span className="text-danger">*</span></Label>
                    <Input type="text" id="cta_text" name="cta_text" value={formData.cta_text || ""} onChange={handleInputChange} invalid={!!errors.cta_text} maxLength={20} className="formscontrol"
                      onMouseEnter={() => errors.cta_text && setTooltipOpen(t => ({ ...t, cta_text: true }))}
                      onMouseLeave={() => setTooltipOpen(t => ({ ...t, cta_text: false }))}
                    />
                    {errors.cta_text && (
                      <Tooltip placement="bottom" isOpen={tooltipOpen.cta_text} target="cta_text" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
                        <div className="one"></div>
                        {errors.cta_text}
                      </Tooltip>
                    )}
                    <small className={`form-help-text ${formData.cta_text?.length >= 20 ? "text-danger" : "text-muted"}`}>
                      {formData.cta_text?.length || 0} / 20 characters
                    </small>
                  </FormGroup>

                  <FormGroup>
                    <Label for="sponsored_label">Sponsored Label <span className="text-danger">*</span></Label>
                    <Input type="text" id="sponsored_label" name="sponsored_label" value={formData.sponsored_label} onChange={handleChange} invalid={!!errors.sponsored_label} className="formscontrol"
                      onMouseEnter={() => errors.sponsored_label && setTooltipOpen(t => ({ ...t, sponsored_label: true }))}
                      onMouseLeave={() => setTooltipOpen(t => ({ ...t, sponsored_label: false }))}
                    />
                    {errors.sponsored_label && (
                      <Tooltip placement="bottom" isOpen={tooltipOpen.sponsored_label} target="sponsored_label" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
                        <div className="one"></div>
                        {errors.sponsored_label}
                      </Tooltip>
                    )}
                  </FormGroup>

                  <Col md="12">
                    <FormGroup>
                      <Label for="head_line">Headline <span className="text-danger">*</span></Label>
                      <Input type="text" id="head_line" name="head_line" value={formData.head_line} onChange={handleChange} invalid={!!errors.head_line} className="formscontrol" maxLength={80}
                        onMouseEnter={() => errors.head_line && setTooltipOpen(t => ({ ...t, head_line: true }))}
                        onMouseLeave={() => setTooltipOpen(t => ({ ...t, head_line: false }))}
                      />
                      <small className={`form-help-text ${formData.head_line?.length >= 80 ? "text-danger" : "text-muted"}`}>
                        {formData.head_line?.length || 0} / 80 characters
                      </small>
                      {errors.head_line && (
                        <Tooltip placement="bottom" isOpen={tooltipOpen.head_line} target="head_line" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
                          <div className="one"></div>
                          {errors.head_line}
                        </Tooltip>
                      )}
                    </FormGroup>
                  </Col>

                  <Col md="12">
                    <FormGroup>
                      <Label for="body">Body <span className="text-danger">*</span></Label>
                      <Input type="textarea" id="body" name="body" value={formData.body} onChange={handleInputChange} invalid={!!errors.body} maxLength={300}
                        onMouseEnter={() => errors.body && setTooltipOpen(t => ({ ...t, body: true }))}
                        onMouseLeave={() => setTooltipOpen(t => ({ ...t, body: false }))}
                      />
                      <small className={`form-help-text ${formData.body?.length >= 300 ? "text-danger" : "text-muted"}`}>
                        {formData.body?.length || 0} / 300 characters
                      </small>
                      {errors.body && (
                        <Tooltip placement="bottom" isOpen={tooltipOpen.body} target="body" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
                          <div className="one"></div>
                          {errors.body}
                        </Tooltip>
                      )}
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md="12">
                    <FormGroup>
                      <Label for="destination_url">Click URL <span className="valid">*</span></Label>
                      <Input type="text" id="destination_url" name="destination_url" value={formData.destination_url} onChange={handleChange} invalid={!!errors.destination_url} className="formscontrol"
                        onMouseEnter={() => errors.destination_url && setTooltipOpen(t => ({ ...t, destination_url: true }))}
                        onMouseLeave={() => setTooltipOpen(t => ({ ...t, destination_url: false }))}
                      />
                      {errors.destination_url && (
                        <Tooltip placement="bottom" isOpen={tooltipOpen.destination_url} target="destination_url" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
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
                      <Input type="text" id="impression_tracking_url" name="impression_tracking_url" value={formData.impression_tracking_url} onChange={handleChange} invalid={!!errors.impression_tracking_url} className="formscontrol"
                        onMouseEnter={() => errors.impression_tracking_url && setTooltipOpen(t => ({ ...t, impression_tracking_url: true }))}
                        onMouseLeave={() => setTooltipOpen(t => ({ ...t, impression_tracking_url: false }))}
                      />
                      {errors.impression_tracking_url && (
                        <Tooltip placement="bottom" isOpen={tooltipOpen.impression_tracking_url} target="impression_tracking_url" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
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
                      <Input type="text" id="brand_domain" name="brand_domain" value={formData.brand_domain} onChange={handleChange} invalid={!!errors.brand_domain} className="formscontrol"
                        onMouseEnter={() => errors.brand_domain && setTooltipOpen(t => ({ ...t, brand_domain: true }))}
                        onMouseLeave={() => setTooltipOpen(t => ({ ...t, brand_domain: false }))}
                      />
                      {errors.brand_domain && (
                        <Tooltip placement="bottom" isOpen={tooltipOpen.brand_domain} target="brand_domain" autohide={false} container=".modal-content" popperClassName="custom-tooltip">
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
              </ModalBody>

              <ModalFooter>
                {initialNative?.id && nativeUpdateUser && (
                  <Button className="savebuttons" type="submit">
                    Update Ad
                  </Button>
                )}
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

export default NativeModaleditor;
