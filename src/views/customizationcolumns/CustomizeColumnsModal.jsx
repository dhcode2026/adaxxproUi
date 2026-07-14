import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSearch, faPlus, faGripVertical } from "@fortawesome/free-solid-svg-icons";


import ReactDOM from "react-dom";

export default function CustomizeColumnsModal({ isOpen, onClose, columns, onSave }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localColumns, setLocalColumns] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLocalColumns([...columns]);
      setSearchQuery("");
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const handleToggleVisibility = (columnId) => {
    setLocalColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, isVisible: !col.isVisible } : col
      )
    );
  };

  const hiddenFields = localColumns.filter(c => !c.isVisible && c.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const visibleFields = localColumns.filter(c => c.isVisible && c.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSave = () => {
    onSave(localColumns);
    onClose();
  };

  // Simple drag and drop handlers (optional enhancement later)
  const handleDragStart = (e, index, type) => {
    e.dataTransfer.setData("index", index);
    e.dataTransfer.setData("type", type); // 'visible' or 'hidden'
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnVisible = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("index"));
    const type = e.dataTransfer.getData("type");

    if (type === 'visible' && sourceIndex !== targetIndex) {
      // Reorder visible items
      const newVisible = [...visibleFields];
      const [movedItem] = newVisible.splice(sourceIndex, 1);
      newVisible.splice(targetIndex, 0, movedItem);

      // Reconstruct localColumns to respect new visible order
      const hidden = localColumns.filter(c => !c.isVisible);
      setLocalColumns([...hidden, ...newVisible]);
    }
  };

  return ReactDOM.createPortal(
    <div className="ccm-overlay">
      <div className="ccm-modal">
        {/* Header */}
        <div className="ccm-header">
          <div>
            <h2>Customize Table Columns</h2>
            <p>Search, drag to reorder, or use +/- to adjust your view.</p>
          </div>
          <button className="ccm-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="ccm-search-bar">
          <FontAwesomeIcon icon={faSearch} className="ccm-search-icon" />
          <input
            type="text"
            placeholder="Search columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Body */}
        <div className="ccm-body">
          {/* Hidden Fields Column */}
          <div className="ccm-column">
            <div className="ccm-column-header">
              HIDDEN FIELDS ({hiddenFields.length})
            </div>
            <div className="ccm-list-container">
              {hiddenFields.map((col, index) => (
                <div
                  key={col.id}
                  className="ccm-list-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'hidden')}
                >
                  <div className="ccm-item-left">
                    <FontAwesomeIcon icon={faGripVertical} className="ccm-drag-handle" />
                    <span>{col.label}</span>
                  </div>
                  <button className="ccm-item-action add" onClick={() => handleToggleVisibility(col.id)}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Visible Fields Column */}
          <div className="ccm-column">
            <div className="ccm-column-header visible-header">
              VISIBLE FIELDS ({visibleFields.length})
            </div>
            <div className="ccm-list-container" onDragOver={handleDragOver}>
              {visibleFields.map((col, index) => (
                <div
                  key={col.id}
                  className="ccm-list-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'visible')}
                  onDrop={(e) => handleDropOnVisible(e, index)}
                  onDragOver={handleDragOver}
                >
                  <div className="ccm-item-left">
                    <FontAwesomeIcon icon={faGripVertical} className="ccm-drag-handle" />
                    <span>{col.label}</span>
                  </div>
                  <button className="ccm-item-action remove" onClick={() => handleToggleVisibility(col.id)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ccm-footer">
          <button className="ccm-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="ccm-save-btn" onClick={handleSave}>SAVE CHANGES</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
