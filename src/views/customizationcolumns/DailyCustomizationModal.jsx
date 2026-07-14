import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGripVertical, faPlus, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

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

const normalizeSelection = ({
  selectedColumns,
  defaultColumns,
  fixedColumns,
  availableColumns,
}) => {
  const fixedIds = uniqueColumns(fixedColumns);
  const availableIds = uniqueColumns([
    ...(Array.isArray(availableColumns) ? availableColumns : []),
    ...(Array.isArray(defaultColumns) ? defaultColumns : []),
    ...(Array.isArray(selectedColumns) ? selectedColumns : []),
    ...fixedIds,
  ]);

  const fallbackBase = Array.isArray(defaultColumns) && defaultColumns.length
    ? defaultColumns
    : availableIds;

  const base = uniqueColumns(
    (Array.isArray(selectedColumns) && selectedColumns.length ? selectedColumns : fallbackBase)
      .filter((column) => {
        const id = toColumnId(column);
        return !id || availableIds.includes(id) || fixedIds.includes(id);
      }),
  );

  const withoutFixed = base.filter((columnId) => !fixedIds.includes(columnId));
  return uniqueColumns([...withoutFixed, ...fixedIds]);
};

export default function DailyCustomizationModal({
  isOpen,
  toggle,
  selectedColumns,
  setSelectedColumns,
  onColumnChange,
  fixedColumns = ["Hourly Reporting"],
  defaultColumns = [],
  availableColumns = [],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localColumns, setLocalColumns] = useState([]);

  const updateColumns = setSelectedColumns || onColumnChange;

  const allColumns = useMemo(() => {
    return uniqueColumns([
      ...availableColumns,
      ...defaultColumns,
      ...(Array.isArray(selectedColumns) ? selectedColumns : []),
      ...fixedColumns,
    ]);
  }, [availableColumns, defaultColumns, selectedColumns, fixedColumns]);

  useEffect(() => {
    if (!isOpen) return;

    setLocalColumns(
      normalizeSelection({
        selectedColumns,
        defaultColumns,
        fixedColumns,
        availableColumns,
      }),
    );
    setSearchQuery("");
  }, [isOpen, selectedColumns, defaultColumns, fixedColumns, availableColumns]);

  if (!isOpen) return null;

  const fixedIds = uniqueColumns(fixedColumns);
  const hiddenFields = allColumns.filter(
    (columnId) =>
      !localColumns.includes(columnId) &&
      toColumnLabel(columnId).toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const visibleFields = localColumns.filter((columnId) =>
    toColumnLabel(columnId).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleVisibility = (columnId) => {
    if (fixedIds.includes(columnId)) return;

    setLocalColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId],
    );
  };

  const handleDragStart = (event, index) => {
    event.dataTransfer.setData("index", String(index));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDropOnVisible = (event, targetIndex) => {
    event.preventDefault();
    const sourceIndex = Number(event.dataTransfer.getData("index"));

    if (Number.isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    setLocalColumns((prev) => {
      const next = [...prev];
      const [movedItem] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedItem);
      return next;
    });
  };

  const handleSave = () => {
    const finalColumns = normalizeSelection({
      selectedColumns: localColumns,
      defaultColumns,
      fixedColumns,
      availableColumns,
    });

    if (updateColumns) {
      updateColumns(finalColumns);
    }

    if (toggle) {
      toggle();
    }
  };

  return ReactDOM.createPortal(
    <div className="ccm-overlay">
      <div className="ccm-modal">
        <div className="ccm-header">
          <div>
            <h2>Customize Table Columns</h2>
            <p>Search, drag to reorder, or use + / x to adjust your view.</p>
          </div>
          <button className="ccm-close-btn" onClick={toggle}>
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
            <div className="ccm-list-container">
              {hiddenFields.map((columnId) => (
                <div key={columnId} className="ccm-list-item">
                  <div className="ccm-item-left">
                    <FontAwesomeIcon icon={faGripVertical} className="ccm-drag-handle" />
                    <span>{toColumnLabel(columnId)}</span>
                  </div>
                  <button
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
                  draggable={!fixedIds.includes(columnId)}
                  onDragStart={(event) => handleDragStart(event, index)}
                  onDrop={(event) => handleDropOnVisible(event, index)}
                  onDragOver={handleDragOver}
                >
                  <div className="ccm-item-left">
                    <FontAwesomeIcon icon={faGripVertical} className="ccm-drag-handle" />
                    <span>{toColumnLabel(columnId)}</span>
                  </div>
                  <button
                    className="ccm-item-action remove"
                    onClick={() => handleToggleVisibility(columnId)}
                    disabled={fixedIds.includes(columnId)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ccm-footer">
          <button className="ccm-cancel-btn" onClick={toggle}>
            Cancel
          </button>
          <button className="ccm-save-btn" onClick={handleSave}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
