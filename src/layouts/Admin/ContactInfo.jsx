import React from "react";
import { useGlobalTabs } from "../../context/TabContext";

const ContactInfo = ({ isOpen, onClose }) => {
  const { firstName, lastName } = useGlobalTabs();

  if (!isOpen) return null;

  const displayName = (firstName || lastName)
    ? `${firstName || ""} ${lastName || ""}`.trim()
    : (localStorage.getItem("email") || "User");

  const email = localStorage.getItem("email") || "Not provided";
  const address = localStorage.getItem("address") || "Not provided";
  const phoneNumber = localStorage.getItem("phoneNumber") || "Not provided";

  return (
    <div className="modal-request-support" onClick={onClose}>
      <div className="modal-request" onClick={(e) => e.stopPropagation()}>
        <h4>Contact Information</h4>
        <hr className="ci_line" />

        <div className="account-info">
          <p className="fw-bold m-0 mt-3">Name</p>
          <p>{displayName}</p>

          <p className="fw-bold m-0 mt-3">Contact Email</p>
          <p>{email}</p>

          <p className="fw-bold m-0 mt-3">Address</p>
          <p>
            {address}
          </p>

          <p className="fw-bold m-0 mt-3">Phone Number</p>
          <p>{phoneNumber}</p>
        </div>
        <hr className="ci_line" />

        <div className="modal-buttons">
          <button className="next-btn" onClick={onClose}>
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;