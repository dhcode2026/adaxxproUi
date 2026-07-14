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
  Tooltip,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import Swal from "sweetalert2";
import {
  saveConversion,
  updateConversion,
  getAllconversioncategory,
  getAllconversionMmptype,
  getAllAdvertisers,
} from "../../views/api/Api.jsx";
   import { canCreate, canUpdate} from "../../utils/permissionHelper.js";


const ConversionModal = (props) => {
  const { isOpen, toggle, conversion: initialconversion, callback } = props;

  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    notes: "",
    labelValue: "",
    secondaryConversion: "",
    otherValue: "",
    secondaryOtherValue: "",
    defaultValue: "",
    secondaryPrice: "",
    mmType: "",
    pid: "",
    baseUrl: "",
    impressionUrl: "",
    user: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [mmpTypes, setMmpTypes] = useState([]);
  const [mmpTypesLoading, setMmpTypesLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const nameInputRef = useRef(null);
  const pidInputRef = useRef(null);
  const [conversionCreateUser, setConversionCreateUser] = useState(false);
  const [conversionUpdateUser, setConversionUpdateUser] = useState(false);

  const [tooltipOpen, setTooltipOpen] = useState({
    name: false,
    labelValue: false,
    otherValue: false,
    secondaryOtherValue: false,
    defaultValue: false,
    secondaryPrice: false,
    mmType: false,
    pid: false,
    baseUrl: false,
  });

  const [copyUrl, setCopyUrl] = useState(false);

  const handleCopyUrl = (e) => {
    const checked = e.target.checked;

    setCopyUrl(checked);

    setFormData((prev) => ({
      ...prev,
      impressionUrl: checked ? prev.baseUrl : "",
    }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllconversioncategory();
        if (response?.data?.status === 200) {
          setCategories(
            response.data.data.informationConversionCategoryList || [],
          );
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchMmpTypes = async () => {
      try {
        const response = await getAllconversionMmptype();
        if (response?.data?.status === 200) {
          setMmpTypes(response.data.data.informationConversionMmpTypes || []);
        }
      } catch (error) {
        console.error("Failed to fetch MMP types:", error);
      } finally {
        setMmpTypesLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await getAllAdvertisers();
        if (response && response.data) {
          setUsers(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch advertisers:", error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchCategories();
    fetchMmpTypes();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (initialconversion && categories.length > 0) {
      const initialLabel = initialconversion.labelValue || "";
      const initialSecondaryLabel = initialconversion.secondaryConversion || "";
      const categoryNames = categories.map((cat) => cat.name);
      const isOther = initialLabel && !categoryNames.includes(initialLabel);
      const isSecondaryOther =
        initialSecondaryLabel && !categoryNames.includes(initialSecondaryLabel);

      let defaultVal = initialconversion.defaultValue || "";
      if (defaultVal && !isNaN(parseFloat(defaultVal))) {
        defaultVal = parseFloat(defaultVal).toFixed(2);
      }

      let secondaryPriceVal = initialconversion.secondaryPrice || "";
      if (secondaryPriceVal && !isNaN(parseFloat(secondaryPriceVal))) {
        secondaryPriceVal = parseFloat(secondaryPriceVal).toFixed(2);
      }

      setFormData({
        id: initialconversion.id || 0,
        name: initialconversion.name || "",
        secondaryConversion: isSecondaryOther ? "Other" : initialSecondaryLabel,
        notes: initialconversion.notes || "",
        labelValue: isOther ? "Other" : initialLabel,
        otherValue: isOther ? initialLabel : "",
        secondaryOtherValue: isSecondaryOther ? initialSecondaryLabel : "",
        defaultValue: defaultVal,
        secondaryPrice: secondaryPriceVal,
        mmType: initialconversion.mmType || "",
        pid: initialconversion.pid || "",
        baseUrl: initialconversion.baseUrl || "",
        impressionUrl: initialconversion.impressionUrl || "",
        user: initialconversion.userList || "",
      });
    }
  }, [initialconversion, categories]);
          useEffect(() => {
    const hasCreatePermission = canCreate("Conversion");
    const hasUpdatePermission = canUpdate("Conversion");
    setConversionCreateUser(hasCreatePermission);
    setConversionUpdateUser(hasUpdatePermission);
        }, []);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: 0,
        name: "",
        notes: "",
        labelValue: "",
        secondaryConversion: "",
        otherValue: "",
        secondaryOtherValue: "",
        defaultValue: "",
        secondaryPrice: "",
        mmType: "",
        pid: "",
        baseUrl: "",
        impressionUrl: "",
        userList: "",
      });
      setErrors({});
      setTooltipOpen({
        name: false,
        labelValue: false,
        otherValue: false,
        secondaryOtherValue: false,
        defaultValue: false,
        secondaryPrice: false,
        mmType: false,
        pid: false,
        baseUrl: false,
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "baseUrl" && copyUrl) {
        updatedData.impressionUrl = value;
      }

      return updatedData;
    });

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDefaultValueChange = (e) => {
    const { name: fieldName, value } = e.target;
    let raw = value;
    let cleaned = raw.replace(/[^0-9.]/g, "");
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      const firstDotIndex = cleaned.indexOf(".");
      cleaned =
        cleaned.substring(0, firstDotIndex + 1) +
        cleaned.substring(firstDotIndex + 1).replace(/\./g, "");
    }
    if (cleaned.includes(".")) {
      const parts = cleaned.split(".");
      if (parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        cleaned = parts.join(".");
      }
    }

    setFormData((prev) => ({ ...prev, [fieldName]: cleaned }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleDefaultValueBlur = (fieldName) => {
    let val = formData[fieldName];
    if (val && !isNaN(parseFloat(val))) {
      const formatted = parseFloat(val).toFixed(2);
      setFormData((prev) => ({ ...prev, [fieldName]: formatted }));
    } else if (val === "") {
      return;
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: "" }));
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

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;
    if (!formData.user) {
      newErrors.user = "User is required";
      isValid = false;
    }
    if (!formData.mmType) {
      newErrors.mmType = "MMP Type is required";
      isValid = false;
    }

    if (!formData.pid) {
      newErrors.pid = "PID is required";
      isValid = false;
    }
    if (!formData.baseUrl) {
      newErrors.baseUrl = "Base Url is required";
      isValid = false;
    }
    setErrors(newErrors);
    if (!isValid) {
      if (newErrors.user) {
        document.querySelector('select[name="user"]')?.focus();
      } else if (newErrors.mmType) {
        document.querySelector('select[name="mmType"]')?.focus();
      } else if (newErrors.pid) {
        pidInputRef.current?.focus();
      } else if (newErrors.baseUrl) {
        document.querySelector('input[name="baseUrl"]')?.focus();
      }
      await showValidationError();
    }
    return isValid;
  };

  const generateSecurityToken = () => {
    const randomPrefix = Math.random().toString(36).substring(2, 10);
    return `${randomPrefix}`;
  };

  const conversionsubmit = async () => {
    const isPrimaryOther = formData.labelValue === "Other";
    const isSecondaryOther = formData.secondaryConversion === "Other";

    const securityToken = generateSecurityToken();

    const payload = {
      name: formData.name.trim(),
      secondaryConversion: formData.secondaryConversion
        ? isSecondaryOther
          ? formData.secondaryOtherValue.trim()
          : formData.secondaryConversion.trim()
        : null,
      notes: formData.notes.trim() || null,
      labelValue: isPrimaryOther
        ? formData.otherValue.trim()
        : formData.labelValue.trim(),
      defaultValue: formData.defaultValue.trim(),
      secondaryPrice: formData.secondaryPrice
        ? formData.secondaryPrice.trim()
        : null,
      mmType: formData.mmType || null,
      pid: formData.pid || null,
      baseUrl: formData.baseUrl || null,
      otherValue: isPrimaryOther ? formData.otherValue.trim() : null,
      secondaryOtherValue: isSecondaryOther
        ? formData.secondaryOtherValue.trim()
        : null,
      securityToken: securityToken,
      impressionUrl: formData.impressionUrl || null,
      userList: formData.user || null,
      userId: formData.user || null,
    };

    try {
      if (!formData.id) {
        const response = await saveConversion(payload);
        callback?.(response.data);
        return response.data;
      } else {
        const response = await updateConversion(formData.id, payload);
        callback?.(response.data);
        return response.data;
      }
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  const addNewconversion = async (e) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: initialconversion?.id
        ? "Do you want to update this Conversion?"
        : "Do you want to save this Conversion?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: initialconversion?.id
        ? "Yes, update it!"
        : "Yes, save it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);

    try {
      const response = await conversionsubmit();
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (response?.error) {
        await Swal.fire(
          "Error!",
          response.message || "Something went wrong.",
          "error",
        );
      } else {
        await Swal.fire(
          "Success!",
          initialconversion?.id
            ? "Conversion has been updated."
            : "Conversion has been created.",
          "success",
        );
        toggle();
        setFormData({
          id: 0,
          name: "",
          notes: "",
          labelValue: "",
          secondaryConversion: "",
          otherValue: "",
          secondaryOtherValue: "",
          defaultValue: "",
          secondaryPrice: "",
          mmType: "",
          pid: "maibiztecnx_int",
          baseUrl: "",
          impressionUrl: "",
          user: "",
        });
      }
    } catch (error) {
      console.error(error);
      await Swal.fire("Error!", "Something went wrong.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      backdrop="static"
      keyboard={false}
    >
      <Form onSubmit={addNewconversion} autoComplete="off">
        {isLoading && (
          <div className="loader-overlay">
            <Spinner
              color="primary"
              style={{ width: "4rem", height: "4rem" }}
            />
          </div>
        )}
        <div className="modal-header border-bottom editable">
          <h5 className="modal-title mb-0 headingtittle">
            {initialconversion?.id ? "Edit Select MMP" : "Select MMP"}
          </h5>
          <Button close onClick={toggle} />
        </div>

        <ModalBody className="pt-3 modal-body-scroll">
          <Row className="mt-3">
            <Col md="12">
              <Label for="user">
                User <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="user"
                name="user"
                value={formData.user}
                onChange={handleChange}
                invalid={!!errors.user}
                className="formscontrol"
                disabled={usersLoading}
              >
                <option value="">-- Select User --</option>
                {usersLoading ? (
                  <option disabled>Loading Users...</option>
                ) : (
                  <>
                    {initialconversion?.userList && (
                      <option value={initialconversion.userList}>
                        {initialconversion.userList}
                      </option>
                    )}
                    {users.map((u) => {
                      const value = typeof u === 'string' ? u : (u.userId || u.id || u.name);
                      const label = typeof u === 'string' ? u : (u.name || u.firstName || u.email || u.userId || u.id);
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </>
                )}
              </Input>
              {errors.user && (
                <div className="text-danger small">{errors.user}</div>
              )}
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md="12">
              <Label for="mmType">
                MMP Type <span className="text-danger">*</span>
              </Label>
              <Input
                type="select"
                id="mmType"
                name="mmType"
                value={formData.mmType}
                onChange={handleChange}
                invalid={!!errors.mmType}
                className="formscontrol"
                disabled={mmpTypesLoading}
              >
                <option value="">-- Select MMP Type --</option>
                {mmpTypesLoading ? (
                  <option disabled>Loading MMP Types...</option>
                ) : (
                  mmpTypes.map((mmp) => (
                    <option key={mmp.conversionMmpTypeId} value={mmp.mmpName}>
                      {mmp.mmpName}
                    </option>
                  ))
                )}
              </Input>
              {errors.mmType && (
                <div className="text-danger small">{errors.mmType}</div>
              )}
            </Col>
          </Row>

          <Row>
            <Col md="12">
              <Label for="pid">
                PID <span className="text-danger">*</span>
              </Label>
              <Input
                innerRef={pidInputRef}
                type="text"
                id="pid"
                name="pid"
                value={formData.pid}
                onChange={handleChange}
                invalid={!!errors.pid}
                className="formscontrol"
              />
              {errors.pid && (
                <div className="text-danger small">{errors.pid}</div>
              )}
            </Col>
          </Row>
          <Row>
            <Col md="12">
             <div className="d-flex justify-content-between align-items-center">
  <Label for="baseUrl" className="mb-0">
    Conversion Url <span className="text-danger">*</span>
  </Label>

  <div className="d-flex align-items-center">
    <Input
      type="checkbox"
      id="copyUrl"
      checked={copyUrl}
      onChange={handleCopyUrl}
      className="me-2"
    />
    <Label for="copyUrl" className="mb-0">
      Same as Conversion URL
    </Label>
  </div>
</div>

              <Input
                type="text"
                id="baseUrl"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleChange}
                invalid={!!errors.baseUrl}
                className="formscontrol"
              />
            </Col>
            <Col md="12">
              <Label for="baseUrl">
                Impression Url <span className="text-danger">*</span>
              </Label>
              <Input
                type="text"
                id="impressionUrl"
                name="impressionUrl"
                value={formData.impressionUrl}
                onChange={handleChange}
                disabled={copyUrl}
                className="formscontrol"
              />
              {errors.impressionUrl && (
                <div className="text-danger small">{errors.impressionUrl}</div>
              )}
            </Col>
          </Row>
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle} disabled={isLoading}>
            Cancel
          </Button>
          {(!formData.id && conversionCreateUser) ||
          (formData.id && conversionUpdateUser) ? (
            <Button className="savebuttons" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  {formData.id ? "Updating..." : "Creating..."}
                </>
              ) : formData.id ? (
                "Update MMP"
              ) : (
                "Create MMP"
              )}
            </Button>
          ) : null}
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ConversionModal;
