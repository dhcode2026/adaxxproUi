import React, { useState } from "react";
import { Button, Input, FormGroup, Label } from "reactstrap";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import logo from "./assets/img/adxpro.png";
import "./views/editors/campcreate.css";
import { resetPassword } from "./views/api/Api";

const renderValidationSwalHtml = (title, message, type) => {
  const iconSvg = type === "success"
    ? `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
         <path d="M7.5 12.5l3 3 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
       </svg>`
    : `<svg viewBox="0 0 24 24" role="presentation" focusable="false">
         <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
         <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
       </svg>`;

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

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const criteria = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    return minLength && criteria >= 3;
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

  const tokenFromUrl = location.pathname.split("/").filter(Boolean).pop();

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

  const showConfirmationPopup = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to reset your password?",
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

  const showSuccessMessage = async (message) => {
    let redirectTimer;

    const popupPromise = Swal.fire({
      html: renderValidationSwalHtml("Success", message, "success"),
      width: 520,
      buttonsStyling: true,
      confirmButtonText: "OK",
      confirmButtonColor: "#62903e",
      customClass: swalCustomClasses,
      allowOutsideClick: false,
    });

    redirectTimer = window.setTimeout(() => {
      Swal.close();
      navigate("/login");
    }, 2000);

    const result = await popupPromise;

    if (redirectTimer) {
      window.clearTimeout(redirectTimer);
    }

    if (result.isConfirmed) {
      navigate("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowValidationErrors(true);

    if (!newPassword || !confirmPassword) {
      await showValidationError("All fields are required");
      return;
    }

    if (!validatePassword(newPassword)) {
      await showValidationError(
        "Your password must contain at least 8 characters and at least 3 of the following: lowercase letters, uppercase letters, numbers, special characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      await showValidationError("New password and confirm password do not match");
      return;
    }

    const confirmed = await showConfirmationPopup();
    if (!confirmed) {
      return;
    }

    try {
      const response = await resetPassword({
        token: tokenFromUrl,
        password: confirmPassword,
      });

      if (response?.status === 200 || response?.status === 201) {
        await showSuccessMessage(response?.data?.message || "Your password is reset successfully. Please try to login.");
      } else {
        await showValidationError(response?.data?.message || "Unable to reset password.");
      }
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to reset password right now.";

      await showValidationError(serverMessage);
    }
  };

  return (
    <div className="fp-page">
      <div className="loginbox campaign-forget-pass">
        <div className="logo fp-logo">
          <img src={logo} alt="logo" className="campaign-forget-pass" />
        </div>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label className="fp-label">New Password<span className="fp-required"> *</span></Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="loginname-fp"
              placeholder="Enter new password"
            />
            {showValidationErrors && newPassword && !validatePassword(newPassword) && (
              <div className="fp-mismatch-text">
                Your password must contain at least 8 characters and at least 3 of the following: lowercase letters, uppercase letters, numbers, special characters
              </div>
            )}
          </FormGroup>

          <FormGroup>
            <Label className="fp-label">Confirm Password<span className="fp-required"> *</span></Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="loginname-fp"
              placeholder="Confirm new password"
            />
            {showValidationErrors && confirmPassword && newPassword !== confirmPassword && (
              <div className="fp-mismatch-text">Passwords do not match</div>
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

export default ResetPassword;
