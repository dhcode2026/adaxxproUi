import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faPlus,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { isSuperAdmin } from "../../utils/roleHelper";

const uniqueColumns = (columns) => {
  const seen = new Set();
  const next = [];

  columns.forEach((column) => {
    if (!column || seen.has(column)) return;
    seen.add(column);
    next.push(column);
  });

  return next;
};

const columnsSignature = (columns) => uniqueColumns(columns).join("|");

const toColumnLabel = (column) => column;

const normalizeSelection = ({ selectedColumns, defaultColumns, availableColumns }) => {
  const availableIds = uniqueColumns([
    ...(Array.isArray(availableColumns) ? availableColumns : []),
    ...(Array.isArray(defaultColumns) ? defaultColumns : []),
    ...(Array.isArray(selectedColumns) ? selectedColumns : []),
  ]);

  const fallbackBase =
    Array.isArray(defaultColumns) && defaultColumns.length ? defaultColumns : availableIds;

  const base = uniqueColumns(
    (Array.isArray(selectedColumns) && selectedColumns.length ? selectedColumns : fallbackBase).filter(
      (column) => availableIds.includes(column),
    ),
  );

  return base;
};

const CustomizationModal = ({
  isOpen,
  toggle,
  selectedColumns,
  setSelectedColumns,
  defaultColumns: providedDefaultColumns,
  availableColumns: providedAvailableColumns,
}) => {
  const fallbackDefaultColumns = [
    "ID",
    "Name",
    "Status",
    "Ad Vault Path",
    "Size",
    "Ad Type",
    "Preview",
    "Destination URL",
    "Imp. URL",
    "Status",
  ];

  const adminOnlyColumns = [""];
  const isAdmin = isSuperAdmin();

  const defaultColumns = useMemo(
    () =>
      uniqueColumns(
        Array.isArray(providedDefaultColumns) && providedDefaultColumns.length
          ? providedDefaultColumns
          : fallbackDefaultColumns,
      ),
    [providedDefaultColumns],
  );

  const availableColumns = useMemo(
    () =>
      uniqueColumns([
        ...(Array.isArray(providedAvailableColumns) && providedAvailableColumns.length
          ? providedAvailableColumns
          : defaultColumns),
        ...(isAdmin ? adminOnlyColumns : []),
      ]),
    [defaultColumns, isAdmin, providedAvailableColumns],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [localColumns, setLocalColumns] = useState([]);
  const updateColumns = setSelectedColumns;

  const selectedColumnsSig = columnsSignature(selectedColumns);
  const defaultColumnsSig = columnsSignature(defaultColumns);
  const availableColumnsSig = columnsSignature(availableColumns);

  useEffect(() => {
    if (!isOpen) return;

    const nextColumns = normalizeSelection({
      selectedColumns,
      defaultColumns,
      availableColumns,
    });

    setLocalColumns((prev) =>
      columnsSignature(prev) === columnsSignature(nextColumns) ? prev : nextColumns,
    );
    setSearchQuery("");
  }, [isOpen, selectedColumnsSig, defaultColumnsSig, availableColumnsSig]);

  if (!isOpen) return null;

  const hiddenFields = availableColumns.filter(
    (column) =>
      !localColumns.includes(column) &&
      toColumnLabel(column).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const visibleFields = localColumns.filter((column) =>
    toColumnLabel(column).toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleToggleVisibility = (columnId) => {
    setLocalColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((column) => column !== columnId)
        : [...prev, columnId],
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

  const handleApply = () => {
    const finalColumns = normalizeSelection({
      selectedColumns: localColumns,
      defaultColumns,
      availableColumns,
    });

    if (updateColumns) {
      updateColumns(finalColumns);
    }
    toggle();
  };

  const handleReset = () => {
    setLocalColumns(normalizeSelection({ defaultColumns, availableColumns }));
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
          <button type="button" className="ccm-save-btn" onClick={handleApply}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CustomizationModal;
