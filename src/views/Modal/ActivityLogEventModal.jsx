import React from "react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
} from "reactstrap";
import "../editors/campcreate.css";

const ActivityLogEventModal = (props) => {
  const { isOpen, toggle, audience: row } = props;

  const getEventPayload = () => {
    if (!row) return null;

    if (row._eventData && typeof row._eventData === "object") {
      return row._eventData;
    }

    if (row._original?.event && typeof row._original.event === "object") {
      return row._original.event;
    }

    if (row.event && typeof row.event === "object") {
      return row.event;
    }

    return row;
  };

  const formatDisplayDate = (value) => {
    if (!value) return "-";
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "-";
      const dateOnlyMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}$/);
      if (dateOnlyMatch) {
        return trimmed;
      }
      const datePart = trimmed.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().split("T")[0];
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().split("T")[0];
    }

    return String(value);
  };

  const eventPayload = getEventPayload();

  return (
    <div>
      <Modal
        isOpen={isOpen}
        toggle={toggle}
        centered
        id="addonmodal"
        size="xl"
        backdrop="static"
        keyboard={false}
      >
        <div className="modal-header border-bottom">
          <h5 className="modal-title mb-0">Activity Log Event</h5>
          <Button close onClick={toggle}></Button>
        </div>

        <ModalBody className="modal-body-scroll">
          <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", overflowX: "auto" }}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12px" }}>
              {eventPayload ? JSON.stringify(eventPayload, null, 2) : "No event payload available."}
            </pre>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button className="cancels" onClick={toggle}>Close</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ActivityLogEventModal;
