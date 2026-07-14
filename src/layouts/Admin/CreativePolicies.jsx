import React, { useState } from "react";


const CreativePolicies = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-request-support" onClick={onClose} >
      <div className="modal-request" onClick={e => e.stopPropagation()}>
        <h4>Creatives Policies</h4>
        <hr className="ci_line" />

        <p className="description">
          Use the links below to find detailed information on each review partner's creative policies
        </p>

        {/* <button className="creative-btn"
          onClick={() =>
            window.open(
              "https://learn.microsoft.com/en-us/xandr/invest/general-creative-guidelines-to-pass-auditing",
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          Xandr Creative Policies
        </button> */}
        <br />

        {/* <button className="creative-btn"
          onClick={() =>
            window.open(
              "https://support.google.com/authorizedbuyers/answer/1325008?hl=en",
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          Google Advertising Policies
        </button> */}
        <br />

        <button className="creative-btn"
          // onClick={() =>
          //   window.open(
          //     "https://legal.basis.com/centro-creative-policy.html",
          //     "_blank",
          //     "noopener,noreferrer"
          //   )
          // }
        >
          Internal Creative Policy
        </button>
        <br />
        <div className="modal-buttons">
          <button className="next-btn" onClick={onClose}>
            Ok
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreativePolicies;