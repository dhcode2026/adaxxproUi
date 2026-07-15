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
  Spinner,
  Form,
  Tooltip,
} from "reactstrap";
import Swal from "sweetalert2";
import { useViewContext } from "../../ViewContext";
import SelectBrandModal from "./SelectBrandModel.jsx";
import { saveUser, updateUser, sendMail, getAllRole, getallaccountmanagers } from "../../views/api/Api.jsx";
import axios from "axios";
import { canCreate, canUpdate } from "../../utils/permissionHelper.js";
import { FaCaretDown, FaCheck } from "react-icons/fa";

const UserModal = (props) => {
  const { isOpen, toggle, inventory: initialinventory, user, callback } = props;
  const userToEdit = initialinventory || user;
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const context = useViewContext();
  const nameInputRef = useRef(null);
  const roleSelectRef = useRef(null);
  const rolePortalRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [roleDropdownPosition, setRoleDropdownPosition] = useState({ top: 0, left: 0, width: 250 });
  const [tooltipOpen, setTooltipOpen] = useState({
    email: false,
    firstName: false,
    lastName: false,
  });
  const [userCreateUser, setUserCreateUser] = useState(false);
  const [userUpdateUser, setUserUpdateUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Account Manager states
  const [accountManagers, setAccountManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerDropdownPosition, setManagerDropdownPosition] = useState({ top: 0, left: 0, width: 250 });
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedManagerEmail, setSelectedManagerEmail] = useState("");
  const managerSelectRef = useRef(null);
  const managerPortalRef = useRef(null);

  const DEFAULT_PASSWORD_LENGTH = 10;
  const generateRandomPassword = (length = DEFAULT_PASSWORD_LENGTH) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    return password;
  };

  const [formData, setFormData] = useState({
    id: "",
    email: "",
    firstName: "",
    lastName: "",
    roleId: "",
    password: "",
    accountManagerId: "",
    companyName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    fetchRoles();
    fetchAccountManagers();
  }, []);

  const fetchRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await getAllRole();
      if (response.data && response.status === 200) {
        const informationRoles = response.data.data.informationRoles;
        const mappedRoles = informationRoles.map((role) => ({
          id: role.roleId,
          name: role.roleName,
          status: role.status,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt
        }));
        setRoles(mappedRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      Swal.fire("Error", "Failed to load roles", "error");
    } finally {
      setLoadingRoles(false);
    }
  };
  const fetchAccountManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await getallaccountmanagers();
      if (response.data && response.status === 200) {
        const mappedManagers = (response.data.data || []).map(manager => ({
          id: manager.userId, 
          email: manager.email
        }));
        setAccountManagers(mappedManagers);
        console.log("Mapped account managers:", mappedManagers);
      }
    } catch (error) {
      console.error("Error fetching account managers:", error);
      Swal.fire("Error", "Failed to load account managers", "error");
    } finally {
      setLoadingManagers(false);
    }
  };

  useEffect(() => {
    if (userToEdit && userToEdit.id) {
      console.log("Setting form data for edit (password excluded):", userToEdit);
      const managerEmail = accountManagers.find(
        manager => manager.id === userToEdit.accountManagerId
      )?.email || userToEdit.accountManagerEmail || userToEdit.accountManager || "";
      
      setFormData({
        id: userToEdit.id || "",
        email: userToEdit.email || "",
        firstName: userToEdit.firstName || "",
        lastName: userToEdit.lastName || "",
        roleId: userToEdit.roleId || "",
        password: "",
        accountManagerId: userToEdit.accountManagerId || "",
        companyName: userToEdit.companyName || userToEdit.originalData?.companyName || "",
        phoneNumber: userToEdit.phoneNumber || userToEdit.originalData?.phoneNumber || "",
      });
      setSelectedManagerId(userToEdit.accountManagerId || "");
      setSelectedManagerEmail(managerEmail);
    } else if (isOpen && !userToEdit?.id) {
      setFormData({
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        roleId: "",
        password: "",
        accountManagerId: "",
        companyName: "",
        phoneNumber: "",
      });
      setSelectedManagerId("");
      setSelectedManagerEmail("");
    }
  }, [userToEdit, isOpen, accountManagers]); 

  useEffect(() => {
    const hasCreatePermission = canCreate("Users List");
    const hasUpdatePermission = canUpdate("Users List");
    setUserCreateUser(hasCreatePermission);
    setUserUpdateUser(hasUpdatePermission);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        id: "",
        email: "",
        firstName: "",
        lastName: "",
        roleId: "",
        password: "",
        accountManagerId: "",
        companyName: "",
        phoneNumber: "",
      });
      setSelectedManagerId("");
      setSelectedManagerEmail("");
      setErrors({});
      setTooltipOpen({ email: false, firstName: false, lastName: false });
      setShowPassword(false);
      setIsRoleOpen(false);
      setIsManagerOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isRoleOpen) return;

    const updateRoleDropdownPosition = () => {
      const rect = roleSelectRef.current?.getBoundingClientRect();
      if (!rect) return;

      setRoleDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        roleSelectRef.current?.contains(target) ||
        rolePortalRef.current?.contains(target)
      ) {
        return;
      }
      setIsRoleOpen(false);
    };

    updateRoleDropdownPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updateRoleDropdownPosition);
    window.addEventListener("scroll", updateRoleDropdownPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateRoleDropdownPosition);
      window.removeEventListener("scroll", updateRoleDropdownPosition, true);
    };
  }, [isRoleOpen]);

  // Manager dropdown positioning
  useEffect(() => {
    if (!isManagerOpen) return;

    const updateManagerDropdownPosition = () => {
      const rect = managerSelectRef.current?.getBoundingClientRect();
      if (!rect) return;

      setManagerDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    const handleClickOutside = (event) => {
      const target = event.target;
      if (
        managerSelectRef.current?.contains(target) ||
        managerPortalRef.current?.contains(target)
      ) {
        return;
      }
      setIsManagerOpen(false);
    };

    updateManagerDropdownPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", updateManagerDropdownPosition);
    window.addEventListener("scroll", updateManagerDropdownPosition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updateManagerDropdownPosition);
      window.removeEventListener("scroll", updateManagerDropdownPosition, true);
    };
  }, [isManagerOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRoleSelect = (roleId) => {
    const selectedRole = roles.find((role) => String(role.id) === String(roleId));
    setFormData((prev) => ({
      ...prev,
      roleId,
      accountManagerId: (selectedRole?.name === "Advertiser" || selectedRole?.name === "Agency")
        ? prev.accountManagerId
        : ""
    }));
    setErrors((prev) => ({ ...prev, roleId: "" }));
    setIsRoleOpen(false);

    // Clear selected manager if role is not Advertiser or Agency
    if (selectedRole?.name !== "Advertiser" && selectedRole?.name !== "Agency") {
      setSelectedManagerId("");
      setSelectedManagerEmail("");
    }
  };

  const handleManagerSelect = (managerId, managerEmail) => {
    setSelectedManagerId(managerId);
    setSelectedManagerEmail(managerEmail);
    setFormData((prev) => ({ 
      ...prev, 
      accountManagerId: managerId
    }));
    setErrors((prev) => ({ ...prev, accountManagerId: "" }));
    setIsManagerOpen(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Check if account manager should be shown
  const shouldShowAccountManager = () => {
    if (!formData.roleId) return false;
    const selectedRole = roles.find((role) => String(role.id) === String(formData.roleId));
    return selectedRole?.name === "Advertiser" || selectedRole?.name === "Agency";
  };

  const validateForm = async () => {
    const newErrors = {};
    let isValid = true;
    const email = formData.email?.trim() || "";
    const firstName = formData.firstName?.trim() || "";

    if (!email) {
      newErrors.email = "This field is required";
      isValid = false;
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        newErrors.email = "Enter a valid email address";
        isValid = false;
      }
    }
    if (!formData.roleId) {
      newErrors.roleId = "Please select a role";
      isValid = false;
    }
    if (!firstName) {
      newErrors.firstName = "This field is required";
      isValid = false;
    }

    // Validate account manager if role is Advertiser or Agency
    if (shouldShowAccountManager()) {
      if (!formData.accountManagerId) {
        newErrors.accountManagerId = "Please select an Account Manager";
        isValid = false;
      }
    }

    setErrors(newErrors);
    if (newErrors.email && nameInputRef.current) {
      nameInputRef.current.focus();
    }

    if (!isValid) {
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
    }
    return isValid;
  };

  const sendEmailNotification = async (isCreating, userData, password = null) => {
    try {
      let emailPayload = null;
      const roleName = roles.find(r => r.id === parseInt(formData.roleId))?.name || 'Updated';

      if (isCreating) {
        emailPayload = {
          to: formData.email.trim(),
          subject: "Welcome to Our Platform - Account Created",
          body: `Hello ${formData.firstName.trim() || formData.email.trim()},\n\nYour account has been successfully created.\n\nLogin Details:\nEmail: ${formData.email.trim()}\nTemporary Password: ${password}\n\nPlease login and change your password immediately.\n\nThank you,\nThe Team`,
        };
      } else {
        let updateMessage = `Hello ${formData.firstName.trim() || formData.email.trim()},\n\nYour account information has been updated.\n\nUpdated Details:\nEmail: ${formData.email.trim()}\nRole: ${roleName}\nName: ${formData.firstName.trim()} ${formData.lastName.trim()}`;

        if (formData.password && formData.password.trim() !== "") {
          updateMessage += `\nPassword: Changed (New password has been set)`;
        }

        updateMessage += `\n\nIf you did not authorize these changes, please contact support immediately.\n\nThank you,\nThe Team`;

        emailPayload = {
          to: formData.email.trim(),
          subject: "Your Account Has Been Updated",
          body: updateMessage,
        };
      }

      if (emailPayload) {
        const mailResponse = await sendMail(emailPayload);
        if (mailResponse && (mailResponse.status === 200 || mailResponse.status === 201)) {
          console.log(isCreating ? "Welcome email sent successfully" : "Update email sent successfully");
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  };

  const showCampaignAlert = async ({ title, text, icon, showCancelButton = false, confirmButtonText = "OK", cancelButtonText = "Cancel" }) => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: icon === "error" ? "#d33" : "#62903e",
      cancelButtonColor: "#d33",
      reverseButtons: showCancelButton,
      timer: icon === "success" ? 3000 : undefined,
      timerProgressBar: icon === "success",
      customClass: {
        popup: "campaign-save-swal-popup",
        title: "campaign-save-swal-title",
        htmlContainer: "campaign-save-swal-message",
        actions: "campaign-save-swal-actions",
        confirmButton: "campaign-save-swal-confirm",
        cancelButton: "campaign-save-swal-cancel",
      },
      buttonsStyling: false,
      allowOutsideClick: true,
    });
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;
    const isCreatingNewUser = !formData.id || formData.id === "";
    const result = await showCampaignAlert({
      title: "Are you sure?",
      text: isCreatingNewUser
        ? "Do you want to save this User?"
        : "Do you want to update this User?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isCreatingNewUser ? "Yes, save it!" : "Yes, update it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setIsLoading(true);
    const payload = {
      email: formData.email.trim(),
      roleId: parseInt(formData.roleId),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phoneNumber: formData.phoneNumber?.trim() || "",
      companyName: formData.companyName?.trim() || "",
    };
    if (shouldShowAccountManager()) {
      payload.accountManagerId = formData.accountManagerId;
    }

    try {
      let response;
      let tempPassword = null;
      let emailSent = false;

      if (isCreatingNewUser) {
        tempPassword = generateRandomPassword();
        payload.password = tempPassword;
        response = await saveUser(payload);

        if (response && (response.status === 200 || response.status === 201)) {
          emailSent = await sendEmailNotification(true, response.data, tempPassword);
        }
      } else {
        if (formData.password && formData.password.trim() !== "") {
          payload.password = formData.password.trim();
          console.log("Password is being updated with new value");
        } else {
          console.log("Password not being updated (field left blank)");
        }
        payload.sendEmail = true;
        console.log("Updating user with payload:", payload);
        response = await updateUser(formData.id, payload);
        console.log("Update response:", response);

        if (response && (response.status === 200 || response.status === 201)) {
          emailSent = await sendEmailNotification(false, response.data);
        }
      }

      if (response && (response.status === 200 || response.status === 201)) {
        let successMessage = isCreatingNewUser
          ? "User has been created successfully."
          : "User has been updated successfully.";

        if (emailSent) {
          successMessage += " Confirmation email sent.";
        } else {
          successMessage += " Note: Email notification could not be sent.";
        }
        await showCampaignAlert({
          icon: "success",
          title: "Success!",
          text: successMessage,
        });

        toggle();

        if (typeof callback === "function") {
          setTimeout(() => {
            callback(response.data);
          }, 100);
        }
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("API Error:", error);

      let errorMessage = "Something went wrong. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      await showCampaignAlert({
        icon: "error",
        title: "Error!",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEditing = userToEdit && userToEdit.id;
  const modalTitle = isEditing ? "Edit User" : "New User";
  const selectedRole = roles.find((role) => String(role.id) === String(formData.roleId));
  const submitButtonText = isLoading ? (
    <Spinner size="sm" />
  ) : isEditing ? (
    "Update User"
  ) : (
    "Save User"
  );

  return (
    <div>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        id="usersmodal"
        size="lg"
        backdrop="static"
        keyboard={false}
        onOpened={() => nameInputRef.current?.focus()}
        style={{ maxHeight: "65vh" }}
        modalClassName="user-modal-height"
      >
        <Form onSubmit={handleSubmit} autoComplete="off">
          {isLoading && (
            <div className="loader-overlay">
              <Spinner color="primary" style={{ width: "4rem", height: "4rem" }} />
            </div>
          )}
          <div className="modal-header border-bottom">
            <Row className="w-100 align-items-center m-0">
              <Col md="6">
                <h5 className="modal-title mb-0">
                  {modalTitle}
                </h5>
              </Col>
              <Col md="6" className="text-end">
                <Button close onClick={toggle} />
              </Col>
            </Row>
          </div>

          <ModalBody className="pt-3 modal-body-scroll" id="userModalBody">
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="firstName">
                    First Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="formscontrol"
                    invalid={!!errors.firstName}
                    onMouseEnter={() =>
                      errors.firstName &&
                      setTooltipOpen((t) => ({ ...t, firstName: true }))
                    }
                    onMouseLeave={() =>
                      setTooltipOpen((t) => ({ ...t, firstName: false }))
                    }
                  />
                  {errors.firstName && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.firstName}
                      target="firstName"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one" />
                      {errors.firstName}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="lastName">
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="formscontrol"
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="email">
                    Email <span className="text-danger">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    invalid={!!errors.email}
                    className="formscontrol"
                    innerRef={nameInputRef}
                    onMouseEnter={() =>
                      errors.email &&
                      setTooltipOpen((t) => ({ ...t, email: true }))
                    }
                    onMouseLeave={() =>
                      setTooltipOpen((t) => ({ ...t, email: false }))
                    }
                  />
                  {errors.email && (
                    <Tooltip
                      placement="bottom"
                      isOpen={tooltipOpen.email}
                      target="email"
                      autohide={false}
                      container=".modal-content"
                      popperClassName="custom-tooltip"
                    >
                      <div className="one" />
                      {errors.email}
                    </Tooltip>
                  )}
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="roleId">
                    Role <span className="text-danger">*</span>
                  </Label>
                  <div
                    id="roleId"
                    ref={roleSelectRef}
                    style={{ position: "relative", minWidth: "100%", zIndex: 100 }}
                  >
                    <div className="campaign-select-wrapper">
                      <Input
                        readOnly
                        value={loadingRoles ? "Loading roles..." : selectedRole ? selectedRole.name : "-- Select Role --"}
                        invalid={!!errors.roleId}
                        className="campaign-select-input formscontrol"
                        style={{
                          height: "30px",
                          minHeight: "30px",
                          borderRadius: "13px",
                          padding: "10px 34px 10px 12px",
                          cursor: loadingRoles ? "not-allowed" : "pointer",
                        }}
                        disabled={loadingRoles}
                        onClick={() => {
                          if (!loadingRoles) setIsRoleOpen((prev) => !prev);
                        }}
                        tabIndex={0}
                      />
                      <FaCaretDown
                        className={`custom-select-icon campaign-select-icon ${isRoleOpen ? "open" : ""}`}
                      />
                    </div>
                  </div>
                  {isRoleOpen &&
                    typeof document !== "undefined" &&
                    ReactDOM.createPortal(
                      <div
                        ref={rolePortalRef}
                        className="custom-dropdown-menu biddeript-b"
                        style={{
                          position: "absolute",
                          top: `${roleDropdownPosition.top}px`,
                          left: `${roleDropdownPosition.left}px`,
                          zIndex: 9999,
                          minWidth: `${roleDropdownPosition.width}px`,
                          pointerEvents: "auto",
                        }}
                      >
                        <div
                          onClick={() => handleRoleSelect("")}
                          className={`custom-dropdown-option ${!formData.roleId ? "selected" : ""}`}
                          style={{
                            height: "40px",
                            cursor: "pointer",
                            pointerEvents: "auto",
                          }}
                        >
                          <span className="tick-icon">
                            {!formData.roleId && <FaCheck />}
                          </span>
                          <span>-- Select Role --</span>
                        </div>
                        {roles.map((role) => {
                          const isSelected = String(formData.roleId) === String(role.id);
                          return (
                            <div
                              key={role.id}
                              onClick={() => handleRoleSelect(role.id)}
                              className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                              style={{
                                height: "40px",
                                cursor: "pointer",
                                pointerEvents: "auto",
                              }}
                            >
                              <span className="tick-icon">
                                {isSelected && <FaCheck />}
                              </span>
                              <span>{role.name}</span>
                            </div>
                          );
                        })}
                      </div>,
                      document.body,
                    )}
                  {errors.roleId && (
                    <div className="text-danger small mt-1">{errors.roleId}</div>
                  )}
                </FormGroup>
              </Col>
            </Row>
            {shouldShowAccountManager() && (
              <>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label for="accountManager">
                        Account Manager <span className="text-danger">*</span>
                      </Label>
                      <div
                        id="accountManager"
                        ref={managerSelectRef}
                        style={{ position: "relative", minWidth: "100%", zIndex: 100 }}
                      >
                        <div className="campaign-select-wrapper">
                          <Input
                            readOnly
                            value={loadingManagers ? "Loading managers..." : selectedManagerEmail || "-- Select Account Manager --"}
                            className="campaign-select-input formscontrol"
                            invalid={!!errors.accountManagerId}
                            style={{
                              height: "30px",
                              minHeight: "30px",
                              borderRadius: "13px",
                              padding: "10px 34px 10px 12px",
                              cursor: loadingManagers ? "not-allowed" : "pointer",
                            }}
                            disabled={loadingManagers}
                            onClick={() => {
                              if (!loadingManagers) setIsManagerOpen((prev) => !prev);
                            }}
                            tabIndex={0}
                          />
                          <FaCaretDown
                            className={`custom-select-icon campaign-select-icon ${isManagerOpen ? "open" : ""}`}
                          />
                        </div>
                      </div>
                      {isManagerOpen &&
                        typeof document !== "undefined" &&
                        ReactDOM.createPortal(
                          <div
                            ref={managerPortalRef}
                            className="custom-dropdown-menu biddeript-b"
                            style={{
                              position: "absolute",
                              top: `${managerDropdownPosition.top}px`,
                              left: `${managerDropdownPosition.left}px`,
                              zIndex: 9999,
                              minWidth: `${managerDropdownPosition.width}px`,
                              pointerEvents: "auto",
                            }}
                          >
                            <div
                              onClick={() => handleManagerSelect("", "")}
                              className={`custom-dropdown-option ${!selectedManagerId ? "selected" : ""}`}
                              style={{
                                height: "40px",
                                cursor: "pointer",
                                pointerEvents: "auto",
                              }}
                            >
                              <span className="tick-icon">
                                {!selectedManagerId && <FaCheck />}
                              </span>
                              <span>-- Select Account Manager --</span>
                            </div>
                            {accountManagers.map((manager) => {
                              const isSelected = selectedManagerId === manager.id;
                              return (
                                <div
                                  key={manager.id}
                                  onClick={() => handleManagerSelect(manager.id, manager.email)}
                                  className={`custom-dropdown-option ${isSelected ? "selected" : ""}`}
                                  style={{
                                    height: "40px",
                                    cursor: "pointer",
                                    pointerEvents: "auto",
                                  }}
                                >
                                  <span className="tick-icon">
                                    {isSelected && <FaCheck />}
                                  </span>
                                  <span>{manager.email}</span>
                                </div>
                              );
                            })}
                          </div>,
                          document.body,
                        )}
                      {errors.accountManagerId && (
                        <div className="text-danger small mt-1">{errors.accountManagerId}</div>
                      )}
                    </FormGroup>
                  </Col>
                </Row>
              </>
            )}
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="companyName">Company Name</Label>
                  <Input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="formscontrol"
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="phoneNumber">Phone Number</Label>
                  <Input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="formscontrol"
                  />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>

          <ModalFooter>
            <Button className="cancels" onClick={toggle}>
              Cancel
            </Button>
            {((isEditing && userUpdateUser) || (!isEditing && userCreateUser)) && (
              <Button
                className="savebuttons"
                type="submit"
                disabled={isLoading}
                color="success"
              >
                {submitButtonText}
              </Button>
            )}
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default UserModal;