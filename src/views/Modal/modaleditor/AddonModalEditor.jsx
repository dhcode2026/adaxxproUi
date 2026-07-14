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
import { useViewContext } from "../../../../src/ViewContext.jsx";
import { saveAddon, updateAddon } from "../../api/Api.jsx";

const AddonModalEditor = (props) => {
  const { isOpen, toggle, inventory: initialaddons, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const context = useViewContext();
  const nameInputRef = useRef(null);
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    service_provider: false,
    add_on_amount: false,
  });

  const [formData, setFormData] = useState({
    id: initialaddons?.id || "",
    name: initialaddons?.name || "",
    add_on_amount: initialaddons?.add_on_amount?.toString() || "0.00",
    service_provider: initialaddons?.service_provider || "",
    add_on_type: "Cpm",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: "",
        name: "",
        add_on_amount: "",
        service_provider: "",
        add_on_type: "Cpm",
      });
      setErrors({});
      setTooltipOpen({
        name: false,
        add_on_amount: false,
        service_provider: false,
      });
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialaddons) {
      setFormData({
        id: initialaddons.id || initialaddons.addonsId || "",
        name: initialaddons.name || "",
        service_provider: initialaddons.service_provider || "",
        add_on_amount: initialaddons.add_on_amount?.toString() || "",
        add_on_type: initialaddons.add_on_type || "Cpm",
      });
    }
  }, [initialaddons]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, uploadFile: e.target.files[0] }));
    setErrors((prev) => ({ ...prev, uploadFile: "" }));
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;
    
    const Name = formData.name?.trim() || "";
    const serviceprovider = formData.service_provider?.trim() || "";
    const addamount = formData.add_on_amount?.toString().trim() || "";

    if (!Name) {
      newErrors.name = "This field is required";
      isValid = false;
    }
    if (!serviceprovider) {
      newErrors.service_provider = "This field is required";
      isValid = false;
    }
    if (!addamount) {
      newErrors.add_on_amount = "This field is required";
      isValid = false;
    }

    setErrors(newErrors);
    
    if (newErrors.name && nameInputRef.current) {
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

const submitAddon = async () => {
  const hasId = initialaddons?.id || initialaddons?.addonsId || formData.id;
  
  const payload = {
    name: formData.name,
    service_provider: formData.service_provider,
    add_on_amount: parseFloat(formData.add_on_amount) || 0,
    add_on_type: formData.add_on_type,
  };

  if (hasId) {
    const addonsId = initialaddons?.addonsId || initialaddons?.id || formData.id;
    const res = await updateAddon(addonsId, payload);
    callback?.(res.data);
  } else {
    const res = await saveAddon(payload);
    callback?.(res.data);
  }
};

  const addNewaddons = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: (initialaddons?.id || initialaddons?.addonsId)
        ? "Do you want to update this AddOns List?"
        : "Do you want to save this Addons List?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: (initialaddons?.id || initialaddons?.addonsId) ? "Yes, update it!" : "Yes, save it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    try {
      await submitAddon();
      await delay(800);
      const successResult = await Swal.fire(
        "Success!",
        (initialaddons?.id || initialaddons?.addonsId)
          ? "Add Ons List has been updated."
          : "Add Ons List has been created.",
        "success"
      );
      if (successResult.isConfirmed) {
        toggle();
      }
    } catch (error) {
      Swal.fire("Error!", "Something went wrong.", "error");
      console.error(error);
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
        <Form onSubmit={addNewaddons}>
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary domain-modal-spinner"/>
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
              <Col md="6">
                <h5 className="modal-title mb-0">
                  {(initialaddons?.id || initialaddons?.addonsId) ? "Edit New Add-On" : "New Add-On"}
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
                  <Label for="service_provider">
                    Service Provider <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="service_provider"
                    name="service_provider"
                    value={formData.service_provider || ""}
                    onChange={handleChange}
                    invalid={!!errors.service_provider}
                    className="formscontrol"
                    onMouseEnter={() =>
                      errors.service_provider &&
                      setTooltipOpen((t) => ({ ...t, service_provider: true }))
                    }
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, service_provider: false }))}
                  />
                  {errors.service_provider && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.service_provider}
                      target="service_provider"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.service_provider}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md="4">
                <FormGroup>
                  <Label for="add_on_amount">
                    Add-On Amount <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="add_on_amount"
                    name="add_on_amount"
                    value={formData.add_on_amount || ""}
                    onChange={handleChange}
                    invalid={!!errors.add_on_amount}
                    className="formscontrol"
                    onMouseEnter={() =>
                      errors.add_on_amount &&
                      setTooltipOpen((t) => ({ ...t, add_on_amount: true }))
                    }
                    onMouseLeave={() => setTooltipOpen((t) => ({ ...t, add_on_amount: false }))}
                  />
                  {errors.add_on_amount && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.add_on_amount}
                      target="add_on_amount"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one"></div>
                      {errors.add_on_amount}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
              <Col md="1" className="mt-2">
                <Label for="service_provider"></Label>
                <span className="cpm">CPM</span>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter>
            <Button className="cancels" onClick={toggle}>
              Cancel
            </Button>
            <Button className="savebuttons" type="submit" disabled={isLoading} color="success">
              {(initialaddons?.id || initialaddons?.addonsId) ? "Update" : "Save"}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AddonModalEditor;