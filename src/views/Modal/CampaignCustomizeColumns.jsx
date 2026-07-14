import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faPlus,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const toColumnId = (column) => {
  if (typeof column === "string") return column;
  if (column && typeof column === "object") {
    return column.id || column.label || column.name || "";
  }
  return "";
};

const toColumnLabel = (column) => {
  if (typeof column === "string") return column;
  if (column && typeof column === "object") {
    return column.label || column.name || column.id || "";
  }
  return "";
};

const uniqueColumns = (columns) => {
  const seen = new Set();
  const next = [];

  columns.forEach((column) => {
    const id = toColumnId(column);
    if (!id || seen.has(id)) return;
    seen.add(id);
    next.push(id);
  });

  return next;
};

const columnsSignature = (columns) => uniqueColumns(columns).join("|");

const CampaignCustomizeColumns = ({
  isOpen,
  toggle,
  selectedColumns,
  setSelectedColumns,
}) => {
  const defaultColumns = [
    "Unlink",
    "Campaign ID",
    "Linked Campaign Name",
    "Flight Dates",
   
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [localColumns, setLocalColumns] = useState([]);

  const selectedColumnsSig = columnsSignature(selectedColumns);
  const defaultColumnsSig = columnsSignature(defaultColumns);

  const allColumns = useMemo(
    () =>
      uniqueColumns([
        ...defaultColumns,
        ...(Array.isArray(selectedColumns) ? selectedColumns : []),
      ]),
    [selectedColumnsSig, defaultColumnsSig]
  );

  useEffect(() => {
    if (!isOpen) return;

    const nextColumns =
      Array.isArray(selectedColumns) && selectedColumns.length
        ? uniqueColumns(selectedColumns)
        : uniqueColumns(defaultColumns);

    setLocalColumns((prev) =>
      columnsSignature(prev) === columnsSignature(nextColumns) ? prev : nextColumns
    );
    setSearchQuery("");
  }, [isOpen, selectedColumnsSig, defaultColumnsSig]);

  if (!isOpen) return null;

  const hiddenFields = allColumns.filter(
    (columnId) =>
      !localColumns.includes(columnId) &&
      toColumnLabel(columnId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleFields = localColumns.filter((columnId) =>
    toColumnLabel(columnId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleVisibility = (columnId) => {
    setLocalColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleDragStart = (event, index, type) => {
    const columnId = type === "visible" ? visibleFields[index] : hiddenFields[index];
    event.dataTransfer.setData("index", String(index));
    event.dataTransfer.setData("type", type);
    event.dataTransfer.setData("columnId", columnId || "");
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDropOnVisible = (event, targetIndex) => {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("index"));
    const sourceType = event.dataTransfer.getData("type");
    const sourceColumnId = event.dataTransfer.getData("columnId");

    if (sourceType === "visible") {
      if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return;

      setLocalColumns((prev) => {
        const next = [...prev];
        const [movedItem] = next.splice(sourceIndex, 1);
        next.splice(targetIndex, 0, movedItem);
        return next;
      });
      return;
    }

    if (sourceType === "hidden" && sourceColumnId) {
      setLocalColumns((prev) => {
        if (prev.includes(sourceColumnId)) return prev;
        const next = [...prev];
        next.splice(targetIndex, 0, sourceColumnId);
        return next;
      });
    }
  };

  const handleDropOnHidden = (event) => {
    event.preventDefault();
    const sourceType = event.dataTransfer.getData("type");
    const sourceIndex = Number(event.dataTransfer.getData("index"));

    if (sourceType !== "visible" || Number.isNaN(sourceIndex)) return;

    setLocalColumns((prev) => {
      const next = [...prev];
      next.splice(sourceIndex, 1);
      return next;
    });
  };

  const handleSave = () => {
    const finalColumns = uniqueColumns(localColumns);

    if (setSelectedColumns) {
      setSelectedColumns(finalColumns);
    }

    toggle();
  };

  const handleReset = () => {
    setLocalColumns(uniqueColumns(defaultColumns));
  };

  return ReactDOM.createPortal(
    <div className="ccm-overlay" onClick={toggle}>
      <div className="ccm-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ccm-header">
          <div>
            <h2>Customize Columns</h2>
            <p>Search, drag to reorder, or use + / x to adjust your view.</p>
          </div>
          <button type="button" className="ccm-close-btn" onClick={toggle}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="ccm-search-bar">
          <FontAwesomeIcon icon={faSearch} className="ccm-search-icon" />
          <input
            type="text"
            placeholder="Search columns..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="ccm-body">
          <div className="ccm-column">
            <div className="ccm-column-header">
              HIDDEN FIELDS ({hiddenFields.length})
            </div>
            <div
              className="ccm-list-container"
              onDragOver={handleDragOver}
              onDrop={handleDropOnHidden}
            >
              {hiddenFields.map((columnId, index) => (
                <div
                  key={columnId}
                  className="ccm-list-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, index, "hidden")}
                  onDragOver={handleDragOver}
                >
                  <div className="ccm-item-left">
                    <FontAwesomeIcon icon={faGripVertical} className="ccm-drag-handle" />
                    <span>{toColumnLabel(columnId)}</span>
                  </div>
                  <button
                    type="button"
                    className="ccm-item-action add"
                    onClick={() => handleToggleVisibility(columnId)}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="ccm-column">
            <div className="ccm-column-header visible-header">
              VISIBLE FIELDS ({visibleFields.length})
            </div>
            <div className="ccm-list-container" onDragOver={handleDragOver}>
              {visibleFields.map((columnId, index) => (
                <div
                  key={columnId}
                  className="ccm-list-item"
                  draggable
                  onDragStart={(event) => handleDragStart(event, index, "visible")}
                  onDrop={(event) => handleDropOnVisible(event, index)}
                  onDragOver={handleDragOver}
                >
                  <div className="ccm-item-left">
                    <FontAwesomeIcon icon={faGripVertical} className="ccm-drag-handle" />
                    <span>{toColumnLabel(columnId)}</span>
                  </div>
                  <button
                    type="button"
                    className="ccm-item-action remove"
                    onClick={() => handleToggleVisibility(columnId)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ccm-footer">
          <button type="button" className="ccm-cancel-btn" onClick={toggle}>
              Cancel
            </button>
          <button type="button" className="ccm-save-btn" onClick={handleReset}>
            Reset Defaults
          </button>
          <div className="ccm-footer-actions">
            
            <button type="button" className="ccm-save-btn" onClick={handleSave}>
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CampaignCustomizeColumns;
