import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
} from "reactstrap";

const COLUMN_GROUPS = {
  Auctions: [
    "Imps. Won",
  ],
 
    "Budget": [
    "Actual Margin %",
    "Pacing Mode",
  ],
    "Clicks": [
    "Clicks",
  ],

    "Conversions": [
    "Total Conversions",
  ],
     "Dates": [
    "Start Date",
     "End Date",
  ],

  "Extras": [
    "Group ID",
    "Brand",
    "Days Remaining",
  ],
};

const DEFAULT_COLUMNS = Object.values(COLUMN_GROUPS).flat();

const PacingCustomizationModal = ({
  isOpen,
  toggle,
  selectedColumns,
  setSelectedColumns,
}) => {
  const [activeCategory, setActiveCategory] = useState("Auctions");
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    setColumns(
      Array.isArray(selectedColumns) && selectedColumns.length
        ? selectedColumns
        : DEFAULT_COLUMNS
    );
  }, [isOpen]);

  const handleCheckbox = (item) => {
    setColumns((prev) =>
      prev.includes(item)
        ? prev.filter((c) => c !== item)
        : [...prev, item]
    );
  };

  const handleSelectAll = (group) => {
    const groupItems = COLUMN_GROUPS[group];
    const allSelected = groupItems.every((i) => columns.includes(i));

    setColumns((prev) =>
      allSelected
        ? prev.filter((c) => !groupItems.includes(c))
        : [...new Set([...prev, ...groupItems])]
    );
  };

  const handleApply = () => {
    setSelectedColumns(columns);
    toggle();
  };
  const isAllSelected = (group) => {
  const groupItems = COLUMN_GROUPS[group];
  return groupItems.every((item) => columns.includes(item));
};

  const handleReset = () => {
    setColumns(DEFAULT_COLUMNS);
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      size="lg"
      className="custom-modal"
      backdrop="static"
      keyboard={false}
      id="customzingmodal"
    >
      <ModalHeader toggle={toggle}>Customize Columns</ModalHeader>

      <ModalBody className="p-0">
        <Row className="h-100">
          <Col sm="4" className="border-end p-4">
            {Object.keys(COLUMN_GROUPS).map((group) => (
              <div
                key={group}
                className={`sidebar-item ${
                  activeCategory === group ? "active" : ""
                }`}
                onClick={() => setActiveCategory(group)}
                style={{ cursor: "pointer", marginBottom: "10px" }}
              >
                {group}
              </div>
            ))}
          </Col>

   
          <Col sm="8" className="p-4">
           <div className="d-flex justify-content-between align-items-center mb-3">
  <h6 className="fw-bold mb-0">{activeCategory}</h6>

  <span
    className="text-primary"
    style={{ cursor: "pointer" }}
    onClick={() => handleSelectAll(activeCategory)}
    id="selectall"
  >
    {isAllSelected(activeCategory) ? "Deselect All" : "Select All"}
  </span>
</div>


            {COLUMN_GROUPS[activeCategory].map((item, index) => (
              <FormGroup check className="mb-2" key={index}>
                <Input
                  id={`${activeCategory}-${index}`}
                  type="checkbox"
                  checked={columns.includes(item)}
                  onChange={() => handleCheckbox(item)}
                />
                <Label
                  check
                  htmlFor={`${activeCategory}-${index}`}
                  className="ms-2 customslabel"
                >
                  {item}
                </Label>
              </FormGroup>
            ))}
          </Col>
        </Row>
      </ModalBody>

      <ModalFooter className="d-flex justify-content-between">
        <Button className="restdefault" color="light" onClick={handleReset}>
          Reset to defaults
        </Button>

        <div>
          <Button className="me-2 cancels" color="secondary" onClick={toggle} >
            Cancel
          </Button>
          <Button className="savebuttons" color="success" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default PacingCustomizationModal;
