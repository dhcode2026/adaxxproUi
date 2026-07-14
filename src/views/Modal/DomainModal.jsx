import React, { useState, useEffect } from "react";
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
import { useViewContext } from "../../ViewContext";
import { saveDomain, updatedomain } from "../../views/api/Api.jsx";
import { canCreate, canUpdate} from "../../utils/permissionHelper.js";
import "../editors/campcreate.css";

const DomainModal = (props) => {
  const { isOpen, toggle, audience: initialAudience, callback } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState("btn1");
  const [errors, setErrors] = useState({});
  const [remainingLines, setRemainingLines] = useState(2000);
  const defaultDomains = ``;
        const [domainCreateUser, setDomainCreateUser] = useState(false);
        const [domainUpdateUser, setDomainUpdateUser] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    domain_name: false,
    uploadFile: false,
  });
  const [formData, setFormData] = useState({
    id: initialAudience?.id || "",
    name: initialAudience?.name || "",
    list_type: initialAudience?.list_type ?? "allowlist",
    domain_name: initialAudience?.domain_name || defaultDomains,
    uploadFile: null,
    uploadFileDomains: []
  });
      useEffect(() => {
        const hasCreatePermission = canCreate("Domain List");
        const hasUpdatePermission = canUpdate("Domain List");
        setDomainCreateUser(hasCreatePermission);
        setDomainUpdateUser(hasUpdatePermission);
      }, []);

  useEffect(() => {
    if (isOpen && initialAudience) {
      setFormData({
        id: initialAudience.id || "",
        name: initialAudience.name || "",
        list_type: initialAudience.list_type || (initialAudience.listType === "ALLOWLIST" ? "allowlist" : "blocklist"),
        domain_name: initialAudience.domain_name || initialAudience.domains || defaultDomains,
        uploadFile: null,
        uploadFileDomains: []
      });
    } else if (!isOpen) {
      setFormData({
        id: "",
        name: "",
        list_type: "allowlist",
        domain_name: defaultDomains,
        uploadFile: null,
        uploadFileDomains: []
      });
      setErrors({});
      setSelected("btn1");
      setRemainingLines(2000);
    }
  }, [isOpen, initialAudience]);

  useEffect(() => {
    if (!formData.domain_name) {
      setRemainingLines(2000);
      return;
    }
    const domainCount = formData.domain_name
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0).length;

    setRemainingLines(2000 - domainCount);
  }, [formData.domain_name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['text/plain', 'text/csv', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|csv)$/i)) {
      setErrors((prev) => ({ ...prev, uploadFile: "File must be TXT or CSV" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, uploadFile: "File size must be less than 10MB" }));
      return;
    }
    setIsLoading(true);
    try {
      const text = await readFileAsText(file);
      const domains = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .slice(0, 100000);

      if (domains.length === 0) {
        setErrors((prev) => ({ ...prev, uploadFile: "No valid domains found in file" }));
      } else if (domains.length > 100000) {
        setErrors((prev) => ({ ...prev, uploadFile: "File contains more than 100,000 domains" }));
      } else {
        setFormData(prev => ({
          ...prev,
          uploadFile: file,
          uploadFileDomains: domains
        }));
        setErrors((prev) => ({ ...prev, uploadFile: "" }));
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, uploadFile: "Error reading file" }));
      console.error("Error reading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'This field is required';
      isValid = false;
    }

    if (selected === "btn1") {
      if (!formData.domain_name.trim()) {
        newErrors.domain_name = 'This field is required';
        isValid = false;
      } else {
        const domains = formData.domain_name
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0);
        if (domains.length === 0) {
          newErrors.domain_name = 'Please enter at least one domain';
          isValid = false;
        }
        if (domains.length > 2000) {
          newErrors.domain_name = 'Maximum 2000 domains allowed';
          isValid = false;
        }
        const invalidDomains = domains.filter(domain => {
          return domain.includes(' ') || (domain.includes('.') && domain.split('.').pop().length === 0);
        });
        if (invalidDomains.length > 0) {
          newErrors.domain_name = `Invalid domain format: ${invalidDomains[0]}`;
          isValid = false;
        }
      }
    }
    if (selected === "btn2") {
      if (!formData.uploadFile && formData.uploadFileDomains.length === 0) {
        newErrors.uploadFile = "This field is required";
        isValid = false;
      }
    }
    setErrors(newErrors);
    if (!isValid) {
      await showValidationError();
    }
    return isValid;
  };

  const domainConfirmClasses = {
    popup: "campaign-save-swal-popup",
    title: "campaign-save-swal-title",
    htmlContainer: "campaign-save-swal-message",
    actions: "campaign-save-swal-actions",
    confirmButton: "campaign-save-swal-confirm",
    cancelButton: "campaign-save-swal-cancel",
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

  const showDomainAlert = async (title, text, icon) => {
    await Swal.fire({
      title,
      text,
      icon,
      iconColor: icon === "error" ? "#ef4444" : "#22c55e",
      showConfirmButton: true,
      confirmButtonText: "OK",
      buttonsStyling: false,
      customClass: {
        popup: "campaign-save-swal-popup",
        title: "campaign-save-swal-title",
        htmlContainer: "campaign-save-swal-message",
        actions: "campaign-save-swal-actions",
        confirmButton: "campaign-save-swal-confirm",
      },
      width: 520,
      allowOutsideClick: true,
    });
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const domainsubmit = async () => {
    let domains = [];

    if (selected === "btn1") {
      domains = formData.domain_name
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } else if (selected === "btn2") {
      domains = formData.uploadFileDomains;
    }
    const domainCount = domains.length;
    let payload;

    if (formData.id) {
      payload = {
        id: formData.id,
        name: formData.name.trim(),
        listType: formData.list_type === "allowlist" ? "ALLOWLIST" : "BLOCKLIST",
        domains: domains
      };
    } else {
      // Create payload
      payload = {
        name: formData.name.trim(),
        listType: formData.list_type === "allowlist" ? "ALLOWLIST" : "BLOCKLIST",
        domains: domains
      };
    }
    console.log("Payload being sent:", payload);
    try {
      let response;
      if (formData.id) {
        response = await updatedomain(formData.id, payload);
      } else {
        response = await saveDomain(payload);
      }
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };
  const addNewinventory = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: initialAudience?.id
        ? "Do you want to update this Domain List?"
        : "Do you want to save this Domain List?",
      icon: "question",
      iconColor: "#fbbf24",
      showCancelButton: true,
      confirmButtonText: initialAudience?.id ? "Yes, update it!" : "Yes, save it!",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: domainConfirmClasses,
      width: 520,
      allowOutsideClick: true,
    });
    if (!result.isConfirmed) return;
    setIsLoading(true);
    try {
      const responseData = await domainsubmit();
      await delay(800);
      await showDomainAlert(
        "Success!",
        initialAudience?.id
          ? "Domain List has been updated."
          : "Domain List has been created.",
        "success"
      );
      toggle();
      if (callback) callback(responseData);
    } catch (error) {
      await showDomainAlert("Error!", "Something went wrong.", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmUploadSwitch = async () => {
    if (formData.domain_name.trim() && selected === "btn1") {
      const result = await Swal.fire({
        html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_orange.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Entered domains will be cleared</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Switching to Upload File will clear the entered domains.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Continue",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#62903e",
        cancelButtonColor: "#ddd",
        width: 380,
        reverseButtons: true,
        customClass: {
          popup: "swal2-custom-size",
          confirmButton: "domain-switch-swal-btn domain-switch-swal-confirm",
          cancelButton: "domain-switch-swal-btn domain-switch-swal-cancel",
        },
      });

      if (result.isConfirmed) {
        setFormData(prev => ({ ...prev, domain_name: "" }));
        setSelected("btn2");
      }
    } else {
      setSelected("btn2");
    }
  };

  const UploadSwitch = async () => {
    if ((formData.uploadFile || formData.uploadFileDomains.length > 0) && selected === "btn2") {
      const result = await Swal.fire({
        html: `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <img src="https://moca.sitescout.com/resources/icons/misc/warning_triangle_orange.png" 
                 style="width: 18px; height: 18px;" />
            <span style="font-size:16px; font-weight:bold;">Uploaded file will be cleared</span>
          </div>
          <div style="margin-top: 10px; font-size:13px; text-align:center; color:black;">
            Switching to Enter Domains will clear the uploaded file.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Continue",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#62903e",
        cancelButtonColor: "#ddd",
        width: 380,
        reverseButtons: true,
        customClass: {
          popup: "swal2-custom-size",
          confirmButton: "domain-switch-swal-btn domain-switch-swal-confirm",
          cancelButton: "domain-switch-swal-btn domain-switch-swal-cancel",
        },
      });

      if (result.isConfirmed) {
        setFormData(prev => ({ ...prev, uploadFile: null, uploadFileDomains: [] }));
        setSelected("btn1");
      }
    } else {
      setSelected("btn1");
    }
  };

  return (
    <div>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        id="domainModal"
        size="lg"
        backdrop="static"
        keyboard={false}
      >
        <Form onSubmit={addNewinventory} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" className="domain-modal-spinner" />
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
              <Col md="6">
                <h5 className="modal-title mb-0">
                  {initialAudience?.id ? "Edit Domain List" : "New Domain List"}
                </h5>
              </Col>
              <Col md="6" className="text-end">
                <Button close onClick={toggle}></Button>
              </Col>
            </Row>
          </div>

          <ModalBody className="pt-3 modal-body-scroll">
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
                  <Label>List Type</Label>
                  <div>
                    <Input
                      type="radio"
                      id="allowlist"
                      name="list_type"
                      value="allowlist"
                      checked={formData.list_type === "allowlist"}
                      onChange={handleChange}
                      className="me-1 mt-1"
                    />
                    <Label className="me-4" htmlFor="allowlist">
                      Allowlist
                    </Label>
                    <Input
                      type="radio"
                      id="blocklist"
                      name="list_type"
                      value="blocklist"
                      checked={formData.list_type === "blocklist"}
                      onChange={handleChange}
                      className="me-1 mt-1"
                    />
                    <Label htmlFor="blocklist">Blocklist</Label>
                  </div>
                </FormGroup>
              </Col>
            </Row>

            {selected === "btn2" && (
              <Row>
                <Label><span>Upload a file containing domains. File must be a TXT or CSV with a maximum of 100,000 domains separated by line breaks and a maximum file size of 10MB. Upload another file to replace the previously uploaded file.</span></Label>
                <FormGroup>
                </FormGroup>
              </Row>
            )}
            {selected === "btn1" && (
              <>
                <Row>
                  <Label><span>Enter up to 2,000 domains separated by line breaks.</span></Label>
                  <FormGroup>
                  </FormGroup>
                </Row>
                <Row>
                  <Col md="12">
                      <Label for="domain_name" className="d-flex justify-content-between">

                      </Label>
                      <Input
                        type="textarea"
                        id="domain_names"
                        name="domain_names"
                        rows="10"
                        placeholder={`domain.com\nwww.domain.com\nmobile.app\n826482037\nscreen:id`}
                        value={formData.demo}
                        onChange={handleChange} />
                  </Col>
                </Row>
              </>


            )}
            <Row className="mb-2">
              <Col className="mt-2">
                <Button
                  size="sm"
                  id="btn1"
                  color={selected === "btn1" ? "primary" : "secondary"}
                  outline={selected !== "btn1"}
                  className="enterdomains"
                  onClick={UploadSwitch}
                >
                  Enter Domains
                </Button>

                <Button
                  size="sm"
                  id="btn2"
                  className="uploadfile"
                  color={selected === "btn2" ? "primary" : "secondary"}
                  outline={selected !== "btn2"}
                  onClick={confirmUploadSwitch}
                >
                  Upload File
                </Button>
              </Col>
            </Row>
            {selected === "btn1" && (
              <Row>
                <Col md="12">
                  <FormGroup>
                    <Label for="domain_name" className="d-flex justify-content-between">
                      <span>
                        Domains <span className="text-danger">*</span>
                      </span>
                      <span>{remainingLines} lines remaining</span>
                    </Label>
                    <Input
                      type="textarea"
                      id="domain_name"
                      name="domain_name"
                      rows="6"
                      value={formData.domain_name}
                      onChange={handleChange}
                      invalid={!!errors.domain_name}
                      onMouseEnter={() => errors.domain_name && setTooltipOpen((t) => ({ ...t, domain_name: true }))}
                      onMouseLeave={() => setTooltipOpen((t) => ({ ...t, domain_name: false }))}
                    />
                    {errors.domain_name && (
                      <Tooltip
                        placement="bottom"
                        isOpen={tooltipOpen.domain_name}
                        target="domain_name"
                        autohide={false}
                        container=".modal-content"
                        popperClassName="custom-tooltip"
                      >
                        <div className="one"></div>
                        {errors.domain_name}
                      </Tooltip>
                    )}

                  </FormGroup>
                </Col>
              </Row>
            )}
            {selected === "btn2" && (
              <Row>
                <Col md="12">
                  <FormGroup>
                    <Label for="uploadFile">
                      Upload File <span className="text-danger">*</span>
                    </Label>
                    <Input
                      type="file"
                      id="uploadFile"
                      name="uploadFile"
                      onChange={handleFileChange}
                      invalid={!!errors.uploadFile}
                      className="formscontrol"
                    />
                    {errors.uploadFile && (
                      <div className="text-danger small mt-1">{errors.uploadFile}</div>
                    )}
                    {formData.uploadFileDomains.length > 0 && (
                      <div className="text-success small mt-1">
                        File uploaded successfully: {formData.uploadFileDomains.length} domains found
                      </div>
                    )}
                  </FormGroup>
                </Col>
              </Row>
            )}
          </ModalBody>
          <ModalFooter>
            <Button className="cancels" onClick={toggle}>
              Cancel
            </Button>
            {((initialAudience?.id && domainUpdateUser) || (!initialAudience?.id && domainCreateUser)) && (
              <Button className="savebuttons" type="submit" disabled={isLoading} color="success">
                {isLoading ? (
                  <Spinner size="sm" />
                ) : initialAudience?.id ? (
                  "Update Domain List"
                ) : (
                  "Save"
                )}
              </Button>
            )}
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};
export default DomainModal;
