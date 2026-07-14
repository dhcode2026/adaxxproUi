import React, { useEffect, useState } from "react";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";

const Popup = ({
  isOpen,
  title = "Campaign Details",
  status,
  onConfirm,
  onCancel,
  isLoading = false,
  setpayload,
  show = true,
}) => {
  console.log(status);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [currentStatus, setCurrentStatus] = useState(status);
  const [updating, setUpdating] = useState(false);
  const [nameError, setNameError] = useState("");
  const [idError, setIdError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => setDropdownOpen((prevState) => !prevState);

  const normalizeStatus = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/_/g, " ");

  const normalizedStatus = normalizeStatus(currentStatus);
  const isCampaignStatus =
    normalizedStatus === "runnable" ||
    normalizedStatus === "hold" ||
    normalizedStatus === "offline";

  const statusLabel = isCampaignStatus
    ? normalizedStatus === "hold"
      ? "HOLD"
      : normalizedStatus === "offline"
        ? "OFF"
        : "Runnable"
    : normalizedStatus === "approved"
      ? "Approved"
      : normalizedStatus === "waiting approval" ||
          normalizedStatus === "waiting for approval"
        ? "Waiting for approval"
        : normalizedStatus === "rejected"
          ? "Rejected"
          : currentStatus || "Runnable";

  const statusClass = isCampaignStatus
    ? `status-${normalizedStatus}`
    : normalizedStatus === "approved"
      ? "status-approved"
      : normalizedStatus === "waiting approval" ||
          normalizedStatus === "waiting for approval"
        ? "status-waiting-for-approval"
        : "status-rejected";

  const handlepopupopen = (newStatus) => {
    setCurrentStatus(newStatus);
    if (normalizeStatus(newStatus) === "runnable") {
      setIdError("");
    }
  };

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const handleConfirm = () => {
    console.log("name", name);
    let isValid = true;
    const isEmpty = !name || name.trim() === "";
    console.log("isEmpty", isEmpty);

    if (show && isEmpty) {
      setNameError("Platform fee is mandatory");
      isValid = false;
    } 

    if (parseInt(name.trim()) > 100) {
      setNameError("Platform fee should be less than 100");
      isValid = false;
    }

    if (
      (normalizedStatus === "hold" || normalizedStatus === "offline") &&
      !id.trim()
    ) {
      setIdError("Comments are mandatory when status is HOLD or OFF");
      isValid = false;
    } else {
      setIdError("");
    }

    if (isValid) {
      onConfirm({ platform_fee: name, comments: id, status: currentStatus });
      setName("");
      setId("");
      setNameError("");
      setIdError("");
      onCancel();
    }
  };

  const handleCancel = () => {
    setName("");
    setId("");
    setNameError("");
    setIdError("");
    onCancel();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="popup-overlay">
      <style>{`
        .status-dropdown-item {
          color: #333333 !important;
        }
        .status-dropdown-item:hover, .status-dropdown-item:focus {
          background-color: #FBEDEF !important;
          color: #e53e3e !important;
        }
        .status-dropdown-item.active {
          background-color: #FBEDEF !important;
          color: #e53e3e !important;
          font-weight: 600;
        }
        .onoffbutton {
          white-space: nowrap !important;
          border-radius: 999px;
          border: 1px solid transparent;
          padding: 0.55rem 1rem;
          font-weight: 600;
          min-width: 132px;
        }
        .onoffbutton.status-runnable {
          background-color: #16a34a !important;
          border-color: #16a34a !important;
          color: #fff !important;
        }
        .onoffbutton.status-runnable:hover,
        .onoffbutton.status-runnable:focus,
        .onoffbutton.status-runnable:active {
          background-color: #15803d !important;
          border-color: #15803d !important;
          color: #fff !important;
        }
        .onoffbutton.status-hold {
          background-color: #f59e0b !important;
          border-color: #f59e0b !important;
          color: #fff !important;
        }
        .onoffbutton.status-offline {
          background-color: #6b7280 !important;
          border-color: #6b7280 !important;
          color: #fff !important;
        }
        .onoffbutton.status-approved,
        .onoffbutton.status-waiting-for-approval,
        .onoffbutton.status-rejected {
          background-color: #e53e3e !important;
          border-color: #e53e3e !important;
          color: #fff !important;
        }
        .onoffbutton.status-approved:hover,
        .onoffbutton.status-approved:focus,
        .onoffbutton.status-approved:active,
        .show > .onoffbutton.status-approved,
        .onoffbutton.status-waiting-for-approval:hover,
        .onoffbutton.status-waiting-for-approval:focus,
        .onoffbutton.status-waiting-for-approval:active,
        .show > .onoffbutton.status-waiting-for-approval,
        .onoffbutton.status-rejected:hover,
        .onoffbutton.status-rejected:focus,
        .onoffbutton.status-rejected:active,
        .show > .onoffbutton.status-rejected {
          background-color: #e53e3e !important;
          border-color: #e53e3e !important;
          color: #fff !important;
        }
        .cd-status-dropdown-menu {
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          padding: 4px 0 !important;
          background-color: #ffffff !important;
        }
        .cd-status-item {
          padding: 8px 16px !important;
          cursor: pointer !important;
          font-size: 13px !important;
          transition: background-color 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          color: #333333 !important;
          background: none !important;
          border: none !important;
          width: 100% !important;
          text-align: left !important;
        }
        .cd-status-item:hover {
          background-color: #f3f4f6 !important;
          color: #000000 !important;
        }
        .cd-status-item.active {
          background-color: #e5e7eb !important;
          font-weight: 600 !important;
        }
      `}</style>
      <div className="popup-container">
        <div className="popup-header">
          <h3>{title}</h3>
          <button
            className="popup-close-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        <div className="popup-body">
          {show && (
            <div className="popup-form-group">
              <label htmlFor="popup-name">Platform Fee: %</label>
              <input
                id="popup-name"
                type="text"
                placeholder="Enter platform fee"
                value={name}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  setName(value);
                  if (value !== "") {
                    setNameError("");
                  }
                }}
                disabled={isLoading}
                className={`popup-input ${nameError ? "is-invalid" : ""}`}
              />
              {nameError && (
                <div className="error-message" style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                  {nameError}
                </div>
              )}
            </div>
          )}  
       
          <div className="popup-form-group">
            <label htmlFor="popup-id">Comments:</label>
            <input
              id="popup-id"
              type="text"
              placeholder="Enter comments"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                if (e.target.value.trim()) setIdError("");
              }}
              disabled={isLoading}
              className={`popup-input ${idError ? "is-invalid" : ""}`}
            />
            {idError && (
              <div className="error-message" style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
                {idError}
              </div>
            )}
          </div>
          
          <div className="popup-form-group" style={{ marginTop: "18px", marginBottom: "25px" }}>
            <label className="campaign-status" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Status:</label>
            {status && (
              isCampaignStatus ? (
                <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                  <DropdownToggle
                    tag="button"
                    className={`onoffbutton ${statusClass}`}
                    disabled={updating}
                    style={{
                      position: "relative",
                      opacity: updating ? 0.7 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: updating ? "not-allowed" : "pointer",
                      gap: "8px",
                    }}
                  >
                    {updating ? (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                    ) : (
                      <>
                        <span>{statusLabel}</span>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{
                            transition: "transform 0.2s ease",
                            transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        >
                          <path
                            d="M6 9L12 15L18 9"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </>
                    )}
                  </DropdownToggle>
                  <DropdownMenu className="cd-status-dropdown-menu">
                    <DropdownItem
                      onClick={() => handlepopupopen("runnable")}
                      className="cd-status-item"
                      active={normalizedStatus === "runnable"}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          marginRight: "8px",
                        }}
                      ></span>
                      Runnable
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => handlepopupopen("offline")}
                      className="cd-status-item"
                      active={normalizedStatus === "offline"}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#6b7280",
                          marginRight: "8px",
                        }}
                      ></span>
                      Offline
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => handlepopupopen("hold")}
                      className="cd-status-item"
                      active={normalizedStatus === "hold"}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#f59e0b",
                          marginRight: "8px",
                        }}
                      ></span>
                      Hold
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <button
                  type="button"
                  className={`onoffbutton ${statusClass}`}
                  onClick={() => handlepopupopen(normalizedStatus || "runnable")}
                  disabled={updating}
                  style={{
                    position: "relative",
                    opacity: updating ? 0.7 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: updating ? "not-allowed" : "pointer",
                  }}
                >
                  {updating ? (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                  ) : (
                    <span>{statusLabel}</span>
                  )}
                </button>
              )
            )}
          </div>
        </div>
        <div className="popup-footer">
          <button
            className="popup-btn popup-btn-cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="popup-btn popup-btn-confirm"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
