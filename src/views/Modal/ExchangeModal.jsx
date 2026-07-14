import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col
} from "reactstrap";

const ExchangeModal = ({ isOpen, toggle, onSave, saving, existingExchanges = [], nextExchangeId }) => {
  const [name, setName] = useState("");
  const [exchangeEKey, setExchangeEKey] = useState("");
  const [exchangeIKey, setExchangeIKey] = useState("");
  const [supplyChain, setSupplyChain] = useState(false);
  const [multiBidder, setMultiBidder] = useState(false);
  const [openRtbVersion, setOpenRtbVersion] = useState("02.5");
  const [nameError, setNameError] = useState("");
  const [eKeyError, setEKeyError] = useState("");
  const [iKeyError, setIKeyError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setExchangeEKey("");
      setExchangeIKey("");
      setSupplyChain(false);
      setMultiBidder(false);
      setOpenRtbVersion("02.5");
      setNameError("");
      setEKeyError("");
      setIKeyError("");
    }
  }, [isOpen]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);

    if (value.trim()) {
      const isDuplicate = existingExchanges.some(
        (ex) => ex.name.trim().toLowerCase() === value.trim().toLowerCase()
      );
      if (isDuplicate) {
        setNameError("Exchange Name already exists.");
      } else {
        setNameError("");
      }
    } else {
      setNameError("");
    }
  };

  const handleEKeyChange = (e) => {
    const value = e.target.value;
    setExchangeEKey(value);

    if (value.trim()) {
      const isDuplicate = existingExchanges.some(
        (ex) => ex.exchangeEKey && ex.exchangeEKey.trim().toLowerCase() === value.trim().toLowerCase()
      );
      if (isDuplicate) {
        setEKeyError("Exchange E Key already exists.");
      } else {
        setEKeyError("");
      }
    } else {
      setEKeyError("");
    }
  };

  const handleIKeyChange = (e) => {
    const value = e.target.value;
    setExchangeIKey(value);

    if (value.trim()) {
      const isDuplicate = existingExchanges.some(
        (ex) => ex.exchangeIKey && ex.exchangeIKey.trim().toLowerCase() === value.trim().toLowerCase()
      );
      if (isDuplicate) {
        setIKeyError("Exchange I Key already exists.");
      } else {
        setIKeyError("");
      }
    } else {
      setIKeyError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEKey = exchangeEKey.trim();
    const trimmedIKey = exchangeIKey.trim();
    if (!trimmedName) return;

    const isNameDuplicate = existingExchanges.some(
      (ex) => ex.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isNameDuplicate) {
      setNameError("Exchange Name already exists.");
      return;
    }

    if (trimmedEKey) {
      const isEKeyDuplicate = existingExchanges.some(
        (ex) => ex.exchangeEKey && ex.exchangeEKey.trim().toLowerCase() === trimmedEKey.toLowerCase()
      );
      if (isEKeyDuplicate) {
        setEKeyError("Exchange E Key already exists.");
        return;
      }
    }

    if (trimmedIKey) {
      const isIKeyDuplicate = existingExchanges.some(
        (ex) => ex.exchangeIKey && ex.exchangeIKey.trim().toLowerCase() === trimmedIKey.toLowerCase()
      );
      if (isIKeyDuplicate) {
        setIKeyError("Exchange I Key already exists.");
        return;
      }
    }

    onSave({
      exchangeId: nextExchangeId,
      name: trimmedName,
      exchangeEKey: trimmedEKey,
      exchangeIKey: trimmedIKey,
      supplyChain,
      multiBidder,
      openRtbVersion,
      exchangeUrl: `https://rtb.adaxxpro.com/rtb/bids/${trimmedName}`,
      postbackConversionId: "",
      postbackConversionUrl: ""
    });
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered style={{ maxWidth: "550px" }}>
      <ModalHeader 
        toggle={toggle} 
        style={{ 
          borderBottom: "1px solid #f1f5f9", 
          backgroundColor: "#f8fafc",
          padding: "16px 24px"
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <i className="fa fa-exchange text-info" style={{ fontSize: "1.2rem" }}></i>
          <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "16px" }}>Add New Exchange</span>
        </div>
      </ModalHeader>
      
      <Form onSubmit={handleSubmit}>
        <ModalBody style={{ padding: "24px" }}>
          <Row>
            <Col md="6">
              <FormGroup className="mb-3">
                <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                  Exchange Name <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter Exchange Name"
                  value={name}
                  onChange={handleNameChange}
                  required
                  autoFocus
                  invalid={!!nameError}
                  className="rounded-3 shadow-none"
                  style={{
                    fontSize: "14px",
                    padding: "10px 12px",
                    border: nameError ? "1px solid #dc3545" : "1px solid #cbd5e1"
                  }}
                />
                {nameError && (
                  <div className="text-danger mt-1" style={{ fontSize: "12px", fontWeight: 500 }}>
                    {nameError}
                  </div>
                )}
              </FormGroup>
            </Col>
            
            <Col md="6">
              <FormGroup className="mb-3">
                <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                  Exchange ID
                </Label>
                <Input
                  type="text"
                  value={nextExchangeId || "Auto-generated"}
                  readOnly
                  className="rounded-3 shadow-none bg-light text-muted"
                  style={{
                    fontSize: "14px",
                    padding: "10px 12px",
                    border: "1px solid #cbd5e1"
                  }}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md="6">
              <FormGroup className="mb-3">
                <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                  Exchange E Key
                </Label>
                <Input
                  type="text"
                  placeholder="Enter E Key"
                  value={exchangeEKey}
                  onChange={handleEKeyChange}
                  invalid={!!eKeyError}
                  className="rounded-3 shadow-none"
                  style={{
                    fontSize: "14px",
                    padding: "10px 12px",
                    border: eKeyError ? "1px solid #dc3545" : "1px solid #cbd5e1"
                  }}
                />
                {eKeyError && (
                  <div className="text-danger mt-1" style={{ fontSize: "12px", fontWeight: 500 }}>
                    {eKeyError}
                  </div>
                )}
              </FormGroup>
            </Col>
            
            <Col md="6">
              <FormGroup className="mb-3">
                <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                  Exchange I Key
                </Label>
                <Input
                  type="text"
                  placeholder="Enter I Key"
                  value={exchangeIKey}
                  onChange={handleIKeyChange}
                  invalid={!!iKeyError}
                  className="rounded-3 shadow-none"
                  style={{
                    fontSize: "14px",
                    padding: "10px 12px",
                    border: iKeyError ? "1px solid #dc3545" : "1px solid #cbd5e1"
                  }}
                />
                {iKeyError && (
                  <div className="text-danger mt-1" style={{ fontSize: "12px", fontWeight: 500 }}>
                    {iKeyError}
                  </div>
                )}
              </FormGroup>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md="12">
              <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
                OpenRTB Support Version
              </Label>
              <div className="d-flex gap-4 mt-1">
                <FormGroup check className="d-flex align-items-center gap-2 ps-0 mb-0">
                  <Input
                    type="radio"
                    name="openRtbVersion"
                    value="02.5"
                    id="openrtb-2.5"
                    checked={openRtbVersion === "02.5"}
                    onChange={(e) => setOpenRtbVersion(e.target.value)}
                    className="m-0 cursor-pointer"
                    style={{ width: "16px", height: "16px" }}
                  />
                  <Label 
                    for="openrtb-2.5" 
                    className=" mb-0 cursor-pointer"
                    style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}
                  >
                    02.5
                  </Label>
                </FormGroup>
                <FormGroup check className="d-flex align-items-center gap-2 ps-0 mb-0">
                  <Input
                    type="radio"
                    name="openRtbVersion"
                    value="02.6"
                    id="openrtb-2.6"
                    checked={openRtbVersion === "02.6"}
                    onChange={(e) => setOpenRtbVersion(e.target.value)}
                    className="m-0 cursor-pointer"
                    style={{ width: "16px", height: "16px" }}
                  />
                  <Label 
                    for="openrtb-2.6" 
                    className=" mb-0 cursor-pointer"
                    style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}
                  >
                    02.6
                  </Label>
                </FormGroup>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md="6">
              <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569", display: "block" }}>
                Supply Chain
              </Label>
              <FormGroup check className="d-flex align-items-center gap-2 ps-0 mt-1">
                <Input
                  type="checkbox"
                  id="modal-supplyChain"
                  checked={supplyChain}
                  onChange={(e) => setSupplyChain(e.target.checked)}
                  style={{ 
                    width: "18px", 
                    height: "18px", 
                    margin: 0, 
                    cursor: "pointer", 
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px"
                  }}
                />
                <Label 
                  for="modal-supplyChain" 
                  className=" mb-0 cursor-pointer"
                  style={{ fontWeight: 500, fontSize: "13px", color: "#475569" }}
                >
                  Yes
                </Label>
              </FormGroup>
            </Col>

            <Col md="6">
              <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569", display: "block" }}>
                Multi Bidder
              </Label>
              <FormGroup check className="d-flex align-items-center gap-2 ps-0 mt-1">
                <Input
                  type="checkbox"
                  id="modal-multiBidder"
                  checked={multiBidder}
                  onChange={(e) => setMultiBidder(e.target.checked)}
                  style={{ 
                    width: "18px", 
                    height: "18px", 
                    margin: 0, 
                    cursor: "pointer", 
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px"
                  }}
                />
                <Label 
                  for="modal-multiBidder" 
                  className=" mb-0 cursor-pointer"
                  style={{ fontWeight: 500, fontSize: "13px", color: "#475569" }}
                >
                  Yes
                </Label>
              </FormGroup>
            </Col>
          </Row>

          <FormGroup className="mb-3">
            <Label style={{ fontWeight: 600, fontSize: "13px", color: "#475569" }}>
              Exchange URL
            </Label>
            <Input
              type="text"
              readOnly
              value={`https://rtb.adaxxpro.com/rtb/bids/${name}`}
              className="rounded-3 shadow-none bg-light text-muted"
              style={{
                fontSize: "14px",
                padding: "10px 12px",
                border: "1px solid #cbd5e1"
              }}
            />
          </FormGroup>
        </ModalBody>

        <ModalFooter style={{ borderTop: "1px solid #f1f5f9", padding: "16px 24px" }}>
          <Button
            type="button"
            onClick={toggle}
            className="rounded-3 px-4 py-2 text-dark border-0"
            style={{
              backgroundColor: "#f1f5f9",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !name.trim() || nameError || eKeyError || iKeyError}
            className="rounded-3 px-4 py-2 text-white border-0"
            style={{
              backgroundColor: (saving || !name.trim() || nameError || eKeyError || iKeyError) ? "#cbd5e1" : "#0ea5e9",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {saving ? "Adding..." : "Add Exchange"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default ExchangeModal;
