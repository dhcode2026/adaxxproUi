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
  Tooltip,
  Form,
} from "reactstrap";
import Swal from "sweetalert2";
import { useViewContext } from "../../ViewContext";
import { saveAddon, updateAddon } from "../../views/api/Api.jsx";
import { canCreate, canUpdate} from "../../utils/permissionHelper.js";
import "../editors/campcreate.css";

const AddonModal = (props) => {
  const { isOpen, toggle, audience: initialAddon, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const context = useViewContext();
  const nameInputRef = useRef(null);

  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    serviceProvider: false,
    addOnAmount: false,
  });
  const [addonCreateUser, setAddonCreateUser] = useState(false);
  const [addonUpdateUser, setAddonUpdateUser] = useState(false);
  const addonConfirmClasses = {
    popup: "campaign-save-swal-popup",
    title: "campaign-save-swal-title",
    htmlContainer: "campaign-save-swal-message",
    actions: "campaign-save-swal-actions",
    confirmButton: "campaign-save-swal-confirm",
    cancelButton: "campaign-save-swal-cancel",
  };

  const showAddonAlert = async (title, text, icon) => {
    await Swal.fire({
      title,
      text,
      icon,
      iconColor: icon === "error" ? "#ef4444" : "#22c55e",
      showConfirmButton: true,
      showCancelButton: false,
      confirmButtonText: "OK",
      buttonsStyling: false,
      customClass: addonConfirmClasses,
      width: 520,
      allowOutsideClick: true,
      didOpen: () => {
        Swal.getCancelButton()?.remove();
      },
    });
  };

  const [formData, setFormData] = useState({
    id: initialAddon?.id || "",
    name: initialAddon?.name || "",
    addOnAmount: initialAddon?.addOnAmount || "0.00",
    serviceProvider: initialAddon?.serviceProvider || "",
    addOnType: initialAddon?.addOnType || "CPM",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: "",
        name: "",
        addOnAmount: "0.00",
        serviceProvider: "",
        addOnType: "CPM",
      });
      setErrors({});
      setTooltipOpen({
        name: false,
        serviceProvider: false,
        addOnAmount: false,
      });
      setIsLoading(false);
    } else if (initialAddon) {
      setFormData({
        id: String(initialAddon.id || ""),
        name: String(initialAddon.name || ""),
        addOnAmount: String(initialAddon.addOnAmount || "0.00"),
        serviceProvider: String(initialAddon.serviceProvider || ""),
        addOnType: String(initialAddon.addOnType || "CPM"),
      });
    }
  }, [isOpen, initialAddon]);
        useEffect(() => {
          const hasCreatePermission = canCreate("Add-On");
          const hasUpdatePermission = canUpdate("Add-On");
          setAddonCreateUser(hasCreatePermission);
          setAddonUpdateUser(hasUpdatePermission);
        }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'addOnAmount' ? String(value) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!String(formData.name || '').trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!String(formData.serviceProvider || '').trim()) {
      newErrors.serviceProvider = "Service Provider is required";
      isValid = false;
    }

    const amountStr = String(formData.addOnAmount || '');
    if (!amountStr.trim()) {
      newErrors.addOnAmount = "Add-On Amount is required";
      isValid = false;
    } else if (isNaN(parseFloat(amountStr))) {
      newErrors.addOnAmount = "Add-On Amount must be a valid number";
      isValid = false;
    }

    setErrors(newErrors);
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
    });
  };

  const submitAddon = async () => {
    const payload = {
      name: String(formData.name || '').trim(),
      serviceProvider: String(formData.serviceProvider || '').trim() || null,
      addOnAmount: String(formData.addOnAmount || '').trim(),
      addOnType: String(formData.addOnType || '').trim(),
    };
    try {
      if (!formData.id) {
        const response = await saveAddon(payload);
        callback?.(response.data);
        return response.data;
      } else {
        const response = await updateAddon(formData.id, payload);
        callback?.(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      await showValidationError();
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: formData.id
        ? "Do you want to update this Add-On?"
        : "Do you want to save this Add-On?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: formData.id ? "Yes, update it!" : "Yes, save it!",
      cancelButtonText: "Cancel",
      iconColor: "#fbbf24",
      buttonsStyling: false,
      customClass: addonConfirmClasses,
      width: 520,
      allowOutsideClick: true,
    });

    if (!result.isConfirmed) return;
 
    setIsLoading(true);

    try {
      const savedData = await submitAddon();
      await showAddonAlert(
        "Success!",
        formData.id
          ? "Add-On has been updated successfully."
          : "Add-On has been created successfully.",
        "success"
      );
      if (callback) {
        callback(savedData);
      }
      toggle();
    } catch (error) {
      console.error("Error saving addon:", error);
      await showAddonAlert(
        "Error!",
        error.response?.data?.message || "Something went wrong. Please try again.",
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
        id="addonmodal"
        size="lg"
        backdrop="static"
        keyboard={false}
        onOpened={() => nameInputRef.current?.focus()}
      >
        <Form onSubmit={handleSubmit}>
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary domain-modal-spinner" />
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
              <Col md="6">
                <h5 className="modal-title mb-0">
                  {initialAddon?.id ? "Edit Add-On" : "New Add-On"}
                </h5>
              </Col>
              <Col md="6" className="text-end">
                <Button close onClick={toggle}></Button>
              </Col>
            </Row>
          </div>

          <ModalBody className="pt-3 addonsmodal">
            {/* Name Field */}
            <Row className="">
              <Col md="12">
                <FormGroup>
                  <Label for="name">
                    Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    invalid={!!errors.name}
                    className="formscontrol"
                    innerRef={nameInputRef}
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
                  <Label for="serviceProvider">
                    Service Provider <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="serviceProvider"
                    name="serviceProvider"
                    value={formData.serviceProvider || ""}
                    onChange={handleChange}
                    invalid={!!errors.serviceProvider}
                    className="formscontrol"
                    onMouseEnter={() => errors.serviceProvider && setTooltipOpen((t) => ({ ...t, serviceProvider: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, serviceProvider: false }))}
                  />
                  {errors.serviceProvider && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.serviceProvider}
                      target="serviceProvider"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.serviceProvider}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="4">
                <FormGroup>
                  <Label for="addOnAmount">
                    Add-On Amount <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="addOnAmount"
                    name="addOnAmount"
                    value={formData.addOnAmount}
                    onChange={handleChange}
                    invalid={!!errors.addOnAmount}
                    className="formscontrol"
                    onMouseEnter={() => errors.addOnAmount && setTooltipOpen((t) => ({ ...t, addOnAmount: true }))}
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, addOnAmount: false }))}
                  />
                  {errors.addOnAmount && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.addOnAmount}
                      target="addOnAmount"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.addOnAmount}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
              <Col md="1" className="mt-2">
                <span className="cpm">CPM</span>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter>
            <Button className="cancels" onClick={toggle}>
              Cancel
            </Button>
            {((formData.id && addonUpdateUser) || (!formData.id && addonCreateUser)) && (
              <Button
                className="savebuttons"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {formData.id ? 'Updating...' : 'Creating...'}
                  </>
                ) : formData.id ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            )}
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AddonModal;
