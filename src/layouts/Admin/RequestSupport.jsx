import React, { useState } from "react";
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
  Tooltip
} from "reactstrap";

const RequestModal = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState("");
  const [step, setStep] = useState(1);
  const [showWarning, setShowWarning] = useState(false);
  const [subject, setSubject] = useState("");
  const [subjectError, setSubjectError] = useState(false);
  const [description, setDescription] = useState("");
  const handleNext = () => {
    if (!selectedOption) {
      setShowWarning(true);
      return;
    }

    setStep(2);
  };

  const handleSubmit = () => {
    if (!subject.trim()) {
      setSubjectError(true);
      return;
    }
    setSubjectError(false);
  };

  if (!isOpen) return null;

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };


  const resetState = () => {
    setStep(1);
    setSelectedOption("");
    setSubject("");
    setSubjectError(false);
    setShowWarning(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (

    <div className="modal-request-support" onClick={handleClose} >
      <div className="modal-request" onClick={e => e.stopPropagation()}>
        {step === 1 && (
          <>
            <h4>Create Support Ticket</h4>
            <hr className="ci_line" />
            <div className="ticket-options">
              <label>
                <Input
                  type="radio"
                  name="ticket"
                  value="account"
                  checked={selectedOption === "account"}
                  onChange={handleOptionChange}
                  className="request-radio"

                />
                <div>
                  <strong>Account Related</strong>
                  <p>e.g. Adding funds, credit card issues, refunds, email/password change, etc.</p>
                </div>
              </label>

              <label>
                <Input
                  type="radio"
                  name="ticket"
                  value="adQuality"
                  checked={selectedOption === "adQuality"}
                  onChange={handleOptionChange}

                />
                <div>
                  <strong>Ad Quality</strong>
                  <p>e.g. Campaign/ad approvals, ad quality questions, campaign issues, etc.</p>
                </div>
              </label>

              <label>
                <Input
                  type="radio"
                  name="ticket"
                  value="techSupport"
                  checked={selectedOption === "techSupport"}
                  onChange={handleOptionChange}


                />
                <div>
                  <strong>Tech Support</strong>
                  <p>e.g. Campaign settings, inventory and 3rd party data, live campaign issues.</p>
                </div>
              </label>

              <label>
                <Input
                  type="radio"
                  name="ticket"
                  value="feedback"
                  checked={selectedOption === "feedback"}
                  onChange={handleOptionChange}

                />
                <div>
                  <strong>Feedback</strong>
                  <p>e.g. New feature request, UI issues, report a bug.</p>
                </div>
              </label>

              <label>
                <Input
                  type="radio"
                  name="ticket"
                  value="api"
                  checked={selectedOption === "api"}
                  onChange={handleOptionChange}

                />
                <div>
                  <strong>API</strong>
                  <p>e.g. API inquiries, registration.</p>
                </div>
              </label>

              <label>
                <Input
                  type="radio"
                  name="ticket"
                  value="generalSupport"
                  checked={selectedOption === "generalSupport"}
                  onChange={handleOptionChange}

                />
                <div>
                  <strong>General Support</strong>
                  <p>e.g. All other inquiries.</p>
                </div>
              </label>

            </div>

            <div className="email-field">
              <label htmlFor="reply-email">Reply To Email (Optional):</label>
              <Input
                type="text"
                id="reply-email"
                name="reply-email"
                className="formscontrol"
              />
            </div>

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={handleClose}>
                Cancel
              </button>
              <button className="next-btn" onClick={handleNext}>
                Next
              </button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h4>Create Support Ticket</h4>
            <hr className="ci_line" />
            <div className="request-category">
            <div className="request-subject">
              <label htmlFor="reply-email">Subject</label>
              <Input
                type="text"
                id="brandName"
                name="brandName"
                className={`formscontrol ${subjectError ? "input-error" : ""}`}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSubjectError(false);
                }}
              />
            </div>
            <div className="request-description">
              <label htmlFor="description">Description</label>
              <Input
                type="textarea"
                id="description"
                name="description"
                className="formscontrol"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                rows={4}
              />
            </div><br />
            <div className="email-fields">
              <label htmlFor="reply-email">Ad ID</label>
              <Input
                type="text"
                id="brandName"
                name="brandName"
                className="formscontrol"
              />
            </div>
            <div className="email-fields">
              <label htmlFor="reply-email">Campaign ID</label>
              <Input
                type="text"
                id="brandName"
                name="brandName"
                className="formscontrol"
              />
            </div>
            <div className="modal-buttons" id="support-btns">
              <button
                className="cancel-btn"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button className="next-btn" onClick={handleSubmit}>
                Submit
              </button>
            </div>
            </div>
          </>
        )}
        {showWarning && (
          <div className="warning-overlay">
            <div className="warning-modal">

              <div className="warning-header">
                <span className="warning-icon">⚠️</span>
                <h5>Warning</h5>
              </div>

              <p className="warning-message">
                Please select a category
              </p>


              <div className="warning-footer">
                <button
                  className="ok-btn"
                  onClick={() => setShowWarning(false)}
                >
                  OK
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestModal;