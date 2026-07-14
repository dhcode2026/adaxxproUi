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
  FormFeedback,
  Spinner,
  Form,
  Tooltip
} from "reactstrap";
import Swal from "sweetalert2";
import { useViewContext } from "../../../../src/ViewContext.jsx";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import BrandcategoryModal from "../BrandcategoryModal.jsx";
import { saveBrand, updateBrand } from "../../api/Api.jsx"; 

const BrandModalEditor = (props) => {
  const { isOpen, toggle, inventory: initialBrand, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState("btn1"); 
  const [errors, setErrors] = useState({});
  const [remainingLines, setRemainingLines] = useState(2000);
  const context = useViewContext();
  const nameInputRef = useRef(null);
  const [tooltipOpen, setTooltipOpen] = useState({
    brand_name: false,
    brand_domain: false,
  });
  
  const [brandcategorysModalOpen, setBrandCategorysModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [categoriesDataMap, setCategoriesDataMap] = useState({});
  const [categoriesNameMap, setCategoriesNameMap] = useState({});
  
  const togglebrandcategorysModal = () => {
    setBrandCategorysModalOpen((prev) => !prev);
  };
  const [formData, setFormData] = useState({
    brandId: "", 
    brand_name: "",
    brand_domain: "",
    brand_category: "",
    notes: "",
  });

  useEffect(() => {
    if (initialBrand) {
      console.log("Setting form data from initialBrand:", initialBrand);
      

      let initialCategories = [];
      if (initialBrand.brand_category) {
        if (Array.isArray(initialBrand.brand_category)) {
          initialCategories = initialBrand.brand_category.map(id => ({ 
            id, 
            name: `Category ${id}` 
          }));
        } else if (typeof initialBrand.brand_category === 'string') {
       
          const ids = initialBrand.brand_category.split(',').map(id => id.trim()).filter(id => id);
          initialCategories = ids.map(id => ({ 
            id: parseInt(id), 
            name: `Category ${id}` 
          }));
        }
      }
      
      setSelectedCategory(initialCategories);
      
      setFormData({
        brandId: initialBrand.brandId || "",
        brand_name: initialBrand.brand_name || "",
        brand_domain: initialBrand.brand_domain || "",
        brand_category: initialBrand.brand_category || "",
        notes: initialBrand.notes || "",
      });
    } else {
  
      setSelectedCategory([]);
      setFormData({
        brandId: "", 
        brand_name: "",
        brand_domain: "",
        brand_category: "",
        notes: "",
      });
    }
  }, [initialBrand, isOpen]);


  useEffect(() => {
 
    const categoryIds = selectedCategory.map(category => category.id).join(',');
    setFormData(prev => ({
      ...prev,
      brand_category: categoryIds
    }));
  }, [selectedCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("Changing field:", name, "to:", value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const removeCategory = (category) => {
    setSelectedCategory(selectedCategory.filter((c) => c.id !== category.id));
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;
  
 
    const brandName = formData.brand_name?.trim() || "";
    const brandDomain = formData.brand_domain?.trim() || "";
    
    if (!brandName) {
      newErrors.brand_name = "This field is required";
      isValid = false;
    }
    
    if (!brandDomain) {
      newErrors.brand_domain = "This field is required";
      isValid = false;
    }
  
    setErrors(newErrors);
    
    if (newErrors.brand_name && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  
    if (!isValid) {
      await showValidationError();
    }
  
    return isValid;
  };

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

  const brandsubmit = async () => {
   
    const payload = {
      brand_name: formData.brand_name,
      brand_domain: formData.brand_domain,
      notes: formData.notes || "",
      brand_category: selectedCategory.map((c) => c.id), 
    };
    
    console.log("Submitting payload:", payload);
    
    let response;
    
    if (formData.brandId) { 
      response = await updateBrand(formData.brandId, payload);
    } else {
      response = await saveBrand(payload);
    }
    
    callback?.(response.data);
    return response;
  };

  const addNewInventory = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: formData.brandId  
        ? "Do you want to update this Brand?"
        : "Do you want to save this Brand?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: formData.brandId ? "Yes, update it!" : "Yes, save it!",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await brandsubmit();

      await Swal.fire(
        "Success!",
        formData.brandId 
          ? "Brand has been updated."
          : "Brand has been created.",
        "success"
      );

      toggle();
    } catch (error) {
      console.error("Error saving brand:", error);
      Swal.fire(
        "Error!", 
        error.response?.data?.message || error.message || "Something went wrong.", 
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        id="brandmodal"
        size="lg"
        backdrop="static"
        keyboard={false}
        onOpened={() => nameInputRef.current?.focus()}
      >
        <Form onSubmit={addNewInventory} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
              <Col md="6">
                <h5 className="modal-title mb-0">
                  {formData.brandId ? "Edit Brand" : "New Brand"}  
                </h5>
              </Col>
              <Col md="6" className="text-end">
                <Button close onClick={toggle}></Button>
              </Col>
            </Row>
          </div>

          <ModalBody className="pt-3 modal-body-scroll">
            {/* Brand Name Field */}
            <Row className="">
              <Col md="12">
                <FormGroup>
                  <Label for="brand_name">
                    Brand Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="brand_name"
                    name="brand_name"
                    value={formData.brand_name || ""}
                    onChange={handleChange}
                    invalid={!!errors.brand_name}
                    className="formscontrol"
                    innerRef={nameInputRef}
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
              </Col>
            </Row>

            <Row>
              <Col md="12">
                <span className="branddomain">
                  Brand domain and categories entered here will be assigned to all ads created in this brand.
                </span>
              </Col>
            </Row>

            <Row className="mt-2">
              <Col md="12">
                <FormGroup>
                  <Label for="brand_domain">
                    Brand Domain <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="brand_domain"
                    name="brand_domain"
                    value={formData.brand_domain || ""}
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

            <Row>
              <Col md="12">
                <Label for="brand_category">
                  Brand Categories
                </Label>
                <Button
                  color=""
                  size="md"
                  className="w-100 choose"
                  onClick={togglebrandcategorysModal}
                >
                  Choose categories
                </Button>
                {selectedCategory.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap">
                    {selectedCategory
                      .filter((item) => {
                        const val = typeof item === 'string' ? item : item.name || item.id;
                        return Object.keys(categoriesDataMap).includes(val);
                      })
                      .map((category, index) => {
                        const displayName = categoriesNameMap[typeof category === 'string' ? category : (category.name || category.id)] || (typeof category === 'string' ? category : (category.name || `Category ${category.id}`));
                        return (
                          <span
                            key={index}
                            className="country-tag me-2 mb-1"
                          >
                            {displayName}
                            <span
                              className="remove-tag ms-1"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                const val = typeof category === 'string' ? category : (category.name || category.id);
                                const children = categoriesDataMap[val] || [];
                                setSelectedCategory(selectedCategory.filter((c) => {
                                  const v = typeof c === 'string' ? c : (c.name || c.id);
                                  return v !== val && !children.includes(v);
                                }));
                              }}
                            >
                              ×
                            </span>
                          </span>
                        );
                      })}
                  </div>
                )}

                <BrandcategoryModal
                  modalOpen={brandcategorysModalOpen}
                  toggleModal={togglebrandcategorysModal}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onCategoriesLoaded={(dataMap, nameMap) => {
                    setCategoriesDataMap(dataMap);
                    setCategoriesNameMap(nameMap);
                  }}
                />
              </Col>
            </Row>

            <Row className="mt-2">
              <Col md="12">
                <FormGroup>
                  <Label for="notes">
                    Notes
                  </Label>
                  <Input
                    type="textarea"
                    id="notes"
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    className="formscontrol"
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter>
            <Button className="cancels" onClick={toggle}>
              Close
            </Button>
            <Button className="savebuttons" type="submit" disabled={isLoading} color="success">
              {isLoading ? (
                <Spinner size="sm" />
              ) : formData.brandId ? (  
                "Update Brand"
              ) : (
                "Create Brand"
              )}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandModalEditor;