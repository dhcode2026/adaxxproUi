import React from "react";

const AccountRepresent = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const storedAccountManager = (() => {
    try {
      const raw = localStorage.getItem("accountManager");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      console.error("Error parsing accountManager from localStorage", error);
      return null;
    }
  })();

  const fullName = [storedAccountManager?.firstName, storedAccountManager?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const roleLabel = storedAccountManager?.role || "Account Manager";
  const phone = storedAccountManager?.phoneNumber || "N/A";
  const email = storedAccountManager?.email || "N/A";

  return (
    <div className="modal-request-support" onClick={onClose}>
      <div className="modal-request" onClick={(e) => e.stopPropagation()}>
        <h4>Account Rep</h4>
        <hr className="ci_line" />

        <div className="account-info">
          <p>
            <strong>{fullName || "Account Manager"}</strong>
          </p>
          <p>{roleLabel}</p>
          <p>
            <strong>Phone:</strong> {phone}
          </p>
          <p>
            <strong>Email:</strong>{" "}
            {email !== "N/A" ? (
              <a href={`mailto:${email}`} className="email-link">
                {email}
              </a>
            ) : (
              <span>{email}</span>
            )}
          </p>
        </div>

        <div className="modal-buttons">
          <button className="next-btn" onClick={onClose}>
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountRepresent;