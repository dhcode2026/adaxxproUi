import React, { useState } from "react";
import { Input } from "reactstrap";

const ChangePassword = ({ isOpen, onClose }) => {
  // Password states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error states
  const [error, setError] = useState(false);
  const [matchError, setMatchError] = useState("");

  // Eye toggle states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  // Reset state
  const resetState = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(false);
    setMatchError("");
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  // Close modal
  const handleClose = () => {
    resetState();
    onClose();
  };

  // Submit handler
  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMatchError("Passwords do not match");
      return;
    }

    setError(false);
    setMatchError("");

    console.log({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    handleClose();
  };

  return (
    <div className="modal-request-support" onClick={handleClose}>
      <div className="password-request" onClick={(e) => e.stopPropagation()}>
        <h4>Change Password</h4>
        <hr className="ci_line" />

        {/* Old Password */}
        <div className="request-subject password-field">
          <label htmlFor="oldPassword">Old Password</label>
          <div className="password-wrapper">
            <Input
              type={showOld ? "text" : "password"}
              id="oldPassword"
              placeholder="Enter Old Password..."
              className={`formscontrol ${error && !oldPassword ? "input-error" : ""
                }`}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <span
              className="eye-icon"
              onClick={() => setShowOld(!showOld)}
            >
              {showOld ? "🙈" : "👁"}
            </span>
          </div>
        </div>

        {/* New Password */}
        <div className="request-subject password-field">
          <label htmlFor="newPassword">New Password</label>
          <div className="password-wrapper">
            <Input
              type={showNew ? "text" : "password"}
              id="newPassword"
              placeholder="Enter New Password..."
              className={`formscontrol ${error && !newPassword ? "input-error" : ""
                }`}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setMatchError("");
              }}
            />
            <span
              className="eye-icon"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? "🙈" : "👁"}
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="request-subject password-field">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-wrapper">
            <Input
              type={showConfirm ? "text" : "password"}
              id="confirmPassword"
              placeholder="Confirm Password..."
              className={`formscontrol ${error && !confirmPassword ? "input-error" : ""
                }`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMatchError("");
              }}
            />
            <span
              className="eye-icon"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? "🙈" : "👁"}
            </span>
          </div>
        </div>

        {/* Match Error */}
        {matchError && (
          <p className="error-text">{matchError}</p>
        )}

        {/* Info Section */}
        <div className="infocontain">
          <div className="info-header">
            <div className="info-icon1">i</div>
            <span className="info-title">
              Your password must contain:
            </span>
          </div>

          <ul className="rules-list">
            <li>At least 12 characters</li>
            <li>At least 3 of the following:</li>
            <li>Lowercase letters (a-z)</li>
            <li>Uppercase letters (A-Z)</li>
            <li>Numbers (0-9)</li>
            <li>Special characters (e.g. !@#$%^&*)</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="modal-buttons">
          <button className="cancel-btn" onClick={handleClose}>
            Cancel
          </button>

          <button className="next-btn" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;