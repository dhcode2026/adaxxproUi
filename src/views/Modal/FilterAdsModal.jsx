import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter, Button, FormGroup, Input, Label, Form, Row, Col, Spinner } from "reactstrap";
import { filterCreative } from "../api/Api";

const FilterAdsModal = ({ isOpen, toggle, callback, brandId }) => {
  const [filters, setFilters] = useState({
    status: "all_but_archived",
    reviewStatus: "all",
    type: "all",
    minDate: "",
    maxDate: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters({
        status: "all_but_archived",
        reviewStatus: "all",
        type: "all",
        minDate: "",
        maxDate: "",
      });
      setLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Build the params object exactly as the API expects
  const buildApiParams = () => {
    const params = {};

    // Always include brandId if available (as a number)
    if (brandId) {
      params.brandId = Number(brandId);
    }

    // Map type (only send if not "all")
    if (filters.type && filters.type !== "all") {
      params.type = filters.type; // "image", "audio", etc.
    }

    // Map status to numeric codes expected by the API
    // "all_but_archived" means we don't send status at all
    if (filters.status === "online") {
      params.status = 1;
    } else if (filters.status === "offline") {
      params.status = 2; // matches your example URL
    } else if (filters.status === "archived") {
      params.status = 3;
    }
    // For "all_but_archived", no status param is sent

    // Format dates as full ISO 8601 strings (with time)
    if (filters.minDate) {
      // Start of day in UTC (or you can use a specific time if needed)
      params.startDate = `${filters.minDate}T00:00:00.000Z`;
    }
    if (filters.maxDate) {
      // End of day in UTC
      params.endDate = `${filters.maxDate}T23:59:59.999Z`;
    }

    // Note: reviewStatus is not included because the example API doesn't use it.
    // If your backend supports it, you would add it here.

    return params;
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params = buildApiParams();
      console.log("Sending API params:", params); // For debugging
      const response = await filterCreative(params);
      if (typeof callback === "function") {
        callback(response.data); // Pass the filtered data back to the parent
      }
      toggle(); // Close modal after success
    } catch (error) {
      console.error("Error filtering creatives:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} backdrop="static" centered size="md" id="fillteradd">
      <div className="modal-header">
        <h5 className="modal-title">Filter Ads</h5>
        <Button close onClick={toggle} />
      </div>
      <ModalBody>
        <Form>
          {/* Status filter */}
          <FormGroup>
            <Row>
              <Col sm="6">
                <Label>Status:</Label>
              </Col>
              <Col sm="6">
                <Input
                  type="select"
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                  className="formscontrol"
                  disabled={loading}
                >
                  <option value="all">All</option>
                  <option value="all_but_archived">All but archived</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="archived">Archived</option>
                </Input>
              </Col>
            </Row>
          </FormGroup>

          {/* Review Status (UI only, not used in API call) */}
          <FormGroup>
            <Row>
              <Col sm="6">
                <Label>Review Status:</Label>
              </Col>
              <Col sm="6">
                <Input
                  type="select"
                  name="reviewStatus"
                  value={filters.reviewStatus}
                  onChange={handleChange}
                  className="formscontrol"
                  disabled={loading}
                >
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </Input>
              </Col>
            </Row>
          </FormGroup>

          {/* Type filter */}
          <FormGroup>
            <Row>
              <Col sm="6">
                <Label>Type:</Label>
              </Col>
              <Col sm="6">
                <Input
                  type="select"
                  name="type"
                  value={filters.type}
                  onChange={handleChange}
                  className="formscontrol"
                  disabled={loading}
                >
                  <option value="all">All</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="native">Native</option>
                </Input>
              </Col>
            </Row>
          </FormGroup>

          {/* Date filters */}
          <FormGroup>
            <Row>
              <Col sm="6">
                <Label>Minimum Created Date:</Label>
              </Col>
              <Col sm="6">
                <Input
                  type="date"
                  name="minDate"
                  value={filters.minDate}
                  onChange={handleChange}
                  className="formscontrol"
                  disabled={loading}
                />
              </Col>
            </Row>
          </FormGroup>
          <FormGroup>
            <Row>
              <Col sm="6">
                <Label>Maximum Created Date:</Label>
              </Col>
              <Col sm="6">
                <Input
                  type="date"
                  name="maxDate"
                  value={filters.maxDate}
                  onChange={handleChange}
                  className="formscontrol"
                  disabled={loading}
                />
              </Col>
            </Row>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button className="cancels" onClick={toggle} disabled={loading}>
          Cancel
        </Button>
        <Button className="savebuttons" color="success" onClick={applyFilters} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Apply"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FilterAdsModal;