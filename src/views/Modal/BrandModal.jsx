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
  Spinner,
  Form,
  Tooltip
} from "reactstrap";
import Swal from "sweetalert2";
import BrandcategoryModal from "./BrandcategoryModal.jsx";
import { saveBrand } from "../../views/api/Api.jsx";

const BrandModal = (props) => {
  const { isOpen, toggle, inventory: initialbrand, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);
  const [tooltipOpen, setTooltipOpen] = useState({
    brandName: false,
    brandDomain: false,
  });
  const [brandcategorysModalOpen, setBrandCategorysModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [categoriesDataMap, setCategoriesDataMap] = useState({});
  const [categoriesNameMap, setCategoriesNameMap] = useState({});

  const togglebrandcategorysModal = () => {
    setBrandCategorysModalOpen((prev) => !prev);
  };

  const [formData, setFormData] = useState({
    id: initialbrand?.id || "",
    brandName: initialbrand?.brandName || "",
    brandDomain: initialbrand?.brandDomain || "",
    notes: initialbrand?.notes || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const removeCategory = (category) => {
    setSelectedCategory(selectedCategory.filter((c) => c.id !== category.id));
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;
    const brandName = formData.brandName?.trim() || "";
    const branddomain = formData.brandDomain?.trim() || "";

    if (!brandName) {
      newErrors.brandName = "This field is required";
      isValid = false;
    }

    if (!branddomain) {
      newErrors.brandDomain = "This field is required";
      isValid = false;
    }

    setErrors(newErrors);

    if (newErrors.brandName && nameInputRef.current) {
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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const brandsubmit = async () => {
    const payload = {
      brandName: formData.brandName,
      brandDomain: formData.brandDomain,
      notes: formData.notes || "",
      brandCategory: selectedCategory.map((c) => c.id),
    };
    if (formData.id) {
      payload.id = formData.id;
    }

    const response = await saveBrand(payload);
    callback?.(response.data);
  };

  const addNewinventory = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: initialbrand?.id
        ? "Do you want to update this Brand List?"
        : "Do you want to save this Brand List?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: initialbrand?.id ? "Yes, update it!" : "Yes, save it!",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      await brandsubmit();

      await Swal.fire(
        "Success!",
        initialbrand?.id
          ? "Brand List has been updated."
          : "Brand has been created.",
        "success"
      );

      toggle();
    } catch (error) {
      Swal.fire("Error!", error.message || "Something went wrong.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: "",
        brandName: "",
        brandDomain: "",
        notes: "",
      });
      setErrors({});
      setSelectedCategory([]);
      setTooltipOpen({
        brandName: false,
        brandDomain: false,
      });
      setIsLoading(false);
    } else if (initialbrand) {
      setFormData({
        id: initialbrand.id || "",
        brandName: initialbrand.brandName || "",
        brandDomain: initialbrand.brandDomain || "",
        notes: initialbrand.notes || "",
      });
      if (initialbrand.brandCategory) {
        setSelectedCategory(initialbrand.brandCategory);
      }
    }
  }, [isOpen, initialbrand]);

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
        <Form onSubmit={addNewinventory} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
              <Col md="6">
                <h5 className="modal-title mb-0">
                  {initialbrand?.id ? "Edit Brand" : "New Brand"}
                </h5>
              </Col>
              <Col md="6" className="text-end">
                <Button close onClick={toggle}></Button>
              </Col>
            </Row>
          </div>

          <ModalBody className="pt-3 modal-body-scroll">
            {/* Name Field */}
            <Row className="">
              <Col md="12">
                <FormGroup>
                  <Label for="brandName">
                    Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="brandName"
                    name="brandName"
                    value={formData.brandName || ""}
                    onChange={handleChange}
                    invalid={!!errors.brandName}
                    className="formscontrol"
                    innerRef={nameInputRef}
                    onMouseEnter={() => errors.brandName && setTooltipOpen((t) => ({ ...t, brandName: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brandName: false }))}
                  />
                  {errors.brandName && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.brandName}
                      target="brandName"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.brandName}
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
                  <Label for="brandDomain">
                    Brand Domain <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="brandDomain"
                    name="brandDomain"
                    value={formData.brandDomain || ""}
                    onChange={handleChange}
                    invalid={!!errors.brandDomain}
                    className="formscontrol"
                    onMouseEnter={() => errors.brandDomain && setTooltipOpen((t) => ({ ...t, brandDomain: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, brandDomain: false }))}
                  />
                  {errors.brandDomain && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.brandDomain}
                      target="brandDomain"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.brandDomain}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
            </Row>

            {/* <Row>
              <Col md="12">
                <Label for="brand_name">
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
                    {selectedCategory.map((category) => (
                      <span
                        key={category.id}
                        className="country-tag me-2 mb-1"
                      >
                        {category.name}
                        <span
                          className="remove-tag ms-1"
                          style={{ cursor: "pointer" }}
                          onClick={() => removeCategory(category)}
                        >
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                )}

              
              </Col>
            </Row> */}

                   <Row>
                  <Col md="12">
                  <Label for="brand_name">
                    Brand Categories
                  </Label>
                  <Button
                    color=""
                    size="md"
                    className="w-100 choose "
                    onClick={togglebrandcategorysModal}
                  >
                    Choose categories
                  </Button>
                  {selectedCategory.length > 0 && (
                    <div className="mt-2 d-flex flex-wrap">
                      {selectedCategory
                        .filter((item) => Object.keys(categoriesDataMap).includes(item))
                        .map((item, index) => (
                        <span
                          key={index}
                          className="country-tag me-2 mb-1"
                        >
                          {categoriesNameMap[item] || item}
                          <span
                            className="remove-tag ms-1"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const children = categoriesDataMap[item] || [];
                              setSelectedCategory(selectedCategory.filter((c) => c !== item && !children.includes(c)));
                            }}
                          >
                            ×
                          </span>
                        </span>
                      ))}
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
                    invalid={!!errors.notes}
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
              {initialbrand?.id ? "Update Brand" : "Create Brand"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandModal;