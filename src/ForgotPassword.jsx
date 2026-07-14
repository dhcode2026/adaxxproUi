import React, { useState } from "react";
import { Button, Input, FormGroup, Label } from "reactstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import logo from "./assets/img/adxpro.png";
import "./views/editors/campcreate.css";
import { checkEmail } from "./views/api/Api.jsx";

const renderValidationSwalHtml = (title, message, type) => {
  const iconSvg = type === "success"
    ? `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
         <path d="M7.5 12.5l3 3 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
       </svg>`
    : `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
         <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
       </svg >`;

  const iconClass = `campaign-swal-icon-pass campaign-swal-icon-pass--${type}`;

  return `
    <div class="campaign-swal-card-pass">
      <div class="${iconClass}" aria-hidden="true">
        ${iconSvg}
      </div>
      <div class="swal2-custom-title">${title}</div>
      <div class="swal2-custom-text">${message}</div>
    </div>
  `;
};

const swalCustomClasses = {
  popup: "swal2-custom-popup",
  icon: "swal2-custom-icon",
  title: "swal2-custom-title",
  htmlContainer: "swal2-custom-text",
  actions: "swal2-custom-actions",
  confirmButton: "swal2-confirm-custom",
  cancelButton: "swal2-cancel-custom",
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  const showValidationError = async (message) => {
    await Swal.fire({
      html: renderValidationSwalHtml("Error!", message, "error"),
      width: 520,
      buttonsStyling: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#d11f37",
      customClass: swalCustomClasses,
    });
  };

  const showSuccessMessage = async (message) => {
    const result = await Swal.fire({
      html: renderValidationSwalHtml("Success", message, "success"),
      width: 520,
      buttonsStyling: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      customClass: swalCustomClasses,
    });

    if (result.isConfirmed) {
      navigate("/login");
    }
  };

  const showConfirmationPopup = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to reset your password? Your current changes will not be saved.",
      icon: "warning",
      width: 520,
      showCancelButton: true,
      buttonsStyling: true,
      confirmButtonColor: "#d11f37",
      cancelButtonColor: "#f3f4f6",
      confirmButtonText: "Yes, reset",
      cancelButtonText: "No, continue",
      customClass: swalCustomClasses,
    });

    return result.isConfirmed;
  };

  const submitForgotPasswordRequest = async (submittedEmail) => {
    try {
      const normalizedEmail = submittedEmail.trim();
      const response = await checkEmail({ email: normalizedEmail });

      if (response?.status === 200 || response?.status === 201) {
        return {
          success: true,
          message: response?.data?.message || "Please check your email for reset password",
        };
      }

      return {
        success: false,
        message: response?.data?.message || "Unable to process your request.",
      };
    } catch (error) {
      console.error("Forgot password request failed", error);
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to process your request right now.";

      return { success: false, message: serverMessage };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowValidationErrors(true);

    if (!email) {
      await showValidationError("Please enter your registered email");
      return;
    }

    if (!validateEmail(email)) {
      await showValidationError("Please enter a valid email");
      return;
    }

    const confirmed = await showConfirmationPopup();
    if (!confirmed) {
      return;
    }

    const apiResult = await submitForgotPasswordRequest(email);

    if (!apiResult.success) {
      await showValidationError(apiResult.message);
      return;
    }

    await showSuccessMessage(apiResult.message);
  };

  return (
    <div className="fp-page">
      <div className="loginbox campaign-forget-pass">
        <div className="logo fp-logo">
          <img src={logo} alt="logo" className="campaign-forget-pass" />
        </div>

        {/* <h4 className="fp-title">Reset Password</h4> */}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label className="fp-label">Email<span className="fp-required"> *</span></Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              className="loginname-fp"
              placeholder="Enter your registered email"
            />
            {showValidationErrors && (!email || !validateEmail(email)) && (
              <div className="fp-mismatch-text">
                {email ? "Please enter a valid email" : "Please enter your registered email"}
              </div>
            )}
          </FormGroup>
          <div className="fp-button-row">
            <Button type="button" className="loginbutton-fp fp-cancel-button" onClick={() => navigate("/login")}>Cancel</Button>
            <Button type="submit" className="loginbutton-fp fp-submit-button">Submit</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ForgotPassword;
