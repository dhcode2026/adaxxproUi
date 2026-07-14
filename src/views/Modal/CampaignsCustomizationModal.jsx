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
import { isSuperAdmin } from "../../utils/roleHelper";

const COLUMN_GROUPS_BASE = {
  Basic: [
    "Name",
    "Status",
    "ID",
    "Daily Budget",

  ],
  Dates: [
    "Start Date",
    "End Date",
  ],
  KPIs: [
    "KPI Metric",
    "KPI Value",
  ],
  Auctions: [
    "Imps",
    "Win Percentage",
    "Adv. Spend eCPM",
    "Total eCPM",
    "Media eCPM",
    "Data eCPM",
  ],
  "Audio/Video": [
    "Audio/Video Starts",
    "25% Complete",
    "50% Complete",
    "75% Complete",
    "100% Complete",
    "Completion Rate",
    "Adv. Spend eCPCV",
    "Total eCPCV"
  ],
  "Budget": [
    "Default Bid",
    "Max Bid",
    "Daily Budget",
    "All Time Budget",
    "Adv. Spend",
    "Media Spend",
    "Data Spend",
    "Spend",
    // "Total Spend",
    "Platform ECPM",
    "Media ECPM",
    "Platform Spend",
    "Advertiser Spend eCPM",
  ],
  "Clicks": [
    "Clicks",
    "Adv. Spend eCPC",
    "Total eCPC",
    "CTR",
    "EPC",
  ],
  "Companion Ads": [
    "Companion Imps. Won",
    "Companion Clicks",
    "Companion CTC",
    "Companion CTC Revenue",

  ],
  "Conversions": [
    "Total Conversions",
    "CTC",
    "VTC",
    "Adv. Spend eCPA",
    "Total eCPA",
    "CTC eCPA",
    "Click CVR ",
    "View CVR ",
    "Total CVRM ",
  ],
  "Dates": [
    "Start Date",
    "End Date",
  ],
  "Extras": [
    "ID",
    "Type",
    "KPI Metric",
    "KPI Value",
  ],
  "Primary Conversions": [
    "Primary Conv.",
    "Primary CTC",
    "Primary VTC",
    "Primary Adv. Spend eCPA",
    "Primary Conv. eCPA",
    "Primary CTC eCPA",
  ],
  "Revenue": [
    "Total Revenue",
    "CTC Revenue",
    "VTC Revenue",
    "Total RPM",
    "Click RPM",
    "ROAS",
  ],
  "Viewability": [
    "Total Eligible Imps.",
    "Total Measured Imps.",
    "Total Viewable Imps.",
    "Measured Rate",
    "Viewable Rate",
    "Eligible Spend",
    "Eligible vCPM",
  ],
};

const ADMIN_ONLY_COLUMNS = {
  "Admin Only": [
    "Total Request",
    "Total Response",
    "Total Win %",
  ],
};

const DEFAULT_COLUMNS = [
  "Name",
  "Status",
  "ID",
  "Daily Budget",
  "GBO Status",
  "Start Date",
  "End Date",
  "KPI Metric",
  "KPI Value"
];

const CampaignsCustomizationModal = ({
  isOpen,
  toggle,
  selectedColumns,
  setSelectedColumns,
}) => {
  const [activeCategory, setActiveCategory] = useState("Basic");
  const [columns, setColumns] = useState([]);
  const isAdmin = isSuperAdmin();

  // Build COLUMN_GROUPS based on user role
  const COLUMN_GROUPS = {
    ...COLUMN_GROUPS_BASE,
    ...(isAdmin && ADMIN_ONLY_COLUMNS),
  };

  useEffect(() => {
    if (isOpen) {
      setColumns(
        Array.isArray(selectedColumns) && selectedColumns.length
          ? selectedColumns
          : DEFAULT_COLUMNS
      );
    }
  }, [isOpen, selectedColumns]);

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
    if (setSelectedColumns) {
      setSelectedColumns(columns);
    }
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
                className={`sidebar-item ${activeCategory === group ? "active" : ""
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
                  onChange={() => handleCheckbox(item)} />
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
export default CampaignsCustomizationModal;